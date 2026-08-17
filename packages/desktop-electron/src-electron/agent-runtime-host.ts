import path from "node:path";
import { app, type WebContents } from "electron";
import {
  createAgentRuntimeExecutor,
  type AcpPermissionDecision,
  type AcpModelCatalog,
  type AcpStartPayload,
  type AgentHostSink,
  type SpawnPayload,
  type ToolBridgeOpenPayload,
  type ToolBridgeResponse,
} from "@lapis-notes/ai-host";

const executor = createAgentRuntimeExecutor({
  toolBridgeOptions: {
    shimPath: resolveAgentToolShimPath(),
    extraEnv: { ELECTRON_RUN_AS_NODE: "1" },
  },
});
const boundSenders = new WeakSet<WebContents>();

function sinkFor(sender: WebContents): AgentHostSink {
  const connectionId = `electron-renderer:${sender.id}`;
  if (!boundSenders.has(sender)) {
    boundSenders.add(sender);
    sender.once("destroyed", () => executor.disconnectConnection(connectionId));
  }
  return {
    connectionId,
    sendRuntimeEvent(event) {
      if (!sender.isDestroyed()) sender.send("desktop_agent_runtime_event", event);
    },
    sendProcessMessage(event) {
      if (!sender.isDestroyed()) sender.send("desktop_agent_process_message", event);
    },
    sendToolCall(event) {
      if (!sender.isDestroyed()) sender.send("desktop_agent_tool_call", event);
    },
    sendToolCancel(event) {
      if (!sender.isDestroyed()) sender.send("desktop_agent_tool_cancel", event);
    },
  };
}

export function openAgentToolBridge(
  sender: WebContents,
  payload: ToolBridgeOpenPayload,
): Promise<{ bridgeId: string }> {
  return executor.openToolBridge(sinkFor(sender), payload);
}

export function respondAgentToolBridge(
  sender: WebContents,
  payload: ToolBridgeResponse,
): void {
  executor.respondToolBridge(sinkFor(sender), payload);
}

export function closeAgentToolBridge(sender: WebContents, bridgeId: string): void {
  executor.closeToolBridge(sinkFor(sender), bridgeId);
}

export function shutdownAgentRuntimeHost(): Promise<void> {
  return executor.close();
}

function resolveAgentToolShimPath(): string {
  const appPath = app.getAppPath();
  const unpackedRoot = app.isPackaged
    ? appPath.replace(/app\.asar$/u, "app.asar.unpacked")
    : appPath;
  return path.join(unpackedRoot, "dist-electron", "mcp-shim.mjs");
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
): Promise<{ runId: string }> {
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
