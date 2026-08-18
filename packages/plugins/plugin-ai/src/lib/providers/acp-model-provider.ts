import {
  getNativeDesktopBridge,
  hasNativeDesktopCapability,
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
    const catalog = await bridge.invoke<AcpModelCatalog>(
      "desktop_agent_acp_models",
      { agent: this.id, workspace: this.#workspace },
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
