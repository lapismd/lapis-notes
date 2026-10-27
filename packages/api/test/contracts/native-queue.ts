import type {
  NativeQueueService,
  QueueAccept,
  QueueCommand,
  QueueValue,
} from "../../dist/native-turns";
const capture = {
  version: 1,
  id: "capture",
  state: "queued",
  user: {
    schemaVersion: 3,
    id: "queued-user-exact",
    type: "message",
    role: "user",
    text: "café 📝",
    createdAt: "2026-10-27T00:00:00.000Z",
  },
  selection: { thinking: "default" },
};
const input = {
  acceptance_id: "acceptance",
  conversation_id: "conversation",
  after_request_id: "head",
  scope_dir: "Notes",
  target_id: "opaque",
  capture,
} satisfies QueueAccept;
const commands: QueueCommand[] = [
  { kind: "accept", input },
  { kind: "read", conversation_id: "conversation" },
  { kind: "stop", conversation_id: "conversation" },
  {
    kind: "cancel",
    conversation_id: "conversation",
    acceptance_id: "acceptance",
  },
  { kind: "resume", conversation_id: "conversation", after_request_id: "head" },
];
const service: NativeQueueService = {
  async call() {
    return { kind: "queue", queue: null } satisfies QueueValue;
  },
};
const forged: QueueAccept = {
  ...input,
  // @ts-expect-error Installation authority is never a queue payload field.
  executable: "/tmp/agent",
};
const stale: QueueCommand = {
  kind: "resume",
  conversation_id: "conversation",
  // @ts-expect-error Explicit resume requires the exact native predecessor.
  resumed: true,
};
void [commands, service, forged, stale];
