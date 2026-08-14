export const RolesPluginShellExample = `<script lang="ts">
  import { onMount } from "svelte";
  import { App, MemoryAppDatabase, MemoryVaultAdapter } from "@lapis-notes/api";
  import { RolesPlugin } from "@lapis-notes/lapis-plugin-cv-roles";
  import { FileExplorerPlugin } from "@lapis-notes/file-explorer";
  import { MarkdownLintPlugin } from "@lapis-notes/markdown-lint";
  import { SearchPlugin } from "@lapis-notes/search";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import sampleCv from "./sample.cv.yml?raw";

  const cvLeaf = { id: "cv", type: "leaf", state: {
    type: "cv", title: "sample", icon: "file-text",
    state: { file: "sample.cv.yml" },
  } };
  const rolesLeaf = { id: "roles", type: "leaf", state: {
    type: "roles", title: "Roles", icon: "briefcase-business", state: {},
  } };
  const activityLeaf = { id: "roles-activity", type: "leaf", state: {
    type: "roles-activity", title: "Role Activity", icon: "activity", state: {},
  } };
  const actionsLeaf = { id: "roles-actions", type: "leaf", state: {
    type: "roles-actions", title: "Role Actions", icon: "bell", state: {},
  } };
  const filesLeaf = { id: "files", type: "leaf", state: {
    type: "file-explorer", title: "Files", icon: "folder-closed", state: {},
  } };
  const searchLeaf = { id: "search", type: "leaf", state: {
    type: "search", title: "Search", icon: "search", state: {},
  } };
  const layout = {
    main: { id: "main", type: "split", direction: "vertical", sizes: [100],
      children: [{ id: "main-tabs", type: "tabs", stacked: false,
        currentTab: 3, children: [rolesLeaf, activityLeaf, actionsLeaf, cvLeaf] }],
    },
    left: { id: "left", type: "split", direction: "vertical", sizes: [100],
      children: [{ id: "left-tabs", type: "tabs", stacked: false,
        currentTab: 0, children: [filesLeaf] }], width: "16rem",
    },
    right: { id: "right", type: "split", direction: "vertical", sizes: [100],
      children: [{ id: "right-tabs", type: "tabs", stacked: false,
        currentTab: 0, children: [searchLeaf] }], width: "0px",
    },
    bottom: { id: "bottom", type: "tabs", currentTab: 0, children: [], height: "0px" },
    floating: [],
    active: "cv",
  };

  const adapter = new MemoryVaultAdapter({
    ".obsidian/app.json": "{}",
    ".obsidian/workspace.json": JSON.stringify(layout),
    "sample.cv.yml": sampleCv,
  });
  const app = new App({
    adapter,
    appDatabase: new MemoryAppDatabase("cv-example"),
    configPath: ".obsidian/app.json",
    version: "1.0.0",
    markdownRenderer: async () => {},
  });
  app.plugins.registerCorePlugins([
    { plugin: FileExplorerPlugin, required: false, enabledByDefault: true },
    { plugin: MarkdownLintPlugin, required: false, enabledByDefault: true },
    { plugin: SearchPlugin, required: false, enabledByDefault: true },
    { plugin: RolesPlugin, required: false, enabledByDefault: true, distribution: "first-party-external" },
  ]);

  let ready = $state(false);
  onMount(() => {
    void (async () => {
      globalThis.app = app;
      await app.vault.load();
      await app.configuration.load();
      await app.plugins.loadPlugins({
        communityPlugins: "disabled",
        optionalCorePlugins: "configured",
      });
      await app.workspace.loadLayout();
      ready = true;
    })();
  });
</script>

{#if ready}
  <WorkspaceShell {app} displayMode="desktop" workspaceLabel="Lapis Notes" />
{/if}
`;
