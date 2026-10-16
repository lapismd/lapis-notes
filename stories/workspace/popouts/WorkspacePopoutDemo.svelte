<script lang="ts">
  import { onMount } from "svelte";
  import {
    App,
    MemoryAppDatabase,
    MemoryVaultAdapter,
    installApplicationCompatibility,
  } from "@lapis-notes/api";
  import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { SourceEditorPlugin } from "@lapis-notes/source-editor";

  const adapter = new MemoryVaultAdapter({
    "one.txt": "First note",
    "two.txt": "Second note",
  });
  const app = new App({
    version: "0.0.1-story",
    configPath: ".lapis/app.json",
    adapter,
    appDatabase: new MemoryAppDatabase("popup-acceptance"),
    markdownRenderer: async () => {},
  });
  const { controller } = getWorkspaceHostBinding(app.workspace);
  app.plugins.registerCorePlugins([
    { plugin: SourceEditorPlugin, required: true },
  ]);
  let ready = $state(false);
  let failure = $state("");
  let root = $state<HTMLDivElement>();
  onMount(() => {
    const release = installApplicationCompatibility(app);
    let disposed = false;
    const boot = (async () => {
      await app.vault.load();
      await app.configuration.load();
      await app.plugins.loadPlugins({ communityPlugins: "disabled" });
      await app.workspace.loadLayout();
      for (const path of ["one.txt", "two.txt"]) {
        const leaf = app.workspace.getLeaf("tab");
        await leaf.openFile(app.vault.getFileByPath(path)!);
      }
      app.workspace.leftSplit.collapse();
      app.workspace.rightSplit.collapse();
      if (root)
        Object.assign(root, { __lapisApp: app, __popupController: controller });
      if (!disposed) ready = true;
    })();
    void boot.catch((error) => {
      failure = String(error);
    });
    return () => {
      disposed = true;
      const unloadViews = () =>
        app.workspace.iterateAllLeaves((leaf) => {
          leaf.view.unload();
          (leaf.view as { editor?: { destroy(): void } }).editor?.destroy();
        });
      unloadViews();
      const dispose = async () => {
        unloadViews();
        await app.fileEditingSessions.settleOperations();
        await app.fileEditingSessions.flush();
        for (const plugin of [...app.plugins.corePlugins].reverse())
          await plugin.disable();
        await app.workspace.disposeWorkspaceHost();
        await app.fileEditingSessions.dispose();
        release();
      };
      void boot.then(dispose, dispose);
    };
  });
</script>

<div bind:this={root} class="popup-demo" data-popup-ready={ready}>
  {#if ready}<WorkspaceShell {app} displayMode="desktop" />{/if}
  {#if failure}<p role="alert">{failure}</p>{/if}
</div>

<style>
  .popup-demo {
    width: 100vw;
    height: 100vh;
    --ui-workspace-window-controls-overlay-inline-start: 80px;
  }
</style>
