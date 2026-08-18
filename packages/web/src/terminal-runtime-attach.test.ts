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

const aiHost = vi.hoisted(() => ({
  createAgentRuntimeBridge: vi.fn((config: { url: string; token: string }) => ({
    runtime: "electron-desktop",
    capabilities: {
      "agent-runtime": {
        id: "agent-runtime",
        status: "available",
        provider: "lapis-ai-host",
        details: { url: config.url },
      },
    },
    invoke: vi.fn(),
    toFileUrl: (value: string) => value,
    dispose: vi.fn(),
  })),
}));

const host = vi.hoisted(() => ({
  createTerminalRuntimeBridge: vi.fn(
    (config: { url: string; token: string }) => ({
      runtime: "lapis-terminal-host",
      capabilities: {
        "terminal-runtime": {
          id: "terminal-runtime",
          status: "available",
          provider: "lapis-terminal-host",
          details: { url: config.url },
        },
      },
      invoke: vi.fn(),
      dispose: vi.fn(),
      onTerminalOutput: vi.fn(() => () => {}),
      onTerminalExit: vi.fn(() => () => {}),
    }),
  ),
}));

vi.mock("@lapis-notes/api", () => api);
vi.mock("@lapismd/ai-host/client", () => aiHost);
vi.mock("@lapismd/terminal-host/client", () => host);

import { registerWebAgentRuntimeBridge } from "./agent-runtime-attach";
import { registerWebTerminalRuntimeBridge } from "./terminal-runtime-attach";
import { resetWebRuntimeCompose } from "./web-runtime-compose";

describe("web terminal-runtime attach", () => {
  beforeEach(() => {
    resetWebRuntimeCompose();
    api.hasNativeDesktopBridge.mockReturnValue(false);
    api.getNativeDesktopBridge.mockReturnValue(null);
    api.getNativeDesktopCapability.mockReturnValue(null);
    api.hasNativeDesktopCapability.mockReturnValue(false);
    api.setNativeDesktopBridge.mockReset();
    host.createTerminalRuntimeBridge.mockClear();
    aiHost.createAgentRuntimeBridge.mockClear();
  });

  it("does not advertise terminal-runtime without a URL and token", () => {
    expect(registerWebTerminalRuntimeBridge()).toBe(false);
    expect(api.setNativeDesktopBridge).not.toHaveBeenCalled();
  });

  it("registers a bridge when a test double URL and token are set", () => {
    expect(
      registerWebTerminalRuntimeBridge({
        url: "ws://127.0.0.1:7346",
        token: "test-token",
      }),
    ).toBe(true);
    expect(host.createTerminalRuntimeBridge).toHaveBeenCalledWith({
      url: "ws://127.0.0.1:7346",
      token: "test-token",
    });
    expect(api.setNativeDesktopBridge).toHaveBeenCalledOnce();
  });

  it("replaces only a lapis-terminal-host contribution when settings change", () => {
    const previous = { dispose: vi.fn() };
    api.hasNativeDesktopBridge.mockReturnValue(true);
    api.getNativeDesktopBridge.mockReturnValue(previous);
    api.getNativeDesktopCapability.mockImplementation((id: string) =>
      id === "terminal-runtime" ? { provider: "lapis-terminal-host" } : null,
    );
    expect(
      registerWebTerminalRuntimeBridge({
        url: "ws://127.0.0.1:8001",
        token: "next-token",
      }),
    ).toBe(true);
    expect(previous.dispose).toHaveBeenCalledOnce();
    expect(host.createTerminalRuntimeBridge).toHaveBeenCalledWith({
      url: "ws://127.0.0.1:8001",
      token: "next-token",
    });
  });

  it("keeps an existing lapis-ai-host contribution when attaching terminal", () => {
    expect(
      registerWebAgentRuntimeBridge({
        url: "ws://127.0.0.1:7345",
        token: "ai-token",
      }),
    ).toBe(true);
    api.hasNativeDesktopBridge.mockReturnValue(true);
    api.getNativeDesktopCapability.mockImplementation((id: string) =>
      id === "agent-runtime" ? { provider: "lapis-ai-host" } : null,
    );
    expect(
      registerWebTerminalRuntimeBridge({
        url: "ws://127.0.0.1:7346",
        token: "term-token",
      }),
    ).toBe(true);
    const composed = api.setNativeDesktopBridge.mock.calls.at(-1)?.[0] as {
      capabilities?: Record<string, { provider?: string }>;
    };
    expect(composed.capabilities?.["agent-runtime"]?.provider).toBe(
      "lapis-ai-host",
    );
    expect(composed.capabilities?.["terminal-runtime"]?.provider).toBe(
      "lapis-terminal-host",
    );
  });

  it("does not overwrite a desktop IPC bridge", () => {
    api.hasNativeDesktopBridge.mockReturnValue(true);
    api.getNativeDesktopCapability.mockReturnValue({
      provider: "electron-terminal-runtime",
    });
    expect(
      registerWebTerminalRuntimeBridge({
        url: "ws://127.0.0.1:7346",
        token: "test-token",
      }),
    ).toBe(false);
    expect(api.setNativeDesktopBridge).not.toHaveBeenCalled();
  });

  it("registers the env-backed bridge before constructing TerminalPlugin", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/WebWorkspaceSession.svelte"),
      "utf8",
    );
    expect(source).toContain("registerWebTerminalRuntimeBridge");
    expect(source.indexOf("registerWebTerminalRuntimeBridge()")).toBeLessThan(
      source.indexOf("plugin: TerminalPlugin"),
    );
    expect(
      source.indexOf("registerWebTerminalRuntimeSettings(app)"),
    ).toBeGreaterThan(source.indexOf("await app.configuration.load()"));
    expect(source.indexOf("syncWebTerminalRuntime(app)")).toBeLessThan(
      source.indexOf("await app.plugins.loadPlugins"),
    );
    const vite = readFileSync(
      path.resolve(process.cwd(), "vite.config.ts"),
      "utf8",
    );
    expect(vite).toContain('assetsInclude: ["**/*.wasm"]');
    expect(vite).toContain('"ghostty-web"');
    expect(vite).toContain('"@xterm/xterm"');
    expect(vite).toContain("linkedTerminalPluginRoot");
    expect(vite).toContain("@lapis-notes/lapis-plugin-terminal");
  });
});
