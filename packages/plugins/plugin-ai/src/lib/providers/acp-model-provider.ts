import {
  getNativeDesktopBridge,
  getNativeDesktopCapability,
  hasNativeDesktopCapability,
  type NativeAgentRuntimeEvent,
} from "@lapis-notes/api/desktop-native";
import type { ModelRef } from "../core/types";
import type { ModelProvider, ProviderAuthStatus } from "./model-provider";

type AcpModelEntry = {
  id: string;
  label: string;
  badges?: string[];
};

type AcpModelCatalog = {
  agent: string;
  currentModel?: string;
  models?: string[];
  entries?: AcpModelEntry[];
};

type AgentRuntimeBridge = {
  invoke<T>(command: string, payload?: Record<string, unknown>): Promise<T>;
  onAgentRuntimeEvent?(
    listener: (event: NativeAgentRuntimeEvent) => void,
  ): () => void;
};

export class AcpModelProvider implements ModelProvider {
  readonly id: string;
  readonly #workspace?: string;

  constructor(id: string, options: { workspace?: string } = {}) {
    this.id = id;
    this.#workspace = options.workspace;
  }

  async listModels(): Promise<ModelRef[]> {
    if (!hasNativeDesktopCapability("agent-runtime")) return [];
    const bridge = getNativeDesktopBridge() as AgentRuntimeBridge | null;
    if (!bridge) return [];
    const payload = { agent: this.id, workspace: this.#workspace };
    const catalog =
      getNativeDesktopCapability("agent-runtime")?.details?.deferredModels ===
      true
        ? await deferredModelCatalog(bridge, payload)
        : await bridge.invoke<AcpModelCatalog>(
            "desktop_agent_acp_models",
            payload,
          );
    const current = catalog.currentModel?.trim();
    const entries = new Map(
      (catalog.entries ?? []).map((entry) => [entry.id, entry]),
    );
    return [...new Set(catalog.models ?? [])]
      .map((model) => model.trim())
      .filter(Boolean)
      .map((model) => {
        const entry = entries.get(model);
        return {
          provider: this.id,
          model,
          ...(entry?.label ? { displayName: entry.label } : {}),
          ...(entry?.badges?.length ? { badges: entry.badges } : {}),
          isDefault: model === current,
        };
      });
  }

  async authStatus(): Promise<ProviderAuthStatus> {
    if (!hasNativeDesktopCapability("agent-runtime")) {
      return {
        authenticated: false,
        label: this.id,
        detail:
          "Live model listing requires the desktop agent-runtime capability.",
      };
    }
    try {
      const models = await this.listModels();
      return models.length > 0
        ? { authenticated: true, label: this.id }
        : {
            authenticated: false,
            label: this.id,
            detail: `${this.id} did not return a model catalog.`,
          };
    } catch (error) {
      return {
        authenticated: false,
        label: this.id,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

async function deferredModelCatalog(
  bridge: AgentRuntimeBridge,
  payload: Record<string, unknown>,
): Promise<AcpModelCatalog> {
  if (!bridge.onAgentRuntimeEvent) {
    throw new Error("The desktop agent host cannot deliver model catalogs.");
  }
  const requestId = crypto.randomUUID();
  let unsubscribe = () => {};
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const result = new Promise<AcpModelCatalog>((resolve, reject) => {
    unsubscribe = bridge.onAgentRuntimeEvent!((event) => {
      if (
        event.sessionId !== requestId ||
        event.runId !== "model-catalog" ||
        event.event.type !== "event"
      ) {
        return;
      }
      const detail = event.event.event;
      if (detail?.type === "model_catalog") {
        resolve(detail.catalog as AcpModelCatalog);
      } else if (detail?.type === "model_catalog_error") {
        reject(new Error(String(detail.message ?? "Model discovery failed.")));
      }
    });
    timeoutId = setTimeout(
      () => reject(new Error("Desktop ACP model discovery timed out.")),
      60_000,
    );
  });
  try {
    const started = await bridge.invoke<{ requestId: string }>(
      "desktop_agent_acp_models",
      { ...payload, requestId },
    );
    if (started.requestId !== requestId) {
      throw new Error(
        "The desktop agent host returned a different model request id.",
      );
    }
    return await result;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    unsubscribe();
  }
}
