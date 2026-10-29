import type { TranscriptItem } from "@lapismd/design-core/chat";
import { capturedQueue } from "./queue-capture";

/** Saved receipts are status data, never prompt instructions or retry requests. */
export function queueReceiptItem(
  value: Record<string, unknown>,
  revision: (text: string) => string,
): TranscriptItem {
  const labels: Record<string, string> = {
    completed: "completed",
    cancelled: "cancelled",
    rejected: "rejected",
    not_sent: "not sent",
    unknown: "uncertain; it will not be replayed automatically",
  };
  const outcome = typeof value.outcome === "string" ? value.outcome : "";
  const capture = capturedQueue({ input: { capture: value.queued } });
  if (
    typeof value.id !== "string" ||
    value.parentId !== capture.user.id ||
    !labels[outcome]
  )
    throw new Error("The saved native queue receipt cannot be displayed");
  const text =
    `Queued message ${labels[outcome]}.` +
    (outcome === "completed" ? "" : `\n\n${capture.user.text}`);
  return {
    id: value.id,
    kind: "context",
    label: "Queue status",
    ...(outcome === "completed" ? {} : { notice: "warning" as const }),
    createdAt:
      typeof value.createdAt === "string" ? value.createdAt : undefined,
    blocks: [
      {
        id: `${value.id}:status`,
        revision: revision(text),
        kind: "markdown",
        label: "Queue status",
        text,
        commentable: false,
      },
    ],
  };
}
