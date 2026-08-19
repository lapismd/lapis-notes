import { describe, expect, it, vi } from "vitest";

const notice = vi.hoisted(() => vi.fn());

vi.mock("@lapis-notes/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@lapis-notes/api")>();
  return {
    ...actual,
    Notice: class {
      constructor(message: string) {
        notice(message);
      }
    },
  };
});

import {
  activateBookmark,
  bookmarkableTarget,
  isAllowedBookmarkUrl,
} from "./activate-bookmark";

describe("activateBookmark", () => {
  it("allows only http and https urls", () => {
    expect(isAllowedBookmarkUrl("https://example.com")).toBe(true);
    expect(isAllowedBookmarkUrl("javascript:alert(1)")).toBe(false);
    expect(isAllowedBookmarkUrl("file:///etc/passwd")).toBe(false);
  });

  it("notices a missing file and does not open a leaf", async () => {
    const openFile = vi.fn();
    await activateBookmark(
      {
        vault: { getFileByPath: () => null },
        openFile,
      } as never,
      { type: "file", ctime: 1, path: "missing.md" },
    );
    expect(openFile).not.toHaveBeenCalled();
    expect(notice).toHaveBeenCalled();
  });

  it("opens allowed urls and notices disallowed schemes", async () => {
    const openUrl = vi.fn();
    await activateBookmark(
      {} as never,
      { type: "url", ctime: 1, url: "https://example.com" },
      openUrl,
    );
    expect(openUrl).toHaveBeenCalledWith("https://example.com");
  });

  it("reads a search leaf as a bookmarkable target", () => {
    const target = bookmarkableTarget({
      workspace: {
        getActiveFile: () => null,
        activeLeaf: {
          view: {
            getViewType: () => "search",
            getState: () => ({ query: "tag:#work" }),
          },
        },
      },
    } as never);
    expect(target).toEqual({ kind: "search", query: "tag:#work" });
  });
});
