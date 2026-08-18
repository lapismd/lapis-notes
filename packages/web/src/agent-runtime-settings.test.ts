import { beforeEach, describe, expect, it, vi } from "vitest";

const workspaceHost = vi.hoisted(() => {
  const disposeSection = vi.fn();
  return {
    disposeSection,
    registerSettingsSection: vi.fn(() => disposeSection),
    settingsUpdate: vi.fn(),
  };
});

const attach = vi.hoisted(() => ({
  registerWebAgentRuntimeBridge: vi.fn(() => true),
}));

vi.mock("@lapis-notes/api/workspace-host", () => ({
  getWorkspaceHostBinding: () => ({
    controller: {
      registerSettingsSection: workspaceHost.registerSettingsSection,
      settings: { update: workspaceHost.settingsUpdate },
    },
  }),
}));

vi.mock("./agent-runtime-attach", () => attach);

import {
  registerWebAgentRuntimeSettings,
  resolveWebAgentRuntimeConfig,
  syncWebAgentRuntime,
  WEB_AGENT_RUNTIME_TOKEN_KEY,
  WEB_AGENT_RUNTIME_URL_KEY,
} from "./agent-runtime-settings";

function createApp(values: Record<string, string> = {}) {
  const listeners = new Map<string, (event: { key: string }) => void>();
  return {
    configuration: {
      getConfiguration: () => ({
        get: (key: string, fallback = "") => values[key] ?? fallback,
        entries: () => Object.entries(values),
      }),
      on: (event: string, listener: (payload: { key: string }) => void) => {
        listeners.set(event, listener);
        return { event };
      },
      offref: vi.fn(),
      updateConfigurationOption: vi.fn(),
    },
    plugins: {
      plugins: new Map([
        ["ai", { refreshHostRuntimes: vi.fn() }],
      ]),
    },
    emitUpdated(key: string) {
      listeners.get("updated")?.({ key });
    },
  };
}

describe("web agent-runtime settings", () => {
  it("prefers persisted URL and token over empty fallbacks", () => {
    expect(
      resolveWebAgentRuntimeConfig(
        createApp({
          [WEB_AGENT_RUNTIME_URL_KEY]: "ws://127.0.0.1:9000",
          [WEB_AGENT_RUNTIME_TOKEN_KEY]: "vault-token",
        }) as never,
      ),
    ).toEqual({
      url: "ws://127.0.0.1:9000",
      token: "vault-token",
    });
  });

  it("trims persisted values", () => {
    expect(
      resolveWebAgentRuntimeConfig(
        createApp({
          [WEB_AGENT_RUNTIME_URL_KEY]: "  ws://127.0.0.1:7345  ",
          [WEB_AGENT_RUNTIME_TOKEN_KEY]: "  secret  ",
        }) as never,
      ),
    ).toEqual({
      url: "ws://127.0.0.1:7345",
      token: "secret",
    });
  });

  it("keeps empty values when nothing is configured", () => {
    const env = import.meta.env as {
      LAPIS_AGENT_RUNTIME_URL?: string;
      LAPIS_AGENT_RUNTIME_TOKEN?: string;
    };
    vi.stubEnv("LAPIS_AGENT_RUNTIME_URL", "");
    vi.stubEnv("LAPIS_AGENT_RUNTIME_TOKEN", "");
    env.LAPIS_AGENT_RUNTIME_URL = "";
    env.LAPIS_AGENT_RUNTIME_TOKEN = "";
    expect(resolveWebAgentRuntimeConfig(createApp() as never)).toEqual({
      url: "",
      token: "",
    });
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    workspaceHost.registerSettingsSection.mockClear();
    workspaceHost.settingsUpdate.mockClear();
    workspaceHost.disposeSection.mockClear();
    attach.registerWebAgentRuntimeBridge.mockClear();
  });

  it("registers URL and token Settings fields and refreshes host runtimes", () => {
    const app = createApp({
      [WEB_AGENT_RUNTIME_URL_KEY]: "ws://127.0.0.1:7345",
      [WEB_AGENT_RUNTIME_TOKEN_KEY]: "vault-token",
    });
    const dispose = registerWebAgentRuntimeSettings(app as never);
    expect(workspaceHost.registerSettingsSection).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "web-agent-runtime",
        fields: expect.arrayContaining([
          expect.objectContaining({
            id: WEB_AGENT_RUNTIME_URL_KEY,
            presentation: "url",
          }),
          expect.objectContaining({ id: WEB_AGENT_RUNTIME_TOKEN_KEY }),
        ]),
      }),
    );
    expect(syncWebAgentRuntime(app as never)).toBe(true);
    expect(attach.registerWebAgentRuntimeBridge).toHaveBeenCalledWith({
      url: "ws://127.0.0.1:7345",
      token: "vault-token",
    });
    expect(app.plugins.plugins.get("ai")?.refreshHostRuntimes).toHaveBeenCalled();
    app.emitUpdated(WEB_AGENT_RUNTIME_URL_KEY);
    expect(attach.registerWebAgentRuntimeBridge).toHaveBeenCalledTimes(2);
    dispose();
    expect(workspaceHost.disposeSection).toHaveBeenCalledOnce();
    expect(app.configuration.offref).toHaveBeenCalledOnce();
  });
});
