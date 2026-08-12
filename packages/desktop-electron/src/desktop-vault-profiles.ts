import type { VaultProfile } from "@lapis-notes/api";

export function getVaultProfileRootPath(profile: VaultProfile): string | null {
  const handle = profile.handle as { rootPath?: unknown } | string | undefined;
  if (typeof handle === "string") return handle;
  return typeof handle?.rootPath === "string" ? handle.rootPath : null;
}

export function getVaultProfileLocation(profile: VaultProfile): string {
  return getVaultProfileRootPath(profile) ?? "Desktop vault";
}
