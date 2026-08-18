import { homedir } from "node:os";
import { isAbsolute, resolve } from "node:path";
import type { WebContents } from "electron";
import {
  createTerminalSessionService,
  type TerminalSessionService,
} from "@lapismd/terminal-host";

const services = new Map<string, TerminalSessionService>();
const boundSenders = new WeakSet<WebContents>();

function trim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function serviceFor(workspace: string): TerminalSessionService {
  const key = resolve(workspace);
  const existing = services.get(key);
  if (existing) return existing;
  const created = createTerminalSessionService({ workspace: key });
  services.set(key, created);
  return created;
}

function serviceForSession(sessionId: string): TerminalSessionService | undefined {
  for (const service of services.values()) {
    if (service.list().some((session) => session.sessionId === sessionId)) {
      return service;
    }
  }
  return undefined;
}

function bindSender(sender: WebContents): void {
  if (boundSenders.has(sender)) return;
  boundSenders.add(sender);
  sender.once("destroyed", () => {
    boundSenders.delete(sender);
  });
}

export function resolveDesktopTerminalWorkspace(payload: Record<string, unknown>): string {
  const workspace = trim(payload.workspace);
  if (workspace) return workspace;
  const cwd = trim(payload.cwd);
  if (cwd && isAbsolute(cwd)) return cwd;
  return homedir();
}

export function createDesktopTerminalSession(
  sender: WebContents,
  payload: Record<string, unknown>,
) {
  bindSender(sender);
  const workspace = resolveDesktopTerminalWorkspace(payload);
  const sessions = serviceFor(workspace);
  const created = sessions.create({
    cwd: trim(payload.cwd) || undefined,
    shell: trim(payload.shell) || undefined,
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
  return [...services.values()].flatMap((service) => service.list());
}

export function writeDesktopTerminalSession(sessionId: string, data: string) {
  return serviceForSession(sessionId)?.write(sessionId, Buffer.from(data, "base64")) ?? false;
}

export function resizeDesktopTerminalSession(
  sessionId: string,
  cols: number,
  rows: number,
) {
  return serviceForSession(sessionId)?.resize(sessionId, cols, rows) ?? false;
}

export function stopDesktopTerminalSession(sessionId: string) {
  return serviceForSession(sessionId)?.stop(sessionId) ?? null;
}

export function shutdownTerminalRuntimeHost(): void {
  for (const service of services.values()) service.close();
  services.clear();
}

function asPositive(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : undefined;
}
