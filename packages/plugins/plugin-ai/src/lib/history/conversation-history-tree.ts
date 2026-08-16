import type { ConversationListEntry } from "../conversations/transcript-store";

export type ConversationHistoryFolder = {
  path: string;
  name: string;
  conversations: ConversationListEntry[];
  children: ConversationHistoryFolder[];
  conversationCount: number;
};

type MutableConversationHistoryFolder = {
  path: string;
  name: string;
  conversations: ConversationListEntry[];
  children: MutableConversationHistoryFolder[];
};

function compareConversationEntries(
  left: ConversationListEntry,
  right: ConversationListEntry,
): number {
  return (
    (right.metadata?.updatedAt ?? "").localeCompare(
      left.metadata?.updatedAt ?? "",
    ) || (left.metadata?.title ?? "").localeCompare(right.metadata?.title ?? "")
  );
}

function finalizeFolder(
  folder: MutableConversationHistoryFolder,
): ConversationHistoryFolder {
  const children = folder.children
    .map(finalizeFolder)
    .sort((left, right) => left.name.localeCompare(right.name));
  const conversations = [...folder.conversations].sort(
    compareConversationEntries,
  );
  return {
    ...folder,
    children,
    conversations,
    conversationCount:
      conversations.length +
      children.reduce((total, child) => total + child.conversationCount, 0),
  };
}

/**
 * Build an Explorer-like tree containing only branches with conversations.
 * Vault-root conversations are represented by an explicit root row so they
 * remain distinguishable from conversations captured in top-level folders.
 */
export function buildConversationHistoryTree(
  entries: ConversationListEntry[],
): ConversationHistoryFolder[] {
  const root: MutableConversationHistoryFolder = {
    path: "",
    name: "Vault root",
    conversations: [],
    children: [],
  };
  const folders = new Map<string, MutableConversationHistoryFolder>([
    ["", root],
  ]);

  for (const entry of entries) {
    const scope = entry.location.scopeDir;
    let parent = root;
    if (scope) {
      const segments = scope.split("/").filter(Boolean);
      for (let index = 0; index < segments.length; index += 1) {
        const path = segments.slice(0, index + 1).join("/");
        let folder = folders.get(path);
        if (!folder) {
          folder = {
            path,
            name: segments[index]!,
            conversations: [],
            children: [],
          };
          folders.set(path, folder);
          parent.children.push(folder);
        }
        parent = folder;
      }
    }
    parent.conversations.push(entry);
  }

  const topLevel = root.children
    .map(finalizeFolder)
    .sort((left, right) => left.name.localeCompare(right.name));
  if (root.conversations.length) {
    topLevel.unshift(
      finalizeFolder({
        ...root,
        children: [],
      }),
    );
  }
  return topLevel;
}

export function conversationHistoryFolderPaths(
  folders: ConversationHistoryFolder[],
): string[] {
  return folders.flatMap((folder) => [
    folder.path,
    ...conversationHistoryFolderPaths(folder.children),
  ]);
}
