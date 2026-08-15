import { AsyncEventQueue } from "../../core/event-queue";
import {
  DEFAULT_APPROVAL_OPTIONS,
  type AgentCapabilities,
  type AgentEvent,
  type AgentRequest,
  type AgentRuntime,
  type AgentSession,
  type ApprovalRequest,
} from "../../core/types";

export type FakeAgentRuntimeOptions = {
  id?: string;
  requireApproval?: boolean;
  resumeSupported?: boolean;
};

export class FakeAgentSession implements AgentSession {
  readonly id: string;
  readonly prompts: string[] = [];
  cancelled = false;
  closed = false;
  readonly #events = new AsyncEventQueue<AgentEvent>();
  readonly #pending = new Map<
    string,
    { resolve(optionId: string): void; reject(error: Error): void }
  >();
  readonly #requireApproval: boolean;

  constructor(id: string, requireApproval: boolean) {
    this.id = id;
    this.#requireApproval = requireApproval;
  }

  events(): AsyncIterable<AgentEvent> {
    return this.#events;
  }

  async send(input: string): Promise<void> {
    if (this.closed) throw new Error("Fake session is closed.");
    this.prompts.push(input);
    this.#events.push({ type: "text", text: input });
    if (this.#requireApproval) {
      const request = createFakeApprovalRequest(`approval-${this.prompts.length}`);
      this.#events.push({ type: "permission.request", request });
      const optionId = await new Promise<string>((resolve, reject) => {
        this.#pending.set(request.id, { resolve, reject });
      });
      this.#events.push({
        type: "status",
        status: `approval:${request.id}:${optionId}`,
      });
    }
    this.#events.push({ type: "completed", result: { prompt: input } });
  }

  async respondToApproval(requestId: string, optionId: string): Promise<void> {
    const pending = this.#pending.get(requestId);
    if (!pending) {
      throw new Error(`Unknown approval request: ${requestId}`);
    }
    this.#pending.delete(requestId);
    pending.resolve(optionId);
  }

  async cancel(): Promise<void> {
    this.cancelled = true;
    for (const [id, pending] of this.#pending) {
      this.#pending.delete(id);
      pending.reject(new Error("Session cancelled."));
    }
    this.#events.push({ type: "status", status: "cancelled" });
  }

  async close(): Promise<void> {
    this.closed = true;
    for (const [id, pending] of this.#pending) {
      this.#pending.delete(id);
      pending.reject(new Error("Session closed."));
    }
    this.#events.close();
  }
}

export class FakeAgentRuntime implements AgentRuntime {
  readonly id: string;
  readonly sessions: FakeAgentSession[] = [];
  readonly #requireApproval: boolean;
  readonly #resumeSupported: boolean;

  constructor(options: FakeAgentRuntimeOptions = {}) {
    this.id = options.id ?? "fake";
    this.#requireApproval = options.requireApproval ?? false;
    this.#resumeSupported = options.resumeSupported ?? true;
  }

  capabilities(): AgentCapabilities {
    return {
      sessions: true,
      resume: this.#resumeSupported,
      cancel: true,
      steer: false,
      modelSelection: true,
      nativeTools: false,
      mcpTools: true,
      approvals: {
        supported: true,
        interactive: true,
        persistentDecisions: true,
        granularPermissions: false,
        policyAmendments: false,
      },
    };
  }

  async supports(request: AgentRequest): Promise<boolean> {
    if (request.requirePolicyAmendments) return false;
    return true;
  }

  async start(_request: AgentRequest): Promise<AgentSession> {
    const session = new FakeAgentSession(
      `fake-${this.sessions.length + 1}`,
      this.#requireApproval || Boolean(_request.requireApprovals),
    );
    this.sessions.push(session);
    return session;
  }

  async resume(sessionId: string): Promise<AgentSession> {
    if (!this.#resumeSupported) {
      throw new Error("Fake runtime does not support resume.");
    }
    const existing = this.sessions.find((session) => session.id === sessionId);
    if (existing && !existing.closed) return existing;
    throw new Error(`Unknown fake session: ${sessionId}`);
  }
}

function createFakeApprovalRequest(id: string): ApprovalRequest {
  return {
    id,
    kind: "execute",
    title: "Allow the fake agent to continue?",
    tool: { name: "fake.echo", input: { id } },
    options: DEFAULT_APPROVAL_OPTIONS,
  };
}
