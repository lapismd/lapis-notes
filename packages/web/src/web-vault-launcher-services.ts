import {
  deleteBrowserLocalVault,
  deleteVaultProfile,
  getBootstrapAppearanceMode,
  listVaultProfiles,
  pickFileSystemAccessDirectoryHandle,
  replaceVaultProfile,
  saveBootstrapAppearanceMode,
  type BootstrapAppearanceMode,
  type BrowserFileSystemDirectoryHandle,
  type VaultProfile,
} from "@lapis-notes/api";
import { IMPORT_NEW_PICKER_ID } from "./vault-transfer";

/** Private host boundary; Storybook fixtures never access browser vault storage. */
export interface WebVaultLauncherServices {
  listProfiles(): Promise<VaultProfile[]>;
  getAppearance(): Promise<BootstrapAppearanceMode>;
  saveAppearance(mode: BootstrapAppearanceMode): Promise<void>;
  copyId(profile: VaultProfile): Promise<void>;
  rename(profile: VaultProfile, name: string): Promise<void>;
  deleteVault(profile: VaultProfile): Promise<void>;
  removeProfile(profile: VaultProfile): Promise<void>;
  pickDirectory(): Promise<BrowserFileSystemDirectoryHandle>;
}

export const webVaultLauncherServices: WebVaultLauncherServices = {
  listProfiles: listVaultProfiles,
  getAppearance: getBootstrapAppearanceMode,
  saveAppearance: saveBootstrapAppearanceMode,
  copyId: async (profile) => navigator.clipboard.writeText(profile.id),
  rename: async (profile, name) => {
    await replaceVaultProfile(profile.id, {
      ...profile,
      name,
      updatedAt: Date.now(),
    });
  },
  deleteVault: async (profile) => {
    await deleteBrowserLocalVault(profile);
  },
  removeProfile: async (profile) => {
    await deleteVaultProfile(profile.id);
  },
  pickDirectory: () =>
    pickFileSystemAccessDirectoryHandle({
      id: IMPORT_NEW_PICKER_ID,
      mode: "readwrite",
    }),
};
