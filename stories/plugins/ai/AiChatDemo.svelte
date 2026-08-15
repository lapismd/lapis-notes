<script lang="ts">
  import {
    AiChatPanel,
    FakeAgentRuntime,
    createMemorySessionStore,
    formatFileMention,
    searchVaultFiles,
    type VaultFileRef,
  } from "@lapis-notes/ai";
  import "@lapis-notes/ai/styles.css";

  let {
    requireApproval = false,
    persist = false,
    files = [
      { path: "Notes/alpha.md", name: "alpha" },
      { path: "Notes/beta.md", name: "beta" },
    ],
  }: {
    requireApproval?: boolean;
    persist?: boolean;
    files?: VaultFileRef[];
  } = $props();

  const runtime = $derived(new FakeAgentRuntime({ requireApproval }));
  const sessionStore = $derived(persist ? createMemorySessionStore() : undefined);

  async function fileSearch(query: string) {
    return searchVaultFiles(files, query).map((file) => ({
      id: file.path,
      label: file.name,
      value: formatFileMention(file.path),
      description: file.path,
    }));
  }
</script>

<div class="ai-chat-demo" data-testid="ai-chat-demo">
  <AiChatPanel {runtime} {sessionStore} {fileSearch} />
</div>

<style>
  .ai-chat-demo {
    min-height: 28rem;
    height: 100%;
  }
</style>
