import {
  makeFsError,
  mkdirWhenPathExists,
  resolveAbsolutePath,
} from "./paths.ts";
const portableFsCodes = new Set([
  "EACCES",
  "EBUSY",
  "EEXIST",
  "EILSEQ",
  "EIO",
  "EISDIR",
  "EINVAL",
  "ENOENT",
  "ENOTDIR",
  "EPERM",
]);

const denoFsNames: Record<string, string> = {
  AlreadyExists: "EEXIST",
  Busy: "EBUSY",
  IsADirectory: "EISDIR",
  NotADirectory: "ENOTDIR",
  NotFound: "ENOENT",
  PermissionDenied: "EACCES",
};

export function classifyVaultFsError(error: unknown): string {
  if (!error || typeof error !== "object") return "EIO";
  const record = error as { code?: unknown; name?: unknown };
  if (typeof record.code === "string" && portableFsCodes.has(record.code)) {
    return record.code;
  }
  if (typeof record.name === "string" && denoFsNames[record.name]) {
    return denoFsNames[record.name];
  }
  return "EIO";
}

export function toPortableVaultFsError(
  error: unknown,
  target: string,
): Error & { code: string } {
  return makeFsError(classifyVaultFsError(error), target);
}

function isMissingVaultFsError(error: unknown): boolean {
  return classifyVaultFsError(error) === "ENOENT";
}

async function ensureParent(path: string): Promise<void> {
  const parent = path.replace(/\/[^/]+$/, "");
  if (parent && parent !== path) {
    await Deno.mkdir(parent, { recursive: true });
  }
}

interface AtomicVaultWrite {
  rootPath: string;
  finalPath: string;
  temporaryPath: string;
  file: Deno.FsFile;
}

const atomicVaultWrites = new Map<string, AtomicVaultWrite>();

export function decodeVaultTextForBinding(
  bytes: Uint8Array,
  target: string,
): string {
  if (bytes.includes(0)) {
    throw makeFsError("EILSEQ", target);
  }
  return new TextDecoder().decode(bytes);
}

export async function writeTextAtomic(
  path: string,
  data: string,
): Promise<void> {
  await ensureParent(path);
  const tempPath = `${path}.tmp-${crypto.randomUUID()}`;
  await Deno.writeTextFile(tempPath, data);
  await Deno.rename(tempPath, path);
}

export type DenoVaultFileAction = (
  action: "open" | "reveal",
  path: string,
) => Promise<void>;

