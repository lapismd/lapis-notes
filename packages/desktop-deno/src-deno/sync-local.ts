import { createHash, type Hash } from "node:crypto";
import { mkdir, mkdtemp, open, rm, type FileHandle } from "node:fs/promises";
import { isAbsolute, join, relative } from "node:path";
import type {
  SyncFileDescriptor,
  SyncFileMutation,
  SyncLocalHostCapabilities,
  SyncVaultStateCrypto,
  SyncOperationAuthority,
} from "@lapis-notes/api/sync-repository";
import { NativeSyncLocalProvider } from "@lapis-notes/deno-host-services/sync-local-provider";
import { inspectNativeSyncRoot } from "@lapis-notes/deno-host-services/sync-vault-root";
import { encodeSyncValue } from "../src/sync-security-protocol.ts";
import {
  SYNC_LOCAL_CHUNK_BYTES,
  SYNC_LOCAL_WIRE_CHARS,
  type SyncLocalOperation,
} from "../src/sync-local-protocol.ts";

interface ReadTransfer {
  signature: string;
  reader?: ReadableStreamDefaultReader<Uint8Array>;
  bytes?: Uint8Array;
  offset: number;
  meta?: { version: number; epoch: number };
  sequence: number;
  last?: {
    sequence: number;
    value: { done: boolean; bytes?: Uint8Array; position: number };
  };
  closing?: Promise<void>;
}
interface Upload {
  kind: "blob" | "state" | "write";
  directory: string;
  path: string;
  file: FileHandle;
  offset: number;
  sequence: number;
  last?: { sequence: number; hash: string };
  pending?: { sequence: number; hash: string };
  finish?: { signature: string; value: unknown };
  authority?: SyncOperationAuthority;
  hash: Hash;
  expectedHash?: string;
  completionSignature?: string;
}
interface Options {
  runtimeId: string;
  rootPath: string;
  rootBinding: string;
  storagePath: string;
  crypto: SyncVaultStateCrypto;
  assertActive(): void;
}
const id = (value: unknown): string => {
  if (typeof value !== "string" || !/^[A-Za-z0-9._:-]{1,160}$/u.test(value))
    throw new Error("Invalid Sync transfer identifier");
  return value;
};
const integer = (value: unknown): number => {
  if (!Number.isSafeInteger(value) || Number(value) < 0)
    throw new Error("Invalid Sync transfer position");
  return Number(value);
};
function fields(
  value: unknown,
  keys: readonly string[],
): Record<string, unknown> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).some((key) => !keys.includes(key))
  )
    throw new Error("Invalid Sync transfer fields");
  return value as Record<string, unknown>;
}
function descriptor(value: unknown): SyncFileDescriptor {
  const file = fields(value, [
    "path",
    "fileId",
    "hostFileId",
    "contentGeneration",
  ]);
  if (
    typeof file.path !== "string" ||
    typeof file.fileId !== "string" ||
    (file.hostFileId !== undefined && typeof file.hostFileId !== "string")
  )
    throw new Error("Invalid Sync file descriptor");
  return {
    path: file.path,
    fileId: file.fileId,
    hostFileId: file.hostFileId as string | undefined,
    contentGeneration: integer(file.contentGeneration),
  };
}

