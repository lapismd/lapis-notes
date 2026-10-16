import {
  getBootstrapAppearanceMode,
  getNativeDesktopPlatform,
  listVaultProfiles,
  moveNativeDesktopVaultProfile,
  removeStoredVaultProfile,
  replaceVaultProfile,
  revealNativeDesktopVaultPath,
  saveBootstrapAppearanceMode,
} from "@lapis-notes/api";
import type { DesktopVaultLauncherHost } from "@lapis-notes/workspace";
import { getVaultProfileRootPath } from "./desktop-vault-profiles";

export const desktopVaultLauncherHost: DesktopVaultLauncherHost = {
  listProfiles: listVaultProfiles,
  getAppearance: getBootstrapAppearanceMode,
  saveAppearance: saveBootstrapAppearanceMode,
  copyId: async (profile) => navigator.clipboard.writeText(profile.id),
  rename: (profile, name) =>
    replaceVaultProfile(profile.id, {
      ...profile,
      name,
      updatedAt: Date.now(),
    }),
  move: async (profile) =>
    Boolean(await moveNativeDesktopVaultProfile(profile)),
  remove: (profile) => removeStoredVaultProfile(profile.id),
  reveal: async (profile) => {
    const path = getVaultProfileRootPath(profile);
    if (!path) throw new Error("Vault folder is unavailable");
    await revealNativeDesktopVaultPath(path, "/");
  },
  get revealLabel() {
    const os = getNativeDesktopPlatform()?.os;
    return os === "macos"
      ? "Reveal vault in Finder"
      : os === "windows"
        ? "Reveal vault in File Explorer"
        : "Reveal vault in file manager";
  },
};
