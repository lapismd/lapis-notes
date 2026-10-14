import { createHash } from "node:crypto";
import { constants, type BigIntStats } from "node:fs";
import {
  lstat,
  mkdir,
  open,
  readdir,
  realpath,
  unlink,
} from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

export const STAGING_DIRECTORY = ".lapis/sync-apply";
const CHUNK_BYTES = 256 * 1024;
export interface DiskFile {
  physical: string;
  fingerprint: string;
  size: number;
}
export const hash = (text: string) =>
  createHash("sha256").update(text).digest("hex");
export const hashBytes = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
const identity = (stat: BigIntStats) =>
  `${stat.dev}:${stat.ino}:${stat.birthtimeNs}`;
const stamp = (stat: BigIntStats) =>
  `${identity(stat)}:${stat.size}:${stat.mtimeNs}:${stat.ctimeNs}`;

export function checkedPath(path: string): string {
  if (
    !path ||
    isAbsolute(path) ||
    /^[A-Za-z]:/u.test(path) ||
    path.includes("\\") ||
    path.includes("\0") ||
    path.split("/").some((part) => !part || part === "." || part === "..") ||
    path === ".lapis" ||
    path.startsWith(".lapis/")
  )
    throw new Error("Invalid or reserved guarded vault path");
  return path;
}

export async function existing(path: string): Promise<BigIntStats | null> {
  try {
    return await lstat(path, { bigint: true });
  } catch (error) {
    if ((error as { code?: string }).code === "ENOENT") return null;
    throw error;
  }
}

export async function syncDirectory(path: string): Promise<void> {
  const file = await open(path, "r");
  try {
    await file.sync();
  } finally {
    await file.close();
  }
}

export { inspectNativeSyncRoot as checkedRoot } from "./sync-vault-root.ts";

/** Reject links at each path component; file installation itself uses no-replace links. */
export async function checkedParents(
  root: string,
  path: string,
  create: boolean,
): Promise<string> {
  checkedPath(path);
  const parts = path.split("/");
  let current = root;
  for (const part of parts.slice(0, -1)) {
    const parent = current;
    current = join(current, part);
    let stat = await existing(current);
    if (!stat && create) {
      try {
        await mkdir(current, { mode: 0o700 });
        await syncDirectory(parent);
      } catch (error) {
        if ((error as { code?: string }).code !== "EEXIST") throw error;
      }
      stat = await existing(current);
    }
    if (stat && (!stat.isDirectory() || stat.isSymbolicLink()))
      throw new Error("Guarded vault parent is not a physical directory");
    if (!stat) return join(root, path);
  }
  return join(root, path);
}

export async function stagingRoot(root: string): Promise<string> {
  let current = root;
  for (const part of STAGING_DIRECTORY.split("/")) {
    const parent = current;
    current = join(current, part);
    const stat = await existing(current);
    if (!stat) {
      await mkdir(current, { mode: 0o700 });
      await syncDirectory(parent);
    } else if (!stat.isDirectory() || stat.isSymbolicLink())
      throw new Error("Invalid native apply staging directory");
  }
  return current;
}

export async function readDiskFile(path: string): Promise<DiskFile | null> {
  const before = await existing(path);
  if (!before) return null;
  if (!before.isFile() || before.isSymbolicLink())
    throw new Error("Guarded target must be a regular file");
  const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await file.stat({ bigint: true });
    if (stamp(before) !== stamp(stat))
      throw new Error("File changed before guarded read");
    const digest = createHash("sha256"),
      buffer = new Uint8Array(CHUNK_BYTES);
    while (true) {
      const { bytesRead } = await file.read(buffer);
      if (!bytesRead) break;
      digest.update(buffer.subarray(0, bytesRead));
    }
    const after = await existing(path);
    if (
      !after ||
      stamp(stat) !== stamp(await file.stat({ bigint: true })) ||
      stamp(stat) !== stamp(after)
    )
      throw new Error("File changed during guarded read");
    return {
      physical: identity(stat),
      fingerprint: digest.digest("hex"),
      size: Number(stat.size),
    };
  } finally {
    await file.close();
  }
}

export function sameDisk(
  left: DiskFile | null,
  right: DiskFile | null,
): boolean {
  return !left || !right
    ? left === right
    : left.physical === right.physical &&
        left.fingerprint === right.fingerprint &&
        left.size === right.size;
}

export async function scanFiles(
  root: string,
  include: (path: string) => boolean,
): Promise<Map<string, DiskFile>> {
  const files = new Map<string, DiskFile>();
  const visit = async (directory: string) => {
    for (const entry of await readdir(join(root, directory), {
      withFileTypes: true,
    })) {
      const path = directory ? `${directory}/${entry.name}` : entry.name;
      if (path === ".lapis" || path.startsWith(".lapis/") || !include(path))
        continue;
      checkedPath(path);
      if (entry.isSymbolicLink())
        throw new Error("Symlinks are not supported in guarded vault capture");
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile()) {
        const file = await readDiskFile(
          await checkedParents(root, path, false),
        );
        if (!file) throw new Error("File disappeared during guarded capture");
        files.set(path, file);
      } else throw new Error("Unsupported guarded vault entry");
    }
  };
  await visit("");
  return files;
}

