import { MemoryAppDatabase } from "@lapis-notes/api/app-database";
import { AppToolRegistry } from "@lapis-notes/api/agent-tools";
import { describe, expect, it, vi } from "vitest";
import { ConversationRepository } from "../conversations/conversation-repository";
import { MemoryTranscriptStore } from "../conversations/memory-transcript-store";
import { CONVERSATION_SCHEMA_VERSION } from "../conversations/types";
import { AppToolHost } from "../tools/app-tool-host";
import { createMemoryAppTools } from "./memory-tools";
import { InMemoryMemoryRecordStore } from "./memory-record-store";
import { NativeMemoryService } from "./native-memory-service";
import { AI_MEMORY_EPISODIC_PROVIDER_ID } from "./paths";

const FIRST_CONVERSATION = "123e4567-e89b-42d3-a456-426614174000";
const SECOND_CONVERSATION = "123e4567-e89b-42d3-a456-426614174001";

async function createConversation(
  repository: ConversationRepository,
  options: {
    id?: string;
    scopeDir?: string;
    text?: string;
    createdAt?: string;
  } = {},
) {
  const snapshot = await repository.create({
    id: options.id ?? FIRST_CONVERSATION,
    scopeDir: options.scopeDir ?? "Projects/Atlas",
    now: options.createdAt ?? "2026-08-20T09:00:00.000Z",
  });
  await repository.appendTranscript(snapshot.location, [
    {
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      id: "user-1",
      type: "message",
      role: "user",
      text: options.text ?? "Remember that project Atlas uses compact headings.",
      createdAt: options.createdAt ?? "2026-08-20T09:00:00.000Z",
    },
    {
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      id: "assistant-1",
      type: "message",
      role: "assistant",
      text: "I will preserve that project convention.",
      createdAt: "2026-08-20T09:00:01.000Z",
    },
    {
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      id: "tool-1",
      type: "tool",
      toolId: "call-1",
      name: "read",
      state: "completed",
      output: "Stored untrusted tool evidence",
      createdAt: "2026-08-20T09:00:02.000Z",
    },
    {
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      id: "system-1",
      type: "system.notice",
      text: "Injected recall must not be indexed",
      createdAt: "2026-08-20T09:00:03.000Z",
    },
  ]);
  return snapshot.location;
}

