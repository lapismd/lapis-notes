import { link, realpath, rename } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import type {
  SyncFileMutation,
  SyncFileMutationAccess,
  SyncFileMutationReceipt,
  SyncGuardedFile,
  SyncFileDescriptor,
  SyncIndexedRepository,
  SyncVaultStateCrypto,
} from "@lapis-notes/api/sync-repository";
import { NativeSyncRepository } from "./sync-repository.ts";
import { NativeVaultLease } from "./sync-vault-lease.ts";
import {
  NativeVaultJournal,
  operationKey,
  own,
  sameGeneration,
  versionOf,
  type NativeVaultAuthority,
  type PendingMutation,
  type TrackedFile,
} from "./sync-vault-state.ts";
import {
  checkedParents,
  checkedPath,
  checkedRoot,
  discardStage,
  existing,
  guardedStream,
  hash,
  outsideVault,
  readDiskFile,
  sameDisk,
  scanFiles,
  stageFile,
  stagingRoot,
  syncDirectory,
  type DiskFile,
} from "./sync-vault-files.ts";

export interface NativeSyncVaultOptions {
  rootPath: string;
  statePath: string;
  vaultId: string;
  devicePublicKey: string;
  crypto: SyncVaultStateCrypto;
  includePath?: (path: string) => boolean;
  /** An exclusive repository instance owned and closed by this kernel. */
  repository?: SyncIndexedRepository & { close?(): Promise<void> };
}

function normalizeOperation(input: SyncFileMutation): SyncFileMutation {
  if (
    !input ||
    typeof input.id !== "string" ||
    !input.id ||
    input.id.length > 512 ||
    typeof input.fileId !== "string" ||
    !input.fileId ||
    input.fileId.length > 512 ||
    !["write", "remove"].includes(input.kind)
  )
    throw new Error("Invalid native apply operation");
  checkedPath(input.path);
  const expected = input.expected;
  if (
    expected !== null &&
    (!expected ||
      typeof expected.fileId !== "string" ||
      !expected.fileId ||
      !Number.isSafeInteger(expected.contentGeneration) ||
      expected.contentGeneration < 0 ||
      (expected.hostFileId !== undefined &&
        (typeof expected.hostFileId !== "string" || !expected.hostFileId)))
  )
    throw new Error("Invalid native apply precondition");
  if (input.kind === "remove" && !expected)
    throw new Error("Native removal requires a captured file");
  return {
    id: input.id,
    kind: input.kind,
    path: input.path,
    expected: expected ? versionOf(expected) : null,
    fileId: input.fileId,
  };
}

/** Native working-file transactions. Ciphertext journal and readable staging stay separate. */
export class NativeSyncVault implements SyncFileMutationAccess {
  #tail: Promise<unknown> = Promise.resolve();
  #closed = false;
  #closing: Promise<void> | null = null;
  readonly #abort = new AbortController();
  readonly #reads = new Set<Promise<void>>();
  private constructor(
    readonly options: NativeSyncVaultOptions,
    private readonly root: string,
    private readonly staging: string,
    private readonly lease: NativeVaultLease,
    private readonly journal: NativeVaultJournal,
    private readonly repository: SyncIndexedRepository & {
      close?(): Promise<void>;
    },
  ) {}

  static async open(options: NativeSyncVaultOptions): Promise<NativeSyncVault> {
    const { root, binding } = await checkedRoot(options.rootPath);
    const statePath = join(
      await realpath(dirname(resolve(options.statePath))),
      basename(options.statePath),
    );
    const stateFile = await existing(statePath);
    if (stateFile && (!stateFile.isFile() || stateFile.isSymbolicLink()))
      throw new Error("Invalid native apply journal file");
    outsideVault(root, statePath);
    const staging = await stagingRoot(root),
      lease = await NativeVaultLease.open(staging);
    let repository:
      | (SyncIndexedRepository & { close?(): Promise<void> })
      | undefined;
    try {
      repository =
        options.repository ??
        (await NativeSyncRepository.open(
          statePath,
          hash(`native-apply:${options.vaultId}:${options.devicePublicKey}`),
        ));
      if (
        !repository.records ||
        typeof repository.records.get !== "function" ||
        typeof repository.records.putIfAbsent !== "function"
      )
        throw new Error(
          "Native apply requires durable indexed receipt storage",
        );
      const journal = new NativeVaultJournal({
        ...options,
        repository,
        rootBinding: binding,
      });
      await journal.load();
      const vault = new NativeSyncVault(
        options,
        root,
        staging,
        lease,
        journal,
        repository,
      );
      await vault.compactCompleted(await vault.active());
      return vault;
    } catch (error) {
      await repository?.close?.();
      await lease.close();
      throw error;
    }
  }

