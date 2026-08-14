import {
  App,
  MemoryAppDatabase,
  MemoryVaultAdapter,
} from "@lapis-notes/api";
import { MarkdownPlugin } from "@lapis-notes/markdown";
import { MarkdownLintPlugin } from "@lapis-notes/markdown-lint";
import { RolesPlugin } from "@lapis-notes/roles";
import sampleCvYaml from "../../../packages/plugins/plugin-roles/src/lib/form/sample-cv.fixture.yml?raw";
import { SourceEditorDemoPlugin } from "../lapis-editor-demo/source-editor-plugin";
import { watchMetadata } from "../watch-metadata";

const ROLE_SOURCE = `---
schemaVersion: 1
id: atlas-platform
company: Atlas AI
title: Engineering Manager, Infrastructure
status: saved
sortOrder: 1000
location: London · Hybrid
tags: [leadership, platform]
contacts: [Alex Morgan]
pinned: false
createdAt: 2026-08-01T09:00:00.000Z
updatedAt: 2026-08-12T14:30:00.000Z
appliedAt:
followUpAt: 2026-08-14
cvFile: CVs/engineering-lead.cv.yml
tailoredCvFile:
reactions: []
prep:
  version: 3
  schemaVersion: 1
  updatedAt: 2026-08-12T14:30:00.000Z
  stages: []
  comments:
    items: []
---
# Role description

Lead the infrastructure group and scale the developer platform.
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
          leaf("roles", "Roles", "briefcase-business", "roles"),
          leaf(
            "atlas-role",
            "Engineering Manager, Infrastructure",
            "briefcase-business",
            "role",
            { file: "Roles/atlas-platform/role.md" },
          ),
          leaf("linked-cv", "engineering-lead", "file-text", "cv", {
            file: "CVs/engineering-lead.cv.yml",
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
    active: "roles",
  };
}

export function createRolesWorkspaceSeed(): Record<string, string> {
  return {
    ".obsidian/app.json": JSON.stringify(
      {
        "editor.display.showLineNumbers": true,
        "editor.defaultViewForNewTabs": "editing",
      },
      null,
      2,
    ),
    ".obsidian/workspace.json": JSON.stringify(workspaceLayout(), null, 2),
    "Roles/atlas-platform/role.md": ROLE_SOURCE,
    "CVs/engineering-lead.cv.yml": sampleCvYaml,
  };
}

export async function bootRolesWorkspaceDemo(): Promise<{
  app: App;
  dispose: () => Promise<void>;
}> {
  const previousApp = globalThis.app;
  const adapter = new MemoryVaultAdapter(createRolesWorkspaceSeed(), {
    name: "Lapis Roles Workspace",
    vaultId: "lapis-roles-workspace",
    clock: 1_700_000_000_000,
  });
  const app = new App({
    version: "0.0.1-story",
    configPath: ".obsidian/app.json",
    adapter,
    appDatabase: new MemoryAppDatabase("lapis-roles-workspace"),
    workspaceShell: { application: { name: "Lapis Notes" } },
    markdownRenderer: async () => {},
  });

  app.plugins.registerCorePlugins([
    { plugin: SourceEditorDemoPlugin, required: true },
    { plugin: MarkdownPlugin, required: false, enabledByDefault: true },
    { plugin: MarkdownLintPlugin, required: false, enabledByDefault: true },
    { plugin: RolesPlugin, required: false, enabledByDefault: true },
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
