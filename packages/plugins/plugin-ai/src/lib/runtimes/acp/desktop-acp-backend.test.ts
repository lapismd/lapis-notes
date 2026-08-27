import type {
  NativeAgentRuntimeEvent,
  NativeDesktopBridge,
} from "@lapis-notes/api/desktop-native";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AcpPermissionRequestLike } from "./acp-event-mapper";
import { DesktopAcpRuntimeBackend } from "./desktop-acp-backend";

const native = vi.hoisted(() => ({
  bridge: null as NativeDesktopBridge | null,
}));

vi.mock("@lapis-notes/api/desktop-native", () => ({
  getNativeDesktopBridge: () => native.bridge,
  getNativeDesktopCapability: (id: string) =>
    native.bridge?.capabilities?.[id as "agent-runtime"] ?? null,
  hasNativeDesktopCapability: (id: string) =>
    native.bridge?.capabilities?.[id as "agent-runtime"]?.status ===
    "available",
}));

describe("DesktopAcpRuntimeBackend protocol v2", () => {
  afterEach(() => {
    native.bridge = null;
  });

  it("forwards the provider-neutral restricted session contract", async () => {
    const invoke = vi.fn(
      async (command: string, payload?: Record<string, unknown>) =>
        command === "desktop_agent_acp_start"
          ? { sessionId: String(payload?.sessionId) }
          : null,
    );
    native.bridge = {
      runtime: "deno-desktop",
      capabilities: {
        "agent-runtime": {
          id: "agent-runtime",
          status: "available",
          details: { protocolVersion: 4, deferredStart: true },
        },
      },
      invoke,
      toFileUrl: (path) => path,
      onAgentRuntimeEvent() {
        return () => {};
      },
    } as NativeDesktopBridge;

    const session = await new DesktopAcpRuntimeBackend().start({
      request: {
        prompt: "",
        agent: "codex",
        restricted: true,
        mcpServers: [],
      },
      onPermissionRequest: vi.fn(),
    });

    expect(invoke).toHaveBeenCalledWith(
      "desktop_agent_acp_start",
      expect.objectContaining({
        restricted: true,
        workspace: undefined,
        mcpServers: [],
        appToolBridgeId: undefined,
      }),
    );
    await session.close();
  });

  it("forwards structured session configuration on protocol v5", async () => {
    const invoke = vi.fn(
      async (command: string, payload?: Record<string, unknown>) => {
        if (command === "desktop_agent_acp_start") {
          return { sessionId: String(payload?.sessionId) };
        }
        if (command === "desktop_agent_acp_configure") {
          return {
            model: { status: "applied" },
            thinking: { status: "applied" },
          };
        }
        return null;
      },
    );
    native.bridge = {
      runtime: "deno-desktop",
      capabilities: {
        "agent-runtime": {
          id: "agent-runtime",
          status: "available",
          details: { protocolVersion: 5, deferredStart: true },
        },
      },
      invoke,
      toFileUrl: (path) => path,
      onAgentRuntimeEvent() {
        return () => {};
      },
    } as NativeDesktopBridge;
    const session = await new DesktopAcpRuntimeBackend().start({
      request: { prompt: "", agent: "codex" },
      onPermissionRequest: vi.fn(),
    });

    await expect(
      session.configure?.({
        model: { provider: "codex", model: "gpt-next" },
        thinking: "high",
      }),
    ).resolves.toEqual({
      model: { status: "applied" },
      thinking: { status: "applied" },
    });
    expect(invoke).toHaveBeenCalledWith("desktop_agent_acp_configure", {
      sessionId: session.id,
      model: { provider: "codex", model: "gpt-next" },
      thinking: "high",
    });
    await session.close();
  });

  it("reports configuration as unsupported below protocol v5", async () => {
    const invoke = vi.fn(
      async (command: string, payload?: Record<string, unknown>) =>
        command === "desktop_agent_acp_start"
          ? { sessionId: String(payload?.sessionId) }
          : null,
    );
    native.bridge = {
      runtime: "deno-desktop",
      capabilities: {
        "agent-runtime": {
          id: "agent-runtime",
          status: "available",
          details: { protocolVersion: 4, deferredStart: true },
        },
      },
      invoke,
      toFileUrl: (path) => path,
      onAgentRuntimeEvent() {
        return () => {};
      },
    } as NativeDesktopBridge;
    const session = await new DesktopAcpRuntimeBackend().start({
      request: { prompt: "", agent: "codex" },
      onPermissionRequest: vi.fn(),
    });

    await expect(
      session.configure?.({
        model: { provider: "codex", model: "gpt-next" },
      }),
    ).resolves.toEqual({
      model: {
        status: "unsupported",
      },
    });
    expect(invoke).not.toHaveBeenCalledWith(
      "desktop_agent_acp_configure",
      expect.anything(),
    );
    await session.close();
  });

  it("uses the negotiated browser-attach configuration capability on protocol v4", async () => {
    const invoke = vi.fn(
      async (command: string, payload?: Record<string, unknown>) => {
        if (command === "desktop_agent_acp_start") {
          return { sessionId: String(payload?.sessionId) };
        }
        if (command === "desktop_agent_acp_configure") {
          return { model: { status: "applied" } };
        }
        return null;
      },
    );
    native.bridge = {
      runtime: "deno-desktop",
      capabilities: {
        "agent-runtime": {
          id: "agent-runtime",
          status: "available",
          details: {
            protocolVersion: 4,
            deferredStart: true,
            sessionConfiguration: "configure",
          },
        },
      },
      invoke,
      toFileUrl: (path) => path,
      onAgentRuntimeEvent() {
        return () => {};
      },
    } as NativeDesktopBridge;
    const session = await new DesktopAcpRuntimeBackend().start({
      request: { prompt: "", agent: "codex" },
      onPermissionRequest: vi.fn(),
    });

    await expect(
      session.configure?.({
        model: { provider: "codex", model: "gpt-next" },
      }),
    ).resolves.toEqual({ model: { status: "applied" } });
    expect(invoke).toHaveBeenCalledWith("desktop_agent_acp_configure", {
      sessionId: session.id,
      model: { provider: "codex", model: "gpt-next" },
      thinking: undefined,
    });
    await session.close();
  });

  it("unwraps sequenced events and permissions with stable provenance", async () => {
    let emit!: (event: NativeAgentRuntimeEvent) => void;
    const invoke = vi.fn(async (command: string) => {
      if (command === "desktop_agent_acp_start") {
        return { sessionId: "session-1" };
      }
      if (command === "desktop_agent_acp_prompt") return { runId: "run-1" };
      return null;
    });
    native.bridge = {
      runtime: "deno-desktop",
      capabilities: {
        "agent-runtime": {
          id: "agent-runtime",
          status: "available",
          details: { protocolVersion: 3 },
        },
      },
      invoke,
      toFileUrl: (path) => path,
      onAgentRuntimeEvent(listener) {
        emit = listener;
        return () => {};
      },
    } as NativeDesktopBridge;
    const onPermissionRequest = vi.fn(
      async (_request: AcpPermissionRequestLike) => ({
        outcome: "allow_once" as const,
      }),
    );
    const session = await new DesktopAcpRuntimeBackend().start({
      request: {
        prompt: "",
        agent: "codex",
        mcpServers: [{ name: "external", command: "external-mcp" }],
        appToolSession: {
          conversationId: "conversation-1",
          agentBindingId: "binding-1",
          scopeDir: "",
          tools: [],
          bridgeId: "bridge-1",
        },
      },
      onPermissionRequest,
    });
    expect(invoke).toHaveBeenCalledWith(
      "desktop_agent_acp_start",
      expect.objectContaining({
        mcpServers: [{ name: "external", command: "external-mcp" }],
        appToolBridgeId: "bridge-1",
      }),
    );
    const iterator = session.events()[Symbol.asyncIterator]();
    const text = iterator.next();
    emit({
      sessionId: "session-1",
      runId: "run-1",
      sequence: 1,
      event: {
        type: "event",
        event: { type: "text_delta", text: "hello" },
      },
    });
    await expect(text).resolves.toEqual({
      done: false,
      value: {
        type: "text_delta",
        text: "hello",
        __source: { sessionId: "session-1", runId: "run-1", sequence: 1 },
      },
    });

    emit({
      sessionId: "session-1",
      runId: "run-1",
      sequence: 2,
      event: {
        type: "permission",
        request: { requestId: "approval-1", toolName: "shell" },
      },
    });
    await expect.poll(() => onPermissionRequest.mock.calls.length).toBe(1);
    expect(onPermissionRequest.mock.calls[0]?.[0]).toMatchObject({
      requestId: "approval-1",
      __source: { sessionId: "session-1", runId: "run-1", sequence: 2 },
    });
    await expect.poll(() => invoke.mock.calls.length).toBeGreaterThan(1);
    const continued = iterator.next();
    await session.prompt("continue");
    emit({
      sessionId: "session-1",
      runId: "run-1",
      sequence: 1,
      event: {
        type: "event",
        event: { type: "text_delta", text: "again" },
      },
    });
    await expect(continued).resolves.toMatchObject({
      done: false,
      value: { type: "text_delta", text: "again" },
    });
    await session.close();
  });

  it("uses the legacy external-server field and omits app tools on protocol v2", async () => {
    const invoke = vi.fn(async (command: string) =>
      command === "desktop_agent_acp_start"
        ? { sessionId: "session-v2" }
        : null,
    );
    native.bridge = {
      runtime: "deno-desktop",
      capabilities: {
        "agent-runtime": {
          id: "agent-runtime",
          status: "available",
          details: { protocolVersion: 2 },
        },
      },
      invoke,
      toFileUrl: (path) => path,
    } as NativeDesktopBridge;

    const session = await new DesktopAcpRuntimeBackend().start({
      request: {
        prompt: "",
        mcpServers: [{ name: "external", command: "external-mcp" }],
        appToolSession: {
          conversationId: "conversation-1",
          agentBindingId: "binding-1",
          scopeDir: "",
          tools: [],
          bridgeId: "bridge-1",
        },
      },
      onPermissionRequest: async () => ({ outcome: "reject_once" }),
    });

    expect(invoke).toHaveBeenCalledWith(
      "desktop_agent_acp_start",
      expect.objectContaining({
        tools: [{ name: "external", command: "external-mcp" }],
      }),
    );
    const startPayload = (
      invoke.mock.calls[0] as unknown as [string, Record<string, unknown>]
    )[1];
    expect(startPayload).not.toHaveProperty("appToolBridgeId");
    await session.close();
  });

  it("subscribes before deferred start and keeps pending lifecycle commands usable", async () => {
    let emit!: (event: NativeAgentRuntimeEvent) => void;
    let subscribed = false;
    const invoke = vi.fn(
      async (command: string, payload?: Record<string, unknown>) => {
        if (command === "desktop_agent_acp_start") {
          expect(subscribed).toBe(true);
          const sessionId = String(payload?.sessionId ?? "");
          expect(sessionId).toBeTruthy();
          emit({
            sessionId,
            runId: "session",
            sequence: 1,
            event: {
              type: "event",
              event: { type: "error", message: "startup failed" },
            },
          });
          return { sessionId };
        }
        if (command === "desktop_agent_acp_prompt") {
          return { runId: "pending-run" };
        }
        return null;
      },
    );
    native.bridge = {
      runtime: "deno-desktop",
      capabilities: {
        "agent-runtime": {
          id: "agent-runtime",
          status: "available",
          details: { protocolVersion: 3, deferredStart: true },
        },
      },
      invoke,
      toFileUrl: (path) => path,
      onAgentRuntimeEvent(listener) {
        subscribed = true;
        emit = listener;
        return () => {
          subscribed = false;
        };
      },
    } as NativeDesktopBridge;

    const session = await new DesktopAcpRuntimeBackend().start({
      request: { prompt: "", agent: "cursor" },
      onPermissionRequest: async () => ({ outcome: "reject_once" }),
    });
    const event = session.events()[Symbol.asyncIterator]().next();
    await expect(event).resolves.toMatchObject({
      done: false,
      value: {
        type: "error",
        message: "startup failed",
        __source: { sessionId: session.id, sequence: 1 },
      },
    });

    await session.prompt("hello");
    await session.cancel();
    await session.close();
    expect(invoke).toHaveBeenNthCalledWith(
      1,
      "desktop_agent_acp_start",
      expect.objectContaining({ sessionId: session.id }),
    );
    expect(invoke.mock.calls.map(([command]) => command)).toEqual([
      "desktop_agent_acp_start",
      "desktop_agent_acp_prompt",
      "desktop_agent_acp_cancel",
      "desktop_agent_acp_close",
    ]);
  });

  it("recovers an omitted terminal stream event from protocol-v4 run status", async () => {
    vi.useFakeTimers();
    try {
      let emit!: (event: NativeAgentRuntimeEvent) => void;
      const retained: NativeAgentRuntimeEvent[] = [
        {
          sessionId: "session-v4",
          runId: "run-v4",
          sequence: 1,
          event: {
            type: "event",
            event: { type: "text_delta", text: "complete output" },
          },
        },
        {
          sessionId: "session-v4",
          runId: "run-v4",
          sequence: 2,
          event: {
            type: "event",
            event: { type: "done", stopReason: "completed" },
          },
        },
      ];
      const invoke = vi.fn(async (command: string) => {
        if (command === "desktop_agent_acp_start") {
          return { sessionId: "session-v4" };
        }
        if (command === "desktop_agent_acp_prompt") {
          return { runId: "run-v4" };
        }
        if (command === "desktop_agent_acp_status") {
          return {
            sessionId: "session-v4",
            runId: "run-v4",
            sequence: 2,
            state: "terminal",
            events: retained,
            terminalEvent: retained[1],
          };
        }
        return null;
      });
      native.bridge = {
        runtime: "deno-desktop",
        capabilities: {
          "agent-runtime": {
            id: "agent-runtime",
            status: "available",
            details: { protocolVersion: 4, runStatus: true },
          },
        },
        invoke,
        toFileUrl: (path) => path,
        onAgentRuntimeEvent(listener) {
          emit = listener;
          return () => {};
        },
      } as NativeDesktopBridge;
      const session = await new DesktopAcpRuntimeBackend().start({
        request: { prompt: "", agent: "codex" },
        onPermissionRequest: async () => ({ outcome: "reject_once" }),
      });
      const iterator = session.events()[Symbol.asyncIterator]();

      await session.prompt("hello");
      emit(retained[1]!);
      await vi.advanceTimersByTimeAsync(1_000);

      await expect(iterator.next()).resolves.toMatchObject({
        done: false,
        value: { type: "text_delta", text: "complete output" },
      });
      await expect(iterator.next()).resolves.toMatchObject({
        done: false,
        value: { type: "done", stopReason: "completed" },
      });
      emit(retained[1]!);
      await session.close();
      await expect(iterator.next()).resolves.toEqual({
        done: true,
        value: undefined,
      });
      expect(
        invoke.mock.calls.filter(
          ([command]) => command === "desktop_agent_acp_status",
        ),
      ).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("turns bounded protocol-v4 status failures into a terminal error", async () => {
    vi.useFakeTimers();
    try {
      const invoke = vi.fn(async (command: string) => {
        if (command === "desktop_agent_acp_start") {
          return { sessionId: "session-failed-status" };
        }
        if (command === "desktop_agent_acp_prompt") {
          return { runId: "run-failed-status" };
        }
        if (command === "desktop_agent_acp_status") {
          throw new Error("binding unavailable");
        }
        return null;
      });
      native.bridge = {
        runtime: "deno-desktop",
        capabilities: {
          "agent-runtime": {
            id: "agent-runtime",
            status: "available",
            details: { protocolVersion: 4, runStatus: true },
          },
        },
        invoke,
        toFileUrl: (path) => path,
        onAgentRuntimeEvent: () => () => {},
      } as NativeDesktopBridge;
      const session = await new DesktopAcpRuntimeBackend().start({
        request: { prompt: "", agent: "codex" },
        onPermissionRequest: async () => ({ outcome: "reject_once" }),
      });
      const next = session.events()[Symbol.asyncIterator]().next();

      await session.prompt("hello");
      await vi.advanceTimersByTimeAsync(3_000);

      await expect(next).resolves.toMatchObject({
        done: false,
        value: {
          type: "error",
          message: "The desktop agent status channel became unavailable.",
        },
      });
      await session.close();
    } finally {
      vi.useRealTimers();
    }
  });
});
