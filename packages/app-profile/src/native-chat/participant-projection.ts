import type { TranscriptItem } from "@lapismd/design-core/chat";
import type {
  ParticipantMessage,
  ParticipantState,
} from "@lapis-notes/api/native-turns";

type Row = Record<string, unknown>;
function object(value: unknown): Row | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Row)
    : undefined;
}
function recipient(value: unknown): {
  id: string;
  label: string;
  token: string;
} {
  const row = object(value);
  if (
    !row ||
    typeof row.id !== "string" ||
    typeof row.label !== "string" ||
    typeof row.token !== "string"
  )
    throw new Error("The saved native participant attribution is unavailable");
  return { id: row.id, label: row.label, token: row.token };
}

/** Labels come from immutable binding records, never current catalog display text. */
export function participantLabels(
  bindings: readonly Row[],
  message?: ParticipantMessage,
): Map<string, string> {
  const labels = new Map<string, string>();
  const captured = object(message?.input.dispatch);
  for (const [index, delivery] of (message?.deliveries ?? []).entries()) {
    const entry = Array.isArray(captured?.deliveries)
      ? object(captured.deliveries[index])
      : undefined;
    labels.set(delivery.agent_binding_id, recipient(entry?.recipient).label);
  }
  const seen = new Set<string>();
  for (const binding of bindings) {
    if (binding.type !== "binding.created" || binding.participant === undefined)
      continue;
    if (
      binding.schemaVersion !== 3 ||
      typeof binding.id !== "string" ||
      seen.has(binding.id)
    )
      throw new Error("The saved native participant binding is ambiguous");
    seen.add(binding.id);
    const label = recipient(binding.participant).label;
    if (labels.has(binding.id) && labels.get(binding.id) !== label)
      throw new Error(
        "The saved native participant binding changed its captured label",
      );
    labels.set(binding.id, label);
  }
  return labels;
}

/** Current native outcomes supersede stale portable markers without repairing files. */
export function participantEntries(
  values: Row[],
  message?: ParticipantMessage,
): Row[] {
  if (!message) return latest(values);
  const dispatch = object(message.input.dispatch),
    user = object(message.input.user);
  if (!dispatch || !user || !Array.isArray(dispatch.deliveries))
    throw new Error("The native participant capture is unavailable");
  const result = values.filter(
    (v) => v.type !== "agent.delivery" || v.dispatchId !== dispatch.id,
  );
  if (!result.some((v) => v.id === user.id)) result.unshift(user);
  for (const [index, delivery] of message.deliveries.entries()) {
    const captured = object(dispatch.deliveries[index]);
    if (
      !captured ||
      captured.id !== delivery.delivery_id ||
      message.input.turns[index]?.request_id !== delivery.request_id
    )
      throw new Error(
        "The native participant delivery association is unavailable",
      );
    result.push({
      schemaVersion: 3,
      type: "agent.delivery",
      id: `delivery:${delivery.delivery_id}:${delivery.state}`,
      parentId: user.id,
      dispatchId: dispatch.id,
      delivery: {
        ...captured,
        state: delivery.state,
        agentBindingId: delivery.agent_binding_id,
      },
    });
  }
  return latest(result);
}

function latest(values: Row[]): Row[] {
  const last = new Map<string, number>();
  const key = (value: Row) =>
    JSON.stringify([value.dispatchId, object(value.delivery)?.id]);
  values.forEach((value, index) => {
    if (value.type === "agent.delivery") last.set(key(value), index);
  });
  return values.filter(
    (value, index) =>
      value.type !== "agent.delivery" || last.get(key(value)) === index,
  );
}

export function participantReceiptItem(
  value: Row,
  revision: (text: string) => string,
): TranscriptItem {
  const delivery = object(value.delivery),
    saved = recipient(delivery?.recipient);
  const states: Record<ParticipantState, string> = {
    pending: "Waiting for native dispatch.",
    started: "Running.",
    completed: "Completed.",
    rejected: "Did not complete.",
    unknown: "Outcome uncertain; it will not be replayed automatically.",
    not_sent: "Not sent; no automatic retry.",
    cancelled: "Cancelled.",
  };
  const state = delivery?.state;
  if (
    typeof value.id !== "string" ||
    typeof state !== "string" ||
    !Object.hasOwn(states, state)
  )
    throw new Error("The native participant outcome cannot be displayed");
  const text = `${saved.label}: ${states[state as ParticipantState]}`;
  return {
    id: value.id,
    kind: "context",
    label: `${saved.label} status`,
    ...(["unknown", "not_sent", "rejected", "cancelled"].includes(state)
      ? { notice: "warning" as const }
      : {}),
    blocks: [
      {
        id: `${value.id}:status`,
        revision: revision(text),
        kind: "markdown",
        label: "Participant status",
        text,
        commentable: false,
      },
    ],
  };
}