/** Bounded JSON transfer resources, bound to one admitted native security session. */
export class DenoSyncLocalSession {
  readonly #provider: NativeSyncLocalProvider;
  readonly #local: SyncLocalHostCapabilities;
  readonly #captures = new Map<string, SyncFileDescriptor[]>();
  readonly #reads = new Map<string, ReadTransfer>();
  readonly #uploads = new Map<string, Upload>();
  readonly #stopping: Promise<unknown>[] = [];
  #active = true;
  #closing: Promise<void> | undefined;
  constructor(private readonly options: Options) {
    this.#outsideVault(options.storagePath);
    this.#provider = new NativeSyncLocalProvider({
      ...options,
      assertActive: () => this.#assert(),
      includePath: (path) =>
        ![".obsidian", ".lapis", ".git", ".jj"].some(
          (root) => path === root || path.startsWith(`${root}/`),
        ),
    });
    this.#local = this.#provider.forRuntime(options.runtimeId);
  }
  #outsideVault(path: string): void {
    const part = relative(this.options.rootPath, path);
    if (!part || (part.split(/[\\/]/u)[0] !== ".." && !isAbsolute(part)))
      throw new Error("Native Sync staging must be outside the working vault");
  }
  #assert(): void {
    if (!this.#active) throw new Error("Native Sync data session is revoked");
    this.options.assertActive();
  }
  async call(operation: SyncLocalOperation, args: unknown[]): Promise<unknown> {
    this.#assert();
    const arity: Record<SyncLocalOperation, number> = {
      captureStart: 1,
      capturePage: 2,
      captureClose: 1,
      fileRead: 2,
      blobRead: 2,
      stateRead: 1,
      readChunk: 2,
      readClose: 1,
      blobHas: 1,
      uploadStart: 3,
      uploadChunk: 3,
      uploadFinish: 2,
      uploadClose: 1,
      mutate: 2,
      receipt: 2,
    };
    if (args.length !== arity[operation])
      throw new Error("Invalid Sync data arguments");
    if (operation === "readClose") {
      await this.#closeRead(id(args[0]));
      return;
    }
    if (operation === "uploadClose") {
      await this.#closeUpload(id(args[0]));
      return;
    }
    if (operation === "captureClose") {
      this.#captures.delete(id(args[0]));
      return;
    }
    const status = await this.options.crypto.status();
    this.#assert();
    if (status.state !== "unlocked" || status.deviceState !== "active")
      throw new Error("Sync data requires an unlocked active endpoint");
    const root = await inspectNativeSyncRoot(this.options.rootPath);
    this.#assert();
    if (root.binding !== this.options.rootBinding)
      throw new Error("Admitted Sync root changed");
    switch (operation) {
      case "captureStart": {
        const key = id(args[0]);
        if (!this.#captures.has(key)) {
          if (this.#captures.size >= 4)
            throw new Error("Too many Sync captures");
          const files = await this.#local.list();
          this.#assert();
          this.#captures.set(
            key,
            files.map(({ path, fileId, hostFileId, contentGeneration }) => ({
              path,
              fileId,
              hostFileId,
              contentGeneration,
            })),
          );
        }
        return key;
      }
      case "capturePage": {
        const files = this.#captures.get(id(args[0])),
          start = integer(args[1]);
        if (!files || start > files.length)
          throw new Error("Sync capture is unavailable");
        const page: SyncFileDescriptor[] = [];
        for (
          let index = start;
          index < files.length && page.length < 128;
          index++
        ) {
          page.push(files[index]!);
          if (encodeSyncValue(page).length > SYNC_LOCAL_WIRE_CHARS - 1024) {
            page.pop();
            break;
          }
        }
        if (!page.length && start < files.length)
          throw new Error("Sync path metadata exceeds transfer limit");
        return {
          files: page,
          next: start + page.length < files.length ? start + page.length : null,
        };
      }
      case "fileRead": {
        const key = id(args[0]),
          file = descriptor(args[1]),
          signature = JSON.stringify(["file", file]);
        const prior = this.#read(key, signature);
        if (!prior) {
          const stream = await this.#provider.openRead(
            this.options.runtimeId,
            file,
          );
          try {
            this.#assert();
          } catch (error) {
            await stream.cancel();
            throw error;
          }
          const reader = stream.getReader();
          void reader.closed.catch(() => undefined);
          this.#reads.set(key, { signature, reader, offset: 0, sequence: 0 });
        }
        return key;
      }
      case "blobRead": {
        const key = id(args[0]),
          signature = JSON.stringify(["blob", args[1]]);
        if (!this.#read(key, signature)) {
          const bytes = await this.#local.repository.blobs.get(String(args[1]));
          this.#assert();
          this.#reads.set(key, { signature, bytes, offset: 0, sequence: 0 });
        }
        return key;
      }
      case "stateRead": {
        const key = id(args[0]);
        let read = this.#read(key, "state");
        if (!read) {
          const state = await this.#local.repository.readState();
          this.#assert();
          if (!state) return null;
          read = {
            signature: "state",
            bytes: state.ciphertext,
            meta: { version: state.version, epoch: state.epoch },
            offset: 0,
            sequence: 0,
          };
          this.#reads.set(key, read);
        }
        return { id: key, ...read.meta };
      }
      case "readChunk": {
        const read = this.#reads.get(id(args[0])),
          sequence = integer(args[1]);
        if (!read || read.closing)
          throw new Error("Sync read transfer is unavailable");
        if (read.last?.sequence === sequence) return read.last.value;
        if (sequence !== read.sequence)
          throw new Error("Sync read transfer sequence changed");
        const result = read.reader
          ? await read.reader.read()
          : read.offset >= read.bytes!.length
            ? { done: true as const, value: undefined }
            : {
                done: false as const,
                value: read.bytes!.slice(
                  read.offset,
                  read.offset + SYNC_LOCAL_CHUNK_BYTES,
                ),
              };
        this.#assert();
        if (result.value && result.value.byteLength > SYNC_LOCAL_CHUNK_BYTES)
          throw new Error("Native Sync chunk exceeds transfer limit");
        read.offset += result.value?.byteLength ?? 0;
        read.sequence++;
        const value = {
          done: result.done,
          position: read.offset,
          ...(result.value ? { bytes: result.value } : {}),
        };
        read.last = { sequence, value };
        return value;
      }
      case "blobHas":
        return this.#local.repository.blobs.has(String(args[0]));
      case "uploadStart": {
        const key = id(args[0]),
          kind = args[1];
        if (!["write", "blob", "state"].includes(String(kind)))
          throw new Error("Invalid Sync upload purpose");
        const authority =
          kind === "blob" ? undefined : await this.#authority(args[2]);
        const prior = this.#uploads.get(key);
        if (prior) {
          if (
            prior.kind !== kind ||
            encodeSyncValue(prior.authority) !== encodeSyncValue(authority)
          )
            throw new Error("Sync upload purpose or authority changed");
          return key;
        }
        if (this.#uploads.size >= 4) throw new Error("Too many Sync uploads");
        await mkdir(this.options.storagePath, { recursive: true, mode: 0o700 });
        const storage = await inspectNativeSyncRoot(this.options.storagePath);
        this.#outsideVault(storage.root);
        const staging = join(storage.root, "transfers");
        await mkdir(staging, { recursive: true, mode: 0o700 });
        const physical = await inspectNativeSyncRoot(staging);
        this.#outsideVault(physical.root);
        const directory = await mkdtemp(join(physical.root, "upload-")),
          path = join(directory, "body");
        try {
          const file = await open(path, "wx+", 0o600);
          try {
            this.#assert();
          } catch (error) {
            await file.close();
            throw error;
          }
          this.#uploads.set(key, {
            kind: kind as Upload["kind"],
            directory,
            path,
            file,
            offset: 0,
            sequence: 0,
            authority,
            hash: createHash("sha256"),
          });
          return key;
        } catch (error) {
          await rm(directory, { recursive: true, force: true });
          throw error;
        }
      }
      case "uploadChunk": {
        const upload = this.#uploads.get(id(args[0])),
          sequence = integer(args[1]),
          bytes = args[2];
        if (
          !upload ||
          upload.completionSignature ||
          !(bytes instanceof Uint8Array) ||
          !bytes.length ||
          bytes.length > SYNC_LOCAL_CHUNK_BYTES
        )
          throw new Error("Invalid Sync upload chunk");
        const hash = createHash("sha256").update(bytes).digest("hex");
        if (upload.last?.sequence === sequence) {
          if (upload.last.hash !== hash)
            throw new Error("Sync upload retry bytes changed");
          return;
        }
        if (
          upload.sequence !== sequence ||
          (upload.pending && upload.pending.hash !== hash)
        )
          throw new Error("Sync upload sequence changed");
        if (
          !Number.isSafeInteger(upload.offset + bytes.length) ||
          (upload.kind !== "write" &&
            upload.offset + bytes.length > 64 * 1024 * 1024)
        )
          throw new Error("Sync upload exceeds storage limit");
        upload.pending = { sequence, hash };
        for (let written = 0; written < bytes.length; ) {
          this.#assert();
          const result = await upload.file.write(
            bytes,
            written,
            bytes.length - written,
            upload.offset + written,
          );
          if (!result.bytesWritten)
            throw new Error("Sync upload write made no progress");
          written += result.bytesWritten;
        }
        this.#assert();
        upload.hash.update(bytes);
        upload.offset += bytes.length;
        upload.sequence++;
        upload.last = { sequence, hash };
        upload.pending = undefined;
        return;
      }
      case "uploadFinish":
        return this.#finish(id(args[0]), args[1]);
      case "mutate": {
        await this.#authority(args[1]);
        const operation = fields(args[0], [
          "id",
          "kind",
          "path",
          "expected",
          "fileId",
        ]);
        if (operation.kind !== "remove")
          throw new Error("Writes require a streamed upload");
        fields(operation.expected, [
          "fileId",
          "hostFileId",
          "contentGeneration",
        ]);
        return this.#local.apply.mutate(
          operation as unknown as SyncFileMutation,
        );
      }
      case "receipt": {
        await this.#authority(args[1]);
        if (typeof args[0] !== "string" || !args[0] || args[0].length > 512)
          throw new Error("Invalid Sync receipt identifier");
        return this.#local.apply.receipt(args[0]);
      }
    }
  }
  async #authority(input: unknown): Promise<SyncOperationAuthority> {
    const expected = fields(input, [
      "vaultId",
      "devicePublicKey",
      "epoch",
      "membershipGeneration",
    ]);
    const status = await this.options.crypto.status();
    this.#assert();
    if (
      status.state !== "unlocked" ||
      status.deviceState !== "active" ||
      expected.vaultId !== status.vaultId ||
      expected.devicePublicKey !== status.devicePublicKey ||
      expected.epoch !== status.currentEpoch ||
      expected.membershipGeneration !== status.membershipGeneration
    )
      throw new Error("Sync operation authority changed");
    return expected as unknown as SyncOperationAuthority;
  }
  #read(key: string, signature: string): ReadTransfer | undefined {
    const read = this.#reads.get(key);
    if (read && read.signature !== signature)
      throw new Error("Sync read parameters changed");
    if (!read && this.#reads.size >= 16)
      throw new Error("Too many Sync read transfers");
    return read;
  }
  async #finish(key: string, input: unknown): Promise<unknown> {
    const upload = this.#uploads.get(key);
    if (!upload || upload.pending)
      throw new Error("Sync upload is unavailable or incomplete");
    const signature = encodeSyncValue(input);
    if (upload.completionSignature && upload.completionSignature !== signature)
      throw new Error("Sync upload completion parameters changed");
    upload.completionSignature = signature;
    if (upload.finish) {
      if (upload.finish.signature !== signature)
        throw new Error("Sync upload completion parameters changed");
      return upload.finish.value;
    }
    if (upload.authority) await this.#authority(upload.authority);
    await upload.file.sync();
    upload.expectedHash ??= upload.hash.digest("hex");
    let value: unknown;
    if (upload.kind === "blob") {
      if (input !== null) throw new Error("Invalid blob completion arguments");
      value = await this.#local.repository.blobs.put(
        new Uint8Array(
          await new Response(this.#uploadStream(upload)).arrayBuffer(),
        ),
      );
    } else if (upload.kind === "state") {
      const state = fields(input, ["expectedVersion", "version", "epoch"]);
      if (state.epoch !== upload.authority?.epoch)
        throw new Error("Sync state epoch changed");
      value = await this.#local.repository.compareAndSwap(
        integer(state.expectedVersion),
        {
          version: integer(state.version),
          epoch: integer(state.epoch),
          ciphertext: new Uint8Array(
            await new Response(this.#uploadStream(upload)).arrayBuffer(),
          ),
        },
      );
    } else {
      const operation = fields(input, [
        "id",
        "kind",
        "path",
        "expected",
        "fileId",
      ]);
      if (operation.kind !== "write")
        throw new Error("Invalid streamed mutation kind");
      if (operation.expected !== null)
        fields(operation.expected, [
          "fileId",
          "hostFileId",
          "contentGeneration",
        ]);
      const source = this.#uploadStream(upload);
      try {
        value = await this.#local.apply.mutate(
          operation as unknown as SyncFileMutation,
          source,
        );
      } finally {
        if (!source.locked) await source.cancel();
      }
    }
    upload.finish = { signature, value };
    return value;
  }
  #uploadStream(upload: Upload): ReadableStream<Uint8Array> {
    let offset = 0,
      terminal = false;
    const digest = createHash("sha256");
    return new ReadableStream<Uint8Array>(
      {
        pull: async (controller) => {
          if (terminal) return;
          try {
            this.#assert();
            const bytes = new Uint8Array(SYNC_LOCAL_CHUNK_BYTES);
            const { bytesRead } = await upload.file.read(
              bytes,
              0,
              bytes.length,
              offset,
            );
            this.#assert();
            if (terminal) return;
            if (!bytesRead) {
              if (
                offset !== upload.offset ||
                digest.digest("hex") !== upload.expectedHash
              )
                throw new Error("Sync upload staged bytes changed");
              terminal = true;
              controller.close();
              return;
            }
            offset += bytesRead;
            if (offset > upload.offset)
              throw new Error("Sync upload staged length changed");
            const value = bytes.subarray(0, bytesRead);
            digest.update(value);
            controller.enqueue(value);
          } catch (error) {
            terminal = true;
            controller.error(error);
          }
        },
        cancel() {
          terminal = true;
        },
      },
      { highWaterMark: 0 },
    );
  }
  #closeRead(key: string): Promise<void> {
    const read = this.#reads.get(key);
    if (!read) return Promise.resolve();
    return (read.closing ??= (async () => {
      try {
        await read.reader?.cancel();
      } finally {
        read.reader?.releaseLock();
        this.#reads.delete(key);
      }
    })());
  }
  async #closeUpload(key: string): Promise<void> {
    const upload = this.#uploads.get(key);
    if (!upload) return;
    await upload.file.close();
    await rm(upload.directory, { recursive: true, force: true });
    this.#uploads.delete(key);
  }
  stop(): void {
    if (!this.#active) return;
    this.#active = false;
    this.#stopping.push(
      ...[...this.#reads.keys()].map((key) => this.#closeRead(key)),
      this.#provider.close(),
    );
    for (const promise of this.#stopping) void promise.catch(() => undefined);
  }
  close(): Promise<void> {
    if (this.#closing) return this.#closing;
    this.stop();
    return (this.#closing = Promise.allSettled([
      ...this.#stopping,
      ...[...this.#uploads.keys()].map((key) => this.#closeUpload(key)),
    ]).then((results) => {
      this.#captures.clear();
      const failure = results.find((result) => result.status === "rejected");
      if (failure?.status === "rejected") throw failure.reason;
    }));
  }
}
