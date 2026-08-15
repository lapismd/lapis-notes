<script lang="ts">
  import * as Chat from "@lapismd/design-core/ai/chat";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import type {
    ComposerSearchSource,
    ComposerTrigger,
  } from "@lapismd/design-core/ai/chat";
  import type { AgentRuntime, ToolContribution } from "../core/types";
  import type { AgentSessionStore } from "../sessions/session-store";
  import { formatFileMention } from "./chat-mentions";
  import AiApprovalCard from "./ai-approval-card.svelte";
  import { AiChatController } from "./chat-controller.svelte";

  let {
    runtime,
    unavailableReason = null,
    workspace,
    tools = [],
    sessionStore,
    sessionId,
    fileSearch,
  }: {
    runtime: AgentRuntime;
    unavailableReason?: string | null;
    workspace?: string;
    tools?: ToolContribution[];
    sessionStore?: AgentSessionStore;
    sessionId?: string;
    fileSearch?: ComposerSearchSource;
  } = $props();

  const controller = $derived(
    new AiChatController(runtime, unavailableReason, tools, {
      store: sessionStore,
      sessionId,
      workspace,
    }),
  );
  let draft = $state("");
  const mentionTriggers = $derived.by<ComposerTrigger[]>(() => {
    if (!fileSearch) return [];
    return [
      {
        character: "@",
        menuLabel: "Files",
        emptySearchResultsText: "No vault files",
        searchSource: fileSearch,
        onSelect: (item) => ({
          value: item.value ?? formatFileMention(item.id),
          label: item.label,
          variant: "secondary",
        }),
      },
    ];
  });

  async function submit(prompt: string): Promise<void> {
    await controller.submit(prompt, { workspace, tools });
  }

  $effect(() => {
    const current = controller;
    void current.restore();
    return () => {
      void current.close();
    };
  });
</script>

<div
  class="ai-chat-panel"
  data-ui-component="ai-chat-panel"
  data-testid="ai-chat-panel"
>
  {#if unavailableReason}
    <p class="ai-chat-panel__unavailable" data-testid="ai-chat-unavailable">
      {unavailableReason}
    </p>
  {/if}
  <Chat.Layout aria-label="AI chat">
    {#snippet composer()}
      <Chat.Composer
        bind:value={draft}
        placeholder="Ask the agent… Use @ to attach a vault file"
        disabled={controller.busy}
        isStopShown={controller.busy}
        triggers={mentionTriggers}
        onSubmit={(value) => void submit(value)}
        onStop={() => {
          void controller.cancel();
        }}
      />
    {/snippet}
    <Chat.MessageList>
      {#each controller.items as item (item.id)}
        {#if item.type === "message"}
          <Chat.Message sender={item.role === "user" ? "user" : "assistant"}>
            <Chat.MessageBubble>{item.text}</Chat.MessageBubble>
          </Chat.Message>
        {:else if item.type === "thinking"}
          <Chat.SystemMessage>{item.text}</Chat.SystemMessage>
        {:else if item.type === "tool"}
          <Chat.ToolCalls
            calls={[
              {
                id: item.toolId,
                name: item.name,
                status:
                  item.state === "completed"
                    ? "complete"
                    : item.state === "error"
                      ? "error"
                      : "running",
                errorMessage: item.state === "error" ? item.output : undefined,
                data: item.output,
              },
            ]}
          />
        {:else if item.type === "approval"}
          {#if item.status === "pending"}
            <AiApprovalCard
              request={item.request}
              disabled={item.status !== "pending"}
              onRespond={(optionId) =>
                void controller.respondToApproval(item.request.id, optionId)}
            />
          {:else}
            <Chat.SystemMessage>
              Approval {item.status}
              {item.responseOptionId ? ` (${item.responseOptionId})` : ""}
            </Chat.SystemMessage>
          {/if}
        {:else if item.type === "error"}
          <Chat.SystemMessage>{item.text}</Chat.SystemMessage>
        {:else}
          <Chat.SystemMessage>{item.text}</Chat.SystemMessage>
        {/if}
      {/each}
    </Chat.MessageList>
  </Chat.Layout>
  {#if controller.error}
    <p class="ai-chat-panel__error" data-testid="ai-chat-error">
      {controller.error}
    </p>
  {/if}
  {#if controller.busy}
    <Button
      variant="ghost"
      size="sm"
      onclick={() => void controller.cancel()}
    >
      Stop
    </Button>
  {/if}
</div>
