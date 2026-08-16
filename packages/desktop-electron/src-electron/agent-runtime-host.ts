import type { WebContents } from "electron";
import {
  createAgentRuntimeExecutor,
  type AcpPermissionDecision,
  type AcpModelCatalog,
  type AcpStartPayload,
  type AgentHostSink,
  type SpawnPayload,
} from "@lapis-notes/ai-host";

const executor = createAgentRuntimeExecutor();

function sinkFor(sender: WebContents): AgentHostSink {
  return {
    sendRuntimeEvent(event) {
      sender.send("desktop_agent_runtime_event", event);
    },
    sendProcessMessage(event) {
      sender.send("desktop_agent_process_message", event);
    },
  };
}

export function spawnAgentProcess(
  sender: WebContents,
  payload: SpawnPayload,
): { processId: string } {
  return executor.spawnProcess(sinkFor(sender), payload);
}

export function writeAgentProcess(processId: string, data: string): void {
  executor.writeProcess(processId, data);
}

export function killAgentProcess(processId: string): void {
  executor.killProcess(processId);
}

export async function startAcpSession(
  sender: WebContents,
  payload: AcpStartPayload,
): Promise<{ sessionId: string }> {
  return executor.startAcpSession(sinkFor(sender), payload);
}

export async function listAcpModels(
  sender: WebContents,
  payload: Pick<AcpStartPayload, "workspace" | "agent">,
): Promise<AcpModelCatalog> {
  return executor.listAcpModels(sinkFor(sender), payload);
}

export async function promptAcpSession(
  sender: WebContents,
  sessionId: string,
  text: string,
): Promise<void> {
  return executor.promptAcpSession(sinkFor(sender), sessionId, text);
}

export async function cancelAcpSession(sessionId: string): Promise<void> {
  return executor.cancelAcpSession(sessionId);
}

export async function closeAcpSession(sessionId: string): Promise<void> {
  return executor.closeAcpSession(sessionId);
}

export function respondAcpSession(
  sessionId: string,
  requestId: string,
  decision: string | AcpPermissionDecision,
): void {
  executor.respondAcpSession(sessionId, requestId, decision);
}
