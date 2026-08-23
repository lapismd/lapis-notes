import { describe, expect, it, vi } from "vitest";
import type {
  TerminalSessionListener,
  TerminalSessionService,
} from "@lapismd/terminal-host/deno";
import {
  DenoTerminalRuntimeHost,
  resolveTerminalWorkspace,
} from "./terminal-runtime.ts";

function createFakeService() {
  let listener: TerminalSessionListener | undefined;
  const written: Array<string | Uint8Array> = [];
  const resized: Array<[number, number]> = [];
  const summary = {
    sessionId: "session-1",
    pid: null,
    cwd: "/vault",
    cols: 80,
    rows: 24,
    status: "running" as const,
    exitCode: null,
  };
  const close = vi.fn();
  const service: TerminalSessionService = {
    create: () => ({ ...summary }),
    list: () => [{ ...summary }],
    write: (_sessionId, data) => {
      written.push(data);
      return true;
    },
    resize: (_sessionId, cols, rows) => {
      resized.push([cols, rows]);
      return true;
    },
    stop: () => {
      listener?.onExit?.(7);
      return { ...summary, status: "exited", exitCode: 7 };
    },
    attach: (_sessionId, next) => {
      listener = next;
      return () => {
        if (listener === next) listener = undefined;
      };
    },
    getRestoreBytes: () => ({ snapshot: new Uint8Array(), cols: 80, rows: 24 }),
    getRestoreSnapshot: () => ({ snapshot: "", cols: 80, rows: 24 }),
    close,
  };
  return { service, written, resized, close, output: (bytes: Uint8Array) => listener?.onOutput?.(bytes) };
}

describe("Deno terminal runtime host", () => {
  it("routes all commands, preserves output bytes, and shuts down the PTY service", async () => {
    const fake = createFakeService();
    const events: Array<{ channel: string; payload: Record<string, unknown> }> = [];
    const createService = vi.fn(async () => fake.service);
    const host = new DenoTerminalRuntimeHost(
      (event) => events.push(event as { channel: string; payload: Record<string, unknown> }),
      { createService, home: "/home/ada", libraryPath: "/native/libpty.dylib" },
    );
    const created = await host.handle("desktop_terminal_session_create", {
      workspace: "/vault",
      cwd: "notes",
      shell: "/bin/zsh",
      cols: 80,
      rows: 24,
    });
    expect(created).toMatchObject({ sessionId: "session-1" });
    expect(createService).toHaveBeenCalledWith({
      workspace: "/vault",
      libraryPath: "/native/libpty.dylib",
    });
    fake.output(new Uint8Array([0, 255, 195, 40]));
    expect([...atob(String(events[0]?.payload.data))].map((value) => value.charCodeAt(0)))
      .toEqual([0, 255, 195, 40]);
    await host.handle("desktop_terminal_session_write", {
      sessionId: "session-1",
      data: btoa(String.fromCharCode(1, 2, 3)),
    });
    expect([...(fake.written[0] as Uint8Array)]).toEqual([1, 2, 3]);
    await host.handle("desktop_terminal_session_resize", {
      sessionId: "session-1",
      cols: 100,
      rows: 30,
    });
    expect(fake.resized).toEqual([[100, 30]]);
    expect(await host.handle("desktop_terminal_session_list")).toHaveLength(1);
    await host.handle("desktop_terminal_session_stop", { sessionId: "session-1" });
    expect(events.filter((event) => event.channel === "desktop_terminal_exit"))
      .toHaveLength(1);
    await host.shutdown();
    expect(fake.close).toHaveBeenCalledOnce();
  });

  it("resolves workspace from vault, absolute cwd, then home", () => {
    expect(resolveTerminalWorkspace({ workspace: "/vault" }, "/home/ada")).toBe("/vault");
    expect(resolveTerminalWorkspace({ cwd: "/tmp/project" }, "/home/ada")).toBe("/tmp/project");
    expect(resolveTerminalWorkspace({ cwd: "notes" }, "/home/ada")).toBe("/home/ada");
  });
});
