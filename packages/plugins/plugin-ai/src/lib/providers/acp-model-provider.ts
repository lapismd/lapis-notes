import {
  getNativeDesktopBridge,
  hasNativeDesktopCapability,
} from "@lapis-notes/api";
import type { ModelRef } from "../core/types";
import type { ModelProvider, ProviderAuthStatus } from "./model-provider";

type AcpModelCatalog = {
  agent: string;
  currentModel?: string;
  models?: string[];
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
    return [...new Set(catalog.models ?? [])]
      .map((model) => model.trim())
      .filter(Boolean)
      .map((model) => ({
        provider: this.id,
        model,
        isDefault: model === current,
      }));
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
