import type { Plugin } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import type { HistoryPlugin } from "./history-plugin";
import {
  DEFAULT_HISTORY_SETTINGS,
  patchHistorySettings,
  type HistoryPluginSettings,
  type HistoryPluginSettingsPatch,
} from "./history-settings";

export const HISTORY_SETTING_IDS = {
  excludeGlobs: "history.excludeGlobs",
  includeGlobs: "history.includeGlobs",
  trackedExtensions: "history.trackedExtensions",
  retentionCount: "history.retentionCount",
  maxFileSizeKib: "history.maxFileSizeKib",
  mergeWindowSeconds: "history.mergeWindowSeconds",
  debounceMs: "history.debounceMs",
} as const;

export const HISTORY_SETTINGS_SECTION_ID = "history";

export interface HistorySettingsFieldValues {
  [HISTORY_SETTING_IDS.excludeGlobs]: string[];
  [HISTORY_SETTING_IDS.includeGlobs]: string[];
  [HISTORY_SETTING_IDS.trackedExtensions]: string[];
  [HISTORY_SETTING_IDS.retentionCount]: number;
  [HISTORY_SETTING_IDS.maxFileSizeKib]: number;
  [HISTORY_SETTING_IDS.mergeWindowSeconds]: number;
  [HISTORY_SETTING_IDS.debounceMs]: number;
}

function bytesToKib(bytes: number): number {
  return Math.max(1, Math.round(bytes / 1024));
}

function kibToBytes(kib: number): number {
  return Math.max(1, Math.round(kib) * 1024);
}

function msToSeconds(ms: number): number {
  return Math.max(0, Math.round(ms / 1000));
}

function secondsToMs(seconds: number): number {
  return Math.max(0, Math.round(seconds) * 1000);
}

function asStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function asInteger(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(value)
    : fallback;
}

function listsEqual(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    left.every((entry, index) => entry === right[index])
  );
}

export function historySettingsToFieldValues(
  settings: HistoryPluginSettings,
): HistorySettingsFieldValues {
  return {
    [HISTORY_SETTING_IDS.excludeGlobs]: [...settings.excludeGlobs],
    [HISTORY_SETTING_IDS.includeGlobs]: [...settings.includeGlobs],
    [HISTORY_SETTING_IDS.trackedExtensions]: [...settings.trackedExtensions],
    [HISTORY_SETTING_IDS.retentionCount]: settings.retentionCount,
    [HISTORY_SETTING_IDS.maxFileSizeKib]: bytesToKib(settings.maxFileSizeBytes),
    [HISTORY_SETTING_IDS.mergeWindowSeconds]: msToSeconds(
      settings.mergeWindowMs,
    ),
    [HISTORY_SETTING_IDS.debounceMs]: settings.debounceMs,
  };
}

export function historyFieldValuesToPatch(
  values: Record<string, unknown>,
): HistoryPluginSettingsPatch {
  return {
    excludeGlobs: asStringList(values[HISTORY_SETTING_IDS.excludeGlobs]),
    includeGlobs: asStringList(values[HISTORY_SETTING_IDS.includeGlobs]),
    trackedExtensions: asStringList(
      values[HISTORY_SETTING_IDS.trackedExtensions],
    ),
    retentionCount: asInteger(
      values[HISTORY_SETTING_IDS.retentionCount],
      DEFAULT_HISTORY_SETTINGS.retentionCount,
    ),
    maxFileSizeBytes: kibToBytes(
      asInteger(
        values[HISTORY_SETTING_IDS.maxFileSizeKib],
        bytesToKib(DEFAULT_HISTORY_SETTINGS.maxFileSizeBytes),
      ),
    ),
    mergeWindowMs: secondsToMs(
      asInteger(
        values[HISTORY_SETTING_IDS.mergeWindowSeconds],
        msToSeconds(DEFAULT_HISTORY_SETTINGS.mergeWindowMs),
      ),
    ),
    debounceMs: asInteger(
      values[HISTORY_SETTING_IDS.debounceMs],
      DEFAULT_HISTORY_SETTINGS.debounceMs,
    ),
  };
}

