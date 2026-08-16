<script lang="ts">
  import * as Chat from "@lapismd/design-core/ai/chat";
  import { Reasoning } from "@lapismd/design-core/ai/experimental";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Command from "@lapismd/design-core/shadcn/command";
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import type {
    ComposerSearchSource,
    ComposerTrigger,
    ComposerTriggerItem,
  } from "@lapismd/design-core/ai/chat";
  import BrainIcon from "@lucide/svelte/icons/brain";
  import PaperclipIcon from "@lucide/svelte/icons/paperclip";
  import XIcon from "@lucide/svelte/icons/x";
  import type {
    AgentRuntime,
    AiThinkingLevel,
    ModelRef,
    ToolContribution,
  } from "../core/types";
  import type { AgentSessionStore } from "../sessions/session-store";
  import { catalogModelsForAgent } from "../settings/acp-agents";
  import {
    DEFAULT_AI_SETTINGS,
    type AiPluginSettings,
  } from "../settings/ai-settings";
  import {
    formatFileMention,
    mentionTokensFromText,
  } from "./chat-mentions";
  import { renderChatMarkdown } from "./chat-markdown";
  import { formatChatTimestamp, groupChatItemsByDate } from "./chat-time";
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
    models = [],
    modelCatalogError = null,
    settings,
    onSettingsChange,
  }: {
    runtime: AgentRuntime;
    unavailableReason?: string | null;
    workspace?: string;
    tools?: ToolContribution[];
    sessionStore?: AgentSessionStore;
    sessionId?: string;
    fileSearch?: ComposerSearchSource;
    models?: ModelRef[];
    modelCatalogError?: string | null;
    settings?: Pick<AiPluginSettings, "acpAgent" | "defaultModel" | "thinking">;
    onSettingsChange?: (patch: Partial<AiPluginSettings>) => void | Promise<void>;
  } = $props();

  const controller = $derived(
    new AiChatController(runtime, unavailableReason, tools, {
      store: sessionStore,
      sessionId,
      workspace,
      request: {
        agent: settings?.acpAgent,
        model: settings?.defaultModel
          ? {
              provider: settings.acpAgent,
              model: settings.defaultModel,
            }
          : undefined,
        thinking: settings?.thinking,
      },
    }),
  );
  let draft = $state("");
  let localModel = $state<string | null>(null);
  let localThinking = $state<AiThinkingLevel | null>(null);
  let attachments = $state<{ path: string; name: string }[]>([]);
  let drawerCollapsed = $state(false);
  let attachOpen = $state(false);
  let attachItems = $state<ComposerTriggerItem[]>([]);
  const selectedAgent = $derived(
    settings?.acpAgent ?? DEFAULT_AI_SETTINGS.acpAgent,
  );
  const selectedModel = $derived(
    localModel ?? settings?.defaultModel ?? DEFAULT_AI_SETTINGS.defaultModel,
  );
  const selectedThinking = $derived(
    localThinking ?? settings?.thinking ?? DEFAULT_AI_SETTINGS.thinking,
  );
  const modelOptions = $derived.by<ModelRef[]>(() => {
    const available = catalogModelsForAgent(selectedAgent, models);
    if (
      selectedModel &&
      !available.some((model) => model.model === selectedModel)
    ) {
      return [
        { provider: selectedAgent, model: selectedModel },
        ...available,
      ];
    }
    return available;
  });
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
  const timeline = $derived(groupChatItemsByDate(controller.items));
  const latestMessageId = $derived(controller.items.at(-1)?.id);
  const isEmpty = $derived(controller.items.length === 0);

  async function submit(prompt: string): Promise<void> {
    const selected = catalogModelsForAgent(selectedAgent, models).find(
      (model) => model.model === selectedModel,
    );
    const extra = attachments.map((file) => file.path);
    attachments = [];
    drawerCollapsed = false;
    await controller.submit(prompt, {
      workspace,
      tools,
      agent: selectedAgent,
      model: selectedModel
        ? {
            provider: selected?.provider ?? selectedAgent,
            model: selectedModel,
          }
        : undefined,
      thinking: selectedThinking,
      metadata: extra.length > 0 ? { attachments: extra } : undefined,
    });
  }

  function changeModel(value: string): void {
    localModel = value;
    void onSettingsChange?.({ defaultModel: value });
  }

  function changeThinking(value: string): void {
    localThinking = value as AiThinkingLevel;
    void onSettingsChange?.({ thinking: localThinking });
  }

  function addAttachment(item: ComposerTriggerItem): void {
    const path = item.id;
    if (!path || attachments.some((file) => file.path === path)) {
      attachOpen = false;
      return;
    }
    attachments = [...attachments, { path, name: item.label || path }];
    drawerCollapsed = false;
    attachOpen = false;
  }

  function removeAttachment(path: string): void {
    attachments = attachments.filter((file) => file.path !== path);
  }

  async function loadVaultFiles(): Promise<void> {
    if (!fileSearch) {
      attachItems = [];
      return;
    }
    attachItems = await fileSearch("", new AbortController().signal);
  }

  function onAttachOpenChange(open: boolean): void {
    attachOpen = open;
    if (open) {
      void loadVaultFiles();
      return;
    }
    attachItems = [];
  }

  $effect(() => {
    const current = controller;
    void current.restore();
    return () => {
      void current.close();
    };
  });
