import {
  AppToolRegistry,
  type AppTool,
  type AppToolOwner,
} from "@lapis-notes/api/agent-tools";
import type {
  NativeAgentToolCall,
  NativeAgentToolCancel,
  NativeDesktopBridge,
  NativeDesktopCapability,
} from "@lapis-notes/api/desktop-native";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppToolHost } from "./app-tool-host";
import { DesktopAppToolBridge } from "./desktop-app-tool-bridge";

const native = vi.hoisted(() => ({
  bridge: null as NativeDesktopBridge | null,
  capability: null as NativeDesktopCapability | null,
}));

vi.mock("@lapis-notes/api/desktop-native", () => ({
  getNativeDesktopBridge: () => native.bridge,
  getNativeDesktopCapability: () => native.capability,
}));

const owner: AppToolOwner = {
  pluginId: "markdown",
  source: "core",
  provenance: "bundled",
};

function tool(
  name: string,
  options: Partial<AppTool<Record<string, unknown>>> = {},
): AppTool<Record<string, unknown>> {
  return {
    name,
    description: `Run ${name}`,
    inputSchema: { type: "object" },
    effect: "read",
    execute: async () => ({ content: [{ type: "text", text: "done" }] }),
    ...options,
  };
}

function fixture() {
  const registry = new AppToolRegistry();
  const host = new AppToolHost(registry, () => ({
    appToolsEnabled: true,
    disabledAppToolNames: [],
    enabledAppToolNames: [],
    enabledCommunityToolPluginIds: [],
  }));
  const coordinator = new DesktopAppToolBridge(host);
  return { coordinator, host, registry };
}

function capableBridge(appTools = "stdio-mcp") {
  let emitCall: ((call: NativeAgentToolCall) => void) | undefined;
  let emitCancel: ((cancel: NativeAgentToolCancel) => void) | undefined;
  const invoke = vi.fn(async (command: string) => {
    if (command === "desktop_agent_tools_open") {
      return { bridgeId: "bridge-1" };
    }
    return null;
  });
  const bridge = {
    runtime: "deno-desktop",
    capabilities: {},
    invoke,
    toFileUrl: (path: string) => path,
    onAgentToolCall(listener: (call: NativeAgentToolCall) => void) {
      emitCall = listener;
      return () => {
        emitCall = undefined;
      };
    },
    onAgentToolCancel(listener: (cancel: NativeAgentToolCancel) => void) {
      emitCancel = listener;
      return () => {
        emitCancel = undefined;
      };
    },
  } as NativeDesktopBridge;
  native.bridge = bridge;
  native.capability = {
    id: "agent-runtime",
    status: "available",
    details: { protocolVersion: 3, appTools },
  };
  return {
    invoke,
    emitCall: (call: NativeAgentToolCall) => emitCall?.(call),
    emitCancel: (cancel: NativeAgentToolCancel) => emitCancel?.(cancel),
  };
}

