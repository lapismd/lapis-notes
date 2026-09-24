import { mkdtemp, mkdir, realpath, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { DENO_AGENT_COMMANDS, DenoAgentRuntimeHost } from "./agent-runtime";

function child() {
  return {
    connection: {
      schema: "lapis-ai-controller.ready/1" as const,
      url: "ws://127.0.0.1:1234",
      token: "private-test-token",
      workspace: "default" as const,
    },
    close: vi.fn(async () => {}),
    onExit:
      vi.fn<
        (
          listener: (
            code: number | null,
            signal: NodeJS.Signals | null,
          ) => void,
        ) => void
      >(),
  };
}
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "lapis-controller-host-"));
  const workspace = join(root, "vault");
  await mkdir(workspace);
  return {
    root,
    workspace,
    clean: () => rm(root, { recursive: true, force: true }),
  };
}
describe("Deno standalone controller connection", () => {
  it("shares startup across canonical aliases and passes only provider environment", async () => {
    const f = await fixture();
    const process = child();
    const start = vi.fn(
      async (
        _options: import("@lapismd/ai-controller/managed").ManagedControllerOptions,
      ) => process,
    );
    const host = new DenoAgentRuntimeHost({
      dataDirectory: f.root,
      start,
      env: {
        PATH: "/bin",
        HOME: f.root,
        OPENAI_API_KEY: "provider-key",
        NOSTR_PRIVATE_KEY: "secret",
        LAPIS_AI_CONTROLLER_BIN: "/controller",
      },
    });
    try {
      await symlink(f.workspace, join(f.root, "alias"));
      const connections = await Promise.all(
        [f.workspace, join(f.root, "alias")].map((workspace) =>
          host.handle("desktop_ai_controller_connection", { workspace }),
        ),
      );
      expect(connections).toEqual([process.connection, process.connection]);
      expect(connections[0]).toMatchObject({
        schema: "lapis-ai-controller.ready/1",
      });
      expect(start).toHaveBeenCalledOnce();
      const options = start.mock.calls[0]![0];
      expect(options.workspace).toBe(await realpath(f.workspace));
      expect(options.database).toMatch(
        /ai-controller[/\\][a-f0-9]{64}\.sqlite$/u,
      );
      expect(options.env).toEqual({
        PATH: "/bin",
        HOME: f.root,
        OPENAI_API_KEY: "provider-key",
      });
      expect(options.executable).toEqual({ command: "/controller" });
      expect([...DENO_AGENT_COMMANDS]).toEqual([
        "desktop_ai_controller_connection",
      ]);
      await expect(
        host.handle("desktop_agent_process_spawn", {}),
      ).rejects.toThrow("Unsupported");
    } finally {
      await host.shutdown();
      await f.clean();
    }
    expect(process.close).toHaveBeenCalledOnce();
  });
  it("retries failed startup and restarts after a child exits", async () => {
    const f = await fixture();
    const process = child();
    const next = child();
    const start = vi
      .fn()
      .mockRejectedValueOnce(new Error("unavailable"))
      .mockResolvedValueOnce(process)
      .mockResolvedValueOnce(next);
    const host = new DenoAgentRuntimeHost({
      dataDirectory: f.root,
      start,
      env: {},
    });
    try {
      await expect(
        host.handle("desktop_ai_controller_connection", {
          workspace: f.workspace,
        }),
      ).rejects.toThrow("unavailable");
      await host.handle("desktop_ai_controller_connection", {
        workspace: f.workspace,
      });
      process.onExit.mock.calls[0]![0](1, null);
      expect(
        await host.handle("desktop_ai_controller_connection", {
          workspace: f.workspace,
        }),
      ).toEqual(next.connection);
      expect(start).toHaveBeenCalledTimes(3);
    } finally {
      await host.shutdown();
      await f.clean();
    }
  });
  it("closes a pending startup and refuses new requests during shutdown", async () => {
    const f = await fixture();
    const process = child();
    let ready!: (value: typeof process) => void;
    const start = vi.fn(
      () =>
        new Promise<typeof process>((resolve) => {
          ready = resolve;
        }),
    );
    const host = new DenoAgentRuntimeHost({
      dataDirectory: f.root,
      start,
      env: {},
    });
    try {
      const pending = host.handle("desktop_ai_controller_connection", {
        workspace: f.workspace,
      });
      const rejection = expect(pending).rejects.toThrow("shutting down");
      await vi.waitFor(() => expect(start).toHaveBeenCalledOnce());
      const closed = host.shutdown();
      ready(process);
      await closed;
      await rejection;
      expect(process.close).toHaveBeenCalledOnce();
      await expect(
        host.handle("desktop_ai_controller_connection", {
          workspace: f.workspace,
        }),
      ).rejects.toThrow("shutting down");
    } finally {
      await host.shutdown();
      await f.clean();
    }
  });
  it("rejects missing or non-directory workspaces before starting a process", async () => {
    const f = await fixture();
    const start = vi.fn();
    const host = new DenoAgentRuntimeHost({
      dataDirectory: f.root,
      start,
      env: {},
    });
    try {
      await expect(
        host.handle("desktop_ai_controller_connection", {}),
      ).rejects.toThrow("workspace");
      expect(start).not.toHaveBeenCalled();
    } finally {
      await host.shutdown();
      await f.clean();
    }
  });
});
