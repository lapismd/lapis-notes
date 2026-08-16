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
  location = $state.raw<ConversationLocation | null>(null);
  session: AgentSession | null = null;
  readonly runtime: AgentRuntime;
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
  readonly #createConversation?: () => CreateConversationInput;
  readonly #onLocationChange?: (location: ConversationLocation | null) => void;

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
    if (!this.location) return;
    const relocated = relocateConversationLocation(
      this.location,
      oldPath,
      newPath,
    );
    if (!relocated) return;
    this.location = relocated;
    this.#onLocationChange?.(relocated);
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
    this.items = [
      ...this.items,
      {
        id: this.repository
          ? `user-${crypto.randomUUID()}`
          : `user-${this.items.length + 1}`,
        type: "message",
        role: "user",
        text,
        createdAt: new Date().toISOString(),
      },
    ];
    await this.#persist();
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
      if (
        this.repository &&
        this.session &&
        this.#activeBinding &&
        !this.#bindingMatchesRequest(this.#activeBinding, effectiveRequest)
      ) {
        await this.session.close().catch(() => undefined);
        this.session = null;
      }
      if (!this.session) {
        this.#sessionRequest = effectiveRequest;
        this.session = await this.runtime.start({
          ...effectiveRequest,
          prompt: "",
          tools: effectiveRequest.tools ?? this.tools,
        });
        if (this.repository) {
          await this.#recordNewBinding(this.session, effectiveRequest);
        }
        void this.#consume(this.session, this.#activeBindingId);
      }
      await this.session.send(text);
      await this.#persist();
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
      await this.#persist();
    }
  }

  async respondToApproval(requestId: string, optionId: string): Promise<void> {
    if (!this.session) return;
    this.items = markApprovalResponse(this.items, requestId, optionId);
    await this.session.respondToApproval(requestId, optionId);
    await this.#persist();
  }

  async respondToQuestion(
    requestId: string,
    answers: UserInputAnswers,
  ): Promise<void> {
    if (!this.session?.respondToQuestion) {
      throw new Error("The active runtime cannot answer agent questions.");
    }
    this.items = markQuestionResponse(this.items, requestId);
    await this.#persist();
    await this.session.respondToQuestion(requestId, answers);
    await this.#persist();
  }

  async cancel(): Promise<void> {
    await this.session?.cancel?.();
    this.busy = false;
    this.items = interruptPendingInteractions(this.items);
    await this.#persist(true);
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
    try {
      for await (const event of session.events()) {
        if (event.type === "usage") {
          this.usage = { ...event.usage };
          this.#usageDirty = true;
          continue;
        }
        if (event.type === "status" && !isVisibleAgentStatus(event.status)) {
          continue;
        }
        this.items = applyAgentEventToChatItems(this.items, event);
        if (event.type === "completed" || event.type === "error") {
          if (this.session === session) this.busy = false;
          if (event.type === "error" && this.session === session) {
            this.error = event.error.message;
            this.session = null;
          }
        }
        await this.#persist(false, agentBindingId);
        if (event.type === "error") {
          await session.close().catch(() => undefined);
          break;
        }
      }
    } catch (error) {
      const normalized =
        error instanceof Error ? error : new Error(String(error));
      this.error = normalized.message;
      this.items = applyAgentEventToChatItems(this.items, {
        type: "error",
        error: normalized,
      });
      if (this.session === session) {
        this.busy = false;
        this.session = null;
      }
      await session.close().catch(() => undefined);
    } finally {
      if (this.session === session) this.busy = false;
      await this.#persist(false, agentBindingId);
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
  ): Promise<void> {
    if (!this.repository || !this.location) return;
    const previousBindingId = this.#activeBindingId;
    const binding: AgentBindingCreatedRecord = {
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      id: `binding-${crypto.randomUUID()}`,
      type: "binding.created",
      createdAt: new Date().toISOString(),
      runtime: this.runtime.id,
      agent: request.agent,
      model: request.model ? { ...request.model } : undefined,
      thinking: request.thinking,
      nativeSessionId: session.id,
      replacesBindingId: previousBindingId,
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
        },
      ]);
    }
    this.#activeBinding = binding;
    this.#activeBindingId = binding.id;
  }

  #bindingMatchesRequest(
    binding: AgentBindingCreatedRecord,
    request: Omit<AgentRequest, "prompt">,
  ): boolean {
    return (
      binding.runtime === this.runtime.id &&
      binding.agent === request.agent &&
      binding.model?.provider === request.model?.provider &&
      binding.model?.model === request.model?.model &&
      binding.thinking === request.thinking
    );
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
        const entries = projectChatItemsToTranscript(items, {
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
          for (const item of items) {
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
        if (!busy && this.usage && this.#usageDirty && agentBindingId) {
          await this.repository.appendAgentRecords(location, [
            {
              schemaVersion: CONVERSATION_SCHEMA_VERSION,
              id: `usage-${crypto.randomUUID()}`,
              type: "usage.updated",
              createdAt: new Date().toISOString(),
              agentBindingId,
              usage: { ...this.usage },
            },
          ]);
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
