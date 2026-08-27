import { describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  ToolBridgeBroker,
  createAgentRuntimeExecutor,
  type AcpMcpServer,
  type AgentHostSink,
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
    expect(DENO_AGENT_COMMANDS).toContain("desktop_agent_acp_configure");
  });

  it("forwards provider-neutral ACP configuration to AI Host", async () => {
    const executor = {
      configureAcpSession: vi.fn(async () => ({
        model: { status: "applied" },
      })),
      disconnectConnection: vi.fn(),
      close: vi.fn(async () => {}),
    };
    const host = new DenoAgentRuntimeHost(
      vi.fn(async () => undefined),
      executor as never,
    );

    await expect(
      host.handle("desktop_agent_acp_configure", {
        sessionId: "session-1",
        model: { provider: "codex", model: "gpt-next" },
      }),
    ).resolves.toEqual({ model: { status: "applied" } });
    expect(executor.configureAcpSession).toHaveBeenCalledWith({
      sessionId: "session-1",
      model: { provider: "codex", model: "gpt-next" },
      thinking: undefined,
    });
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
        restricted: true,
      }),
    ).toEqual({ sessionId: "session-1" });
    expect(executor.startAcpSessionDeferred).toHaveBeenCalledWith(
      expect.objectContaining({ connectionId: "deno-renderer:main" }),
      expect.objectContaining({
        sessionId: "session-1",
        agent: "cursor",
        restricted: true,
      }),
    );
  });

  it("acknowledges ACP prompts and retains their terminal status", () => {
    let sink: AgentHostSink | undefined;
    const executor = {
      promptAcpSessionDeferred: vi.fn((value) => {
        sink = value;
        return { runId: "run-1" };
      }),
      disconnectConnection: vi.fn(),
      close: vi.fn(async () => {}),
    };
    const host = new DenoAgentRuntimeHost(
      vi.fn(async () => undefined),
      executor as never,
    );

    expect(
      host.handle("desktop_agent_acp_prompt", {
        sessionId: "session-1",
        text: "hello",
      }),
    ).toEqual({ runId: "run-1" });
    expect(executor.promptAcpSessionDeferred).toHaveBeenCalledWith(
      expect.objectContaining({ connectionId: "deno-renderer:main" }),
      "session-1",
      "hello",
    );
    expect(
      host.handle("desktop_agent_acp_status", { sessionId: "session-1" }),
    ).toEqual({
      sessionId: "session-1",
      runId: "run-1",
      sequence: 0,
      state: "running",
    });

    sink?.sendRuntimeEvent({
      sessionId: "session-1",
      runId: "run-1",
      sequence: 3,
      event: {
        type: "event",
        event: { type: "done", stopReason: "completed" },
      },
    });

    expect(
      host.handle("desktop_agent_acp_status", { sessionId: "session-1" }),
    ).toMatchObject({
      sessionId: "session-1",
      runId: "run-1",
      sequence: 3,
      state: "terminal",
      terminalEvent: {
        event: { event: { type: "done" } },
      },
    });

    executor.promptAcpSessionDeferred.mockReturnValueOnce({ runId: "run-2" });
    expect(
      host.handle("desktop_agent_acp_prompt", {
        sessionId: "session-1",
        text: "again",
      }),
    ).toEqual({ runId: "run-2" });
    expect(
      host.handle("desktop_agent_acp_status", { sessionId: "session-1" }),
    ).toEqual({
      sessionId: "session-1",
      runId: "run-2",
      sequence: 0,
      state: "running",
    });
    sink?.sendRuntimeEvent({
      sessionId: "session-1",
      runId: "run-2",
      sequence: 1,
      event: {
        type: "event",
        event: { type: "text_delta", text: "second run" },
      },
    });
    expect(
      host.handle("desktop_agent_acp_status", { sessionId: "session-1" }),
    ).toEqual({
      sessionId: "session-1",
      runId: "run-2",
      sequence: 1,
      state: "running",
    });
  });

  it("returns before deferred model discovery starts and emits its result", async () => {
    vi.useFakeTimers();
    try {
      const emit = vi.fn(async () => undefined);
      const listAcpModels = vi.fn(async () => ({
        agent: "codex",
        currentModel: "gpt-5.6-sol",
        models: ["gpt-5.6-sol"],
        entries: [{ id: "gpt-5.6-sol", label: "GPT-5.6-Sol" }],
      }));
      const executor = {
        listAcpModels,
        disconnectConnection: vi.fn(),
        close: vi.fn(async () => {}),
      };
      const host = new DenoAgentRuntimeHost(emit, executor as never);

      expect(
        host.handle("desktop_agent_acp_models", {
          requestId: "catalog-request-1",
          agent: "codex",
        }),
      ).toEqual({ requestId: "catalog-request-1" });
      await Promise.resolve();
      expect(listAcpModels).not.toHaveBeenCalled();

      await vi.runOnlyPendingTimersAsync();
      await vi.waitFor(() => expect(emit).toHaveBeenCalledOnce());
      expect(emit).toHaveBeenCalledWith({
        channel: "desktop_agent_runtime_event",
        payload: expect.objectContaining({
          sessionId: "catalog-request-1",
          runId: "model-catalog",
          event: {
            type: "event",
            event: {
              type: "model_catalog",
              catalog: expect.objectContaining({
                agent: "codex",
                models: ["gpt-5.6-sol"],
              }),
            },
          },
        }),
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("serves attached app tools while deferred ACP initialization is pending", async () => {
    const broker = new ToolBridgeBroker({
      externalHttpBaseUrl: "http://127.0.0.1:61776/__lapis/agent-tools/",
    });
    let contribution: Extract<AcpMcpServer, { type: "http" }> | undefined;
    let startReturned = false;
    let initializationStarted = false;
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
        initializationStarted = true;
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
    expect(initializationStarted).toBe(false);
    await Promise.resolve();
    expect(initializationStarted).toBe(false);
    startReturned = true;
    expect(started).toEqual({ sessionId: "session-with-tools" });
    await expect.poll(() => listed).toBe(true);
    await host.shutdown();
  });
});
