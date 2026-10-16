import { describe, expect, it, vi } from "vitest";
import {
  DirectoryWatcher,
  type ChangeEvent,
  type NativeWatchSubscription,
  type WatchErrorEvent,
} from "../storage/fs";
import { InMemoryDataAdapter } from "./data-adapter-conformance";

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
class NativeAdapter extends InMemoryDataAdapter {
  listeners: Array<(event: ChangeEvent | WatchErrorEvent) => void> = [];
  cleanup = vi.fn((): void | Promise<void> => undefined);
  ready: Promise<void> | undefined;
  options: unknown[] = [];
  getCapabilities() {
    return {
      persistent: false,
      userVisibleFiles: false,
      requiresPermission: false,
      nativeWatch: true,
      resourceUrls: false,
      systemTrash: false,
    };
  }
  watch(
    path: string | string[],
    options: unknown,
    listener: (event: ChangeEvent | WatchErrorEvent) => void,
  ): NativeWatchSubscription {
    this.listeners.push(listener);
    this.options.push(options);
    return { ready: this.ready, close: () => this.cleanup() };
  }
}
describe("owned DirectoryWatcher retirement", () => {
  it("exposes native registration readiness before an initial reconciliation", async () => {
    const adapter = new NativeAdapter();
    const release = deferred();
    adapter.ready = release.promise;
    const watcher = new DirectoryWatcher(adapter);
    const subscription = watcher.watch("/");
    let ready = false;
    const starting = Promise.resolve(subscription.ready).then(() => {
      ready = true;
    });
    await Promise.resolve();
    expect(ready).toBe(false);
    release.resolve();
    await starting;
    expect(ready).toBe(true);
    await watcher.close();
  });
  it("retains rejected readiness through array subscriptions", async () => {
    const adapter = new NativeAdapter();
    const release = deferred();
    adapter.ready = release.promise;
    const watcher = new DirectoryWatcher(adapter);
    const subscription = watcher.watch(["Notes", "Other"]);
    release.resolve();
    await subscription.ready;
    await watcher.close();
    adapter.ready = Promise.reject(new Error("registration rejected"));
    const failed = watcher.watch("/");
    await expect(failed.ready).rejects.toThrow("registration rejected");
    await watcher.close();
  });
  it("closes a subscription retired by its registration callback", async () => {
    const adapter = new NativeAdapter();
    const original = adapter.watch.bind(adapter);
    vi.spyOn(adapter, "watch").mockImplementation((path, options, listener) => {
      const subscription = original(path, options, listener);
      listener({ type: "modify", path: "note.md" });
      return subscription;
    });
    const watcher = new DirectoryWatcher(adapter);
    watcher.on("modify", () => {
      void watcher.unwatch("/");
    });
    watcher.watch("/");
    await watcher.close();
    expect(adapter.cleanup).toHaveBeenCalledTimes(1);
  });
  it("ignores queued callbacks after replacing a path and after closure", async () => {
    const adapter = new NativeAdapter();
    const watcher = new DirectoryWatcher(adapter);
    const seen = vi.fn();
    watcher.on("all", seen);
    const first = watcher.watch("/");
    const retired = adapter.listeners[0];
    watcher.watch("/");
    await first?.close();
    retired({ type: "modify", path: "/old.md" });
    adapter.listeners[1]({
      type: "modify",
      path: "/live.md",
      previousPath: "/before.md",
    });
    expect(seen.mock.calls).toEqual([
      [{ type: "modify", path: "live.md", previousPath: "before.md" }],
    ]);
    await watcher.close();
    adapter.listeners[1]({ type: "create", path: "/retired.md" });
    expect(seen).toHaveBeenCalledTimes(1);
  });
  it("awaits native cleanup and retains failures for retry", async () => {
    const adapter = new NativeAdapter();
    const watcher = new DirectoryWatcher(adapter);
    const release = deferred();
    adapter.cleanup.mockImplementationOnce(() => release.promise);
    watcher.watch("/");
    let done = false;
    const closing = Promise.resolve(watcher.close()).then(() => {
      done = true;
    });
    await Promise.resolve();
    expect(done).toBe(false);
    release.resolve();
    await closing;
    expect(done).toBe(true);
    adapter.cleanup.mockImplementationOnce(() =>
      Promise.reject(new Error("native stop failed")),
    );
    watcher.watch("/");
    await expect(watcher.close()).rejects.toThrow("native stop failed");
    await watcher.close();
    expect(adapter.cleanup).toHaveBeenCalledTimes(3);
  });
  it("preserves array options and closes every subscription", async () => {
    const adapter = new NativeAdapter();
    const watcher = new DirectoryWatcher(adapter);
    const subscription = watcher.watch(["one", "two"], { recursive: true });
    expect(adapter.options).toEqual([{ recursive: true }, { recursive: true }]);
    await subscription?.close();
    expect(adapter.cleanup).toHaveBeenCalledTimes(2);
  });
  it("drains a pending initial poll without starting a timer after close", async () => {
    vi.useFakeTimers();
    try {
      const adapter = new InMemoryDataAdapter();
      const release = deferred();
      const original = adapter.stat.bind(adapter);
      vi.spyOn(adapter, "stat").mockImplementation(async (path) => {
        await release.promise;
        return original(path);
      });
      const watcher = new DirectoryWatcher(adapter, 5);
      const seen = vi.fn();
      watcher.on("all", seen);
      watcher.watch("/");
      let done = false;
      const closing = Promise.resolve(watcher.close()).then(() => {
        done = true;
      });
      await Promise.resolve();
      expect(done).toBe(false);
      release.resolve();
      await closing;
      await vi.advanceTimersByTimeAsync(50);
      expect(seen).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
  it("retains the previous complete poll after a partial scan fails", async () => {
    vi.useFakeTimers();
    try {
      const adapter = new InMemoryDataAdapter();
      await adapter.mkdir("notes");
      await adapter.write("notes/retained.md", "body");
      const watcher = new DirectoryWatcher(adapter, 5);
      const seen: Array<ChangeEvent | WatchErrorEvent> = [];
      watcher.on("all", (event) => seen.push(event));
      watcher.watch("/", { recursive: true });
      await vi.advanceTimersByTimeAsync(1);
      const list = adapter.list.bind(adapter);
      vi.spyOn(adapter, "list")
        .mockImplementationOnce(() =>
          Promise.reject(new Error("scan incomplete")),
        )
        .mockImplementation(list);
      await vi.advanceTimersByTimeAsync(5);
      expect(seen.map((event) => event.type)).toEqual(["error"]);
      await vi.advanceTimersByTimeAsync(5);
      expect(seen.map((event) => event.type)).toEqual(["error"]);
      await watcher.close();
    } finally {
      vi.useRealTimers();
    }
  });
});
