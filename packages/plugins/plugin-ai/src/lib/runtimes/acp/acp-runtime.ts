import { AsyncEventQueue } from "../../core/event-queue";
import {
  ACP_APPROVAL_CAPABILITIES,
  type AgentCapabilities,
  type AgentEvent,
  type AgentRequest,
  type AgentRuntime,
  type AgentSession,
} from "../../core/types";
import {
  mapAcpPermissionRequest,
  mapAcpRuntimeEvent,
  mapApprovalOptionToAcpDecision,
  type AcpPermissionDecision,
  type AcpPermissionRequestLike,
  type AcpRuntimeEventLike,
} from "./acp-event-mapper";

export type AcpBackendSession = {
  id: string;
  events(): AsyncIterable<AcpRuntimeEventLike>;
  prompt(text: string): Promise<void>;
  cancel(): Promise<void>;
  close(): Promise<void>;
};

export type AcpRuntimeBackend = {
  available(): Promise<boolean>;
  start(input: {
    request: AgentRequest;
    onPermissionRequest(
      request: AcpPermissionRequestLike,
    ): Promise<AcpPermissionDecision>;
  }): Promise<AcpBackendSession>;
  resume?(input: {
    sessionId: string;
    request?: Omit<AgentRequest, "prompt">;
    onPermissionRequest(
      request: AcpPermissionRequestLike,
    ): Promise<AcpPermissionDecision>;
  }): Promise<AcpBackendSession>;
};

export class AcpAgentSession implements AgentSession {
  readonly id: string;
  readonly #backend: AcpBackendSession;
  readonly #events = new AsyncEventQueue<AgentEvent>();
  readonly #pending = new Map<
    string,
    { resolve(optionId: string): void; reject(error: Error): void }
  >();
  #consume: Promise<void> | null = null;

  constructor(backend: AcpBackendSession) {
    this.id = backend.id;
    this.#backend = backend;
    this.#consume = this.#pump();
  }

  events(): AsyncIterable<AgentEvent> {
    return this.#events;
  }

  async send(input: string): Promise<void> {
    await this.#backend.prompt(input);
  }

  async respondToApproval(requestId: string, optionId: string): Promise<void> {
    const pending = this.#pending.get(requestId);
    if (!pending) throw new Error(`Unknown approval request: ${requestId}`);
    this.#pending.delete(requestId);
    pending.resolve(optionId);
  }

  async cancel(): Promise<void> {
    await this.#backend.cancel();
  }

  async close(): Promise<void> {
    for (const [id, pending] of this.#pending) {
      this.#pending.delete(id);
      pending.reject(new Error("Session closed."));
    }
    await this.#backend.close();
    await this.#consume;
    this.#events.close();
  }

  async handlePermissionRequest(
    request: AcpPermissionRequestLike,
  ): Promise<AcpPermissionDecision> {
    const mapped = mapAcpPermissionRequest(request);
    this.#events.push({ type: "permission.request", request: mapped });
    return new Promise<AcpPermissionDecision>((resolve, reject) => {
      this.#pending.set(mapped.id, {
        resolve: (optionId) =>
          resolve(mapApprovalOptionToAcpDecision(optionId)),
        reject,
      });
    });
  }

  async #pump(): Promise<void> {
    try {
      for await (const event of this.#backend.events()) {
        const mapped = mapAcpRuntimeEvent(event);
        if (mapped) this.#events.push(mapped);
      }
    } catch (error) {
      this.#events.push({
        type: "error",
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }
}

export class AcpAgentRuntime implements AgentRuntime {
  readonly id = "acp";
  readonly #backend: AcpRuntimeBackend;

  constructor(backend: AcpRuntimeBackend) {
    this.#backend = backend;
  }

  capabilities(): AgentCapabilities {
    return {
      sessions: true,
      resume: typeof this.#backend.resume === "function",
      cancel: true,
      steer: false,
      modelSelection: true,
      nativeTools: true,
      mcpTools: true,
      approvals: ACP_APPROVAL_CAPABILITIES,
    };
  }

  async supports(request: AgentRequest): Promise<boolean> {
    if (request.requirePolicyAmendments) return false;
    return this.#backend.available();
  }

  async start(request: AgentRequest): Promise<AgentSession> {
    let session: AcpAgentSession | undefined;
    const backend = await this.#backend.start({
      request,
      onPermissionRequest: (permission) => {
        if (!session) {
          throw new Error("ACP session is not ready for approvals.");
        }
        return session.handlePermissionRequest(permission);
      },
    });
    session = new AcpAgentSession(backend);
    return session;
  }

  async resume(
    sessionId: string,
    request?: Omit<AgentRequest, "prompt">,
  ): Promise<AgentSession> {
    if (!this.#backend.resume) {
      throw new Error("ACP backend does not support resume.");
    }
    let session: AcpAgentSession | undefined;
    const backend = await this.#backend.resume({
      sessionId,
      request,
      onPermissionRequest: (permission) => {
        if (!session) {
          throw new Error("ACP session is not ready for approvals.");
        }
        return session.handlePermissionRequest(permission);
      },
    });
    session = new AcpAgentSession(backend);
    return session;
  }
}
