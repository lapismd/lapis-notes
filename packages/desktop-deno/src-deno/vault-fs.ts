import {
  basename,
  makeFsError,
  mkdirWhenPathExists,
  normalizeRootPath,
  resolveAbsolutePath,
} from "./paths.ts";
import { runFileAction } from "./native-actions.ts";

export type VaultSelection = {
  path: string;
  name: string;
};

async function ensureParent(path: string): Promise<void> {
  const parent = path.replace(/\/[^/]+$/, "");
  if (parent && parent !== path) {
    await Deno.mkdir(parent, { recursive: true });
  }
}

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

export async function handleVaultFs(
  command: string,
  payload: Record<string, unknown> = {},
): Promise<unknown> {
  const rootPath = String(payload.rootPath ?? "");
  const normalizedPath = String(payload.normalizedPath ?? "");
  const abs = resolveAbsolutePath(rootPath, normalizedPath);

  switch (command) {
    case "desktop_fs_exists":
      try {
        await Deno.lstat(abs);
        return true;
      } catch {
        return false;
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
      } catch {
        return null;
      }
    case "desktop_fs_read_text":
      try {
        return decodeVaultTextForBinding(await Deno.readFile(abs), abs);
      } catch (error) {
        if ((error as { code?: string }).code === "EILSEQ") throw error;
        throw makeFsError("ENOENT", abs);
      }
    case "desktop_fs_read_binary":
      try {
        return Array.from(await Deno.readFile(abs));
      } catch {
        throw makeFsError("ENOENT", abs);
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
        await file.write(new TextEncoder().encode(String(payload.data ?? "")));
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
    case "desktop_fs_list": {
      try {
        const files: string[] = [];
        const folders: string[] = [];
        for await (const entry of Deno.readDir(abs)) {
          if (entry.isDirectory) folders.push(entry.name);
          else files.push(entry.name);
        }
        return { files, folders };
      } catch {
        throw makeFsError("ENOENT", abs);
      }
    }
    case "desktop_fs_mkdir": {
      const existing = await Deno.stat(abs)
        .then((stat) => ({ isDirectory: stat.isDirectory }))
        .catch(() => null);
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
            .catch(() => null);
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
      await runFileAction(
        command === "desktop_fs_reveal_path" ? "reveal" : "open",
        abs,
      );
      return;
    default:
      throw new Error(`Unhandled filesystem command: ${command}`);
  }
}

async function pickFolderNative(message: string): Promise<string | null> {
  if (Deno.build.os === "darwin") {
    const script = `try
  POSIX path of (choose folder with prompt ${JSON.stringify(message)})
on error number -128
  ""
end try`;
    const output = await new Deno.Command("osascript", {
      args: ["-e", script],
      stdout: "piped",
      stderr: "piped",
    }).output();
    if (!output.success) return null;
    const picked = new TextDecoder()
      .decode(output.stdout)
      .trim()
      .replace(/\/+$/u, "");
    return picked || null;
  }
  return prompt(`${message} (absolute path):`)?.trim() || null;
}

export async function selectVaultFolder(
  create: boolean,
): Promise<VaultSelection | null> {
  const autoPath =
    Deno.env.get("LAPIS_DENO_VAULT_AUTO") === "1"
      ? Deno.env.get("LAPIS_DENO_VAULT")?.trim()
      : undefined;
  const selected =
    autoPath && !create
      ? autoPath
      : await pickFolderNative(
          create
            ? "Create a new vault folder"
            : "Open an existing vault folder",
        );
  if (!selected) return null;
  const path = normalizeRootPath(selected);
  if (!path.startsWith("/")) {
    throw makeFsError("EINVAL", path);
  }
  if (create) {
    await Deno.mkdir(path, { recursive: true });
  }
  try {
    const stat = await Deno.stat(path);
    if (!stat.isDirectory) throw makeFsError("ENOTDIR", path);
  } catch (error) {
    if (error instanceof Error && "code" in error) throw error;
    throw makeFsError("ENOENT", path);
  }
  return { path, name: basename(path) };
}

export async function moveVaultFolder(
  currentPath: string,
): Promise<VaultSelection | null> {
  const destination = await pickFolderNative("Choose the new vault location");
  if (!destination) return null;
  const current = normalizeRootPath(currentPath);
  const destRoot = normalizeRootPath(destination);
  const destPath = destRoot.endsWith(`/${basename(current)}`)
    ? destRoot
    : `${destRoot}/${basename(current)}`;
  if (destPath !== current) {
    await Deno.rename(current, destPath);
  }
  return { path: destPath, name: basename(destPath) };
}
