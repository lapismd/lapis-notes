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

type Emit = (event: RendererNativeEvent) => Promise<void>;

export const DENO_AGENT_COMMANDS = new Set([
  "desktop_agent_process_spawn",
  "desktop_agent_process_write",
  "desktop_agent_process_kill",
  "desktop_agent_acp_start",
  "desktop_agent_acp_models",
  "desktop_agent_acp_prompt",
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

export function createDenoAgentSink(emit: Emit): AgentHostSink {
  let pending = Promise.resolve();
  const send = (event: RendererNativeEvent) => {
    pending = pending.then(() => emit(event)).catch((error) => {
      console.error("[desktop] agent renderer event failed", error);
    });
  };
  return {
    connectionId: "deno-renderer:main",
    sendRuntimeEvent(payload) {
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

  constructor(
    emit: Emit,
    executor?: AgentRuntimeExecutor,
    broker?: ToolBridgeBroker,
  ) {
    this.#sink = createDenoAgentSink(emit);
    this.#broker = broker ?? (executor ? undefined : createDenoToolBridgeBroker());
    this.#executor =
      executor ??
      createAgentRuntimeExecutor({
        toolBridgeBroker: this.#broker,
      });
  }

  respond(request: Request): Promise<Response | undefined> {
    return this.#broker?.handleWebRequest(request) ?? Promise.resolve(undefined);
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
      return this.#executor.listAcpModels(
        this.#sink,
        payload as Pick<AcpStartPayload, "workspace" | "agent">,
      );
    }
    if (command === "desktop_agent_acp_prompt") {
      return this.#executor.promptAcpSession(
        this.#sink,
        String(payload.sessionId ?? ""),
        String(payload.text ?? ""),
      );
    }
    if (command === "desktop_agent_acp_cancel") {
      return this.#executor.cancelAcpSession(String(payload.sessionId ?? ""));
    }
    if (command === "desktop_agent_acp_close") {
      return this.#executor.closeAcpSession(String(payload.sessionId ?? ""));
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
    this.#executor.closeToolBridge(
      this.#sink,
      String(payload.bridgeId ?? ""),
    );
  }

  async shutdown(): Promise<void> {
    this.#executor.disconnectConnection(this.#sink.connectionId ?? "");
    await this.#executor.close();
  }
}
