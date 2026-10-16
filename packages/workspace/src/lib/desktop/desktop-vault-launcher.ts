import type { VaultProfile } from "@lapis-notes/api";

export type LauncherStatus = "loading" | "landing" | "opening" | "error";
export type DesktopLauncherAppearance = "system" | "light" | "dark";

/** Storage and native actions belong to the consuming desktop host. */
export interface DesktopVaultLauncherHost {
  listProfiles(): Promise<VaultProfile[]>;
  getAppearance(): Promise<DesktopLauncherAppearance>;
  saveAppearance(mode: DesktopLauncherAppearance): Promise<void>;
  copyId?(profile: VaultProfile): Promise<void>;
  rename?(profile: VaultProfile, name: string): Promise<void>;
  move?(profile: VaultProfile): Promise<boolean>;
  reveal?(profile: VaultProfile): Promise<void>;
  remove?(profile: VaultProfile): Promise<void>;
  revealLabel?: string;
}

export function getVaultProfileRootPath(profile: VaultProfile): string | null {
  const handle = profile.handle as { rootPath?: unknown } | string | undefined;
  if (typeof handle === "string") return handle;
  return typeof handle?.rootPath === "string" ? handle.rootPath : null;
}

export function getVaultProfileLocation(profile: VaultProfile): string {
  return getVaultProfileRootPath(profile) ?? "Desktop vault";
}

export const desktopAppearanceOptions = [
  {
    value: "system",
    label: "Match System",
    description: "Follow the current system appearance.",
  },
  {
    value: "light",
    label: "Light",
    description: "Use the light workspace palette on the vault chooser.",
  },
  {
    value: "dark",
    label: "Dark",
    description: "Use the dark workspace palette on the vault chooser.",
  },
] as const;
