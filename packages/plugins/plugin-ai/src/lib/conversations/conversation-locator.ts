import { normalizePortableVaultPath } from "./paths";
import type { ConversationLocation } from "./types";

export function relocateConversationLocation(
  location: ConversationLocation,
  oldPath: string,
  newPath: string,
): ConversationLocation | null {
  const previous = normalizePortableVaultPath(oldPath, {
    allowRoot: true,
    label: "Previous vault path",
  });
  const next = normalizePortableVaultPath(newPath, {
    allowRoot: true,
    label: "New vault path",
  });
  if (
    location.scopeDir !== previous &&
    !location.scopeDir.startsWith(`${previous}/`)
  ) {
    return null;
  }
  const suffix = location.scopeDir.slice(previous.length).replace(/^\//u, "");
  return {
    ...location,
    scopeDir: [next, suffix].filter(Boolean).join("/"),
  };
}
