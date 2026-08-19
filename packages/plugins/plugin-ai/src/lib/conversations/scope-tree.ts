import { normalizeConversationScope } from "./paths";
import type { ConversationListEntry } from "./transcript-store";

export function isScopeInTree(contextDir: string, scopeDir: string): boolean {
  const context = normalizeConversationScope(contextDir);
  const scope = normalizeConversationScope(scopeDir);
  if (!context) return true;
  return scope === context || scope.startsWith(`${context}/`);
}

export function scopeDepthFromContext(
  contextDir: string,
  scopeDir: string,
): number {
  const context = normalizeConversationScope(contextDir);
  const scope = normalizeConversationScope(scopeDir);
  if (!context) {
    return scope ? scope.split("/").length : 0;
  }
  if (scope === context) return 0;
  if (!scope.startsWith(`${context}/`)) return Number.POSITIVE_INFINITY;
  return scope.slice(context.length + 1).split("/").length;
}

export function formatDirectoryContextLabel(scopeDir: string): string {
  const scope = normalizeConversationScope(scopeDir);
  return scope || "Vault";
}

export function relativeScopeLabel(
  contextDir: string,
  scopeDir: string,
): string {
  const context = normalizeConversationScope(contextDir);
  const scope = normalizeConversationScope(scopeDir);
  if (!scope) return "Vault";
  if (!context) return scope;
  if (scope === context) return formatDirectoryContextLabel(context);
  if (scope.startsWith(`${context}/`)) return scope.slice(context.length + 1);
  return scope;
}

export function conversationsInScopeTree(
  entries: ConversationListEntry[],
  contextDir: string,
): ConversationListEntry[] {
  return entries
    .filter((entry) => {
      if (entry.metadata?.status === "archived") return false;
      if (entry.unavailableReason) return false;
      return isScopeInTree(contextDir, entry.location.scopeDir);
    })
    .sort((left, right) => {
      const depthDelta =
        scopeDepthFromContext(contextDir, left.location.scopeDir) -
        scopeDepthFromContext(contextDir, right.location.scopeDir);
      if (depthDelta !== 0) return depthDelta;
      const leftUpdated = left.metadata?.updatedAt ?? "";
      const rightUpdated = right.metadata?.updatedAt ?? "";
      if (leftUpdated !== rightUpdated) {
        return rightUpdated.localeCompare(leftUpdated);
      }
      return (left.metadata?.title ?? left.location.conversationId).localeCompare(
        right.metadata?.title ?? right.location.conversationId,
      );
    });
}

export function groupConversationsByRelativeScope(
  entries: ConversationListEntry[],
  contextDir: string,
): { heading: string; items: ConversationListEntry[] }[] {
  const groups: { heading: string; items: ConversationListEntry[] }[] = [];
  for (const entry of entries) {
    const heading = relativeScopeLabel(contextDir, entry.location.scopeDir);
    const last = groups.at(-1);
    if (last?.heading === heading) last.items.push(entry);
    else groups.push({ heading, items: [entry] });
  }
  return groups;
}
