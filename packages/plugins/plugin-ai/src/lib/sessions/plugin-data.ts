import {
  mergeAiSettings,
  type AiPluginSettings,
} from "../settings/ai-settings";

export type AiPluginData = {
  settings: AiPluginSettings;
  source: Record<string, unknown>;
};

export function parseAiPluginData(value: unknown): AiPluginData {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { settings: mergeAiSettings(null), source: {} };
  }
  const record = value as Record<string, unknown>;
  const settingsSource =
    record.settings && typeof record.settings === "object"
      ? record.settings
      : record;
  return {
    settings: mergeAiSettings(settingsSource as Partial<AiPluginSettings>),
    source: structuredClone(record),
  };
}

export function serializeAiPluginData(
  data: AiPluginData,
): Record<string, unknown> {
  const settings = structuredClone(data.settings);
  if (settings.enabledCommunityToolPluginIds.length === 0) {
    delete (settings as { enabledCommunityToolPluginIds?: string[] })
      .enabledCommunityToolPluginIds;
  }
  return {
    ...structuredClone(data.source),
    settings,
  };
}

export function equalAiPluginData(
  left: AiPluginData,
  right: AiPluginData,
): boolean {
  return (
    JSON.stringify(serializeAiPluginData(left)) ===
    JSON.stringify(serializeAiPluginData(right))
  );
}
