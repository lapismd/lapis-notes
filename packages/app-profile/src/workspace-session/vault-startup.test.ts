import { expect, it, vi } from "vitest";
import { openSessionVault } from "./vault-startup";

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

it.each(["vault-discovery", "sync-readiness", "state-directory"] as const)(
  "identifies pending %s without advancing startup",
  async (blocked) => {
    const gate = deferred();
    const operations: string[] = [];
    const task = (name: string) =>
      vi.fn(() => (name === blocked ? gate.promise : Promise.resolve()));
    const vault = {
      load: task("vault-discovery"),
      mkpath: task("state-directory"),
    };
    const sync = { ready: task("sync-readiness") };
    const pending = openSessionVault(vault, sync, (operation) =>
      operations.push(operation),
    );
    await vi.waitFor(() => expect(operations.at(-1)).toBe(blocked));
    expect(operations).not.toContain("complete");
    if (blocked === "vault-discovery")
      expect(sync.ready).not.toHaveBeenCalled();
    if (blocked !== "state-directory")
      expect(vault.mkpath).not.toHaveBeenCalled();
    gate.resolve();
    await pending;
    expect(operations).toEqual([
      "vault-discovery",
      "sync-readiness",
      "state-directory",
      "complete",
    ]);
    expect(vault.mkpath).toHaveBeenCalledWith(".lapis");
  },
);

it("retains the exact failed boundary and propagates the original error", async () => {
  const failure = new Error("sync unavailable");
  const operations: string[] = [];
  const vault = { load: vi.fn(async () => {}), mkpath: vi.fn(async () => {}) };
  await expect(
    openSessionVault(
      vault,
      {
        ready: async () => {
          throw failure;
        },
      },
      (operation) => operations.push(operation),
    ),
  ).rejects.toBe(failure);
  expect(operations).toEqual(["vault-discovery", "sync-readiness"]);
  expect(vault.mkpath).not.toHaveBeenCalled();
});
