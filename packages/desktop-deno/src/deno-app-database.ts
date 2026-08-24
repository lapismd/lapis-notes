import {
  type AppDatabase,
  type AppDatabaseChangeListener,
  type AppDatabaseDescriptor,
  type AppDatabaseKind,
  type AppDatabaseOpenContext,
  type AppDatabaseProvider,
  type NativeAppDatabaseChangeEvent,
} from "@lapis-notes/api";
import {
  DESKTOP_APP_DATABASE_METHODS,
  type DesktopAppDatabaseMethod,
} from "./desktop-app-database-protocol";
import type { DenoDesktopBridge } from "./main";

export type DenoDesktopAppDatabaseBridge = DenoDesktopBridge & {
  onAppDatabaseChange?(
    listener: (event: NativeAppDatabaseChangeEvent) => void,
  ): () => void;
};

function createDatabaseId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `desktop-db-${crypto.randomUUID()}`;
  }
  return `desktop-db-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

class DenoDesktopAppDatabaseProxy {
  private readonly databaseId = createDatabaseId();
  private descriptorValue: AppDatabaseDescriptor | null = null;
  private opened = false;
  private closed = false;
  private readonly changeListeners = new Set<AppDatabaseChangeListener>();
  private unsubscribeChanges: (() => void) | null = null;

  constructor(
    private readonly bridge: DenoDesktopAppDatabaseBridge,
    readonly vaultId: string,
  ) {}

  get kind(): AppDatabaseKind {
    return "turso-native";
  }

  get descriptor(): AppDatabaseDescriptor {
    if (!this.descriptorValue) {
      return {
        providerId: "turso-native-desktop",
        engine: "turso",
        transport: "native",
        role: "direct",
        storageMode: "local",
        capabilities: {
          nativeFullTextSearch: false,
          vectorSearch: false,
          approximateNearestNeighbors: false,
          localEmbeddings: true,
          crossTabCoordination: false,
          sync: false,
        },
      };
    }
    return this.descriptorValue;
  }

  async open(): Promise<void> {
    if (this.opened) return;
    if (this.closed) {
      throw new Error("Deno desktop app database has already been closed");
    }
    if (!this.bridge.onAppDatabaseChange) {
      throw new Error("Deno desktop bridge does not expose app database events");
    }
    this.unsubscribeChanges = this.bridge.onAppDatabaseChange((event) => {
      if (event.vaultId !== this.vaultId) return;
      for (const listener of this.changeListeners) {
        listener(structuredClone(event.change));
      }
    });
    this.descriptorValue =
      await this.bridge.invoke<AppDatabaseDescriptor>(
        "desktop_app_database_open",
        {
          databaseId: this.databaseId,
          vaultId: this.vaultId,
        },
      );
    this.opened = true;
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    this.opened = false;
    this.unsubscribeChanges?.();
    this.unsubscribeChanges = null;
    this.changeListeners.clear();
    await this.bridge.invoke("desktop_app_database_close", {
      databaseId: this.databaseId,
    });
  }

  subscribeToChanges(listener: AppDatabaseChangeListener): () => void {
    this.changeListeners.add(listener);
    return () => {
      this.changeListeners.delete(listener);
    };
  }

  async invoke(method: DesktopAppDatabaseMethod, args: unknown[]): Promise<unknown> {
    if (!this.opened) {
      await this.open();
    }
    return this.bridge.invoke("desktop_app_database_invoke", {
      databaseId: this.databaseId,
      method,
      args,
    });
  }
}

export class DenoDesktopAppDatabaseProvider implements AppDatabaseProvider {
  readonly id = "turso-native-desktop";

  constructor(private readonly bridge: DenoDesktopAppDatabaseBridge) {}

  canOpen(context: AppDatabaseOpenContext): boolean {
    return context.runtime === "deno-desktop";
  }

  async open(context: AppDatabaseOpenContext): Promise<AppDatabase> {
    const delegate = new DenoDesktopAppDatabaseProxy(
      this.bridge,
      context.vaultId,
    );
    const database = {
      get kind() {
        return delegate.kind;
      },
      get vaultId() {
        return delegate.vaultId;
      },
      get descriptor() {
        return delegate.descriptor;
      },
      open: () => delegate.open(),
      close: () => delegate.close(),
      subscribeToChanges: (listener: AppDatabaseChangeListener) =>
        delegate.subscribeToChanges(listener),
    } as AppDatabase;
    const methodTarget = database as unknown as Record<
      DesktopAppDatabaseMethod,
      (...args: unknown[]) => Promise<unknown>
    >;
    for (const method of DESKTOP_APP_DATABASE_METHODS) {
      methodTarget[method] = (...args: unknown[]) =>
        delegate.invoke(method, args);
    }
    await database.open();
    return database;
  }
}
