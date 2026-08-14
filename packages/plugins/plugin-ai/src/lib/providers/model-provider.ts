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
