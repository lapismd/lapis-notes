import { TFolder, type TAbstractFile } from "@lapis-notes/api";
import type { ExplorerNode } from "@lapismd/design-core/workspace/explorer";

export function toExplorerNode(file: TAbstractFile): ExplorerNode {
  return {
    path: file.path.replace(/^\/+/, ""),
    name: file.name,
    kind: file instanceof TFolder ? "folder" : "file",
  };
}

/** Pass every vault path except `/`. Hidden-name filtering belongs to Design Core. */
export function listExplorerVaultEntries(
  files: readonly TAbstractFile[],
): ExplorerNode[] {
  return files
    .filter((file) => file.path.replace(/^\/+/, "").length > 0)
    .map(toExplorerNode);
}
