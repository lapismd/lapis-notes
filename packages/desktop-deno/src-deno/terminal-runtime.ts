import { isAbsolute, resolve } from "node:path";
import type { TerminalSessionService } from "@lapismd/terminal-host/deno";

export const DENO_TERMINAL_COMMANDS = new Set([
  "desktop_terminal_session_create",
  "desktop_terminal_session_list",
  "desktop_terminal_session_write",
  "desktop_terminal_session_resize",
  "desktop_terminal_session_stop",
]);

type SessionFactory = (options: {
  workspace: string;
  libraryPath?: string;
}) => Promise<TerminalSessionService>;

type TerminalEvent = {
  channel: "desktop_terminal_output" | "desktop_terminal_exit";
  payload: { sessionId: string; data?: string; code?: number | null };
};

export class DenoTerminalRuntimeHost {
  readonly #services = new Map<string, Promise<TerminalSessionService>>();
  readonly #detach = new Map<string, () => void>();

  constructor(
    private readonly emit: (event: TerminalEvent) => Promise<void> | void,
    private readonly options: {
      libraryPath?: string;
      createService?: SessionFactory;
      home?: string;
    } = {},
  ) {}

  async handle(command: string, payload: Record<string, unknown> = {}) {
    if (!DENO_TERMINAL_COMMANDS.has(command)) {
      throw new Error(`Unimplemented terminal command: ${command}`);
    }
    if (command === "desktop_terminal_session_create") {
      const service = await this.#serviceFor(resolveTerminalWorkspace(payload, this.options.home));
      const created = service.create({
        cwd: trim(payload.cwd) || undefined,
        shell: trim(payload.shell) || undefined,
        cols: positive(payload.cols),
        rows: positive(payload.rows),
      });
      const detach = service.attach(created.sessionId, {
        onOutput: (chunk) => {
          void this.emit({
            channel: "desktop_terminal_output",
            payload: { sessionId: created.sessionId, data: bytesToBase64(chunk) },
          });
        },
        onExit: (code) => {
          this.#detach.get(created.sessionId)?.();
          this.#detach.delete(created.sessionId);
          void this.emit({
            channel: "desktop_terminal_exit",
            payload: { sessionId: created.sessionId, code },
          });
        },
      });
      if (detach) this.#detach.set(created.sessionId, detach);
      const snapshot = service.getRestoreBytes(created.sessionId)?.snapshot ?? new Uint8Array();
      if (snapshot.byteLength) {
        await this.emit({
          channel: "desktop_terminal_output",
          payload: {
            sessionId: created.sessionId,
            data: bytesToBase64(snapshot),
          },
        });
      }
      return created;
    }
    if (command === "desktop_terminal_session_list") {
      const services = await Promise.all(this.#services.values());
      return services.flatMap((service) => service.list());
    }
    const sessionId = required(payload.sessionId, "sessionId");
    const service = await this.#serviceForSession(sessionId);
    if (command === "desktop_terminal_session_write") {
      return { ok: service?.write(sessionId, base64ToBytes(required(payload.data, "data"))) ?? false };
    }
    if (command === "desktop_terminal_session_resize") {
      return {
        ok: service?.resize(
          sessionId,
          positive(payload.cols) ?? 120,
          positive(payload.rows) ?? 40,
        ) ?? false,
      };
    }
    const stopped = service?.stop(sessionId) ?? null;
    this.#detach.get(sessionId)?.();
    this.#detach.delete(sessionId);
    return stopped;
  }

  async shutdown(): Promise<void> {
    for (const detach of this.#detach.values()) detach();
    this.#detach.clear();
    const services = await Promise.allSettled(this.#services.values());
    this.#services.clear();
    for (const result of services) {
      if (result.status === "fulfilled") result.value.close();
    }
  }

  #serviceFor(workspace: string): Promise<TerminalSessionService> {
    const key = resolve(workspace);
    let service = this.#services.get(key);
    if (!service) {
      service = (this.options.createService ?? createDenoService)({
        workspace: key,
        libraryPath: this.options.libraryPath,
      });
      this.#services.set(key, service);
    }
    return service;
  }

  async #serviceForSession(sessionId: string): Promise<TerminalSessionService | undefined> {
    for (const service of await Promise.all(this.#services.values())) {
      if (service.list().some((session) => session.sessionId === sessionId)) return service;
    }
    return undefined;
  }
}

export function resolveTerminalWorkspace(
  payload: Record<string, unknown>,
  home = Deno.env.get("HOME") ?? Deno.env.get("USERPROFILE") ?? Deno.cwd(),
): string {
  const workspace = trim(payload.workspace);
  if (workspace) return resolve(workspace);
  const cwd = trim(payload.cwd);
  if (cwd && isAbsolute(cwd)) return resolve(cwd);
  return resolve(home);
}

async function createDenoService(options: {
  workspace: string;
  libraryPath?: string;
}): Promise<TerminalSessionService> {
  const { createDenoTerminalSessionService } = await import("@lapismd/terminal-host/deno");
  return createDenoTerminalSessionService(options);
}

function trim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function required(value: unknown, name: string): string {
  const text = trim(value);
  if (!text) throw new Error(`${name} is required`);
  return text;
}

function positive(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : undefined;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}
