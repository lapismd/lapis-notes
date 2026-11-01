import { fn } from "storybook/test";
import type { BootstrapAppearanceMode, VaultProfile } from "@lapis-notes/api";
import type { WebVaultLauncherServices } from "../../packages/web/src/web-vault-launcher-services";

export const webLauncherProfiles: VaultProfile[] = Array.from(
  { length: 6 },
  (_, index) => ({
    id: `review-vault-${index + 1}`,
    name: index === 5 ? "Research café" : `Notes ${index + 1}`,
    kind: "opfs",
    createdAt: 1,
    updatedAt: 1,
  }),
);

export function webLauncherServices(
  seed: VaultProfile[] = [],
): WebVaultLauncherServices {
  let profiles = seed.map((profile) => ({ ...profile }));
  let appearance: BootstrapAppearanceMode | undefined;
  return {
    listProfiles: async () => profiles,
    getAppearance: async () =>
      appearance ??
      (document.documentElement.classList.contains("dark") ? "dark" : "light"),
    saveAppearance: fn(async (mode) => {
      appearance = mode;
    }),
    copyId: fn(async () => {}),
    rename: fn(async (profile, name) => {
      profiles = profiles.map((entry) =>
        entry.id === profile.id ? { ...entry, name } : entry,
      );
    }),
    deleteVault: fn(async (profile) => {
      profiles = profiles.filter((entry) => entry.id !== profile.id);
    }),
    removeProfile: fn(async (profile) => {
      profiles = profiles.filter((entry) => entry.id !== profile.id);
    }),
    pickDirectory: fn(async () => ({
      kind: "directory",
      name: "Imported Notes",
      getFileHandle: async () => {
        throw new Error("No files in the review fixture");
      },
      getDirectoryHandle: async () => {
        throw new Error("No folders in the review fixture");
      },
      removeEntry: async () => {},
    })),
  };
}
