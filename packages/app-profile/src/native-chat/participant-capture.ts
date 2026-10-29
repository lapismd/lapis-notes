import type { AgentAction, AgentSnapshot } from "@lapismd/agent-ui/core";
import type {
  ParticipantMessageInput,
  ParticipantProfile,
  TurnSummary,
} from "@lapis-notes/api/native-turns";
import { PARTICIPANT_PROFILE_LIMIT } from "@lapis-notes/api/native-turns";

const unsupported = (message: string): never => {
  throw Object.assign(new Error(message), { code: "UNSUPPORTED" });
};

/** Declared choices are presentation data; native policy retains routing authority. */
export function participantAgents(
  profiles: readonly ParticipantProfile[],
): AgentSnapshot["agents"] {
  const seen = new Set<string>();
  if (profiles.length > PARTICIPANT_PROFILE_LIMIT)
    unsupported("The declared native participant catalog exceeds its limit");
  return profiles.map(({ selection, options, target_id }) => {
    const { recipient, target } = selection;
    if (
      !target_id ||
      !recipient.id ||
      recipient.id !== target.id ||
      !recipient.label ||
      seen.has(recipient.id)
    )
      unsupported("The declared native participant identity is unavailable");
    seen.add(recipient.id);
    return {
      id: recipient.id,
      name: recipient.label,
      enabled: true,
      description: "",
      provider: target.agent,
      model: target.model?.model ?? "",
      profile: {
        id: recipient.id,
        label: recipient.label,
        agent: target.agent,
        ...(target.model ? { model: target.model.model } : {}),
        executionMode: options.mode,
        thinking: target.thinking ?? selection.thinking ?? "default",
      },
    };
  });
}

/** One immutable authored parent and one native request per selected logical role. */
export function captureNativeParticipants(
  action: AgentAction,
  profiles: readonly ParticipantProfile[],
  scope: string,
  fallback: string,
  head?: TurnSummary,
): ParticipantMessageInput {
  const text = action.submission?.text.trim();
  const recipients = action.recipients?.length ? action.recipients : [fallback];
  if (
    !text ||
    text.startsWith("/") ||
    action.submission?.id !== action.id ||
    action.submission.comments.length ||
    action.attachments?.length ||
    action.agentParticipants?.length ||
    (action.values && Object.keys(action.values).length) ||
    recipients.length < 1 ||
    recipients.length > 4 ||
    new Set(recipients).size !== recipients.length
  )
    unsupported(
      "Native participants accept one plain text message for one to four declared roles",
    );
  const selected = recipients.map((id) => {
    const matches = profiles.filter((p) => p.selection.recipient.id === id);
    if (matches.length !== 1)
      unsupported("The selected native participant profile is unavailable");
    return structuredClone(matches[0]);
  });
  const parent = crypto.randomUUID(),
    createdAt = new Date().toISOString();
  const saved = selected.map((p) => p.selection.recipient);
  return {
    acceptance_id: crypto.randomUUID(),
    user: {
      schemaVersion: 3,
      id: parent,
      type: "message",
      role: "user",
      text,
      createdAt,
      recipients: saved,
      provenance: { originClass: "owner", sourceKind: "user-message" },
    },
    dispatch: {
      version: 1,
      id: crypto.randomUUID(),
      userEntryId: parent,
      startedAt: createdAt,
      deliveries: saved.map((recipient) => ({
        id: crypto.randomUUID(),
        recipient,
        state: "pending",
      })),
    },
    turns: selected.map((profile) => ({
      request_id: crypto.randomUUID(),
      target_id: profile.target_id,
      scope_dir: scope,
      prompt: text!,
      context: null,
      options: structuredClone(profile.options),
      ...(head
        ? {
            continuation: {
              conversation_id: head.conversation_id,
              after_request_id: head.request_id,
            },
          }
        : {}),
    })),
    profiles: selected,
  };
}

export function canonicalParticipant(value: unknown): string {
  return JSON.stringify(value, (_key, next) =>
    next && typeof next === "object" && !Array.isArray(next)
      ? Object.fromEntries(
          Object.keys(next)
            .sort()
            .map((key) => [key, next[key]]),
        )
      : next,
  );
}
