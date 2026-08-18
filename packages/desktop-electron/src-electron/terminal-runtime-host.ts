import { homedir } from "node:os";
import type { WebContents } from "electron";
import {
  createTerminalSessionService,
  type TerminalSessionService,
} from "@lapismd/terminal-host";

const sessions = createTerminalSessionService({
  workspace: homedir(),
});
const boundSenders = new WeakSet<WebContents>();

function bindSender(sender: WebContents): void {
  if (boundSenders.has(sender)) return;
  boundSenders.add(sender);
  sender.once("destroyed", () => {
    boundSenders.delete(sender);
  });
}

export function createDesktopTerminalSession(
  sender: WebContents,
  payload: Record<string, unknown>,
) {
  bindSender(sender);
  const created = sessions.create({
    cwd: typeof payload.cwd === "string" ? payload.cwd : undefined,
    cols: asPositive(payload.cols),
    rows: asPositive(payload.rows),
  });
  const detach = sessions.attach(created.sessionId, {
    onOutput: (chunk) => {
      if (!sender.isDestroyed()) {
        sender.send("desktop_terminal_output", {
          sessionId: created.sessionId,
          data: chunk.toString("base64"),
        });
      }
    },
    onExit: (code) => {
      if (!sender.isDestroyed()) {
        sender.send("desktop_terminal_exit", {
          sessionId: created.sessionId,
          code,
        });
      }
    },
  });
  sender.once("destroyed", () => detach?.());
  return created;
}

export function listDesktopTerminalSessions() {
  return sessions.list();
}

export function writeDesktopTerminalSession(sessionId: string, data: string) {
  return sessions.write(sessionId, Buffer.from(data, "base64"));
}

export function resizeDesktopTerminalSession(
  sessionId: string,
  cols: number,
  rows: number,
) {
  return sessions.resize(sessionId, cols, rows);
}

export function stopDesktopTerminalSession(sessionId: string) {
  return sessions.stop(sessionId);
}

export function shutdownTerminalRuntimeHost(): void {
  sessions.close();
}

function asPositive(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : undefined;
}
