import {
  getNativeDesktopBridge,
  hasNativeDesktopCapability,
  type NativeAgentRuntimeEvent,
} from "@lapis-notes/api/desktop-native";
import { AsyncEventQueue } from "../../core/event-queue";
import type { AgentRequest } from "../../core/types";
import type { AcpBackendSession, AcpRuntimeBackend } from "./acp-runtime";
import type {
  AcpPermissionDecision,
  AcpPermissionRequestLike,
  AcpRuntimeEventLike,
} from "./acp-event-mapper";

type AgentRuntimeBridge = {
  invoke<T>(command: string, payload?: Record<string, unknown>): Promise<T>;
  onAgentRuntimeEvent?(
    listener: (event: NativeAgentRuntimeEvent) => void,
  ): () => void;
};

export class DesktopAcpRuntimeBackend implements AcpRuntimeBackend {
  async available(): Promise<boolean> {
    return hasNativeDesktopCapability("agent-runtime");
  }

  async start(input: {
    request: AgentRequest;
    onPermissionRequest(
      request: AcpPermissionRequestLike,
    ): Promise<AcpPermissionDecision>;
  }): Promise<AcpBackendSession> {
    return this.#open(input.request, input.onPermissionRequest);
  }

  async resume(input: {
    sessionId: string;
    request?: Omit<AgentRequest, "prompt">;
    onPermissionRequest(
      request: AcpPermissionRequestLike,
    ): Promise<AcpPermissionDecision>;
  }): Promise<AcpBackendSession> {
    return this.#open(
      { ...input.request, prompt: "" },
      input.onPermissionRequest,
      input.sessionId,
    );
  }

  async #open(
    request: AgentRequest,
    onPermissionRequest: (
      request: AcpPermissionRequestLike,
    ) => Promise<AcpPermissionDecision>,
    resumeSessionId?: string,
  ): Promise<AcpBackendSession> {
    const bridge = getRequiredBridge();
    const { sessionId } = await bridge.invoke<{ sessionId: string }>(
      "desktop_agent_acp_start",
      {
        workspace: request.workspace,
        agent: request.agent,
        model: request.model,
        thinking: request.thinking,
        metadata: request.metadata,
        tools: request.tools,
        resumeSessionId,
      },
    );
    const events = new AsyncEventQueue<AcpRuntimeEventLike>();
    const unsubscribe = bridge.onAgentRuntimeEvent?.((event) => {
      if (event.sessionId !== sessionId) return;
      const source = {
        sessionId: event.sessionId,
        runId: event.runId,
        sequence: event.sequence,
      };
      if (event.event.type === "event" && event.event.event) {
        events.push({
          ...(event.event.event as AcpRuntimeEventLike),
          __source: source,
        });
        return;
      }
      if (event.event.type === "permission" && event.event.request) {
        const request = {
          ...(event.event.request as AcpPermissionRequestLike),
          __source: source,
        };
        void onPermissionRequest(request).then((decision) =>
          bridge.invoke("desktop_agent_acp_respond", {
            sessionId,
            requestId: String(request.requestId ?? request.id),
            decision: decision.outcome,
          }),
        );
        return;
      }
      if (event.event.event?.type === "error") {
        events.push({
          type: "error",
          message:
            String(event.event.event.message ?? "") ||
            "Agent-runtime connection closed",
          __source: source,
        });
      }
      events.close();
    });

    return {
      id: sessionId,
      events: () => events,
      async prompt(text) {
        await bridge.invoke("desktop_agent_acp_prompt", { sessionId, text });
      },
      async cancel() {
        await bridge.invoke("desktop_agent_acp_cancel", { sessionId });
      },
      async close() {
        unsubscribe?.();
        await bridge.invoke("desktop_agent_acp_close", { sessionId });
        events.close();
      },
    };
  }
}

function getRequiredBridge(): AgentRuntimeBridge {
  const bridge = getNativeDesktopBridge() as AgentRuntimeBridge | null;
  if (!bridge) {
    throw new Error("The desktop agent-runtime bridge is not registered.");
  }
  return bridge;
}
