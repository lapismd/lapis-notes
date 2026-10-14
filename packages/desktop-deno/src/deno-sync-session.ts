import { decodeSyncValue, encodeSyncValue } from "./sync-security-protocol";
import {
  SYNC_LOCAL_WIRE_CHARS,
  type SyncLocalOperation,
} from "./sync-local-protocol";
export interface DesktopSyncProviderOptions {
  vaultId: string;
  invoke(command: string, payload: Record<string, unknown>): Promise<unknown>;
  requestRecoveryPassphrase(mode: "export" | "import"): Promise<string | null>;
}
export interface DesktopSyncRuntime {
  active: boolean;
  attempted: boolean;
  groups: Set<string>;
  stoppers: Set<() => Promise<void>>;
  opening?: Promise<{ sessionToken: string }>;
  closing?: Promise<void>;
}
export function createDesktopSyncSessionClient(
  options: DesktopSyncProviderOptions,
) {
  const runtimes = new Map<string, DesktopSyncRuntime>();
  const assert = (runtime: DesktopSyncRuntime) => {
    if (!runtime.active) throw new Error("Desktop Sync runtime is revoked");
  };
  const open = async (runtimeId: string) => {
    const result = await options.invoke("desktop_sync_security_open", {
      vaultId: options.vaultId,
      pluginId: "sync",
      runtimeId,
    });
    const token = (result as { sessionToken?: unknown } | null)?.sessionToken;
    if (typeof token !== "string" || !/^[A-Za-z0-9._:-]{1,160}$/u.test(token))
      throw new Error("Native Sync session response is invalid");
    return { sessionToken: token };
  };
  const session = async (runtimeId: string, runtime: DesktopSyncRuntime) => {
    assert(runtime);
    runtime.attempted = true;
    runtime.opening ??= open(runtimeId).catch((error) => {
      runtime.opening = undefined;
      throw error;
    });
    const value = await runtime.opening;
    assert(runtime);
    return value;
  };
  const client = {
    acquire(runtimeId: string, group: "security" | "local") {
      let runtime = runtimes.get(runtimeId);
      if (!runtime) {
        runtime = {
          active: true,
          attempted: false,
          groups: new Set(),
          stoppers: new Set(),
        };
        runtimes.set(runtimeId, runtime);
      }
      assert(runtime);
      if (runtime.groups.has(group))
        throw new Error("Desktop Sync runtime already exists");
      runtime.groups.add(group);
      return runtime;
    },
    assert,
    async security(
      runtimeId: string,
      runtime: DesktopSyncRuntime,
      fields: Record<string, unknown>,
    ) {
      const opened = await session(runtimeId, runtime);
      assert(runtime);
      const result = await options.invoke("desktop_sync_security_call", {
        ...opened,
        ...fields,
      });
      assert(runtime);
      return decodeSyncValue(result);
    },
    async local(
      runtimeId: string,
      runtime: DesktopSyncRuntime,
      operation: SyncLocalOperation,
      args: unknown[],
    ) {
      assert(runtime);
      const wire = encodeSyncValue(args);
      if (wire.length > SYNC_LOCAL_WIRE_CHARS)
        throw new Error("Sync data request exceeds transfer limit");
      const opened = await session(runtimeId, runtime);
      const payload = { ...opened, operation, args: wire };
      for (let attempt = 0; ; attempt++) {
        try {
          assert(runtime);
          const result = await options.invoke(
            "desktop_sync_local_call",
            payload,
          );
          assert(runtime);
          if (
            typeof result !== "string" ||
            result.length > SYNC_LOCAL_WIRE_CHARS
          )
            throw new Error("Invalid native Sync data response");
          return decodeSyncValue(result);
        } catch (error) {
          assert(runtime);
          if (attempt) throw error;
        }
      }
    },
    async cleanup(
      runtimeId: string,
      runtime: DesktopSyncRuntime,
      operation: "readClose" | "uploadClose" | "captureClose",
      transferId: string,
    ) {
      if (!runtime.active) return;
      try {
        await client.local(runtimeId, runtime, operation, [transferId]);
      } catch (error) {
        if (runtime.active) throw error;
      }
    },
    stopWith(runtime: DesktopSyncRuntime, stop: () => Promise<void>) {
      assert(runtime);
      runtime.stoppers.add(stop);
      return () => runtime.stoppers.delete(stop);
    },
    close(runtimeId: string): Promise<void> {
      const runtime = runtimes.get(runtimeId);
      if (!runtime) return Promise.resolve();
      if (runtime.closing) return runtime.closing;
      runtime.active = false;
      const stops = [...runtime.stoppers].map((stop) => {
        try {
          return Promise.resolve(stop());
        } catch (error) {
          return Promise.reject(error);
        }
      });
      const native = (async () => {
        if (!runtime.attempted) return;
        const opened = await (runtime.opening ?? open(runtimeId)).catch(() =>
          open(runtimeId),
        );
        await options.invoke("desktop_sync_security_close", opened);
      })();
      runtime.closing = Promise.allSettled([...stops, native])
        .then((results) => {
          const failure = results.find(
            (result) => result.status === "rejected",
          );
          if (failure?.status === "rejected") throw failure.reason;
        })
        .finally(() => {
          runtimes.delete(runtimeId);
        });
      return runtime.closing;
    },
  };
  return client;
}
export type DesktopSyncSessionClient = ReturnType<
  typeof createDesktopSyncSessionClient
>;
