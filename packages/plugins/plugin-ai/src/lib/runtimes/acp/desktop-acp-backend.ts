import {
  getNativeDesktopBridge,
  getNativeDesktopCapability,
  hasNativeDesktopCapability,
  type NativeAgentRunSnapshot,
  type NativeAgentRuntimeEvent,
} from "@lapis-notes/api/desktop-native";
import { AsyncEventQueue } from "../../core/event-queue";
import type {
  AgentRequest,
  AgentSessionConfigurationResult,
} from "../../core/types";
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

const RUN_STATUS_POLL_MS = 1_000;
const MAX_RUN_STATUS_FAILURES = 3;

function isTerminalRuntimeEvent(event: NativeAgentRuntimeEvent): boolean {
  const type = event.event.event?.type;
  return (
    event.event.type === "closed" ||
    type === "done" ||
    type === "completed" ||
    type === "error"
  );
}

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
    const capability = getNativeDesktopCapability("agent-runtime");
    const protocolVersion = Number(capability?.details?.protocolVersion ?? 2);
    const supportsSessionConfiguration =
      protocolVersion >= 5 ||
      capability?.details?.sessionConfiguration === "configure";
    const deferredStart = capability?.details?.deferredStart === true;
    const reconcilesRunStatus = capability?.details?.runStatus === true;
    const events = new AsyncEventQueue<AcpRuntimeEventLike>();
    let sessionId = deferredStart
      ? (resumeSessionId ?? crypto.randomUUID())
      : "";
    let activeRunId: string | null = null;
    let lastSequence = 0;
    let statusFailures = 0;
    let disposed = false;
    let statusTimer: ReturnType<typeof setTimeout> | undefined;

    const clearStatusTimer = () => {
      if (statusTimer) clearTimeout(statusTimer);
      statusTimer = undefined;
    };
    const settleActiveRun = (runId: string) => {
      if (activeRunId !== runId) return;
      activeRunId = null;
      statusFailures = 0;
      clearStatusTimer();
    };
    const deliverRuntimeEvent = (
      event: NativeAgentRuntimeEvent,
      deliverySource: "live" | "status" = "live",
    ) => {
      if (event.sessionId !== sessionId) return;
      if (activeRunId && event.runId !== activeRunId) return;
      if (
        reconcilesRunStatus &&
        deliverySource === "live" &&
        activeRunId === event.runId &&
        isTerminalRuntimeEvent(event)
      ) {
        clearStatusTimer();
        void reconcileRunStatus(event.runId);
        return;
      }
      if (event.sequence <= lastSequence) return;
      lastSequence = event.sequence;
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
        if (isTerminalRuntimeEvent(event)) settleActiveRun(event.runId);
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
      if (isTerminalRuntimeEvent(event)) settleActiveRun(event.runId);
      events.close();
    };
    const failRunStatus = (runId: string, message: string) => {
      if (activeRunId !== runId) return;
      events.push({ type: "error", message });
      settleActiveRun(runId);
      events.close();
    };
    const scheduleRunStatus = (runId: string) => {
      if (!reconcilesRunStatus || disposed || activeRunId !== runId) return;
      clearStatusTimer();
      statusTimer = setTimeout(
        () => void reconcileRunStatus(runId),
        RUN_STATUS_POLL_MS,
      );
    };
    const reconcileRunStatus = async (runId: string): Promise<void> => {
      if (disposed || activeRunId !== runId) return;
      try {
        const snapshot = await bridge.invoke<NativeAgentRunSnapshot>(
          "desktop_agent_acp_status",
          { sessionId },
        );
        if (disposed || activeRunId !== runId) return;
        if (snapshot.runId !== runId || snapshot.state === "idle") {
          statusFailures += 1;
        } else {
          statusFailures = 0;
        }
        if (snapshot.runId === runId && snapshot.state === "terminal") {
          const retained = snapshot.events?.length
            ? [...snapshot.events].sort(
                (left, right) => left.sequence - right.sequence,
              )
            : snapshot.terminalEvent
              ? [snapshot.terminalEvent]
              : [];
          for (const event of retained) deliverRuntimeEvent(event, "status");
          if (activeRunId === runId) {
            failRunStatus(
              runId,
              "The desktop agent finished without a recoverable terminal event.",
            );
          }
          return;
        }
      } catch {
        statusFailures += 1;
      }
      if (statusFailures >= MAX_RUN_STATUS_FAILURES) {
        failRunStatus(
          runId,
          "The desktop agent status channel became unavailable.",
        );
        return;
      }
      scheduleRunStatus(runId);
    };
    const onRuntimeEvent = (event: NativeAgentRuntimeEvent) => {
      deliverRuntimeEvent(event);
    };
    let unsubscribe = deferredStart
      ? bridge.onAgentRuntimeEvent?.(onRuntimeEvent)
      : undefined;
    try {
      const started = await bridge.invoke<{ sessionId: string }>(
        "desktop_agent_acp_start",
        {
          ...(deferredStart ? { sessionId } : {}),
          workspace: request.workspace,
          agent: request.agent,
          model: request.model,
          thinking: request.thinking,
          metadata: request.metadata,
          restricted: request.restricted,
          ...(protocolVersion >= 3
            ? {
                mcpServers: request.mcpServers,
                appToolBridgeId: request.appToolSession?.bridgeId,
              }
            : { tools: request.mcpServers }),
          resumeSessionId,
        },
      );
      if (deferredStart && started.sessionId !== sessionId) {
        throw new Error(
          "The desktop agent host returned a different reserved session id.",
        );
      }
      sessionId = started.sessionId;
      unsubscribe ??= bridge.onAgentRuntimeEvent?.(onRuntimeEvent);
    } catch (error) {
      unsubscribe?.();
      events.close();
      throw error;
    }

    const detach = () => {
      disposed = true;
      activeRunId = null;
      clearStatusTimer();
      unsubscribe?.();
      events.close();
    };

    return {
      id: sessionId,
      events: () => events,
      async prompt(text) {
        lastSequence = 0;
        const prompted = await bridge.invoke<{ runId: string }>(
          "desktop_agent_acp_prompt",
          { sessionId, text },
        );
        activeRunId = prompted.runId;
        statusFailures = 0;
        scheduleRunStatus(prompted.runId);
      },
      async configure(input): Promise<AgentSessionConfigurationResult> {
        if (!supportsSessionConfiguration) {
          return {
            ...(input.model
              ? { model: { status: "unsupported" as const } }
              : {}),
            ...(input.thinking
              ? { thinking: { status: "unsupported" as const } }
              : {}),
          };
        }
        return bridge.invoke<AgentSessionConfigurationResult>(
          "desktop_agent_acp_configure",
          {
            sessionId,
            model: input.model,
            thinking: input.thinking,
          },
        );
      },
      async cancel() {
        activeRunId = null;
        clearStatusTimer();
        await bridge.invoke("desktop_agent_acp_cancel", { sessionId });
      },
      async detach() {
        detach();
      },
      async close() {
        detach();
        await bridge.invoke("desktop_agent_acp_close", { sessionId });
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
