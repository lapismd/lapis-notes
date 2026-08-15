import {
  AI_WORKSPACE_CONFIGURATION,
  AI_WORKSPACE_PLUGIN_DATA,
  createAiWorkspaceLayout,
} from "./create-ai-workspace-demo";

export const aiWorkspaceExampleSource = `<script lang="ts">
  import { onMount } from "svelte";
  import { App, MemoryAppDatabase, MemoryVaultAdapter } from "@lapis-notes/api";
  import { AiPlugin } from "@lapis-notes/ai";
  import { MarkdownPlugin } from "@lapis-notes/markdown";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import "@lapis-notes/ai/styles.css";

  const adapter = new MemoryVaultAdapter({
    ".obsidian/app.json": ${JSON.stringify(JSON.stringify(AI_WORKSPACE_CONFIGURATION))},
    ".obsidian/workspace.json": ${JSON.stringify(JSON.stringify(createAiWorkspaceLayout()))},
    ".obsidian/ai.json": ${JSON.stringify(JSON.stringify(AI_WORKSPACE_PLUGIN_DATA))},
    "Notes/Welcome.md": "# Welcome\\n\\nAsk the AI chat in the right sidebar.\\n",
    "Notes/alpha.md": "# Alpha\\n\\nTODO: summarize this note.\\n",
  });
  const app = new App({
    version: "1.0.0",
    configPath: ".obsidian/app.json",
    adapter,
    appDatabase: new MemoryAppDatabase("ai-workspace"),
    workspaceShell: { application: { name: "Lapis Notes" } },
    markdownRenderer: async () => {},
  });
  let ready = $state(false);

  app.plugins.registerCorePlugins([
    { plugin: MarkdownPlugin, required: false, enabledByDefault: true, distribution: "bundled" },
    { plugin: AiPlugin, required: false, enabledByDefault: true, distribution: "bundled" },
  ]);
  onMount(() => {
    let stopTrackingMetadata = () => {};
    void (async () => {
      globalThis.app = app;
      await app.vault.load();
      await app.configuration.load();
      await app.plugins.loadPlugins({ communityPlugins: "disabled", optionalCorePlugins: "configured" });
      stopTrackingMetadata = app.metadataTypeManager.trackChanges();
      await app.metadataCache.load();
      await app.workspace.loadLayout();
      ready = true;
    })();
    return () => stopTrackingMetadata();
  });
</script>

{#if ready}
  <WorkspaceShell {app} displayMode="desktop" workspaceLabel="Lapis Notes" />
{/if}`;
