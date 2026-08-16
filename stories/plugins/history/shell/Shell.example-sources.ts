import {
  createHistoryShellLayout,
  HISTORY_SHELL_CONFIGURATION,
  HISTORY_SHELL_NOTE,
} from "./create-shell-demo";

export const historyShellExampleSource = `<script lang="ts">
  import { onMount } from "svelte";
  import { App, installApplicationCompatibility, MemoryAppDatabase, MemoryVaultAdapter } from "@lapis-notes/api";
  import { FileExplorerPlugin } from "@lapis-notes/file-explorer";
  import { HistoryPlugin } from "@lapis-notes/history";
  import { MarkdownPlugin } from "@lapis-notes/markdown";
  import { SearchPlugin } from "@lapis-notes/search";
  import { WorkspaceShell } from "@lapis-notes/workspace";

  const adapter = new MemoryVaultAdapter({
    ".obsidian/app.json": ${JSON.stringify(JSON.stringify(HISTORY_SHELL_CONFIGURATION))},
    ".obsidian/workspace.json": ${JSON.stringify(JSON.stringify(createHistoryShellLayout()))},
    "Notes/Welcome.md": ${JSON.stringify(HISTORY_SHELL_NOTE)},
  });
  const app = new App({
    version: "1.0.0",
    configPath: ".obsidian/app.json",
    adapter,
    appDatabase: new MemoryAppDatabase("history-shell"),
    workspaceShell: { application: { name: "Lapis Notes" } },
    markdownRenderer: async () => {},
  });
  const disposeApplicationCompatibility = installApplicationCompatibility(app);
  let ready = $state(false);

  app.plugins.registerCorePlugins([
    { plugin: MarkdownPlugin, required: false, enabledByDefault: true, distribution: "bundled" },
    { plugin: FileExplorerPlugin, required: false, enabledByDefault: true, distribution: "bundled" },
    { plugin: SearchPlugin, required: false, enabledByDefault: true, distribution: "bundled" },
    { plugin: HistoryPlugin, required: false, enabledByDefault: true, distribution: "bundled" },
  ]);
  onMount(() => {
    void (async () => {
      await app.vault.load();
      await app.configuration.load();
      await app.plugins.loadPlugins({ communityPlugins: "disabled", optionalCorePlugins: "configured" });
      await app.metadataCache.load();
      await app.workspace.loadLayout();
      ready = true;
    })();
    return () => {
      disposeApplicationCompatibility();
    };
  });
</script>

{#if ready}
  <WorkspaceShell {app} displayMode="desktop" workspaceLabel="Lapis Notes" />
{/if}`;
