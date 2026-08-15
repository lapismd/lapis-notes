import type {
  AgentRequest,
  AgentRuntime,
  AgentSession,
  ToolContribution,
} from "../core/types";
import type { AgentSessionStore, StoredAgentSession } from "../sessions/session-store";
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
  markApprovalResponse,
} from "./chat-trace";

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
    } = {},
  ) {
    this.runtime = runtime;
    this.unavailableReason = unavailableReason;
    this.tools = tools;
    this.store = options.store;
    this.workspace = options.workspace;
    this.sessionId = options.sessionId ?? chatSessionId(options.workspace);
  }

  async restore(): Promise<void> {
    const stored = await loadStoredChatSession(this.store, this.sessionId);
    if (!stored) return;
    this.#createdAt = stored.createdAt;
    let resumed = false;
    if (this.runtime.capabilities().resume && this.runtime.resume) {
      try {
        this.session = await this.runtime.resume(stored.runtimeSessionId);
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
    try {
      if (!this.session) {
        this.session = await this.runtime.start({
          ...request,
          prompt: "",
          tools: request.tools ?? this.tools,
          metadata: {
            ...request.metadata,
            ...(attachments.length > 0 ? { attachments } : {}),
          },
        });
        void this.#consume(this.session);
      }
      await this.session.send(text);
      await this.#persist();
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
      this.busy = false;
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
        }
        await this.#persist();
      }
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
