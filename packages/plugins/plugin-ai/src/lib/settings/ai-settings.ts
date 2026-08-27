import type { AiThinkingLevel } from "../core/types";
import {
  DEFAULT_ACP_AGENT,
  normalizeAcpAgent,
  type AcpAgentId,
} from "./acp-agents";

export type AppToolEnablementOwner = {
  pluginId: string;
  source: "core" | "community" | "official" | "system";
};

export type AppToolEnablementRef = {
  name: string;
  owner: AppToolEnablementOwner;
};

export type AiPluginSettings = {
  defaultRuntime: "auto" | "acp" | "codex-native" | "fake";
  acpAgent: AcpAgentId;
  defaultModels: Record<AcpAgentId, string>;
  /** Active-agent compatibility alias. Persisted model ownership lives in defaultModels. */
  defaultModel: string;
  thinking: AiThinkingLevel;
  memoryAutomaticRecall: boolean;
  memoryConsolidationEnabled: boolean;
  memoryConsolidationRuntime: "acp" | "codex-native";
  memoryConsolidationAgent: AcpAgentId;
  memoryConsolidationModel: string;
  handoffSummariesEnabled: boolean;
  handoffSummaryRuntime: "acp" | "codex-native";
  handoffSummaryAgent: AcpAgentId;
  handoffSummaryModel: string;
  appToolsEnabled: boolean;
  disabledAppToolNames: string[];
  enabledAppToolNames: string[];
  /** @deprecated Migrated into enabledAppToolNames; omitted from new writes when empty. */
  enabledCommunityToolPluginIds: string[];
};

export type StoredAiSettings = Partial<AiPluginSettings> & {
  enabledCommunityToolPluginIds?: string[];
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
  memoryAutomaticRecall: false,
  memoryConsolidationEnabled: false,
  memoryConsolidationRuntime: "acp",
  memoryConsolidationAgent: "codex",
  memoryConsolidationModel: "gpt-5.6-sol",
  handoffSummariesEnabled: false,
  handoffSummaryRuntime: "acp",
  handoffSummaryAgent: "codex",
  handoffSummaryModel: "gpt-5.6-sol",
  appToolsEnabled: true,
  disabledAppToolNames: [],
  enabledAppToolNames: [],
  enabledCommunityToolPluginIds: [],
};

export const APP_TOOL_SETTING_PREFIX = "ai.appTools.";

const THINKING_LEVELS = new Set<AiThinkingLevel>([
  "off",
  "low",
  "medium",
  "high",
]);

const LEGACY_FILE_TOOL_NAMES: Record<string, string> = {
  notes_read: "read",
  notes_patch: "edit",
};

function migrateLegacyFileToolName(name: string): string {
  return LEGACY_FILE_TOOL_NAMES[name] ?? name;
}

function normalizeNameList(value: readonly string[] | undefined): string[] {
  return [
    ...new Set(
      (value ?? [])
        .map((item) => migrateLegacyFileToolName(item.trim()))
        .filter(Boolean),
    ),
  ].sort();
}

export function isCommunityAppToolOwner(
  owner: AppToolEnablementOwner,
): boolean {
  return owner.source === "community";
}

export function appToolSettingId(toolName: string): string {
  return `${APP_TOOL_SETTING_PREFIX}${toolName}`;
}

export function isAppToolEnabled(
  tool: AppToolEnablementRef,
  settings: Pick<
    AiPluginSettings,
    | "disabledAppToolNames"
    | "enabledAppToolNames"
    | "enabledCommunityToolPluginIds"
  >,
): boolean {
  if (isCommunityAppToolOwner(tool.owner)) {
    return (
      settings.enabledAppToolNames.includes(tool.name) ||
      settings.enabledCommunityToolPluginIds.includes(tool.owner.pluginId)
    );
  }
  return !settings.disabledAppToolNames.includes(tool.name);
}

