import {
  formatChatDateLabel,
  formatChatRelativeAge,
} from "../chat/chat-time";
import type { ConversationListEntry } from "./transcript-store";

export const AI_CONVERSATION_PALETTE_TAB = {
  id: "agents",
  label: "Agents",
  order: 10,
} as const;

export const AI_CONVERSATION_PALETTE_PROVIDER_ID = "lapis-ai-conversations";

export function conversationPaletteTitle(entry: ConversationListEntry): string {
  const title = entry.metadata?.title?.trim();
  if (title) return title;
  const preview = entry.preview?.trim();
  if (preview) return preview;
  return "Untitled chat";
}

export function conversationPaletteItem(
  entry: ConversationListEntry,
  now = new Date(),
) {
  const updatedAt = entry.metadata?.updatedAt ?? entry.metadata?.createdAt ?? "";
  return {
    id: `ai-conversation:${entry.location.scopeDir}:${entry.location.conversationId}`,
    title: conversationPaletteTitle(entry),
    subtitle: entry.location.scopeDir || entry.preview,
    icon: "sparkles",
    providerId: AI_CONVERSATION_PALETTE_PROVIDER_ID,
    tab: AI_CONVERSATION_PALETTE_TAB.id,
    group: formatChatDateLabel(updatedAt, now) || "Agents",
    trailing: formatChatRelativeAge(updatedAt, now),
  };
}
