import type { App } from "@lapis-notes/api";
import { describe, expect, it, vi } from "vitest";
import { subscribeExplorerVaultTreeChanges } from "./explorer-tree-subscription";

function createVaultEmitter() {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  const vault = {
    on(event: string, listener: (...args: unknown[]) => void) {
      const bucket = listeners.get(event) ?? new Set();
      bucket.add(listener);
      listeners.set(event, bucket);
      return { event, listener };
    },
    offref(ref: { event: string; listener: (...args: unknown[]) => void }) {
      listeners.get(ref.event)?.delete(ref.listener);
    },
    emit(event: string, ...args: unknown[]) {
      for (const listener of listeners.get(event) ?? []) {
        listener(...args);
      }
    },
  };
  return vault;
}

describe("subscribeExplorerVaultTreeChanges", () => {
  it("refreshes on initial vault load and tree mutation events", () => {
    const vault = createVaultEmitter();
    const onChange = vi.fn();
    const stop = subscribeExplorerVaultTreeChanges(
      { vault } as unknown as App,
      onChange,
    );

    vault.emit("load");
    vault.emit("create", {});
    vault.emit("delete", {});
    vault.emit("rename", {}, "old.md");
    expect(onChange).toHaveBeenCalledTimes(4);

    stop();
    vault.emit("load");
    expect(onChange).toHaveBeenCalledTimes(4);
  });
});
