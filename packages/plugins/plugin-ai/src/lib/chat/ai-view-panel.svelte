<script lang="ts">
  import { onMount } from "svelte";
  import type { App, WorkspaceLeaf } from "@lapis-notes/api";
  import type { ConversationLocation } from "../conversations/types";
  import AiChatPanel from "./ai-chat-panel.svelte";
  import type { AiViewHost } from "./ai-view";
  import {
    initialAiViewBootstrap,
    prepareAiViewBootstrap,
    type AiViewBootstrap,
  } from "./ai-view-bootstrap";

  let {
    app,
    host,
    workspaceLeaf,
    initialLocation,
    onConversationLocationChange,
  }: {
    app: App;
    host: AiViewHost;
    workspaceLeaf: WorkspaceLeaf;
    initialLocation: ConversationLocation | null;
    onConversationLocationChange: (
      location: ConversationLocation | null,
    ) => void;
  } = $props();

  const mcpServers = $derived(host.mcpServers.list());
  const initialBootstrap = $derived(initialAiViewBootstrap(host));
  let preparedBootstrap = $state<AiViewBootstrap | null>(null);
  const bootstrap = $derived(preparedBootstrap ?? initialBootstrap);
  let initializing = $state(true);

  onMount(() => {
    let disposed = false;
    void prepareAiViewBootstrap(host, initialLocation, mcpServers)
      .then((prepared) => {
        if (disposed) return;
        preparedBootstrap = prepared;
        initializing = false;
      })
      .catch((error) => {
        if (disposed) return;
        preparedBootstrap = {
          ...bootstrap,
          unavailableReason:
            error instanceof Error ? error.message : String(error),
        };
        initializing = false;
      });
    return () => {
      disposed = true;
    };
  });
</script>

<AiChatPanel
  {app}
  runtime={bootstrap.runtime}
  selectRuntime={(request) => host.selectRuntime(request)}
  unavailableReason={bootstrap.unavailableReason}
  {initializing}
  {mcpServers}
  appToolBridge={host.appToolBridge}
  skills={host.skills}
  skillSnapshots={host.skillSnapshots}
  slashRouter={host.slashRouter}
  appToolHost={host.appToolHost}
  memoryRecall={host.memory}
  handoffSummaries={host.handoffSummaries}
  skillContext={host.skillContext}
  workspace={host.workspace}
  repository={host.conversations}
  {initialLocation}
  createConversation={(explicitFolder) =>
    host.createConversationInput(explicitFolder)}
  onRevealHistory={() => host.revealConversationHistory()}
  subscribeConversationMoves={host.subscribeConversationMoves?.bind(host)}
  {onConversationLocationChange}
  currentConversationScope={() => host.currentConversationScope()}
  listConversationFolders={() => host.listConversationFolders()}
  {workspaceLeaf}
  fileSearch={host.searchVaultFiles}
  models={bootstrap.models}
  modelCatalogError={bootstrap.modelCatalogError}
  settings={bootstrap.settings}
  onSettingsChange={(patch) => host.updateSettings(patch)}
/>
