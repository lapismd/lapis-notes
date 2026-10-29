<script lang="ts">
  import { onDestroy, onMount, untrack } from "svelte";
  import { AgentUiController } from "@lapismd/agent-ui/core";
  import { AgentChatScreen } from "@lapismd/agent-ui/chat";
  import { AgentHistoryScreen } from "@lapismd/agent-ui/screens";
  import { NativeChatObserver } from "./observer";
  import type { NativeChatSession } from "./session";
  import { NativeChatHistory } from "./history.svelte";
  import type { NativeChatLocation } from "./navigation";
  let {
    session,
    initialSession,
    initialScope,
    screen = "chat",
    onSelection,
    onHistory,
    onConversation,
    onDispose,
  }: {
    session: NativeChatSession;
    initialSession?: string;
    initialScope?: string;
    screen?: "chat" | "history";
    onSelection?(id: string, scope: string): void;
    onHistory?(): Promise<void>;
    onConversation?(location: NativeChatLocation): Promise<void>;
    onDispose?(pending: Promise<void>): void;
  } = $props();
  const port = untrack(
    () =>
      new NativeChatObserver(session, {
        initialSession,
        initialScope,
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
  const history = untrack(
    () =>
      new NativeChatHistory(
        () => controller,
        async (location) => {
          try {
            if (onConversation) await onConversation(location);
            else if (location.conversationId)
              controller.selectSession(location.conversationId);
            else await controller.action("new_session");
          } catch (error) {
            session.report(error as Error);
          }
        },
      ),
  );
  $effect(() => {
    if (screen === "chat" && controller.screen === "history" && onHistory) {
      controller.screen = "chat";
      void untrack(onHistory).catch((error) => session.report(error as Error));
    }
    history.syncScope();
  });
  let previous = "";
  $effect(() => {
    const snapshot = controller.snapshot;
    if (!snapshot) return;
    untrack(() => {
      controller.sessionId = port.selected;
      if (previous !== port.selected || !controller.selectedAgent) {
        controller.selectedAgent =
          snapshot.agents.find(
            (agent) => agent.id === controller.session?.agent,
          )?.id || snapshot.agents[0]?.id || "";
        previous = port.selected;
        onSelection?.(
          port.selected,
          controller.session?.scope ?? initialScope ?? "",
        );
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
    <AgentHistoryScreen {history} />
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