export function createHistorySettingsSection() {
  const defaults = historySettingsToFieldValues(DEFAULT_HISTORY_SETTINGS);
  return {
    id: HISTORY_SETTINGS_SECTION_ID,
    title: "History",
    description:
      "Which vault files to snapshot and how long to keep those revisions.",
    icon: "history" as const,
    order: 40,
    navigationGroupId: "core-plugins",
    sourcePluginId: "history",
    fields: [
      {
        id: HISTORY_SETTING_IDS.excludeGlobs,
        type: "list" as const,
        itemType: "string" as const,
        title: "Exclude globs",
        description:
          "Skip matching paths. Clearing the list restores the default .obsidian, .lapis, .git, and .jj excludes.",
        default: defaults[HISTORY_SETTING_IDS.excludeGlobs],
      },
      {
        id: HISTORY_SETTING_IDS.includeGlobs,
        type: "list" as const,
        itemType: "string" as const,
        title: "Include globs",
        description:
          "Optional path allowlist. Leave empty to snapshot remaining paths after excludes.",
        default: defaults[HISTORY_SETTING_IDS.includeGlobs],
      },
      {
        id: HISTORY_SETTING_IDS.trackedExtensions,
        type: "list" as const,
        itemType: "string" as const,
        title: "Included extensions",
        description:
          "Optional extension allowlist without dots. Leave empty to snapshot remaining UTF-8 text under the size cap.",
        default: defaults[HISTORY_SETTING_IDS.trackedExtensions],
      },
      {
        id: HISTORY_SETTING_IDS.retentionCount,
        type: "integer" as const,
        title: "Revisions per file",
        description: "Maximum stored snapshots for one path.",
        default: defaults[HISTORY_SETTING_IDS.retentionCount],
        minimum: 1,
        maximum: 200,
        step: 1,
      },
      {
        id: HISTORY_SETTING_IDS.maxFileSizeKib,
        type: "integer" as const,
        title: "Maximum file size (KiB)",
        description: "Files larger than this are not snapshotted.",
        default: defaults[HISTORY_SETTING_IDS.maxFileSizeKib],
        minimum: 1,
        maximum: 2048,
        step: 1,
      },
      {
        id: HISTORY_SETTING_IDS.mergeWindowSeconds,
        type: "integer" as const,
        title: "Merge window (seconds)",
        description:
          "Replace the latest modify for the same path when another modify arrives inside this window.",
        default: defaults[HISTORY_SETTING_IDS.mergeWindowSeconds],
        minimum: 0,
        maximum: 120,
        step: 1,
      },
      {
        id: HISTORY_SETTING_IDS.debounceMs,
        type: "integer" as const,
        title: "Capture debounce (ms)",
        description: "Delay before create and modify snapshots are stored.",
        default: defaults[HISTORY_SETTING_IDS.debounceMs],
        minimum: 0,
        maximum: 5000,
        step: 50,
      },
    ],
  };
}

function fieldValuesEqual(
  left: unknown,
  right: unknown,
): boolean {
  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length &&
      left.every((entry, index) => entry === right[index])
    );
  }
  return left === right;
}

const HISTORY_LIST_SETTING_IDS = new Set<string>([
  HISTORY_SETTING_IDS.excludeGlobs,
  HISTORY_SETTING_IDS.includeGlobs,
  HISTORY_SETTING_IDS.trackedExtensions,
]);

function applyHistorySettingsToController(
  controller: {
    settings: {
      get(id: string): unknown;
      update(id: string, value: unknown): boolean;
    };
  },
  settings: HistoryPluginSettings,
  options: { lists?: boolean } = { lists: true },
): void {
  const values = historySettingsToFieldValues(settings);
  for (const [id, value] of Object.entries(values)) {
    if (!options.lists && HISTORY_LIST_SETTING_IDS.has(id)) {
      continue;
    }
    if (!fieldValuesEqual(controller.settings.get(id), value)) {
      controller.settings.update(id, value);
    }
  }
}

function historySettingsEqual(
  left: HistoryPluginSettings,
  right: HistoryPluginSettings,
): boolean {
  return (
    left.retentionCount === right.retentionCount &&
    left.debounceMs === right.debounceMs &&
    left.mergeWindowMs === right.mergeWindowMs &&
    left.maxFileSizeBytes === right.maxFileSizeBytes &&
    listsEqual(left.excludeGlobs, right.excludeGlobs) &&
    listsEqual(left.includeGlobs, right.includeGlobs) &&
    listsEqual(left.trackedExtensions, right.trackedExtensions)
  );
}

export function registerHistorySettings(plugin: HistoryPlugin & Plugin): void {
  const binding = getWorkspaceHostBinding(plugin.app.workspace);
  if (!binding) return;
  const controller = binding.controller;
  const settings = plugin.getSettings();

  plugin.register(
    controller.registerSettingsSection(createHistorySettingsSection()),
  );
  applyHistorySettingsToController(controller, settings);

  const changeRef = controller.settings.on("change", (event) => {
    if (!event.id || !event.id.startsWith("history.")) return;
    const patch = historyFieldValuesToPatch(
      controller.settings.getSnapshot().values,
    );
    const current = plugin.getSettings();
    const next = patchHistorySettings(current, patch);
    void (async () => {
      if (!historySettingsEqual(current, next)) {
        await plugin.updateSettings(patch);
      }
      const saved = plugin.getSettings();
      applyHistorySettingsToController(controller, saved, { lists: false });
      const excludeDraft = asStringList(
        controller.settings.get(HISTORY_SETTING_IDS.excludeGlobs),
      );
      if (
        excludeDraft.every((entry) => entry.trim().length === 0) &&
        listsEqual(saved.excludeGlobs, DEFAULT_HISTORY_SETTINGS.excludeGlobs)
      ) {
        controller.settings.update(
          HISTORY_SETTING_IDS.excludeGlobs,
          saved.excludeGlobs,
        );
      }
    })();
  });
  plugin.register(() => controller.settings.offref(changeRef));
}
