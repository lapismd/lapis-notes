import {
  Plugin,
  hasNativeDesktopCapability,
  type App,
  type PluginManifest,
} from "@lapis-notes/api";
import type { ComposerTriggerItem } from "@lapismd/design-core/ai/chat";
import { AiView, AiViewType } from "./chat/ai-view";
import { formatFileMention, searchVaultFiles } from "./chat/chat-mentions";
import type { AgentRequest, AgentRuntime } from "./core/types";
import { createHostAgentRuntimes } from "./host/create-host-runtimes";
import { createAgentProcessHost } from "./host/desktop-process-host";
import type { AgentProcessHost } from "./host/process-host";
import { CodexModelProvider } from "./providers/codex-model-provider";
import { AcpModelProvider } from "./providers/acp-model-provider";
import { ModelProviderRegistry } from "./providers/model-provider";
import { selectAgentRuntime } from "./registry/select-runtime";
import {
  createAgentRuntimeRegistry,
  type AgentRuntimeRegistry,
} from "./registry/runtime-registry";
import { FakeAgentRuntime } from "./runtimes/fake/fake-runtime";
import {
  parseAiPluginData,
  serializeAiPluginData,
  type AiPluginData,
} from "./sessions/plugin-data";
import { createMemorySessionStore } from "./sessions/session-store";
import { ConversationRepository } from "./conversations/conversation-repository";
import { ConversationScopeResolver } from "./conversations/scope-resolver";
import { VaultTranscriptStore } from "./conversations/vault-transcript-store";
import { registerAiSettings } from "./settings/register-ai-settings";
import { AiSettingsTab } from "./settings/ai-settings-tab";
import {
  DEFAULT_AI_SETTINGS,
  mergeAiSettings,
  type AiPluginSettings,
} from "./settings/ai-settings";
import { createToolContributionRegistry } from "./tools/tool-registry";

const AI_MANIFEST: PluginManifest = {
  id: "ai",
  name: "AI",
  version: "0.0.1",
  minAppVersion: "0.0.1",
  description:
    "Provider-agnostic agent chat with ACP and optional native runtimes.",
  author: "Lapis Notes",
};

export class AiPlugin extends Plugin {
  private data: AiPluginData = {
    settings: DEFAULT_AI_SETTINGS,
    source: {},
  };
  readonly processHost: AgentProcessHost;
  readonly registry: AgentRuntimeRegistry;
  readonly models: ModelProviderRegistry;
  readonly tools = createToolContributionRegistry();
  readonly #settingsListeners = new Set<
    (patch: Partial<AiPluginSettings>) => void
  >();
  readonly fakeRuntime = new FakeAgentRuntime({
    requireApproval: false,
    trace: "rich",
  });
  readonly sessionStore = createMemorySessionStore();
  readonly scopeResolver = new ConversationScopeResolver();
  readonly conversations: ConversationRepository;

  constructor(app: App, pluginManifest: PluginManifest = AI_MANIFEST) {
    super(app, pluginManifest);
    this.conversations = new ConversationRepository(
      new VaultTranscriptStore(app.vault),
    );
    this.processHost = createAgentProcessHost();
    this.models = new ModelProviderRegistry([
      new CodexModelProvider(this.processHost),
      new AcpModelProvider("cursor"),
    ]);
    this.registry = createAgentRuntimeRegistry([
      this.fakeRuntime,
      ...createHostAgentRuntimes(),
    ]);
  }

  getSettings(): AiPluginSettings {
    return {
      ...this.data.settings,
      defaultModels: { ...this.data.settings.defaultModels },
    };
  }

  async updateSettings(patch: Partial<AiPluginSettings>): Promise<void> {
    const acpAgent = patch.acpAgent ?? this.data.settings.acpAgent;
    const defaultModels = {
      ...this.data.settings.defaultModels,
      ...patch.defaultModels,
    };
    if (patch.defaultModel !== undefined) {
      defaultModels[acpAgent] = patch.defaultModel.trim();
    }
    this.data = {
      ...this.data,
      settings: mergeAiSettings({
        ...this.data.settings,
        ...patch,
        acpAgent,
        defaultModels,
      }),
    };
    await this.saveData(serializeAiPluginData(this.data));
    for (const listener of this.#settingsListeners) listener(patch);
  }

  subscribeSettings(
    listener: (patch: Partial<AiPluginSettings>) => void,
  ): () => void {
    this.#settingsListeners.add(listener);
    return () => this.#settingsListeners.delete(listener);
  }

  liveRuntimeUnavailableReason(): string | null {
    if (hasNativeDesktopCapability("agent-runtime")) return null;
    return "Live agent runtimes are available only on the desktop host.";
  }

  get workspace(): string | undefined {
    return this.app.vault.getName() || undefined;
  }

  searchVaultFiles = async (
    query: string,
    signal: AbortSignal,
  ): Promise<ComposerTriggerItem[]> => {
    if (signal.aborted) return [];
    const files = this.app.vault.getFiles().map((file) => ({
      path: file.path,
      name: file.basename,
    }));
    return searchVaultFiles(files, query).map((file) => ({
      id: file.path,
      label: file.name,
      value: formatFileMention(file.path),
      description: file.path,
    }));
  };

  fallbackRuntime(): AgentRuntime {
    return this.fakeRuntime;
  }

  async selectRuntime(request: AgentRequest): Promise<AgentRuntime> {
    return selectAgentRuntime({
      registry: this.registry,
      settings: this.data.settings,
      fake: this.fakeRuntime,
      request: {
        ...request,
        tools: [...(request.tools ?? []), ...this.tools.list()],
      },
    });
  }

  async onload(): Promise<void> {
    this.data = parseAiPluginData(await this.loadData());
    this.addSettingTab(new AiSettingsTab(this.app, this));
    registerAiSettings(this);
    this.registerSidebarView(AiViewType, (leaf) => new AiView(leaf, this), {
      side: "right",
      title: "AI",
      icon: "sparkles",
    });
    this.addCommand({
      id: "open-ai-chat",
      name: "Open AI chat",
      callback: () => void this.openAiChat(),
    });
  }

  private async openAiChat(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(AiViewType)[0];
    if (existing) {
      this.app.workspace.revealLeaf(existing);
      return;
    }
    const leaf = this.app.workspace.getRightLeaf(false);
    if (!leaf) return;
    await leaf.setViewState({ type: AiViewType, state: {} });
    this.app.workspace.revealLeaf(leaf);
  }
}

export default AiPlugin;
