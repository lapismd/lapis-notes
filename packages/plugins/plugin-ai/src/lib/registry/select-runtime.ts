import type { AgentRequest, AgentRuntime } from "../core/types";
import { normalizeAcpAgent } from "../settings/acp-agents";
import type { AiPluginSettings } from "../settings/ai-settings";
import {
  AgentRuntimeNotFoundError,
  type AgentRuntimeRegistry,
} from "./runtime-registry";

export async function selectAgentRuntime(options: {
  registry: AgentRuntimeRegistry;
  settings: Pick<AiPluginSettings, "defaultRuntime" | "acpAgent">;
  request: AgentRequest;
  fake: AgentRuntime;
}): Promise<AgentRuntime> {
  const { registry, settings, fake } = options;
  const agent = normalizeAcpAgent(options.request.agent ?? settings.acpAgent);
  const request: AgentRequest = {
    ...options.request,
    agent,
    metadata: {
      ...options.request.metadata,
      acpAgent: agent,
    },
  };

  if (settings.defaultRuntime === "fake") return fake;
  if (settings.defaultRuntime !== "auto") {
    const pinned = registry.get(settings.defaultRuntime);
    if (pinned && (await pinned.supports(request))) return pinned;
    throw new AgentRuntimeNotFoundError(
      `Pinned runtime ${settings.defaultRuntime} is unavailable.`,
    );
  }

  try {
    return await registry.select(request);
  } catch (error) {
    if (error instanceof AgentRuntimeNotFoundError && (await fake.supports(request))) {
      return fake;
    }
    throw error;
  }
}
