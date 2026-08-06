import { EventDispatcher } from "./events";
import {
  getAdapterVaultId,
  getDefaultVaultStateStore,
  ScopedVaultStore,
  type DataAdapter,
  type KeyValueStore,
} from "./storage";

const WORKSPACE_TRUST_KEY = "state";

export interface WorkspaceTrustState {
  trusted: boolean;
  identity: string;
  updatedAt: number | null;
}

export interface WorkspaceTrustRequest {
  reason?: string;
  pluginId?: string | null;
  capability?: string | null;
}

type WorkspaceTrustEvents = {
  changed: [state: WorkspaceTrustState];
  requested: [request: WorkspaceTrustRequest];
};

type PersistedWorkspaceTrustState = {
  trusted?: unknown;
  updatedAt?: unknown;
};

export class WorkspaceTrustService extends EventDispatcher<WorkspaceTrustEvents> {
  readonly identity: string;

  private readonly storage: ScopedVaultStore;
  private readyPromise: Promise<WorkspaceTrustState> | null = null;
  private state: WorkspaceTrustState;

  constructor(
    adapter: DataAdapter,
    store: KeyValueStore = getDefaultVaultStateStore(),
  ) {
    super();
    this.identity = getAdapterVaultId(adapter);
    this.storage = new ScopedVaultStore(
      this.identity,
      "workspace-trust",
      store,
    );
    this.state = {
      trusted: true,
      identity: this.identity,
      updatedAt: null,
    };
  }

  get trusted(): boolean {
    return this.state.trusted;
  }

  getState(): WorkspaceTrustState {
    return { ...this.state };
  }

  async ready(): Promise<WorkspaceTrustState> {
    this.readyPromise ??= this.load();
    return this.readyPromise;
  }

  async grant(): Promise<WorkspaceTrustState> {
    await this.ready();
    return this.updateState(true);
  }

  async revoke(): Promise<WorkspaceTrustState> {
    await this.ready();
    return this.updateState(false);
  }

  async request(request: WorkspaceTrustRequest = {}): Promise<boolean> {
    await this.ready();
    if (this.state.trusted) {
      return true;
    }

    this.emit("requested", {
      reason: request.reason,
      pluginId: request.pluginId ?? null,
      capability: request.capability ?? null,
    });
    return false;
  }

  private async load(): Promise<WorkspaceTrustState> {
    const persisted =
      await this.storage.get<PersistedWorkspaceTrustState>(WORKSPACE_TRUST_KEY);
    this.state = {
      trusted: persisted?.trusted !== false,
      identity: this.identity,
      updatedAt:
        typeof persisted?.updatedAt === "number" ? persisted.updatedAt : null,
    };
    return this.getState();
  }

  private async updateState(trusted: boolean): Promise<WorkspaceTrustState> {
    const next: WorkspaceTrustState = {
      trusted,
      identity: this.identity,
      updatedAt: Date.now(),
    };
    await this.storage.set(WORKSPACE_TRUST_KEY, {
      trusted: next.trusted,
      updatedAt: next.updatedAt,
    });
    this.state = next;
    this.emit("changed", this.getState());
    return this.getState();
  }
}
