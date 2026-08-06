import type { AppDatabase, RuntimeTarget } from "./app-database";
import { createDefaultAppDatabase } from "./app-database";
import { BrowserCoordinatedAppDatabase } from "./browser-coordinated-app-database";
import { BrowserSqliteCoordinator } from "./browser-sqlite-coordination";
import type { VaultAdapter, VaultIdentityAdapter } from "./fs";
import {
  NativeDesktopAppDatabase,
  hasNativeDesktopBridge,
} from "./desktop-native";
import { getAdapterVaultId, type VaultProfile } from "./vault-state";

export type VaultSessionAppDatabaseStatus = "ready" | "blocked";

export type VaultSessionAppDatabaseMode =
  | "sqlite-owner"
  | "sqlite-native"
  | "sqlite-proxy"
  | "sqlite-blocked"
  | "indexeddb-fallback"
  | "memory-fallback";

export interface VaultSessionAppDatabaseState {
  status: VaultSessionAppDatabaseStatus;
  mode: VaultSessionAppDatabaseMode;
  lockSupported: boolean;
  message?: string;
  ownerId?: string;
  heartbeatAt?: number;
}

export interface VaultSession {
  runtime: RuntimeTarget;
  profile?: VaultProfile;
  vaultAdapter: VaultAdapter;
  appDatabase?: AppDatabase;
  appDatabaseState: VaultSessionAppDatabaseState;
  awaitAppDatabase?: (options?: {
    signal?: AbortSignal;
  }) => Promise<VaultSession>;
  close: () => Promise<void>;
}

function canUseBrowserOpfsDatabase(runtime: RuntimeTarget): boolean {
  return (
    runtime === "web-pwa" &&
    typeof navigator !== "undefined" &&
    typeof navigator.storage?.getDirectory === "function" &&
    typeof SharedArrayBuffer !== "undefined" &&
    typeof Atomics !== "undefined" &&
    globalThis.crossOriginIsolated === true
  );
}

function fallbackMode(database: AppDatabase): VaultSessionAppDatabaseMode {
  if (database.kind === "sqlite-native") {
    return "sqlite-native";
  }
  return database.kind === "memory" ? "memory-fallback" : "indexeddb-fallback";
}

function holdBrowserAppDatabaseOwnership(
  database: AppDatabase,
  coordinator: BrowserSqliteCoordinator,
): AppDatabase {
  const close = database.close.bind(database);
  let released = false;

  database.close = async () => {
    try {
      await close();
    } finally {
      if (released) {
        return;
      }
      released = true;
      coordinator.close();
    }
  };

  return database;
}

interface AppDatabaseResolution {
  appDatabase?: AppDatabase;
  state: VaultSessionAppDatabaseState;
  coordinator?: BrowserSqliteCoordinator;
}

function fallbackState(
  database: AppDatabase,
  lockSupported: boolean,
): VaultSessionAppDatabaseState {
  return {
    status: "ready",
    mode: fallbackMode(database),
    lockSupported,
  };
}

async function openOwnedBrowserAppDatabase(
  vaultId: string,
  coordinator: BrowserSqliteCoordinator,
): Promise<AppDatabaseResolution> {
  const database = new BrowserCoordinatedAppDatabase(
    vaultId,
    coordinator,
    true,
  );
  return {
    appDatabase: holdBrowserAppDatabaseOwnership(database, coordinator),
    state: {
      status: "ready",
      mode: "sqlite-owner",
      lockSupported: true,
      ownerId: coordinator.ownerId,
      heartbeatAt: Date.now(),
    },
    coordinator,
  };
}

