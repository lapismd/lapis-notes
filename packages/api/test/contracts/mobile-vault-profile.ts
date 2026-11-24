import type { RuntimeTarget, VaultProfile } from "@lapis-notes/api";

export const runtime: RuntimeTarget = "tauri-mobile";
export const profile = {
  id: "mobile-managed-primary",
  kind: "mobile-managed",
  name: "Notes",
  createdAt: 0,
  updatedAt: 0,
} satisfies VaultProfile;
