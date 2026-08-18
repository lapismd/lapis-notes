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
  registerWebTerminalRuntimeBridge: vi.fn(() => true),
}));

vi.mock("@lapis-notes/api/workspace-host", () => ({
  getWorkspaceHostBinding: () => ({
    controller: {
      registerSettingsSection: workspaceHost.registerSettingsSection,
      settings: { update: workspaceHost.settingsUpdate },
    },
  }),
}));

vi.mock("./terminal-runtime-attach", () => attach);

import {
  registerWebTerminalRuntimeSettings,
  resolveWebTerminalRuntimeConfig,
  syncWebTerminalRuntime,
  WEB_TERMINAL_HOST_TOKEN_KEY,
  WEB_TERMINAL_HOST_URL_KEY,
} from "./terminal-runtime-settings";

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
    emitUpdated(key: string) {
      listeners.get("updated")?.({ key });
    },
  };
}

describe("web terminal-runtime settings", () => {
  it("prefers persisted URL and token over empty fallbacks", () => {
    expect(
      resolveWebTerminalRuntimeConfig(
        createApp({
          [WEB_TERMINAL_HOST_URL_KEY]: "ws://127.0.0.1:9001",
          [WEB_TERMINAL_HOST_TOKEN_KEY]: "vault-token",
        }) as never,
      ),
    ).toEqual({
      url: "ws://127.0.0.1:9001",
      token: "vault-token",
    });
  });

  it("trims persisted values", () => {
    expect(
      resolveWebTerminalRuntimeConfig(
        createApp({
          [WEB_TERMINAL_HOST_URL_KEY]: "  ws://127.0.0.1:7346  ",
          [WEB_TERMINAL_HOST_TOKEN_KEY]: "  secret  ",
        }) as never,
      ),
    ).toEqual({
      url: "ws://127.0.0.1:7346",
      token: "secret",
    });
  });

  it("keeps empty values when nothing is configured", () => {
    const env = import.meta.env as {
      LAPIS_TERMINAL_HOST_URL?: string;
      LAPIS_TERMINAL_HOST_TOKEN?: string;
    };
    vi.stubEnv("LAPIS_TERMINAL_HOST_URL", "");
    vi.stubEnv("LAPIS_TERMINAL_HOST_TOKEN", "");
    env.LAPIS_TERMINAL_HOST_URL = "";
    env.LAPIS_TERMINAL_HOST_TOKEN = "";
    expect(resolveWebTerminalRuntimeConfig(createApp() as never)).toEqual({
      url: "",
      token: "",
    });
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    workspaceHost.registerSettingsSection.mockClear();
    workspaceHost.settingsUpdate.mockClear();
    workspaceHost.disposeSection.mockClear();
    attach.registerWebTerminalRuntimeBridge.mockClear();
  });

  it("registers URL and password token Settings fields", () => {
    const app = createApp({
      [WEB_TERMINAL_HOST_URL_KEY]: "ws://127.0.0.1:7346",
      [WEB_TERMINAL_HOST_TOKEN_KEY]: "vault-token",
    });
    const dispose = registerWebTerminalRuntimeSettings(app as never);
    expect(workspaceHost.registerSettingsSection).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "web-terminal-host",
        fields: expect.arrayContaining([
          expect.objectContaining({
            id: WEB_TERMINAL_HOST_URL_KEY,
            presentation: "url",
          }),
          expect.objectContaining({
            id: WEB_TERMINAL_HOST_TOKEN_KEY,
            presentation: "password",
          }),
        ]),
      }),
    );
    expect(syncWebTerminalRuntime(app as never)).toBe(true);
    expect(attach.registerWebTerminalRuntimeBridge).toHaveBeenCalledWith({
      url: "ws://127.0.0.1:7346",
      token: "vault-token",
    });
    app.emitUpdated(WEB_TERMINAL_HOST_URL_KEY);
    expect(attach.registerWebTerminalRuntimeBridge).toHaveBeenCalledTimes(2);
    dispose();
    expect(workspaceHost.disposeSection).toHaveBeenCalledOnce();
    expect(app.configuration.offref).toHaveBeenCalledOnce();
  });
});
