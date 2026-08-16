import { describe, expect, it } from "vitest";
import {
  DEFAULT_HISTORY_SETTINGS,
  mergeHistorySettings,
  patchHistorySettings,
} from "./history-settings";

describe("history settings", () => {
  it("restores default excludes when the stored list is empty", () => {
    const settings = mergeHistorySettings({
      retentionCount: 20,
      excludeGlobs: [],
    });

    expect(settings.retentionCount).toBe(20);
    expect(settings.excludeGlobs).toEqual(DEFAULT_HISTORY_SETTINGS.excludeGlobs);
    expect(settings.includeGlobs).toEqual([]);
    expect(settings.trackedExtensions).toEqual([]);
    expect(DEFAULT_HISTORY_SETTINGS.excludeGlobs).toContain("**/.jj/**");
  });

  it("normalizes extension and glob lists", () => {
    const settings = patchHistorySettings(DEFAULT_HISTORY_SETTINGS, {
      trackedExtensions: [".MD", "json", " json "],
      excludeGlobs: ["tmp/**", " tmp/** "],
      includeGlobs: ["Notes/**", " notes/** "],
    });

    expect(settings.trackedExtensions).toEqual(["md", "json"]);
    expect(settings.excludeGlobs).toEqual(["tmp/**"]);
    expect(settings.includeGlobs).toEqual(["Notes/**", "notes/**"]);
  });
});