async function createPreferredAppDatabase(
  vaultId: string,
  runtime: RuntimeTarget,
): Promise<AppDatabaseResolution> {
  if (runtime === "electron-desktop" && hasNativeDesktopBridge()) {
    return {
      appDatabase: new NativeDesktopAppDatabase(vaultId),
      state: {
        status: "ready",
        mode: "sqlite-native",
        lockSupported: false,
      },
    };
  }

  if (!canUseBrowserOpfsDatabase(runtime)) {
    const fallbackDatabase = createDefaultAppDatabase(vaultId);
    return {
      appDatabase: fallbackDatabase,
      state: fallbackState(
        fallbackDatabase,
        BrowserSqliteCoordinator.hasLockApi(),
      ),
    };
  }

  if (!BrowserSqliteCoordinator.hasLockApi()) {
    console.warn(
      "Web Locks API unavailable; falling back to the IndexedDB app database",
    );
    const fallbackDatabase = createDefaultAppDatabase(vaultId);
    return {
      appDatabase: fallbackDatabase,
      state: fallbackState(fallbackDatabase, false),
    };
  }

  const coordinator = new BrowserSqliteCoordinator(vaultId);
  const acquired = await coordinator.tryAcquireOwnership();
  if (!acquired) {
    if (typeof BroadcastChannel === "undefined") {
      return {
        state: {
          status: "blocked",
          mode: "sqlite-blocked",
          lockSupported: true,
          message: "App database already open in another tab.",
          ownerId: coordinator.observedOwnerId ?? undefined,
          heartbeatAt: coordinator.observedHeartbeatAt ?? undefined,
        },
        coordinator,
      };
    }

    const database = new BrowserCoordinatedAppDatabase(
      vaultId,
      coordinator,
      false,
    );
    return {
      appDatabase: database,
      state: {
        status: "ready",
        mode: "sqlite-proxy",
        lockSupported: true,
        message: "App database requests are being delegated to another tab.",
        ownerId: coordinator.observedOwnerId ?? undefined,
        heartbeatAt: coordinator.observedHeartbeatAt ?? undefined,
      },
      coordinator,
    };
  }

  return openOwnedBrowserAppDatabase(vaultId, coordinator);
}

function createVaultSessionFactory(
  vaultAdapter: VaultAdapter,
  options: {
    runtime: RuntimeTarget;
    profile?: VaultProfile;
    appDatabase: AppDatabase;
  },
  vaultId: string,
) {
  const runtime = options.runtime;

  const createFromResolution = (
    resolution: AppDatabaseResolution,
  ): VaultSession => ({
    runtime,
    profile: options.profile,
    vaultAdapter,
    appDatabase: resolution.appDatabase,
    appDatabaseState: resolution.state,
    awaitAppDatabase:
      resolution.state.status === "blocked" && resolution.coordinator
        ? async (awaitOptions = {}) => {
            const acquired =
              await resolution.coordinator!.waitForOwnership(awaitOptions);
            if (!acquired) {
              return createFromResolution({
                state: {
                  ...resolution.state,
                  ownerId: resolution.coordinator?.observedOwnerId ?? undefined,
                  heartbeatAt:
                    resolution.coordinator?.observedHeartbeatAt ?? undefined,
                },
                coordinator: resolution.coordinator,
              });
            }

            return createFromResolution(
              await openOwnedBrowserAppDatabase(
                vaultId,
                resolution.coordinator!,
              ),
            );
          }
        : undefined,
    close: async () => {
      await resolution.appDatabase?.close();
      resolution.coordinator?.close();
    },
  });

  return createFromResolution;
}

export async function createVaultSession(
  vaultAdapter: VaultAdapter,
  options: Partial<{
    runtime: RuntimeTarget;
    profile: VaultProfile;
    appDatabase: AppDatabase;
  }> = {},
): Promise<VaultSession> {
  const vaultId = getAdapterVaultId(vaultAdapter);
  const runtime = options.runtime ?? "web-pwa";
  const createFromResolution = createVaultSessionFactory(
    vaultAdapter,
    {
      runtime,
      profile: options.profile,
      appDatabase: options.appDatabase ?? createDefaultAppDatabase(vaultId),
    },
    vaultId,
  );

  if (options.appDatabase) {
    await options.appDatabase.open();
    return createFromResolution({
      appDatabase: options.appDatabase,
      state: {
        status: "ready",
        mode: fallbackMode(options.appDatabase),
        lockSupported: BrowserSqliteCoordinator.hasLockApi(),
      },
    });
  }

  return createFromResolution(
    await createPreferredAppDatabase(vaultId, runtime),
  );
}

export function getVaultSessionId(session: VaultSession): string {
  const adapter = session.vaultAdapter as VaultAdapter &
    Partial<VaultIdentityAdapter>;
  return (
    adapter.getVaultId?.() ??
    session.appDatabase?.vaultId ??
    session.vaultAdapter.getName()
  );
}
