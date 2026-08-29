<script lang="ts">
  import { untrack } from "svelte";
  import {
    App,
    AppResultViewRegistry,
    MemoryAppDatabase,
    TFile,
  } from "@lapis-notes/api";
  import { AppSlashCommandRegistry } from "@lapis-notes/api/agent-skills";
  import {
    AiChatPanel,
    FakeAgentRuntime,
    SkillRegistry,
    SlashCommandCatalog,
    SlashCommandRouter,
    createMemorySessionStore,
    formatFileMention,
    searchVaultFiles,
    type AiChatItem,
    type AgentRuntime,
    type AiPluginSettings,
    type FakeAgentTrace,
    type ModelRef,
    type VaultFileRef,
  } from "@lapis-notes/ai";
  import { MemoryVaultAdapter, Vault } from "@lapis-notes/api/vault";
  import { SearchToolResult } from "@lapis-notes/search";
  import "@lapis-notes/ai/styles.css";

  let {
    requireApproval = false,
    requireQuestion = false,
    persist = false,
    trace = "echo",
    seedItems = [],
    modelCatalogError = null,
    models = [
      { provider: "codex", model: "gpt-5.6-sol" },
      { provider: "codex", model: "gpt-5.4-medium" },
    ],
    files = [
      { path: "Notes/alpha.md", name: "alpha" },
      { path: "Notes/beta.md", name: "beta" },
    ],
    preservePending = false,
    seededHeight = "22rem",
    enableSkills = false,
    enableSearchResult = false,
    enableMemoryRecall = false,
    enableMarkdown = false,
  }: {
    requireApproval?: boolean;
    requireQuestion?: boolean;
    persist?: boolean;
    trace?: FakeAgentTrace;
    seedItems?: AiChatItem[];
    modelCatalogError?: string | null;
    models?: ModelRef[];
    files?: VaultFileRef[];
    preservePending?: boolean;
    seededHeight?: string;
    enableSkills?: boolean;
    enableSearchResult?: boolean;
    enableMemoryRecall?: boolean;
    enableMarkdown?: boolean;
  } = $props();
  let openedTick = $state(0);
  let recallCalls = $state(0);
  const openedPaths: string[] = [];

  function createSearchResultApp(): App {
    const registry = new AppResultViewRegistry();
    registry.register("search", {
      tool: "notes_search",
      component: SearchToolResult,
    });
    const chatLeaf = { view: {} };
    const file = { path: "Projects/auth.md" } as TFile;
    Object.setPrototypeOf(file, TFile.prototype);
    const fileLeaf = {
      view: {},
      openFile: async (openedFile: { path: string }) => {
        openedPaths.push(openedFile.path);
        openedTick += 1;
      },
    };
    return {
      agentResultViews: registry,
      vault: {
        getAbstractFileByPath: (path: string) =>
          path === "Projects/auth.md" ? file : null,
        cachedRead: async () => "hello OAuth tokens",
      },
      workspace: {
        getMostRecentLeaf: () => chatLeaf,
        activeLeaf: chatLeaf,
        getLeaf: () => fileLeaf,
        revealLeaf: () => undefined,
      },
    } as unknown as App;
  }

  const searchApp = $derived(
    enableSearchResult ? createSearchResultApp() : undefined,
  );
  const markdownApp = $derived.by(() => {
    if (!enableMarkdown) return undefined;
    return new App({
      version: "0.0.1-story",
      configPath: ".obsidian/app.json",
      adapter: new MemoryVaultAdapter({
        "Notes/alpha.md": "# Notes\n\nTODO: summarize this note.",
      }),
      appDatabase: new MemoryAppDatabase("lapis-ai-chat-story"),
      workspaceShell: { application: { name: "Lapis Notes" } },
      markdownRenderer: async () => {},
    });
  });
  const panelApp = $derived(searchApp ?? markdownApp);

  const runtime = $derived.by<AgentRuntime>(() => {
    const fake = new FakeAgentRuntime({
      requireApproval,
      requireQuestion,
      trace,
    });
    if (!preservePending) return fake;
    return {
      id: fake.id,
      capabilities: () => fake.capabilities(),
      supports: (request) => fake.supports(request),
      start: (request) => fake.start(request),
      async resume(sessionId) {
        return {
          id: sessionId,
          async *events() {},
          async send() {},
          async respondToApproval() {},
          async close() {},
        };
      },
    };
  });
  const skillHarness = $derived.by(() => {
    if (!enableSkills) return undefined;
    const vault = new Vault(new MemoryVaultAdapter());
    const skills = new SkillRegistry({
      vault,
      bundled: [
        {
          id: "bundled:research-notes",
          name: "research-notes",
          description: "Research notes in the current folder",
          source: "bundled" as const,
          root: "bundled/research-notes",
          version: "demo",
          userInvocable: true,
          modelInvocable: true,
          command: { kind: "model" as const },
          instructions: "Use notes_search then read.",
        },
      ],
    });
    const extensions = new AppSlashCommandRegistry();
    const extension = extensions.register(
      { pluginId: "demo" },
      {
        name: "open-daily-note",
        description: "Open today's daily note",
        dispatch: { kind: "host", execute: () => undefined },
      },
    );
    return {
      skills,
      slashRouter: new SlashCommandRouter(
        new SlashCommandCatalog(extensions),
        skills,
      ),
      unloadExtension: () => extension.dispose(),
    };
  });

  const sessionStore = $derived(
    persist || seedItems.length > 0
      ? createMemorySessionStore(
          seedItems.length > 0
            ? [
                {
                  id: "ai:default",
                  runtime: "fake",
                  runtimeSessionId: "fake-seed",
                  createdAt:
                    seedItems[0]?.createdAt ?? "2026-03-15T10:00:00.000Z",
                  updatedAt:
                    seedItems.at(-1)?.createdAt ?? "2026-03-16T10:00:00.000Z",
                  items: seedItems,
                },
              ]
            : [],
        )
      : undefined,
  );
  let settings = $state<
    Pick<
      AiPluginSettings,
      "defaultModel" | "thinking" | "memoryAutomaticRecall"
    >
  >({
    defaultModel: "gpt-5.6-sol",
    thinking: "medium",
    memoryAutomaticRecall: untrack(() => enableMemoryRecall),
  });
  const memoryRecall = {
    async recall() {
      recallCalls += 1;
      return [
        {
          kind: "memory-recall" as const,
          id: "memory:storybook-headings:1",
          content: "Use compact headings in Atlas notes.",
          metadata: {
            memoryId: "storybook-headings",
            revision: 1,
            scope: "project" as const,
          },
        },
      ];
    },
  };

  async function fileSearch(query: string) {
    return searchVaultFiles(files, query).map((file) => ({
      id: file.path,
      label: file.name,
      value: formatFileMention(file.path),
      description: file.path,
    }));
  }
