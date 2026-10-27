import type { TranscriptItem } from "@lapismd/design-core/chat";
import type { TurnRecord, TurnSummary } from "@lapis-notes/api/native-turns";
import type { NativeChatSession } from "./session";
import { queueReceiptItem } from "./queue-receipt";

export const active = (phase: TurnSummary["phase"]) =>
  phase === "accepted" || phase === "running";
export function directory(record: TurnSummary): string {
  if (
    !/^[0-9a-f-]{36}$/i.test(record.conversation_id) ||
    record.scope_dir.startsWith("/") ||
    record.scope_dir
      .split("/")
      .some((part) => part === "." || part === ".." || part.includes("\\"))
  )
    throw new Error("The native conversation scope is invalid");
  return [record.scope_dir, ".lapis/agents/sessions", record.conversation_id]
    .filter(Boolean)
    .join("/");
}
function blockRevision(text: string): string {
  // Presentation key only. It is never a file version, receipt or write authority.
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++)
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16);
}
function item(value: Record<string, unknown>): TranscriptItem | undefined {
  if (value.schemaVersion !== 3)
    throw new Error("This saved conversation format is unavailable");
  if (value.type === "queue.outcome")
    return queueReceiptItem(value, blockRevision);
  if (value.type !== "message") return;
  if (
    typeof value.id !== "string" ||
    typeof value.text !== "string" ||
    (value.role !== "user" && value.role !== "assistant")
  )
    throw new Error("This saved conversation cannot be displayed");
  const role = value.role;
  return {
    id: value.id,
    kind: "message",
    role,
    label: role === "user" ? "You" : "Agent",
    createdAt:
      typeof value.createdAt === "string" ? value.createdAt : undefined,
    blocks: [
      {
        id: `${value.id}:body`,
        revision: blockRevision(value.text),
        kind: "markdown",
        label: "Message",
        text: value.text,
        commentable: false,
      },
    ],
  };
}
export async function conversation(
  session: NativeChatSession,
  summary: TurnSummary,
  record: TurnRecord,
) {
  let metadata: Record<string, unknown>, values: Record<string, unknown>[];
  try {
    const root = directory(summary);
    const [meta, transcript] = await Promise.all([
      session.readText(`${root}/metadata.yaml`),
      session.readText(`${root}/transcript.jsonl`),
    ]);
    metadata = JSON.parse(meta);
    values = transcript
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    if (metadata.schemaVersion !== 3 || metadata.id !== summary.conversation_id)
      throw new Error("This saved conversation cannot be displayed");
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (
      !active(record.phase) ||
      record.input.continuation ||
      !["ENOENT", "NOT_FOUND"].includes(code ?? "")
    )
      throw error;
    // A freshly accepted journal can precede its portable files; only observe it.
    metadata = {};
    values = [
      {
        schemaVersion: 3,
        type: "message",
        id: record.input.request_id,
        role: "user",
        text: record.input.prompt,
      },
      ...(record.output
        ? [
            {
              schemaVersion: 3,
              type: "message",
              id: `${record.input.request_id}:reply`,
              role: "assistant",
              text: record.output,
            },
          ]
        : []),
    ];
  }
  const items = values.flatMap((value) => {
    const next = item(value);
    return next ? [next] : [];
  });
  if (
    ["failed", "unknown", "interrupted", "cancelled"].includes(record.phase)
  ) {
    const text =
      record.phase === "cancelled"
        ? "This turn was cancelled."
        : record.phase === "failed"
          ? "This turn did not complete. Your saved conversation is retained."
          : "This turn has an uncertain outcome. It will not be replayed automatically.";
    items.push({
      id: `${record.input.request_id}:outcome`,
      kind: "context",
      label: "Turn status",
      notice: record.phase === "failed" ? "error" : "warning",
      blocks: [
        {
          id: `${record.input.request_id}:status`,
          revision: record.phase,
          kind: "markdown",
          label: "Status",
          text,
          commentable: false,
        },
      ],
    });
  }
  const title =
    typeof metadata.title === "string" && metadata.title.trim()
      ? metadata.title
      : Array.from(
          items.find((i) => i.role === "user")?.blocks[0]?.text ??
            "Conversation",
        )
          .slice(0, 96)
          .join("");
  return {
    title,
    items,
    status:
      metadata.status === "archived"
        ? ("archived" as const)
        : ("active" as const),
  };
}
