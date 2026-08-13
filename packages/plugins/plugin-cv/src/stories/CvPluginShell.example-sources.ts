export const CvPluginShellExample = `<script lang="ts">
  import { onMount } from "svelte";
  import { App, MemoryAppDatabase, MemoryVaultAdapter } from "@lapis-notes/api";
  import { CvPlugin } from "@lapis-notes/cv";
  import { FileExplorerPlugin } from "@lapis-notes/file-explorer";
  import { SearchPlugin } from "@lapis-notes/search";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import sampleCv from "./sample.cv.yml?raw";

  const cvLeaf = { id: "cv", type: "leaf", state: {
    type: "cv", title: "sample", icon: "file-text",
    state: { file: "sample.cv.yml" },
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
        currentTab: 0, children: [cvLeaf] }],
    },
    left: { id: "left", type: "split", direction: "vertical", sizes: [100],
      children: [{ id: "left-tabs", type: "tabs", stacked: false,
        currentTab: 0, children: [filesLeaf] }], width: "16rem",
    },
    right: { id: "right", type: "split", direction: "vertical", sizes: [100],
      children: [{ id: "right-tabs", type: "tabs", stacked: false,
        currentTab: 0, children: [searchLeaf] }], width: "20rem",
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
    { plugin: FileExplorerPlugin, required: true },
    { plugin: SearchPlugin, required: true },
    { plugin: CvPlugin, required: false, enabledByDefault: true },
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
