import {
  Plugin,
  hasNativeDesktopCapability,
  type App,
  type PluginManifest,
} from "@lapis-notes/api";
import { AiView, AiViewType } from "./chat/ai-view";
import type { AgentRequest, AgentRuntime } from "./core/types";
import { createAgentProcessHost } from "./host/desktop-process-host";
import type { AgentProcessHost } from "./host/process-host";
import {
  createAgentRuntimeRegistry,
  type AgentRuntimeRegistry,
} from "./registry/runtime-registry";
import { DesktopAcpRuntimeBackend } from "./runtimes/acp/desktop-acp-backend";
import { AcpAgentRuntime } from "./runtimes/acp/acp-runtime";
import { CodexNativeRuntime } from "./runtimes/codex/codex-runtime";
import { FakeAgentRuntime } from "./runtimes/fake/fake-runtime";
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
  private settings: AiPluginSettings = DEFAULT_AI_SETTINGS;
  readonly processHost: AgentProcessHost;
  readonly registry: AgentRuntimeRegistry;
  readonly tools = createToolContributionRegistry();
  readonly fakeRuntime = new FakeAgentRuntime({ requireApproval: true });

  constructor(app: App, pluginManifest: PluginManifest = AI_MANIFEST) {
    super(app, pluginManifest);
    this.processHost = createAgentProcessHost();
    this.registry = createAgentRuntimeRegistry([
      this.fakeRuntime,
      new AcpAgentRuntime(new DesktopAcpRuntimeBackend()),
      new CodexNativeRuntime(this.processHost),
    ]);
  }

  getSettings(): AiPluginSettings {
    return { ...this.settings };
  }

  async updateSettings(patch: Partial<AiPluginSettings>): Promise<void> {
    this.settings = mergeAiSettings({ ...this.settings, ...patch });
    await this.saveData(this.settings);
  }

  liveRuntimeUnavailableReason(): string | null {
    if (hasNativeDesktopCapability("agent-runtime")) return null;
    return "Live agent runtimes are available only on the desktop host.";
  }

  async selectRuntime(request: AgentRequest): Promise<AgentRuntime> {
    if (this.settings.defaultRuntime === "fake") return this.fakeRuntime;
    if (this.settings.defaultRuntime !== "auto") {
      const pinned = this.registry.get(this.settings.defaultRuntime);
      if (pinned && (await pinned.supports(request))) return pinned;
    }
    try {
      return await this.registry.select({
        ...request,
        metadata: {
          ...request.metadata,
          acpAgent: this.settings.acpAgent,
        },
        tools: [...(request.tools ?? []), ...this.tools.list()],
      });
    } catch {
      return this.fakeRuntime;
    }
  }

  async onload(): Promise<void> {
    this.settings = mergeAiSettings(await this.loadData());
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
