import type { AiThinkingLevel } from "../core/types";
import {
  DEFAULT_ACP_AGENT,
  normalizeAcpAgent,
  type AcpAgentId,
} from "./acp-agents";

export type AiPluginSettings = {
  defaultRuntime: "auto" | "acp" | "codex-native" | "fake";
  acpAgent: AcpAgentId;
  defaultModel: string;
  thinking: AiThinkingLevel;
};

export const DEFAULT_AI_SETTINGS: AiPluginSettings = {
  defaultRuntime: "auto",
  acpAgent: DEFAULT_ACP_AGENT,
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
  const thinking = value?.thinking;
  return {
    defaultRuntime: value?.defaultRuntime ?? DEFAULT_AI_SETTINGS.defaultRuntime,
    acpAgent: normalizeAcpAgent(value?.acpAgent),
    defaultModel:
      value?.defaultModel?.trim() || DEFAULT_AI_SETTINGS.defaultModel,
    thinking: thinking && THINKING_LEVELS.has(thinking)
      ? thinking
      : DEFAULT_AI_SETTINGS.thinking,
  };
}
