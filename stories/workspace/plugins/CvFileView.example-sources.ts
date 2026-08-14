export const CvFileViewExample = `<script lang="ts">
  import { onMount } from "svelte";
  import { App, MemoryAppDatabase, MemoryVaultAdapter } from "@lapis-notes/api";
  import { RolesPlugin } from "@lapis-notes/roles";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import sampleCv from "./sample.cv.yml?raw";

  const cvLeaf = { id: "sample-cv", type: "leaf", state: {
    type: "cv", title: "sample", icon: "file-text",
    state: { file: "sample.cv.yml" },
  } };
  const layout = {
    main: { id: "main", type: "split", direction: "vertical", sizes: [100],
      children: [{ id: "main-tabs", type: "tabs", stacked: false,
        currentTab: 0, children: [cvLeaf] }],
    },
    left: { id: "left", type: "split", direction: "vertical",
      sizes: [], children: [], width: "0px",
    },
    right: { id: "right", type: "split", direction: "vertical",
      sizes: [], children: [], width: "0px",
    },
    bottom: { id: "bottom", type: "tabs", currentTab: 0, children: [], height: "0px" },
    floating: [],
    active: "sample-cv",
  };
  const adapter = new MemoryVaultAdapter({
    ".obsidian/app.json": "{}",
    ".obsidian/workspace.json": JSON.stringify(layout),
    "sample.cv.yml": sampleCv,
  });
  const app = new App({
    adapter,
    appDatabase: new MemoryAppDatabase("cv-file-view"),
    configPath: ".obsidian/app.json",
    version: "1.0.0",
    markdownRenderer: async () => {},
  });
  app.plugins.registerCorePlugins([
    { plugin: RolesPlugin, required: false, enabledByDefault: true },
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
