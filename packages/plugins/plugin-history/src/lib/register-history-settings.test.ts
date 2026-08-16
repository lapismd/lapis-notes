import { describe, expect, it } from "vitest";
import { DEFAULT_HISTORY_SETTINGS } from "./history-settings";
import {
  HISTORY_SETTING_IDS,
  HISTORY_SETTINGS_SECTION_ID,
  createHistorySettingsSection,
  historyFieldValuesToPatch,
  historySettingsToFieldValues,
} from "./register-history-settings";

describe("history settings section", () => {
  it("registers exclude, include, and capture-cap fields", () => {
    const section = createHistorySettingsSection();

    expect(section.id).toBe(HISTORY_SETTINGS_SECTION_ID);
    expect(section.title).toBe("History");
    expect(section.navigationGroupId).toBe("core-plugins");
    expect(section.fields.map((field) => field.id)).toEqual([
      HISTORY_SETTING_IDS.excludeGlobs,
      HISTORY_SETTING_IDS.includeGlobs,
      HISTORY_SETTING_IDS.trackedExtensions,
      HISTORY_SETTING_IDS.retentionCount,
      HISTORY_SETTING_IDS.maxFileSizeKib,
      HISTORY_SETTING_IDS.mergeWindowSeconds,
      HISTORY_SETTING_IDS.debounceMs,
    ]);
    expect(
      section.fields.find((field) => field.id === HISTORY_SETTING_IDS.excludeGlobs),
    ).toMatchObject({
      type: "list",
      itemType: "string",
      default: DEFAULT_HISTORY_SETTINGS.excludeGlobs,
    });
    expect(
      section.fields.find((field) => field.id === HISTORY_SETTING_IDS.includeGlobs),
    ).toMatchObject({
      type: "list",
      itemType: "string",
      default: [],
    });
  });

  it("converts size and merge-window units at the settings boundary", () => {
    const values = historySettingsToFieldValues({
      ...DEFAULT_HISTORY_SETTINGS,
      maxFileSizeBytes: 512 * 1024,
      mergeWindowMs: 15_000,
      includeGlobs: ["Notes/**"],
    });

    expect(values[HISTORY_SETTING_IDS.maxFileSizeKib]).toBe(512);
    expect(values[HISTORY_SETTING_IDS.mergeWindowSeconds]).toBe(15);
    expect(values[HISTORY_SETTING_IDS.includeGlobs]).toEqual(["Notes/**"]);

    expect(
      historyFieldValuesToPatch({
        ...values,
        [HISTORY_SETTING_IDS.maxFileSizeKib]: 128,
        [HISTORY_SETTING_IDS.mergeWindowSeconds]: 8,
        [HISTORY_SETTING_IDS.includeGlobs]: ["Projects/**"],
        [HISTORY_SETTING_IDS.trackedExtensions]: ["md", "json"],
      }),
    ).toEqual({
      excludeGlobs: DEFAULT_HISTORY_SETTINGS.excludeGlobs,
      includeGlobs: ["Projects/**"],
      trackedExtensions: ["md", "json"],
      retentionCount: DEFAULT_HISTORY_SETTINGS.retentionCount,
      maxFileSizeBytes: 128 * 1024,
      mergeWindowMs: 8_000,
      debounceMs: DEFAULT_HISTORY_SETTINGS.debounceMs,
    });
  });
});
