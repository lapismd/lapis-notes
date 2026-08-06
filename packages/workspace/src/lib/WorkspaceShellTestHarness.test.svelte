<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { App, MemoryAppDatabase } from "../../test/api-app";
  import { StoryMemoryDataAdapter } from "../../../../stories/workspace/StoryMemoryDataAdapter";
  import WorkspaceShell from "./WorkspaceShell.svelte";

  let {
    layout,
    onAppReady,
  }: {
    layout: Record<string, unknown>;
    onAppReady?: (app: App) => void;
  } = $props();

  const adapter = new StoryMemoryDataAdapter({
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
  <WorkspaceShell {app} displayMode="desktop" />
{/if}
