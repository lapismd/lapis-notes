import {
  getNativeDesktopBridge,
  getNativeDesktopCapability,
  type NativeAgentToolCall,
  type NativeAgentToolCancel,
  type NativeDesktopBridge,
} from "@lapis-notes/api/desktop-native";
import type {
  AgentEvent,
  AppToolSessionDescriptor,
  ApprovalOptionKind,
} from "../core/types";
import {
  AppToolExecutionError,
  AppToolHost,
  type CreateAppToolSessionInput,
} from "./app-tool-host";

const APP_TOOL_MCP_SERVER_NAME = "lapis-tools";
const SUPPORTED_APP_TOOL_TRANSPORTS = new Set(["stdio-mcp", "http-mcp"]);

export type AppToolBridgeEvent = {
  bindingId: string;
  event: AgentEvent;
};

export interface AppToolBridgeCoordinator {
  prepare(
    input: CreateAppToolSessionInput,
  ): Promise<AppToolSessionDescriptor>;
  closeBinding(bindingId: string): Promise<void>;
  respondToApproval(
    requestId: string,
    decision: ApprovalOptionKind,
  ): boolean;
  subscribe(listener: (event: AppToolBridgeEvent) => void): () => void;
  close(): Promise<void>;
}

type BridgeRecord = {
  bindingId: string;
  bridgeId?: string;
  bridge?: NativeDesktopBridge;
  calls: Map<
    string,
    { abort: AbortController; runId: string; sequence: number }
  >;
};

export class DesktopAppToolBridge implements AppToolBridgeCoordinator {
  readonly #records = new Map<string, BridgeRecord>();
  readonly #listeners = new Set<(event: AppToolBridgeEvent) => void>();
  readonly #unsubscribeApprovals: () => void;
  #subscribedBridge: NativeDesktopBridge | null = null;
  #unsubscribeCall: (() => void) | undefined;
  #unsubscribeCancel: (() => void) | undefined;

