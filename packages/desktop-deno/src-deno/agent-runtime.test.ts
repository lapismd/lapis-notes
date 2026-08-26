import { describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  ToolBridgeBroker,
  createAgentRuntimeExecutor,
  type AcpMcpServer,
} from "@lapismd/ai-host";

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

  it("returns a reserved ACP session without awaiting native initialization", () => {
    const executor = {
      startAcpSessionDeferred: vi.fn(() => ({ sessionId: "session-1" })),
      disconnectConnection: vi.fn(),
      close: vi.fn(async () => {}),
    };
    const host = new DenoAgentRuntimeHost(
      vi.fn(async () => undefined),
      executor as never,
    );

    expect(
      host.handle("desktop_agent_acp_start", {
        sessionId: "session-1",
        agent: "cursor",
      }),
    ).toEqual({ sessionId: "session-1" });
    expect(executor.startAcpSessionDeferred).toHaveBeenCalledWith(
      expect.objectContaining({ connectionId: "deno-renderer:main" }),
      expect.objectContaining({
        sessionId: "session-1",
        agent: "cursor",
      }),
    );
  });

  it("serves attached app tools while deferred ACP initialization is pending", async () => {
    const broker = new ToolBridgeBroker({
      externalHttpBaseUrl:
        "http://127.0.0.1:61776/__lapis/agent-tools/",
    });
    let contribution: Extract<AcpMcpServer, { type: "http" }> | undefined;
    let startReturned = false;
    let listed = false;
    let host!: DenoAgentRuntimeHost;
    const runtime = {
      async ensureSession(input) {
        if (!contribution) throw new Error("Missing attached MCP contribution");
        const transport = new StreamableHTTPClientTransport(
          new URL(contribution.url),
          {
            fetch: async (request, init) => {
              expect(startReturned).toBe(true);
              return (
                (await host.respond(new Request(request, init))) ??
                new Response(null, { status: 404 })
              );
            },
            requestInit: {
              headers: Object.fromEntries(
                (contribution.headers ?? []).map(({ name, value }) => [
                  name,
                  value,
                ]),
              ),
            },
          },
        );
        const client = new Client({ name: "deno-host-test", version: "1.0" });
        await client.connect(transport);
        listed = (await client.listTools()).tools[0]?.name === "notes_search";
        await client.close();
        return { sessionKey: input.sessionKey, backend: input.agent };
      },
      startTurn() {
        return {
          events: (async function* () {})(),
          result: Promise.resolve({ status: "completed" as const }),
        };
      },
      async cancel() {},
      async close() {},
    };
    const executor = createAgentRuntimeExecutor({
      toolBridgeBroker: broker,
      createAcpxRuntime: async (_sink, _sessionId, payload) => {
        contribution = payload.mcpServers?.find(
          (server): server is Extract<AcpMcpServer, { type: "http" }> =>
            server.type === "http" && server.name === "lapis-tools",
        );
        return runtime;
      },
    });
    host = new DenoAgentRuntimeHost(
      vi.fn(async () => undefined),
      executor,
      broker,
    );
    const opened = (await host.handle("desktop_agent_tools_open", {
      bindingId: "binding-1",
      conversationId: "conversation-1",
      descriptors: [
        {
          name: "notes_search",
          description: "Search notes",
          inputSchema: { type: "object" },
          effect: "read",
        },
      ],
    })) as { bridgeId: string };

    const started = host.handle("desktop_agent_acp_start", {
      sessionId: "session-with-tools",
      agent: "cursor",
      appToolBridgeId: opened.bridgeId,
    });
    startReturned = true;
    expect(started).toEqual({ sessionId: "session-with-tools" });
    await expect.poll(() => listed).toBe(true);
    await host.shutdown();
  });
});
