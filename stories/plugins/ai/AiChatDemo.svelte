<script lang="ts">
  import { AiChatPanel, FakeAgentRuntime } from "@lapis-notes/ai";
  import "@lapis-notes/ai/styles.css";

  let { requireApproval = false }: { requireApproval?: boolean } = $props();
  const runtime = $derived(new FakeAgentRuntime({ requireApproval }));
</script>

<div class="ai-chat-demo" data-testid="ai-chat-demo">
  <AiChatPanel {runtime} />
</div>

<style>
  .ai-chat-demo {
    min-height: 28rem;
    height: 100%;
  }
</style>