describe("DesktopAppToolBridge", () => {
  afterEach(() => {
    native.bridge = null;
    native.capability = null;
  });

  it("executes calls, projects approvals, and retains only a binding grant", async () => {
    const bridge = capableBridge();
    const { coordinator, host, registry } = fixture();
    const execute = vi.fn(async () => ({
      content: [{ type: "text" as const, text: "patched" }],
    }));
    registry.register(
      owner,
      tool("notes_patch", {
        effect: "write",
        describeApproval: async () => ({
          title: "Patch note",
          path: "Notes/a.md",
          diff: { before: "old", after: "new" },
        }),
        execute,
      }),
    );
    const events: Array<{ bindingId: string; event: { type: string } }> = [];
    coordinator.subscribe((event) => events.push(event));
    const session = await coordinator.prepare({
      conversationId: "conversation-1",
      agentBindingId: "binding-1",
      scopeDir: "Notes",
      runtimeSupportsAppTools: true,
    });
    expect(session).toMatchObject({
      bridgeId: "bridge-1",
      status: "available",
      tools: [{ name: "notes_patch" }],
    });

    bridge.emitCall({
      bridgeId: "bridge-1",
      bindingId: "binding-1",
      callId: "call-1",
      name: "notes_patch",
      input: { path: "Notes/a.md" },
    });
    await vi.waitFor(() =>
      expect(events.map(({ event }) => event.type)).toContain(
        "permission.request",
      ),
    );
    const approval = events.find(
      ({ event }) => event.type === "permission.request",
    )?.event as { request?: { id?: string; origin?: string } } | undefined;
    expect(approval?.request?.origin).toBe("app-tool");
    expect(
      coordinator.respondToApproval(
        String(approval?.request?.id),
        "allow-session",
      ),
    ).toBe(true);
    await vi.waitFor(() => expect(execute).toHaveBeenCalledTimes(1));
    await vi.waitFor(() =>
      expect(bridge.invoke).toHaveBeenCalledWith(
        "desktop_agent_tools_respond",
        expect.objectContaining({ callId: "call-1", result: expect.any(Object) }),
      ),
    );

    bridge.emitCall({
      bridgeId: "bridge-1",
      bindingId: "binding-1",
      callId: "call-2",
      name: "notes_patch",
      input: { path: "Notes/a.md" },
    });
    await vi.waitFor(() => expect(execute).toHaveBeenCalledTimes(2));
    expect(
      events.filter(({ event }) => event.type === "permission.request"),
    ).toHaveLength(1);

    await coordinator.closeBinding("binding-1");
    expect(host.getSession("binding-1")).toBeUndefined();
    await coordinator.close();
    host.close();
  });

  it("opens application tools through the Deno HTTP MCP transport", async () => {
    const bridge = capableBridge("http-mcp");
    const { coordinator, host, registry } = fixture();
    registry.register(owner, tool("notes_read"));

    await expect(
      coordinator.prepare({
        conversationId: "conversation-1",
        agentBindingId: "binding-1",
        scopeDir: "Notes",
        runtimeSupportsAppTools: true,
      }),
    ).resolves.toMatchObject({
      bridgeId: "bridge-1",
      status: "available",
      tools: [{ name: "notes_read" }],
    });
    expect(bridge.invoke).toHaveBeenCalledWith(
      "desktop_agent_tools_open",
      expect.objectContaining({ bindingId: "binding-1" }),
    );

    await coordinator.close();
    host.close();
  });

  it("cancels in-flight execution when the shim cancels the call", async () => {
    const bridge = capableBridge();
    const { coordinator, host, registry } = fixture();
    registry.register(
      owner,
      tool("notes_read", {
        execute: async (_input, context) =>
          new Promise((_resolve, reject) => {
            context.signal.addEventListener(
              "abort",
              () => reject(new Error("private cancellation detail")),
              { once: true },
            );
          }),
      }),
    );
    await coordinator.prepare({
      conversationId: "conversation-1",
      agentBindingId: "binding-1",
      scopeDir: "Notes",
      runtimeSupportsAppTools: true,
    });
    bridge.emitCall({
      bridgeId: "bridge-1",
      bindingId: "binding-1",
      callId: "call-1",
      name: "notes_read",
      input: {},
    });
    bridge.emitCancel({
      bridgeId: "bridge-1",
      bindingId: "binding-1",
      callId: "call-1",
    });
    await vi.waitFor(() =>
      expect(bridge.invoke).toHaveBeenCalledWith(
        "desktop_agent_tools_respond",
        expect.objectContaining({
          error: expect.objectContaining({ code: "cancelled" }),
        }),
      ),
    );
    expect(JSON.stringify(bridge.invoke.mock.calls)).not.toContain(
      "private cancellation detail",
    );
    await coordinator.close();
    host.close();
  });

  it("gates protocol-v2 hosts without opening a bridge", async () => {
    const bridge = capableBridge();
    native.capability = {
      id: "agent-runtime",
      status: "available",
      details: { protocolVersion: 2 },
    };
    const { coordinator, host, registry } = fixture();
    registry.register(owner, tool("notes_read"));
    await expect(
      coordinator.prepare({
        conversationId: "conversation-1",
        agentBindingId: "binding-1",
        scopeDir: "Notes",
        runtimeSupportsAppTools: true,
      }),
    ).resolves.toMatchObject({
      status: "host-upgrade-required",
      tools: [],
      unavailableReason: expect.stringContaining("protocol v3"),
    });
    expect(bridge.invoke).not.toHaveBeenCalled();
    await coordinator.close();
    host.close();
  });
});
