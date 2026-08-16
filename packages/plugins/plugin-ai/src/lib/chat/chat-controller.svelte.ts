import type {
  AgentRequest,
  AgentRuntime,
  AgentSession,
  AgentUsage,
  ToolContribution,
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

export class AiChatController {
  items = $state.raw<AiChatItem[]>([]);
  busy = $state(false);
  error = $state<string | null>(null);
  usage = $state<AgentUsage | null>(null);
  bindings = $state.raw<AgentBindingCreatedRecord[]>([]);
  location = $state.raw<ConversationLocation | null>(null);
  session: AgentSession | null = null;
  runtime: AgentRuntime;
  readonly unavailableReason: string | null;
  readonly tools: ToolContribution[];
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
  readonly #createConversation?: () => CreateConversationInput;
  readonly #onLocationChange?: (location: ConversationLocation | null) => void;
  readonly #selectRuntime?: (request: AgentRequest) => Promise<AgentRuntime>;

  constructor(
    runtime: AgentRuntime,
    unavailableReason: string | null = null,
    tools: ToolContribution[] = [],
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
    } = {},
  ) {
    this.runtime = runtime;
    this.unavailableReason = unavailableReason;
    this.tools = tools;
    this.store = options.store;
    this.repository = options.repository;
    this.location = options.location ?? null;
    this.#createConversation = options.createConversation;
    this.#onLocationChange = options.onLocationChange;
    this.#selectRuntime = options.selectRuntime;
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
    await this.session?.close().catch(() => undefined);
    this.session = null;
    this.busy = false;
    this.error = null;
    this.location = { ...location };
    this.#onLocationChange?.(this.location);
    try {
      await this.#restoreConversation();
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
    }
  }

  async newConversation(input?: CreateConversationInput): Promise<void> {
    if (!this.repository) return;
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
    if (input) {
      const created = await this.repository.create(input);
      this.location = created.location;
    }
    this.#onLocationChange?.(this.location);
  }

  async archiveCurrent(archived = true): Promise<void> {
    if (!this.repository || !this.location) return;
    await this.repository.archive(this.location, archived);
  }

  relocateScope(oldPath: string, newPath: string): void {
    if (this.location) {
      const relocated = relocateConversationLocation(
        this.location,
        oldPath,
        newPath,
      );
      if (relocated) {
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
    this.#onLocationChange?.(null);
  }

  async #restoreConversation(): Promise<void> {
    if (!this.repository || !this.location) return;
    const snapshot = await this.repository.read(this.location);
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
      this.session = await this.runtime.resume(
        activeBinding.nativeSessionId,
        this.#sessionRequest,
      );
      void this.#consume(this.session, activeBinding.id);
    } catch (error) {
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
    const text = prompt.trim();
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
      this.error = error instanceof Error ? error.message : String(error);
      this.items = applyAgentEventToChatItems(this.items, {
        type: "error",
        error: error instanceof Error ? error : new Error(String(error)),
      });
      this.session = null;
      this.busy = false;
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
    await this.session?.cancel?.();
    this.busy = false;
    this.items = interruptPendingInteractions(this.items);
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
    await this.session?.close();
    this.session = null;
    this.busy = false;
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
        if (event.type === "usage") {
          latestUsage = { ...event.usage };
          if (this.session === session) this.usage = latestUsage;
          continue;
        }
        if (event.type === "status" && !isVisibleAgentStatus(event.status)) {
          continue;
        }
        traceItems = applyAgentEventToChatItems(traceItems, event);
        const activeSession = this.session === session;
        if (activeSession) {
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

  async #ensureConversation(): Promise<void> {
    if (!this.repository || this.location) return;
    const input = this.#createConversation?.() ?? { scopeDir: "" };
    const created = await this.repository.create(input);
    this.location = created.location;
    this.#onLocationChange?.(this.location);
  }

  async #recordNewBinding(
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
      id: `binding-${crypto.randomUUID()}`,
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
          tools: request.tools ?? this.tools,
        })
      : this.runtime;
    if (
      this.session &&
      this.#activeBinding &&
      this.#bindingMatchesRequest(this.#activeBinding, request, targetRuntime)
    ) {
      return;
    }

    if (this.session) {
      await this.session.close().catch(() => undefined);
      this.session = null;
    }
    this.#sessionRequest = request;

    let exactBinding: AgentBindingCreatedRecord | undefined;
    let handoff: ConversationContextHandoff | undefined;
    if (this.repository && this.location) {
      const snapshot = await this.repository.read(this.location);
      exactBinding = [...snapshot.agents]
        .reverse()
        .find(
          (record): record is AgentBindingCreatedRecord =>
            record.type === "binding.created" &&
            this.#bindingMatchesRequest(record, request, targetRuntime),
        );
      if (
        exactBinding?.nativeSessionId &&
        targetRuntime.capabilities().resume &&
        targetRuntime.resume
      ) {
        try {
          const resumed = await targetRuntime.resume(
            exactBinding.nativeSessionId,
            request,
          );
          const previousBindingId = this.#activeBindingId;
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
          // Native state is disposable. A replacement binding is prepared
          // below from deterministic local handoff context.
        }
      }
      if (this.#activeBindingId) {
        handoff = buildConversationContextHandoff(snapshot.transcript);
      }
    }

    const preparedRequest: Omit<AgentRequest, "prompt"> = handoff
      ? {
          ...request,
          metadata: {
            ...request.metadata,
            contextHandoff: {
              text: handoff.text,
              throughEntryId: handoff.throughEntryId,
            },
          },
        }
      : request;
    const started = await targetRuntime.start({
      ...preparedRequest,
      prompt: "",
      tools: preparedRequest.tools ?? this.tools,
    });
    try {
      if (this.repository) {
        await this.#recordNewBinding(
          started,
          request,
          targetRuntime,
          handoff,
          exactBinding?.id ?? this.#activeBindingId,
        );
      }
    } catch (error) {
      await started.close().catch(() => undefined);
      throw error;
    }
    this.runtime = targetRuntime;
    this.session = started;
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
