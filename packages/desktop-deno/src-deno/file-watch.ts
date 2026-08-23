import { resolveAbsolutePath, toVaultRelativePath } from "./paths.ts";
import type { RendererNativeEvent } from "./renderer-events.ts";

type WatchPayload = {
  watchId?: unknown;
  rootPath?: unknown;
  normalizedPath?: unknown;
  recursive?: unknown;
};

type WatchEvent = {
  kind: string;
  paths: string[];
};

type FileWatcher = AsyncIterable<WatchEvent> & { close(): void };
type WatchFactory = (
  path: string,
  options: { recursive: boolean },
) => FileWatcher;
type Emit = (event: RendererNativeEvent) => Promise<void>;
type RealPath = (path: string) => string;

function boundedString(value: unknown, label: string, limit = 8_192): string {
  if (typeof value !== "string" || !value.trim() || value.length > limit) {
    throw new Error(`Invalid Deno file watch ${label}`);
  }
  return value;
}

export function mapDenoWatchEvent(
  rootPath: string,
  event: WatchEvent,
): Array<{ type: "create" | "modify" | "delete"; path: string }> {
  const type =
    event.kind === "create"
      ? "create"
      : event.kind === "modify"
        ? "modify"
        : event.kind === "rename"
          ? "modify"
        : event.kind === "remove"
          ? "delete"
          : null;
  if (!type) return [];
  return event.paths.flatMap((path) => {
    const relative = toVaultRelativePath(rootPath, path);
    if (!relative || /\.tmp-[0-9a-f-]{36}$/iu.test(relative)) return [];
    return [{ type, path: relative }];
  });
}

export class DenoFileWatchService {
  readonly #watchers = new Map<string, FileWatcher>();

  constructor(
    private readonly emit: Emit,
    private readonly watch: WatchFactory = (path, options) =>
      Deno.watchFs(path, options),
    private readonly realPath: RealPath = (path) => Deno.realPathSync(path),
  ) {}

  start(payload: WatchPayload): { watchId: string } {
    const watchId = boundedString(payload.watchId, "id", 200);
    const rootPath = boundedString(payload.rootPath, "root path", 4_000);
    const normalizedPath =
      typeof payload.normalizedPath === "string" ? payload.normalizedPath : "";
    this.stop(watchId);
    // macOS watcher events use canonical /private/var paths even when the
    // caller opened the same vault through /var. Canonicalize both sides so
    // containment checks do not silently discard valid events.
    const canonicalRootPath = this.realPath(rootPath);
    const watchedPath = this.realPath(
      resolveAbsolutePath(rootPath, normalizedPath),
    );
    const watcher = this.watch(watchedPath, {
      recursive: payload.recursive !== false,
    });
    this.#watchers.set(watchId, watcher);
    void this.#consume(watchId, canonicalRootPath, normalizedPath, watcher);
    return { watchId };
  }

  stop(watchId: string): void {
    const watcher = this.#watchers.get(watchId);
    if (!watcher) return;
    this.#watchers.delete(watchId);
    watcher.close();
  }

  shutdown(): void {
    for (const watcher of this.#watchers.values()) watcher.close();
    this.#watchers.clear();
  }

  async #consume(
    watchId: string,
    rootPath: string,
    normalizedPath: string,
    watcher: FileWatcher,
  ): Promise<void> {
    try {
      for await (const event of watcher) {
        if (this.#watchers.get(watchId) !== watcher) return;
        for (const mapped of mapDenoWatchEvent(rootPath, event)) {
          await this.emit({
            channel: "desktop_fs_watch_event",
            payload: { watchId, event: mapped },
          });
        }
      }
    } catch (error) {
      if (this.#watchers.get(watchId) !== watcher) return;
      await this.emit({
        channel: "desktop_fs_watch_event",
        payload: {
          watchId,
          event: {
            type: "error",
            path: normalizedPath || "/",
            error: error instanceof Error ? error.message : String(error),
          },
        },
      });
    } finally {
      if (this.#watchers.get(watchId) === watcher) {
        this.#watchers.delete(watchId);
        watcher.close();
      }
    }
  }
}
