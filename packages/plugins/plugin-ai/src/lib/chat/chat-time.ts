import type { AiChatItem } from "./chat-items";

export type ChatTimelineEntry =
  | { kind: "divider"; id: string; label: string }
  | { kind: "item"; item: AiChatItem };

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function formatChatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatChatDateLabel(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const day = startOfLocalDay(date);
  const today = startOfLocalDay(now);
  const yesterday = today - 86_400_000;
  if (day === today) return "Today";
  if (day === yesterday) return "Yesterday";
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function groupChatItemsByDate(
  items: AiChatItem[],
  now = new Date(),
): ChatTimelineEntry[] {
  const entries: ChatTimelineEntry[] = [];
  let lastKey: string | null = null;
  for (const item of items) {
    const parsed = item.createdAt ? new Date(item.createdAt) : null;
    const valid = parsed && !Number.isNaN(parsed.getTime());
    const key: string = valid
      ? String(startOfLocalDay(parsed))
      : (lastKey ?? String(startOfLocalDay(now)));
    const labelIso = valid ? item.createdAt! : now.toISOString();
    if (key !== lastKey) {
      entries.push({
        kind: "divider",
        id: `date-${key}`,
        label: formatChatDateLabel(labelIso, now),
      });
      lastKey = key;
    }
    entries.push({ kind: "item", item });
  }
  return entries;
}
