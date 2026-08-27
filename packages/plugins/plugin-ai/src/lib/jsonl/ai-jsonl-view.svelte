<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { MarkdownEmbed } from "@lapis-notes/markdown/embed";
  import * as Chat from "@lapismd/design-core/ai/chat";
  import { Reasoning } from "@lapismd/design-core/ai/experimental";
  import { CodeBlock } from "@lapismd/design-core/shadcn/code-block";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import FileJsonIcon from "@lucide/svelte/icons/file-json";
  import type { ToolCallItem } from "@lapismd/design-core/ai/chat";
  import { mentionTokensFromText } from "../chat/chat-mentions";
  import { formatChatTimestamp, groupChatItemsByDate } from "../chat/chat-time";
  import {
    isOneLineAlert,
    presentToolPayload,
    toolCallStatus,
    toolCallTarget,
    type AiChatToolItem,
  } from "../chat/chat-tool-display";
  import type { AgentBindingRecord } from "../conversations/types";
  import { createAiJsonlPreview } from "./ai-jsonl-preview";

  let {
    app,
    data,
    filePath,
  }: { app: App; data: string; filePath: string } = $props();

  const preview = $derived(createAiJsonlPreview(filePath, data));
  const timeline = $derived(
    preview.kind === "transcript"
      ? groupChatItemsByDate(preview.items)
      : [],
  );
  const isEmpty = $derived(
    (preview.kind === "transcript" && preview.entries.length === 0) ||
      (preview.kind === "agents" && preview.records.length === 0) ||
      (preview.kind === "records" && preview.records.length === 0),
  );

  function toolCallProps(item: AiChatToolItem): ToolCallItem {
    const hint = { toolName: item.name, input: item.input };
    const presentedError =
      item.state === "error" ? presentToolPayload(item.output, hint) : undefined;
    return {
      id: item.toolId,
      name: item.name,
      status: toolCallStatus(item.state),
      errorMessage:
        presentedError && isOneLineAlert(presentedError)
          ? presentedError.code
          : undefined,
      target: toolCallTarget(item.input, item.server),
      data: { input: item.input, output: item.output },
      detail: item.input || item.output ? toolDetail : undefined,
    };
  }

  function agentRecordLabel(record: AgentBindingRecord): string {
    switch (record.type) {
      case "binding.created":
        return `Agent binding created · ${record.agent ?? record.runtime}`;
      case "usage.updated":
        return `Context usage updated · ${record.usage.used.toLocaleString()} of ${record.usage.limit.toLocaleString()}`;
      case "binding.context.updated":
        return `Context checkpoint updated · ${record.cause}`;
      case "binding.config.updated":
        return "Agent configuration updated";
      case "handoff.summary.created":
        return "Handoff summary created";
    }
  }

  function recordJson(value: unknown): string {
    return JSON.stringify(value, null, 2);
  }
</script>