export function migrateLegacyCommunityToolOptIns(
  settings: AiPluginSettings,
  registeredTools: readonly AppToolEnablementRef[],
): AiPluginSettings {
  const leftover = settings.enabledCommunityToolPluginIds;
  if (leftover.length === 0) return settings;
  const opted = new Set(leftover);
  const names = new Set(settings.enabledAppToolNames);
  const seenOwners = new Set<string>();
  for (const tool of registeredTools) {
    if (
      !isCommunityAppToolOwner(tool.owner) ||
      !opted.has(tool.owner.pluginId)
    ) {
      continue;
    }
    names.add(tool.name);
    seenOwners.add(tool.owner.pluginId);
  }
  if (seenOwners.size === 0) return settings;
  return {
    ...settings,
    enabledAppToolNames: [...names].sort(),
    enabledCommunityToolPluginIds: leftover.filter(
      (pluginId) => !seenOwners.has(pluginId),
    ),
  };
}

export function applyAppToolEnablement(
  settings: AiPluginSettings,
  tool: AppToolEnablementRef,
  enabled: boolean,
  registeredTools: readonly AppToolEnablementRef[],
): Pick<
  AiPluginSettings,
  | "disabledAppToolNames"
  | "enabledAppToolNames"
  | "enabledCommunityToolPluginIds"
> {
  const migrated = migrateLegacyCommunityToolOptIns(settings, registeredTools);
  if (isCommunityAppToolOwner(tool.owner)) {
    const names = new Set(migrated.enabledAppToolNames);
    if (enabled) names.add(tool.name);
    else names.delete(tool.name);
    return {
      disabledAppToolNames: migrated.disabledAppToolNames,
      enabledAppToolNames: [...names].sort(),
      enabledCommunityToolPluginIds: migrated.enabledCommunityToolPluginIds,
    };
  }
  const disabled = new Set(migrated.disabledAppToolNames);
  if (enabled) disabled.delete(tool.name);
  else disabled.add(tool.name);
  return {
    disabledAppToolNames: [...disabled].sort(),
    enabledAppToolNames: migrated.enabledAppToolNames,
    enabledCommunityToolPluginIds: migrated.enabledCommunityToolPluginIds,
  };
}

export function mergeAiSettings(
  value: StoredAiSettings | null | undefined,
  registeredTools?: readonly AppToolEnablementRef[],
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
  const merged: AiPluginSettings = {
    defaultRuntime: value?.defaultRuntime ?? DEFAULT_AI_SETTINGS.defaultRuntime,
    acpAgent,
    defaultModels,
    defaultModel: defaultModels[acpAgent],
    thinking:
      thinking && THINKING_LEVELS.has(thinking)
        ? thinking
        : DEFAULT_AI_SETTINGS.thinking,
    memoryAutomaticRecall: value?.memoryAutomaticRecall === true,
    memoryConsolidationEnabled: value?.memoryConsolidationEnabled === true,
    memoryConsolidationRuntime:
      value?.memoryConsolidationRuntime === "codex-native"
        ? "codex-native"
        : "acp",
    memoryConsolidationAgent: normalizeAcpAgent(
      value?.memoryConsolidationAgent,
    ),
    memoryConsolidationModel:
      value?.memoryConsolidationModel?.trim() ||
      DEFAULT_AI_SETTINGS.memoryConsolidationModel,
    handoffSummariesEnabled: value?.handoffSummariesEnabled === true,
    handoffSummaryRuntime:
      value?.handoffSummaryRuntime === "codex-native" ? "codex-native" : "acp",
    handoffSummaryAgent: normalizeAcpAgent(value?.handoffSummaryAgent),
    handoffSummaryModel:
      value?.handoffSummaryModel?.trim() ||
      DEFAULT_AI_SETTINGS.handoffSummaryModel,
    appToolsEnabled: value?.appToolsEnabled !== false,
    disabledAppToolNames: normalizeNameList(value?.disabledAppToolNames),
    enabledAppToolNames: normalizeNameList(value?.enabledAppToolNames),
    enabledCommunityToolPluginIds: normalizeNameList(
      value?.enabledCommunityToolPluginIds,
    ),
  };
  return registeredTools
    ? migrateLegacyCommunityToolOptIns(merged, registeredTools)
    : merged;
}
