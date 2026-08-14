<script lang="ts">
  import * as Chat from "@lapismd/design-core/ai/chat";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import type { AgentRuntime, ToolContribution } from "../core/types";
  import AiApprovalCard from "./ai-approval-card.svelte";
  import { AiChatController } from "./chat-controller.svelte";

  let {
    runtime,
    unavailableReason = null,
    workspace,
    tools = [],
  }: {
    runtime: AgentRuntime;
    unavailableReason?: string | null;
    workspace?: string;
    tools?: ToolContribution[];
  } = $props();

  const controller = $derived(
    new AiChatController(runtime, unavailableReason, tools),
  );
  let draft = $state("");

  async function submit(prompt: string): Promise<void> {
    await controller.submit(prompt, { workspace, tools });
  }

  $effect(() => {
    const current = controller;
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
        placeholder="Ask the agent…"
        disabled={controller.busy}
        isStopShown={controller.busy}
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
