import { beforeAll, describe, expect, it } from "vitest";
import { ConversationRepository } from "./conversation-repository";
import {
  CONVERSATION_SCHEMA_VERSION,
  ConversationUnavailableError,
  type TranscriptEntry,
} from "./types";

const ID = "123e4567-e89b-42d3-a456-426614174000";
const OTHER_ID = "223e4567-e89b-42d3-a456-426614174000";
const CREATED_AT = "2026-08-16T10:00:00.000Z";

let Vault: typeof import("@lapis-notes/api/vault").Vault;
let MemoryVaultAdapter: typeof import("@lapis-notes/api/vault").MemoryVaultAdapter;
let VaultTranscriptStore: typeof import("./vault-transcript-store").VaultTranscriptStore;

beforeAll(async () => {
  globalThis.ResizeObserver ??= class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  ({ Vault, MemoryVaultAdapter } = await import("@lapis-notes/api/vault"));
  ({ VaultTranscriptStore } = await import("./vault-transcript-store"));
});

function message(id: string, text: string): TranscriptEntry {
  return {
    schemaVersion: CONVERSATION_SCHEMA_VERSION,
    id,
    type: "message",
    role: "user",
    text,
    createdAt: CREATED_AT,
  };
}

async function createHarness() {
  const vault = new Vault(new MemoryVaultAdapter());
  await vault.load();
  const store = new VaultTranscriptStore(vault);
  const repository = new ConversationRepository(store);
  return { vault, store, repository };
}

describe("VaultTranscriptStore", () => {
  it("writes the portable three-file layout and reloads it offline", async () => {
    const { vault, repository } = await createHarness();
    const location = { scopeDir: "Projects/Atlas", conversationId: ID };
    await repository.create({
      id: ID,
      scopeDir: location.scopeDir,
      launchNotePath: "Projects/Atlas/launch.md",
      now: CREATED_AT,
    });
    await repository.appendAgentRecords(location, [
      {
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        id: "binding-1",
        type: "binding.created",
        runtime: "acp",
        agent: "codex",
        nativeSessionId: "native-1",
        createdAt: CREATED_AT,
      },
      {
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        id: "usage-1",
        type: "usage.updated",
        agentBindingId: "binding-1",
        usage: { used: 10, limit: 100 },
        createdAt: CREATED_AT,
      },
    ]);
    await repository.appendTranscript(location, [
      message("message-1", "Hello"),
    ]);

    const directory =
      "Projects/Atlas/.lapis/agents/sessions/123e4567-e89b-42d3-a456-426614174000";
    expect(vault.getFolderByPath(directory)).not.toBeNull();
    expect(vault.getFileByPath(`${directory}/metadata.yaml`)).not.toBeNull();
    expect(vault.getFileByPath(`${directory}/agents.jsonl`)).not.toBeNull();
    expect(vault.getFileByPath(`${directory}/transcript.jsonl`)).not.toBeNull();

    const reopened = await repository.read(location);
    expect(reopened.metadata).toMatchObject({
      id: ID,
      title: "Hello",
      activeAgentBindingId: "binding-1",
    });
    expect(reopened.agents).toHaveLength(2);
    expect(reopened.transcript).toEqual([
      expect.objectContaining({ id: "message-1", text: "Hello" }),
    ]);
  });

  it("tolerates only a malformed final JSONL fragment", async () => {
    const { vault, repository } = await createHarness();
    const location = { scopeDir: "", conversationId: ID };
    await repository.create({ id: ID, scopeDir: "", now: CREATED_AT });
    await repository.appendTranscript(location, [
      message("message-1", "Hello"),
    ]);
    const path = `.lapis/agents/sessions/${ID}/transcript.jsonl`;
    await vault.append(vault.getFileByPath(path)!, '{"partial"');

    const recovered = await repository.read(location);
    expect(recovered.transcript).toHaveLength(1);
    expect(recovered.warnings).toEqual([
      expect.objectContaining({ file: "transcript.jsonl", line: 2 }),
    ]);

    await vault.append(
      vault.getFileByPath(path)!,
      `\n${JSON.stringify(message("message-2", "Later"))}\n`,
    );
    await expect(repository.read(location)).rejects.toBeInstanceOf(
      ConversationUnavailableError,
    );
  });

  it("keeps a corrupt conversation isolated from other scoped history", async () => {
    const { vault, repository } = await createHarness();
    const first = { scopeDir: "Projects", conversationId: ID };
    const second = { scopeDir: "Projects", conversationId: OTHER_ID };
    await repository.create({ id: ID, scopeDir: "Projects", now: CREATED_AT });
    await repository.create({
      id: OTHER_ID,
      scopeDir: "Projects",
      now: CREATED_AT,
    });
    const metadata = vault.getFileByPath(
      `Projects/.lapis/agents/sessions/${ID}/metadata.yaml`,
    )!;
    await vault.modify(
      metadata,
      `schemaVersion: 3\nid: ${ID}\ncreatedAt: ${CREATED_AT}\nupdatedAt: ${CREATED_AT}\nstatus: active\n`,
    );

    await expect(repository.read(first)).rejects.toThrow(/unsupported/u);
    const listed = await repository.list("Projects");
    expect(listed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          location: first,
          unavailableReason: expect.any(String),
        }),
        expect.objectContaining({
          location: second,
          metadata: expect.objectContaining({ id: OTHER_ID }),
        }),
      ]),
    );
  });

  it("rejects a committed JSONL line with an invalid domain shape", async () => {
    const { vault, repository } = await createHarness();
    const location = { scopeDir: "", conversationId: ID };
    await repository.create({ id: ID, scopeDir: "", now: CREATED_AT });
    const path = `.lapis/agents/sessions/${ID}/transcript.jsonl`;
    await vault.append(
      vault.getFileByPath(path)!,
      `${JSON.stringify({
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        id: "invalid-message",
        type: "message",
        role: "user",
        createdAt: CREATED_AT,
      })}\n`,
    );

    await expect(repository.read(location)).rejects.toThrow(/invalid record/u);
  });

  it("archives metadata and deletes source only after vault trash succeeds", async () => {
    const { vault, repository } = await createHarness();
    const location = { scopeDir: "Projects", conversationId: ID };
    await repository.create({ id: ID, scopeDir: "Projects", now: CREATED_AT });
    expect((await repository.archive(location)).metadata.status).toBe(
      "archived",
    );
    await repository.delete(location);
    expect(
      vault.getFolderByPath(`Projects/.lapis/agents/sessions/${ID}`),
    ).toBeNull();
  });

  it("discovers all scoped sources without ancestor resolution", async () => {
    const { repository } = await createHarness();
    await repository.create({ id: ID, scopeDir: "Projects/Atlas", now: CREATED_AT });
    await repository.create({ id: ID, scopeDir: "Archive/Atlas", now: CREATED_AT });

    await expect(repository.listAll()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          location: { scopeDir: "Projects/Atlas", conversationId: ID },
        }),
        expect.objectContaining({
          location: { scopeDir: "Archive/Atlas", conversationId: ID },
        }),
      ]),
    );
  });
});
