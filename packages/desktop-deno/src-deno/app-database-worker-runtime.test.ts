import { MemoryAppDatabase } from "../../api/src/lib/storage/app-database.ts";
import { describe, expect, it } from "vitest";
import type { AppDatabaseWorkerResponse } from "./app-database-worker-protocol";
import { AppDatabaseWorkerRuntime } from "./app-database-worker-runtime";

describe("AppDatabaseWorkerRuntime", () => {
  it("owns database open, invoke, change, and close in worker order", async () => {
    const responses: AppDatabaseWorkerResponse[] = [];
    const runtime = new AppDatabaseWorkerRuntime(
      async ({ vaultId }) => {
        const database = new MemoryAppDatabase(vaultId);
        await database.open();
        return database;
      },
      (response) => responses.push(response),
    );

    await runtime.handle({
      id: 1,
      type: "open",
      databaseId: "database-1",
      vaultId: "vault-1",
      path: "/ignored.turso",
    });
    await runtime.handle({
      id: 2,
      type: "invoke",
      databaseId: "database-1",
      method: "setMeta",
      args: ["worker", { ready: true }],
    });
    await runtime.handle({
      id: 3,
      type: "invoke",
      databaseId: "database-1",
      method: "getMeta",
      args: ["worker"],
    });
    await runtime.handle({ id: 4, type: "close-all" });

    expect(responses).toContainEqual(
      expect.objectContaining({
        type: "change",
        databaseId: "database-1",
        vaultId: "vault-1",
      }),
    );
    expect(responses).toContainEqual({
      type: "result",
      id: 3,
      ok: true,
      value: { ready: true },
    });
    expect(responses.at(-1)).toEqual({
      type: "result",
      id: 4,
      ok: true,
      value: undefined,
    });
  });
});
