import type { AgentProcessHost } from "../host/process-host";
import type { ModelRef } from "../core/types";
import { listCodexModelsFromHost } from "./codex-model-catalog";
import type { ModelProvider, ProviderAuthStatus } from "./model-provider";

export class CodexModelProvider implements ModelProvider {
  readonly id = "codex";
  readonly #host: AgentProcessHost;
  readonly #cwd?: string;

  constructor(host: AgentProcessHost, options: { cwd?: string } = {}) {
    this.#host = host;
    this.#cwd = options.cwd;
  }

  async listModels(): Promise<ModelRef[]> {
    if (!this.#host.available) return [];
    try {
      return await listCodexModelsFromHost(this.#host, { cwd: this.#cwd });
    } catch {
      return [];
    }
  }

  async authStatus(): Promise<ProviderAuthStatus> {
    if (!this.#host.available) {
      return {
        authenticated: false,
        label: "Codex",
        detail: "Live model listing requires the desktop agent-runtime capability.",
      };
    }
    const models = await this.listModels();
    return models.length > 0
      ? { authenticated: true, label: "Codex" }
      : {
          authenticated: false,
          label: "Codex",
          detail: "Codex did not return a model catalog.",
        };
  }
}
