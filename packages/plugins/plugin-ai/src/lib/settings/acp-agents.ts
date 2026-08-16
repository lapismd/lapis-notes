export const ACP_AGENT_IDS = ["codex", "cursor"] as const;

export type AcpAgentId = (typeof ACP_AGENT_IDS)[number];

export const DEFAULT_ACP_AGENT: AcpAgentId = "codex";

export function isAcpAgentId(value: unknown): value is AcpAgentId {
  return ACP_AGENT_IDS.some((id) => id === value);
}

export function normalizeAcpAgent(value: unknown): AcpAgentId {
  return isAcpAgentId(value) ? value : DEFAULT_ACP_AGENT;
}

export function catalogModelsForAgent<T extends { provider?: string }>(
  agent: AcpAgentId,
  models: T[],
): T[] {
  return models.filter((model) => model.provider === agent || !model.provider);
}
