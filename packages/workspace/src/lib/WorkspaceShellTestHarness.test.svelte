<script lang="ts">
  import { onMount, untrack } from "svelte";
  import {
    App,
    installApplicationCompatibility,
    MemoryAppDatabase,
    MemoryVaultAdapter,
    provideApplicationState,
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
    configPath: ".obsidian/app.json",
    adapter,
    appDatabase: new MemoryAppDatabase("workspace-shell-test"),
    markdownRenderer: async () => {},
  });
  provideApplicationState(app);
  const disposeApplicationCompatibility =
    installApplicationCompatibility(app);
  let ready = $state(false);

  onMount(() => {
    void (async () => {
      await app.vault.load();
      await app.workspace.loadLayout();
      onAppReady?.(app);
      ready = true;
    })();
    return disposeApplicationCompatibility;
  });
</script>

{#if ready}
  <WorkspaceShell {app} displayMode="desktop" {workspaceNavigation} />
{/if}
