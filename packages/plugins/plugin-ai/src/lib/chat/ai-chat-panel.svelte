<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { MarkdownEmbed } from "@lapis-notes/markdown/embed";
  import * as Chat from "@lapismd/design-core/ai/chat";
  import { Reasoning } from "@lapismd/design-core/ai/experimental";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import { Spinner } from "@lapismd/design-core/shadcn/spinner";
  import type {
    ComposerSearchSource,
    ComposerStatus,
    ComposerTrigger,
    ComposerTriggerItem,
  } from "@lapismd/design-core/ai/chat";
  import BrainIcon from "@lucide/svelte/icons/brain";
  import CopyIcon from "@lucide/svelte/icons/copy";
  import HistoryIcon from "@lucide/svelte/icons/history";
  import PaperclipIcon from "@lucide/svelte/icons/paperclip";
  import RedoIcon from "@lucide/svelte/icons/redo-2";
  import XIcon from "@lucide/svelte/icons/x";
  import type {
    AgentRequest,
    AgentRuntime,
    AiThinkingLevel,
    ModelRef,
    McpServerContribution,
  } from "../core/types";
  import type { AgentSessionStore } from "../sessions/session-store";
  import type {
    ConversationRepository,
    CreateConversationInput,
  } from "../conversations/conversation-repository";
  import type { ConversationLocation } from "../conversations/types";
  import {
    catalogModelsForAgent,
    normalizeAcpAgent,
    type AcpAgentId,
  } from "../settings/acp-agents";
  import {
    DEFAULT_AI_SETTINGS,
    type AiPluginSettings,
  } from "../settings/ai-settings";
  import type { AppToolBridgeCoordinator } from "../tools/desktop-app-tool-bridge";
  import { formatFileMention, mentionTokensFromText } from "./chat-mentions";
  import { formatChatTimestamp, groupChatItemsByDate } from "./chat-time";
  import AiApprovalCard from "./ai-approval-card.svelte";
  import AiQuestionCard from "./ai-question-card.svelte";
  import { AiChatController } from "./chat-controller.svelte";

  let {
    app,
    runtime,
    selectRuntime,
    unavailableReason = null,
    initializing = false,
    workspace,
    mcpServers = [],
    appToolBridge,
    sessionStore,
    sessionId,
    repository,
    initialLocation = null,
    createConversation,
    subscribeConversationMoves,
    onRevealHistory,
    onConversationLocationChange,
    fileSearch,
    models = [],
    modelCatalogError = null,
    settings,
    onSettingsChange,
  }: {
    app?: App;
    runtime: AgentRuntime;
    selectRuntime?: (request: AgentRequest) => Promise<AgentRuntime>;
    unavailableReason?: string | null;
    initializing?: boolean;
    workspace?: string;
    mcpServers?: McpServerContribution[];
    appToolBridge?: AppToolBridgeCoordinator;
    sessionStore?: AgentSessionStore;
    sessionId?: string;
    repository?: ConversationRepository;
    initialLocation?: ConversationLocation | null;
    createConversation?: (explicitFolder?: string) => CreateConversationInput;
    subscribeConversationMoves?: (
      listener: (oldPath: string, newPath: string) => void,
    ) => () => void;
    onRevealHistory?: () => void | Promise<void>;
    onConversationLocationChange?: (
      location: ConversationLocation | null,
    ) => void;
    fileSearch?: ComposerSearchSource;
    models?: ModelRef[];
    modelCatalogError?: string | null;
    settings?: Partial<AiPluginSettings>;
    onSettingsChange?: (
      patch: Partial<AiPluginSettings>,
    ) => void | Promise<void>;
  } = $props();

  const controller = $derived(
    new AiChatController(runtime, unavailableReason, mcpServers, {
      store: sessionStore,
      sessionId,
      workspace,
      request: {
        agent: settings?.acpAgent,
        model: settings?.defaultModel
          ? {
              provider: normalizeAcpAgent(settings?.acpAgent),
              model: settings.defaultModel,
            }
          : undefined,
        thinking: settings?.thinking,
      },
      repository,
      location: initialLocation,
      createConversation: () => createConversation?.() ?? { scopeDir: "" },
      onLocationChange: onConversationLocationChange,
      selectRuntime,
      appToolBridge,
    }),
  );
  let draft = $state("");
  let localAgent = $state<AcpAgentId | null>(null);
  let localRuntime = $state<"acp" | "codex-native" | "fake" | null>(null);
  let localModel = $state<string | null>(null);
  let localThinking = $state<AiThinkingLevel | null>(null);
  let attachments = $state<{ path: string; name: string }[]>([]);
  let drawerCollapsed = $state(false);
  let drawerHost = $state<HTMLDivElement | null>(null);
  let visibleInteractionId = $state<string | null>(null);
  let attachOpen = $state(false);
  let attachItems = $state<ComposerTriggerItem[]>([]);
  const attachSideOffset = $derived.by(() => {
    void attachments.length;
    void drawerCollapsed;
    if (!drawerHost) return 8;
    const height = drawerHost.getBoundingClientRect().height;
    return height > 0 ? Math.round(height) + 8 : 8;
  });
  const selectedAgent = $derived(
    localAgent ?? normalizeAcpAgent(settings?.acpAgent),
  );
  const selectedRuntime = $derived(
    localRuntime ??
      (settings?.defaultRuntime === "codex-native"
        ? "codex-native"
        : settings?.defaultRuntime === "fake"
          ? "fake"
          : "acp"),
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
      return [{ provider: selectedAgent, model: selectedModel }, ...available];
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
  const agentLabels = $derived.by(() =>
    new Map(
      controller.bindings.map((binding) => {
        const label =
          binding.runtime === "codex-native"
            ? "Codex Native"
            : binding.agent === "cursor"
              ? "Cursor ACP"
              : "Codex ACP";
        return [
          binding.id,
          binding.model?.model ? `${label} · ${binding.model.model}` : label,
        ] as const;
      }),
    ),
  );
  const timeline = $derived(
    groupChatItemsByDate(controller.items, new Date(), agentLabels),
  );
  const latestMessageId = $derived(controller.items.at(-1)?.id);
  const isEmpty = $derived(controller.items.length === 0);
  const composerError = $derived(
    controller.error ??
      modelCatalogError ??
      unavailableReason ??
      controller.appToolsUnavailableReason,
  );
  const composerStatus = $derived<ComposerStatus | undefined>(
    composerError ? { type: "error", message: composerError } : undefined,
  );
  const contextPercent = $derived(
    controller.usage
      ? Math.min(
          100,
          Math.round((controller.usage.used / controller.usage.limit) * 100),
        )
      : 0,
  );
  const pendingInteraction = $derived.by(() => {
    for (let index = controller.items.length - 1; index >= 0; index -= 1) {
      const item = controller.items[index];
      if (
        (item?.type === "approval" || item?.type === "question") &&
        item.status === "pending"
      ) {
        return item;
      }
    }
    return undefined;
  });

  async function submit(prompt: string): Promise<void> {
    if (initializing) return;
    const selected = catalogModelsForAgent(selectedAgent, models).find(
      (model) => model.model === selectedModel,
    );
    const extra = attachments.map((file) => file.path);
    attachments = [];
    drawerCollapsed = false;
    await controller.submit(prompt, {
      workspace,
      mcpServers,
      agent: selectedAgent,
      model: selectedModel
        ? {
            provider: selected?.provider ?? selectedAgent,
            model: selectedModel,
          }
        : undefined,
      thinking: selectedThinking,
      metadata: {
        ...(extra.length > 0 ? { attachments: extra } : {}),
        runtime: selectedRuntime,
      },
    });
  }

  function persistComposerDefaults(
    agent: AcpAgentId,
    runtimePreference: "acp" | "codex-native" | "fake",
    model: string | null,
    thinking: AiThinkingLevel,
  ): void {
    void onSettingsChange?.({
      acpAgent: agent,
      defaultRuntime: runtimePreference,
      ...(model ? { defaultModel: model } : {}),
      thinking,
    });
  }

  function changeAgent(
    agent: AcpAgentId,
    runtimePreference: "acp" | "codex-native",
  ): void {
    localAgent = agent;
    localRuntime = runtimePreference;
    const configured = settings?.defaultModels?.[agent];
    localModel =
      configured ||
      catalogModelsForAgent(agent, models).find((model) => model.isDefault)
        ?.model ||
      catalogModelsForAgent(agent, models)[0]?.model ||
      null;
    persistComposerDefaults(
      agent,
      runtimePreference,
      localModel,
      selectedThinking,
    );
  }

  function changeModel(value: string): void {
    localModel = value;
    persistComposerDefaults(
      selectedAgent,
      selectedRuntime === "fake" ? "acp" : selectedRuntime,
      value,
      selectedThinking,
    );
  }

  function changeThinking(value: string): void {
    localThinking = value as AiThinkingLevel;
    persistComposerDefaults(
      selectedAgent,
      selectedRuntime === "fake" ? "acp" : selectedRuntime,
      selectedModel,
      localThinking,
    );
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

  async function copyResponse(text: string): Promise<void> {
    await navigator.clipboard.writeText(text);
  }

  function promptForError(errorId: string): string | null {
    const errorIndex = controller.items.findIndex(
      (item) => item.id === errorId,
    );
    for (let index = errorIndex - 1; index >= 0; index -= 1) {
      const item = controller.items[index];
      if (item?.type === "message" && item.role === "user") {
        return item.text;
      }
    }
    return null;
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

  function formatTokenCount(value: number): string {
    return new Intl.NumberFormat().format(value);
  }

  $effect(() => {
    const current = controller;
    const ready = !initializing;
    if (ready) void current.restore();
    return () => {
      if (ready) void current.close();
    };
  });

  $effect(() => {
    if (!subscribeConversationMoves) return;
    return subscribeConversationMoves((oldPath, newPath) => {
      controller.relocateScope(oldPath, newPath);
    });
  });

  $effect(() => {
    const requestId = pendingInteraction?.request.id ?? null;
    if (requestId && requestId !== visibleInteractionId) {
      visibleInteractionId = requestId;
      drawerCollapsed = false;
    }
    if (!requestId) visibleInteractionId = null;
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
  data-initializing={initializing}
>
  <Chat.Layout density="compact" {isEmpty} aria-label="AI chat">
    {#snippet composer()}
      {#if initializing || controller.busy}
        <div
          class="ai-chat-panel__working"
          data-testid="ai-chat-working"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <Spinner />
          <span>{initializing ? "Preparing AI…" : "Agent is working…"}</span>
        </div>
      {/if}
      <Chat.Composer
        bind:value={draft}
        placeholder="Ask anything…"
        disabled={initializing || controller.busy}
        interactiveDrawerWhenDisabled={Boolean(pendingInteraction)}
        isStopShown={controller.busy}
        status={composerStatus}
        statusPosition="top"
        triggers={mentionTriggers}
        onSubmit={(value) => void submit(value)}
        onStop={() => {
          void controller.cancel();
        }}
      >
        {#snippet drawer()}
          {#if pendingInteraction || attachments.length > 0}
            <div bind:this={drawerHost}>
              <Chat.ComposerDrawer
                bind:collapsed={drawerCollapsed}
                count={attachments.length + (pendingInteraction ? 1 : 0)}
                label={pendingInteraction?.type === "approval"
                  ? "Permission requested"
                  : pendingInteraction?.type === "question"
                    ? "User input requested"
                    : "Attachments"}
              >
                {#if pendingInteraction?.type === "approval"}
                  {@const requestId = pendingInteraction.request.id}
                  <AiApprovalCard
                    request={pendingInteraction.request}
                    onRespond={(optionId) =>
                      void controller.respondToApproval(requestId, optionId)}
                  />
                {:else if pendingInteraction?.type === "question"}
                  {@const requestId = pendingInteraction.request.id}
                  <AiQuestionCard
                    request={pendingInteraction.request}
                    onRespond={(answers) =>
                      void controller.respondToQuestion(requestId, answers)}
                  />
                {/if}
                {#if attachments.length > 0}
                  {#each attachments as file (file.path)}
                    <span data-ui-part="attachment-chip">
                      <span>{file.name}</span>
                      <button
                        type="button"
                        data-ui-part="attachment-remove"
                        aria-label={`Remove ${file.name}`}
                        onclick={() => removeAttachment(file.path)}
                      >
                        <XIcon aria-hidden="true" />
                      </button>
                    </span>
                  {/each}
                {/if}
              </Chat.ComposerDrawer>
            </div>
          {/if}
        {/snippet}
        {#snippet headerActions()}
          {#if repository}
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Show conversation history"
              data-testid="ai-chat-history"
              onclick={() => void onRevealHistory?.()}
            >
              <HistoryIcon aria-hidden="true" />
            </Button>
          {/if}
          {#if fileSearch}
            <Popover.Root
              bind:open={attachOpen}
              onOpenChange={onAttachOpenChange}
            >
              <Popover.Trigger>
                {#snippet child({ props }: { props: Record<string, unknown> })}
                  <Button
                    {...props}
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Attach file"
                    data-testid="ai-chat-attach"
                    disabled={initializing}
                  >
                    <PaperclipIcon aria-hidden="true" />
                  </Button>
                {/snippet}
              </Popover.Trigger>
              <Popover.Content
                data-ai-part="attach-popover"
                side="top"
                align="start"
                sideOffset={attachSideOffset}
                avoidCollisions={false}
              >
                <CommandView.Root>
                  <CommandView.Input placeholder="Search vault files" />
                  <CommandView.List aria-label="Vault files">
                    <CommandView.Empty>No vault files</CommandView.Empty>
                    {#each attachItems as item (item.id)}
                      <CommandView.Item
                        value={`${item.label} ${item.id}`}
                        onSelect={() => addAttachment(item)}
                      >
                        <CommandView.ItemLabel>{item.label}</CommandView.ItemLabel>
                      </CommandView.Item>
                    {/each}
                  </CommandView.List>
                </CommandView.Root>
              </Popover.Content>
            </Popover.Root>
          {/if}
        {/snippet}
        {#snippet headerContext()}
          {#if controller.usage}
            <label
              class="ai-chat-panel__context-usage"
              title={`${formatTokenCount(controller.usage.used)} of ${formatTokenCount(controller.usage.limit)} tokens used`}
            >
              <span>Context</span>
              <progress
                aria-label="Context window usage"
                value={Math.min(controller.usage.used, controller.usage.limit)}
                max={controller.usage.limit}
              ></progress>
              <span>{contextPercent}%</span>
            </label>
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
                  disabled={initializing}
                >
                  <BrainIcon aria-hidden="true" />
                </Button>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content data-ui-part="effort-popover" align="start">
              {#if selectRuntime}
                <DropdownMenu.Sub>
                  <DropdownMenu.SubTrigger data-testid="ai-chat-agent">
                    Agent
                  </DropdownMenu.SubTrigger>
                  <DropdownMenu.SubContent>
                    <DropdownMenu.RadioGroup
                      value={`${selectedRuntime}:${selectedAgent}`}
                    >
                      <DropdownMenu.RadioItem
                        value="acp:codex"
                        onclick={() => changeAgent("codex", "acp")}
                      >Codex ACP</DropdownMenu.RadioItem>
                      <DropdownMenu.RadioItem
                        value="acp:cursor"
                        onclick={() => changeAgent("cursor", "acp")}
                      >Cursor ACP</DropdownMenu.RadioItem>
                      <DropdownMenu.RadioItem
                        value="codex-native:codex"
                        onclick={() => changeAgent("codex", "codex-native")}
                      >Codex Native</DropdownMenu.RadioItem>
                    </DropdownMenu.RadioGroup>
                  </DropdownMenu.SubContent>
                </DropdownMenu.Sub>
              {/if}
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
                          {#if option.badges?.length}
                            <span data-ai-part="model-badge">
                              {option.badges.join(" ")}
                            </span>
                          {/if}
                        </DropdownMenu.RadioItem>
                      {/each}
                    </DropdownMenu.RadioGroup>
                  {:else}
                    <DropdownMenu.Item disabled
                      >No models available</DropdownMenu.Item
                    >
                  {/if}
                </DropdownMenu.SubContent>
              </DropdownMenu.Sub>
              <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger data-testid="ai-chat-thinking">
                  Thinking
                </DropdownMenu.SubTrigger>
                <DropdownMenu.SubContent>
                  <DropdownMenu.RadioGroup value={selectedThinking}>
                    <DropdownMenu.RadioItem
                      value="off"
                      onclick={() => changeThinking("off")}
                      >Off</DropdownMenu.RadioItem
                    >
                    <DropdownMenu.RadioItem
                      value="low"
                      onclick={() => changeThinking("low")}
                      >Low</DropdownMenu.RadioItem
                    >
                    <DropdownMenu.RadioItem
                      value="medium"
                      onclick={() => changeThinking("medium")}
                      >Medium</DropdownMenu.RadioItem
                    >
                    <DropdownMenu.RadioItem
                      value="high"
                      onclick={() => changeThinking("high")}
                      >High</DropdownMenu.RadioItem
                    >
                  </DropdownMenu.RadioGroup>
                </DropdownMenu.SubContent>
              </DropdownMenu.Sub>
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
          <Chat.SystemMessage variant="divider"
            >{entry.label}</Chat.SystemMessage
          >
        {:else if entry.item.type === "message"}
          {@const message = entry.item}
          <Chat.Message sender={message.role === "user" ? "user" : "assistant"}>
            <Chat.MessageBubble>
              {#if message.role === "assistant" && app}
                <MarkdownEmbed
                  {app}
                  value={message.text}
                  htmlPolicy="safe"
                  class="ai-chat-panel__markdown"
                />
              {:else}
                <Chat.TokenizedText
                  text={message.text}
                  tokens={mentionTokensFromText(message.text)}
                />
              {/if}
            </Chat.MessageBubble>
            {#snippet metadata()}
              {#if message.role === "assistant"}
                <Chat.MessageMetadata
                  timestamp={message.createdAt
                    ? formatChatTimestamp(message.createdAt)
                    : undefined}
                >
                  {#snippet footer()}
                    <span class="ai-chat-panel__message-actions">
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        aria-label="Copy response"
                        onclick={() => void copyResponse(message.text)}
                      >
                        <CopyIcon aria-hidden="true" />
                      </Button>
                    </span>
                  {/snippet}
                </Chat.MessageMetadata>
              {:else if message.createdAt}
                <Chat.MessageMetadata
                  timestamp={formatChatTimestamp(message.createdAt)}
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
                  entry.item.input || entry.item.output
                    ? toolDetail
                    : undefined,
              },
            ]}
          />
        {:else if entry.item.type === "approval"}
          {#if entry.item.status !== "pending"}
            <Chat.SystemMessage>
              Approval {entry.item.status}
              {entry.item.responseOptionId
                ? ` (${entry.item.responseOptionId})`
                : ""}
            </Chat.SystemMessage>
          {/if}
        {:else if entry.item.type === "question"}
          {#if entry.item.status !== "pending"}
            <Chat.SystemMessage>
              Question {entry.item.status}
            </Chat.SystemMessage>
          {/if}
        {:else if entry.item.type === "error"}
          {@const errorItem = entry.item}
          {@const retryPrompt = promptForError(errorItem.id)}
          <Chat.Message sender="assistant">
            <Chat.MessageBubble>{errorItem.text}</Chat.MessageBubble>
            {#snippet metadata()}
              <Chat.MessageMetadata
                timestamp={errorItem.createdAt
                  ? formatChatTimestamp(errorItem.createdAt)
                  : undefined}
                status="error"
              >
                {#snippet footer()}
                  <span class="ai-chat-panel__message-actions">
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      aria-label="Retry message"
                      disabled={initializing || controller.busy || !retryPrompt}
                      onclick={() => retryPrompt && void submit(retryPrompt)}
                    >
                      <RedoIcon aria-hidden="true" />
                    </Button>
                  </span>
                {/snippet}
              </Chat.MessageMetadata>
            {/snippet}
          </Chat.Message>
        {:else}
          <Chat.SystemMessage>{entry.item.text}</Chat.SystemMessage>
        {/if}
      {/each}
    </Chat.MessageList>
  </Chat.Layout>
</div>
