import {
  classifyVaultFsError,
  decodeVaultTextForBinding,
  handleDenoVaultFs,
  toPortableVaultFsError,
  writeTextAtomic,
} from "@lapis-notes/deno-host-services/vault-fs";
import { basename, makeFsError, normalizeRootPath } from "./paths.ts";
import { runFileAction } from "./native-actions.ts";

export {
  classifyVaultFsError,
  decodeVaultTextForBinding,
  toPortableVaultFsError,
  writeTextAtomic,
};

export type VaultSelection = {
  path: string;
  name: string;
};

export function handleVaultFs(
  command: string,
  payload: Record<string, unknown> = {},
): Promise<unknown> {
  return handleDenoVaultFs(command, payload, runFileAction);
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
    throw toPortableVaultFsError(error, path);
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
