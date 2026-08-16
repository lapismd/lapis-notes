import {
  BASES_SAMPLE_NOTES,
  createBasesViewsDocument,
} from "../bases-views-fixture";
import {
  BASES_EDITOR_SHELL_CONFIGURATION,
  createBasesEditorShellLayout,
} from "./create-shell-demo";

export const basesEditorShellExampleSource = `<script lang="ts">
  import { onMount } from "svelte";
  import { App, installApplicationCompatibility, MemoryAppDatabase, MemoryVaultAdapter, provideApplicationState } from "@lapis-notes/api";
  import { BasesPlugin } from "@lapis-notes/bases";
  import { FileExplorerPlugin } from "@lapis-notes/file-explorer";
  import { MarkdownPlugin } from "@lapis-notes/markdown";
  import { SearchPlugin } from "@lapis-notes/search";
  import { WorkspaceShell } from "@lapis-notes/workspace";

  const adapter = new MemoryVaultAdapter({
    ".obsidian/app.json": ${JSON.stringify(JSON.stringify(BASES_EDITOR_SHELL_CONFIGURATION))},
    ".obsidian/workspace.json": ${JSON.stringify(JSON.stringify(createBasesEditorShellLayout()))},
    "Bases/Projects.base": ${JSON.stringify(JSON.stringify(createBasesViewsDocument("table"), null, 2))},
    ...${JSON.stringify(BASES_SAMPLE_NOTES, null, 2)},
  });
  const app = new App({
    version: "1.0.0",
    configPath: ".obsidian/app.json",
    adapter,
    appDatabase: new MemoryAppDatabase("bases-editor-shell"),
    workspaceShell: { application: { name: "Lapis Notes" } },
    markdownRenderer: async () => {},
  });
  provideApplicationState(app);
  const disposeApplicationCompatibility = installApplicationCompatibility(app);
  let ready = $state(false);

  app.plugins.registerCorePlugins([
    { plugin: MarkdownPlugin, required: false, enabledByDefault: true, distribution: "bundled" },
    { plugin: FileExplorerPlugin, required: false, enabledByDefault: true, distribution: "bundled" },
    { plugin: SearchPlugin, required: false, enabledByDefault: true, distribution: "bundled" },
    { plugin: BasesPlugin, required: false, enabledByDefault: true, distribution: "bundled" },
  ]);
  onMount(() => {
    let stopTrackingMetadata = () => {};
    void (async () => {
      await app.vault.load();
      await app.configuration.load();
      await app.plugins.loadPlugins({ communityPlugins: "disabled", optionalCorePlugins: "configured" });
      stopTrackingMetadata = app.metadataTypeManager.trackChanges();
      await app.metadataCache.load();
      const search = app.plugins.plugins.get("search");
      if (search instanceof SearchPlugin) await search.refreshIndex("bases-shell");
      await app.workspace.loadLayout();
      ready = true;
    })();
    return () => {
      stopTrackingMetadata();
      disposeApplicationCompatibility();
    };
  });
</script>

{#if ready}
  <WorkspaceShell {app} displayMode="desktop" workspaceLabel="Lapis Notes" />
{/if}`;
