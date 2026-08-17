export const aiLiveHostExampleSource = `<script lang="ts">
  import { onMount } from "svelte";
  import { App, installApplicationCompatibility, MemoryAppDatabase, MemoryVaultAdapter } from "@lapis-notes/api";
  import { AiPlugin } from "@lapis-notes/ai";
  import { MarkdownPlugin } from "@lapis-notes/markdown";
  import { WorkspaceShell } from "@lapis-notes/workspace";
  import "@lapis-notes/ai/styles.css";

  const attached = Boolean(import.meta.env.LAPIS_AGENT_RUNTIME_URL?.trim())
    && Boolean(import.meta.env.LAPIS_AGENT_RUNTIME_TOKEN?.trim());
  const storageKey = "lapis-ai-story:lapis-ai-live-host:portable-conversations";
  const portableFiles = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
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
    }),
    "Notes/Welcome.md": "# Welcome\\n\\nAsk the live AI host in the right sidebar.\\n",
    ...portableFiles,
  });
  adapter.onWrite = (path, data) => {
    if (/(?:^|\\/)\\.lapis\\/agents\\/sessions\\/.+\\/(?:metadata\\.yaml|agents\\.jsonl|transcript\\.jsonl)$/.test(path)) {
      portableFiles[path] = data;
      localStorage.setItem(storageKey, JSON.stringify(portableFiles));
    }
  };
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
    const releaseApplicationCompatibility = installApplicationCompatibility(app);
    void (async () => {
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
    return () => releaseApplicationCompatibility();
  });
</script>

{#if !attached}
  <section>
    <h1>Live AI host</h1>
    <p>Run pnpm ai:smoke:storybook for the seeded supervised lane, or attach a lower-level host manually. Portable .lapis/agents files survive reload.</p>
  </section>
{:else if ready}
  <WorkspaceShell {app} displayMode="desktop" workspaceLabel="Lapis Notes" />
{/if}`;
