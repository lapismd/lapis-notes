import type { HostedPluginCapability } from "./plugin-capability-facade";
import { snapshotSyncFileMutation } from "./sync-repository";
import type {
  SyncHostLocalProvider,
  SyncLocalApplyGuard,
  SyncLocalHostCapabilities,
} from "./sync-repository";

const FILE_GRANTS = [
  "crypto:nostr-sync",
  "vault:stream",
  "metadata:identity",
] as const;
const STORE_GRANTS = ["crypto:nostr-sync", "plugin:generated-state"] as const;

/** Grant-checked lifetime boundary; providers retain all platform-specific authority. */
export class ScopedSyncLocalRuntime {
  #active = true;
  #provider: SyncHostLocalProvider | undefined;
  #capabilities: SyncLocalHostCapabilities | undefined;
  #selectionError: unknown;
  #selected = false;
  #closing: Promise<void> | undefined;
  readonly #flights = new Set<Promise<unknown>>();
  readonly #streams = new Set<() => Promise<void>>();

  constructor(
    private readonly options: {
      runtimeId: string;
      selectProvider(): SyncHostLocalProvider | undefined;
      assertGranted(capability: HostedPluginCapability): void;
      guardApply?: SyncLocalApplyGuard;
    },
  ) {}

  readonly capabilities: SyncLocalHostCapabilities = {
    list: () =>
      this.#invoke(FILE_GRANTS, async (local) => {
        const files = await local.list();
        return files.map((file) => ({
          path: file.path,
          fileId: file.fileId,
          hostFileId: file.hostFileId,
          contentGeneration: file.contentGeneration,
          openRead: () =>
            this.#invoke(
              FILE_GRANTS,
              async () =>
                (await this.#stream(await file.openRead(), FILE_GRANTS)).stream,
            ),
        }));
      }),
    repository: {
      readState: () =>
        this.#invoke(STORE_GRANTS, (local) => local.repository.readState()),
      compareAndSwap: (expectedVersion, next, authority) => {
        const captured = structuredClone(next);
        const fence = authority ? structuredClone(authority) : undefined;
        return this.#invoke(STORE_GRANTS, (local) =>
          fence
            ? local.repository.compareAndSwap(expectedVersion, captured, fence)
            : local.repository.compareAndSwap(expectedVersion, captured),
        );
      },
      blobs: {
        has: (hash) =>
          this.#invoke(STORE_GRANTS, (local) =>
            local.repository.blobs.has(hash),
          ),
        get: (hash) =>
          this.#invoke(STORE_GRANTS, (local) =>
            local.repository.blobs.get(hash),
          ),
        put: (bytes) => {
          const captured = Uint8Array.from(bytes);
          return this.#invoke(STORE_GRANTS, (local) =>
            local.repository.blobs.put(captured),
          );
        },
      },
    },
    apply: {
      receipt: (id, authority) => {
        const fence = authority ? structuredClone(authority) : undefined;
        return this.#apply(undefined, (local) =>
          fence ? local.apply.receipt(id, fence) : local.apply.receipt(id),
        );
      },
      mutate: (operation, source, authority) => {
        return this.#track(
          (async () => {
            let guarded:
              | { stream: ReadableStream<Uint8Array>; close(): Promise<void> }
              | undefined;
            try {
              const captured = snapshotSyncFileMutation(operation);
              const fence = authority ? structuredClone(authority) : undefined;
              guarded = source
                ? await this.#stream(source, FILE_GRANTS)
                : undefined;
              return await this.#apply(captured.path, async (local) => {
                try {
                  this.#assert([...FILE_GRANTS, "plugin:generated-state"]);
                  return await (fence
                    ? local.apply.mutate(captured, guarded?.stream, fence)
                    : local.apply.mutate(captured, guarded?.stream));
                } finally {
                  await guarded?.close();
                }
              });
            } finally {
              if (guarded) await guarded.close();
              else if (source && !source.locked) await source.cancel();
            }
          })(),
        );
      },
    },
  };

  #assert(grants: readonly HostedPluginCapability[]): void {
    if (!this.#active) throw new Error("Local Sync runtime is revoked");
    for (const grant of grants) this.options.assertGranted(grant);
  }

  #local(): SyncLocalHostCapabilities {
    if (!this.#selected) {
      this.#selected = true;
      try {
        const provider = this.options.selectProvider();
        if (!provider)
          throw new Error("Local Sync host capability is unavailable");
        if (
          typeof provider.forRuntime !== "function" ||
          typeof provider.revokeRuntime !== "function"
        )
          throw new Error("Invalid local Sync provider");
        this.#provider = provider;
        this.#capabilities = provider.forRuntime(this.options.runtimeId);
        if (!this.#capabilities || typeof this.#capabilities !== "object")
          throw new Error("Invalid local Sync provider capabilities");
      } catch (error) {
        this.#selectionError =
          error instanceof Error
            ? error
            : new Error("Local Sync provider selection failed");
      }
    }
    if (this.#selectionError) throw this.#selectionError;
    return this.#capabilities!;
  }

  #invoke<T>(
    grants: readonly HostedPluginCapability[],
    operation: (local: SyncLocalHostCapabilities) => Promise<T>,
  ): Promise<T> {
    const flight = (async () => {
      this.#assert(grants);
      const result = await operation(this.#local());
      this.#assert(grants);
      return result;
    })();
    return this.#track(flight);
  }

  #track<T>(flight: Promise<T>): Promise<T> {
    this.#flights.add(flight);
    void flight.then(
      () => this.#flights.delete(flight),
      () => this.#flights.delete(flight),
    );
    return flight;
  }

  async #apply<T>(
    path: string | undefined,
    operation: (local: SyncLocalHostCapabilities) => Promise<T>,
  ): Promise<T> {
    this.#assert([...FILE_GRANTS, "plugin:generated-state"]);
    const guard = this.options.guardApply;
    if (!guard) throw new Error("Local Sync host apply guard is unavailable");
    return this.#invoke(
      [...FILE_GRANTS, "plugin:generated-state"],
      async (local) => {
        return guard(path, async () => {
          this.#assert([...FILE_GRANTS, "plugin:generated-state"]);
          return operation(local);
        });
      },
    );
  }

  async #stream(
    source: ReadableStream<Uint8Array>,
    grants: readonly HostedPluginCapability[],
  ): Promise<{ stream: ReadableStream<Uint8Array>; close(): Promise<void> }> {
    try {
      this.#assert(grants);
    } catch (error) {
      await source.cancel(error);
      throw error;
    }
    const reader = source.getReader();
    let terminal = false;
    let stopping: Promise<void> | undefined;
    let controller: ReadableStreamDefaultController<Uint8Array>;
    const release = () => {
      this.#streams.delete(stop);
      reader.releaseLock();
    };
    const cancel = (reason?: unknown): Promise<void> => {
      if (stopping) return stopping;
      if (terminal) return Promise.resolve();
      terminal = true;
      stopping = reader.cancel(reason).finally(release);
      return stopping;
    };
    const stop = (reason = new Error("Local Sync runtime is revoked")) => {
      if (!terminal) controller.error(reason);
      return cancel(reason);
    };
    this.#streams.add(stop);
    const stream = new ReadableStream<Uint8Array>(
      {
        start(value) {
          controller = value;
        },
        pull: async () => {
          if (terminal) return;
          try {
            this.#assert(grants);
            const result = await reader.read();
            this.#assert(grants);
            if (terminal) return;
            if (result.done) {
              terminal = true;
              release();
              controller.close();
            } else {
              if (!(result.value instanceof Uint8Array))
                throw new Error("Invalid local Sync stream chunk");
              controller.enqueue(result.value);
            }
          } catch (error) {
            if (!terminal) controller.error(error);
            await cancel(error);
          }
        },
        cancel,
      },
      { highWaterMark: 0 },
    );
    return {
      stream,
      close: () => stop(new Error("Local Sync operation has completed")),
    };
  }

  revoke(): Promise<void> {
    if (this.#closing) return this.#closing;
    this.#active = false;
    this.#closing = (async () => {
      const streams = await Promise.allSettled(
        [...this.#streams].map((stop) => stop()),
      );
      await Promise.allSettled([...this.#flights]);
      // Even failed cancellation must release the platform provider.
      await this.#provider?.revokeRuntime(this.options.runtimeId);
      const failure = streams.find((result) => result.status === "rejected");
      if (failure?.status === "rejected") throw failure.reason;
    })();
    return this.#closing;
  }
}
