import { MemoryAppDatabase } from "@lapis-notes/api/app-database";
import { describe, expect, it, vi } from "vitest";
import { MemoryMaintenanceScheduler } from "./memory-scheduler";
import type { MemoryScope, MemoryService } from "./types";

const WORKSPACE_SCOPE = { kind: "workspace" } satisfies MemoryScope;

function createMemoryService(options: { fail?: Error } = {}): MemoryService {
  return {
    search: vi.fn(async () => []),
    get: vi.fn(async () => ({
      ref: "curated:memory-1:1",
      corpus: "curated" as const,
      status: "missing" as const,
      evidenceMessages: [],
    })),
    ingestConversation: vi.fn(async () => undefined),
    previewConsolidation: vi.fn(async (scope) => ({
      scope,
      candidateIds: ["candidate-1"],
      proposals: 1,
    })),
    consolidate: vi.fn(async (scope) => {
      if (options.fail) throw options.fail;
      return {
        scope,
        candidateIds: ["candidate-1"],
        proposals: 1,
        written: 1,
        needsReview: 0,
      };
    }),
    rebuild: vi.fn(async () => ({
      conversations: 0,
      episodes: 0,
      skipped: 0,
      inconsistent: 0,
    })),
    previewForgetConversation: vi.fn(async (location) => ({
      conversationId: location.conversationId,
      episodeRefs: [],
      candidateIds: [],
      memoryIds: [],
    })),
    forgetConversation: vi.fn(async (location) => ({
      conversationId: location.conversationId,
      episodeRefs: [],
      candidateIds: [],
      memoryIds: [],
      exclusionPath: "",
      retracted: 0,
      needsReview: 0,
    })),
  };
}

describe("MemoryMaintenanceScheduler", () => {
  it("allows only one database owner to run the daily scope job", async () => {
    const database = new MemoryAppDatabase("memory-scheduler-lease");
    await database.open();
    const memory = createMemoryService();
    const first = new MemoryMaintenanceScheduler(database, memory, {
      ownerId: "tab-a",
      now: () => Date.parse("2026-08-27T12:00:00.000Z"),
    });
    const second = new MemoryMaintenanceScheduler(database, memory, {
      ownerId: "tab-b",
      now: () => Date.parse("2026-08-27T12:00:00.000Z"),
    });

    const results = await Promise.all([
      first.run(WORKSPACE_SCOPE),
      second.run(WORKSPACE_SCOPE),
    ]);

    expect(results.filter(Boolean)).toHaveLength(1);
    expect(memory.consolidate).toHaveBeenCalledTimes(1);
    await expect(first.run(WORKSPACE_SCOPE)).resolves.toBeNull();
    expect(memory.consolidate).toHaveBeenCalledTimes(1);
    const jobs = await database.listMemoryJobs();
    expect(jobs).toMatchObject([{ status: "completed", attempts: 1 }]);
    expect(jobs[0]).not.toHaveProperty("ownerId");
    expect(jobs[0]).not.toHaveProperty("leaseUntil");
  });

  it("allows a new qualified candidate set to run again on the same day", async () => {
    const database = new MemoryAppDatabase("memory-scheduler-new-candidates");
    await database.open();
    const memory = createMemoryService();
    const scheduler = new MemoryMaintenanceScheduler(database, memory, {
      ownerId: "tab-a",
      now: () => Date.parse("2026-08-27T12:00:00.000Z"),
    });

    await expect(scheduler.run(WORKSPACE_SCOPE)).resolves.not.toBeNull();
    vi.mocked(memory.previewConsolidation).mockResolvedValue({
      scope: WORKSPACE_SCOPE,
      candidateIds: ["candidate-2"],
      proposals: 1,
    });
    await expect(scheduler.run(WORKSPACE_SCOPE)).resolves.not.toBeNull();

    expect(memory.consolidate).toHaveBeenCalledTimes(2);
    await expect(database.listMemoryJobs()).resolves.toHaveLength(2);
  });

  it("persists only a bounded error code when consolidation fails", async () => {
    const database = new MemoryAppDatabase("memory-scheduler-error");
    await database.open();
    const failure = new Error("provider leaked a sensitive failure detail");
    const memory = createMemoryService({ fail: failure });
    const onError = vi.fn();
    const scheduler = new MemoryMaintenanceScheduler(database, memory, {
      ownerId: "tab-a",
      now: () => Date.parse("2026-08-27T12:00:00.000Z"),
      onError,
    });

    await expect(scheduler.run(WORKSPACE_SCOPE)).resolves.toBeNull();

    expect(onError).toHaveBeenCalledWith(
      "consolidate",
      WORKSPACE_SCOPE,
      failure,
    );
    const jobs = await database.listMemoryJobs();
    expect(jobs).toMatchObject([
      { status: "failed", errorCode: "consolidation-failed" },
    ]);
    expect(JSON.stringify(jobs)).not.toContain("sensitive failure detail");
  });

  it("discovers qualified startup candidates on the daily sweep", async () => {
    vi.useFakeTimers();
    try {
      const database = new MemoryAppDatabase("memory-scheduler-startup");
      await database.open();
      await database.upsertMemoryCandidate({
        candidate: {
          id: "candidate-1",
          scopeKind: "workspace",
          scopePath: "",
          kind: "preference",
          normalizedClaim: "Use compact headings",
          claimHash: "claim-hash",
          originClass: "owner",
          importance: 4,
          triggers: ["headings"],
          state: "staged",
          firstSeenAt: 1,
          lastSeenAt: 1,
          recurrenceCount: 1,
          conversationCount: 1,
        },
        origins: [],
      });
      const memory = createMemoryService();
      const scheduler = new MemoryMaintenanceScheduler(database, memory, {
        ownerId: "tab-a",
        dailyMs: 10,
        now: () => Date.parse("2026-08-27T12:00:00.000Z"),
      });

      scheduler.start();
      await vi.advanceTimersByTimeAsync(10);
      await vi.waitFor(() => {
        expect(memory.consolidate).toHaveBeenCalledWith(WORKSPACE_SCOPE);
      });
      scheduler.dispose();
    } finally {
      vi.useRealTimers();
    }
  });
});
