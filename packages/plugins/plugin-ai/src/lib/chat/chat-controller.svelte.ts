import type {
  AgentContextBlock,
  AgentEvent,
  AgentRequest,
  AgentRuntime,
  AgentSession,
  AgentUsage,
  AppToolSessionDescriptor,
  ApprovalOptionKind,
  ApprovalRequest,
  McpServerContribution,
  UserInputAnswers,
} from "../core/types";
import type { AutomaticMemoryRecall } from "../memory/types";
import type {
  AgentSessionStore,
  StoredAgentSession,
} from "../sessions/session-store";
import { interruptPendingInteractions } from "../sessions/session-store";
import type { CreateConversationInput } from "../conversations/conversation-repository";
import type { ConversationRepository } from "../conversations/conversation-repository";
import { relocateConversationLocation } from "../conversations/conversation-locator";
import {
  buildConversationContextHandoff,
  type ConversationContextHandoff,
} from "../conversations/context-handoff";
import {
  effectiveAgentBinding,
  reduceAgentBindings,
  type EffectiveAgentBinding,
} from "../conversations/binding-state";
import { transcriptEntryHash } from "../conversations/hashes";
import type { HandoffSummaryCoordinator } from "../conversations/handoff-summary";
import {
  projectChatItemsToTranscript,
  projectTranscriptToChatItems,
} from "../conversations/transcript-projection";
import {
  approvalGrantIdentity,
  persistentDecisionForRequest,
  persistentDecisionFromOption,
  upsertApprovalGrant,
} from "../conversations/approval-grants";
import {
  CONVERSATION_SCHEMA_VERSION,
  ConversationUnavailableError,
  type AgentBindingCreatedRecord,
  type AgentBindingConfigUpdatedRecord,
  type ConversationApprovalGrant,
  type ConversationLocation,
  type ConversationMetadata,
  type TranscriptEntry,
} from "../conversations/types";
import { extractMentionPaths, mergeAttachmentPaths } from "./chat-mentions";
import {
  applyStoredSessionResumePolicy,
  chatSessionId,
  loadStoredChatSession,
  snapshotStoredChatSession,
} from "./chat-session";
import {
  createChatItemId,
  type AiChatInventory,
  type AiChatInventoryItem,
  type AiChatItem,
} from "./chat-items";
import type { AppSkillDescriptor } from "../skills/types";
import {
  applyAgentEventToChatItems,
  isVisibleAgentStatus,
  markApprovalResponse,
  markQuestionResponse,
} from "./chat-trace";
import { APP_TOOL_MCP_SERVER_NAME } from "../tools/mcp-server-registry";
import type {
  AppToolBridgeCoordinator,
  AppToolBridgeEvent,
} from "../tools/desktop-app-tool-bridge";
import type { AppToolHost } from "../tools/app-tool-host";
import { buildAvailableSkillsManifest } from "../skills/manifest";
import { SkillSnapshotStore, type SkillRegistry } from "../skills/registry";
import type { SkillDiscoveryContext } from "../skills/types";
import { SlashCommandRouter } from "../commands/router";
import { composerAgentLabel, parseAgentCommand } from "../commands/agent";
import { buildAgentBootstrap, buildSessionBootstrap } from "../bootstrap/build";
import { hasHostFilesystemPath } from "../skills/manifest";
import { formatSlashHelp } from "../commands/groups";
import { formatContextNotice, formatScopeNotice } from "../commands/inspect";
import { normalizeConversationScope } from "../conversations/paths";
import { conversationsInScopeTree } from "../conversations/scope-tree";
import type { ConversationListEntry } from "../conversations/transcript-store";
import type { AcpAgentId } from "../settings/acp-agents";

