<script lang="ts">
  import { onMount, untrack } from "svelte";
  import type { App, WorkspaceLeaf } from "@lapis-notes/api";
  import { MarkdownEmbed } from "@lapis-notes/markdown/embed";
  import * as Chat from "@lapismd/design-core/ai/chat";
  import { Reasoning } from "@lapismd/design-core/ai/experimental";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import { CodeBlock } from "@lapismd/design-core/shadcn/code-block";
  import * as CommandView from "@lapismd/design-core/shadcn/command-view";
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import * as Popover from "@lapismd/design-core/shadcn/popover";
  import { Spinner } from "@lapismd/design-core/shadcn/spinner";
  import type {
    ComposerSearchSource,
    ComposerStatus,
    ComposerTrigger,
    ComposerTriggerItem,
  } from "@lapismd/design-core/ai/chat";
  import ArchiveIcon from "@lucide/svelte/icons/archive";
  import ArchiveRestoreIcon from "@lucide/svelte/icons/archive-restore";
  import BrainIcon from "@lucide/svelte/icons/brain";
  import CopyIcon from "@lucide/svelte/icons/copy";
  import FolderIcon from "@lucide/svelte/icons/folder";
  import PinIcon from "@lucide/svelte/icons/pin";
  import PinOffIcon from "@lucide/svelte/icons/pin-off";
  import SparklesIcon from "@lucide/svelte/icons/sparkles";
  import HistoryIcon from "@lucide/svelte/icons/history";
  import MoreHorizontalIcon from "@lucide/svelte/icons/ellipsis";
  import PaperclipIcon from "@lucide/svelte/icons/paperclip";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import RedoIcon from "@lucide/svelte/icons/redo-2";
  import TrashIcon from "@lucide/svelte/icons/trash-2";
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
  import { normalizeConversationScope } from "../conversations/paths";
  import {
    formatDirectoryContextLabel,
    groupConversationsByRelativeScope,
  } from "../conversations/scope-tree";
  import { revealConversationScope } from "../conversations/reveal-scope";
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
  import { isSlashCommandNotice } from "./chat-items";
  import {
    parseToolResultPayload,
    resolveToolResultView,
  } from "./chat-result-views";
  import AiInventoryResult from "./ai-inventory-result.svelte";
  import { formatChatTimestamp, groupChatItemsByDate } from "./chat-time";
  import { shouldShowWorkingIndicator } from "./chat-status";
  import {
    isOneLineAlert,
    presentToolPayload,
    toolCallStatus,
    toolCallTarget,
    type AiChatToolItem,
  } from "./chat-tool-display";
  import AiApprovalCard from "./ai-approval-card.svelte";
  import AiQuestionCard from "./ai-question-card.svelte";
  import { AiChatController } from "./chat-controller.svelte";
  import type { SkillRegistry, SkillSnapshotStore } from "../skills/registry";
  import type { SkillDiscoveryContext } from "../skills/types";
  import type { SlashCommandRouter } from "../commands/router";
  import { composerAgentLabel } from "../commands/agent";
  import {
    composerSlashItems,
    filterComposerSlashItems,
  } from "../commands/groups";
  import type { AppToolHost } from "../tools/app-tool-host";
  import type { AutomaticMemoryRecall } from "../memory/types";
  import type { HandoffSummaryCoordinator } from "../conversations/handoff-summary";

  let {
    app,
    runtime,
    selectRuntime,
    unavailableReason = null,
    initializing = false,
    workspace,
    mcpServers = [],
    appToolBridge,
    skills,
    skillSnapshots,
    slashRouter,
    appToolHost,
    memoryRecall,
    handoffSummaries,
    skillContext,
    sessionStore,
    sessionId,
    repository,
    initialLocation = null,
    createConversation,
    subscribeConversationMoves,
    onRevealHistory,
    onConversationLocationChange,
    currentConversationScope,
    listConversationFolders,
    workspaceLeaf,
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
    skills?: SkillRegistry;
    skillSnapshots?: SkillSnapshotStore;
    slashRouter?: SlashCommandRouter;
    appToolHost?: AppToolHost;
    memoryRecall?: AutomaticMemoryRecall;
    handoffSummaries?: Pick<HandoffSummaryCoordinator, "afterTerminal">;
    skillContext?: () => SkillDiscoveryContext;
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
    currentConversationScope?: () => string;
    listConversationFolders?: () => string[];
    workspaceLeaf?: WorkspaceLeaf;
    fileSearch?: ComposerSearchSource;
    models?: ModelRef[];
    modelCatalogError?: string | null;
    settings?: Partial<AiPluginSettings>;
    onSettingsChange?: (
      patch: Partial<AiPluginSettings>,
    ) => void | Promise<void>;
  } = $props();

  const controller = untrack(
    () =>
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
          metadata: {
            runtime: settings?.defaultRuntime,
          },
        },
        repository,
        location: initialLocation,
        createConversation: (explicitFolder) =>
          createConversation?.(explicitFolder) ?? {
            scopeDir: explicitFolder ?? "",
          },
        onLocationChange: onConversationLocationChange,
        selectRuntime,
        appToolBridge,
        skills,
        skillSnapshots,
        slashRouter,
        appToolHost,
        memoryRecall: settings?.memoryAutomaticRecall ? memoryRecall : undefined,
        handoffSummaries,
        skillContext,
        readVaultText: app
          ? async (path) => {
              const file = app.vault.getFileByPath(path);
              return file ? app.vault.cachedRead(file) : undefined;
            }
          : undefined,
        onComposerDefaults: ({ agent, runtimePreference }) => {
          if (runtimePreference === "fake") {
            localAgent = agent;
            localRuntime = "fake";
            persistComposerDefaults(agent, "fake", localModel, selectedThinking);
            return;
          }
          changeAgent(agent, runtimePreference);
        },
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
  let scopePickerOpen = $state(false);
  let scopeFolders = $state<string[]>([""]);
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
    const triggers: ComposerTrigger[] = [];
    if (slashRouter) {
      triggers.push({
        character: "/",
        menuLabel: "Commands",
        emptySearchResultsText: "No commands",
        searchSource: (query) =>
          filterComposerSlashItems(
            composerSlashItems(
              slashRouter.catalog.list(controller.activeBindingId),
              composerAgentLabel(selectedAgent, selectedRuntime),
            ),
            query,
          ),
        onSelect: (item) =>
          item.submitOnSelect
            ? (item.value ?? `/${item.id}`)
            : `${item.value ?? `/${item.id}`} `,
      });
    }
    if (fileSearch) {
      triggers.push({
        character: "@",
        menuLabel: "Files",
        emptySearchResultsText: "No vault files",
        searchSource: fileSearch,
        onSelect: (item) => ({
          value: item.value ?? formatFileMention(item.id),
          label: item.label,
          variant: "secondary",
        }),
      });
    }
    return triggers;
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
  const resultConversation = $derived({
    conversationId: controller.location?.conversationId,
    scopeDirectory: controller.location?.scopeDir,
  });
  const latestMessageId = $derived(controller.items.at(-1)?.id);
  const showPicker = $derived(controller.pickerEntries.length >= 2);
  const pickerGroups = $derived(
    groupConversationsByRelativeScope(
      controller.pickerEntries,
      controller.directoryContext,
    ),
  );
  const scopePathLabel = $derived(
    formatDirectoryContextLabel(
      controller.directoryContext || controller.location?.scopeDir || "",
    ),
  );
  const isEmpty = $derived(
    !showPicker && controller.items.length === 0 && !controller.busy,
  );
  const composerError = $derived(
    controller.error ??
      modelCatalogError ??
      unavailableReason ??
      controller.appToolsUnavailableReason,
  );
  const composerStatus = $derived<ComposerStatus | undefined>(
    composerError ? { type: "error", message: composerError } : undefined,
  );
  const showWorkingIndicator = $derived(
    shouldShowWorkingIndicator(initializing, controller.busy, composerError),
  );
  const workingLabel = $derived(
    initializing
      ? "Preparing AI…"
      : controller.commandWorking
        ? "Preparing command…"
        : "Agent is working…",
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

  function loadConversationFolders(): void {
    const current =
      controller.directoryContext || controller.location?.scopeDir || "";
    const folders = new Set<string>();
    for (const candidate of [
      "",
      current,
      ...(listConversationFolders?.() ?? []),
    ]) {
      try {
        folders.add(normalizeConversationScope(candidate));
      } catch {
        // Ignore stale or invalid host catalogue entries.
      }
    }
    scopeFolders = [...folders].sort((left, right) => {
      if (!left) return -1;
      if (!right) return 1;
      return left.localeCompare(right);
    });
  }

  function onScopePickerOpenChange(open: boolean): void {
    scopePickerOpen = open;
    if (open) loadConversationFolders();
  }

  async function changeConversationScope(scopeDir: string): Promise<void> {
    if (initializing || controller.busy || !repository) return;
    scopePickerOpen = false;
    revealConversationScope(app, scopeDir);
    await controller.followDirectoryScope(scopeDir, { force: true });
  }

  function formatTokenCount(value: number): string {
    return new Intl.NumberFormat().format(value);
  }

  function toolCallProps(item: AiChatToolItem) {
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
      data: {
        input: item.input,
        output: item.state === "error" ? undefined : item.output,
        error: item.state === "error" ? item.output : undefined,
        name: item.name,
      },
    };
  }

  $effect(() => {
    controller.runtime = runtime;
    controller.mcpServers = mcpServers;
  });

  $effect(() => {
    if (initializing) return;
    untrack(() => {
      void controller.restore();
    });
    return () => {
      void controller.close();
    };
  });

  $effect(() => {
    if (initializing) return;
    void controller.location;
    void controller.activeBindingId;
    void controller.syncComposerCommands();
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

  function directoryScope(): string {
    return currentConversationScope?.() ?? "";
  }

  onMount(() => {
    if (!app || !repository) return;
    const follow = (leaf?: WorkspaceLeaf | null) => {
      if (workspaceLeaf && leaf === workspaceLeaf) return;
      void controller.followDirectoryScope(directoryScope());
    };
    const activeLeaf = app.workspace.on("active-leaf-change", follow);
    let cancelled = false;
    const start = !initialLocation
      ? window.setTimeout(() => {
          if (!cancelled) follow();
        }, 0)
      : undefined;
    return () => {
      cancelled = true;
      if (start !== undefined) window.clearTimeout(start);
      app.workspace.offref(activeLeaf);
    };
  });
</script>

{#snippet scopeFooter()}
  <div class="ai-chat-panel__scope-path">
    <Popover.Root
      bind:open={scopePickerOpen}
      onOpenChange={onScopePickerOpenChange}
    >
      <Popover.Trigger>
        {#snippet child({ props }: { props: Record<string, unknown> })}
          <Button
            {...props}
            class="ai-chat-panel__scope-button"
            size="sm"
            variant="ghost"
            data-testid="ai-chat-scope-path"
            aria-label={`Change chat folder: ${scopePathLabel}`}
            disabled={initializing || controller.busy || !repository}
          >
            <FolderIcon data-icon="inline-start" aria-hidden="true" />
            <span>{scopePathLabel}</span>
          </Button>
        {/snippet}
      </Popover.Trigger>
      <Popover.Content
        data-ai-part="scope-picker-popover"
        side="top"
        align="center"
        sideOffset={8}
      >
        <CommandView.Root>
          <CommandView.Input placeholder="Search chat folders" />
          <CommandView.List aria-label="Chat folders">
            <CommandView.Empty>No folders</CommandView.Empty>
            <CommandView.Group>
              {#each scopeFolders as folder (folder || "vault-root")}
                <CommandView.Item
                  value={`${formatDirectoryContextLabel(folder)} ${folder}`}
                  onSelect={() => void changeConversationScope(folder)}
                >
                  <CommandView.ItemIcon>
                    <FolderIcon aria-hidden="true" />
                  </CommandView.ItemIcon>
                  <CommandView.ItemLabel>
                    {formatDirectoryContextLabel(folder)}
                  </CommandView.ItemLabel>
                </CommandView.Item>
              {/each}
            </CommandView.Group>
          </CommandView.List>
        </CommandView.Root>
      </Popover.Content>
    </Popover.Root>
  </div>
{/snippet}

{#snippet toolDetail(call: { data?: unknown; name?: string })}
  {@const detail = call.data as
    | { input?: string; output?: string; error?: string; name?: string }
    | undefined}
  {@const hint = {
    toolName: detail?.name ?? call.name,
    input: detail?.input,
  }}
  {@const ResultView = resolveToolResultView(app, detail?.name ?? call.name)}
  {@const parsedOutput = parseToolResultPayload(detail?.output)}
  {@const inputPayload = presentToolPayload(detail?.input)}
  {@const outputPayload = presentToolPayload(detail?.output, hint)}
  {@const errorPayload = presentToolPayload(detail?.error, hint)}
  {@const showErrorBlock = Boolean(
    errorPayload && !isOneLineAlert(errorPayload),
  )}
  {#if ResultView && app && parsedOutput != null && !detail?.error}
    <ResultView
      {app}
      conversation={resultConversation}
      name={detail?.name ?? call.name ?? ""}
      input={parseToolResultPayload(detail?.input)}
      output={parsedOutput}
      state="completed"
    />
  {:else}
  <div class="ai-chat-panel__tool-detail">
    {#if inputPayload}
      <CodeBlock
        code={inputPayload.code}
        language={inputPayload.language}
        title="Input"
        size="sm"
        width="full"
        isWrapped
        maxHeight="16rem"
      />
    {/if}
    {#if outputPayload}
      <CodeBlock
        code={outputPayload.code}
        language={outputPayload.language}
        title="Output"
        size="sm"
        width="full"
        isWrapped
        maxHeight="16rem"
      />
    {/if}
    {#if showErrorBlock && errorPayload}
      <CodeBlock
        code={errorPayload.code}
        language={errorPayload.language}
        title="Error"
        size="sm"
        width="full"
        isWrapped
        maxHeight="16rem"
      />
    {/if}
  </div>
  {/if}
{/snippet}

<div
  class="ai-chat-panel"
  data-ui-component="ai-chat-panel"
  data-testid="ai-chat-panel"
  data-initializing={initializing}
>
  <Chat.Layout density="compact" {isEmpty} aria-label="AI chat">
    {#snippet emptyState()}
      <Empty.Root>
        <Empty.Header>
          <Empty.Media variant="icon">
            <SparklesIcon aria-hidden="true" />
          </Empty.Media>
          <Empty.Title>Start a conversation</Empty.Title>
          <Empty.Description>
            Ask a question or describe the change you want to make.
          </Empty.Description>
        </Empty.Header>
      </Empty.Root>
      {@render scopeFooter()}
    {/snippet}
    {#snippet composer()}
      {#if showWorkingIndicator}
        <div
          class="ai-chat-panel__working"
          data-testid="ai-chat-working"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <Spinner />
          <span>{workingLabel}</span>
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
          {#if repository}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                {#snippet child({ props }: { props: Record<string, unknown> })}
                  <Button
                    {...props}
                    size="icon"
                    variant="ghost"
                    aria-label="Conversation actions"
                    data-testid="ai-chat-conversation-menu"
                  >
                    <MoreHorizontalIcon aria-hidden="true" />
                  </Button>
                {/snippet}
              </DropdownMenu.Trigger>
              <DropdownMenu.Content
                data-ai-part="conversation-menu"
                align="end"
              >
                <DropdownMenu.Group>
                  <DropdownMenu.Item
                    disabled={!controller.location}
                    onclick={() =>
                      void controller.archiveCurrent(
                        controller.conversationStatus !== "archived",
                      )}
                  >
                    {#if controller.conversationStatus === "archived"}
                      <ArchiveRestoreIcon
                        data-icon="inline-start"
                        aria-hidden="true"
                      />
                      Restore Chat
                    {:else}
                      <ArchiveIcon
                        data-icon="inline-start"
                        aria-hidden="true"
                      />
                      Archive Chat
                    {/if}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    variant="destructive"
                    disabled={!controller.location}
                    onclick={() => void controller.deleteCurrent()}
                  >
                    <TrashIcon data-icon="inline-start" aria-hidden="true" />
                    Delete Chat
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onclick={() =>
                      void controller.newConversation(
                        createConversation?.(controller.directoryContext) ?? {
                          scopeDir:
                            controller.directoryContext ||
                            controller.location?.scopeDir ||
                            "",
                        },
                      )}
                  >
                    <PlusIcon data-icon="inline-start" aria-hidden="true" />
                    New Chat
                  </DropdownMenu.Item>
                </DropdownMenu.Group>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
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
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={controller.conversationPinned
              ? "Unpin conversation"
              : "Pin conversation"}
            aria-pressed={controller.conversationPinned}
            data-testid="ai-chat-pin"
            disabled={initializing || !controller.location}
            onclick={() =>
              void controller.setPinned(!controller.conversationPinned)}
          >
            {#if controller.conversationPinned}
              <PinOffIcon aria-hidden="true" />
            {:else}
              <PinIcon aria-hidden="true" />
            {/if}
          </Button>
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
      {#if showPicker}
        <div
          class="ai-chat-panel__conversation-picker"
          data-testid="ai-chat-conversation-picker"
        >
          <CommandView.Root>
            <CommandView.Input placeholder="Search conversations" />
            <CommandView.List aria-label="Conversations in this folder">
              <CommandView.Empty>No conversations</CommandView.Empty>
              {#each pickerGroups as group (group.heading)}
                <CommandView.Group heading={group.heading}>
                  {#each group.items as entry (`${entry.location.scopeDir}:${entry.location.conversationId}`)}
                    <CommandView.Item
                      value={`${entry.metadata?.title ?? "Untitled"} ${entry.location.scopeDir} ${entry.location.conversationId}`}
                      onSelect={() => {
                        revealConversationScope(app, entry.location.scopeDir);
                        void controller.openConversation(entry.location);
                      }}
                    >
                      <CommandView.ItemLabel>
                        {entry.metadata?.title ?? "Untitled"}
                      </CommandView.ItemLabel>
                      {#if entry.preview}
                        <CommandView.ItemDescription>
                          {entry.preview}
                        </CommandView.ItemDescription>
                      {/if}
                    </CommandView.Item>
                  {/each}
                </CommandView.Group>
              {/each}
            </CommandView.List>
          </CommandView.Root>
        </div>
      {/if}
      {#each timeline as entry (entry.kind === "item" ? entry.item.id : entry.id)}
        {#if entry.kind === "divider"}
          <Chat.SystemMessage variant="divider"
            >{entry.label}</Chat.SystemMessage
          >
        {:else if entry.kind === "tools"}
          <Chat.ToolCalls
            calls={entry.items.map((item) => ({
              ...toolCallProps(item),
              detail:
                item.input || item.output ? toolDetail : undefined,
            }))}
            defaultExpanded={false}
          />
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
            expanded={entry.item.state === "streaming"}
          >
            {entry.item.text}
          </Reasoning>
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
        {:else if entry.item.type === "status" &&
          entry.item.layout === "inventory"}
          <div
            class="ai-chat-panel__command-notice"
            data-testid="ai-chat-command-notice"
            data-layout="inventory"
            role="status"
          >
            <AiInventoryResult
              {app}
              conversation={resultConversation}
              name={entry.item.inventory?.kind ?? "skills"}
              output={entry.item.inventory}
            />
          </div>
        {:else if entry.item.type === "status" && isSlashCommandNotice(entry.item)}
          <div
            class="ai-chat-panel__command-notice"
            data-testid="ai-chat-command-notice"
            role="status"
          >
            {entry.item.text}
          </div>
        {:else}
          <Chat.SystemMessage>{entry.item.text}</Chat.SystemMessage>
        {/if}
      {/each}
      {@render scopeFooter()}
    </Chat.MessageList>
  </Chat.Layout>
</div>
