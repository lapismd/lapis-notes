import { MemoryVaultAdapter, Vault } from "@lapis-notes/api/vault";
import { describe, expect, it } from "vitest";
import {
  MemoryRecordConflictError,
  VaultMemoryRecordStore,
  recordPath,
} from "./memory-record-store";
import { sha256Text } from "./hashes";
import type { DurableMemoryRecord } from "./types";

const evidence = {
  conversationId: "123e4567-e89b-42d3-a456-426614174000",
  entryId: "message-1",
  entryHash: "a".repeat(64),
  observedAt: "2026-08-20T09:00:00.000Z",
  scopeDirAtObservation: "Projects/Atlas",
};

function record(
  patch: Partial<DurableMemoryRecord> = {},
): DurableMemoryRecord {
  return {
    schemaVersion: 1,
    id: "memory-atlas-headings",
    revision: 1,
    kind: "preference",
    scope: { kind: "project", projectDir: "Projects/Atlas" },
    status: "active",
    supersessionKey: "writing.headings",
    importance: 4,
    triggers: ["writing", "headings"],
    summary: "Use compact headings in Atlas notes.",
    evidence: [evidence],
    createdBy: "deterministic-promotion",
    createdAt: "2026-08-20T09:00:00.000Z",
    updatedAt: "2026-08-20T09:00:00.000Z",
    ...patch,
  };
}

describe("VaultMemoryRecordStore", () => {
  it("writes human-readable current records and immutable revision preimages", async () => {
    const vault = new Vault(new MemoryVaultAdapter());
    const store = new VaultMemoryRecordStore(vault);
    const first = await store.write(record());
    const secondRecord = record({
      revision: 2,
      summary: "Use compact sentence-case headings in Atlas notes.",
      previousRevisionHash: first.hash,
      updatedAt: "2026-08-27T09:00:00.000Z",
    });

    const second = await store.write(secondRecord, {
      expectedCurrentHash: first.hash,
    });

    const currentPath = recordPath(secondRecord.scope, secondRecord.id);
    const current = vault.getFileByPath(currentPath);
    const revision = vault.getFileByPath(
      "Projects/Atlas/.lapis/agents/memory/revisions/memory-atlas-headings/1.md",
    );
    expect(current && (await vault.read(current))).toContain(
      "Use compact sentence-case headings",
    );
    expect(revision && (await vault.read(revision))).toContain(
      "Use compact headings in Atlas notes.",
    );
    await expect(
      store.listHistory(secondRecord.id, secondRecord.scope),
    ).resolves.toMatchObject([{ revision: 1 }]);
    await expect(store.find(secondRecord.id)).resolves.toMatchObject([
      { record: { revision: 2 }, hash: second.hash },
    ]);
  });

  it("never overwrites an owner edit made after the expected preimage", async () => {
    const vault = new Vault(new MemoryVaultAdapter());
    const store = new VaultMemoryRecordStore(vault);
    const first = await store.write(record());
    const file = vault.getFileByPath(first.path)!;
    await vault.modify(file, `${await vault.read(file)}\nOwner edit.\n`);

    await expect(
      store.write(
        record({
          revision: 2,
          summary: "Consolidator replacement",
          previousRevisionHash: first.hash,
          updatedAt: "2026-08-27T09:00:00.000Z",
        }),
        { expectedCurrentHash: first.hash },
      ),
    ).rejects.toBeInstanceOf(MemoryRecordConflictError);
    expect(await vault.read(file)).toContain("Owner edit.");
    expect(
      vault.getFileByPath(
        "Projects/Atlas/.lapis/agents/memory/revisions/memory-atlas-headings/1.md",
      ),
    ).toBeNull();
  });

  it("copies the exact owner-formatted preimage before writing a revision", async () => {
    const vault = new Vault(new MemoryVaultAdapter());
    const store = new VaultMemoryRecordStore(vault);
    const first = await store.write(record());
    const file = vault.getFileByPath(first.path)!;
    const ownerFormatted = (await vault.read(file)).replace(
      "importance: 4",
      "importance: 4 # owner formatting",
    );
    await vault.modify(file, ownerFormatted);
    const ownerHash = await sha256Text(ownerFormatted);

    await store.write(
      record({
        revision: 2,
        summary: "Use compact sentence-case headings in Atlas notes.",
        previousRevisionHash: ownerHash,
        updatedAt: "2026-08-27T09:00:00.000Z",
      }),
      { expectedCurrentHash: ownerHash },
    );

    const revision = vault.getFileByPath(
      "Projects/Atlas/.lapis/agents/memory/revisions/memory-atlas-headings/1.md",
    )!;
    expect(await vault.read(revision)).toBe(ownerFormatted);
  });

  it("rejects cross-vault and hidden project paths from editable frontmatter", async () => {
    const vault = new Vault(new MemoryVaultAdapter());
    const store = new VaultMemoryRecordStore(vault);

    await expect(
      store.write(record({ scope: { kind: "project", projectDir: "../other" } })),
    ).rejects.toThrow("scope is invalid");
    await expect(
      store.write(
        record({
          id: "memory-hidden",
          scope: { kind: "project", projectDir: "Projects/.lapis/private" },
        }),
      ),
    ).rejects.toThrow("scope is invalid");
  });

  it("requires grounded evidence for every automatic record", async () => {
    const vault = new Vault(new MemoryVaultAdapter());
    const store = new VaultMemoryRecordStore(vault);

    await expect(
      store.write(record({ evidence: [], createdBy: "consolidator" })),
    ).rejects.toThrow("requires evidence");
    await expect(
      store.write(record({ evidence: [], createdBy: "owner-ui" })),
    ).resolves.toMatchObject({ record: { createdBy: "owner-ui" } });
  });
});
