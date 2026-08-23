import { describe, expect, it, vi } from "vitest";

import {
  DENO_AGENT_COMMANDS,
  DenoAgentRuntimeHost,
  createDenoAgentSink,
  createDenoToolBridgeBaseUrl,
} from "./agent-runtime";

describe("Deno agent runtime", () => {
  it("attaches app tools to the Deno renderer loopback server", () => {
    expect(createDenoToolBridgeBaseUrl("tcp:127.0.0.1:61776")).toBe(
      "http://127.0.0.1:61776/__lapis/agent-tools/",
    );
  });

  it("routes public AI host events to renderer channels in order", async () => {
    const events: Array<{ channel: string; payload: unknown }> = [];
    const sink = createDenoAgentSink(async (event) => {
      events.push(event);
    });

    sink.sendProcessMessage({
      processId: "process-1",
      type: "stdout",
      data: "one",
    });
    sink.sendProcessMessage({
      processId: "process-1",
      type: "exit",
      exitCode: 0,
    });

    await vi.waitFor(() => expect(events).toHaveLength(2));
    expect(events.map((event) => event.channel)).toEqual([
      "desktop_agent_process_message",
      "desktop_agent_process_message",
    ]);
    expect(events[1]?.payload).toMatchObject({ type: "exit", exitCode: 0 });
  });

  it("delegates allowlisted process commands and rejects legacy stdio tools", () => {
    const executor = {
      spawnProcess: vi.fn(() => ({ processId: "process-1" })),
      disconnectConnection: vi.fn(),
      close: vi.fn(async () => {}),
    };
    const host = new DenoAgentRuntimeHost(
      vi.fn(async () => undefined),
      executor as never,
    );

    expect(
      host.handle("desktop_agent_process_spawn", {
        command: "/usr/bin/printf",
        args: ["ok"],
      }),
    ).toEqual({ processId: "process-1" });
    expect(executor.spawnProcess).toHaveBeenCalledOnce();
    expect(() =>
      host.handle("desktop_agent_process_spawn", {
        command: "/usr/bin/printf",
        appToolBridgeId: "bridge-1",
      }),
    ).toThrow("use ACP");
    expect(DENO_AGENT_COMMANDS).toContain("desktop_agent_tools_open");
  });
});
