export const aiLiveHostExampleSource = `<script lang="ts">
  import { onMount } from "svelte";
  import { App, MemoryAppDatabase, MemoryVaultAdapter } from "@lapis-notes/api";
  import { AiPlugin } from "@lapis-notes/ai";
  import { MarkdownPlugin } from "@lapis-notes/markdown";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import "@lapis-notes/ai/styles.css";

  const attached = Boolean(import.meta.env.LAPIS_AGENT_RUNTIME_URL?.trim())
    && Boolean(import.meta.env.LAPIS_AGENT_RUNTIME_TOKEN?.trim());
  const adapter = new MemoryVaultAdapter({
    ".obsidian/app.json": JSON.stringify({
      "appearence.interface.showTabTitleBar": true,
    }),
    ".obsidian/ai.json": JSON.stringify({
      settings: {
        defaultRuntime: "acp",
        acpAgent: "codex",
        defaultModel: "gpt-5.6-sol",
        thinking: "medium",
      },
      sessions: [],
    }),
    "Notes/Welcome.md": "# Welcome\\n\\nAsk the live AI host in the right sidebar.\\n",
  });
  const app = new App({
    version: "1.0.0",
    configPath: ".obsidian/app.json",
    adapter,
    appDatabase: new MemoryAppDatabase("ai-live-host"),
    workspaceShell: { application: { name: "Lapis Notes" } },
    markdownRenderer: async () => {},
  });
  let ready = $state(false);

  app.plugins.registerCorePlugins([
    { plugin: MarkdownPlugin, required: false, enabledByDefault: true, distribution: "bundled" },
    { plugin: AiPlugin, required: false, enabledByDefault: true, distribution: "bundled" },
  ]);
  onMount(() => {
    if (!attached) return;
    void (async () => {
      globalThis.app = app;
      await app.vault.load();
      await app.configuration.load();
      await app.plugins.loadPlugins({
        communityPlugins: "disabled",
        optionalCorePlugins: "configured",
      });
      await app.metadataCache.load();
      await app.workspace.loadLayout();
      ready = true;
    })();
  });
</script>

{#if !attached}
  <section>
    <h1>Live AI host</h1>
    <p>Start pnpm ai-host serve, set URL and token in .env.storybook.local, then restart Storybook.</p>
  </section>
{:else if ready}
  <WorkspaceShell {app} displayMode="desktop" workspaceLabel="Lapis Notes" />
{/if}`;
