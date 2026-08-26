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
    await session.prompt("continue");
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
    const startPayload = (invoke.mock.calls[0] as unknown as [
      string,
      Record<string, unknown>,
    ])[1];
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
});
