import type { App } from "@lapis-notes/api";
import { dirname } from "@lapis-notes/api/path";
import {
  conversationScopeForActiveFile,
  hasHiddenApplicationSegment,
  normalizeConversationScope,
} from "./paths";

export const FILE_EXPLORER_VIEW_TYPE = "file-explorer";
export const FILE_EXPLORER_SELECTION_CHANGE_EVENT =
  "file-explorer:selection-change";

type WorkspaceEventBus = {
  on(name: string, listener: (...args: unknown[]) => void): unknown;
  offref(ref: unknown): void;
};

export function workspaceEvents(app: App): WorkspaceEventBus {
  return app.workspace as unknown as WorkspaceEventBus;
}

export function readExplorerSelectedPath(app: App): string | undefined {
  for (const leaf of app.workspace.getLeavesOfType(FILE_EXPLORER_VIEW_TYPE)) {
    const view = leaf.view as { selectedPath?: unknown };
    if (typeof view.selectedPath === "string") return view.selectedPath;
  }
  return undefined;
}

function skipHiddenApplicationScope(scopeDir: string): string {
  let scope = scopeDir;
  while (scope && hasHiddenApplicationSegment(scope)) {
    const parent = dirname(scope);
    scope = !parent || parent === "/" ? "" : parent;
  }
  return scope;
}

export function conversationScopeFromVaultPath(
  app: Pick<App, "vault">,
  path: string,
): string {
  const normalized = path.replace(/^\/+/u, "").replaceAll("\\", "/");
  if (!normalized || normalized === ".") return "";
  const file = app.vault.getFileByPath(normalized);
  if (file) return conversationScopeForActiveFile(file.path);
  try {
    return skipHiddenApplicationScope(normalizeConversationScope(normalized));
  } catch {
    return "";
  }
}

export function resolveHistoryCreationScope(
  app: App,
  fallbackScope: string,
): string {
  const selected = readExplorerSelectedPath(app);
  if (selected === undefined || selected === "") {
    return normalizeConversationScope(fallbackScope);
  }
  return conversationScopeFromVaultPath(app, selected);
}
