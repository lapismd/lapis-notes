import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  hasNativeDesktopBridge: vi.fn(() => false),
  setNativeDesktopBridge: vi.fn(),
  hasNativeDesktopCapability: vi.fn(() => false),
}));

vi.mock("@lapis-notes/api", () => api);

import { registerWebAgentRuntimeBridge } from "./agent-runtime-attach";

describe("web agent-runtime attach", () => {
  beforeEach(() => {
    api.hasNativeDesktopBridge.mockReturnValue(false);
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
    (
      globalThis as {
        __LAPIS_AGENT_RUNTIME__?: { url: string; token: string };
      }
    ).__LAPIS_AGENT_RUNTIME__ = {
      url: "ws://127.0.0.1:7345",
      token: "test-token",
    };
    api.hasNativeDesktopCapability.mockReturnValue(true);
    expect(registerWebAgentRuntimeBridge()).toBe(true);
    expect(api.setNativeDesktopBridge).toHaveBeenCalledOnce();
    expect(api.hasNativeDesktopCapability("agent-runtime")).toBe(true);
  });

  it("registers the bridge before constructing AiPlugin", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/WebWorkspaceSession.svelte"),
      "utf8",
    );
    expect(source).toContain("registerWebAgentRuntimeBridge");
    expect(source.indexOf("registerWebAgentRuntimeBridge()")).toBeLessThan(
      source.indexOf("plugin: AiPlugin"),
    );
  });
});
