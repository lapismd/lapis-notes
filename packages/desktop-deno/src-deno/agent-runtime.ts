import "acpx/runtime";

import {
  ToolBridgeBroker,
  createAgentRuntimeExecutor,
  type AcpPermissionDecision,
  type AcpStartPayload,
  type AgentHostSink,
  type AgentRuntimeExecutor,
  type SpawnPayload,
  type ToolBridgeOpenPayload,
  type ToolBridgeResponse,
} from "@lapismd/ai-host";
import type { RendererNativeEvent } from "./renderer-events.ts";
import { rendererOriginFromServeAddress } from "./window-chrome.ts";
import type {
  NativeAgentRunSnapshot,
  NativeAgentRuntimeEvent,
} from "../../api/src/lib/storage/desktop-native.ts";

type Emit = (event: RendererNativeEvent) => Promise<void>;
const MAX_RETAINED_RUN_EVENTS = 4_096;

export const DENO_AGENT_COMMANDS = new Set([
  "desktop_agent_process_spawn",
  "desktop_agent_process_write",
  "desktop_agent_process_kill",
  "desktop_agent_acp_start",
  "desktop_agent_acp_models",
  "desktop_agent_acp_prompt",
  "desktop_agent_acp_configure",
  "desktop_agent_acp_status",
  "desktop_agent_acp_cancel",
  "desktop_agent_acp_close",
  "desktop_agent_acp_respond",
  "desktop_agent_tools_open",
  "desktop_agent_tools_respond",
  "desktop_agent_tools_close",
]);

export function createDenoToolBridgeBaseUrl(
  rendererAddress: string | undefined,
): string {
  return new URL(
    "/__lapis/agent-tools/",
    rendererOriginFromServeAddress(rendererAddress),
  ).href;
}

function createDenoToolBridgeBroker(): ToolBridgeBroker {
  const broker = new ToolBridgeBroker({
    externalHttpBaseUrl: createDenoToolBridgeBaseUrl(
      Deno.env.get("DENO_SERVE_ADDRESS"),
    ),
  });
  // A compiled Deno desktop binary is not a general-purpose Node executable,
  // so its app-tool transport uses the public broker's authenticated loopback
  // HTTP contribution instead of spawning the Node stdio shim.
  broker.serverContribution = ((connectionId: string, bridgeId: string) =>
    broker.httpServerContribution(connectionId, bridgeId)) as never;
  return broker;
}

export function createDenoAgentSink(
  emit: Emit,
  observeRuntimeEvent: (event: NativeAgentRuntimeEvent) => void = () => {},
): AgentHostSink {
  let pending = Promise.resolve();
  const send = (event: RendererNativeEvent) => {
    pending = pending
      .then(() => emit(event))
      .catch((error) => {
        console.error("[desktop] agent renderer event failed", error);
      });
  };
  return {
    connectionId: "deno-renderer:main",
    sendRuntimeEvent(payload) {
      observeRuntimeEvent(payload);
      send({ channel: "desktop_agent_runtime_event", payload });
    },
    sendProcessMessage(payload) {
      send({ channel: "desktop_agent_process_message", payload });
    },
    sendToolCall(payload) {
      send({ channel: "desktop_agent_tool_call", payload });
    },
    sendToolCancel(payload) {
      send({ channel: "desktop_agent_tool_cancel", payload });
    },
  };
}

export class DenoAgentRuntimeHost {
  readonly #sink: AgentHostSink;
  readonly #broker: ToolBridgeBroker | undefined;
  readonly #executor: AgentRuntimeExecutor;
  readonly #runSnapshots = new Map<string, NativeAgentRunSnapshot>();

