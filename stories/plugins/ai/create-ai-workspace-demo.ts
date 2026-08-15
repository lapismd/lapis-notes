import { App, MemoryAppDatabase, MemoryVaultAdapter } from "@lapis-notes/api";
import { AiPlugin } from "@lapis-notes/ai";
import { MarkdownPlugin } from "@lapis-notes/markdown";
import { SourceEditorDemoPlugin } from "../../workspace/lapis-editor-demo/source-editor-plugin";
import { watchMetadata } from "../../workspace/watch-metadata";

export const AI_WORKSPACE_CONFIGURATION = {
  "appearence.interface.showTabTitleBar": true,
};

export type AiWorkspaceDemoOptions = {
  defaultRuntime?: "fake" | "acp";
  vaultId?: string;
};

export { isLiveAgentAttachConfigured } from "./live-agent-attach";

export function createAiWorkspacePluginData(
  defaultRuntime: "fake" | "acp" = "fake",
) {
  return {
    settings: {
      defaultRuntime,
      acpAgent: "codex",
      defaultModel: "gpt-5.6-sol",
      thinking: "medium",
    },
    sessions: [],
  };
}

export const AI_WORKSPACE_PLUGIN_DATA = createAiWorkspacePluginData("fake");

function leaf(
  id: string,
  title: string,
  icon: string,
  type: string,
  state: Record<string, unknown> = {},
) {
  return {
    id,
    type: "leaf",
    state: { type, state, icon, title },
  };
}

function tabs(id: string, children: ReturnType<typeof leaf>[]) {
  return {
    id,
    type: "tabs",
    stacked: false,
    currentTab: 0,
    children,
  };
}

function split(
  id: string,
  direction: "horizontal" | "vertical",
  children: unknown[],
  extra: Record<string, unknown> = {},
) {
  return {
    id,
    type: "split",
    direction,
    sizes: children.length > 0 ? [100] : [],
    children,
    ...extra,
  };
}

export function createAiWorkspaceLayout() {
  return {
    main: split("main", "horizontal", [
      tabs("main-tabs", [
        leaf("welcome", "Welcome", "file-text", "markdown", {
          file: "Notes/Welcome.md",
          mode: "source",
        }),
      ]),
    ]),
    left: split("left", "vertical", [], { width: "0px" }),
    right: split(
      "right",
      "vertical",
      [tabs("right-panel-tabs", [leaf("ai-chat", "AI", "sparkles", "ai")])],
      { width: "22rem" },
    ),
    bottom: { ...tabs("bottom-panel", []), height: "0px" },
    floating: [],
    active: "welcome",
  };
}

export function createAiWorkspaceSeed(
  pluginData = AI_WORKSPACE_PLUGIN_DATA,
): Record<string, string> {
  return {
    ".obsidian/app.json": JSON.stringify(AI_WORKSPACE_CONFIGURATION, null, 2),
    ".obsidian/workspace.json": JSON.stringify(
      createAiWorkspaceLayout(),
      null,
      2,
    ),
    ".obsidian/ai.json": JSON.stringify(pluginData, null, 2),
    "Notes/Welcome.md": "# Welcome\n\nAsk the AI chat in the right sidebar.\n",
    "Notes/alpha.md": "# Alpha\n\nTODO: summarize this note.\n",
  };
}

export async function bootAiWorkspaceDemo(
  options: AiWorkspaceDemoOptions = {},
): Promise<{
  app: App;
  dispose: () => Promise<void>;
}> {
  const defaultRuntime = options.defaultRuntime ?? "fake";
  const vaultId = options.vaultId ?? "lapis-ai-workspace";
  const previousApp = globalThis.app;
  const adapter = new MemoryVaultAdapter(
    createAiWorkspaceSeed(createAiWorkspacePluginData(defaultRuntime)),
    {
      name: "Lapis AI Workspace",
      vaultId,
      clock: 1_700_000_000_000,
    },
  );
  const app = new App({
    version: "0.0.1-story",
    configPath: ".obsidian/app.json",
    adapter,
    appDatabase: new MemoryAppDatabase("lapis-ai-workspace"),
    workspaceShell: { application: { name: "Lapis Notes" } },
    markdownRenderer: async () => {},
  });

  app.plugins.registerCorePlugins([
    { plugin: SourceEditorDemoPlugin, required: true },
    {
      plugin: MarkdownPlugin,
      required: false,
      enabledByDefault: true,
      distribution: "bundled",
    },
    {
      plugin: AiPlugin,
      required: false,
      enabledByDefault: true,
      distribution: "bundled",
    },
  ]);

  globalThis.app = app;
  await app.vault.load();
  await app.configuration.load();
  await app.plugins.loadPlugins({
    communityPlugins: "disabled",
    optionalCorePlugins: "configured",
  });
  const stopWatchingMetadata = watchMetadata(app);
  await app.metadataCache.load();
  await app.workspace.loadLayout();

  return {
    app,
    dispose: async () => {
      stopWatchingMetadata();
      for (const plugin of [...app.plugins.corePlugins].reverse()) {
        await plugin.disable().catch(() => undefined);
      }
      await app.workspace.disposeWorkspaceHost();
      if (globalThis.app === app) globalThis.app = previousApp;
    },
  };
}
