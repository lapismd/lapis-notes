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
import { createAgentProcessHost } from "./host/desktop-process-host";
import type { AgentProcessHost } from "./host/process-host";
import { CodexModelProvider } from "./providers/codex-model-provider";
import {
  createAgentRuntimeRegistry,
  type AgentRuntimeRegistry,
} from "./registry/runtime-registry";
import { DesktopAcpRuntimeBackend } from "./runtimes/acp/desktop-acp-backend";
import { AcpAgentRuntime } from "./runtimes/acp/acp-runtime";
import { CodexNativeRuntime } from "./runtimes/codex/codex-runtime";
import { FakeAgentRuntime } from "./runtimes/fake/fake-runtime";
import { parseAiPluginData, type AiPluginData } from "./sessions/plugin-data";
import { createPersistedSessionStore } from "./sessions/session-store";
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
  description: "Provider-agnostic agent chat with ACP and optional native runtimes.",
  author: "Lapis Notes",
};

export class AiPlugin extends Plugin {
  private data: AiPluginData = {
    settings: DEFAULT_AI_SETTINGS,
    sessions: [],
  };
  readonly processHost: AgentProcessHost;
  readonly registry: AgentRuntimeRegistry;
  readonly models: CodexModelProvider;
  readonly tools = createToolContributionRegistry();
  readonly fakeRuntime = new FakeAgentRuntime({ requireApproval: true });
  readonly sessionStore = createPersistedSessionStore({
    read: async () => this.data.sessions,
    write: async (sessions) => {
      this.data = { ...this.data, sessions };
      await this.saveData(this.data);
    },
  });

  constructor(app: App, pluginManifest: PluginManifest = AI_MANIFEST) {
    super(app, pluginManifest);
    this.processHost = createAgentProcessHost();
    this.models = new CodexModelProvider(this.processHost);
    this.registry = createAgentRuntimeRegistry([
      this.fakeRuntime,
      new AcpAgentRuntime(new DesktopAcpRuntimeBackend()),
      new CodexNativeRuntime(this.processHost),
    ]);
  }

  getSettings(): AiPluginSettings {
    return { ...this.data.settings };
  }

  async updateSettings(patch: Partial<AiPluginSettings>): Promise<void> {
    this.data = {
      ...this.data,
      settings: mergeAiSettings({ ...this.data.settings, ...patch }),
    };
    await this.saveData(this.data);
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

  async selectRuntime(request: AgentRequest): Promise<AgentRuntime> {
    const settings = this.data.settings;
    if (settings.defaultRuntime === "fake") return this.fakeRuntime;
    if (settings.defaultRuntime !== "auto") {
      const pinned = this.registry.get(settings.defaultRuntime);
      if (pinned && (await pinned.supports(request))) return pinned;
    }
    try {
      return await this.registry.select({
        ...request,
        metadata: {
          ...request.metadata,
          acpAgent: settings.acpAgent,
        },
        tools: [...(request.tools ?? []), ...this.tools.list()],
      });
    } catch {
      return this.fakeRuntime;
    }
  }

  async onload(): Promise<void> {
    this.data = parseAiPluginData(await this.loadData());
    this.addSettingTab(new AiSettingsTab(this.app, this));
    this.registerSidebarView(
      AiViewType,
      (leaf) => new AiView(leaf, this),
      { side: "right", title: "AI", icon: "sparkles" },
    );
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
