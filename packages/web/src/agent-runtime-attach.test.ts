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

const host = vi.hoisted(() => ({
  createAgentRuntimeBridge: vi.fn((config: { url: string; token: string }) => ({
    runtime: "deno-desktop",
    capabilities: {
      "agent-runtime": {
        id: "agent-runtime",
        status: "available",
        provider: "lapis-ai-host",
        details: { url: config.url },
      },
    },
    dispose: vi.fn(),
  })),
  maybeRegisterAgentRuntimeBridge: vi.fn(
    (options: {
      url?: string;
      token?: string;
      hasBridge?(): boolean;
      register?(bridge: unknown): void;
    }) => {
      if (options.hasBridge?.()) return false;
      if (!options.url?.trim() || !options.token?.trim()) return false;
      options.register?.(
        host.createAgentRuntimeBridge({
          url: options.url,
          token: options.token,
        }),
      );
      return true;
    },
  ),
}));

vi.mock("@lapis-notes/api", () => api);
vi.mock("@lapismd/ai-host/client", () => host);
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
    host.createAgentRuntimeBridge.mockClear();
    host.maybeRegisterAgentRuntimeBridge.mockClear();
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

  it("replaces an existing lapis-ai-host bridge when settings change", () => {
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
    expect(host.createAgentRuntimeBridge).toHaveBeenCalledWith({
      url: "ws://127.0.0.1:8000",
      token: "next-token",
    });
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

  it("registers the env-backed bridge before constructing AiPlugin", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/WebWorkspaceSession.svelte"),
      "utf8",
    );
    expect(source).toContain("registerWebAgentRuntimeBridge");
    expect(source.indexOf("registerWebAgentRuntimeBridge()")).toBeLessThan(
      source.indexOf("plugin: AiPlugin"),
    );
    expect(source.indexOf("registerWebAgentRuntimeSettings(app)")).toBeGreaterThan(
      source.indexOf("await app.configuration.load()"),
    );
    expect(source.indexOf("syncWebAgentRuntime(app)")).toBeLessThan(
      source.indexOf("await app.plugins.loadPlugins"),
    );
  });
});
