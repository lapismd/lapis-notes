export type AiPluginSettings = {
  defaultRuntime: "auto" | "acp" | "codex-native" | "fake";
  acpAgent: string;
};

export const DEFAULT_AI_SETTINGS: AiPluginSettings = {
  defaultRuntime: "auto",
  acpAgent: "codex",
};

export function mergeAiSettings(
  value: Partial<AiPluginSettings> | null | undefined,
): AiPluginSettings {
  return {
    defaultRuntime: value?.defaultRuntime ?? DEFAULT_AI_SETTINGS.defaultRuntime,
    acpAgent: value?.acpAgent?.trim() || DEFAULT_AI_SETTINGS.acpAgent,
  };
}
