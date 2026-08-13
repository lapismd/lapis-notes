import {
  App,
  MemoryAppDatabase,
  MemoryVaultAdapter,
} from "@lapis-notes/api";
import { CvPlugin } from "@lapis-notes/cv";
import { MarkdownPlugin } from "@lapis-notes/markdown";
import { MarkdownLintPlugin } from "@lapis-notes/markdown-lint";
import sampleCvYaml from "../../../packages/plugins/plugin-cv/src/lib/form/sample-cv.fixture.yml?raw";
import { SourceEditorDemoPlugin } from "../lapis-editor-demo/source-editor-plugin";
import { watchMetadata } from "../watch-metadata";

const APP_CONFIGURATION = {
  "editor.display.showLineNumbers": true,
  "editor.defaultViewForNewTabs": "editing",
};

const CV_WITH_EVIDENCE = `${sampleCvYaml.trimEnd()}
evidence:
  stories: []
  technologies: [Svelte]
  skills: [Delivery]
  answer_method_defaults:
    style: concise
`;

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

function workspaceLayout() {
  return {
    main: {
      id: "main",
      type: "split",
      direction: "vertical",
      sizes: [100],
      children: [
        tabs("main-tabs", [
          leaf("sample-cv", "sample", "file-text", "cv", {
            file: "sample.cv.yml",
          }),
        ]),
      ],
    },
    left: {
      id: "left",
      type: "split",
      direction: "vertical",
      sizes: [],
      children: [],
      width: "0px",
    },
    right: {
      id: "right",
      type: "split",
      direction: "vertical",
      sizes: [],
      children: [],
      width: "0px",
    },
    bottom: {
      ...tabs("bottom-panel", []),
      height: "0px",
    },
    floating: [],
    active: "sample-cv",
  };
}

export function createCvFileViewSeed(): Record<string, string> {
  return {
    ".obsidian/app.json": JSON.stringify(APP_CONFIGURATION, null, 2),
    ".obsidian/workspace.json": JSON.stringify(workspaceLayout(), null, 2),
    "sample.cv.yml": CV_WITH_EVIDENCE,
  };
}

export async function bootCvFileViewDemo(): Promise<{
  app: App;
  dispose: () => Promise<void>;
}> {
  const previousApp = globalThis.app;
  const adapter = new MemoryVaultAdapter(createCvFileViewSeed(), {
    name: "Lapis CV FileView",
    vaultId: "lapis-cv-file-view",
    clock: 1_700_000_000_000,
  });
  const app = new App({
    version: "0.0.1-story",
    configPath: ".obsidian/app.json",
    adapter,
    appDatabase: new MemoryAppDatabase("lapis-cv-file-view"),
    workspaceShell: { application: { name: "Lapis Notes" } },
    markdownRenderer: async () => {},
  });

  app.plugins.registerCorePlugins([
    { plugin: SourceEditorDemoPlugin, required: true },
    { plugin: MarkdownPlugin, required: false, enabledByDefault: true },
    { plugin: MarkdownLintPlugin, required: false, enabledByDefault: true },
    { plugin: CvPlugin, required: false, enabledByDefault: true },
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