</script>

<div
  class="ai-chat-demo"
  class:ai-chat-demo--seeded={seedItems.length > 0}
  style:--ai-chat-demo-seeded-height={seededHeight}
  data-testid="ai-chat-demo"
  data-opened-paths={openedTick >= 0 ? openedPaths.join(",") : ""}
  data-memory-recall-calls={recallCalls}
>
  {#if enableSkills}
    <button
      type="button"
      class="sr-only"
      data-testid="ai-chat-unload-extension"
      onclick={() => skillHarness?.unloadExtension()}
    >
      Unload extension command
    </button>
  {/if}
  <AiChatPanel
    app={panelApp}
    {runtime}
    {sessionStore}
    skills={skillHarness?.skills}
    slashRouter={skillHarness?.slashRouter}
    {fileSearch}
    {models}
    {modelCatalogError}
    {settings}
    memoryRecall={enableMemoryRecall ? memoryRecall : undefined}
    onSettingsChange={(patch) => {
      settings = { ...settings, ...patch };
    }}
  />
</div>

<style>
  .ai-chat-demo {
    display: flex;
    flex-direction: column;
    min-height: 28rem;
    height: 100%;
  }

  .ai-chat-demo > :global([data-ui-component="ai-chat-panel"]) {
    flex: 1 1 auto;
    min-height: 0;
  }

  .ai-chat-demo--seeded {
    height: var(--ai-chat-demo-seeded-height);
    min-height: var(--ai-chat-demo-seeded-height);
    max-height: var(--ai-chat-demo-seeded-height);
  }
</style>
