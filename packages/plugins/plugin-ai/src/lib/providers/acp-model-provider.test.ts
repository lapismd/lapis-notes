import type {
  NativeAgentRuntimeEvent,
  NativeDesktopBridge,
} from "@lapis-notes/api/desktop-native";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AcpModelProvider } from "./acp-model-provider";

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

describe("AcpModelProvider", () => {
  afterEach(() => {
    native.bridge = null;
  });

  it("subscribes before requesting a deferred Deno model catalog", async () => {
    let listener: ((event: NativeAgentRuntimeEvent) => void) | undefined;
    const invoke = vi.fn(
      async (_command: string, payload?: Record<string, unknown>) => {
        expect(listener).toBeDefined();
        const requestId = String(payload?.requestId ?? "");
        listener?.({
          sessionId: requestId,
          runId: "model-catalog",
          sequence: 1,
          event: {
            type: "event",
            event: {
              type: "model_catalog",
              catalog: {
                agent: "codex",
                currentModel: "gpt-5.6-sol",
                models: ["gpt-5.6-sol"],
                entries: [
                  {
                    id: "gpt-5.6-sol",
                    label: "GPT-5.6-Sol",
                    badges: ["recommended"],
                  },
                ],
              },
            },
          },
        });
        return { requestId };
      },
    );
    native.bridge = {
      runtime: "deno-desktop",
      capabilities: {
        "agent-runtime": {
          id: "agent-runtime",
          status: "available",
          details: { deferredModels: true },
        },
      },
      invoke,
      toFileUrl: (path) => path,
      onAgentRuntimeEvent(next) {
        listener = next;
        return () => {
          listener = undefined;
        };
      },
    } as NativeDesktopBridge;

    await expect(new AcpModelProvider("codex").listModels()).resolves.toEqual([
      {
        provider: "codex",
        model: "gpt-5.6-sol",
        displayName: "GPT-5.6-Sol",
        badges: ["recommended"],
        isDefault: true,
      },
    ]);
    expect(invoke).toHaveBeenCalledWith(
      "desktop_agent_acp_models",
      expect.objectContaining({
        agent: "codex",
        requestId: expect.any(String),
      }),
    );
    expect(listener).toBeUndefined();
  });

  it("keeps awaited model discovery for older desktop hosts", async () => {
    const invoke = vi.fn(async () => ({
      agent: "cursor",
      currentModel: "composer-2.5",
      models: ["composer-2.5"],
      entries: [{ id: "composer-2.5", label: "Composer 2.5" }],
    }));
    native.bridge = {
      runtime: "deno-desktop",
      capabilities: {
        "agent-runtime": {
          id: "agent-runtime",
          status: "available",
          details: {},
        },
      },
      invoke,
      toFileUrl: (path) => path,
    } as NativeDesktopBridge;

    await expect(new AcpModelProvider("cursor").listModels()).resolves.toEqual([
      {
        provider: "cursor",
        model: "composer-2.5",
        displayName: "Composer 2.5",
        isDefault: true,
      },
    ]);
    expect(invoke).toHaveBeenCalledWith("desktop_agent_acp_models", {
      agent: "cursor",
      workspace: undefined,
    });
  });
});
