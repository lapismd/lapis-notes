<script lang="ts">
  import { onMount, untrack } from "svelte";
  import {
    App,
    MemoryAppDatabase,
    MemoryVaultAdapter,
  } from "../../test/api-app";
  import type { WorkspaceNavigation } from "@lapismd/design-core/workspace/app-shell";
  import WorkspaceShell from "./WorkspaceShell.svelte";

  let {
    layout,
    onAppReady,
    workspaceNavigation,
  }: {
    layout: Record<string, unknown>;
    onAppReady?: (app: App) => void;
    workspaceNavigation?: WorkspaceNavigation;
  } = $props();

  const adapter = new MemoryVaultAdapter({
    "/.obsidian/workspace.json": JSON.stringify(untrack(() => layout)),
  });
  const app = new App({
    version: "0.0.1-test",
    configPath: ".obsidian",
    adapter,
    appDatabase: new MemoryAppDatabase("workspace-shell-test"),
    markdownRenderer: async () => {},
  });
  globalThis.app = app;
  let ready = $state(false);

  onMount(() => {
    void (async () => {
      await app.vault.load();
      await app.workspace.loadLayout();
      onAppReady?.(app);
      ready = true;
    })();
  });
</script>

{#if ready}
  <WorkspaceShell {app} displayMode="desktop" {workspaceNavigation} />
{/if}
