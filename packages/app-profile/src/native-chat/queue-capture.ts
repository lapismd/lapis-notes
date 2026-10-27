import type { QueueEntry } from "@lapis-notes/api/native-turns";

/** Retained attribution and choices, never executable or provider authority. */
export type NativeQueueSelection =
  import("@lapis-notes/api/native-turns").QueueSelection;

/** Adapted from frozen Desktop f276120b queue-capture; no queue engine lives here. */
export function captureNativeQueue(
  text: string,
  selection: NativeQueueSelection,
) {
  if (!text.trim() || text.trim().startsWith("/"))
    throw new Error("Application commands and empty prompts cannot be queued");
  if (selection.recipient.id !== selection.target.id)
    throw new Error(
      "The declared queued recipient does not match its selection",
    );
  return {
    version: 1,
    id: crypto.randomUUID(),
    state: "queued",
    user: {
      schemaVersion: 3,
      id: `queued-user-${crypto.randomUUID()}`,
      type: "message",
      role: "user",
      text: text.trim(),
      recipients: [structuredClone(selection.recipient)],
      createdAt: new Date().toISOString(),
      provenance: { originClass: "owner", sourceKind: "user-message" },
    },
    selection: {
      targets: [structuredClone(selection.target)],
      runtime: "acp",
      ...(selection.thinking ? { thinking: selection.thinking } : {}),
      attachments: [],
    },
  };
}

/** Presentation decoding only; Core validates every admitted retained capture. */
export function capturedQueue(entry: {
  input: { capture: QueueEntry["input"]["capture"] };
}) {
  const capture = entry.input.capture as ReturnType<typeof captureNativeQueue>;
  if (
    capture?.version !== 1 ||
    typeof capture.id !== "string" ||
    typeof capture.user?.id !== "string" ||
    typeof capture.user.text !== "string" ||
    !Array.isArray(capture.user.recipients) ||
    capture.user.recipients.length !== 1 ||
    !capture.user.recipients.every(
      (r) => typeof r.id === "string" && typeof r.label === "string",
    )
  )
    throw new Error("The saved native queue cannot be displayed");
  return capture;
}
