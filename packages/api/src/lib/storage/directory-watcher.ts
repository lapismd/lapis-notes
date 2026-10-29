import { EventDispatcher } from "$lib/events";
import { joinPath, normalizePath } from "./path";
import type {
  ChangeEvent,
  DataAdapter,
  NativeWatchAdapter,
  NativeWatchSubscription,
  Stat,
  VaultAdapter,
  WatchErrorEvent,
  WatchOptions,
} from "./fs";

type WatchState = {
  path: string;
  recursive: boolean;
  interval: number;
  active: boolean;
  registering: boolean;
  snapshot: Map<string, Stat> | null;
  timeout: ReturnType<typeof setTimeout> | null;
  native: NativeWatchSubscription | null;
  pending: Promise<void>;
  closing?: Promise<void>;
};

async function drain(operations: Array<void | Promise<void>>): Promise<void> {
  const results = await Promise.allSettled(operations);
  const failed = results.find((result) => result.status === "rejected");
  if (failed?.status === "rejected") throw failed.reason;
}

export class DirectoryWatcher extends EventDispatcher<{
  error: [{ error: unknown; path: string }];
  all: [event: ChangeEvent | WatchErrorEvent];
  create: [path: string];
  modify: [path: string];
  delete: [path: string];
}> {
  private watchers = new Map<string, WatchState>();
  private retired = new Set<WatchState>();

  constructor(
    readonly adapter: DataAdapter,
    readonly pollingInterval = 5000,
  ) {
    super();
  }

  watch(
    path: string | string[],
    options: WatchOptions = {},
  ): NativeWatchSubscription {
    if (Array.isArray(path)) {
      const subscriptions = path.map((entry) => this.watch(entry, options));
      const ready = Promise.all(subscriptions.map((entry) => entry.ready)).then(
        () => {},
      );
      void ready.catch(() => {});
      return {
        ready,
        close: () => drain(subscriptions.map(async (entry) => entry.close())),
      };
    }
    path = normalizePath(path);
    const previous = this.watchers.get(path);
    if (previous) void this.retire(previous).catch(() => {});
    const state: WatchState = {
      path,
      recursive: options.recursive ?? false,
      interval: options.interval ?? this.pollingInterval,
      active: true,
      registering: false,
      snapshot: null,
      timeout: null,
      native: null,
      pending: Promise.resolve(),
    };
    this.watchers.set(path, state);
    let ready = Promise.resolve();
    const adapter = this.adapter as Partial<VaultAdapter> &
      Partial<NativeWatchAdapter>;
    if (
      typeof adapter.watch === "function" &&
      adapter.getCapabilities?.().nativeWatch === true
    ) {
      state.registering = true;
      try {
        state.native =
          adapter.watch(path, options, (event) => {
            if (!this.live(state)) return;
            this.deliver(
              event.type === "error"
                ? { ...event, path: this.eventPath(event.path) }
                : {
                    ...event,
                    path: this.eventPath(event.path),
                    ...(event.previousPath === undefined
                      ? {}
                      : { previousPath: this.eventPath(event.previousPath) }),
                  },
            );
          }) ?? null;
        ready = state.native?.ready ?? ready;
      } catch (error) {
        state.active = false;
        if (this.watchers.get(path) === state) this.watchers.delete(path);
        throw error;
      } finally {
        state.registering = false;
      }
    } else {
      state.pending = this.poll(state);
      ready = state.pending;
    }
    void ready.catch(() => {});
    return { ready, close: () => this.retire(state) };
  }

  unwatch(path: string): Promise<void> {
    path = normalizePath(path);
    return drain(
      [...new Set([...this.watchers.values(), ...this.retired])]
        .filter((state) => state.path === path)
        .map((state) => this.retire(state)),
    );
  }

  close(): Promise<void> {
    return drain(
      [...new Set([...this.watchers.values(), ...this.retired])].map((state) =>
        this.retire(state),
      ),
    );
  }

  private live(state: WatchState): boolean {
    return state.active && this.watchers.get(state.path) === state;
  }

  private retire(state: WatchState): Promise<void> {
    state.active = false;
    if (this.watchers.get(state.path) === state)
      this.watchers.delete(state.path);
    if (state.timeout) clearTimeout(state.timeout);
    state.timeout = null;
    if (state.closing) return state.closing;
    this.retired.add(state);
    let cleanup: void | Promise<void>;
    try {
      cleanup = state.registering
        ? Promise.resolve().then(() => state.native?.close())
        : state.native?.close();
    } catch (error) {
      cleanup = Promise.reject(error);
    }
    state.closing = drain([state.pending, cleanup]).then(() => {
      this.retired.delete(state);
    });
    void state.closing.catch(() => {
      state.closing = undefined;
    });
    return state.closing;
  }

  private deliver(event: ChangeEvent | WatchErrorEvent): void {
    this.dispatch("all", event);
    if (event.type === "error")
      this.dispatch("error", { error: event.error, path: event.path });
    else this.dispatch(event.type, event.path);
  }

  private eventPath(path: string): string {
    const normalized = normalizePath(path);
    return normalized === "/" ? "/" : normalized.replace(/^\/+/, "");
  }

  private async snapshot(
    path: string,
    recursive: boolean,
  ): Promise<Map<string, Stat>> {
    const snapshot = new Map<string, Stat>();
    const stats = await this.adapter.stat(path);
    if (!stats) return snapshot;
    snapshot.set(this.eventPath(path), stats);
    if (stats.type !== "folder") return snapshot;
    const { files, folders } = await this.adapter.list(path);
    for (const file of files) {
      const entry = joinPath(path, file);
      const stat = await this.adapter.stat(entry);
      if (stat) snapshot.set(this.eventPath(entry), stat);
    }
    for (const folder of folders) {
      const entry = joinPath(path, folder);
      if (recursive) {
        for (const [key, stat] of await this.snapshot(entry, true))
          snapshot.set(key, stat);
      } else {
        const stat = await this.adapter.stat(entry);
        if (stat) snapshot.set(this.eventPath(entry), stat);
      }
    }
    return snapshot;
  }

  private async poll(state: WatchState): Promise<void> {
    try {
      const next = await this.snapshot(state.path, state.recursive);
      if (!this.live(state)) return;
      if (state.snapshot) {
        const changes: ChangeEvent[] = [];
        for (const [path, stat] of next) {
          const previous = state.snapshot.get(path);
          if (!previous) changes.push({ type: "create", path });
          else if (
            previous.mtime !== stat.mtime ||
            previous.size !== stat.size ||
            previous.type !== stat.type
          )
            changes.push({ type: "modify", path });
        }
        for (const path of state.snapshot.keys())
          if (!next.has(path)) changes.push({ type: "delete", path });
        for (const event of changes) {
          if (!this.live(state)) break;
          this.deliver(event);
        }
      }
      state.snapshot = next;
    } catch (error) {
      if (this.live(state))
        this.deliver({ type: "error", path: state.path, error });
    } finally {
      if (this.live(state))
        state.timeout = setTimeout(() => {
          state.pending = this.poll(state);
        }, state.interval);
    }
  }
}
