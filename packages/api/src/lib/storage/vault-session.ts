import {
  EMPTY_APP_DATABASE_CAPABILITIES,
  MemoryAppDatabase,
  type AppDatabase,
  type AppDatabaseCapabilities,
  type AppDatabaseDescriptor,
  type AppDatabaseProvider,
  type RuntimeTarget,
} from "./app-database";
import { BrowserCoordinatedAppDatabase } from "./browser-coordinated-app-database";
import { BrowserAppDatabaseCoordinator } from "./browser-app-database-coordination";
import type { VaultAdapter, VaultIdentityAdapter } from "./fs";
import {
  TursoWasmAppDatabaseProvider,
  canUseTursoWasmDatabase,
} from "./turso-app-database";
import { getAdapterVaultId, type VaultProfile } from "./vault-state";

export type VaultSessionAppDatabaseStatus = "ready" | "blocked";

/** @deprecated Read providerId, role, transport, and capabilities instead. */
export type VaultSessionAppDatabaseMode =
  | "turso-owner"
  | "turso-native"
  | "turso-proxy"
  | "turso-blocked"
  | "memory-test";

export interface VaultSessionAppDatabaseState {
  status: VaultSessionAppDatabaseStatus;
  /** @deprecated Compatibility summary derived from the provider descriptor. */
  mode: VaultSessionAppDatabaseMode;
  providerId: string;
  role: AppDatabaseDescriptor["role"];
  transport: AppDatabaseDescriptor["transport"];
  capabilities: AppDatabaseCapabilities;
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

function compatibilityMode(
  descriptor: AppDatabaseDescriptor,
): VaultSessionAppDatabaseMode {
  if (descriptor.engine === "memory") return "memory-test";
  if (descriptor.role === "owner") return "turso-owner";
  if (descriptor.role === "proxy") return "turso-proxy";
  if (descriptor.transport === "native") return "turso-native";
  return "turso-owner";
}

function readyState(
  database: AppDatabase,
  lockSupported: boolean,
  details: Partial<VaultSessionAppDatabaseState> = {},
): VaultSessionAppDatabaseState {
  const descriptor = database.descriptor;
  return {
    status: "ready",
    mode: compatibilityMode(descriptor),
    providerId: descriptor.providerId,
    role: descriptor.role,
    transport: descriptor.transport,
    capabilities: descriptor.capabilities,
    lockSupported,
    ...details,
  };
}

function blockedState(
  message: string,
  lockSupported: boolean,
  details: Pick<
    Partial<VaultSessionAppDatabaseState>,
    "ownerId" | "heartbeatAt"
  > = {},
): VaultSessionAppDatabaseState {
  return {
    status: "blocked",
    mode: "turso-blocked",
    providerId: "turso-wasm-local",
    role: "blocked",
    transport: "wasm-worker",
    capabilities: {
      ...EMPTY_APP_DATABASE_CAPABILITIES,
      localEmbeddings: true,
      crossTabCoordination: lockSupported,
    },
    lockSupported,
    message,
    ...details,
  };
}

function holdBrowserAppDatabaseOwnership(
  database: AppDatabase,
  coordinator: BrowserAppDatabaseCoordinator,
): AppDatabase {
  const close = database.close.bind(database);
  let released = false;

  database.close = async () => {
    try {
      await close();
    } finally {
      if (released) return;
      released = true;
      coordinator.close();
    }
  };

  return database;
}

interface AppDatabaseResolution {
  appDatabase?: AppDatabase;
  state: VaultSessionAppDatabaseState;
  coordinator?: BrowserAppDatabaseCoordinator;
  provider?: AppDatabaseProvider;
}

async function openOwnedBrowserAppDatabase(
  vaultId: string,
  coordinator: BrowserAppDatabaseCoordinator,
  provider: AppDatabaseProvider,
): Promise<AppDatabaseResolution> {
  const database = new BrowserCoordinatedAppDatabase(
    vaultId,
    coordinator,
    true,
    provider,
  );
  await database.open();
  return {
    appDatabase: holdBrowserAppDatabaseOwnership(database, coordinator),
    state: readyState(database, true, {
      mode: "turso-owner",
      role: "owner",
      ownerId: coordinator.ownerId,
      heartbeatAt: Date.now(),
    }),
    coordinator,
    provider,
  };
}

async function createBrowserAppDatabase(
  vaultId: string,
  provider: AppDatabaseProvider,
): Promise<AppDatabaseResolution> {
  const lockSupported = BrowserAppDatabaseCoordinator.hasLockApi();
  if (!canUseTursoWasmDatabase()) {
    return {
      state: blockedState(
        "Turso requires OPFS and cross-origin isolation in this browser.",
        lockSupported,
      ),
      provider,
    };
  }
  if (!lockSupported) {
    return {
      state: blockedState(
        "Turso requires the Web Locks API to protect this vault database.",
        false,
      ),
      provider,
    };
  }

  const coordinator = new BrowserAppDatabaseCoordinator(vaultId);
  const acquired = await coordinator.tryAcquireOwnership();
  if (acquired) {
    return openOwnedBrowserAppDatabase(vaultId, coordinator, provider);
  }
  if (typeof BroadcastChannel === "undefined") {
    return {
      state: blockedState("App database already open in another tab.", true, {
        ownerId: coordinator.observedOwnerId ?? undefined,
        heartbeatAt: coordinator.observedHeartbeatAt ?? undefined,
      }),
      coordinator,
      provider,
    };
  }

  const database = new BrowserCoordinatedAppDatabase(
    vaultId,
    coordinator,
    false,
    provider,
  );
  await database.open();
  return {
    appDatabase: database,
    state: readyState(database, true, {
      mode: "turso-proxy",
      role: "proxy",
      message: "App database requests are being delegated to another tab.",
      ownerId: coordinator.observedOwnerId ?? undefined,
      heartbeatAt: coordinator.observedHeartbeatAt ?? undefined,
    }),
    coordinator,
    provider,
  };
}

async function createPreferredAppDatabase(
  vaultId: string,
  runtime: RuntimeTarget,
  provider?: AppDatabaseProvider,
): Promise<AppDatabaseResolution> {
  if (runtime === "test") {
    const database = provider
      ? await provider.open({ vaultId, runtime, role: "test" })
      : new MemoryAppDatabase(vaultId);
    if (!provider) await database.open();
    return { appDatabase: database, state: readyState(database, false) };
  }
  if (runtime === "deno-desktop") {
    const database = provider
      ? await provider.open({ vaultId, runtime, role: "direct" })
      : await new TursoWasmAppDatabaseProvider().open({
          vaultId,
          runtime,
          role: "direct",
        });
    return { appDatabase: database, state: readyState(database, false) };
  }
  if (runtime === "web-pwa") {
    return createBrowserAppDatabase(
      vaultId,
      provider ?? new TursoWasmAppDatabaseProvider(),
    );
  }
  throw new Error(`Unsupported application database runtime: ${runtime}`);
}

function createVaultSessionFactory(
  vaultAdapter: VaultAdapter,
  runtime: RuntimeTarget,
  profile: VaultProfile | undefined,
  vaultId: string,
) {
  const createFromResolution = (
    resolution: AppDatabaseResolution,
  ): VaultSession => ({
    runtime,
    profile,
    vaultAdapter,
    appDatabase: resolution.appDatabase,
    appDatabaseState: resolution.state,
    awaitAppDatabase:
      resolution.state.status === "blocked" &&
      resolution.coordinator &&
      resolution.provider
        ? async (awaitOptions = {}) => {
            const acquired =
              await resolution.coordinator!.waitForOwnership(awaitOptions);
            if (!acquired) {
              return createFromResolution({
                ...resolution,
                state: {
                  ...resolution.state,
                  ownerId: resolution.coordinator?.observedOwnerId ?? undefined,
                  heartbeatAt:
                    resolution.coordinator?.observedHeartbeatAt ?? undefined,
                },
              });
            }
            return createFromResolution(
              await openOwnedBrowserAppDatabase(
                vaultId,
                resolution.coordinator!,
                resolution.provider!,
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
    appDatabaseProvider: AppDatabaseProvider;
  }> = {},
): Promise<VaultSession> {
  const vaultId = getAdapterVaultId(vaultAdapter);
  const runtime = options.runtime ?? "web-pwa";
  const createFromResolution = createVaultSessionFactory(
    vaultAdapter,
    runtime,
    options.profile,
    vaultId,
  );

  if (options.appDatabase) {
    await options.appDatabase.open();
    return createFromResolution({
      appDatabase: options.appDatabase,
      state: readyState(options.appDatabase, false),
    });
  }

  return createFromResolution(
    await createPreferredAppDatabase(
      vaultId,
      runtime,
      options.appDatabaseProvider,
    ),
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