export async function handleDenoVaultFs(
  command: string,
  payload: Record<string, unknown> = {},
  runFileAction?: DenoVaultFileAction,
): Promise<unknown> {
  const rootPath = String(payload.rootPath ?? "");
  const normalizedPath = String(payload.normalizedPath ?? "");
  const abs = resolveAbsolutePath(rootPath, normalizedPath);

  try {
    switch (command) {
      case "desktop_fs_exists":
        try {
          await Deno.lstat(abs);
          return true;
        } catch (error) {
          if (isMissingVaultFsError(error)) return false;
          throw error;
        }
      case "desktop_fs_stat":
        try {
          const stat = await Deno.stat(abs);
          return {
            type: stat.isDirectory ? "folder" : "file",
            size: stat.size,
            ctime: stat.birthtime?.getTime() ?? stat.mtime?.getTime() ?? 0,
            mtime: stat.mtime?.getTime() ?? 0,
          };
        } catch (error) {
          if (isMissingVaultFsError(error)) return null;
          throw error;
        }
      case "desktop_fs_read_text":
        return decodeVaultTextForBinding(await Deno.readFile(abs), abs);
      case "desktop_fs_read_binary":
        return Array.from(await Deno.readFile(abs));
      case "desktop_fs_read_range": {
        const offset = Math.max(0, Number(payload.offset ?? 0));
        const length = Math.max(
          0,
          Math.min(256 * 1024, Number(payload.length ?? 0)),
        );
        const file = await Deno.open(abs, { read: true });
        try {
          await file.seek(offset, Deno.SeekMode.Start);
          const bytes = new Uint8Array(length);
          const read = await file.read(bytes);
          return Array.from(
            read === null ? new Uint8Array() : bytes.subarray(0, read),
          );
        } finally {
          file.close();
        }
      }
      case "desktop_fs_write_text":
        await writeTextAtomic(abs, String(payload.data ?? ""));
        return;
      case "desktop_fs_append_text": {
        await ensureParent(abs);
        const file = await Deno.open(abs, {
          create: true,
          append: true,
          write: true,
        });
        try {
          await file.write(
            new TextEncoder().encode(String(payload.data ?? "")),
          );
        } finally {
          file.close();
        }
        return;
      }
      case "desktop_fs_write_binary": {
        const data = payload.data;
        const bytes = Array.isArray(data)
          ? Uint8Array.from(data as number[])
          : new Uint8Array();
        await ensureParent(abs);
        await Deno.writeFile(abs, bytes);
        return;
      }
      case "desktop_fs_atomic_write_begin": {
        await ensureParent(abs);
        const operationId = crypto.randomUUID();
        const temporaryPath = `${abs}.lapis-write-${operationId}`;
        const file = await Deno.open(temporaryPath, {
          createNew: true,
          write: true,
        });
        atomicVaultWrites.set(operationId, {
          rootPath,
          finalPath: abs,
          temporaryPath,
          file,
        });
        return operationId;
      }
      case "desktop_fs_atomic_write_chunk": {
        const operationId = String(payload.operationId ?? "");
        const operation = atomicVaultWrites.get(operationId);
        if (!operation || operation.rootPath !== rootPath) {
          throw makeFsError("ENOENT", operationId);
        }
        const data = payload.data;
        const bytes = Array.isArray(data)
          ? Uint8Array.from(data as number[])
          : new Uint8Array();
        let offset = 0;
        while (offset < bytes.byteLength) {
          offset += await operation.file.write(bytes.subarray(offset));
        }
        return;
      }
      case "desktop_fs_atomic_write_commit": {
        const operationId = String(payload.operationId ?? "");
        const operation = atomicVaultWrites.get(operationId);
        if (!operation || operation.rootPath !== rootPath) {
          throw makeFsError("ENOENT", operationId);
        }
        atomicVaultWrites.delete(operationId);
        await operation.file.sync();
        operation.file.close();
        try {
          await Deno.rename(operation.temporaryPath, operation.finalPath);
        } catch (error) {
          await Deno.remove(operation.temporaryPath).catch(() => undefined);
          throw error;
        }
        return;
      }
      case "desktop_fs_atomic_write_abort": {
        const operationId = String(payload.operationId ?? "");
        const operation = atomicVaultWrites.get(operationId);
        if (!operation || operation.rootPath !== rootPath) return;
        atomicVaultWrites.delete(operationId);
        operation.file.close();
        await Deno.remove(operation.temporaryPath).catch(() => undefined);
        return;
      }
      case "desktop_fs_list": {
        const files: string[] = [];
        const folders: string[] = [];
        for await (const entry of Deno.readDir(abs)) {
          if (entry.isDirectory) folders.push(entry.name);
          else files.push(entry.name);
        }
        return { files, folders };
      }
      case "desktop_fs_mkdir": {
        const existing = await Deno.stat(abs)
          .then((stat) => ({ isDirectory: stat.isDirectory }))
          .catch((error) => {
            if (isMissingVaultFsError(error)) return null;
            throw error;
          });
        const action = mkdirWhenPathExists(existing);
        if (action === "skip") return;
        if (action === "eexist") throw makeFsError("EEXIST", abs);
        try {
          await Deno.mkdir(abs, {
            recursive: Boolean(payload.recursive),
          });
        } catch (error) {
          if (error instanceof Deno.errors.AlreadyExists) {
            const raced = await Deno.stat(abs)
              .then((stat) => ({ isDirectory: stat.isDirectory }))
              .catch((statError) => {
                if (isMissingVaultFsError(statError)) return null;
                throw statError;
              });
            if (mkdirWhenPathExists(raced) === "skip") return;
            throw makeFsError("EEXIST", abs);
          }
          throw error;
        }
        return;
      }
      case "desktop_fs_rmdir":
        await Deno.remove(abs, { recursive: Boolean(payload.recursive) });
        return;
      case "desktop_fs_remove":
        await Deno.remove(abs);
        return;
      case "desktop_fs_rename": {
        const dest = resolveAbsolutePath(
          rootPath,
          String(payload.normalizedNewPath ?? ""),
        );
        await Deno.rename(abs, dest);
        return;
      }
      case "desktop_fs_copy": {
        const dest = resolveAbsolutePath(
          rootPath,
          String(payload.normalizedNewPath ?? ""),
        );
        await Deno.copyFile(abs, dest);
        return;
      }
      case "desktop_fs_resolve_path":
        return abs;
      case "desktop_fs_to_vault_path":
        return String(payload.normalizedPath ?? "");
      case "desktop_fs_open_path":
      case "desktop_fs_reveal_path":
        if (!runFileAction) {
          throw Object.assign(new Error("File actions are unavailable"), {
            code: "EIO",
          });
        }
        await runFileAction(
          command === "desktop_fs_reveal_path" ? "reveal" : "open",
          abs,
        );
        return;
      default:
        throw new Error(`Unhandled filesystem command: ${command}`);
    }
  } catch (error) {
    throw toPortableVaultFsError(error, abs);
  }
}
