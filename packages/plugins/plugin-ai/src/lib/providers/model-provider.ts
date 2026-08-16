import type { ModelRef } from "../core/types";

export type ProviderAuthStatus = {
  authenticated: boolean;
  label?: string;
  detail?: string;
};

export interface ModelProvider {
  readonly id: string;
  listModels(): Promise<ModelRef[]>;
  authStatus(): Promise<ProviderAuthStatus>;
}

export interface AgentModelCatalog {
  listModels(provider: string): Promise<ModelRef[]>;
}

export class ModelProviderRegistry implements AgentModelCatalog {
  readonly #providers = new Map<string, ModelProvider>();

  constructor(providers: ModelProvider[] = []) {
    for (const provider of providers)
      this.#providers.set(provider.id, provider);
  }

  async listModels(provider: string): Promise<ModelRef[]> {
    return (await this.#providers.get(provider)?.listModels()) ?? [];
  }
}

export class StaticModelProvider implements ModelProvider {
  readonly id: string;
  readonly #models: ModelRef[];
  readonly #auth: ProviderAuthStatus;

  constructor(
    id: string,
    models: ModelRef[],
    auth: ProviderAuthStatus = { authenticated: true, label: "Local" },
  ) {
    this.id = id;
    this.#models = models;
    this.#auth = auth;
  }

  async listModels(): Promise<ModelRef[]> {
    return [...this.#models];
  }

  async authStatus(): Promise<ProviderAuthStatus> {
    return { ...this.#auth };
  }
}
