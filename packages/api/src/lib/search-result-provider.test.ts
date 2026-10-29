import { describe, expect, it, vi } from "vitest";
import {
  SearchResultProviderRegistry,
  type SearchResultProvider,
} from "./search-result-provider";

describe("Search result providers", () => {
  const provider = (): SearchResultProvider => ({
    id: "history:versions",
    label: "History",
    scope: "history",
    fields: ["path"],
    modes: ["lexical"],
    search: async () => ({ generation: "one", hits: [] }),
    activate: async () => {},
  });
  it("disposes subscriptions and fences late invalidations across re-registration", () => {
    const registry = new SearchResultProviderRegistry();
    const changes = vi.fn();
    registry.on("changed", changes);
    let invalidate = () => {};
    const unsubscribe = vi.fn();
    const first = registry.register({
      ...provider(),
      subscribe: (next) => {
        invalidate = next;
        return unsubscribe;
      },
    });
    invalidate();
    expect(changes).toHaveBeenLastCalledWith({
      providerId: first.id,
      reason: "invalidated",
    });
    first.dispose();
    registry.register(provider());
    changes.mockClear();
    invalidate();
    first.dispose();
    expect(changes).not.toHaveBeenCalled();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(registry.getAll()).toHaveLength(1);
  });
  it("rejects duplicates and rolls back failed subscriptions", () => {
    const registry = new SearchResultProviderRegistry();
    expect(() =>
      registry.register({
        ...provider(),
        subscribe: () => {
          throw Error("failed");
        },
      }),
    ).toThrow("failed");
    expect(registry.getAll()).toEqual([]);
    registry.register(provider());
    expect(() => registry.register(provider())).toThrow(/already registered/);
  });
});
