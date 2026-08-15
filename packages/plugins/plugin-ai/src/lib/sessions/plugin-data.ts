import {
  mergeAiSettings,
  type AiPluginSettings,
} from "../settings/ai-settings";
import type { StoredAgentSession } from "./session-store";

export type AiPluginData = {
  settings: AiPluginSettings;
  sessions: StoredAgentSession[];
};

export function parseAiPluginData(value: unknown): AiPluginData {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { settings: mergeAiSettings(null), sessions: [] };
  }
  const record = value as Record<string, unknown>;
  const settingsSource =
    record.settings && typeof record.settings === "object"
      ? record.settings
      : record;
  return {
    settings: mergeAiSettings(settingsSource as Partial<AiPluginSettings>),
    sessions: Array.isArray(record.sessions)
      ? record.sessions.filter(isStoredAgentSession)
      : [],
  };
}

function isStoredAgentSession(value: unknown): value is StoredAgentSession {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.runtime === "string" &&
    typeof record.runtimeSessionId === "string" &&
    Array.isArray(record.items)
  );
}
