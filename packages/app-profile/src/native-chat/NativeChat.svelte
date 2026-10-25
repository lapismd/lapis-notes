<script lang="ts">
  import { onDestroy, onMount, untrack } from "svelte";
  import { AgentUiController } from "@lapismd/agent-ui/core";
  import { AgentChatScreen } from "@lapismd/agent-ui/chat";
  import { AgentHistoryScreen } from "@lapismd/agent-ui/screens";
  import { NativeChatObserver } from "./observer";
  import type { NativeChatSession } from "./session";
  let {
    session,
    initialSession,
    screen = "chat",
    onSelection,
    onDispose,
  }: {
    session: NativeChatSession;
    initialSession?: string;
    screen?: "chat" | "history";
    onSelection?(id: string): void;
    onDispose?(pending: Promise<void>): void;
  } = $props();
  const port = untrack(
    () =>
      new NativeChatObserver(session, {
        initialSession,
        target: () => controller.selectedAgent,
      }),
  );
  const controller: AgentUiController = untrack(
    () =>
      new AgentUiController(port, undefined, {
        canComment: () => false,
      }),
  );
  untrack(() => {
    controller.screen = screen;
  });
  let previous = "";
  $effect(() => {
    const snapshot = controller.snapshot;
    if (!snapshot) return;
    untrack(() => {
      controller.sessionId = port.selected;
      if (previous !== port.selected || !controller.selectedAgent) {
        controller.selectedAgent =
          controller.session?.agent || snapshot.agents[0]?.id || "";
        previous = port.selected;
        onSelection?.(port.selected);
      }
    });
  });
  onMount(() => {
    void controller.refresh();
  });
  onDestroy(() => {
    port.close();
    onDispose?.(controller.close());
  });
</script>

<div class="native-chat" data-testid="ai-chat-panel" data-native-chat="true">
  {#if controller.screen === "history"}
    <AgentHistoryScreen {controller} />
  {:else}
    <AgentChatScreen {controller} />
  {/if}
</div>

<style>
  .native-chat {
    display: flex;
    flex: 1;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
  }
</style>
