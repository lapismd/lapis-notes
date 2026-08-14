import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { randomUUID } from "node:crypto";
import type { WebContents } from "electron";

type SpawnPayload = {
  command?: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
};

type AcpStartPayload = {
  workspace?: string;
  model?: { provider?: string; model?: string };
  metadata?: Record<string, unknown>;
  tools?: Array<{
    name: string;
    command: string;
    args?: string[];
    env?: Record<string, string>;
  }>;
  resumeSessionId?: string;
};

type AcpPermissionDecision = {
  outcome:
    | "allow_once"
    | "allow_always"
    | "reject_once"
    | "reject_always"
    | "cancel";
};

type AcpRuntimeHandle = {
  sessionKey: string;
  backend?: string;
  runtimeSessionName?: string;
};

type AcpxRuntimeLike = {
  ensureSession(input: {
    sessionKey: string;
    agent: string;
    mode: "persistent" | "oneshot";
    cwd?: string;
    resumeSessionId?: string;
  }): Promise<AcpRuntimeHandle>;
  startTurn(input: {
    handle: AcpRuntimeHandle;
    text: string;
    mode: "prompt" | "steer";
    requestId: string;
  }): {
    events: AsyncIterable<{ type: string; [key: string]: unknown }>;
    result: Promise<{ status: string; stopReason?: string; error?: { message?: string } }>;
  };
  cancel(input: { handle: AcpRuntimeHandle; reason?: string }): Promise<void>;
  close(input: { handle: AcpRuntimeHandle; reason: string }): Promise<void>;
};

const processes = new Map<string, ChildProcessWithoutNullStreams>();
const acpSessions = new Map<
  string,
  { runtime: AcpxRuntimeLike; handle: AcpRuntimeHandle }
>();
const pendingApprovals = new Map<string, (decision: AcpPermissionDecision) => void>();

export function spawnAgentProcess(
  sender: WebContents,
  payload: SpawnPayload,
): { processId: string } {
  const command = payload.command?.trim();
  if (!command) throw new Error("agent-runtime spawn requires a command");
  const processId = randomUUID();
  const child = spawn(command, payload.args ?? [], {
    cwd: payload.cwd,
    env: { ...process.env, ...payload.env },
    stdio: ["pipe", "pipe", "pipe"],
  });
  processes.set(processId, child);
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (data: string) => {
    sender.send("desktop_agent_process_message", {
      processId,
      type: "stdout",
      data,
    });
  });
  child.stderr.on("data", (data: string) => {
    sender.send("desktop_agent_process_message", {
      processId,
      type: "stderr",
      data,
    });
  });
  child.on("exit", (code) => {
    processes.delete(processId);
    sender.send("desktop_agent_process_message", {
      processId,
      type: "exit",
      exitCode: code ?? 0,
    });
  });
  return { processId };
}

export function writeAgentProcess(processId: string, data: string): void {
  const child = processes.get(processId);
  if (!child) throw new Error(`Unknown agent process: ${processId}`);
  child.stdin.write(data);
}

export function killAgentProcess(processId: string): void {
  const child = processes.get(processId);
  if (!child) return;
  child.kill();
  processes.delete(processId);
}

export async function startAcpSession(
  sender: WebContents,
  payload: AcpStartPayload,
): Promise<{ sessionId: string }> {
  const sessionId = payload.resumeSessionId ?? randomUUID();
  const runtime = await createAcpxRuntime(sender, sessionId, payload);
  const handle = await runtime.ensureSession({
    sessionKey: sessionId,
    agent: String(payload.metadata?.acpAgent ?? "codex"),
    mode: "persistent",
    cwd: payload.workspace,
    resumeSessionId: payload.resumeSessionId,
  });
  acpSessions.set(sessionId, { runtime, handle });
  return { sessionId };
}

