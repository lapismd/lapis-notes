import type { AgentRequest, AgentRuntime } from "../core/types";

export class AgentRuntimeNotFoundError extends Error {
  constructor(message = "No compatible agent runtime is registered.") {
    super(message);
    this.name = "AgentRuntimeNotFoundError";
  }
}

export interface AgentRuntimeRegistry {
  register(runtime: AgentRuntime): void;
  get(id: string): AgentRuntime | undefined;
  list(): AgentRuntime[];
  select(request: AgentRequest): Promise<AgentRuntime>;
}

export function createAgentRuntimeRegistry(
  runtimes: AgentRuntime[] = [],
): AgentRuntimeRegistry {
  const registered = new Map<string, AgentRuntime>();
  for (const runtime of runtimes) registered.set(runtime.id, runtime);

  return {
    register(runtime) {
      registered.set(runtime.id, runtime);
    },
    get(id) {
      return registered.get(id);
    },
    list() {
      return [...registered.values()];
    },
    async select(request) {
      const preferredId =
        typeof request.metadata?.runtime === "string"
          ? request.metadata.runtime
          : undefined;
      if (preferredId) {
        const preferred = registered.get(preferredId);
        if (preferred && (await preferred.supports(request))) return preferred;
      }
      const candidates: AgentRuntime[] = [];
      for (const runtime of registered.values()) {
        if (await runtime.supports(request)) candidates.push(runtime);
      }
      if (candidates.length === 0) throw new AgentRuntimeNotFoundError();
      return candidates.sort(compareRuntimes)[0]!;
    },
  };
}

function compareRuntimes(left: AgentRuntime, right: AgentRuntime): number {
  const leftScore = scoreRuntime(left);
  const rightScore = scoreRuntime(right);
  if (leftScore !== rightScore) return rightScore - leftScore;
  return left.id.localeCompare(right.id);
}

function scoreRuntime(runtime: AgentRuntime): number {
  const capabilities = runtime.capabilities();
  const approvals = capabilities.approvals;
  let score = 0;
  if (approvals.supported) score += 4;
  if (approvals.interactive) score += 4;
  if (approvals.persistentDecisions) score += 2;
  if (approvals.granularPermissions) score += 2;
  if (capabilities.mcpTools) score += 2;
  if (capabilities.nativeTools) score += 2;
  if (capabilities.steer) score += 1;
  if (capabilities.modelSelection) score += 1;
  if (approvals.policyAmendments) score -= 1;
  return score;
}
