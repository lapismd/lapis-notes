import type { AiThinkingLevel } from "../core/types";
import {
  DEFAULT_ACP_AGENT,
  normalizeAcpAgent,
  type AcpAgentId,
} from "./acp-agents";

export type AiPluginSettings = {
  defaultRuntime: "auto" | "acp" | "codex-native" | "fake";
  acpAgent: AcpAgentId;
  defaultModels: Record<AcpAgentId, string>;
  /** Active-agent compatibility alias. Persisted model ownership lives in defaultModels. */
  defaultModel: string;
  thinking: AiThinkingLevel;
};

export const DEFAULT_AI_SETTINGS: AiPluginSettings = {
  defaultRuntime: "auto",
  acpAgent: DEFAULT_ACP_AGENT,
  defaultModels: {
    codex: "gpt-5.6-sol",
    cursor: "",
  },
  defaultModel: "gpt-5.6-sol",
  thinking: "medium",
};

const THINKING_LEVELS = new Set<AiThinkingLevel>([
  "off",
  "low",
  "medium",
  "high",
]);

export function mergeAiSettings(
  value: Partial<AiPluginSettings> | null | undefined,
): AiPluginSettings {
  const acpAgent = normalizeAcpAgent(value?.acpAgent);
  const storedModels = value?.defaultModels;
  const legacyModel = value?.defaultModel?.trim();
  const defaultModels: Record<AcpAgentId, string> = {
    codex:
      storedModels?.codex?.trim() ||
      legacyModel ||
      DEFAULT_AI_SETTINGS.defaultModels.codex,
    cursor: storedModels?.cursor?.trim() || "",
  };
  const thinking = value?.thinking;
  return {
    defaultRuntime: value?.defaultRuntime ?? DEFAULT_AI_SETTINGS.defaultRuntime,
    acpAgent,
    defaultModels,
    defaultModel: defaultModels[acpAgent],
    thinking:
      thinking && THINKING_LEVELS.has(thinking)
        ? thinking
        : DEFAULT_AI_SETTINGS.thinking,
  };
}
