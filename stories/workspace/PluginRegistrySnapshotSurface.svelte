<script lang="ts">
  import {
    App,
    MemoryVaultAdapter,
    MemoryAppDatabase,
    installApplicationCompatibility,
    type PluginCatalogDetail,
  } from "@lapis-notes/api";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { registerNotesPluginBrowser } from "../../packages/app-profile/src/plugin-browser";
  import { pluginsBrowserLayout } from "./plugins-browser-layout";
  import {
    snapshotFetch,
    snapshotMediaFetch,
    snapshotDistributionOptions,
  } from "./registry-snapshot";
  import { onMount, untrack } from "svelte";

  let { browserState = {} }: { browserState?: Record<string, unknown> } =
    $props();
  const originalFetch = window.fetch.bind(window);
  const app = new App({
    version: "0.1.0",
    configPath: ".lapis/app.json",
    adapter: new MemoryVaultAdapter({
      ".lapis/app.json": "{}",
      ".lapis/workspace.json": JSON.stringify(
        pluginsBrowserLayout(
          "middle-top-tabs",
          untrack(() => browserState),
        ),
      ),
    }),
    appDatabase: new MemoryAppDatabase("plugin-registry-snapshot"),
    // Structured registry content renders itself; this story has no document leaves.
    markdownRenderer: async () => {},
    pluginDistributionOptions: snapshotDistributionOptions(
      snapshotFetch(originalFetch),
    ),
  });
  let ready = $state(false);
  let error = $state("");
  let root: HTMLDivElement;

  onMount(() => {
    let disposed = false;
    const disposeCompatibility = installApplicationCompatibility(app);
    const disposeBrowser = registerNotesPluginBrowser(app);
    const previousFetch = window.fetch;
    const mediaFetch = snapshotMediaFetch(originalFetch);
    window.fetch = mediaFetch;
    Object.assign(root, { __lapisApp: app });
    void (async () => {
      await app.vault.load();
      await app.configuration.load();
      const catalog = await app.pluginDistribution.refreshCatalog();
      // Every detail goes through signature verification and the public schema.
      const details: Record<string, PluginCatalogDetail | null> = {};
      for (const entry of catalog.plugins)
        details[entry.id] = await app.pluginDistribution.getPluginDetail(
          entry.id,
        );
      Object.assign(root, { __snapshotDetails: details });
      if (disposed) return;
      await app.workspace.loadLayout();
      if (!disposed) ready = true;
    })().catch((cause) => {
      if (!disposed) error = String(cause);
    });
    return () => {
      disposed = true;
      disposeBrowser();
      if (window.fetch === mediaFetch) window.fetch = previousFetch;
      delete (root as HTMLDivElement & { __lapisApp?: App }).__lapisApp;
      void (async () => {
        try {
          await app.workspace.disposeWorkspaceHost();
          await app.metadataCache.dispose();
          await app.appDatabase.close();
        } finally {
          disposeCompatibility();
        }
      })();
    };
  });
</script>

<div
  bind:this={root}
  class="registry-snapshot-story"
  data-testid="registry-snapshot-story"
  data-app-shell-ready={ready || undefined}
>
  {#if error}<p role="alert">{error}</p>{/if}
  {#if ready}<WorkspaceShell
      {app}
      workspaceLabel="Registry snapshot review"
    />{/if}
</div>

<style>
  .registry-snapshot-story {
    width: 100%;
    height: 100vh;
    overflow: hidden;
  }
</style>