  private async active(
    expected?: NativeVaultAuthority,
  ): Promise<NativeVaultAuthority> {
    if (this.#closed) throw new Error("Native sync vault is closed");
    await this.lease.assert();
    const authority = await this.journal.authority();
    if (
      expected &&
      (expected.epoch !== authority.epoch ||
        expected.generation !== authority.generation)
    )
      throw new Error("Native apply authority changed during mutation");
    const { root, binding } = await checkedRoot(this.root);
    if (root !== this.root || binding !== this.journal.options.rootBinding)
      throw new Error("Physical vault root changed");
    return authority;
  }
  private included(path: string): boolean {
    return this.options.includePath?.(path) ?? true;
  }
  private pending(): boolean {
    return Object.values(this.journal.state.mutations).some(
      (value) => value.phase !== "completed",
    );
  }

  private async cleanupStaging(
    mutation: PendingMutation,
    authority: NativeVaultAuthority,
  ): Promise<void> {
    await this.active(authority);
    if (!mutation.after) return;
    const path = join(this.staging, `${mutation.token}.after`);
    const staged = await readDiskFile(path).catch(() => null);
    await this.active(authority);
    // Retain changed staging and every preimage until a retention policy is supplied.
    if (sameDisk(mutation.after, staged))
      await discardStage(path, mutation.after.physical).catch(() => undefined);
  }

  private async finish(
    mutation: PendingMutation,
    authority: NativeVaultAuthority,
  ): Promise<SyncFileMutationReceipt> {
    await this.journal.archive(mutation, authority);
    await this.cleanupStaging(mutation, authority);
    return structuredClone(mutation.receipt!);
  }

  private async compactCompleted(
    authority: NativeVaultAuthority,
  ): Promise<void> {
    for (const mutation of Object.values(this.journal.state.mutations))
      if (mutation.phase === "completed")
        await this.finish(mutation, authority);
  }

  list(): Promise<SyncGuardedFile[]> {
    return this.serial(async () => {
      await this.compactCompleted(await this.active());
      if (this.pending())
        throw new Error("Recover the pending native apply before capture");
      const files = await scanFiles(this.root, (path) => this.included(path));
      const before = this.journal.state,
        next = structuredClone(before);
      const paths: Record<string, TrackedFile> = Object.create(null);
      const missingByPhysical = new Map<string, TrackedFile[]>(),
        frequency = new Map<string, number>();
      for (const disk of files.values())
        frequency.set(disk.physical, (frequency.get(disk.physical) ?? 0) + 1);
      for (const [path, value] of Object.entries(before.paths))
        if (!files.has(path))
          missingByPhysical.set(value.disk.physical, [
            ...(missingByPhysical.get(value.disk.physical) ?? []),
            value,
          ]);
      for (const [path, disk] of files) {
        const original = own(before.paths, path);
        const renamed =
          !original &&
          frequency.get(disk.physical) === 1 &&
          missingByPhysical.get(disk.physical)?.length === 1
            ? missingByPhysical.get(disk.physical)![0]
            : undefined;
        const prior =
          original?.disk.physical === disk.physical ? original : renamed;
        paths[path] = prior
          ? {
              ...prior,
              disk,
              contentGeneration:
                prior.disk.fingerprint === disk.fingerprint
                  ? prior.contentGeneration
                  : ++next.counter,
            }
          : {
              fileId: crypto.randomUUID(),
              hostFileId: crypto.randomUUID(),
              contentGeneration: ++next.counter,
              disk,
            };
      }
      next.paths = paths;
      if (JSON.stringify(before.paths) !== JSON.stringify(paths)) {
        await this.active();
        await this.journal.save(next);
      }
      return Object.entries(paths).map(([path, file]) => ({
        path,
        ...versionOf(file),
        openRead: () => this.openRead({ path, ...versionOf(file) }),
      }));
    });
  }

  /** Resolve a plain captured descriptor without retaining every capture across RPC. */
  openRead(input: SyncFileDescriptor): Promise<ReadableStream<Uint8Array>> {
    const captured = { path: input.path, ...versionOf(input) };
    return this.serial(async () => {
      await this.active();
      checkedPath(captured.path);
      if (!this.included(captured.path))
        throw new Error("Native read path is excluded from capture");
      const file = own(this.journal.state.paths, captured.path);
      if (!file || !sameGeneration(versionOf(file), captured))
        throw new Error("Native read descriptor is stale");
      const read = await guardedStream(
        await checkedParents(this.root, captured.path, false),
        file.disk,
        this.#abort.signal,
      );
      this.#reads.add(read.closed);
      void read.closed.then(() => this.#reads.delete(read.closed));
      return read.stream;
    });
  }

  receipt(operationId: string): Promise<SyncFileMutationReceipt | null> {
    return this.serial(async () => {
      const authority = await this.active();
      const mutation = own(
        this.journal.state.mutations,
        operationKey(operationId),
      );
      if (!mutation) {
        const archived = await this.journal.readReceipt(operationId, authority);
        if (!archived) return null;
        await this.cleanupStaging(archived, authority);
        return structuredClone(archived.receipt!);
      }
      return mutation.phase === "completed"
        ? this.finish(mutation, authority)
        : this.resume(mutation, authority);
    });
  }

  mutate(
    input: SyncFileMutation,
    source?: ReadableStream<Uint8Array>,
  ): Promise<SyncFileMutationReceipt> {
    return this.serial(async () => {
      const authority = await this.active();
      await this.compactCompleted(authority);
      const operation = normalizeOperation(input),
        key = operationKey(operation.id);
      if (!this.included(operation.path))
        throw new Error("Native apply path is excluded from capture");
      const known = own(this.journal.state.mutations, key);
      if (known) {
        if (JSON.stringify(known.operation) !== JSON.stringify(operation))
          throw new Error(
            "Native operation ID was reused with different parameters",
          );
        void source?.cancel().catch(() => undefined);
        return known.phase === "completed"
          ? this.finish(known, authority)
          : this.resume(known, authority);
      }
      const archived = await this.journal.readReceipt(operation.id, authority);
      if (archived) {
        if (JSON.stringify(archived.operation) !== JSON.stringify(operation))
          throw new Error(
            "Native operation ID was reused with different parameters",
          );
        void source?.cancel().catch(() => undefined);
        await this.cleanupStaging(archived, authority);
        return structuredClone(archived.receipt!);
      }
      if (this.pending())
        throw new Error(
          "Recover the pending native apply before another mutation",
        );
      const target = await checkedParents(this.root, operation.path, true),
        disk = await readDiskFile(target);
      const before = operation.expected
        ? (own(this.journal.state.paths, operation.path) ?? null)
        : null;
      if (
        operation.expected
          ? !before ||
            !sameGeneration(versionOf(before), operation.expected) ||
            !sameDisk(before.disk, disk)
          : disk !== null
      )
        throw new Error(
          "Native apply target changed; preserve the working file",
        );
      const token = crypto.randomUUID(),
        stage = join(this.staging, `${token}.after`);
      let prepared = false;
      let after: DiskFile | null = null;
      try {
        if (operation.kind === "write" && !source)
          throw new Error("Native write requires a content stream");
        after =
          operation.kind === "write"
            ? await stageFile(stage, source!, this.#abort.signal)
            : null;
        if (!sameDisk(before?.disk ?? null, await readDiskFile(target)))
          throw new Error("Native apply target changed during streaming");
        await this.active(authority);
        const next = structuredClone(this.journal.state);
        const result =
          operation.kind === "write"
            ? {
                fileId: operation.fileId,
                hostFileId: crypto.randomUUID(),
                contentGeneration: ++next.counter,
              }
            : null;
        const mutation: PendingMutation = {
          operation,
          token,
          phase: "prepared",
          before,
          after,
          result,
        };
        next.mutations[key] = mutation;
        // Once persistence begins its response may be lost after a successful commit.
        // Retain staged bytes until a reopened journal proves the outcome.
        prepared = true;
        await this.journal.save(next, authority);
        return await this.resume(mutation, authority);
      } catch (error) {
        if (!prepared && after)
          await discardStage(stage, after.physical).catch(() => undefined);
        throw error;
      }
    });
  }

  private async persist(
    mutation: PendingMutation,
    phase: PendingMutation["phase"],
    authority: NativeVaultAuthority,
  ): Promise<void> {
    await this.active(authority);
    const next = structuredClone(this.journal.state);
    next.mutations[operationKey(mutation.operation.id)] = {
      ...mutation,
      phase,
    };
    await this.journal.save(next, authority);
    mutation.phase = phase;
  }

  private async resume(
    original: PendingMutation,
    authority: NativeVaultAuthority,
  ): Promise<SyncFileMutationReceipt> {
    const mutation = structuredClone(original),
      { operation } = mutation;
    await this.active(authority);
    const target = await checkedParents(this.root, operation.path, true);
    const backup = join(this.staging, `${mutation.token}.before`),
      stage = join(this.staging, `${mutation.token}.after`);
    if (mutation.after && !sameDisk(mutation.after, await readDiskFile(stage)))
      throw new Error("Native apply staged content changed; retain intent");
    const validateBackup = async () => {
      if (
        mutation.before &&
        !sameDisk(mutation.before.disk, await readDiskFile(backup))
      ) {
        // Restore a displaced edit only into absence. Never replace a concurrent writer.
        if (!(await existing(target))) {
          await link(backup, target);
          await syncDirectory(dirname(target));
        }
        throw new Error(
          "Native apply preimage changed; review retained working content",
        );
      }
    };
    if (mutation.phase === "prepared") {
      if (mutation.before && !(await existing(backup))) {
        if (!sameDisk(mutation.before.disk, await readDiskFile(target)))
          throw new Error("Native apply target changed before claim");
        await this.active(authority);
        await rename(target, backup);
        await syncDirectory(dirname(target));
        await syncDirectory(this.staging);
      }
      if (mutation.before) await validateBackup();
      await this.persist(mutation, "claimed", authority);
    }
    if (mutation.phase === "claimed") {
      if (mutation.before) await validateBackup();
      const current = await readDiskFile(target);
      if (operation.kind === "write") {
        if (!current) {
          await this.active(authority);
          await link(stage, target);
          await syncDirectory(dirname(target));
        } else if (!sameDisk(current, mutation.after))
          throw new Error(
            "Native apply target changed after claim; retain intent",
          );
      } else if (current)
        throw new Error("Native removal target was recreated; retain intent");
      await this.persist(mutation, "installed", authority);
    }
    await this.active(authority);
    if (mutation.before) await validateBackup();
    const current = await readDiskFile(target);
    if (!sameDisk(current, mutation.after))
      throw new Error(
        "Native apply target changed before receipt; retain intent",
      );
    const receipt = { operation, result: mutation.result };
    const next = structuredClone(this.journal.state);
    if (mutation.result)
      Object.defineProperty(next.paths, operation.path, {
        value: { ...mutation.result, disk: current! },
        enumerable: true,
        configurable: true,
        writable: true,
      });
    else delete next.paths[operation.path];
    next.mutations[operationKey(operation.id)] = {
      ...mutation,
      phase: "completed",
      receipt,
    };
    await this.journal.save(next, authority);
    return this.finish(next.mutations[operationKey(operation.id)], authority);
  }

  close(): Promise<void> {
    if (this.#closing) return this.#closing;
    this.#closed = true;
    this.#abort.abort(new Error("Native sync vault is closing"));
    this.#closing = (async () => {
      await this.#tail.catch(() => undefined);
      await Promise.all([...this.#reads]);
      try {
        await this.repository.close?.();
      } finally {
        this.journal.state = {
          schemaVersion: 2,
          counter: 0,
          paths: {},
          mutations: {},
        };
        await this.lease.close();
      }
    })();
    return this.#closing;
  }
  private serial<T>(run: () => Promise<T>): Promise<T> {
    if (this.#closed)
      return Promise.reject(new Error("Native sync vault is closed"));
    const flight = this.#tail.then(run);
    this.#tail = flight.catch(() => undefined);
    return flight;
  }
}
