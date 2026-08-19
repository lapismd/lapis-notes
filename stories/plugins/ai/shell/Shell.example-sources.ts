import {
  AI_WORKSPACE_CONFIGURATION,
  AI_WORKSPACE_PLUGIN_DATA,
  createAiWorkspaceLayout,
} from "./create-shell-demo";

export const aiWorkspaceExampleSource = `<script lang="ts">
  import { onMount } from "svelte";
  import { App, installApplicationCompatibility, MemoryAppDatabase, MemoryVaultAdapter } from "@lapis-notes/api";
  import { AiPlugin } from "@lapis-notes/ai";
  import { FileExplorerPlugin } from "@lapis-notes/file-explorer";
  import { MarkdownPlugin } from "@lapis-notes/markdown";
  import { SearchPlugin } from "@lapis-notes/search";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import "@lapis-notes/ai/styles.css";

  const adapter = new MemoryVaultAdapter({
    ".obsidian/app.json": ${JSON.stringify(JSON.stringify(AI_WORKSPACE_CONFIGURATION))},
    ".obsidian/workspace.json": ${JSON.stringify(JSON.stringify(createAiWorkspaceLayout()))},
    ".obsidian/ai.json": ${JSON.stringify(JSON.stringify(AI_WORKSPACE_PLUGIN_DATA))},
    "Notes/Welcome.md": "# Welcome\\n\\nAsk the AI chat in the workspace.\\n",
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
    { plugin: FileExplorerPlugin, required: false, enabledByDefault: true, distribution: "bundled" },
    { plugin: SearchPlugin, required: false, enabledByDefault: true, distribution: "bundled" },
    { plugin: AiPlugin, required: false, enabledByDefault: true, distribution: "bundled" },
  ]);
  onMount(() => {
    let stopTrackingMetadata = () => {};
    const releaseApplicationCompatibility = installApplicationCompatibility(app);
    void (async () => {
      await app.vault.load();
      await app.configuration.load();
      await app.plugins.loadPlugins({ communityPlugins: "disabled", optionalCorePlugins: "configured" });
      stopTrackingMetadata = app.metadataTypeManager.trackChanges();
      await app.metadataCache.load();
      await app.workspace.loadLayout();
      ready = true;
    })();
    return () => {
      stopTrackingMetadata();
      releaseApplicationCompatibility();
    };
  });
</script>

{#if ready}
  <WorkspaceShell {app} displayMode="desktop" workspaceLabel="Lapis Notes" />
{/if}`;

export const aiWorkspaceFollowScopeExampleSource = `<script lang="ts">
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import { App } from "@lapis-notes/api";

  // Seed Projects/work.md plus two descendant conversations, then open the
  // unbound AI chat. An unpinned idle view lists those chats in Command View.
  let { app }: { app: App } = $props();
</script>

<WorkspaceShell {app} displayMode="desktop" workspaceLabel="Lapis Notes" />`;
