import type { AiChatItem } from "./chat-items";
import type { AiChatToolItem } from "./chat-tool-display";

export type ChatTimelineEntry =
  | { kind: "divider"; id: string; label: string }
  | { kind: "item"; item: Exclude<AiChatItem, AiChatToolItem> }
  | { kind: "tools"; id: string; items: AiChatToolItem[] };

function startOfLocalDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

export function formatChatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatChatRelativeAge(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const delta = Math.max(0, now.getTime() - date.getTime());
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return formatChatDateLabel(iso, now);
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
  agentLabels: ReadonlyMap<string, string> = new Map(),
): ChatTimelineEntry[] {
  const entries: ChatTimelineEntry[] = [];
  let lastKey: string | null = null;
  let lastBindingId: string | undefined;
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
    if (
      item.agentBindingId &&
      item.agentBindingId !== lastBindingId &&
      agentLabels.has(item.agentBindingId)
    ) {
      entries.push({
        kind: "divider",
        id: `agent-${item.agentBindingId}-${item.id}`,
        label: agentLabels.get(item.agentBindingId)!,
      });
      lastBindingId = item.agentBindingId;
    }
    if (item.type === "tool") {
      const last = entries.at(-1);
      if (last?.kind === "tools") {
        last.items.push(item);
      } else {
        entries.push({ kind: "tools", id: `tools-${item.id}`, items: [item] });
      }
      continue;
    }
    entries.push({ kind: "item", item });
  }
  return entries;
}
