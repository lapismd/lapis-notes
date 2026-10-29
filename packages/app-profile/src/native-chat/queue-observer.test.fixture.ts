import { vi } from "vitest";
import type {
  QueueCommand,
  QueueRecord,
  TurnCommand,
  TurnRecord,
  TurnValue,
} from "@lapis-notes/api/native-turns";
import { NativeChatObserver } from "./observer";
import { NativeChatSession, type NativeChatHost } from "./session";
import type { NativeQueueSelection } from "./queue-capture";
export function queueFixture() {
  const conversation = crypto.randomUUID();
  const target = {
    id: "opaque-target",
    label: "Display name",
    default_mode: "read-only",
  };
  const selection: NativeQueueSelection = {
    recipient: {
      id: "writer",
      label: "Writer",
      token: "jj-store-agent:777269746572;",
    },
    target: { id: "writer", agent: "codex", thinking: "default" },
    thinking: "default",
  };
  const records: TurnRecord[] = [];
  const turns: TurnCommand[] = [],
    queues: QueueCommand[] = [];
  let failRefresh = false;
  let queue: QueueRecord | null = null,
    lose = false,
    declared = true;
  const host: NativeChatHost = {
    allowed: () => true,
    activate: async () => {},
    leave: vi.fn(async () => {}),
    async call(command): Promise<TurnValue> {
      turns.push(structuredClone(command));
      switch (command.kind) {
        case "targets":
          return { kind: "targets", targets: [target] };
        case "set_enabled":
          return { kind: "availability", enabled: command.enabled };
        case "list":
          return {
            kind: "records",
            records: records.map((r) => ({
              request_id: r.input.request_id,
              conversation_id: conversation,
              target_id: r.input.target_id,
              scope_dir: r.input.scope_dir,
              phase: r.phase,
              accepted_at_ms: r.accepted_at_ms,
              updated_at_ms: r.updated_at_ms,
              failure_code: null,
            })),
          };
        case "read":
          return {
            kind: "record",
            record:
              records.find((r) => r.input.request_id === command.request_id) ??
              null,
          };
        case "submit": {
          const record: TurnRecord = {
            schema_version: 1,
            vault_id: crypto.randomUUID(),
            conversation_id: conversation,
            input: command.input,
            phase: "running",
            accepted_at_ms: records.length + 1,
            updated_at_ms: records.length + 1,
            output: null,
            failure_code: null,
          };
          records.push(record);
          return { kind: "record", record };
        }
        case "cancel":
          return { kind: "cancel_requested", accepted: true };
      }
    },
    queue: {
      selection: async () =>
        declared ? structuredClone(selection) : undefined,
      async call(command) {
        queues.push(structuredClone(command));
        if (command.kind === "accept") {
          queue ??= {
            schema_version: 1,
            vault_id: records[0].vault_id,
            conversation_id: conversation,
            scope_dir: "",
            head_request_id: records[0].input.request_id,
            paused: false,
            barrier: null,
            entries: [],
          };
          queue.entries.push({
            input: command.input,
            request_id: crypto.randomUUID(),
            phase: "pending",
            receipt: null,
            receipt_published: false,
          });
          if (lose) throw new Error("Native queue reply lost after acceptance");
        } else if (queue && command.kind === "stop") queue.paused = true;
        else if (queue && command.kind === "resume") queue.paused = false;
        else if (queue && command.kind === "cancel")
          queue.entries.find(
            (e) => e.input.acceptance_id === command.acceptance_id,
          )!.phase = "cancelled";
        return { kind: "queue", queue: structuredClone(queue) };
      },
    },
    readText: async (path) => {
      if (failRefresh) {
        failRefresh = false;
        throw new Error("Screen refresh failed");
      }
      return path.endsWith("metadata.yaml")
        ? JSON.stringify({
            schemaVersion: 3,
            id: conversation,
            title: "Native conversation",
          })
        : records
            .map((r) =>
              JSON.stringify({
                schemaVersion: 3,
                type: "message",
                role: "user",
                id: r.input.request_id,
                text: r.input.prompt,
              }),
            )
            .join("\n");
    },
  };
  const session = new NativeChatSession(host),
    port = new NativeChatObserver(session, { target: () => target.id });
  const send = (text = " Authored café 📝 ", id = crypto.randomUUID()) =>
    port.act({
      id,
      kind: "send",
      session: port.selected,
      recipients: [target.id],
      submission: { id, text, comments: [] },
    });
  return {
    port,
    session,
    host,
    turns,
    queues,
    records,
    target,
    selection,
    send,
    read: () => port.read(new AbortController().signal),
    queue: () => queue!,
    failRefresh: () => {
      failRefresh = true;
    },
    lose: () => {
      lose = true;
    },
    undeclare: () => {
      declared = false;
    },
  };
}
