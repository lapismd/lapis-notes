import { describe, expect, it } from "vitest";
import { DEFAULT_HISTORY_SETTINGS } from "./history-settings";
import { isHistoryTrackedFile } from "./history-tracking";

function file(path: string, size = 32, extension?: string) {
  const name = path.split("/").at(-1) ?? path;
  return {
    path,
    extension:
      extension ??
      (name.includes(".") ? name.slice(name.lastIndexOf(".") + 1) : ""),
    stat: { size, mtime: 1, ctime: 1 },
  } as never;
}

describe("history tracking", () => {
  it("skips internal, excluded, oversized, and binary files", () => {
    expect(
      isHistoryTrackedFile(file("Notes/Welcome.md"), DEFAULT_HISTORY_SETTINGS),
    ).toBe(true);
    expect(
      isHistoryTrackedFile(file(".lapis/agents/chat.json"), DEFAULT_HISTORY_SETTINGS),
    ).toBe(false);
    expect(
      isHistoryTrackedFile(file(".jj/repo"), DEFAULT_HISTORY_SETTINGS),
    ).toBe(false);
    expect(
      isHistoryTrackedFile(file(".git/config"), DEFAULT_HISTORY_SETTINGS),
    ).toBe(false);
    expect(
      isHistoryTrackedFile(file("photo.png"), DEFAULT_HISTORY_SETTINGS),
    ).toBe(false);
    expect(
      isHistoryTrackedFile(
        file("Notes/Welcome.md", 300_000),
        DEFAULT_HISTORY_SETTINGS,
      ),
    ).toBe(false);
  });

  it("honors an optional extension allowlist", () => {
    const settings = {
      ...DEFAULT_HISTORY_SETTINGS,
      trackedExtensions: ["md"],
    };

    expect(isHistoryTrackedFile(file("note.md"), settings)).toBe(true);
    expect(isHistoryTrackedFile(file("data.json"), settings)).toBe(false);
  });

  it("honors an optional include-glob allowlist after excludes", () => {
    const settings = {
      ...DEFAULT_HISTORY_SETTINGS,
      includeGlobs: ["Notes/**"],
    };

    expect(isHistoryTrackedFile(file("Notes/Welcome.md"), settings)).toBe(true);
    expect(isHistoryTrackedFile(file("Projects/plan.md"), settings)).toBe(
      false,
    );
    expect(
      isHistoryTrackedFile(file(".obsidian/app.json"), {
        ...settings,
        includeGlobs: [".obsidian/**"],
      }),
    ).toBe(false);
  });
});
