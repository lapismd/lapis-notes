import { describe, expect, it, vi } from "vitest";

import { DenoFileWatchService, mapDenoWatchEvent } from "./file-watch";

describe("Deno native file watch", () => {
  it("maps contained create, modify, and remove events", () => {
    expect(
      mapDenoWatchEvent("/vault", {
        kind: "create",
        paths: ["/vault/a.md", "/outside/b.md"],
      }),
    ).toEqual([{ type: "create", path: "a.md" }]);
    expect(
      mapDenoWatchEvent("/vault", {
        kind: "modify",
        paths: ["/vault/folder/a.md"],
      }),
    ).toEqual([{ type: "modify", path: "folder/a.md" }]);
    expect(
      mapDenoWatchEvent("/vault", {
        kind: "remove",
        paths: ["/vault/a.md"],
      }),
    ).toEqual([{ type: "delete", path: "a.md" }]);
  });

  it("ignores access and other watcher events", () => {
    expect(
      mapDenoWatchEvent("/vault", {
        kind: "access",
        paths: ["/vault/a.md"],
      }),
    ).toEqual([]);
  });

  it("maps atomic renames to final modifications and filters temp writes", () => {
    expect(
      mapDenoWatchEvent("/vault", {
        kind: "rename",
        paths: [
          "/vault/note.md",
          "/vault/note.md.tmp-123e4567-e89b-12d3-a456-426614174000",
        ],
      }),
    ).toEqual([{ type: "modify", path: "note.md" }]);
  });

  it("canonicalizes symlinked vault paths before watching and mapping", () => {
    const close = vi.fn();
    const watcher = {
      close,
      [Symbol.asyncIterator]() {
        return {
          next: () => new Promise<IteratorResult<never>>(() => {}),
        };
      },
    };
    const watch = vi.fn(() => watcher);
    const realPath = vi.fn((path: string) => `/private${path}`);
    const service = new DenoFileWatchService(vi.fn(), watch, realPath);

    service.start({
      watchId: "watch-1",
      rootPath: "/var/vault",
      normalizedPath: "folder",
      recursive: true,
    });

    expect(realPath).toHaveBeenNthCalledWith(1, "/var/vault");
    expect(realPath).toHaveBeenNthCalledWith(2, "/var/vault/folder");
    expect(watch).toHaveBeenCalledWith("/private/var/vault/folder", {
      recursive: true,
    });
    service.shutdown();
    expect(close).toHaveBeenCalledOnce();
  });
});
