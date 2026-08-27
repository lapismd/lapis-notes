import { dirname } from "@lapis-notes/api/path";
import { CONVERSATION_ID_PATTERN, type ConversationLocation } from "./types";

const HIDDEN_APPLICATION_SEGMENTS = new Set([
  ".agents",
  ".lapis",
  ".obsidian",
  ".trash",
]);

export function hasHiddenApplicationSegment(path: string): boolean {
  return path
    .split("/")
    .filter(Boolean)
    .some((segment) => HIDDEN_APPLICATION_SEGMENTS.has(segment));
}

export function normalizePortableVaultPath(
  value: string,
  options: { allowRoot?: boolean; label?: string } = {},
): string {
  const label = options.label ?? "Vault path";
  const raw = value.trim().replaceAll("\\", "/");
  if (raw === "" || raw === "." || raw === "/") {
    if (options.allowRoot) return "";
    throw new Error(`${label} must not be the vault root`);
  }
  if (raw.startsWith("/") || /^[a-z]:\//iu.test(raw) || raw.includes("://")) {
    throw new Error(`${label} must be vault-relative`);
  }
  const segments = raw.replace(/^\.\//u, "").replace(/\/+$/u, "").split("/");
  if (
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw new Error(`${label} must be a confined vault-relative path`);
  }
  return segments.join("/");
}

export function normalizeConversationScope(value: string): string {
  const scope = normalizePortableVaultPath(value, {
    allowRoot: true,
    label: "Conversation scope",
  });
  if (scope.split("/").includes(".lapis")) {
    throw new Error("Conversation scope cannot be inside .lapis");
  }
  return scope;
}

export function assertConversationId(value: string): string {
  if (!CONVERSATION_ID_PATTERN.test(value)) {
    throw new Error("Conversation ID must be a lowercase UUIDv4");
  }
  return value;
}

export function normalizeConversationLocation(
  location: ConversationLocation,
): ConversationLocation {
  return {
    scopeDir: normalizeConversationScope(location.scopeDir),
    conversationId: assertConversationId(location.conversationId),
  };
}

export function conversationSessionsPath(scopeDir: string): string {
  const scope = normalizeConversationScope(scopeDir);
  return [scope, ".lapis", "agents", "sessions"].filter(Boolean).join("/");
}

export function conversationDirectory(location: ConversationLocation): string {
  const normalized = normalizeConversationLocation(location);
  return `${conversationSessionsPath(normalized.scopeDir)}/${normalized.conversationId}`;
}

export function relativePathWithinScope(
  scopeDir: string,
  vaultPath: string,
): string {
  const scope = normalizeConversationScope(scopeDir);
  const path = normalizePortableVaultPath(vaultPath, { label: "Launch path" });
  if (!scope) return path;
  if (path === scope) return "";
  if (!path.startsWith(`${scope}/`)) {
    throw new Error("Launch path must be inside the conversation scope");
  }
  return path.slice(scope.length + 1);
}

export function parentScopeForFile(vaultPath: string): string {
  const normalized = normalizePortableVaultPath(vaultPath, {
    label: "Active file",
  });
  const parent = dirname(normalized);
  return parent === "/" ? "" : normalizeConversationScope(parent);
}

export function conversationScopeForActiveFile(vaultPath: string): string {
  const normalized = normalizePortableVaultPath(vaultPath, {
    label: "Active file",
  });
  const initialParent = dirname(normalized);
  let scope = initialParent === "/" ? "" : initialParent;
  while (scope && hasHiddenApplicationSegment(scope)) {
    const parent = dirname(scope);
    scope = !parent || parent === "/" ? "" : parent;
  }
  return normalizeConversationScope(scope);
}
