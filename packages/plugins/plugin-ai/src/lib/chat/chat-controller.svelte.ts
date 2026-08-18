import type {
  AgentRequest,
  AgentRuntime,
  AgentSession,
  AgentUsage,
  AppToolSessionDescriptor,
  ApprovalOptionKind,
  McpServerContribution,
  UserInputAnswers,
} from "../core/types";
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
  projectChatItemsToTranscript,
  projectTranscriptToChatItems,
} from "../conversations/transcript-projection";
import {
  CONVERSATION_SCHEMA_VERSION,
  type AgentBindingCreatedRecord,
  type ConversationLocation,
  type ConversationMetadata,
} from "../conversations/types";
import { extractMentionPaths, mergeAttachmentPaths } from "./chat-mentions";
import {
  applyStoredSessionResumePolicy,
  chatSessionId,
  loadStoredChatSession,
  snapshotStoredChatSession,
} from "./chat-session";
import type { AiChatItem } from "./chat-items";
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
import {
  SkillSnapshotStore,
  type SkillRegistry,
} from "../skills/registry";
import type { SkillDiscoveryContext } from "../skills/types";
import { SlashCommandRouter } from "../commands/router";

export class AiChatController {
  items = $state.raw<AiChatItem[]>([]);
  busy = $state(false);
  error = $state<string | null>(null);
  usage = $state<AgentUsage | null>(null);
  appToolsUnavailableReason = $state<string | null>(null);
  bindings = $state.raw<AgentBindingCreatedRecord[]>([]);
  location = $state.raw<ConversationLocation | null>(null);
  conversationStatus = $state<ConversationMetadata["status"] | null>(null);
  session: AgentSession | null = null;
  runtime: AgentRuntime;
  readonly unavailableReason: string | null;
  readonly mcpServers: McpServerContribution[];
  readonly store?: AgentSessionStore;
  readonly repository?: ConversationRepository;
  readonly sessionId: string;
  readonly workspace?: string;
  readonly request: Omit<AgentRequest, "prompt">;
  #sessionRequest: Omit<AgentRequest, "prompt">;
  #createdAt?: string;
  #persistQueue: Promise<void> = Promise.resolve();
  #activeBindingId?: string;
  #activeBinding?: AgentBindingCreatedRecord;
  #usageDirty = false;
  readonly #sessionContexts = new Map<
    AgentSession,
    { location: ConversationLocation | null }
  >();
  readonly #cancelledSessions = new WeakSet<AgentSession>();
  readonly #createConversation?: () => CreateConversationInput;
  readonly #onLocationChange?: (location: ConversationLocation | null) => void;
  readonly #selectRuntime?: (request: AgentRequest) => Promise<AgentRuntime>;
  readonly #appToolBridge?: AppToolBridgeCoordinator;
  readonly #unsubscribeAppToolEvents?: () => void;
  readonly #skills?: SkillRegistry;
  readonly #skillSnapshots: SkillSnapshotStore;
  readonly #slashRouter?: SlashCommandRouter;
  readonly #appToolHost?: AppToolHost;
  readonly #skillContext?: () => SkillDiscoveryContext;
  #refreshSkills = false;

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
      createConversation?: () => CreateConversationInput;
      onLocationChange?: (location: ConversationLocation | null) => void;
      selectRuntime?: (request: AgentRequest) => Promise<AgentRuntime>;
      appToolBridge?: AppToolBridgeCoordinator;
      skills?: SkillRegistry;
      skillSnapshots?: SkillSnapshotStore;
      slashRouter?: SlashCommandRouter;
      appToolHost?: AppToolHost;
      skillContext?: () => SkillDiscoveryContext;
    } = {},
  ) {
    this.runtime = runtime;
    this.unavailableReason = unavailableReason;
    this.mcpServers = mcpServers;
    this.store = options.store;
    this.repository = options.repository;
    this.location = options.location ?? null;
    this.#createConversation = options.createConversation;
    this.#onLocationChange = options.onLocationChange;
    this.#selectRuntime = options.selectRuntime;
    this.#appToolBridge = options.appToolBridge;
    this.#skills = options.skills;
    this.#skillSnapshots = options.skillSnapshots ?? new SkillSnapshotStore();
    this.#slashRouter = options.slashRouter;
    this.#appToolHost = options.appToolHost;
    this.#skillContext = options.skillContext;
    this.#unsubscribeAppToolEvents = options.appToolBridge?.subscribe((event) => {
      void this.#consumeAppToolEvent(event);
    });
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
        this.error = error instanceof Error ? error.message : String(error);
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
    this.#onLocationChange?.(this.location);
    try {
      await this.#restoreConversation();
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
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
    if (this.repository && input) {
      const created = await this.repository.create(input);
      this.location = created.location;
      this.conversationStatus = created.metadata.status;
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
    this.#onLocationChange?.(null);
  }

  async #restoreConversation(): Promise<void> {
    if (!this.repository || !this.location) return;
    const snapshot = await this.repository.read(this.location);
    this.conversationStatus = snapshot.metadata.status;
    this.items = projectTranscriptToChatItems(snapshot.transcript);
    const activeBinding = snapshot.agents.find(
      (record): record is AgentBindingCreatedRecord =>
        record.type === "binding.created" &&
        record.id === snapshot.metadata.activeAgentBindingId,
    );
    this.#activeBinding = activeBinding;
    this.#activeBindingId = activeBinding?.id;
    this.bindings = snapshot.agents.filter(
      (record): record is AgentBindingCreatedRecord =>
        record.type === "binding.created",
    );
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
      this.session = await this.runtime.resume(
        activeBinding.nativeSessionId,
        { ...this.#sessionRequest, appToolSession },
      );
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
    await this.#syncSlashCatalog();
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
    this.busy = true;
    if (this.repository) await this.#ensureConversation();
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
    try {
      await this.#prepareSession(effectiveRequest);
      if (this.#activeBindingId) {
        this.items = this.items.map((item) =>
          item.id === userItem.id
            ? { ...item, agentBindingId: this.#activeBindingId }
            : item,
        );
      }
      if (this.repository && this.location) {
        await this.#appendDurableItems(
          this.location,
          [userItem],
          this.#activeBindingId,
        );
      } else {
        await this.#persist();
      }
      if (!this.session) {
        if (this.error) return;
        throw new Error("Agent session did not start.");
      }
      await this.session.send(text);
      if (!this.repository) await this.#persist();
    } catch (error) {
      const failedSession = this.session;
      const failedBindingId = this.#activeBindingId;
      this.error = error instanceof Error ? error.message : String(error);
      this.items = applyAgentEventToChatItems(this.items, {
        type: "error",
        error: error instanceof Error ? error : new Error(String(error)),
      });
      this.session = null;
      this.busy = false;
      await this.#closeAppToolBinding(failedBindingId);
      await failedSession?.close().catch(() => undefined);
      if (this.repository && this.location) {
        await this.#appendDurableItems(
          this.location,
          [userItem, this.items.at(-1)!],
          this.#activeBindingId,
        );
      } else {
        await this.#persist();
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
    const session = this.session;
    if (session) this.#cancelledSessions.add(session);
    this.busy = false;
    this.items = interruptPendingInteractions(this.items);
    void session?.cancel?.().catch(() => undefined);
    await this.#persist(true);
  }

  async cancelAndSwitch(request: Omit<AgentRequest, "prompt">): Promise<void> {
    if (this.busy) await this.cancel();
    this.error = null;
    await this.#prepareSession({ ...this.request, ...request });
  }

  async close(): Promise<void> {
    const interrupted = this.busy;
    if (interrupted) await this.session?.cancel?.().catch(() => undefined);
    this.busy = false;
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
    const context = {
      location: this.location ? { ...this.location } : null,
    };
    this.#sessionContexts.set(session, context);
    let traceItems: AiChatItem[] = [];
    let latestUsage: AgentUsage | null = null;
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
        if (this.repository && context.location) {
          await this.#appendDurableItems(
            context.location,
            traceItems,
            agentBindingId,
            event.type !== "completed" && event.type !== "error",
            false,
            agentBindingId,
          );
        } else {
          await this.#persist(false, agentBindingId);
        }
        if (
          (event.type === "completed" || event.type === "error") &&
          latestUsage &&
          agentBindingId &&
          context.location
        ) {
          await this.#appendUsage(
            context.location,
            agentBindingId,
            latestUsage,
          );
          latestUsage = null;
        }
        if (
          activeSession &&
          (event.type === "completed" || event.type === "error")
        ) {
          this.busy = false;
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
      await session.close().catch(() => undefined);
      await this.#closeAppToolBinding(agentBindingId);
    } finally {
      if (this.session === session) this.busy = false;
      if (this.repository && context.location) {
        await this.#appendDurableItems(
          context.location,
          traceItems,
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
      } else {
        await this.#persist(false, agentBindingId);
      }
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
    resolution: NonNullable<
      ReturnType<SlashCommandRouter["resolve"]>
    >,
    request: Omit<AgentRequest, "prompt">,
  ): Promise<void> {
    if (!this.#slashRouter || this.busy) return;
    this.error = null;
    if (this.repository) await this.#ensureConversation();
    const discovery = this.#skillContext?.() ?? {
      scopeDir: this.location?.scopeDir ?? "",
    };
    const result = await this.#slashRouter.execute(resolution, {
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
      if (result.notice === "skills" || result.notice === "tools") {
        await this.#prepareSession(request);
      }
      if (result.notice === "skills") {
        const names =
          this.#skillSnapshots
            .get(this.#activeBindingId ?? "")
            ?.skills.map((skill) => skill.name)
            .join(", ") || "No skills are available.";
        this.#appendLocalNotice(names);
        await this.#persistCommandNotice();
        return;
      }
      if (result.notice === "tools") {
        const names =
          this.#appToolHost
            ?.getSession(this.#activeBindingId ?? "")
            ?.tools.map((tool) => tool.name)
            .join(", ") || "No application tools are available.";
        this.#appendLocalNotice(names);
        await this.#persistCommandNotice();
        return;
      }
      this.#appendLocalNotice(`/${result.notice}`);
      return;
    }
    if (result.kind === "tool") {
      await this.#prepareSession(request);
      this.#ensureLocalAppToolSession();
      if (!this.#appToolHost || !this.#activeBindingId) {
        this.error = "Application tools are unavailable for this command.";
        return;
      }
      const callId = `slash-tool-${crypto.randomUUID()}`;
      await this.#appToolHost.invoke(this.#activeBindingId, {
        runId: callId,
        toolCallId: callId,
        name: result.tool,
        input: result.input,
      });
      await this.#recordCommandItem(
        result.tool,
        "skill",
        JSON.stringify(result.input),
      );
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
      await this.#recordCommandItem(result.name, "native-agent", result.arguments);
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
      await this.session?.send(activation.arguments?.trim() || activation.skillName);
    } finally {
      this.busy = false;
    }
  }

  #appendLocalNotice(text: string): void {
    this.items = [
      ...this.items,
      {
        id: `notice-${crypto.randomUUID()}`,
        type: "status",
        text,
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
      await this.#appendDurableItems(this.location, [item], this.#activeBindingId);
    }
  }

  async #persistCommandNotice(): Promise<void> {
    const item = this.items.at(-1);
    if (this.repository && this.location && item) {
      await this.#appendDurableItems(this.location, [item], this.#activeBindingId);
    }
  }

  async #syncSlashCatalog(): Promise<void> {
    if (!this.#slashRouter || !this.#skills) return;
    const existing = this.#activeBindingId
      ? this.#skillSnapshots.get(this.#activeBindingId)
      : undefined;
    if (existing) {
      this.#slashRouter.catalog.rebuildSkillCommands(existing);
      return;
    }
    const snapshot = await this.#skills.snapshot(this.#discoveryContext());
    this.#slashRouter.catalog.rebuildSkillCommands(snapshot);
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

  async #prepareSkillSnapshot(
    bindingId: string,
    scopeDir: string,
  ): Promise<import("../skills/types").SkillSnapshot | undefined> {
    if (!this.#skills) return undefined;
    const existing = this.#skillSnapshots.get(bindingId);
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

  async #ensureConversation(): Promise<void> {
    if (!this.repository || this.location) return;
    const input = this.#createConversation?.() ?? { scopeDir: "" };
    const created = await this.repository.create(input);
    this.location = created.location;
    this.conversationStatus = created.metadata.status;
    this.#onLocationChange?.(this.location);
  }

  async #recordNewBinding(
    bindingId: string,
    session: AgentSession,
    request: Omit<AgentRequest, "prompt">,
    runtime = this.runtime,
    handoff?: ConversationContextHandoff,
    replacesBindingId = this.#activeBindingId,
  ): Promise<void> {
    if (!this.repository || !this.location) return;
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
    await this.repository.appendAgentRecords(this.location, [binding]);
    if (previousBindingId) {
      await this.repository.appendTranscript(this.location, [
        {
          schemaVersion: CONVERSATION_SCHEMA_VERSION,
          id: `switch-${crypto.randomUUID()}`,
          type: "agent.switch",
          createdAt: binding.createdAt,
          agentBindingId: binding.id,
          fromBindingId: previousBindingId,
          toBindingId: binding.id,
          handoffThroughEntryId: handoff?.throughEntryId,
        },
      ]);
    }
    this.#activeBinding = binding;
    this.#activeBindingId = binding.id;
    this.bindings = [...this.bindings, binding];
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

  async #closeAppToolBinding(
    bindingId = this.#activeBindingId,
  ): Promise<void> {
    if (!bindingId) return;
    await this.#appToolBridge?.closeBinding(bindingId);
    if (!this.#appToolBridge) {
      this.#appToolHost?.closeBinding(bindingId);
    }
  }

  async #consumeAppToolEvent({
    bindingId,
    event,
  }: AppToolBridgeEvent): Promise<void> {
    if (bindingId !== this.#activeBindingId) return;
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
      ? this.items.find((candidate) => candidate.id === itemId)
      : undefined;
    if (this.repository && this.location && item) {
      await this.#appendDurableItems(this.location, [item], bindingId);
    } else if (!this.repository) {
      await this.#persist(false, bindingId);
    }
  }

  #bindingMatchesRequest(
    binding: AgentBindingCreatedRecord,
    request: Omit<AgentRequest, "prompt">,
    runtime = this.runtime,
  ): boolean {
    return (
      binding.runtime === runtime.id &&
      binding.agent === request.agent &&
      binding.model?.provider === request.model?.provider &&
      binding.model?.model === request.model?.model &&
      binding.thinking === request.thinking
    );
  }

  async #prepareSession(request: Omit<AgentRequest, "prompt">): Promise<void> {
    const targetRuntime = this.#selectRuntime
      ? await this.#selectRuntime({
          ...request,
          prompt: "",
          mcpServers: request.mcpServers ?? this.mcpServers,
        })
      : this.runtime;
    if (
      this.session &&
      this.#activeBinding &&
      !this.#refreshSkills &&
      !(request.skillActivations && request.skillActivations.length > 0) &&
      this.#bindingMatchesRequest(this.#activeBinding, request, targetRuntime)
    ) {
      return;
    }

    const previousBindingId = this.#activeBindingId;
    await this.#closeAppToolBinding(previousBindingId);
    if (this.session) {
      await this.session.close().catch(() => undefined);
      this.session = null;
    }
    this.#sessionRequest = request;

    let exactBinding: AgentBindingCreatedRecord | undefined;
    let handoff: ConversationContextHandoff | undefined;
    let snapshot:
      | Awaited<ReturnType<ConversationRepository["read"]>>
      | undefined;
    if (this.repository && this.location) {
      snapshot = await this.repository.read(this.location);
      exactBinding = snapshot.agents.find(
        (record): record is AgentBindingCreatedRecord =>
          record.type === "binding.created" &&
          record.id === previousBindingId &&
          this.#bindingMatchesRequest(record, request, targetRuntime),
      );
      if (
        !this.#refreshSkills &&
        exactBinding?.nativeSessionId &&
        targetRuntime.capabilities().resume &&
        targetRuntime.resume
      ) {
        const appToolSession = await this.#prepareAppToolSession(
          exactBinding.id,
          targetRuntime,
          snapshot.location,
          snapshot.metadata.launchContext?.notePath,
        );
        try {
          const skillSnapshot = await this.#prepareSkillSnapshot(
            exactBinding.id,
            snapshot.location.scopeDir,
          );
          const resumed = await targetRuntime.resume(
            exactBinding.nativeSessionId,
            { ...request, appToolSession, skillSnapshot },
          );
          if (previousBindingId !== exactBinding.id) {
            const createdAt = new Date().toISOString();
            await this.repository.activateBinding(
              this.location,
              exactBinding.id,
              {
                schemaVersion: CONVERSATION_SCHEMA_VERSION,
                id: `switch-${crypto.randomUUID()}`,
                type: "agent.switch",
                createdAt,
                agentBindingId: exactBinding.id,
                fromBindingId: previousBindingId,
                toBindingId: exactBinding.id,
              },
            );
          }
          this.runtime = targetRuntime;
          this.session = resumed;
          this.#activeBinding = exactBinding;
          this.#activeBindingId = exactBinding.id;
          void this.#consume(resumed, exactBinding.id);
          return;
        } catch {
          await this.#closeAppToolBinding(exactBinding.id);
          // Native state is disposable. A replacement binding is prepared
          // below from deterministic local handoff context.
        }
      }
      if (this.#activeBindingId) {
        handoff = buildConversationContextHandoff(snapshot.transcript);
      }
    }

    const bindingId = `binding-${crypto.randomUUID()}`;
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
        ...(handoff
          ? {
              contextHandoff: {
                text: handoff.text,
                throughEntryId: handoff.throughEntryId,
              },
            }
          : {}),
        ...(skillSnapshot
          ? { availableSkillsManifest: buildAvailableSkillsManifest(skillSnapshot) }
          : {}),
        ...(appToolSession?.tools.length
          ? {
              availableAppTools: appToolSession.tools.map((tool) => tool.name),
            }
          : {}),
      },
    };
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
    try {
      if (this.repository) {
        await this.#recordNewBinding(
          bindingId,
          started,
          request,
          targetRuntime,
          handoff,
          exactBinding?.id ?? this.#activeBindingId,
        );
      } else {
        this.#activeBindingId = bindingId;
        this.#activeBinding = {
          schemaVersion: CONVERSATION_SCHEMA_VERSION,
          id: bindingId,
          type: "binding.created",
          createdAt: new Date().toISOString(),
          runtime: targetRuntime.id,
          agent: request.agent,
          model: request.model ? { ...request.model } : undefined,
          thinking: request.thinking,
          nativeSessionId: started.id,
        };
        this.bindings = [...this.bindings, this.#activeBinding];
      }
    } catch (error) {
      await this.#closeAppToolBinding(bindingId);
      await started.close().catch(() => undefined);
      throw error;
    }
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

function readAttachmentPaths(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function namespaceChatItems(
  items: AiChatItem[],
  namespace: string,
): AiChatItem[] {
  return items.map((item) => ({ ...item, id: `${namespace}:${item.id}` }));
}
