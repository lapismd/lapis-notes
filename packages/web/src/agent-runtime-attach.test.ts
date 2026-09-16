import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  hasNativeDesktopBridge: vi.fn(() => false),
  getNativeDesktopBridge: vi.fn(() => null as unknown),
  getNativeDesktopCapability: vi.fn(() => null as unknown),
  setNativeDesktopBridge: vi.fn(),
  hasNativeDesktopCapability: vi.fn((_capability: string) => false),
}));

vi.mock("@lapis-notes/api", () => api);
vi.mock("@lapismd/terminal-host/client", () => ({
  createTerminalRuntimeBridge: vi.fn(),
}));

import { registerWebAgentRuntimeBridge } from "./agent-runtime-attach";
import { resetWebRuntimeCompose } from "./web-runtime-compose";

describe("web agent-runtime attach", () => {
  beforeEach(() => {
    resetWebRuntimeCompose();
    api.hasNativeDesktopBridge.mockReturnValue(false);
    api.getNativeDesktopBridge.mockReturnValue(null);
    api.getNativeDesktopCapability.mockReturnValue(null);
    api.hasNativeDesktopCapability.mockReturnValue(false);
    api.setNativeDesktopBridge.mockReset();
    delete (globalThis as { __LAPIS_AGENT_RUNTIME__?: unknown })
      .__LAPIS_AGENT_RUNTIME__;
  });

  it("does not advertise agent-runtime without a URL and token", () => {
    expect(registerWebAgentRuntimeBridge()).toBe(false);
    expect(api.setNativeDesktopBridge).not.toHaveBeenCalled();
    expect(api.hasNativeDesktopCapability("agent-runtime")).toBe(false);
  });

  it("registers a bridge when a test double URL and token are set", () => {
    api.hasNativeDesktopCapability.mockReturnValue(true);
    expect(
      registerWebAgentRuntimeBridge({
        url: "ws://127.0.0.1:7345",
        token: "test-token",
      }),
    ).toBe(true);
    expect(api.setNativeDesktopBridge).toHaveBeenCalledOnce();
    expect(api.hasNativeDesktopCapability("agent-runtime")).toBe(true);
  });

  it("replaces an existing lapis-ai-host bridge when settings change", async () => {
    const previous = { dispose: vi.fn() };
    api.hasNativeDesktopBridge.mockReturnValue(true);
    api.getNativeDesktopBridge.mockReturnValue(previous);
    api.getNativeDesktopCapability.mockReturnValue({
      provider: "lapis-ai-host",
    });
    expect(
      registerWebAgentRuntimeBridge({
        url: "ws://127.0.0.1:8000",
        token: "next-token",
      }),
    ).toBe(true);
    expect(previous.dispose).toHaveBeenCalledOnce();
    const bridge = api.setNativeDesktopBridge.mock.calls.at(-1)![0];
    expect(await bridge.invoke("desktop_ai_controller_connection")).toEqual({ url: "ws://127.0.0.1:8000", token: "next-token", workspace: "default" });
    expect(JSON.stringify(bridge.capabilities)).not.toContain("next-token");
    await expect(bridge.invoke("desktop_agent_process_spawn")).rejects.toThrow("Unsupported");
    expect(api.setNativeDesktopBridge).toHaveBeenCalledOnce();
  });

  it("detaches a lapis-ai-host bridge when URL or token is cleared", () => {
    const previous = { dispose: vi.fn() };
    api.hasNativeDesktopBridge.mockReturnValue(true);
    api.getNativeDesktopBridge.mockReturnValue(previous);
    api.getNativeDesktopCapability.mockReturnValue({
      provider: "lapis-ai-host",
    });
    expect(registerWebAgentRuntimeBridge({ url: "", token: "" })).toBe(false);
    expect(previous.dispose).toHaveBeenCalledOnce();
    expect(api.setNativeDesktopBridge).toHaveBeenCalledWith(null);
  });

  it("does not overwrite a desktop IPC bridge", () => {
    api.hasNativeDesktopBridge.mockReturnValue(true);
    api.getNativeDesktopCapability.mockReturnValue({
      provider: "deno-desktop",
    });
    expect(
      registerWebAgentRuntimeBridge({
        url: "ws://127.0.0.1:7345",
        token: "test-token",
      }),
    ).toBe(false);
    expect(api.setNativeDesktopBridge).not.toHaveBeenCalled();
  });

  it("registers the env-backed bridge before loading configured plugins", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/WebWorkspaceSession.svelte"),
      "utf8",
    );
    expect(source).toContain("registerWebAgentRuntimeBridge");
    expect(source.indexOf("registerWebAgentRuntimeBridge()")).toBeLessThan(
      source.indexOf("app.plugins.registerStaticPlugins(notesPluginProfile)"),
    );
    expect(source.indexOf("registerWebAgentRuntimeSettings(app)")).toBeGreaterThan(
      source.indexOf("await app.configuration.load()"),
    );
    expect(source.indexOf("syncWebAgentRuntime(app)")).toBeLessThan(
      source.indexOf("await app.plugins.loadPlugins"),
    );
  });
});
