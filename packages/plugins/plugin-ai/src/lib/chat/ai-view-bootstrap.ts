import type { AgentRuntime, ModelRef, McpServerContribution } from "../core/types";
import type { ConversationLocation } from "../conversations/types";
import { ACP_AGENT_IDS } from "../settings/acp-agents";
import type { AiPluginSettings } from "../settings/ai-settings";
import type { AiViewHost } from "./ai-view";

export type AiViewBootstrap = {
  runtime: AgentRuntime;
  settings: AiPluginSettings;
  models: ModelRef[];
  modelCatalogError: string | null;
  unavailableReason: string | null;
};

export function initialAiViewBootstrap(host: AiViewHost): AiViewBootstrap {
  return {
    runtime: host.fallbackRuntime(),
    settings: host.getSettings(),
    models: [],
    modelCatalogError: null,
    unavailableReason: null,
  };
}

export async function prepareAiViewBootstrap(
  host: AiViewHost,
  initialLocation: ConversationLocation | null,
  mcpServers: McpServerContribution[],
): Promise<AiViewBootstrap> {
  let settings = host.getSettings();
  const conversation = initialLocation
    ? host.conversations.read(initialLocation)
    : Promise.resolve(null);
  const catalogs = ACP_AGENT_IDS.map((agent) => host.models.listModels(agent));
  const [snapshot, settledCatalogs] = await Promise.all([
    conversation.catch(() => null),
    Promise.allSettled(catalogs),
  ]);

  if (snapshot) {
    const binding = snapshot.agents.find(
      (record) =>
        record.type === "binding.created" &&
        record.id === snapshot.metadata.activeAgentBindingId,
    );
    if (binding?.type === "binding.created") {
      const agent = binding.agent === "cursor" ? "cursor" : "codex";
      settings = {
        ...settings,
        acpAgent: agent,
        defaultRuntime:
          binding.runtime === "codex-native"
            ? "codex-native"
            : binding.runtime === "fake"
              ? "fake"
              : "acp",
        defaultModel: binding.model?.model ?? settings.defaultModels[agent],
        thinking: binding.thinking ?? settings.thinking,
      };
    }
  }

  const models = settledCatalogs.flatMap((catalog) =>
    catalog.status === "fulfilled" ? catalog.value : [],
  );
  let modelCatalogError: string | null = null;
  const selectedCatalog =
    settledCatalogs[ACP_AGENT_IDS.indexOf(settings.acpAgent)];
  const agentModels = models.filter(
    (model) => model.provider === settings.acpAgent,
  );
  if (selectedCatalog?.status === "rejected") {
    modelCatalogError = errorMessage(selectedCatalog.reason);
  } else if (
    !initialLocation &&
    agentModels.length > 0 &&
    !agentModels.some((model) => model.model === settings.defaultModel)
  ) {
    const model = (agentModels.find((entry) => entry.isDefault) ??
      agentModels[0])!;
    await host.updateSettings({ defaultModel: model.model });
    settings = host.getSettings();
  }

  let runtime: AgentRuntime;
  let unavailableReason: string | null = null;
  try {
    runtime = await host.selectRuntime({
      prompt: "",
      mcpServers,
      agent: settings.acpAgent,
      model: { provider: settings.acpAgent, model: settings.defaultModel },
      thinking: settings.thinking,
      metadata:
        settings.defaultRuntime === "auto"
          ? undefined
          : { runtime: settings.defaultRuntime },
    });
    unavailableReason =
      settings.defaultRuntime === "fake"
        ? null
        : host.liveRuntimeUnavailableReason();
  } catch (error) {
    runtime = host.fallbackRuntime();
    unavailableReason = errorMessage(error);
  }

  return {
    runtime,
    settings,
    models,
    modelCatalogError,
    unavailableReason,
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
