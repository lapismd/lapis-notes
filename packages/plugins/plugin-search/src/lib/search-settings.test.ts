import { describe, expect, it } from "vitest";
import {
  DEFAULT_SEARCH_SETTINGS,
  mergeSearchSettings,
  patchSearchSettings,
} from "./search-settings";

describe("search settings", () => {
  it("merges stored values without mutating the defaults", () => {
    const settings = mergeSearchSettings({
      chunking: { targetChars: 800 },
      view: {
        ...DEFAULT_SEARCH_SETTINGS.view,
        matchCase: true,
        recentSearches: [" status:ready ", "", "status:ready", "tag:#work"],
      },
    });

    expect(settings.chunking.targetChars).toBe(800);
    expect(settings.chunking.breakpointWindowChars).toBe(
      DEFAULT_SEARCH_SETTINGS.chunking.breakpointWindowChars,
    );
    expect(settings.view.matchCase).toBe(true);
    expect(settings.view.recentSearches).toEqual(["status:ready", "tag:#work"]);
    expect(DEFAULT_SEARCH_SETTINGS.view.recentSearches).toEqual([]);
  });

  it("keeps recent searches unique and bounded", () => {
    const recentSearches = Array.from({ length: 14 }, (_, index) => `query-${index}`);
    const settings = patchSearchSettings(DEFAULT_SEARCH_SETTINGS, {
      view: { recentSearches },
    });

    expect(settings.view.recentSearches).toEqual(recentSearches.slice(0, 10));
    expect(settings.query).toEqual(DEFAULT_SEARCH_SETTINGS.query);
  });
});
