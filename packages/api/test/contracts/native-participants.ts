import type {
  NativeParticipantService,
  ParticipantMessageInput,
  ParticipantCommand,
  ParticipantValue,
} from "../../dist/native-turns";
import {
  PARTICIPANT_REQUEST_LIMIT,
  PARTICIPANT_RECORD_LIMIT,
} from "../../dist/native-turns";
const input = {
  acceptance_id: "native-acceptance",
  user: {
    id: "authored-parent",
    text: "Café 📝",
    recipients: [{ id: "logical-reviewer", label: "Writer" }],
  },
  dispatch: {
    id: "dispatch",
    deliveries: [{ id: "delivery", recipient: { id: "logical-reviewer" } }],
  },
  turns: [
    {
      request_id: "native-request",
      target_id: "installed-runtime",
      scope_dir: "",
      prompt: "Café 📝",
      context: null,
      options: {
        model: null,
        effort: null,
        mode: "plan",
        max_duration_ms: 60000,
      },
    },
  ],
} satisfies ParticipantMessageInput;
const commands: ParticipantCommand[] = [
  { kind: "accept", input },
  { kind: "read", acceptance_id: "native-acceptance" },
  { kind: "stop", acceptance_id: "native-acceptance" },
  {
    kind: "cancel",
    acceptance_id: "native-acceptance",
    request_id: "native-request",
  },
];
const service: NativeParticipantService = {
  async call() {
    return { kind: "message", message: null } satisfies ParticipantValue;
  },
};
const forged: ParticipantMessageInput = {
  ...input,
  // @ts-expect-error Native installation authority cannot be supplied by a caller.
  executable: "/tmp/helper",
};
// @ts-expect-error Cancel requires its acceptance and native request association.
const incomplete: ParticipantCommand = {
  kind: "cancel",
  acceptance_id: "native-acceptance",
};
const unsupported: ParticipantCommand = {
  // @ts-expect-error Cold observation grants no automatic resume operation.
  kind: "resume",
  acceptance_id: "native-acceptance",
};
const requestLimit: 2097152 = PARTICIPANT_REQUEST_LIMIT;
const recordLimit: 8388608 = PARTICIPANT_RECORD_LIMIT;
void [
  commands,
  service,
  forged,
  incomplete,
  unsupported,
  requestLimit,
  recordLimit,
];
