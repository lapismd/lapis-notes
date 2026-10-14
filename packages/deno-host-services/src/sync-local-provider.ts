import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { snapshotSyncFileMutation } from "@lapis-notes/api/sync-repository";
import type {
  SyncHostLocalProvider,
  SyncLocalHostCapabilities,
  SyncVaultStateCrypto,
  SyncFileDescriptor,
} from "@lapis-notes/api/sync-repository";
import { NativeSyncRepository } from "./sync-repository.ts";
import { NativeSyncVault } from "./sync-vault.ts";
import {
  checkedRoot,
  existing,
  hash,
  outsideVault,
} from "./sync-vault-files.ts";

interface Resources {
  vault: NativeSyncVault;
  repository: NativeSyncRepository;
}
interface Runtime {
  id: string;
  active: boolean;
  opening?: Promise<Resources>;
  resources?: Partial<Resources>;
  failure?: Error;
  closing?: Promise<void>;
  flights: Set<Promise<unknown>>;
}
export interface NativeSyncLocalProviderOptions {
  rootPath: string;
  /** Host-owned dedicated directory, outside the working vault and disposable indexes. */
  storagePath: string;
  crypto: SyncVaultStateCrypto;
  assertActive(): void;
  /** Explicit shared inclusion policy; the native adapter never assumes configuration is portable. */
  includePath: (path: string) => boolean;
}

/** Native adapter shared by admitted desktop/server hosts; no physical path enters the facade. */
export class NativeSyncLocalProvider implements SyncHostLocalProvider {
  #runtime: Runtime | undefined;
  #closed = false;
  #closing: Promise<void> | undefined;
  constructor(private readonly options: NativeSyncLocalProviderOptions) {
    if (typeof options.includePath !== "function")
      throw new Error(
        "Native local Sync requires an explicit inclusion policy",
      );
  }