export class AiChatController {
  items = $state.raw<AiChatItem[]>([]);
  busy = $state(false);
  commandWorking = $state(false);
  error = $state<string | null>(null);
  usage = $state<AgentUsage | null>(null);
  appToolsUnavailableReason = $state<string | null>(null);
  bindings = $state.raw<AgentBindingCreatedRecord[]>([]);
  location = $state.raw<ConversationLocation | null>(null);
  conversationStatus = $state<ConversationMetadata["status"] | null>(null);
  conversationPinned = $state(false);
  directoryContext = $state("");
  pickerEntries = $state.raw<ConversationListEntry[]>([]);
  session: AgentSession | null = null;
  runtime: AgentRuntime;
  readonly unavailableReason: string | null;
  mcpServers: McpServerContribution[];
  readonly store?: AgentSessionStore;
  readonly repository?: ConversationRepository;
  readonly sessionId: string;
  readonly workspace?: string;
  request: Omit<AgentRequest, "prompt">;
  #sessionRequest: Omit<AgentRequest, "prompt">;
  #createdAt?: string;
  #persistQueue: Promise<void> = Promise.resolve();
  #terminalCheckpoint: Promise<void> = Promise.resolve();
  #activeBindingId?: string;
  #activeBinding?: EffectiveAgentBinding;
  #usageDirty = false;
  readonly #sessionContexts = new Map<
    AgentSession,
    {
      location: ConversationLocation | null;
      pendingBinding?: AgentBindingCreatedRecord;
      pendingSwitch?: TranscriptEntry;
      pendingActivationBindingId?: string;
      pendingConfiguration?: {
        previous: EffectiveAgentBinding;
        updated: EffectiveAgentBinding;
        agentRecord: AgentBindingConfigUpdatedRecord;
        transcriptEntry: Extract<TranscriptEntry, { type: "agent.config" }>;
      };
      handoff?: ConversationContextHandoff;
      pendingItems: AiChatItem[];
    }
  >();
  readonly #cancelledSessions = new WeakSet<AgentSession>();
  #turnId = 0;
  readonly #createConversation?: (
    explicitFolder?: string,
  ) => CreateConversationInput;
  readonly #onLocationChange?: (location: ConversationLocation | null) => void;
  readonly #selectRuntime?: (request: AgentRequest) => Promise<AgentRuntime>;
  readonly #appToolBridge?: AppToolBridgeCoordinator;
  readonly #unsubscribeAppToolEvents?: () => void;
  readonly #skills?: SkillRegistry;
  readonly #skillSnapshots: SkillSnapshotStore;
  readonly #slashRouter?: SlashCommandRouter;
  readonly #appToolHost?: AppToolHost;
  readonly #skillContext?: () => SkillDiscoveryContext;
  readonly #readVaultText?: (path: string) => Promise<string | undefined>;
  readonly #memoryRecall?: AutomaticMemoryRecall;
  readonly #handoffSummaries?: Pick<HandoffSummaryCoordinator, "afterTerminal">;
  readonly #onComposerDefaults?: (next: {
    agent: AcpAgentId;
    runtimePreference: "acp" | "codex-native" | "fake";
  }) => void;
  #refreshSkills = false;
  #activeRecallAbort?: AbortController;
  readonly #pendingHandoffs = new WeakMap<
    AgentSession,
    ConversationContextHandoff
  >();
  #approvalGrants: ConversationApprovalGrant[] = [];
  #followedScope?: string;
  #desiredFollowScope?: string;
  #followGeneration = 0;

  constructor(
    runtime: AgentRuntime,
    unavailableReason: string | null = null,
    mcpServers: McpServerContribution[] = [],
    options: {
      store?: AgentSessionStore;
      sessionId?: string;
      workspace?: string;
      request?: Omit<AgentRequest, "prompt">;
      repository?: ConversationRepository;
      location?: ConversationLocation | null;
      createConversation?: (explicitFolder?: string) => CreateConversationInput;
      onLocationChange?: (location: ConversationLocation | null) => void;
      selectRuntime?: (request: AgentRequest) => Promise<AgentRuntime>;
      appToolBridge?: AppToolBridgeCoordinator;
      skills?: SkillRegistry;
      skillSnapshots?: SkillSnapshotStore;
      slashRouter?: SlashCommandRouter;
      appToolHost?: AppToolHost;
      skillContext?: () => SkillDiscoveryContext;
      readVaultText?: (path: string) => Promise<string | undefined>;
      memoryRecall?: AutomaticMemoryRecall;
      handoffSummaries?: Pick<HandoffSummaryCoordinator, "afterTerminal">;
      onComposerDefaults?: (next: {
        agent: AcpAgentId;
        runtimePreference: "acp" | "codex-native" | "fake";
      }) => void;
    } = {},
  ) {
    this.runtime = runtime;
    this.unavailableReason = unavailableReason;
    this.mcpServers = mcpServers;
    this.store = options.store;
    this.repository = options.repository;
    this.location = options.location ?? null;
    if (this.location) {
      this.directoryContext = this.location.scopeDir;
      this.#followedScope = this.location.scopeDir;
      this.#desiredFollowScope = this.location.scopeDir;
    }
    this.#createConversation = options.createConversation;
    this.#onLocationChange = options.onLocationChange;
    this.#selectRuntime = options.selectRuntime;
    this.#appToolBridge = options.appToolBridge;
    this.#skills = options.skills;
    this.#skillSnapshots = options.skillSnapshots ?? new SkillSnapshotStore();
    this.#slashRouter = options.slashRouter;
    this.#appToolHost = options.appToolHost;
    this.#skillContext = options.skillContext;
    this.#readVaultText = options.readVaultText;
    this.#memoryRecall = options.memoryRecall;
    this.#handoffSummaries = options.handoffSummaries;
    this.#onComposerDefaults = options.onComposerDefaults;
    this.#unsubscribeAppToolEvents = options.appToolBridge?.subscribe(
      (event) => {
        void this.#consumeAppToolEvent(event);
      },
    );
    this.workspace = options.workspace;
    this.request = options.request ?? {};
    this.#sessionRequest = this.request;
    this.sessionId =
      options.sessionId ??
      chatSessionId(
        options.workspace,
        runtime.id,
        this.request.agent ?? "default",
      );
  }

  async restore(): Promise<void> {
    if (this.repository && this.location) {
      try {
        await this.#restoreConversation();
      } catch (error) {
        this.#releaseUnreadableLocation(error);
      }
      return;
    }
    let stored = await loadStoredChatSession(this.store, this.sessionId);
    if (!stored) {
      const legacy = await loadStoredChatSession(
        this.store,
        chatSessionId(this.workspace),
      );
      if (
        legacy &&
        legacy.runtime === this.runtime.id &&
        (legacy.agent === this.request.agent ||
          (!legacy.agent && this.request.agent === "codex"))
      ) {
        stored = legacy;
      }
    }
    if (!stored) return;
    this.#createdAt = stored.createdAt;
    this.#sessionRequest = {
      ...this.request,
      agent: stored.agent ?? this.request.agent,
      model: stored.model ?? this.request.model,
      thinking: stored.thinking ?? this.request.thinking,
      workspace: stored.workspace ?? this.workspace,
    };
    this.items = [...stored.items];
    this.usage = stored.usage ? { ...stored.usage } : null;
    let resumed = false;
    if (this.runtime.capabilities().resume && this.runtime.resume) {
      try {
        this.session = await this.runtime.resume(
          stored.runtimeSessionId,
          this.#sessionRequest,
        );
        resumed = true;
      } catch {
        this.session = null;
      }
    }
    const restored = applyStoredSessionResumePolicy({
      stored,
      runtime: this.runtime,
      resumed,
    });
    this.items = restored.items;
    if (resumed && this.session) void this.#consume(this.session);
    await this.#persist(restored.interrupted);
  }

  async openConversation(location: ConversationLocation): Promise<void> {
    if (!this.repository) return;
    await this.#closeAppToolBinding();
    await this.session?.close().catch(() => undefined);
    this.session = null;
    this.busy = false;
    this.error = null;
    this.conversationStatus = null;
    this.location = { ...location };
    this.directoryContext = location.scopeDir;
    this.#followedScope = location.scopeDir;
    this.#desiredFollowScope = location.scopeDir;
    this.pickerEntries = [];
    this.#onLocationChange?.(this.location);
    try {
      await this.#restoreConversation();
    } catch (error) {
      this.#releaseUnreadableLocation(error);
    }
  }

  get activeBindingId(): string | undefined {
    return this.#activeBindingId;
  }

  async newConversation(input?: CreateConversationInput): Promise<void> {
    await this.#closeAppToolBinding();
    await this.session?.close().catch(() => undefined);
    this.session = null;
    this.busy = false;
    this.error = null;
    this.usage = null;
    this.items = [];
    this.#activeBinding = undefined;
    this.#activeBindingId = undefined;
    this.bindings = [];
    this.location = null;
    this.conversationStatus = null;
    this.conversationPinned = false;
    this.pickerEntries = [];
    this.#approvalGrants = [];
    if (this.repository && input) {
      const created = await this.repository.create(input);
      this.location = created.location;
      this.conversationStatus = created.metadata.status;
      this.conversationPinned = Boolean(created.metadata.pinned);
      this.directoryContext = created.location.scopeDir;
      this.#followedScope = created.location.scopeDir;
    }
    this.#onLocationChange?.(this.location);
  }

  async archiveCurrent(archived = true): Promise<void> {
    if (!this.repository || !this.location) return;
    const snapshot = await this.repository.archive(this.location, archived);
    this.conversationStatus = snapshot.metadata.status;
  }

  relocateScope(oldPath: string, newPath: string): void {
    if (this.location) {
      const relocated = relocateConversationLocation(
        this.location,
        oldPath,
        newPath,
      );
      if (relocated) {
        if (relocated.scopeDir !== this.location.scopeDir) {
          void this.#closeAppToolBinding();
        }
        this.location = relocated;
        this.#onLocationChange?.(relocated);
      }
    }
    for (const context of this.#sessionContexts.values()) {
      if (!context.location) continue;
      const next = relocateConversationLocation(
        context.location,
        oldPath,
        newPath,
      );
      if (next) context.location = next;
    }
  }

  async deleteCurrent(): Promise<void> {
    if (!this.repository || !this.location) return;
    const location = this.location;
    await this.#closeAppToolBinding();
    await this.session?.close().catch(() => undefined);
    await this.repository.delete(location);
    this.session = null;
    this.busy = false;
    this.error = null;
    this.usage = null;
    this.items = [];
    this.#activeBinding = undefined;
    this.#activeBindingId = undefined;
    this.bindings = [];
    this.location = null;
    this.conversationStatus = null;
    this.conversationPinned = false;
    this.pickerEntries = [];
    this.#approvalGrants = [];
    this.#onLocationChange?.(null);
  }

  async followDirectoryScope(
    scopeDir: string,
    options: { force?: boolean } = {},
  ): Promise<void> {
    if (!this.repository) return;
    const scope = normalizeConversationScope(scopeDir);
    this.#desiredFollowScope = scope;
    if (!options.force && (this.busy || this.conversationPinned)) return;
    if (!options.force && this.#followedScope === scope) return;
    const generation = ++this.#followGeneration;
    this.directoryContext = scope;
    this.#followedScope = scope;
    const matches = conversationsInScopeTree(
      await this.repository.listAll(),
      scope,
    );
    if (generation !== this.#followGeneration) return;
    if (matches.length === 0) {
      this.pickerEntries = [];
      if (this.location) await this.#clearOpenConversation();
      return;
    }
    if (matches.length === 1) {
      this.pickerEntries = [];
      const next = matches[0]!.location;
      if (
        this.location?.scopeDir === next.scopeDir &&
        this.location.conversationId === next.conversationId
      ) {
        return;
      }
      await this.openConversation(next);
      return;
    }
    this.pickerEntries = matches;
    if (this.location) await this.#clearOpenConversation();
  }

  async setPinned(pinned: boolean): Promise<void> {
    if (!this.repository || !this.location) return;
    const snapshot = await this.repository.writePinned(this.location, pinned);
    this.conversationPinned = Boolean(snapshot.metadata.pinned);
    if (!this.conversationPinned) {
      await this.followDirectoryScope(
        this.#desiredFollowScope ?? this.directoryContext,
        { force: true },
      );
    }
  }

  async #clearOpenConversation(): Promise<void> {
    await this.#closeAppToolBinding();
    await this.session?.close().catch(() => undefined);
    this.session = null;
    this.busy = false;
    this.error = null;
    this.usage = null;
    this.items = [];
    this.#activeBinding = undefined;
    this.#activeBindingId = undefined;
    this.bindings = [];
    this.location = null;
    this.conversationStatus = null;
    this.conversationPinned = false;
    this.#approvalGrants = [];
    this.#onLocationChange?.(null);
  }

  async #restoreConversation(): Promise<void> {
    if (!this.repository || !this.location) return;
    const snapshot = await this.repository.read(this.location);
    this.conversationStatus = snapshot.metadata.status;
    this.conversationPinned = Boolean(snapshot.metadata.pinned);
    this.directoryContext = snapshot.location.scopeDir;
    this.#loadApprovalGrants(snapshot.metadata);
    this.items = projectTranscriptToChatItems(snapshot.transcript);
    const activeBinding = effectiveAgentBinding(
      snapshot.agents,
      snapshot.metadata.activeAgentBindingId,
    );
    this.#activeBinding = activeBinding;
    this.#activeBindingId = activeBinding?.id;
    if (activeBinding) {
      await this.#prepareSkillSnapshot(
        activeBinding.id,
        snapshot.location.scopeDir,
      );
    }
    this.bindings = reduceAgentBindings(snapshot.agents);
    const latestUsage = [...snapshot.agents]
      .reverse()
      .find(
        (record) =>
          record.type === "usage.updated" &&
          (!activeBinding || record.agentBindingId === activeBinding.id),
      );
    this.usage =
      latestUsage?.type === "usage.updated" ? { ...latestUsage.usage } : null;
    if (!activeBinding || activeBinding.runtime !== this.runtime.id) {
      await this.#interruptUnresumableInteractions();
      return;
    }
    this.#sessionRequest = {
      ...this.request,
      agent: activeBinding.agent,
      model: activeBinding.model,
      thinking: activeBinding.thinking,
      workspace: this.workspace,
    };
    if (
      !activeBinding.nativeSessionId ||
      !activeBinding.context ||
      !this.runtime.capabilities().resume ||
      !this.runtime.resume
    ) {
      await this.#interruptUnresumableInteractions();
      return;
    }
    try {
      const appToolSession = await this.#prepareAppToolSession(
        activeBinding.id,
        this.runtime,
        snapshot.location,
        snapshot.metadata.launchContext?.notePath,
      );
      this.session = await this.runtime.resume(activeBinding.nativeSessionId, {
        ...this.#sessionRequest,
        appToolSession,
      });
      void this.#consume(this.session, activeBinding.id);
    } catch (error) {
      await this.#closeAppToolBinding(activeBinding.id);
      this.session = null;
      this.error = `Could not resume the previous agent session. Your local history is still available. ${error instanceof Error ? error.message : String(error)}`;
      await this.#interruptUnresumableInteractions();
    }
  }

  async #interruptUnresumableInteractions(): Promise<void> {
    const hasPending = this.items.some(
      (item) =>
        (item.type === "approval" || item.type === "question") &&
        item.status === "pending",
    );
    if (!hasPending) return;
    this.items = interruptPendingInteractions(this.items);
    await this.#persist(true, this.#activeBindingId);
  }

  async submit(
    prompt: string,
    request: Omit<AgentRequest, "prompt"> = {},
  ): Promise<void> {
    try {
      await this.#syncSlashCatalog();
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
      this.items = [
        ...this.items,
        {
          id: `error-${crypto.randomUUID()}`,
          type: "error",
          text: this.error,
          createdAt: new Date().toISOString(),
        },
      ];
      return;
    }
    const resolution = this.#slashRouter?.resolve(
      prompt,
      this.#activeBindingId,
    );
    if (resolution?.kind === "unknown" || resolution?.kind === "command") {
      await this.#executeSlash(resolution, request);
      return;
    }
    const text =
      resolution?.kind === "literal" ? resolution.text.trim() : prompt.trim();
    if (!text || this.busy) return;
    this.error = null;
    const userItem: AiChatItem = {
      id: this.repository
        ? `user-${crypto.randomUUID()}`
        : `user-${this.items.length + 1}`,
      type: "message",
      role: "user",
      text,
      createdAt: new Date().toISOString(),
    };
    this.items = [...this.items, userItem];
    this.busy = true;
    const turnId = ++this.#turnId;
    const attachments = mergeAttachmentPaths(
      extractMentionPaths(text),
      readAttachmentPaths(request.metadata?.attachments),
    );
    const effectiveRequest: Omit<AgentRequest, "prompt"> = {
      ...this.request,
      ...request,
      metadata: {
        ...this.request.metadata,
        ...request.metadata,
        ...(attachments.length > 0 ? { attachments } : {}),
      },
    };
    const previousRuntime = this.runtime;
    const previousBinding = this.#activeBinding;
    const previousBindingId = this.#activeBindingId;
    const previousSessionRequest = this.#sessionRequest;
    try {
      if (this.repository) await this.#ensureConversation();
      if (this.#isAbandoned(turnId)) return;
      await this.#prepareSession(effectiveRequest, turnId);
      if (this.#isAbandoned(turnId)) return;
      if (this.#activeBindingId) {
        this.items = this.items.map((item) =>
          item.id === userItem.id
            ? { ...item, agentBindingId: this.#activeBindingId }
            : item,
        );
      }
      if (this.repository && this.location && this.session) {
        const context = this.#sessionContexts.get(this.session) ?? {
          location: { ...this.location },
          pendingItems: [],
        };
        context.pendingItems.push(
          this.items.find((item) => item.id === userItem.id) ?? userItem,
        );
        this.#sessionContexts.set(this.session, context);
      } else {
        await this.#persist();
      }
      if (this.#isAbandoned(turnId)) return;
      if (!this.session) {
        if (this.error) return;
        throw new Error("Agent session did not start.");
      }
      const recallAbort = new AbortController();
      this.#activeRecallAbort?.abort();
      this.#activeRecallAbort = recallAbort;
      const recalledBlocks = await this.#memoryRecall
        ?.recall(
          text,
          {
            scopeDir: this.location?.scopeDir ?? this.directoryContext,
            conversationId: this.location?.conversationId,
            agentBindingId: this.#activeBindingId,
            runId: `turn-${turnId}`,
          },
          recallAbort.signal,
        )
        .catch(() => []);
      if (this.#activeRecallAbort === recallAbort) {
        this.#activeRecallAbort = undefined;
      }
      if (this.#isAbandoned(turnId)) return;
      const handoff = this.#pendingHandoffs.get(this.session);
      const contextBlocks: AgentContextBlock[] = [
        ...(handoff ? [handoff.block] : []),
        ...(recalledBlocks ?? []),
      ];
      await this.session.send(text, {
        contextBlocks,
      });
      if (handoff) this.#pendingHandoffs.delete(this.session);
      if (!this.repository) await this.#persist();
    } catch (error) {
      if (this.#isAbandoned(turnId)) return;
      const failedSession = this.session;
      const failedBindingId = this.#activeBindingId;
      const failedContext = failedSession
        ? this.#sessionContexts.get(failedSession)
        : undefined;
      if (
        failedContext?.pendingBinding ||
        failedContext?.pendingSwitch ||
        failedContext?.pendingConfiguration
      ) {
        this.runtime = previousRuntime;
        this.#activeBinding = previousBinding;
        this.#activeBindingId = previousBindingId;
        this.#sessionRequest = previousSessionRequest;
        this.bindings = this.bindings.filter(
          (binding) => binding.id !== failedContext.pendingBinding?.id,
        );
        if (failedContext.pendingConfiguration) {
          this.bindings = this.bindings.map((binding) =>
            binding.id === failedContext.pendingConfiguration?.previous.id
              ? failedContext.pendingConfiguration.previous
              : binding,
          );
        }
      }
      this.error = error instanceof Error ? error.message : String(error);
      this.items = applyAgentEventToChatItems(this.items, {
        type: "error",
        error: error instanceof Error ? error : new Error(String(error)),
      });
      this.session = null;
      this.busy = false;
      await this.#closeAppToolBinding(failedBindingId);
      await failedSession?.close().catch(() => undefined);
      try {
        if (this.repository) await this.#ensureConversation();
        if (this.repository && this.location) {
          await this.#appendDurableItems(
            this.location,
            [userItem, this.items.at(-1)!],
            this.#activeBindingId,
          );
        } else {
          await this.#persist();
        }
      } catch (persistError) {
        const persistMessage =
          persistError instanceof Error
            ? persistError.message
            : String(persistError);
        this.error = `${this.error} Could not save this turn: ${persistMessage}`;
      }
    }
  }

  async respondToApproval(requestId: string, optionId: string): Promise<void> {
    const pending = this.items.find(
      (candidate) =>
        candidate.type === "approval" && candidate.request.id === requestId,
    );
    if (pending?.type === "approval" && pending.request.origin === "app-tool") {
      if (
        !this.#appToolBridge?.respondToApproval(
          requestId,
          optionId as ApprovalOptionKind,
        )
      ) {
        throw new Error(`Unknown application-tool approval: ${requestId}`);
      }
      this.items = markApprovalResponse(this.items, requestId, optionId);
      const item = this.items.find(
        (candidate) =>
          candidate.type === "approval" && candidate.request.id === requestId,
      );
      if (this.repository && this.location && item) {
        await this.#appendDurableItems(
          this.location,
          [item],
          this.#activeBindingId,
        );
      } else {
        await this.#persist();
      }
      return;
    }
    if (!this.session) return;
    if (pending?.type === "approval") {
      await this.#rememberPersistentDecision(pending.request, optionId);
    }
    this.items = markApprovalResponse(this.items, requestId, optionId);
    await this.session.respondToApproval(requestId, optionId);
    const item = this.items.find(
      (candidate) =>
        candidate.type === "approval" && candidate.request.id === requestId,
    );
    if (this.repository && this.location && item) {
      await this.#appendDurableItems(
        this.location,
        [item],
        this.#activeBindingId,
      );
    } else {
      await this.#persist();
    }
  }

  async respondToQuestion(
    requestId: string,
    answers: UserInputAnswers,
  ): Promise<void> {
    if (!this.session?.respondToQuestion) {
      throw new Error("The active runtime cannot answer agent questions.");
    }
    this.items = markQuestionResponse(this.items, requestId);
    const item = this.items.find(
      (candidate) =>
        candidate.type === "question" && candidate.request.id === requestId,
    );
    if (this.repository && this.location && item) {
      await this.#appendDurableItems(
        this.location,
        [item],
        this.#activeBindingId,
      );
    } else {
      await this.#persist();
    }
    await this.session.respondToQuestion(requestId, answers);
    if (!this.repository) await this.#persist();
  }

  async cancel(): Promise<void> {
    this.#turnId += 1;
    this.#activeRecallAbort?.abort();
    this.#activeRecallAbort = undefined;
    const session = this.session;
    if (session) this.#cancelledSessions.add(session);
    this.busy = false;
    this.commandWorking = false;
    this.items = interruptPendingInteractions(this.items);
    void this.#confirmCancelledNotice(session);
    await this.#persist(true);
  }

  async #confirmCancelledNotice(session: AgentSession | null): Promise<void> {
    if (session) {
      try {
        await session.cancel?.();
      } catch {
        return;
      }
      if (!this.#cancelledSessions.has(session)) return;
      if (this.session !== session && this.session) return;
    }
    if (
      this.items.some(
        (item) => item.type === "status" && item.text === CANCELLED_NOTICE,
      )
    ) {
      return;
    }
    const item: AiChatItem = {
      id: createChatItemId("status", this.items.length + 1),
      type: "status",
      text: CANCELLED_NOTICE,
      createdAt: new Date().toISOString(),
      agentBindingId: this.#activeBindingId,
    };
    this.items = [...this.items, item];
    if (this.repository && this.location) {
      await this.#appendDurableItems(
        this.location,
        [item],
        this.#activeBindingId,
      );
      return;
    }
    await this.#persist(false, this.#activeBindingId);
  }

  async cancelAndSwitch(request: Omit<AgentRequest, "prompt">): Promise<void> {
    if (this.busy) await this.cancel();
    this.error = null;
    await this.#prepareSession({ ...this.request, ...request });
  }

  async close(): Promise<void> {
    this.#turnId += 1;
    this.#activeRecallAbort?.abort();
    this.#activeRecallAbort = undefined;
    const interrupted = this.busy;
    if (interrupted) await this.session?.cancel?.().catch(() => undefined);
    this.busy = false;
    this.commandWorking = false;
    if (interrupted) this.items = interruptPendingInteractions(this.items);
    await this.#persist(interrupted);
    await this.#closeAppToolBinding();
    await this.session?.close();
    this.session = null;
    this.busy = false;
    for (const binding of this.bindings) {
      this.#slashRouter?.catalog.clearNativeCommands(binding.id);
    }
    if (this.#activeBindingId) {
      this.#slashRouter?.catalog.clearNativeCommands(this.#activeBindingId);
    }
    this.#skillSnapshots.clear();
    this.#unsubscribeAppToolEvents?.();
  }

  async #consume(
    session: AgentSession,
    agentBindingId = this.#activeBindingId,
  ): Promise<void> {
    const context = this.#sessionContexts.get(session) ?? {
      location: this.location ? { ...this.location } : null,
      pendingItems: [],
    };
    this.#sessionContexts.set(session, context);
    let traceItems: AiChatItem[] = [];
    let latestUsage: AgentUsage | null = null;
    const persistCompletedTrace = async () => {
      if (
        traceItems.length === 0 &&
        !latestUsage &&
        !context.pendingBinding &&
        !context.pendingSwitch &&
        !context.pendingConfiguration &&
        context.pendingItems.length === 0
      ) {
        return;
      }
      await waitForNextTask();
      if (this.repository && context.location) {
        if (context.pendingBinding) {
          await this.repository.appendAgentRecords(context.location, [
            context.pendingBinding,
          ]);
        }
        if (context.pendingActivationBindingId) {
          await this.repository.activateBinding(
            context.location,
            context.pendingActivationBindingId,
            context.pendingSwitch,
          );
        } else if (context.pendingSwitch) {
          await this.repository.appendTranscript(context.location, [
            context.pendingSwitch,
          ]);
        }
        if (context.pendingConfiguration) {
          await this.repository.appendAgentRecords(context.location, [
            context.pendingConfiguration.agentRecord,
          ]);
          await this.repository.appendTranscript(context.location, [
            context.pendingConfiguration.transcriptEntry,
          ]);
        }
        await this.#appendDurableItems(
          context.location,
          [...context.pendingItems, ...traceItems],
          agentBindingId,
          false,
          false,
          agentBindingId,
        );
        if (latestUsage && agentBindingId) {
          await this.#appendUsage(
            context.location,
            agentBindingId,
            latestUsage,
          );
        }
        if (agentBindingId) {
          const checkpoint = await this.repository.read(context.location);
          const through = checkpoint.transcript.at(-1);
          if (through) {
            await this.repository.appendAgentRecords(context.location, [
              {
                schemaVersion: CONVERSATION_SCHEMA_VERSION,
                id: `context-${crypto.randomUUID()}`,
                type: "binding.context.updated",
                createdAt: new Date().toISOString(),
                agentBindingId,
                throughEntryId: through.id,
                throughEntryHash: await transcriptEntryHash(through),
                cause: context.handoff ? "handoff" : "native-turn",
                handoffId: context.handoff?.handoffId,
                projectionMode: context.handoff?.mode,
                omittedEntryCount: context.handoff?.omittedEntryCount,
              },
            ]);
          }
        }
        void this.#handoffSummaries
          ?.afterTerminal(context.location)
          .catch(() => undefined);
      } else {
        await this.#persist(false, agentBindingId);
      }
      context.pendingBinding = undefined;
      context.pendingSwitch = undefined;
      context.pendingActivationBindingId = undefined;
      context.pendingConfiguration = undefined;
      context.handoff = undefined;
      context.pendingItems = [];
      traceItems = [];
      latestUsage = null;
    };
    const checkpointTrace = (): Promise<void> => {
      const checkpoint = persistCompletedTrace();
      this.#terminalCheckpoint = checkpoint.catch(() => undefined);
      return checkpoint;
    };
    try {
      for await (const event of session.events()) {
        if (
          (event.type === "tool.start" || event.type === "tool.end") &&
          event.server === APP_TOOL_MCP_SERVER_NAME
        ) {
          continue;
        }
        if (event.type === "usage") {
          latestUsage = { ...event.usage };
          if (this.session === session) this.usage = latestUsage;
          continue;
        }
        if (event.type === "status" && !isVisibleAgentStatus(event.status)) {
          continue;
        }
        if (event.type === "commands.update") {
          if (agentBindingId) {
            this.#slashRouter?.catalog.replaceNativeCommands(
              agentBindingId,
              event.commands,
            );
          }
          continue;
        }
        if (event.type === "permission.request") {
          const decision = persistentDecisionForRequest(
            this.#approvalGrants,
            event.request,
          );
          if (decision) {
            try {
              await waitForNextTask();
              await session.respondToApproval(event.request.id, decision);
              continue;
            } catch {
              // Fall through so an unmatched runtime request still opens the drawer.
            }
          }
        }
        traceItems = applyAgentEventToChatItems(traceItems, event);
        const activeSession = this.session === session;
        const cancelled = this.#cancelledSessions.has(session);
        if (activeSession && !cancelled) {
          this.items = applyAgentEventToChatItems(this.items, event).map(
            (item) =>
              item.agentBindingId || !agentBindingId
                ? item
                : { ...item, agentBindingId },
          );
        }
        if (event.type === "completed" || event.type === "error") {
          if (event.type === "error" && activeSession) {
            this.error = event.error.message;
            this.session = null;
          }
        }
        if (
          activeSession &&
          (event.type === "completed" || event.type === "error")
        ) {
          this.busy = false;
        }
        if (event.type === "completed" || event.type === "error") {
          await checkpointTrace();
        }
        if (event.type === "error") {
          await session.close().catch(() => undefined);
          await this.#closeAppToolBinding(agentBindingId);
          break;
        }
      }
    } catch (error) {
      const normalized =
        error instanceof Error ? error : new Error(String(error));
      const errorEvent = {
        type: "error",
        error: normalized,
      } as const;
      traceItems = applyAgentEventToChatItems(traceItems, errorEvent);
      if (this.session === session) {
        this.error = normalized.message;
        this.items = applyAgentEventToChatItems(this.items, errorEvent);
        this.busy = false;
        this.session = null;
      }
      await checkpointTrace();
      await session.close().catch(() => undefined);
      await this.#closeAppToolBinding(agentBindingId);
    } finally {
      if (this.session === session) this.busy = false;
      await checkpointTrace();
      this.#sessionContexts.delete(session);
    }
  }

  async refreshSkills(): Promise<void> {
    this.#refreshSkills = true;
    this.#skills?.invalidate();
    if (this.busy) return;
    this.busy = true;
    try {
      await this.#prepareSession(this.#sessionRequest);
    } finally {
      this.busy = false;
      this.#refreshSkills = false;
    }
  }

  async #executeSlash(
    resolution: NonNullable<ReturnType<SlashCommandRouter["resolve"]>>,
    request: Omit<AgentRequest, "prompt">,
  ): Promise<void> {
    const slashRouter = this.#slashRouter;
    if (!slashRouter || this.busy) return;
    this.error = null;
    if (this.repository) await this.#ensureConversation();
    const discovery = this.#skillContext?.() ?? {
      scopeDir: this.location?.scopeDir ?? "",
    };
    const result = await slashRouter.execute(resolution, {
      agentBindingId: this.#activeBindingId,
      discovery,
    });
    if (result.kind === "error") {
      this.error = result.message;
      this.items = [
        ...this.items,
        {
          id: `command-error-${crypto.randomUUID()}`,
          type: "error",
          text: result.message,
          createdAt: new Date().toISOString(),
        },
      ];
      return;
    }
    if (result.kind === "local") {
      if (result.notice === "new") {
        await this.newConversation({
          scopeDir: this.location?.scopeDir ?? "",
        });
        return;
      }
      if (result.notice === "refresh") {
        await this.refreshSkills();
        this.#appendLocalNotice("Agent skills refreshed.");
        return;
      }
      if (result.notice === "agent") {
        await this.#applyAgentCommand(result.arguments ?? "");
        return;
      }
      if (result.notice === "help") {
        await this.#withCommandProgress(async (turnId) => {
          await this.#prepareSession(request, turnId);
          if (this.#isAbandoned(turnId)) return;
          this.#appendLocalNotice(
            formatSlashHelp(
              slashRouter.catalog.list(this.#activeBindingId),
              composerAgentLabel(
                this.request.agent,
                typeof this.request.metadata?.runtime === "string"
                  ? this.request.metadata.runtime
                  : undefined,
              ),
            ),
          );
          await this.#persistCommandNotice();
        });
        return;
      }
      if (result.notice === "scope") {
        await this.#applyScopeCommand(result.arguments ?? "");
        return;
      }
      if (result.notice === "context") {
        await this.#withCommandProgress(async (turnId) => {
          await this.#prepareSession(request, turnId);
          if (this.#isAbandoned(turnId)) return;
          this.#appendLocalNotice(await this.#describeContext());
          await this.#persistCommandNotice();
        });
        return;
      }
      if (result.notice === "model") {
        await this.#withCommandProgress(async (turnId) => {
          if (this.#isAbandoned(turnId)) return;
          this.#appendLocalNotice(
            "Change the model from the composer Model menu.",
          );
          await this.#persistCommandNotice();
        });
        return;
      }
      if (result.notice === "cancel") {
        await this.#withCommandProgress(async (turnId) => {
          if (this.#isAbandoned(turnId)) return;
          this.#appendLocalNotice(
            "Use Stop in the composer to cancel the active run.",
          );
          await this.#persistCommandNotice();
        });
        return;
      }
      if (result.notice === "skills" || result.notice === "tools") {
        await this.#withCommandProgress(async (turnId) => {
          await this.#prepareSession(request, turnId);
          if (this.#isAbandoned(turnId)) return;
          if (result.notice === "skills") {
            const snapshot = await this.#effectiveSkillSnapshot();
            const items: AiChatInventoryItem[] = (snapshot?.skills ?? []).map(
              (skill) => ({
                name: skill.name,
                description: skill.description,
                kind: "skill",
                path: skillInventoryPath(this.#skills?.getLoaded(skill.name)),
              }),
            );
            this.#appendInventoryNotice(
              "skills",
              items,
              "No skills are available.",
            );
          } else {
            this.#ensureLocalAppToolSession();
            const items: AiChatInventoryItem[] = (
              this.#appToolHost?.getSession(this.#activeBindingId ?? "")
                ?.tools ?? []
            ).map((tool) => ({
              name: tool.name,
              description: tool.description,
              kind: "tool",
            }));
            this.#appendInventoryNotice(
              "tools",
              items,
              "No application tools are available.",
            );
          }
          await this.#persistCommandNotice();
        });
        return;
      }
      this.#appendLocalNotice(`/${result.notice}`);
      return;
    }
    if (result.kind === "tool") {
      await this.#withCommandProgress(async (turnId) => {
        await this.#prepareSession(request, turnId);
        if (this.#isAbandoned(turnId)) return;
        this.#ensureLocalAppToolSession();
        if (!this.#appToolHost || !this.#activeBindingId) {
          this.error = "Application tools are unavailable for this command.";
          this.items = [
            ...this.items,
            {
              id: `command-error-${crypto.randomUUID()}`,
              type: "error",
              text: this.error,
              createdAt: new Date().toISOString(),
            },
          ];
          return;
        }
        const callId = `slash-tool-${crypto.randomUUID()}`;
        const toolEvent = {
          id: callId,
          name: result.tool,
          server: APP_TOOL_MCP_SERVER_NAME,
          input: result.input,
        };
        await this.#applySlashToolEvent({
          type: "tool.start",
          ...toolEvent,
        });
        try {
          const toolResult = await this.#appToolHost.invoke(
            this.#activeBindingId,
            {
              runId: callId,
              toolCallId: callId,
              name: result.tool,
              input: result.input,
            },
          );
          if (this.#isAbandoned(turnId)) return;
          await this.#applySlashToolEvent({
            type: "tool.end",
            ...toolEvent,
            ...(toolResult.isError
              ? { error: toolResult }
              : { output: toolResult }),
          });
        } catch (error) {
          if (this.#isAbandoned(turnId)) return;
          await this.#applySlashToolEvent({
            type: "tool.end",
            ...toolEvent,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });
      return;
    }
    if (result.kind === "skill") {
      await this.#submitWithActivation(result.activation, request);
      return;
    }
    if (result.kind === "prompt") {
      await this.submit(result.prompt, request);
      return;
    }
    if (result.kind === "native") {
      const text = `/${result.name}${result.arguments ? ` ${result.arguments}` : ""}`;
      await this.#recordCommandItem(
        result.name,
        "native-agent",
        result.arguments,
      );
      this.busy = true;
      try {
        await this.#prepareSession(request);
        await this.session?.send(text);
      } finally {
        this.busy = false;
      }
    }
  }

  async #submitWithActivation(
    activation: {
      skillId: string;
      skillName: string;
      version: string;
      source: "user" | "model" | "app";
      arguments?: string;
      instructions: string;
    },
    request: Omit<AgentRequest, "prompt">,
  ): Promise<void> {
    this.busy = true;
    try {
      await this.#prepareSession({
        ...request,
        skillActivations: [activation],
      });
      this.items = [
        ...this.items,
        {
          id: `skill-${crypto.randomUUID()}`,
          type: "skill-activation",
          skillId: activation.skillId,
          skillName: activation.skillName,
          version: activation.version,
          origin: activation.source,
          arguments: activation.arguments,
          text: `Skill ${activation.skillName} (${activation.version})`,
          createdAt: new Date().toISOString(),
          agentBindingId: this.#activeBindingId,
        },
      ];
      if (this.repository && this.location) {
        await this.#appendDurableItems(
          this.location,
          [this.items.at(-1)!],
          this.#activeBindingId,
        );
      }
      await this.session?.send(
        activation.arguments?.trim() || activation.skillName,
      );
    } finally {
      this.busy = false;
    }
  }

  async #applyAgentCommand(raw: string): Promise<void> {
    const parsed = parseAgentCommand(raw);
    if (parsed === "unknown") {
      this.error = `Unknown agent: ${raw.trim()}`;
      this.items = [
        ...this.items,
        {
          id: `command-error-${crypto.randomUUID()}`,
          type: "error",
          text: this.error,
          createdAt: new Date().toISOString(),
        },
      ];
      return;
    }
    if (parsed === "status") {
      await this.#withCommandProgress(async (turnId) => {
        if (this.#isAbandoned(turnId)) return;
        this.#appendLocalNotice(
          composerAgentLabel(
            this.request.agent,
            typeof this.request.metadata?.runtime === "string"
              ? this.request.metadata.runtime
              : undefined,
          ),
        );
        await this.#persistCommandNotice();
      });
      return;
    }
    this.request = {
      ...this.request,
      agent: parsed.agent,
      metadata: {
        ...this.request.metadata,
        runtime: parsed.runtimePreference,
      },
    };
    this.#sessionRequest = { ...this.request };
    this.#onComposerDefaults?.({
      agent: parsed.agent,
      runtimePreference: parsed.runtimePreference,
    });
    if (this.session) {
      await this.cancelAndSwitch({
        agent: parsed.agent,
        metadata: this.request.metadata,
      });
    }
    this.#appendLocalNotice(`Agent: ${parsed.label}`);
    await this.#persistCommandNotice();
  }

  async #applyScopeCommand(raw: string): Promise<void> {
    const folder = raw.trim();
    if (!folder) {
      await this.#withCommandProgress(async (turnId) => {
        if (this.#isAbandoned(turnId)) return;
        this.#appendLocalNotice(await this.#describeScope());
        await this.#persistCommandNotice();
      });
      return;
    }
    try {
      const scopeDir = normalizeConversationScope(folder);
      const input = this.#createConversation?.(scopeDir) ?? { scopeDir };
      await this.newConversation({
        ...input,
        scopeDir,
      });
      this.#appendLocalNotice(await this.#describeScope("explicit"));
      await this.#persistCommandNotice();
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
      this.items = [
        ...this.items,
        {
          id: `command-error-${crypto.randomUUID()}`,
          type: "error",
          text: this.error,
          createdAt: new Date().toISOString(),
        },
      ];
    }
  }

  async #describeScope(
    source?: "explicit" | "active-file" | "vault-root" | "conversation",
  ): Promise<string> {
    const snapshot =
      this.repository && this.location
        ? await this.repository.read(this.location).catch(() => undefined)
        : undefined;
    const pending = this.#createConversation?.();
    const scopeDir = this.location?.scopeDir ?? pending?.scopeDir ?? "";
    return formatScopeNotice({
      scopeDir,
      launchNotePath:
        snapshot?.metadata.launchContext?.notePath ?? pending?.launchNotePath,
      workspace: snapshot?.metadata.workspace?.path ?? this.workspace,
      source:
        source ??
        (this.location ? "conversation" : scopeDir ? "folder" : "vault-root"),
    });
  }

  async #describeContext(): Promise<string> {
    const snapshot =
      this.repository && this.location
        ? await this.repository.read(this.location).catch(() => undefined)
        : undefined;
    const pending = this.#createConversation?.();
    const binding = this.#activeBinding;
    const scopeDir = this.location?.scopeDir ?? pending?.scopeDir ?? "";
    const bootstrap = await buildAgentBootstrap({
      conversationId: this.location?.conversationId ?? snapshot?.metadata.id,
      scopeDir,
      launchNotePath:
        snapshot?.metadata.launchContext?.notePath ?? pending?.launchNotePath,
      workspaceLabel: portableWorkspaceLabel(
        snapshot?.metadata.workspace?.path ?? this.workspace,
      ),
      readText: this.#readVaultText,
    });
    return formatContextNotice({
      conversationId: this.location?.conversationId ?? snapshot?.metadata.id,
      scopeDir,
      launchNotePath:
        snapshot?.metadata.launchContext?.notePath ?? pending?.launchNotePath,
      workspace: bootstrap.workspace?.label,
      agent: composerAgentLabel(
        this.request.agent,
        typeof this.request.metadata?.runtime === "string"
          ? this.request.metadata.runtime
          : undefined,
      ),
      model: this.request.model?.model ?? binding?.model?.model,
      tools:
        this.#appToolHost
          ?.getSession(this.#activeBindingId ?? "")
          ?.tools.map((tool) => tool.name) ?? [],
      skills:
        (await this.#effectiveSkillSnapshot())?.skills.map(
          (skill) => skill.name,
        ) ?? [],
      folderInstructionPaths: bootstrap.folderInstructions
        .filter((entry) => !entry.omitted)
        .map((entry) => entry.path),
      truncated: bootstrap.truncated,
    });
  }

  async #sessionBootstrapMetadata(
    scopeDir: string,
    launchNotePath: string | undefined,
    conversationId: string | undefined,
    tools: readonly { name: string; description: string }[],
    skills: readonly { name: string; description: string; version: string }[],
  ): Promise<Record<string, string>> {
    try {
      const { text } = await buildSessionBootstrap({
        conversationId,
        scopeDir,
        launchNotePath,
        workspaceLabel: portableWorkspaceLabel(this.workspace),
        tools,
        skills,
        readText: this.#readVaultText,
      });
      return { sessionBootstrap: text };
    } catch {
      return {};
    }
  }

  async #withCommandProgress(
    work: (turnId: number) => Promise<void>,
  ): Promise<void> {
    const turnId = ++this.#turnId;
    this.busy = true;
    this.commandWorking = true;
    try {
      await work(turnId);
    } finally {
      this.commandWorking = false;
      if (this.#turnId === turnId) this.busy = false;
    }
  }

  #appendLocalNotice(text: string): void {
    this.items = [
      ...this.items,
      {
        id: `notice-${crypto.randomUUID()}`,
        type: "status",
        text,
        layout: "report",
        createdAt: new Date().toISOString(),
      },
    ];
  }

  #appendInventoryNotice(
    kind: AiChatInventory["kind"],
    items: AiChatInventoryItem[],
    emptyText: string,
  ): void {
    this.items = [
      ...this.items,
      {
        id: `notice-${crypto.randomUUID()}`,
        type: "status",
        text: items.map((item) => item.name).join(", ") || emptyText,
        layout: "inventory",
        inventory: { kind, items },
        createdAt: new Date().toISOString(),
      },
    ];
  }

  async #recordCommandItem(
    command: string,
    source: "app" | "extension" | "skill" | "native-agent",
    args?: string,
  ): Promise<void> {
    const item: AiChatItem = {
      id: `command-${crypto.randomUUID()}`,
      type: "command",
      command,
      origin: source,
      arguments: args,
      status: "completed",
      text: `/${command}${args ? ` ${args}` : ""}`,
      createdAt: new Date().toISOString(),
      agentBindingId: this.#activeBindingId,
    };
    this.items = [...this.items, item];
    if (this.repository && this.location) {
      await this.#appendDurableItems(
        this.location,
        [item],
        this.#activeBindingId,
      );
    }
  }

  async #persistCommandNotice(): Promise<void> {
    const item = this.items.at(-1);
    if (this.repository && this.location && item) {
      await this.#appendDurableItems(
        this.location,
        [item],
        this.#activeBindingId,
      );
    }
  }

  async #applySlashToolEvent(
    event: Extract<AgentEvent, { type: "tool.start" | "tool.end" }>,
  ): Promise<void> {
    const bindingId = this.#activeBindingId;
    this.items = applyAgentEventToChatItems(this.items, event).map((item) =>
      item.agentBindingId || !bindingId
        ? item
        : { ...item, agentBindingId: bindingId },
    );
    const item = this.items.find(
      (candidate) =>
        candidate.id === event.id ||
        (candidate.type === "tool" && candidate.toolId === event.id),
    );
    if (this.repository && this.location && item) {
      await this.#appendDurableItems(this.location, [item], bindingId);
    } else if (!this.repository) {
      await this.#persist(false, bindingId);
    }
  }

  async syncComposerCommands(): Promise<void> {
    await this.#syncSlashCatalog();
  }

  async #syncSlashCatalog(): Promise<void> {
    if (!this.#slashRouter || !this.#skills) return;
    const context = this.#discoveryContext();
    await this.#slashRouter.catalog.refreshFileCommands(context.scopeDir);
    const snapshot = await this.#effectiveSkillSnapshot();
    if (snapshot) this.#slashRouter.catalog.rebuildSkillCommands(snapshot);
  }

  #discoveryContext(): SkillDiscoveryContext {
    return (
      this.#skillContext?.() ?? {
        scopeDir: this.location?.scopeDir ?? "",
      }
    );
  }

  #ensureLocalAppToolSession(): void {
    if (!this.#appToolHost || !this.#activeBindingId) return;
    if (this.#appToolHost.getSession(this.#activeBindingId)) return;
    this.#appToolHost.createSession({
      conversationId: this.location?.conversationId ?? "local",
      agentBindingId: this.#activeBindingId,
      scopeDir: this.location?.scopeDir ?? "",
      runtimeSupportsAppTools: true,
    });
  }

  async #effectiveSkillSnapshot(): Promise<
    import("../skills/types").SkillSnapshot | undefined
  > {
    const scopeDir =
      this.location?.scopeDir ?? this.#discoveryContext().scopeDir;
    if (this.#activeBindingId) {
      return this.#prepareSkillSnapshot(this.#activeBindingId, scopeDir);
    }
    if (!this.#skills) return undefined;
    return this.#skills.snapshot(this.#discoveryContext());
  }

  async #prepareSkillSnapshot(
    bindingId: string,
    scopeDir: string,
  ): Promise<import("../skills/types").SkillSnapshot | undefined> {
    if (!this.#skills) return undefined;
    const existing = this.#skillSnapshots.get(bindingId);
    await this.#slashRouter?.catalog.refreshFileCommands(scopeDir);
    if (existing && !this.#refreshSkills) {
      this.#slashRouter?.catalog.rebuildSkillCommands(existing);
      return existing;
    }
    const snapshot = await this.#skills.snapshot(
      this.#skillContext?.() ?? { scopeDir },
    );
    this.#skillSnapshots.set(bindingId, snapshot);
    this.#slashRouter?.catalog.rebuildSkillCommands(snapshot);
    return snapshot;
  }

  #isAbandoned(turnId?: number): boolean {
    return turnId !== undefined && this.#turnId !== turnId;
  }

  #releaseUnreadableLocation(error: unknown): void {
    this.error = error instanceof Error ? error.message : String(error);
    this.#approvalGrants = [];
    if (!this.location) return;
    this.location = null;
    this.conversationStatus = null;
    this.conversationPinned = false;
    this.#onLocationChange?.(null);
  }

  #loadApprovalGrants(metadata: ConversationMetadata): void {
    this.#approvalGrants = [...(metadata.approvalGrants ?? [])];
  }

  async #rememberPersistentDecision(
    request: ApprovalRequest,
    optionId: string,
  ): Promise<void> {
    if (request.origin === "app-tool") return;
    const decision = persistentDecisionFromOption(optionId);
    const name = approvalGrantIdentity(request);
    if (!decision || !name) return;
    this.#approvalGrants = upsertApprovalGrant(
      this.#approvalGrants,
      name,
      decision,
    );
    if (!this.repository || !this.location) return;
    await this.repository.writeApprovalGrants(
      this.location,
      this.#approvalGrants,
    );
  }

  async #ensureConversation(): Promise<void> {
    if (!this.repository) return;
    if (this.location) {
      try {
        const snapshot = await this.repository.read(this.location);
        this.#loadApprovalGrants(snapshot.metadata);
        return;
      } catch (error) {
        if (!(error instanceof ConversationUnavailableError)) throw error;
        this.location = null;
        this.conversationStatus = null;
        this.#approvalGrants = [];
        this.#onLocationChange?.(null);
      }
    }
    const followedScope = this.#followedScope ?? this.directoryContext;
    const input =
      this.#followedScope !== undefined || this.directoryContext
        ? (this.#createConversation?.(followedScope) ?? {
            scopeDir: followedScope,
          })
        : (this.#createConversation?.() ?? { scopeDir: "" });
    const created = await this.repository.create(input);
    this.location = created.location;
    this.conversationStatus = created.metadata.status;
    this.conversationPinned = Boolean(created.metadata.pinned);
    this.directoryContext = created.location.scopeDir;
    this.#followedScope = created.location.scopeDir;
    this.pickerEntries = [];
    this.#approvalGrants = [];
    this.#onLocationChange?.(this.location);
  }

  #activateNewBinding(
    bindingId: string,
    session: AgentSession,
    request: Omit<AgentRequest, "prompt">,
    runtime = this.runtime,
    handoff?: ConversationContextHandoff,
    replacesBindingId = this.#activeBindingId,
  ): { binding: AgentBindingCreatedRecord; switchRecord?: TranscriptEntry } {
    const previousBindingId = this.#activeBindingId;
    const binding: AgentBindingCreatedRecord = {
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      id: bindingId,
      type: "binding.created",
      createdAt: new Date().toISOString(),
      runtime: runtime.id,
      agent: request.agent,
      model: request.model ? { ...request.model } : undefined,
      thinking: request.thinking,
      nativeSessionId: session.id,
      handoffThroughEntryId: handoff?.throughEntryId,
      replacesBindingId,
    };
    const switchRecord: TranscriptEntry | undefined = previousBindingId
      ? {
          schemaVersion: CONVERSATION_SCHEMA_VERSION,
          id: `switch-${crypto.randomUUID()}`,
          type: "agent.switch",
          createdAt: binding.createdAt,
          agentBindingId: binding.id,
          fromBindingId: previousBindingId,
          toBindingId: binding.id,
          handoffId: handoff?.handoffId,
          handoffMode: handoff?.mode,
          handoffThroughEntryId: handoff?.throughEntryId,
          omittedEntryCount: handoff?.omittedEntryCount,
        }
      : undefined;
    this.#activeBinding = binding;
    this.#activeBindingId = binding.id;
    this.bindings = [...this.bindings, binding];
    return { binding, switchRecord };
  }

  async #prepareAppToolSession(
    bindingId: string,
    runtime: AgentRuntime,
    location: Pick<ConversationLocation, "conversationId" | "scopeDir">,
    launchNotePath?: string,
  ): Promise<AppToolSessionDescriptor | undefined> {
    if (!this.#appToolBridge) return undefined;
    try {
      const descriptor = await this.#appToolBridge.prepare({
        conversationId: location.conversationId,
        agentBindingId: bindingId,
        scopeDir: location.scopeDir,
        launchNotePath,
        runtimeSupportsAppTools:
          runtime.id !== "fake" && runtime.capabilities().mcpTools,
      });
      this.appToolsUnavailableReason =
        descriptor.status === "runtime-unavailable" && runtime.id === "fake"
          ? null
          : (descriptor.unavailableReason ?? null);
      return descriptor;
    } catch (error) {
      this.appToolsUnavailableReason = `Application tools are unavailable. ${
        error instanceof Error ? error.message : String(error)
      }`;
      return undefined;
    }
  }

  async #closeAppToolBinding(bindingId = this.#activeBindingId): Promise<void> {
    if (!bindingId) return;
    await this.#appToolBridge?.closeBinding(bindingId);
    if (!this.#appToolBridge) {
      this.#appToolHost?.closeBinding(bindingId);
    }
  }

  async #detachSession(session: AgentSession | null): Promise<void> {
    if (!session) return;
    if (session.detach) await session.detach().catch(() => undefined);
    else await session.close().catch(() => undefined);
  }

  async #consumeAppToolEvent({
    bindingId,
    event,
  }: AppToolBridgeEvent): Promise<void> {
    if (
      this.#activeBindingId &&
      bindingId !== this.#activeBindingId &&
      !this.bindings.some((binding) => binding.id === bindingId)
    ) {
      return;
    }
    this.items = applyAgentEventToChatItems(this.items, event).map((item) =>
      item.agentBindingId ? item : { ...item, agentBindingId: bindingId },
    );
    const itemId =
      event.type === "permission.request"
        ? `approval-${event.request.id}`
        : event.type === "tool.start" || event.type === "tool.end"
          ? event.id
          : undefined;
    const item = itemId
      ? this.items.find(
          (candidate) =>
            candidate.id === itemId ||
            (candidate.type === "tool" && candidate.toolId === itemId),
        )
      : undefined;
    if (this.repository && this.location && item) {
      await this.#appendDurableItems(this.location, [item], bindingId);
    } else if (!this.repository) {
      await this.#persist(false, bindingId);
    }
  }

  #bindingMatchesIdentity(
    binding: AgentBindingCreatedRecord,
    request: Omit<AgentRequest, "prompt">,
    runtime = this.runtime,
  ): boolean {
    return binding.runtime === runtime.id && binding.agent === request.agent;
  }

  #bindingMatchesConfiguration(
    binding: AgentBindingCreatedRecord,
    request: Omit<AgentRequest, "prompt">,
  ): boolean {
    return (
      binding.model?.provider === request.model?.provider &&
      binding.model?.model === request.model?.model &&
      binding.thinking === request.thinking
    );
  }

  async #configureBinding(
    session: AgentSession,
    binding: EffectiveAgentBinding,
    request: Omit<AgentRequest, "prompt">,
  ): Promise<
    | {
        binding: EffectiveAgentBinding;
        pendingConfiguration?: {
          previous: EffectiveAgentBinding;
          updated: EffectiveAgentBinding;
          agentRecord: AgentBindingConfigUpdatedRecord;
          transcriptEntry: Extract<TranscriptEntry, { type: "agent.config" }>;
        };
      }
    | undefined
  > {
    const modelChanged =
      binding.model?.provider !== request.model?.provider ||
      binding.model?.model !== request.model?.model;
    const thinkingChanged = binding.thinking !== request.thinking;
    if (!modelChanged && !thinkingChanged) return { binding };
    if (!session.configure) return undefined;
    try {
      const result = await session.configure({
        ...(modelChanged ? { model: request.model } : {}),
        ...(thinkingChanged ? { thinking: request.thinking } : {}),
      });
      if (
        (modelChanged &&
          result.model?.status !== "applied" &&
          result.model?.status !== "unchanged") ||
        (thinkingChanged &&
          result.thinking?.status !== "applied" &&
          result.thinking?.status !== "unchanged")
      ) {
        return undefined;
      }
    } catch {
      return undefined;
    }

    const updated: EffectiveAgentBinding = {
      ...binding,
      ...(modelChanged
        ? { model: request.model ? { ...request.model } : undefined }
        : {}),
      ...(thinkingChanged ? { thinking: request.thinking } : {}),
    };
    const createdAt = new Date().toISOString();
    return {
      binding: updated,
      pendingConfiguration: {
        previous: binding,
        updated,
        agentRecord: {
          schemaVersion: CONVERSATION_SCHEMA_VERSION,
          id: `config-${crypto.randomUUID()}`,
          type: "binding.config.updated",
          createdAt,
          agentBindingId: binding.id,
          ...(modelChanged && request.model
            ? { model: { ...request.model } }
            : {}),
          ...(thinkingChanged && request.thinking
            ? { thinking: request.thinking }
            : {}),
        },
        transcriptEntry: {
          schemaVersion: CONVERSATION_SCHEMA_VERSION,
          id: `agent-config-${crypto.randomUUID()}`,
          type: "agent.config",
          createdAt,
          agentBindingId: binding.id,
          ...(modelChanged && request.model
            ? { model: { ...request.model } }
            : {}),
          ...(thinkingChanged && request.thinking
            ? { thinking: request.thinking }
            : {}),
        },
      },
    };
  }

  async #prepareSession(
    request: Omit<AgentRequest, "prompt">,
    turnId?: number,
  ): Promise<void> {
    if (this.#isAbandoned(turnId)) return;
    await this.#terminalCheckpoint;
    if (this.#isAbandoned(turnId)) return;
    const targetRuntime = this.#selectRuntime
      ? await this.#selectRuntime({
          ...request,
          prompt: "",
          mcpServers: request.mcpServers ?? this.mcpServers,
        })
      : this.runtime;
    if (this.#isAbandoned(turnId)) return;

    const refreshRequiresReplacement =
      this.#refreshSkills ||
      Boolean(request.skillActivations && request.skillActivations.length > 0);
    let activeConfigurationFailed = false;
    if (
      this.session &&
      this.#activeBinding &&
      !refreshRequiresReplacement &&
      this.#bindingMatchesIdentity(this.#activeBinding, request, targetRuntime)
    ) {
      const configured = await this.#configureBinding(
        this.session,
        this.#activeBinding,
        request,
      );
      if (configured) {
        this.bindings = this.bindings.map((binding) =>
          binding.id === configured.binding.id ? configured.binding : binding,
        );
        this.#activeBinding = configured.binding;
        if (configured.pendingConfiguration) {
          const context = this.#sessionContexts.get(this.session) ?? {
            location: this.location ? { ...this.location } : null,
            pendingItems: [],
          };
          context.pendingConfiguration = configured.pendingConfiguration;
          this.#sessionContexts.set(this.session, context);
        }
        await this.#prepareSkillSnapshot(
          configured.binding.id,
          this.location?.scopeDir ?? this.#discoveryContext().scopeDir,
        );
        this.#sessionRequest = request;
        return;
      }
      activeConfigurationFailed = true;
    }

    const previousSession = this.session;
    const previousBindingId = this.#activeBindingId;
    this.#sessionRequest = request;
    let snapshot:
      | Awaited<ReturnType<ConversationRepository["read"]>>
      | undefined;
    let compatibleBinding: EffectiveAgentBinding | undefined;
    let failedCompatibleBindingId: string | undefined;
    if (this.repository && this.location) {
      snapshot = await this.repository.read(this.location);
      compatibleBinding = [...reduceAgentBindings(snapshot.agents)]
        .reverse()
        .find(
          (binding) =>
            this.#bindingMatchesIdentity(binding, request, targetRuntime) &&
            binding.id !==
              (activeConfigurationFailed ? previousBindingId : undefined) &&
            Boolean(binding.context) &&
            Boolean(binding.nativeSessionId),
        );
    }

    if (
      !refreshRequiresReplacement &&
      compatibleBinding?.nativeSessionId &&
      compatibleBinding.context &&
      snapshot &&
      targetRuntime.capabilities().resume &&
      targetRuntime.resume
    ) {
      let resumed: AgentSession | undefined;
      try {
        const handoff = await buildConversationContextHandoff(
          snapshot.transcript,
          {
            conversationId: snapshot.metadata.id,
            targetBindingId: compatibleBinding.id,
            after: {
              entryId: compatibleBinding.context.throughEntryId,
              entryHash: compatibleBinding.context.throughEntryHash,
            },
            bindings: reduceAgentBindings(snapshot.agents),
            summaries: snapshot.agents.filter(
              (record) => record.type === "handoff.summary.created",
            ),
          },
        );
        const appToolSession = await this.#prepareAppToolSession(
          compatibleBinding.id,
          targetRuntime,
          snapshot.location,
          snapshot.metadata.launchContext?.notePath,
        );
        const skillSnapshot = await this.#prepareSkillSnapshot(
          compatibleBinding.id,
          snapshot.location.scopeDir,
        );
        resumed = await targetRuntime.resume(
          compatibleBinding.nativeSessionId,
          {
            ...request,
            appToolSession,
            skillSnapshot,
          },
        );
        const configured = await this.#configureBinding(
          resumed,
          compatibleBinding,
          request,
        );
        if (!configured)
          throw new Error("Session configuration is unsupported.");
        if (this.#isAbandoned(turnId)) {
          await resumed.close().catch(() => undefined);
          await this.#closeAppToolBinding(compatibleBinding.id);
          return;
        }
        if (previousBindingId && previousBindingId !== compatibleBinding.id) {
          await this.#closeAppToolBinding(previousBindingId);
          await this.#detachSession(previousSession);
        }
        const switchRecord: TranscriptEntry | undefined =
          previousBindingId !== compatibleBinding.id
            ? {
                schemaVersion: CONVERSATION_SCHEMA_VERSION,
                id: `switch-${crypto.randomUUID()}`,
                type: "agent.switch",
                createdAt: new Date().toISOString(),
                agentBindingId: compatibleBinding.id,
                fromBindingId: previousBindingId,
                toBindingId: compatibleBinding.id,
                handoffId: handoff?.handoffId,
                handoffMode: handoff?.mode,
                handoffThroughEntryId: handoff?.throughEntryId,
                omittedEntryCount: handoff?.omittedEntryCount,
              }
            : undefined;
        this.runtime = targetRuntime;
        this.session = resumed;
        this.#activeBinding = configured.binding;
        this.#activeBindingId = configured.binding.id;
        this.bindings = this.bindings.map((binding) =>
          binding.id === configured.binding.id ? configured.binding : binding,
        );
        if (handoff) this.#pendingHandoffs.set(resumed, handoff);
        this.#sessionContexts.set(resumed, {
          location: { ...snapshot.location },
          ...(switchRecord
            ? {
                pendingSwitch: switchRecord,
                pendingActivationBindingId: configured.binding.id,
              }
            : {}),
          ...(configured.pendingConfiguration
            ? { pendingConfiguration: configured.pendingConfiguration }
            : {}),
          ...(handoff ? { handoff } : {}),
          pendingItems: [],
        });
        void this.#consume(resumed, configured.binding.id);
        return;
      } catch {
        await resumed?.close().catch(() => undefined);
        await this.#closeAppToolBinding(compatibleBinding.id);
        failedCompatibleBindingId = compatibleBinding.id;
        compatibleBinding = undefined;
      }
    }

    const bindingId = `binding-${crypto.randomUUID()}`;
    const handoff =
      snapshot && previousBindingId
        ? await buildConversationContextHandoff(snapshot.transcript, {
            conversationId: snapshot.metadata.id,
            targetBindingId: bindingId,
            bindings: reduceAgentBindings(snapshot.agents),
            summaries: snapshot.agents.filter(
              (record) => record.type === "handoff.summary.created",
            ),
          })
        : undefined;
    const skillSnapshot = await this.#prepareSkillSnapshot(
      bindingId,
      snapshot?.location.scopeDir ?? this.location?.scopeDir ?? "",
    );
    const appToolLocation = snapshot?.location ?? this.location;
    const appToolSession = appToolLocation
      ? await this.#prepareAppToolSession(
          bindingId,
          targetRuntime,
          appToolLocation,
          snapshot?.metadata.launchContext?.notePath,
        )
      : undefined;
    const preparedRequest: Omit<AgentRequest, "prompt"> = {
      ...request,
      skillSnapshot,
      metadata: {
        ...request.metadata,
        ...(skillSnapshot
          ? {
              availableSkillsManifest:
                buildAvailableSkillsManifest(skillSnapshot),
            }
          : {}),
        ...(appToolSession?.tools.length
          ? {
              availableAppTools: appToolSession.tools.map((tool) => tool.name),
            }
          : {}),
        ...(await this.#sessionBootstrapMetadata(
          snapshot?.location.scopeDir ?? this.location?.scopeDir ?? "",
          snapshot?.metadata.launchContext?.notePath ??
            this.#createConversation?.()?.launchNotePath,
          snapshot?.metadata.id ?? this.location?.conversationId,
          appToolSession?.tools ?? [],
          skillSnapshot?.skills ?? [],
        )),
      },
    };
    if (this.#isAbandoned(turnId)) {
      await this.#closeAppToolBinding(bindingId);
      return;
    }
    let started: AgentSession;
    try {
      started = await targetRuntime.start({
        ...preparedRequest,
        prompt: "",
        mcpServers: preparedRequest.mcpServers ?? this.mcpServers,
        appToolSession,
      });
    } catch (error) {
      await this.#closeAppToolBinding(bindingId);
      throw error;
    }
    if (this.#isAbandoned(turnId)) {
      this.#cancelledSessions.add(started);
      void started.cancel?.().catch(() => undefined);
      await started.close().catch(() => undefined);
      await this.#closeAppToolBinding(bindingId);
      return;
    }
    if (previousBindingId) {
      await this.#closeAppToolBinding(previousBindingId);
      await this.#detachSession(previousSession);
    }
    const { binding, switchRecord } = this.#activateNewBinding(
      bindingId,
      started,
      request,
      targetRuntime,
      handoff,
      failedCompatibleBindingId ?? compatibleBinding?.id ?? previousBindingId,
    );
    if (handoff) this.#pendingHandoffs.set(started, handoff);
    this.#sessionContexts.set(started, {
      location: this.location ? { ...this.location } : null,
      ...(this.repository ? { pendingBinding: binding } : {}),
      ...(this.repository && switchRecord
        ? { pendingSwitch: switchRecord }
        : {}),
      ...(handoff ? { handoff } : {}),
      pendingItems: [],
    });
    this.runtime = targetRuntime;
    this.session = started;
    this.#refreshSkills = false;
    void this.#consume(started, this.#activeBindingId);
  }

  async #appendDurableItems(
    location: ConversationLocation,
    items: AiChatItem[],
    agentBindingId = this.#activeBindingId,
    busy = false,
    interrupted = false,
    namespace?: string,
  ): Promise<void> {
    if (!this.repository) return;
    const durableItems = namespace
      ? namespaceChatItems(items, namespace)
      : items;
    const entries = projectChatItemsToTranscript(durableItems, {
      agentBindingId,
    }).filter(
      (entry) =>
        !(busy && entry.type === "message" && entry.role === "assistant"),
    );
    if (interrupted) {
      entries.push({
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        id: `cancelled-${crypto.randomUUID()}`,
        type: "cancelled",
        text: "Agent turn interrupted",
        createdAt: new Date().toISOString(),
        agentBindingId,
      });
      for (const item of durableItems) {
        if (
          (item.type === "approval" || item.type === "question") &&
          item.status === "cancelled"
        ) {
          entries.push({
            schemaVersion: CONVERSATION_SCHEMA_VERSION,
            id: `${item.id}:cancelled`,
            type: "cancelled",
            createdAt: new Date().toISOString(),
            requestId: item.request.id,
            interactionType: item.type,
            agentBindingId,
          });
        }
      }
    }
    if (entries.length > 0) {
      await this.repository.appendTranscript(location, entries);
    }
  }

  async #appendUsage(
    location: ConversationLocation,
    agentBindingId: string,
    usage: AgentUsage,
  ): Promise<void> {
    if (!this.repository) return;
    await this.repository.appendAgentRecords(location, [
      {
        schemaVersion: CONVERSATION_SCHEMA_VERSION,
        id: `usage-${crypto.randomUUID()}`,
        type: "usage.updated",
        createdAt: new Date().toISOString(),
        agentBindingId,
        usage: { ...usage },
      },
    ]);
  }

  async #persist(
    interrupted = false,
    agentBindingId = this.#activeBindingId,
  ): Promise<void> {
    if (this.repository) {
      if (!this.location) return;
      const location = { ...this.location };
      const items = [...this.items];
      const busy = this.busy;
      this.#persistQueue = this.#persistQueue.then(async () => {
        if (!this.repository) return;
        await this.#appendDurableItems(
          location,
          items,
          agentBindingId,
          busy,
          interrupted,
        );
        if (!busy && this.usage && this.#usageDirty && agentBindingId) {
          await this.#appendUsage(location, agentBindingId, this.usage);
          this.#usageDirty = false;
        }
      });
      await this.#persistQueue;
      return;
    }
    if (!this.store) return;
    this.#persistQueue = this.#persistQueue.then(async () => {
      const snapshot: StoredAgentSession = snapshotStoredChatSession({
        id: this.sessionId,
        runtime: this.runtime.id,
        runtimeSessionId: this.session?.id ?? this.sessionId,
        workspace: this.workspace,
        agent: this.#sessionRequest.agent,
        model: this.#sessionRequest.model,
        thinking: this.#sessionRequest.thinking,
        usage: this.usage ?? undefined,
        items: this.items,
        createdAt: this.#createdAt,
        interrupted,
      });
      this.#createdAt = snapshot.createdAt;
      await this.store?.save(snapshot);
    });
    await this.#persistQueue;
  }
}

const CANCELLED_NOTICE = "Agent turn cancelled";

function waitForNextTask(): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, 0));
}

function portableWorkspaceLabel(value?: string): string | undefined {
  const label = value?.trim();
  if (!label || hasHostFilesystemPath(label)) return undefined;
  return label;
}

function readAttachmentPaths(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function skillInventoryPath(
  skill: AppSkillDescriptor | undefined,
): string | undefined {
  if (!skill || skill.source === "programmatic") return undefined;
  if (skill.root.includes(":") || skill.root.startsWith("bundled/")) {
    return undefined;
  }
  return skill.root.endsWith("SKILL.md")
    ? skill.root
    : `${skill.root}/SKILL.md`;
}

function namespaceChatItems(
  items: AiChatItem[],
  namespace: string,
): AiChatItem[] {
  return items.map((item) => ({ ...item, id: `${namespace}:${item.id}` }));
}
