import type {
  AgentRequest,
  AgentRuntime,
  AgentSession,
  ToolContribution,
} from "../core/types";
import type {
  AgentSessionStore,
  StoredAgentSession,
} from "../sessions/session-store";
import { extractMentionPaths, mergeAttachmentPaths } from "./chat-mentions";
import {
  applyStoredSessionResumePolicy,
  chatSessionId,
  loadStoredChatSession,
  snapshotStoredChatSession,
} from "./chat-session";
import type { AiChatItem } from "./chat-items";
import { applyAgentEventToChatItems, markApprovalResponse } from "./chat-trace";

export class AiChatController {
  items = $state.raw<AiChatItem[]>([]);
  busy = $state(false);
  error = $state<string | null>(null);
  session: AgentSession | null = null;
  readonly runtime: AgentRuntime;
  readonly unavailableReason: string | null;
  readonly tools: ToolContribution[];
  readonly store?: AgentSessionStore;
  readonly sessionId: string;
  readonly workspace?: string;
  readonly request: Omit<AgentRequest, "prompt">;
  #sessionRequest: Omit<AgentRequest, "prompt">;
  #createdAt?: string;
  #persistQueue: Promise<void> = Promise.resolve();

  constructor(
    runtime: AgentRuntime,
    unavailableReason: string | null = null,
    tools: ToolContribution[] = [],
    options: {
      store?: AgentSessionStore;
      sessionId?: string;
      workspace?: string;
      request?: Omit<AgentRequest, "prompt">;
    } = {},
  ) {
    this.runtime = runtime;
    this.unavailableReason = unavailableReason;
    this.tools = tools;
    this.store = options.store;
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
    let resumed = false;
    if (this.runtime.capabilities().resume && this.runtime.resume) {
      try {
        this.session = await this.runtime.resume(
          stored.runtimeSessionId,
          this.#sessionRequest,
        );
        void this.#consume(this.session);
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
    await this.#persist(restored.interrupted);
  }

  async submit(
    prompt: string,
    request: Omit<AgentRequest, "prompt"> = {},
  ): Promise<void> {
    const text = prompt.trim();
    if (!text || this.busy) return;
    this.error = null;
    this.busy = true;
    this.items = [
      ...this.items,
      {
        id: `user-${this.items.length + 1}`,
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
      if (!this.session) {
        this.#sessionRequest = effectiveRequest;
        this.session = await this.runtime.start({
          ...effectiveRequest,
          prompt: "",
          tools: effectiveRequest.tools ?? this.tools,
        });
        void this.#consume(this.session);
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
    await this.#persist();
    await this.session.respondToApproval(requestId, optionId);
    await this.#persist();
  }

  async cancel(): Promise<void> {
    await this.session?.cancel?.();
    this.busy = false;
    await this.#persist(true);
  }

  async close(): Promise<void> {
    await this.#persist();
    await this.session?.close();
    this.session = null;
    this.busy = false;
  }

  async #consume(session: AgentSession): Promise<void> {
    try {
      for await (const event of session.events()) {
        this.items = applyAgentEventToChatItems(this.items, event);
        if (event.type === "completed" || event.type === "error") {
          this.busy = false;
          if (event.type === "error" && this.session === session) {
            this.error = event.error.message;
            this.session = null;
          }
        }
        await this.#persist();
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
      if (this.session === session) this.session = null;
      await session.close().catch(() => undefined);
    } finally {
      this.busy = false;
      await this.#persist();
    }
  }

  async #persist(interrupted = false): Promise<void> {
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