  forRuntime(runtimeId: string): SyncLocalHostCapabilities {
    if (this.#closed) throw new Error("Native local Sync provider is closed");
    this.options.assertActive();
    if (this.#runtime)
      throw new Error("Another Sync runtime owns this native vault");
    const runtime: Runtime = {
      id: runtimeId,
      active: true,
      flights: new Set(),
    };
    this.#runtime = runtime;
    return {
      list: () =>
        this.#run(runtime, async ({ vault }) => {
          const files = await vault.list();
          return files.map((file) => ({
            path: file.path,
            fileId: file.fileId,
            hostFileId: file.hostFileId,
            contentGeneration: file.contentGeneration,
            openRead: () =>
              this.#run(
                runtime,
                async () => this.#stream(runtime, await file.openRead()).stream,
              ),
          }));
        }),
      repository: {
        readState: () =>
          this.#run(runtime, ({ repository }) => repository.readState()),
        compareAndSwap: (version, next) => {
          const captured = structuredClone(next);
          return this.#run(runtime, ({ repository }) =>
            repository.compareAndSwap(version, captured),
          );
        },
        blobs: {
          has: (hash) =>
            this.#run(runtime, ({ repository }) => repository.blobs.has(hash)),
          get: (hash) =>
            this.#run(runtime, ({ repository }) => repository.blobs.get(hash)),
          put: (bytes) => {
            const captured = Uint8Array.from(bytes);
            return this.#run(runtime, ({ repository }) =>
              repository.blobs.put(captured),
            );
          },
        },
      },
      apply: {
        receipt: (id) => this.#run(runtime, ({ vault }) => vault.receipt(id)),
        mutate: (operation, source) => {
          const captured = snapshotSyncFileMutation(operation);
          return this.#run(runtime, async ({ vault }) => {
            const guarded = source ? this.#stream(runtime, source) : undefined;
            try {
              return await vault.mutate(captured, guarded?.stream);
            } finally {
              if (guarded && !guarded.stream.locked)
                await guarded.stream.cancel();
              await guarded?.closed.catch(() => undefined);
            }
          });
        },
      },
    };
  }

  #assert(runtime: Runtime): void {
    if (this.#closed || !runtime.active || this.#runtime !== runtime)
      throw new Error("Native local Sync runtime is revoked");
    if (runtime.failure) throw runtime.failure;
    this.options.assertActive();
  }

  /** Trusted RPC controller; renderers receive only the corresponding guarded stream. */
  openRead(
    runtimeId: string,
    file: SyncFileDescriptor,
  ): Promise<ReadableStream<Uint8Array>> {
    const runtime = this.#runtime;
    if (!runtime || runtime.id !== runtimeId)
      return Promise.reject(new Error("Native local Sync runtime is revoked"));
    const captured = {
      path: file.path,
      fileId: file.fileId,
      hostFileId: file.hostFileId,
      contentGeneration: file.contentGeneration,
    };
    return this.#run(
      runtime,
      async ({ vault }) =>
        this.#stream(runtime, await vault.openRead(captured)).stream,
    );
  }

  async #open(runtime: Runtime): Promise<Resources> {
    this.#assert(runtime);
    const status = await this.options.crypto.status();
    this.#assert(runtime);
    if (
      status.state !== "unlocked" ||
      status.deviceState !== "active" ||
      !status.vaultId ||
      !status.devicePublicKey
    )
      throw new Error(
        "Native local Sync requires an active unlocked enrolled endpoint",
      );
    const root = await checkedRoot(this.options.rootPath);
    await mkdir(this.options.storagePath, { recursive: true, mode: 0o700 });
    const storage = await checkedRoot(this.options.storagePath);
    outsideVault(root.root, storage.root);
    const enginePath = join(storage.root, "engine.sqlite");
    const engineFile = await existing(enginePath);
    if (engineFile && (!engineFile.isFile() || engineFile.isSymbolicLink()))
      throw new Error("Invalid native engine repository file");
    let vault: NativeSyncVault | undefined,
      repository: NativeSyncRepository | undefined;
    try {
      this.#assert(runtime);
      vault = await NativeSyncVault.open({
        rootPath: root.root,
        statePath: join(storage.root, "apply.sqlite"),
        vaultId: status.vaultId,
        devicePublicKey: status.devicePublicKey,
        crypto: this.options.crypto,
        includePath: this.options.includePath,
      });
      runtime.resources = { vault };
      this.#assert(runtime);
      repository = await NativeSyncRepository.open(
        enginePath,
        hash(
          JSON.stringify([
            "native-sync-engine-v1",
            status.vaultId,
            status.devicePublicKey,
          ]),
        ),
      );
      runtime.resources.repository = repository;
      this.#assert(runtime);
      return (runtime.resources = { vault, repository });
    } catch (error) {
      const results = await Promise.allSettled([
        vault?.close(),
        repository?.close(),
      ]);
      if (results.some((result) => result.status === "rejected")) {
        runtime.failure = new Error(
          "Native local Sync initialization cleanup failed",
        );
        throw runtime.failure;
      }
      runtime.resources = undefined;
      throw error;
    }
  }

  #run<T>(
    runtime: Runtime,
    operation: (resources: Resources) => Promise<T>,
  ): Promise<T> {
    const flight = (async () => {
      this.#assert(runtime);
      const status = await this.options.crypto.status();
      this.#assert(runtime);
      if (status.state !== "unlocked" || status.deviceState !== "active")
        throw new Error(
          "Native local Sync requires an active unlocked endpoint",
        );
      runtime.opening ??= this.#open(runtime).catch((error) => {
        runtime.opening = undefined;
        throw error;
      });
      const resources = await runtime.opening;
      this.#assert(runtime);
      const result = await operation(resources);
      this.#assert(runtime);
      return result;
    })();
    runtime.flights.add(flight);
    void flight.then(
      () => runtime.flights.delete(flight),
      () => runtime.flights.delete(flight),
    );
    return flight;
  }

  #stream(
    runtime: Runtime,
    source: ReadableStream<Uint8Array>,
  ): { stream: ReadableStream<Uint8Array>; closed: Promise<void> } {
    const transform = new TransformStream<Uint8Array, Uint8Array>({
      transform: (bytes, controller) => {
        this.#assert(runtime);
        controller.enqueue(bytes);
      },
    });
    const closed = source.pipeTo(transform.writable);
    void closed.catch(() => undefined);
    return { stream: transform.readable, closed };
  }

  revokeRuntime(runtimeId: string): Promise<void> {
    const runtime = this.#runtime;
    if (!runtime || runtime.id !== runtimeId) return Promise.resolve();
    if (runtime.closing) return runtime.closing;
    runtime.active = false;
    runtime.closing = (async () => {
      await runtime.opening?.catch(() => undefined);
      const resources = runtime.resources;
      const results = await Promise.allSettled([
        resources?.vault?.close(),
        ...runtime.flights,
      ]);
      // Operation errors do not prevent closing the independently owned repository.
      await resources?.repository?.close();
      if (results[0]?.status === "rejected") throw results[0].reason;
      if (this.#runtime === runtime) this.#runtime = undefined;
    })();
    return runtime.closing;
  }

  close(): Promise<void> {
    if (this.#closing) return this.#closing;
    this.#closed = true;
    return (this.#closing = this.#runtime
      ? this.revokeRuntime(this.#runtime.id)
      : Promise.resolve());
  }
}