</script>

{#snippet toolDetail(call: { data?: unknown })}
  {@const detail = call.data as { input?: string; output?: string } | undefined}
  <div class="ai-chat-panel__tool-detail">
    {#if detail?.input}
      <strong>Command / input</strong>
      <pre>{detail.input}</pre>
    {/if}
    {#if detail?.output}
      <strong>Output</strong>
      <pre>{detail.output}</pre>
    {/if}
  </div>
{/snippet}

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
  <Chat.Layout density="compact" {isEmpty} aria-label="AI chat">
    {#snippet composer()}
      <Chat.Composer
        bind:value={draft}
        placeholder="Ask the agent… Use @ or the paperclip to attach a vault file"
        disabled={controller.busy}
        isStopShown={controller.busy}
        triggers={mentionTriggers}
        onSubmit={(value) => void submit(value)}
        onStop={() => {
          void controller.cancel();
        }}
      >
        {#snippet drawer()}
          {#if attachments.length > 0}
            <Chat.ComposerDrawer
              bind:collapsed={drawerCollapsed}
              count={attachments.length}
              label="Attachments"
            >
              {#each attachments as file (file.path)}
                <span class="ai-chat-panel__chip">
                  <Chat.ComposerToken
                    token={{
                      value: file.path,
                      label: file.name,
                      variant: "secondary",
                    }}
                  />
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Remove ${file.name}`}
                    onclick={() => removeAttachment(file.path)}
                  >
                    <XIcon aria-hidden="true" />
                  </Button>
                </span>
              {/each}
            </Chat.ComposerDrawer>
          {/if}
        {/snippet}
        {#snippet headerActions()}
          {#if fileSearch}
            <Popover.Root bind:open={attachOpen} onOpenChange={onAttachOpenChange}>
              <Popover.Trigger>
                {#snippet child({ props }: { props: Record<string, unknown> })}
                  <Button
                    {...props}
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Attach file"
                    data-testid="ai-chat-attach"
                  >
                    <PaperclipIcon aria-hidden="true" />
                  </Button>
                {/snippet}
              </Popover.Trigger>
              <Popover.Content
                data-ui-part="attach-popover"
                side="top"
                align="start"
              >
                <Command.Root>
                  <Command.Input placeholder="Search vault files" />
                  <Command.List>
                    <Command.Empty>No vault files</Command.Empty>
                    {#each attachItems as item (item.id)}
                      <Command.Item
                        value={`${item.label} ${item.id}`}
                        onSelect={() => addAttachment(item)}
                      >
                        {item.label}
                      </Command.Item>
                    {/each}
                  </Command.List>
                </Command.Root>
              </Popover.Content>
            </Popover.Root>
          {/if}
        {/snippet}
        {#snippet footerActions()}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              {#snippet child({ props }: { props: Record<string, unknown> })}
                <Button
                  {...props}
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Effort and model"
                  data-testid="ai-chat-effort"
                >
                  <BrainIcon aria-hidden="true" />
                </Button>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              data-ui-part="effort-popover"
              align="start"
            >
              <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger data-testid="ai-chat-model">
                  Model
                </DropdownMenu.SubTrigger>
                <DropdownMenu.SubContent>
                  {#if modelOptions.length > 0}
                    <DropdownMenu.RadioGroup value={selectedModel}>
                      {#each modelOptions as option (option.model)}
                        <DropdownMenu.RadioItem
                          value={option.model}
                          onclick={() => changeModel(option.model)}
                        >
                          {option.displayName ?? option.model}
                        </DropdownMenu.RadioItem>
                      {/each}
                    </DropdownMenu.RadioGroup>
                  {:else}
                    <DropdownMenu.Item disabled>No models available</DropdownMenu.Item>
                  {/if}
                </DropdownMenu.SubContent>
              </DropdownMenu.Sub>
              <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger data-testid="ai-chat-thinking">
                  Thinking
                </DropdownMenu.SubTrigger>
                <DropdownMenu.SubContent>
                  <DropdownMenu.RadioGroup value={selectedThinking}>
                    <DropdownMenu.RadioItem value="off" onclick={() => changeThinking("off")}>Off</DropdownMenu.RadioItem>
                    <DropdownMenu.RadioItem value="low" onclick={() => changeThinking("low")}>Low</DropdownMenu.RadioItem>
                    <DropdownMenu.RadioItem value="medium" onclick={() => changeThinking("medium")}>Medium</DropdownMenu.RadioItem>
                    <DropdownMenu.RadioItem value="high" onclick={() => changeThinking("high")}>High</DropdownMenu.RadioItem>
                  </DropdownMenu.RadioGroup>
                </DropdownMenu.SubContent>
              </DropdownMenu.Sub>
              {#if modelCatalogError}
                <DropdownMenu.Separator />
                <DropdownMenu.Label>{modelCatalogError}</DropdownMenu.Label>
              {/if}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        {/snippet}
      </Chat.Composer>
    {/snippet}
    <Chat.MessageList
      density="compact"
      {latestMessageId}
      isStreaming={controller.busy}
      {isEmpty}
    >
      {#each timeline as entry (entry.kind === "divider" ? entry.id : entry.item.id)}
        {#if entry.kind === "divider"}
          <Chat.SystemMessage variant="divider">{entry.label}</Chat.SystemMessage>
        {:else if entry.item.type === "message"}
          <Chat.Message
            sender={entry.item.role === "user" ? "user" : "assistant"}
          >
            <Chat.MessageBubble>
              {#if entry.item.role === "assistant"}
                {@html renderChatMarkdown(entry.item.text)}
              {:else}
                <Chat.TokenizedText
                  text={entry.item.text}
                  tokens={mentionTokensFromText(entry.item.text)}
                />
              {/if}
            </Chat.MessageBubble>
            {#snippet metadata()}
              {#if entry.item.createdAt}
                <Chat.MessageMetadata
                  timestamp={formatChatTimestamp(entry.item.createdAt)}
                />
              {/if}
            {/snippet}
          </Chat.Message>
        {:else if entry.item.type === "thinking"}
          <Reasoning
            streaming={entry.item.state === "streaming"}
            preview={entry.item.text}
            expanded={entry.item.state === "done"}
          >
            {entry.item.text}
          </Reasoning>
        {:else if entry.item.type === "tool"}
          <Chat.ToolCalls
            calls={[
              {
                id: entry.item.toolId,
                name: entry.item.name,
                status:
                  entry.item.state === "completed"
                    ? "complete"
                    : entry.item.state === "error"
                      ? "error"
                      : "running",
                errorMessage:
                  entry.item.state === "error" ? entry.item.output : undefined,
                target: entry.item.server,
                data: {
                  input: entry.item.input,
                  output: entry.item.output,
                },
                detail:
                  entry.item.input || entry.item.output ? toolDetail : undefined,
              },
            ]}
          />
        {:else if entry.item.type === "approval"}
          {#if entry.item.status === "pending"}
            {@const requestId = entry.item.request.id}
            <AiApprovalCard
              request={entry.item.request}
              disabled={entry.item.status !== "pending"}
              onRespond={(optionId) =>
                void controller.respondToApproval(requestId, optionId)}
            />
          {:else}
            <Chat.SystemMessage>
              Approval {entry.item.status}
              {entry.item.responseOptionId
                ? ` (${entry.item.responseOptionId})`
                : ""}
            </Chat.SystemMessage>
          {/if}
        {:else if entry.item.type === "error"}
          <Chat.SystemMessage>{entry.item.text}</Chat.SystemMessage>
        {:else}
          <Chat.SystemMessage>{entry.item.text}</Chat.SystemMessage>
        {/if}
      {/each}
    </Chat.MessageList>
  </Chat.Layout>
  {#if controller.error}
    <p class="ai-chat-panel__error" data-testid="ai-chat-error">
      {controller.error}
    </p>
  {/if}
</div>