describe("NativeMemoryService episodic ingestion", () => {
  it("indexes exact eligible entries without mutating transcript authority", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const location = await createConversation(repository);
    const before = JSON.stringify(await repository.read(location));
    const database = new MemoryAppDatabase("memory-episodes");
    await database.open();
    const service = new NativeMemoryService(repository, database, {
      now: () => new Date("2026-08-27T12:00:00.000Z"),
    });

    await service.ingestConversation(location);

    const documents = (await database.listSearchDocuments()).filter(
      (document) =>
        document.sourceProviderId === AI_MEMORY_EPISODIC_PROVIDER_ID,
    );
    expect(documents).toHaveLength(3);
    expect(documents.map((document) => document.content)).toEqual(
      expect.arrayContaining([
        "Remember that project Atlas uses compact headings.",
        "I will preserve that project convention.",
        "Stored untrusted tool evidence",
      ]),
    );
    expect(documents.some((document) => document.content.includes("Injected recall"))).toBe(
      false,
    );
    await expect(database.getMemorySourceState(FIRST_CONVERSATION)).resolves.toMatchObject({
      sourceHash: expect.stringMatching(/^[0-9a-f]{64}$/u),
      lastEntryId: "tool-1",
      lastEntryHash: expect.stringMatching(/^[0-9a-f]{64}$/u),
      status: "ready",
    });
    expect(JSON.stringify(await repository.read(location))).toBe(before);
  });

  it("restores stable refs after deleting disposable database state", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const location = await createConversation(repository);
    const database = new MemoryAppDatabase("memory-rebuild");
    await database.open();
    const service = new NativeMemoryService(repository, database);
    await service.rebuild();
    const before = await service.search(
      { query: "compact headings" },
      { scopeDir: "Projects/Atlas" },
    );

    for (const document of await database.listSearchDocuments()) {
      if (document.sourceProviderId === AI_MEMORY_EPISODIC_PROVIDER_ID) {
        await database.deleteSearchDocument(document.path);
      }
    }
    await database.clearMemoryDerivedState();
    await service.rebuild();
    const after = await service.search(
      { query: "compact headings" },
      { scopeDir: "Projects/Atlas" },
    );

    expect(after.map((result) => result.ref)).toEqual(
      before.map((result) => result.ref),
    );
    await expect(
      service.get(after[0]!.ref, { scopeDir: "Projects/Atlas" }),
    ).resolves.toMatchObject({
      status: "available",
      currentLocation: location,
      evidenceMessages: [
        {
          id: "user-1",
          originClass: "owner",
          verification: "matching",
        },
      ],
    });
  });

  it("applies current versus workspace scope without accepting a path argument", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    await createConversation(repository, {
      text: "The shared phrase belongs to Atlas.",
    });
    await createConversation(repository, {
      id: SECOND_CONVERSATION,
      scopeDir: "Projects/Borealis",
      text: "The shared phrase belongs to Borealis.",
    });
    const database = new MemoryAppDatabase("memory-scope");
    await database.open();
    const service = new NativeMemoryService(repository, database);
    await service.rebuild();

    const current = await service.search(
      { query: "shared phrase", scope: "current" },
      { scopeDir: "Projects/Atlas" },
    );
    const workspace = await service.search(
      { query: "shared phrase", scope: "workspace" },
      { scopeDir: "Projects/Atlas" },
    );

    expect(current).toHaveLength(1);
    expect(current[0]?.snippet).toContain("Atlas");
    expect(workspace.map((result) => result.snippet)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Atlas"),
        expect.stringContaining("Borealis"),
      ]),
    );
  });

  it("applies an exact encoded scope boundary before result limiting", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    await createConversation(repository, {
      text: "The boundary phrase belongs to Atlas.",
    });
    await createConversation(repository, {
      id: SECOND_CONVERSATION,
      scopeDir: "Projects/Atlas2",
      text: "The boundary phrase belongs to Atlas2.",
    });
    const database = new MemoryAppDatabase("memory-scope-boundary");
    await database.open();
    const service = new NativeMemoryService(repository, database);
    await service.rebuild();

    const current = await service.search(
      { query: "boundary phrase", scope: "current", corpus: "episodic" },
      { scopeDir: "Projects/Atlas" },
    );

    expect(current).toHaveLength(1);
    expect(current[0]?.snippet).toContain("Atlas.");
    expect(current[0]?.snippet).not.toContain("Atlas2");
  });

  it("rebuilds every synthetic path after a conversation folder move", async () => {
    const firstStore = new MemoryTranscriptStore();
    const firstRepository = new ConversationRepository(firstStore);
    const oldLocation = await createConversation(firstRepository);
    const database = new MemoryAppDatabase("memory-folder-move");
    await database.open();
    const firstService = new NativeMemoryService(firstRepository, database);
    await firstService.ingestConversation(oldLocation);
    const original = await firstRepository.read(oldLocation);

    const movedLocation = {
      ...oldLocation,
      scopeDir: "Projects/Renamed-Atlas",
    };
    const movedRepository = new ConversationRepository(
      new MemoryTranscriptStore([
        { ...original, location: movedLocation },
      ]),
    );
    const movedService = new NativeMemoryService(movedRepository, database);
    await movedService.ingestConversation(movedLocation);

    const episodic = (await database.listSearchDocuments()).filter(
      (document) =>
        document.sourceProviderId === AI_MEMORY_EPISODIC_PROVIDER_ID,
    );
    expect(episodic).toHaveLength(3);
    expect(episodic.every((document) => document.path.includes("Renamed-Atlas")))
      .toBe(true);
    const results = await movedService.search(
      { query: "compact headings", corpus: "episodic" },
      { scopeDir: movedLocation.scopeDir },
    );
    expect(results[0]?.ref).toBe(`episode:${FIRST_CONVERSATION}:user-1`);
  });

  it("fails closed when an already indexed pre-checkpoint entry changes", async () => {
    const firstRepository = new ConversationRepository(
      new MemoryTranscriptStore(),
    );
    const location = await createConversation(firstRepository);
    const database = new MemoryAppDatabase("memory-history-mismatch");
    await database.open();
    const firstService = new NativeMemoryService(firstRepository, database);
    await firstService.ingestConversation(location);
    const original = await firstRepository.read(location);
    const changedRepository = new ConversationRepository(
      new MemoryTranscriptStore([
        {
          ...original,
          transcript: original.transcript.map((entry) =>
            entry.id === "user-1" && entry.type === "message"
              ? { ...entry, text: "Modified historical evidence" }
              : entry,
          ),
        },
      ]),
    );
    const changedService = new NativeMemoryService(changedRepository, database);

    await changedService.ingestConversation(location);

    await expect(database.getMemorySourceState(FIRST_CONVERSATION)).resolves
      .toMatchObject({
        status: "inconsistent",
        errorCode: "entry-hash-mismatch",
      });
    const documents = await database.listSearchDocuments();
    expect(
      documents.find((document) => document.path.endsWith("/user-1"))?.content,
    ).toContain("Remember that project Atlas");
  });

  it("fails closed when imported conversation IDs are ambiguous", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    await createConversation(repository, { scopeDir: "Projects/Atlas" });
    await createConversation(repository, { scopeDir: "Projects/Copy" });
    const database = new MemoryAppDatabase("memory-ambiguous");
    await database.open();
    const service = new NativeMemoryService(repository, database);

    const result = await service.rebuild();

    expect(result).toMatchObject({ conversations: 0, inconsistent: 2 });
    await expect(database.getMemorySourceState(FIRST_CONVERSATION)).resolves.toMatchObject({
      status: "inconsistent",
      errorCode: "duplicate-conversation-id",
    });
    await expect(
      service.get(`episode:${FIRST_CONVERSATION}:user-1`, {
        scopeDir: "Projects/Atlas",
      }),
    ).resolves.toMatchObject({ status: "ambiguous" });
  });

  it("yields between bounded 200-entry ingestion batches", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const snapshot = await repository.create({
      id: FIRST_CONVERSATION,
      scopeDir: "Projects/Large",
      now: "2026-08-20T09:00:00.000Z",
    });
    await repository.appendTranscript(
      snapshot.location,
      Array.from({ length: 401 }, (_, index) => ({
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        id: `message-${index}`,
        type: "message" as const,
        role: "user" as const,
        text: `Memory message ${index}`,
        createdAt: new Date(Date.UTC(2026, 7, 20, 9, 0, index)).toISOString(),
      })),
    );
    const database = new MemoryAppDatabase("memory-batching");
    await database.open();
    const yieldToApp = vi.fn(async () => undefined);
    const service = new NativeMemoryService(repository, database, { yieldToApp });

    await service.ingestConversation(snapshot.location);

    expect(yieldToApp).toHaveBeenCalledTimes(2);
    expect(
      (await database.listSearchDocuments()).filter(
        (document) =>
          document.sourceProviderId === AI_MEMORY_EPISODIC_PROVIDER_ID,
      ),
    ).toHaveLength(401);
  });

  it("promotes an explicit owner cue into grounded curated memory", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    await createConversation(repository, {
      text: "Remember that this project uses compact headings.",
    });
    const database = new MemoryAppDatabase("memory-promotion");
    await database.open();
    const recordStore = new InMemoryMemoryRecordStore();
    const service = new NativeMemoryService(repository, database, {
      recordStore,
      now: () => new Date("2026-08-27T12:00:00.000Z"),
    });
    await service.rebuild();

    await expect(
      service.previewConsolidation({
        kind: "project",
        projectDir: "Projects/Atlas",
      }),
    ).resolves.toMatchObject({ proposals: 1 });
    await expect(
      service.consolidate({
        kind: "project",
        projectDir: "Projects/Atlas",
      }),
    ).resolves.toMatchObject({ written: 1 });

    const stored = await recordStore.list({
      kind: "project",
      projectDir: "Projects/Atlas",
    });
    expect(stored).toMatchObject([
      {
        record: {
          revision: 1,
          status: "active",
          createdBy: "deterministic-promotion",
          summary: "this project uses compact headings",
          evidence: [
            {
              conversationId: FIRST_CONVERSATION,
              entryId: "user-1",
              entryHash: expect.stringMatching(/^[0-9a-f]{64}$/u),
            },
          ],
        },
      },
    ]);
    await expect(
      service.search(
        { query: "compact headings", corpus: "curated" },
        { scopeDir: "Projects/Atlas" },
      ),
    ).resolves.toMatchObject([
      {
        corpus: "curated",
        effectiveTrust: "owner",
        status: "active",
      },
    ]);
  });

  it("applies a schema-validated provider proposal as a grounded revision", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    await createConversation(repository, {
      text: "Remember that this project uses compact headings.",
    });
    const database = new MemoryAppDatabase("memory-provider-promotion");
    await database.open();
    const recordStore = new InMemoryMemoryRecordStore();
    const service = new NativeMemoryService(repository, database, {
      recordStore,
      consolidationProvider: {
        propose: vi.fn(async (input) => ({
          memories: [
            {
              candidateIds: [input.candidates[0]!.id],
              kind: "preference" as const,
              scope: input.scope,
              importance: 5 as const,
              triggers: ["atlas", "headings"],
              summary: "Atlas writing uses compact headings",
              supersessionKey: "preference:atlas-writing",
            },
          ],
        })),
      },
      now: () => new Date("2026-08-27T12:00:00.000Z"),
    });
    await service.rebuild();

    await expect(
      service.consolidate({
        kind: "project",
        projectDir: "Projects/Atlas",
      }),
    ).resolves.toMatchObject({ written: 1, needsReview: 1 });
    await expect(
      recordStore.list({
        kind: "project",
        projectDir: "Projects/Atlas",
      }),
    ).resolves.toMatchObject([
      {
        record: {
          createdBy: "consolidator",
          summary: "Atlas writing uses compact headings",
          evidence: [
            {
              conversationId: FIRST_CONVERSATION,
              entryId: "user-1",
            },
          ],
        },
      },
    ]);
  });

  it("rejects malformed provider grounding without durable mutation", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    await createConversation(repository, {
      text: "Remember that this project uses compact headings.",
    });
    const database = new MemoryAppDatabase("memory-provider-rejection");
    await database.open();
    const recordStore = new InMemoryMemoryRecordStore();
    const service = new NativeMemoryService(repository, database, {
      recordStore,
      consolidationProvider: {
        propose: vi.fn(async (input) => ({
          memories: [
            {
              candidateIds: ["unknown-candidate"],
              kind: "preference" as const,
              scope: input.scope,
              importance: 5 as const,
              triggers: ["headings"],
              summary: "Atlas uses compact headings",
            },
          ],
        })),
      },
    });
    await service.rebuild();

    await expect(
      service.consolidate({
        kind: "project",
        projectDir: "Projects/Atlas",
      }),
    ).resolves.toMatchObject({ written: 0, needsReview: 1 });
    await expect(recordStore.list()).resolves.toEqual([]);
    expect(
      (await database.queryMemoryCandidates()).filter(
        (candidate) => candidate.candidate.originClass === "owner",
      ),
    ).toMatchObject([{ candidate: { state: "staged" } }]);
  });

  it("forgets derived lineage durably without deleting the transcript", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const location = await createConversation(repository, {
      text: "Remember that this project uses compact headings.",
    });
    const transcriptBefore = JSON.stringify(await repository.read(location));
    const database = new MemoryAppDatabase("memory-forget");
    await database.open();
    const recordStore = new InMemoryMemoryRecordStore();
    const service = new NativeMemoryService(repository, database, {
      recordStore,
      now: () => new Date("2026-08-27T12:00:00.000Z"),
    });
    await service.rebuild();
    await service.consolidate({
      kind: "project",
      projectDir: "Projects/Atlas",
    });

    const preview = await service.previewForgetConversation(location);
    expect(preview.episodeRefs).not.toHaveLength(0);
    expect(preview.memoryIds).not.toHaveLength(0);
    await expect(service.forgetConversation(location)).resolves.toMatchObject({
      retracted: 1,
      needsReview: 0,
      exclusionPath: expect.stringContaining("/exclusions/"),
    });

    expect(JSON.stringify(await repository.read(location))).toBe(
      transcriptBefore,
    );
    await expect(
      service.search(
        { query: "compact headings", corpus: "all" },
        { scopeDir: "Projects/Atlas" },
      ),
    ).resolves.toEqual([]);
    await expect(
      service.search(
        {
          query: "compact headings",
          corpus: "curated",
          includeSuperseded: true,
        },
        { scopeDir: "Projects/Atlas" },
      ),
    ).resolves.toMatchObject([{ status: "retracted" }]);
    await service.rebuild();
    await expect(
      service.search(
        { query: "compact headings", corpus: "episodic" },
        { scopeDir: "Projects/Atlas" },
      ),
    ).resolves.toEqual([]);
  });

  it("requires two conversations on two days for non-explicit owner evidence", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    await createConversation(repository, {
      text: "The project uses compact headings.",
      createdAt: "2026-08-20T09:00:00.000Z",
    });
    const database = new MemoryAppDatabase("memory-recurrence");
    await database.open();
    const service = new NativeMemoryService(repository, database);
    await service.rebuild();
    await expect(
      service.previewConsolidation({
        kind: "project",
        projectDir: "Projects/Atlas",
      }),
    ).resolves.toMatchObject({ proposals: 0 });

    await createConversation(repository, {
      id: SECOND_CONVERSATION,
      text: "The project uses compact headings.",
      createdAt: "2026-08-21T09:00:00.000Z",
    });
    await service.rebuild();
    await expect(
      service.previewConsolidation({
        kind: "project",
        projectDir: "Projects/Atlas",
      }),
    ).resolves.toMatchObject({ proposals: 1 });
  });

  it("rejects secret-bearing cues before candidate persistence", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    await createConversation(repository, {
      text: "Remember that api_key = sk-super-secret-token-1234567890",
    });
    const database = new MemoryAppDatabase("memory-secret-rejection");
    await database.open();
    const service = new NativeMemoryService(repository, database);

    await service.rebuild();

    const candidates = await database.queryMemoryCandidates();
    expect(
      candidates.filter(
        (candidate) => candidate.candidate.originClass === "owner",
      ),
    ).toEqual([]);
    expect(JSON.stringify(candidates)).not.toContain("super-secret-token");
  });

  it("does not trust editable owner-ui frontmatter over agent evidence", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    await createConversation(repository);
    const database = new MemoryAppDatabase("memory-frontmatter-trust");
    await database.open();
    const recordStore = new InMemoryMemoryRecordStore();
    const service = new NativeMemoryService(repository, database, {
      recordStore,
    });
    await service.rebuild();
    const [episode] = await service.search(
      { query: "preserve project convention", corpus: "episodic" },
      { scopeDir: "Projects/Atlas" },
    );
    expect(episode?.effectiveTrust).toBe("agent");

    await recordStore.write({
      schemaVersion: 1,
      id: "frontmatter-spoof",
      revision: 1,
      kind: "preference",
      scope: { kind: "project", projectDir: "Projects/Atlas" },
      status: "active",
      importance: 5,
      triggers: ["project", "convention"],
      summary: "Spoofed owner approval for the project convention",
      evidence: episode!.evidence,
      createdBy: "owner-ui",
      createdAt: "2026-08-20T09:00:00.000Z",
      updatedAt: "2026-08-20T09:00:00.000Z",
    });
    await service.rebuild();

    await expect(
      service.search(
        { query: "spoofed owner approval", corpus: "curated" },
        { scopeDir: "Projects/Atlas" },
      ),
    ).resolves.toMatchObject([{ effectiveTrust: "agent" }]);
    await expect(
      service.recall("What is the spoofed owner approval?", {
        scopeDir: "Projects/Atlas",
      }),
    ).resolves.toEqual([]);
  });

  it("bounds trusted curated automatic recall and stores only salted query signals", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    const database = new MemoryAppDatabase("memory-auto-recall");
    await database.open();
    const recordStore = new InMemoryMemoryRecordStore();
    for (let index = 0; index < 5; index += 1) {
      await recordStore.write({
        schemaVersion: 1,
        id: `owner-memory-${index}`,
        revision: 1,
        kind: "preference",
        scope: { kind: "workspace" },
        status: "active",
        importance: 5,
        triggers: ["project", "style"],
        summary: `Project style preference ${index}: ${"concise ".repeat(120)}`,
        evidence: [],
        createdBy: "owner-ui",
        createdAt: "2026-08-20T09:00:00.000Z",
        updatedAt: "2026-08-20T09:00:00.000Z",
      });
    }
    const service = new NativeMemoryService(repository, database, {
      recordStore,
      now: () => new Date("2026-08-27T12:00:00.000Z"),
    });
    await service.rebuild();

    await expect(
      service.search(
        { query: "project style", corpus: "curated" },
        { scopeDir: "Projects/Atlas" },
      ),
    ).resolves.not.toHaveLength(0);

    const blocks = await service.recall("What project style should I use?", {
      scopeDir: "Projects/Atlas",
    });

    expect(blocks.length).toBeLessThanOrEqual(3);
    expect(blocks).not.toHaveLength(0);
    expect(
      blocks.reduce(
        (tokens, block) => tokens + Math.ceil(block.content.length / 4),
        0,
      ),
    ).toBeLessThanOrEqual(900);
    expect(blocks.every((block) => block.kind === "memory-recall")).toBe(true);
    await vi.waitFor(async () => {
      expect(await database.listMemoryRecallSignals()).not.toHaveLength(0);
    });
    const signals = await database.listMemoryRecallSignals();
    expect(JSON.stringify(signals)).not.toContain("What project style");
    expect(signals[0]?.queryFingerprint).toMatch(/^[0-9a-f]{64}$/u);
  });

  it("returns empty recall at the hard deadline even when database search stalls", async () => {
    vi.useFakeTimers();
    try {
      const repository = new ConversationRepository(new MemoryTranscriptStore());
      const database = new MemoryAppDatabase("memory-recall-deadline");
      await database.open();
      vi.spyOn(database, "searchDocuments").mockImplementation(
        () => new Promise(() => undefined),
      );
      const service = new NativeMemoryService(repository, database);

      const recall = service.recall("Remember my project style", {
        scopeDir: "Projects/Atlas",
      });
      await vi.advanceTimersByTimeAsync(151);

      await expect(recall).resolves.toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("memory app tools", () => {
  it("freeze provider-independent descriptors and retain results across agent switches", async () => {
    const repository = new ConversationRepository(new MemoryTranscriptStore());
    await createConversation(repository);
    const database = new MemoryAppDatabase("memory-tools");
    await database.open();
    const service = new NativeMemoryService(repository, database);
    await service.rebuild();

    const registry = new AppToolRegistry();
    for (const tool of createMemoryAppTools(service)) {
      registry.register(
        { pluginId: "ai", source: "official", provenance: "bundled" },
        tool,
      );
    }
    const host = new AppToolHost(registry, () => ({
      appToolsEnabled: true,
      disabledAppToolNames: [],
      enabledAppToolNames: [],
      enabledCommunityToolPluginIds: [],
    }));
    for (const agentBindingId of ["codex-binding", "cursor-binding"]) {
      const descriptor = host.createSession({
        conversationId: FIRST_CONVERSATION,
        agentBindingId,
        scopeDir: "Projects/Atlas",
        runtimeSupportsAppTools: true,
      });
      expect(descriptor.tools.map((tool) => tool.name)).toEqual([
        "memory_get",
        "memory_search",
      ]);
    }

    const invokeSearch = (agentBindingId: string) =>
      host.invoke(agentBindingId, {
        runId: "run-1",
        toolCallId: `call-${agentBindingId}`,
        name: "memory_search",
        input: { query: "compact headings" },
      });
    const codex = await invokeSearch("codex-binding");
    const cursor = await invokeSearch("cursor-binding");
    expect(cursor.structuredContent).toEqual(codex.structuredContent);

    const searchOutput = codex.structuredContent as {
      results: Array<{ ref: string }>;
    };
    await expect(
      host.invoke("cursor-binding", {
        runId: "run-2",
        toolCallId: "call-get",
        name: "memory_get",
        input: { ref: searchOutput.results[0]!.ref },
      }),
    ).resolves.toMatchObject({
      structuredContent: {
        status: "available",
        evidenceMessages: [{ id: "user-1", verification: "matching" }],
      },
    });
  });
});
