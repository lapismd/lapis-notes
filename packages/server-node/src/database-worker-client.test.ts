import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import type { AppDatabaseWorkerRequest } from "@lapis-notes/host-services/app-database-worker-protocol";
import { ServerDatabaseWorkerClient } from "./database-worker-client.ts";

class TestWorker extends EventEmitter {
  requests: AppDatabaseWorkerRequest[] = [];
  postMessage(request: AppDatabaseWorkerRequest) {
    this.requests.push(request);
    if (request.type === "close-all")
      queueMicrotask(() =>
        this.emit("message", { type: "result", id: request.id, ok: true }),
      );
  }
  async terminate() {
    this.emit("exit", 0);
    return 0;
  }
}

describe("Node database worker lifecycle", () => {
  it("correlates replies, relays changes and acknowledges shutdown before termination", async () => {
    const worker = new TestWorker();
    const changes = vi.fn();
    const client = new ServerDatabaseWorkerClient(changes, () => worker);
    const opened = client.open("db", "vault", "/private/database");
    worker.emit("message", {
      type: "result",
      id: worker.requests[0]!.id,
      ok: true,
      value: { engine: "turso" },
    });
    await expect(opened).resolves.toEqual({ engine: "turso" });
    worker.emit("message", {
      type: "change",
      databaseId: "db",
      vaultId: "vault",
      change: { revision: 1 },
    });
    expect(changes).toHaveBeenCalledWith("vault", { revision: 1 });
    const terminated = vi.spyOn(worker, "terminate");
    await client.closeAll();
    expect(worker.requests.at(-1)?.type).toBe("close-all");
    expect(terminated).toHaveBeenCalledOnce();
  });

  it.each(["error", "exit", "messageerror"])(
    "rejects all pending requests after %s and recovers with a new worker",
    async (event) => {
      const workers = [new TestWorker(), new TestWorker()];
      let next = 0;
      const client = new ServerDatabaseWorkerClient(
        () => undefined,
        () => workers[next++]!,
      );
      const first = client.open("db", "vault", "/private/database");
      const second = client.invoke("db", "getMeta", ["key"]);
      const settled = Promise.allSettled([first, second]);
      workers[0]!.emit(
        event,
        event === "error" ? new Error("worker failed") : 0,
      );
      expect(
        (await settled).every((result) => result.status === "rejected"),
      ).toBe(true);
      const reopened = client.open("db", "vault", "/private/database");
      const request = workers[1]!.requests[0]!;
      workers[1]!.emit("message", {
        type: "result",
        id: request.id,
        ok: true,
        value: "reopened",
      });
      await expect(reopened).resolves.toBe("reopened");
      await client.closeAll();
    },
  );
});
