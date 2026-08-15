import {
  getNativeDesktopBridge,
  hasNativeDesktopCapability,
} from "@lapis-notes/api";
import { AsyncEventQueue } from "../../core/event-queue";
import type { AgentRequest } from "../../core/types";
import type {
  AcpBackendSession,
  AcpRuntimeBackend,
} from "./acp-runtime";
import type {
  AcpPermissionDecision,
  AcpPermissionRequestLike,
  AcpRuntimeEventLike,
} from "./acp-event-mapper";

type AcpIpcEvent =
  | {
      sessionId: string;
      type: "event";
      event: AcpRuntimeEventLike;
    }
  | {
      sessionId: string;
      type: "permission";
      request: AcpPermissionRequestLike;
    }
  | { sessionId: string; type: "closed" };

type AgentRuntimeBridge = {
  invoke<T>(command: string, payload?: Record<string, unknown>): Promise<T>;
  onAgentRuntimeEvent?(listener: (event: AcpIpcEvent) => void): () => void;
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
    request?: AgentRequest;
    onPermissionRequest(
      request: AcpPermissionRequestLike,
    ): Promise<AcpPermissionDecision>;
  }): Promise<AcpBackendSession> {
    return this.#open(
      { ...input.request, prompt: input.request?.prompt ?? "" },
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
      if (event.type === "event") {
        events.push(event.event);
        return;
      }
      if (event.type === "permission") {
        void onPermissionRequest(event.request).then((decision) =>
          bridge.invoke("desktop_agent_acp_respond", {
            sessionId,
            requestId: String(event.request.requestId ?? event.request.id),
            decision: decision.outcome,
          }),
        );
        return;
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
