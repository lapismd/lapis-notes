import { AsyncEventQueue } from "../../core/event-queue";
import {
  NATIVE_CODEX_APPROVAL_CAPABILITIES,
  type AgentCapabilities,
  type AgentEvent,
  type AgentRequest,
  type AgentRuntime,
  type AgentSession,
} from "../../core/types";
import type { AgentProcessHandle, AgentProcessHost } from "../../host/process-host";
import {
  approvalRequestFromServerRequest,
  approvalResponseForOption,
  mapCodexNotification,
  type AppServerMessage,
} from "./app-server-protocol";

export class CodexNativeSession implements AgentSession {
  readonly id: string;
  readonly #process: AgentProcessHandle;
  readonly #events = new AsyncEventQueue<AgentEvent>();
  readonly #pending = new Map<
    string,
    { resolve(): void; reject(error: Error): void }
  >();
  #buffer = "";
  #rpcId = 1;
  #consume: Promise<void>;

  constructor(id: string, process: AgentProcessHandle) {
    this.id = id;
    this.#process = process;
    this.#consume = this.#pump();
  }

  events(): AsyncIterable<AgentEvent> {
    return this.#events;
  }

  async send(input: string): Promise<void> {
    await this.#request("turn/start", { prompt: input });
  }

  async respondToApproval(requestId: string, optionId: string): Promise<void> {
    await this.#request("turn/respond", {
      requestId,
      ...approvalResponseForOption(optionId),
    });
    this.#pending.get(requestId)?.resolve();
    this.#pending.delete(requestId);
  }

  async cancel(): Promise<void> {
    await this.#request("turn/interrupt", {});
    this.#events.push({ type: "status", status: "cancelled" });
  }

  async close(): Promise<void> {
    for (const [id, pending] of this.#pending) {
      this.#pending.delete(id);
      pending.reject(new Error("Session closed."));
    }
    await this.#process.kill();
    await this.#consume;
    this.#events.close();
  }

  async #pump(): Promise<void> {
    try {
      for await (const message of this.#process.messages()) {
        if (message.type !== "stdout") continue;
        this.#buffer += message.data;
        const lines = this.#buffer.split("\n");
        this.#buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          this.#handleLine(line);
        }
      }
    } catch (error) {
      this.#events.push({
        type: "error",
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  #handleLine(line: string): void {
    let parsed: AppServerMessage;
    try {
      parsed = JSON.parse(line) as AppServerMessage;
    } catch {
      return;
    }
    if (parsed.method === "turn/requestApproval") {
      const request = approvalRequestFromServerRequest(
        (parsed.params ?? {}) as Record<string, unknown>,
      );
      this.#events.push({ type: "permission.request", request });
      return;
    }
    const event = mapCodexNotification(parsed);
    if (event) this.#events.push(event);
  }

  async #request(method: string, params: Record<string, unknown>): Promise<void> {
    const id = this.#rpcId++;
    await this.#process.write(
      `${JSON.stringify({ id, method, params })}\n`,
    );
  }
}

export class CodexNativeRuntime implements AgentRuntime {
  readonly id = "codex-native";
  readonly #host: AgentProcessHost;

  constructor(host: AgentProcessHost) {
    this.#host = host;
  }

  capabilities(): AgentCapabilities {
    return {
      sessions: true,
      resume: false,
      cancel: true,
      steer: false,
      modelSelection: true,
      nativeTools: true,
      mcpTools: true,
      approvals: NATIVE_CODEX_APPROVAL_CAPABILITIES,
    };
  }

  async supports(request: AgentRequest): Promise<boolean> {
    if (!this.#host.available) return false;
    return Boolean(request.requirePolicyAmendments);
  }

  async start(request: AgentRequest): Promise<AgentSession> {
    const process = await this.#host.spawn({
      command: "codex",
      args: ["app-server", "--stdio"],
      cwd: request.workspace,
    });
    const session = new CodexNativeSession(
      `codex-${process.id}`,
      process,
    );
    return session;
  }
}
