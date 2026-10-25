import type {
  NativeTurnService,
  TurnInput,
  TurnCommand,
  TurnValue,
} from "../../dist/native-turns";

const input = {
  request_id: "request",
  target_id: "codex",
  scope_dir: "",
  prompt: "Authored text",
  context: "Separate context",
  options: {
    mode: "ask",
    model: null,
    effort: null,
    max_duration_ms: 60_000,
  },
} satisfies TurnInput;
const command = { kind: "submit", input } satisfies TurnCommand;
const invalidInput: TurnInput = {
  ...input,
  // @ts-expect-error Host executable authority is never a browser field.
  executable: "/tmp/helper",
};
const invalidCommand: TurnCommand = {
  kind: "list",
  // @ts-expect-error The admitted transport fixes the vault authority.
  vault_id: "another-vault",
};
const service: NativeTurnService = {
  async call() {
    return { kind: "records", records: [] } satisfies TurnValue;
  },
};
void [command, invalidInput, invalidCommand, service];