export async function promptAcpSession(
  sender: WebContents,
  sessionId: string,
  text: string,
): Promise<void> {
  const session = acpSessions.get(sessionId);
  if (!session) throw new Error(`Unknown ACP session: ${sessionId}`);
  const turn = session.runtime.startTurn({
    handle: session.handle,
    text,
    mode: "prompt",
    requestId: randomUUID(),
  });
  void (async () => {
    for await (const event of turn.events) {
      sender.send("desktop_agent_runtime_event", {
        sessionId,
        type: "event",
        event,
      });
    }
    const result = await turn.result;
    if (result.status === "failed") {
      sender.send("desktop_agent_runtime_event", {
        sessionId,
        type: "event",
        event: {
          type: "error",
          message: result.error?.message ?? "ACP turn failed",
        },
      });
      return;
    }
    sender.send("desktop_agent_runtime_event", {
      sessionId,
      type: "event",
      event: { type: "done", stopReason: result.stopReason ?? result.status },
    });
  })();
}

export async function cancelAcpSession(sessionId: string): Promise<void> {
  const session = acpSessions.get(sessionId);
  if (!session) return;
  await session.runtime.cancel({ handle: session.handle });
}

export async function closeAcpSession(sessionId: string): Promise<void> {
  const session = acpSessions.get(sessionId);
  if (!session) return;
  await session.runtime.close({ handle: session.handle, reason: "close" });
  acpSessions.delete(sessionId);
}

export function respondAcpSession(
  sessionId: string,
  requestId: string,
  decision: string | AcpPermissionDecision,
): void {
  const key = `${sessionId}:${requestId}`;
  const resolve = pendingApprovals.get(key);
  if (!resolve) throw new Error(`Unknown ACP approval: ${key}`);
  pendingApprovals.delete(key);
  resolve(normalizePermissionDecision(decision));
}

async function createAcpxRuntime(
  sender: WebContents,
  sessionId: string,
  payload: AcpStartPayload,
): Promise<AcpxRuntimeLike> {
  let acpx: {
    createAcpRuntime: (options: Record<string, unknown>) => AcpxRuntimeLike;
    createAgentRegistry: () => unknown;
    createRuntimeStore: (options: { stateDir: string }) => unknown;
  };
  try {
    const specifier = "acpx/runtime";
    acpx = (await import(specifier)) as typeof acpx;
  } catch {
    throw new Error(
      "acpx/runtime is not available. Install acpx >= 0.8.0 on the desktop host.",
    );
  }
  const cwd = payload.workspace ?? process.cwd();
  return acpx.createAcpRuntime({
    cwd,
    sessionStore: acpx.createRuntimeStore({
      stateDir: `${cwd}/.lapis/ai-sessions`,
    }),
    agentRegistry: acpx.createAgentRegistry(),
    mcpServers: (payload.tools ?? []).map((tool) => ({
      name: tool.name,
      command: tool.command,
      args: tool.args ?? [],
      env: tool.env,
    })),
    permissionMode: "deny-all",
    onPermissionRequest: async (
      request: {
        sessionId?: string;
        inferredKind?: string;
        raw?: Record<string, unknown>;
      },
    ) => {
      const raw = request.raw ?? {};
      const toolCall =
        raw.toolCall && typeof raw.toolCall === "object"
          ? (raw.toolCall as Record<string, unknown>)
          : {};
      const requestId = String(
        toolCall.toolCallId ?? raw.toolCallId ?? request.sessionId ?? randomUUID(),
      );
      sender.send("desktop_agent_runtime_event", {
        sessionId,
        type: "permission",
        request: {
          requestId,
          id: requestId,
          sessionId: request.sessionId,
          inferredKind: request.inferredKind,
          raw,
          kind: request.inferredKind ?? toolCall.kind,
          title: toolCall.title,
          toolName: toolCall.title ?? toolCall.kind,
          input: toolCall.rawInput,
          options: raw.options,
        },
      });
      return new Promise<AcpPermissionDecision>((resolve) => {
        pendingApprovals.set(`${sessionId}:${requestId}`, resolve);
      });
    },
  });
}

function normalizePermissionDecision(
  decision: string | AcpPermissionDecision,
): AcpPermissionDecision {
  if (typeof decision !== "string") return decision;
  if (decision === "allow_always" || decision === "allow-always") {
    return { outcome: "allow_always" };
  }
  if (
    decision === "reject_once" ||
    decision === "deny_once" ||
    decision === "deny-once"
  ) {
    return { outcome: "reject_once" };
  }
  if (
    decision === "reject_always" ||
    decision === "deny_always" ||
    decision === "deny-always"
  ) {
    return { outcome: "reject_always" };
  }
  if (decision === "cancel") return { outcome: "cancel" };
  return { outcome: "allow_once" };
}
