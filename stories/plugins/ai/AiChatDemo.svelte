<script lang="ts">
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
  } = $props();

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
    return {
      skills,
      slashRouter: new SlashCommandRouter(new SlashCommandCatalog(), skills),
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
  let settings = $state<Pick<AiPluginSettings, "defaultModel" | "thinking">>({
    defaultModel: "gpt-5.6-sol",
    thinking: "medium",
  });

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
>
  <AiChatPanel
    {runtime}
    {sessionStore}
    skills={skillHarness?.skills}
    slashRouter={skillHarness?.slashRouter}
    {fileSearch}
    {models}
    {modelCatalogError}
    {settings}
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
