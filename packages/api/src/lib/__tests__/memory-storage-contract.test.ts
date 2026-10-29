import { connect } from "@tursodatabase/database";
import { describe, expect, it } from "vitest";
import {
  MemoryAppDatabase,
  type AppDatabase,
  type AppDatabaseMemoryCandidateInput,
  type AppDatabaseMemoryCandidateQuery,
  type AppDatabaseMemoryJobRecord,
  type AppDatabaseMemoryJobUpdateInput,
  type AppDatabaseMemorySourceRecord,
} from "../storage/app-database";
import {
  TursoAppDatabase,
  type TursoConnection,
} from "../storage/turso-app-database";
import fixture from "./fixtures/memory-storage.json";

for (const native of [false, true])
  describe(
    native ? "Turso memory storage reference" : "Memory storage reference",
    () => {
      async function database(): Promise<AppDatabase> {
        const db = native
          ? new TursoAppDatabase("memory", {
              kind: "turso-native",
              transport: "native",
              connectionFactory: async () =>
                (await connect(":memory:", {
                  experimental: ["index_method"],
                })) as TursoConnection,
            })
          : new MemoryAppDatabase("memory");
        await db.open();
        return db;
      }
      it("preserves full source and candidate records, exact origins, filters and ordering", async () => {
        const db = await database();
        try {
          await db.upsertMemorySourceState(
            fixture.source as AppDatabaseMemorySourceRecord,
          );
          expect(
            await db.getMemorySourceState(fixture.source.sourceKey),
          ).toEqual(fixture.source);
          expect(await db.listMemorySourceStates()).toEqual([fixture.source]);
          for (const input of fixture.candidates)
            await db.upsertMemoryCandidate(
              input as AppDatabaseMemoryCandidateInput,
            );
          for (const { query, ids } of [
            ...fixture.queries,
            ...(native ? fixture.tursoQueries : []),
          ]) {
            const rows = await db.queryMemoryCandidates(
              query as AppDatabaseMemoryCandidateQuery,
            );
            expect(rows.map((r) => r.candidate.id)).toEqual(ids);
            for (const row of rows)
              expect(row).toEqual(
                fixture.candidates.find(
                  (c) => c.candidate.id === row.candidate.id,
                ),
              );
          }
          await db.deleteMemoryCandidatesByConversation("conversation-2");
          expect(
            (await db.queryMemoryCandidates()).map((r) => r.candidate.id),
          ).toEqual(["b", "c"]);
          await db.deleteMemorySourceState(fixture.source.sourceKey);
          expect(await db.listMemorySourceStates()).toEqual([]);
        } finally {
          await db.close();
        }
      });
      it("retains renewable leases, exact expiry boundaries, stale-owner rejection and terminal completion", async () => {
        const db = await database();
        try {
          for (const step of fixture.jobSteps) {
            const result =
              step.action === "claim"
                ? await db.claimMemoryJob({
                    job: fixture.job as AppDatabaseMemoryJobRecord,
                    ownerId: step.ownerId,
                    now: step.now,
                    leaseMs: step.leaseMs!,
                  })
                : await db.updateMemoryJob({
                    jobId: fixture.job.id,
                    ownerId: step.ownerId,
                    now: step.now,
                    patch:
                      step.patch as AppDatabaseMemoryJobUpdateInput["patch"],
                  });
            expect(result).toEqual(step.expected);
          }
          expect(await db.listMemoryJobs(fixture.job.scopeKey)).toEqual([
            fixture.jobSteps.at(-2)!.expected,
          ]);
          expect(await db.listMemoryJobs("other")).toEqual([]);
        } finally {
          await db.close();
        }
      });
      it("aggregates salted daily recall signals and clears only derived memory state", async () => {
        const db = await database();
        try {
          await db.setMeta("unrelated", { retained: true });
          await db.upsertMemorySourceState(
            fixture.source as AppDatabaseMemorySourceRecord,
          );
          const signal = {
            targetRef: "curated:memory:1",
            queryFingerprint: "salted-sha256",
            day: "2026-10-24",
            bestScore: 0.8,
            hitCount: 2,
          };
          await db.recordMemoryRecallSignal(signal);
          await db.recordMemoryRecallSignal({
            ...signal,
            bestScore: 0.6,
            hitCount: -4,
          });
          await db.recordMemoryRecallSignal({ ...signal, hitCount: 3 });
          expect(await db.listMemoryRecallSignals(signal.targetRef)).toEqual([
            { ...signal, hitCount: 5 },
          ]);
          expect(await db.listMemoryRecallSignals("other")).toEqual([]);
          await db.clearMemoryDerivedState();
          expect(await db.listMemorySourceStates()).toEqual([]);
          expect(await db.queryMemoryCandidates()).toEqual([]);
          expect(await db.listMemoryRecallSignals()).toEqual([]);
          expect(await db.listMemoryJobs()).toEqual([]);
          expect(await db.getMeta("unrelated")).toEqual({ retained: true });
        } finally {
          await db.close();
        }
      });
    },
  );
