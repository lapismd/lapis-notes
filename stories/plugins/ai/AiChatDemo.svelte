<script lang="ts">
  import {
    AiChatPanel,
    FakeAgentRuntime,
    createMemorySessionStore,
    formatFileMention,
    searchVaultFiles,
    type AiChatItem,
    type AiPluginSettings,
    type FakeAgentTrace,
    type ModelRef,
    type VaultFileRef,
  } from "@lapis-notes/ai";
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
  }: {
    requireApproval?: boolean;
    requireQuestion?: boolean;
    persist?: boolean;
    trace?: FakeAgentTrace;
    seedItems?: AiChatItem[];
    modelCatalogError?: string | null;
    models?: ModelRef[];
    files?: VaultFileRef[];
  } = $props();

  const runtime = $derived(
    new FakeAgentRuntime({ requireApproval, requireQuestion, trace }),
  );
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
  data-testid="ai-chat-demo"
>
  <AiChatPanel
    {runtime}
    {sessionStore}
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
    height: 22rem;
    min-height: 22rem;
    max-height: 22rem;
  }
</style>