export async function stageFile(
  path: string,
  source: ReadableStream<Uint8Array>,
  signal: AbortSignal,
): Promise<DiskFile> {
  const file = await open(path, "wx", 0o600);
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let physical: string | undefined;
  const abort = () => {
    void reader?.cancel(signal.reason).catch(() => undefined);
  };
  try {
    physical = identity(await file.stat({ bigint: true }));
    reader = source.getReader();
    signal.addEventListener("abort", abort, { once: true });
    while (true) {
      signal.throwIfAborted();
      const next = await reader.read();
      signal.throwIfAborted();
      if (next.done) break;
      if (
        !(next.value instanceof Uint8Array) ||
        next.value.byteLength > 32 * 1024 * 1024
      )
        throw new Error("Invalid native apply stream chunk");
      for (let offset = 0; offset < next.value.byteLength; ) {
        const length = Math.min(CHUNK_BYTES, next.value.byteLength - offset);
        const { bytesWritten } = await file.write(
          next.value.subarray(offset, offset + length),
        );
        if (!bytesWritten)
          throw new Error("Native apply write made no progress");
        offset += bytesWritten;
      }
    }
    await file.sync();
    await syncDirectory(dirname(path));
    const staged = await readDiskFile(path);
    if (!staged || staged.physical !== physical)
      throw new Error("Native apply staging file changed during preparation");
    return staged;
  } catch (error) {
    void reader?.cancel(error).catch(() => undefined);
    if (physical) await discardStage(path, physical).catch(() => undefined);
    throw error;
  } finally {
    signal.removeEventListener("abort", abort);
    reader?.releaseLock();
    await file.close();
  }
}

/** Only discard bytes created by this preparation, never a collided/replaced file. */
export async function discardStage(
  path: string,
  physical: string,
): Promise<void> {
  const stat = await existing(path);
  if (stat?.isFile() && identity(stat) === physical) {
    await unlink(path);
    await syncDirectory(dirname(path));
  }
}

export async function guardedStream(
  path: string,
  expected: DiskFile,
  signal: AbortSignal,
): Promise<{ stream: ReadableStream<Uint8Array>; closed: Promise<void> }> {
  signal.throwIfAborted();
  const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  let initial: BigIntStats;
  try {
    initial = await file.stat({ bigint: true });
    if (
      !initial.isFile() ||
      identity(initial) !== expected.physical ||
      Number(initial.size) !== expected.size
    )
      throw new Error("File identity changed before stream");
    signal.throwIfAborted();
  } catch (error) {
    await file.close();
    throw error;
  }
  const digest = createHash("sha256");
  let closing: Promise<void> | null = null,
    finished = false,
    controller: ReadableStreamDefaultController<Uint8Array>;
  let released!: () => void;
  const closed = new Promise<void>((resolve) => {
    released = resolve;
  });
  const close = () => {
    signal.removeEventListener("abort", abort);
    return (closing ??= file.close().finally(released));
  };
  const fail = async (error: unknown) => {
    if (!finished) {
      finished = true;
      controller.error(error);
    }
    await close();
  };
  const abort = () => {
    void fail(signal.reason).catch(() => undefined);
  };
  const stream = new ReadableStream<Uint8Array>(
    {
      start(value) {
        controller = value;
        signal.addEventListener("abort", abort, { once: true });
        if (signal.aborted) abort();
      },
      async pull() {
        if (finished) return;
        try {
          const bytes = new Uint8Array(CHUNK_BYTES),
            { bytesRead } = await file.read(bytes);
          if (finished) return;
          if (!bytesRead) {
            if (
              stamp(initial) !== stamp(await file.stat({ bigint: true })) ||
              digest.digest("hex") !== expected.fingerprint
            )
              throw new Error("File changed during guarded stream");
            await close();
            if (!finished) {
              finished = true;
              controller.close();
            }
            return;
          }
          const value = bytes.subarray(0, bytesRead);
          digest.update(value);
          controller.enqueue(value);
        } catch (error) {
          await fail(error);
        }
      },
      async cancel() {
        finished = true;
        await close();
      },
    },
    { highWaterMark: 0 },
  );
  return { stream, closed };
}

export function outsideVault(root: string, statePath: string): void {
  const path = relative(root, resolve(statePath));
  if (!path || (path.split(/[\\/]/u)[0] !== ".." && !isAbsolute(path)))
    throw new Error("Native apply journal must be outside the working vault");
}