  constructor(private readonly host: AppToolHost) {
    this.#unsubscribeApprovals = host.approvals.subscribe(
      (request, bindingId) => {
        const record = this.#records.get(bindingId);
        const active = record ? [...record.calls.values()].at(-1) : undefined;
        this.#emit(bindingId, {
          type: "permission.request",
          request,
          ...(record && active
            ? { source: nextSource(record, active) }
            : {}),
        });
      },
    );
  }

  async prepare(
    input: CreateAppToolSessionInput,
  ): Promise<AppToolSessionDescriptor> {
    if (this.#records.has(input.agentBindingId)) {
      throw new Error(`App tool bridge already exists: ${input.agentBindingId}`);
    }
    const bridge = getNativeDesktopBridge();
    const hostCapable = supportsAppTools();
    const runtimeCapable = input.runtimeSupportsAppTools;
    const descriptor = this.host.createSession({
      ...input,
      runtimeSupportsAppTools: runtimeCapable && hostCapable,
    });
    const record: BridgeRecord = {
      bindingId: input.agentBindingId,
      calls: new Map(),
    };
    this.#records.set(input.agentBindingId, record);

    if (!runtimeCapable) {
      return withStatus(
        descriptor,
        "runtime-unavailable",
        "The selected agent runtime does not support application tools.",
      );
    }
    if (!hostCapable || !bridge?.onAgentToolCall || !bridge.onAgentToolCancel) {
      return withStatus(
        descriptor,
        "host-upgrade-required",
        "Application tools require an agent host with protocol v3 support.",
      );
    }
    if (descriptor.tools.length === 0) {
      return withStatus(descriptor, "disabled");
    }

    this.#subscribeToBridge(bridge);
    try {
      const opened = await bridge.invoke<{ bridgeId: string }>(
        "desktop_agent_tools_open",
        {
          bindingId: descriptor.agentBindingId,
          conversationId: descriptor.conversationId,
          descriptors: descriptor.tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            outputSchema: tool.outputSchema,
            effect: tool.effect,
          })),
        },
      );
      record.bridge = bridge;
      record.bridgeId = opened.bridgeId;
      return Object.freeze({
        ...descriptor,
        bridgeId: opened.bridgeId,
        status: "available" as const,
      });
    } catch (error) {
      this.#records.delete(input.agentBindingId);
      this.host.closeBinding(input.agentBindingId);
      throw error;
    }
  }

  respondToApproval(
    requestId: string,
    decision: ApprovalOptionKind,
  ): boolean {
    return this.host.approvals.respond(requestId, decision);
  }

  subscribe(listener: (event: AppToolBridgeEvent) => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  async closeBinding(bindingId: string): Promise<void> {
    const record = this.#records.get(bindingId);
    this.#records.delete(bindingId);
    for (const call of record?.calls.values() ?? []) call.abort.abort();
    record?.calls.clear();
    this.host.closeBinding(bindingId);
    if (record?.bridge && record.bridgeId) {
      await record.bridge
        .invoke("desktop_agent_tools_close", { bridgeId: record.bridgeId })
        .catch(() => undefined);
    }
  }

  async close(): Promise<void> {
    for (const bindingId of [...this.#records.keys()]) {
      await this.closeBinding(bindingId);
    }
    this.#unsubscribeApprovals();
    this.#unsubscribeCall?.();
    this.#unsubscribeCancel?.();
    this.#listeners.clear();
    this.#subscribedBridge = null;
  }

  #subscribeToBridge(bridge: NativeDesktopBridge): void {
    if (this.#subscribedBridge === bridge) return;
    this.#unsubscribeCall?.();
    this.#unsubscribeCancel?.();
    this.#subscribedBridge = bridge;
    this.#unsubscribeCall = bridge.onAgentToolCall?.((call) => {
      void this.#handleCall(call);
    });
    this.#unsubscribeCancel = bridge.onAgentToolCancel?.((cancel) => {
      this.#handleCancel(cancel);
    });
  }

  async #handleCall(call: NativeAgentToolCall): Promise<void> {
    const record = this.#records.get(call.bindingId);
    if (!record || record.bridgeId !== call.bridgeId || !record.bridge) return;
    if (record.calls.has(call.callId)) return;
    const active = {
      abort: new AbortController(),
      runId: `app-tool-${call.callId}`,
      sequence: 0,
    };
    record.calls.set(call.callId, active);
    this.#emit(call.bindingId, {
      type: "tool.start",
      id: call.callId,
      name: call.name,
      server: APP_TOOL_MCP_SERVER_NAME,
      input: call.input,
      source: nextSource(record, active),
    });
    try {
      const result = await this.host.invoke(
        call.bindingId,
        {
          runId: active.runId,
          toolCallId: call.callId,
          name: call.name,
          input: call.input,
        },
        active.abort.signal,
      );
      await record.bridge.invoke("desktop_agent_tools_respond", {
        bridgeId: call.bridgeId,
        callId: call.callId,
        result,
      });
      this.#emit(call.bindingId, {
        type: "tool.end",
        id: call.callId,
        name: call.name,
        server: APP_TOOL_MCP_SERVER_NAME,
        output: result,
        source: nextSource(record, active),
      });
    } catch (error) {
      const normalized = normalizeExecutionError(error);
      await record.bridge
        .invoke("desktop_agent_tools_respond", {
          bridgeId: call.bridgeId,
          callId: call.callId,
          error: normalized,
        })
        .catch(() => undefined);
      this.#emit(call.bindingId, {
        type: "tool.end",
        id: call.callId,
        name: call.name,
        server: APP_TOOL_MCP_SERVER_NAME,
        error: normalized,
        source: nextSource(record, active),
      });
    } finally {
      record.calls.delete(call.callId);
    }
  }

  #handleCancel(cancel: NativeAgentToolCancel): void {
    const record = this.#records.get(cancel.bindingId);
    if (!record || record.bridgeId !== cancel.bridgeId) return;
    record.calls.get(cancel.callId)?.abort.abort();
  }

  #emit(bindingId: string, event: AgentEvent): void {
    for (const listener of this.#listeners) listener({ bindingId, event });
  }
}

function supportsAppTools(): boolean {
  const capability = getNativeDesktopCapability("agent-runtime");
  const protocolVersion = Number(capability?.details?.protocolVersion ?? 0);
  const transport = String(capability?.details?.appTools ?? "");
  return (
    capability?.status === "available" &&
    protocolVersion >= 3 &&
    SUPPORTED_APP_TOOL_TRANSPORTS.has(transport)
  );
}

function withStatus(
  descriptor: AppToolSessionDescriptor,
  status: NonNullable<AppToolSessionDescriptor["status"]>,
  unavailableReason?: string,
): AppToolSessionDescriptor {
  return Object.freeze({ ...descriptor, status, unavailableReason });
}

function nextSource(
  record: BridgeRecord,
  active: { runId: string; sequence: number },
) {
  active.sequence += 1;
  return {
    sessionId: record.bridgeId ?? record.bindingId,
    runId: active.runId,
    sequence: active.sequence,
  };
}

function normalizeExecutionError(error: unknown): {
  code: string;
  message: string;
} {
  if (error instanceof AppToolExecutionError) {
    return { code: error.code, message: error.message };
  }
  return {
    code: "execution_failed",
    message: "Application tool execution failed.",
  };
}
