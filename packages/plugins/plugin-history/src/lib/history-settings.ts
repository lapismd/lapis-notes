export interface HistoryPluginSettings {
  retentionCount: number;
  debounceMs: number;
  mergeWindowMs: number;
  maxFileSizeBytes: number;
  excludeGlobs: string[];
  includeGlobs: string[];
  trackedExtensions: string[];
}

export type HistoryPluginSettingsPatch = Partial<HistoryPluginSettings>;

export const DEFAULT_HISTORY_EXCLUDE_GLOBS = [
  ".obsidian/**",
  ".lapis/**",
  "**/.git/**",
  "**/.jj/**",
] as const;

export const DEFAULT_HISTORY_SETTINGS: HistoryPluginSettings = {
  retentionCount: 50,
  debounceMs: 500,
  mergeWindowMs: 10_000,
  maxFileSizeBytes: 256 * 1024,
  excludeGlobs: [...DEFAULT_HISTORY_EXCLUDE_GLOBS],
  includeGlobs: [],
  trackedExtensions: [],
};

function normalizeStringList(values: string[] | undefined): string[] {
  return [
    ...new Set(
      (values ?? [])
        .flatMap((value) => value.split(","))
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
}

function normalizeExtensions(values: string[] | undefined): string[] {
  return [
    ...new Set(
      normalizeStringList(values).map((value) =>
        value.toLowerCase().replace(/^\.+/u, ""),
      ),
    ),
  ];
}

export function mergeHistorySettings(
  stored: Partial<HistoryPluginSettings> | null | undefined,
): HistoryPluginSettings {
  return {
    retentionCount: Math.max(
      1,
      Math.round(
        stored?.retentionCount ?? DEFAULT_HISTORY_SETTINGS.retentionCount,
      ),
    ),
    debounceMs: Math.max(
      0,
      Math.round(stored?.debounceMs ?? DEFAULT_HISTORY_SETTINGS.debounceMs),
    ),
    mergeWindowMs: Math.max(
      0,
      Math.round(
        stored?.mergeWindowMs ?? DEFAULT_HISTORY_SETTINGS.mergeWindowMs,
      ),
    ),
    maxFileSizeBytes: Math.max(
      1,
      Math.round(
        stored?.maxFileSizeBytes ?? DEFAULT_HISTORY_SETTINGS.maxFileSizeBytes,
      ),
    ),
    excludeGlobs:
      normalizeStringList(stored?.excludeGlobs).length > 0
        ? normalizeStringList(stored?.excludeGlobs)
        : [...DEFAULT_HISTORY_SETTINGS.excludeGlobs],
    includeGlobs: normalizeStringList(stored?.includeGlobs),
    trackedExtensions: normalizeExtensions(stored?.trackedExtensions),
  };
}

export function patchHistorySettings(
  current: HistoryPluginSettings,
  patch: HistoryPluginSettingsPatch,
): HistoryPluginSettings {
  return mergeHistorySettings({
    ...current,
    ...patch,
  });
}