  constructor(
    emit: Emit,
    executor?: AgentRuntimeExecutor,
    broker?: ToolBridgeBroker,
  ) {
    this.#sink = createDenoAgentSink(emit, (event) =>
      this.#recordRuntimeEvent(event),
    );
    this.#broker =
      broker ?? (executor ? undefined : createDenoToolBridgeBroker());
    this.#executor =
      executor ??
      createAgentRuntimeExecutor({
        toolBridgeBroker: this.#broker,
      });
  }

  respond(request: Request): Promise<Response | undefined> {
    return (
      this.#broker?.handleWebRequest(request) ?? Promise.resolve(undefined)
    );
  }

  handle(command: string, payload: Record<string, unknown>): unknown {
    if (!DENO_AGENT_COMMANDS.has(command)) {
      throw new Error(`Unknown Deno agent command: ${command}`);
    }
    if (command === "desktop_agent_process_spawn") {
      if (payload.appToolBridgeId) {
        throw new Error(
          "Deno legacy process agents do not support an app-tool bridge; use ACP",
        );
      }
      return this.#executor.spawnProcess(this.#sink, payload as SpawnPayload);
    }
    if (command === "desktop_agent_process_write") {
      this.#executor.writeProcess(
        String(payload.processId ?? ""),
        String(payload.data ?? ""),
      );
      return;
    }
    if (command === "desktop_agent_process_kill") {
      this.#executor.killProcess(String(payload.processId ?? ""));
      return;
    }
    if (command === "desktop_agent_acp_start") {
      return this.#executor.startAcpSessionDeferred(
        this.#sink,
        payload as AcpStartPayload,
      );
    }
    if (command === "desktop_agent_acp_models") {
      const requestId =
        String(payload.requestId ?? "").trim() || crypto.randomUUID();
      setTimeout(() => {
        void this.#executor
          .listAcpModels(
            this.#sink,
            payload as Pick<AcpStartPayload, "workspace" | "agent">,
          )
          .then(
            (catalog) =>
              this.#sink.sendRuntimeEvent({
                sessionId: requestId,
                runId: "model-catalog",
                sequence: 1,
                event: {
                  type: "event",
                  event: { type: "model_catalog", catalog },
                },
              }),
            (error) =>
              this.#sink.sendRuntimeEvent({
                sessionId: requestId,
                runId: "model-catalog",
                sequence: 1,
                event: {
                  type: "event",
                  event: {
                    type: "model_catalog_error",
                    message:
                      error instanceof Error ? error.message : String(error),
                  },
                },
              }),
          );
      }, 0);
      return { requestId };
    }
    if (command === "desktop_agent_acp_prompt") {
      const sessionId = String(payload.sessionId ?? "");
      const result = this.#executor.promptAcpSessionDeferred(
        this.#sink,
        sessionId,
        String(payload.text ?? ""),
      );
      this.#runSnapshots.set(sessionId, {
        sessionId,
        runId: result.runId,
        sequence: 0,
        state: "running",
        events: [],
      });
      return result;
    }
    if (command === "desktop_agent_acp_configure") {
      return this.#executor.configureAcpSession({
        sessionId: String(payload.sessionId ?? ""),
        model:
          payload.model && typeof payload.model === "object"
            ? (payload.model as { provider?: string; model?: string })
            : undefined,
        thinking: payload.thinking as
          | "off"
          | "low"
          | "medium"
          | "high"
          | undefined,
      });
    }
    if (command === "desktop_agent_acp_status") {
      const sessionId = String(payload.sessionId ?? "");
      const snapshot = this.#runSnapshots.get(sessionId);
      if (!snapshot) {
        return {
          sessionId,
          sequence: 0,
          state: "idle",
        };
      }
      const { events, ...status } = snapshot;
      return structuredClone(
        snapshot.state === "terminal" ? { ...status, events } : status,
      );
    }
    if (command === "desktop_agent_acp_cancel") {
      return this.#executor.cancelAcpSession(String(payload.sessionId ?? ""));
    }
    if (command === "desktop_agent_acp_close") {
      const sessionId = String(payload.sessionId ?? "");
      this.#runSnapshots.delete(sessionId);
      return this.#executor.closeAcpSession(sessionId);
    }
    if (command === "desktop_agent_acp_respond") {
      this.#executor.respondAcpSession(
        String(payload.sessionId ?? ""),
        String(payload.requestId ?? ""),
        payload.decision as string | AcpPermissionDecision,
      );
      return;
    }
    if (command === "desktop_agent_tools_open") {
      return this.#executor.openToolBridge(
        this.#sink,
        payload as ToolBridgeOpenPayload,
      );
    }
    if (command === "desktop_agent_tools_respond") {
      this.#executor.respondToolBridge(
        this.#sink,
        payload as ToolBridgeResponse,
      );
      return;
    }
    this.#executor.closeToolBridge(this.#sink, String(payload.bridgeId ?? ""));
  }

  async shutdown(): Promise<void> {
    this.#runSnapshots.clear();
    this.#executor.disconnectConnection(this.#sink.connectionId ?? "");
    await this.#executor.close();
  }

  #recordRuntimeEvent(event: NativeAgentRuntimeEvent): void {
    const current = this.#runSnapshots.get(event.sessionId);
    if (current && event.sequence <= current.sequence) return;
    if (
      current?.state === "running" &&
      current.runId &&
      current.runId !== event.runId
    ) {
      return;
    }
    const eventType = event.event.event?.type;
    const terminal =
      event.event.type === "closed" ||
      eventType === "done" ||
      eventType === "completed" ||
      eventType === "error";
    const events = [
      ...(current?.runId === event.runId ? (current.events ?? []) : []),
      event,
    ].slice(-MAX_RETAINED_RUN_EVENTS);
    this.#runSnapshots.set(event.sessionId, {
      sessionId: event.sessionId,
      runId: event.runId,
      sequence: event.sequence,
      state: terminal ? "terminal" : "running",
      events,
      ...(terminal ? { terminalEvent: structuredClone(event) } : {}),
    });
  }
}