{#snippet emptyComposer()}{/snippet}

{#snippet emptyState()}
  <Empty.Root>
    <Empty.Header>
      <Empty.Media variant="icon"><FileJsonIcon aria-hidden="true" /></Empty.Media>
      <Empty.Title>Empty JSONL file</Empty.Title>
      <Empty.Description>Records will appear here when they are appended.</Empty.Description>
    </Empty.Header>
  </Empty.Root>
{/snippet}

{#snippet toolDetail(call: ToolCallItem)}
  {@const payload = call.data as { input?: string; output?: string }}
  <div class="ai-jsonl-view__tool-detail">
    {#if payload.input}
      <CodeBlock
        code={presentToolPayload(payload.input)?.code ?? payload.input}
        language={presentToolPayload(payload.input)?.language ?? "plaintext"}
        title="Input"
        width="100%"
        size="sm"
        isWrapped
      />
    {/if}
    {#if payload.output}
      <CodeBlock
        code={presentToolPayload(payload.output)?.code ?? payload.output}
        language={presentToolPayload(payload.output)?.language ?? "plaintext"}
        title="Output"
        width="100%"
        size="sm"
        isWrapped
      />
    {/if}
  </div>
{/snippet}

<div
  class="ai-jsonl-view"
  data-ui-component="ai-jsonl-view"
  data-preview-kind={preview.kind}
  data-file-path={filePath}
>
  <Chat.Layout
    density="compact"
    {isEmpty}
    {emptyState}
    composer={emptyComposer}
    aria-label="AI JSONL preview"
  >
    <Chat.MessageList
      density="compact"
      {isEmpty}
      {emptyState}
      aria-label="JSONL records"
    >
      {#if preview.kind === "error"}
        <Chat.Message sender="assistant">
          <Chat.MessageBubble>{preview.message}</Chat.MessageBubble>
          {#snippet metadata()}
            <Chat.MessageMetadata status="error" />
          {/snippet}
        </Chat.Message>
      {:else}
        {#each preview.warnings as warning}
          <Chat.SystemMessage>
            Line {warning.line}: {warning.message}
          </Chat.SystemMessage>
        {/each}
      {/if}

      {#if preview.kind === "transcript"}
        {#each timeline as entry (entry.kind === "item" ? entry.item.id : entry.id)}
          {#if entry.kind === "divider"}
            <Chat.SystemMessage variant="divider">{entry.label}</Chat.SystemMessage>
          {:else if entry.kind === "tools"}
            <Chat.ToolCalls
              calls={entry.items.map(toolCallProps)}
              defaultExpanded={false}
            />
          {:else if entry.item.type === "message"}
            {@const message = entry.item}
            <Chat.Message sender={message.role}>
              <Chat.MessageBubble>
                {#if message.role === "assistant"}
                  <MarkdownEmbed
                    {app}
                    value={message.text}
                    htmlPolicy="safe"
                    class="ai-jsonl-view__markdown"
                  />
                {:else}
                  <Chat.TokenizedText
                    text={message.text}
                    tokens={mentionTokensFromText(message.text)}
                  />
                {/if}
              </Chat.MessageBubble>
              {#snippet metadata()}
                {#if message.createdAt}
                  <Chat.MessageMetadata timestamp={formatChatTimestamp(message.createdAt)} />
                {/if}
              {/snippet}
            </Chat.Message>
          {:else if entry.item.type === "thinking"}
            <Reasoning
              preview={entry.item.text}
              label={entry.item.kind === "plan" ? "Plan" : "Thinking"}
            >
              {entry.item.text}
            </Reasoning>
          {:else if entry.item.type === "error"}
            <Chat.Message sender="assistant">
              <Chat.MessageBubble>{entry.item.text}</Chat.MessageBubble>
              {#snippet metadata()}
                <Chat.MessageMetadata
                  timestamp={entry.item.createdAt
                    ? formatChatTimestamp(entry.item.createdAt)
                    : undefined}
                  status="error"
                />
              {/snippet}
            </Chat.Message>
          {:else if entry.item.type === "approval"}
            <Chat.SystemMessage>
              Approval {entry.item.status}: {entry.item.request.title}
            </Chat.SystemMessage>
          {:else if entry.item.type === "question"}
            <Chat.SystemMessage>
              Question {entry.item.status}: {entry.item.request.title}
            </Chat.SystemMessage>
          {:else}
            <Chat.SystemMessage>{entry.item.text}</Chat.SystemMessage>
          {/if}
        {/each}
      {:else if preview.kind === "agents"}
        {#each preview.records as record (record.id)}
          <section class="ai-jsonl-view__record" data-record-type={record.type}>
            <Chat.SystemMessage>
              {agentRecordLabel(record)} · {formatChatTimestamp(record.createdAt)}
            </Chat.SystemMessage>
            {#if record.type === "handoff.summary.created"}
              <Chat.Message sender="assistant">
                <Chat.MessageBubble>
                  <MarkdownEmbed
                    {app}
                    value={record.summary}
                    htmlPolicy="safe"
                    class="ai-jsonl-view__markdown"
                  />
                </Chat.MessageBubble>
              </Chat.Message>
            {/if}
            <CodeBlock
              code={recordJson(record)}
              language="json"
              width="100%"
              size="sm"
              isCollapsible
              collapsibleThreshold={8}
              hasLineNumbers
            />
          </section>
        {/each}
      {:else if preview.kind === "records"}
        {#each preview.records as record (record.line)}
          <section class="ai-jsonl-view__record">
            <Chat.SystemMessage variant="divider">Line {record.line}</Chat.SystemMessage>
            <CodeBlock
              code={recordJson(record.value)}
              language="json"
              width="100%"
              size="sm"
              isWrapped
              hasLineNumbers
            />
          </section>
        {/each}
      {/if}
    </Chat.MessageList>
  </Chat.Layout>
</div>
