import { vi } from "vitest";
import type {
  ParticipantMessage,
  ParticipantProfile,
  ParticipantCommand,
  ParticipantValue,
  TurnCommand,
  TurnInput,
  TurnRecord,
  TurnValue,
} from "@lapis-notes/api/native-turns";
import { NativeChatSession, type NativeChatHost } from "./session";
import { NativeChatObserver } from "./observer";

export function participantFixture() {
  const nativeId = (id: string) =>
    id
      .replace(
        /^([\da-f]{8})([\da-f]{4})([\da-f]{4})([\da-f]{4})([\da-f]{12})$/iu,
        "$1-$2-$3-$4-$5",
      )
      .toLowerCase();
  const conversation = crypto.randomUUID(),
    vault = crypto.randomUUID(),
    runtime = "opaque-runtime";
  let declared = true;
  const profiles: ParticipantProfile[] = ["writer", "reviewer"].map(
    (id, i) => ({
      target_id: runtime,
      selection: {
        recipient: {
          id,
          label: id === "writer" ? "Writer" : "Reviewer",
          token: `jj-store-agent:${Array.from(new TextEncoder().encode(id), (b) => b.toString(16).padStart(2, "0")).join("")};`,
        },
        target: {
          id,
          agent: "codex",
          thinking: i ? "high" : "default",
          model: { provider: "codex", model: `model-${id}` },
        },
        thinking: "default",
      },
      options: {
        mode: i ? "review" : "plan",
        model: `model-${id}`,
        effort: i ? "high" : null,
        max_duration_ms: 60000,
      },
    }),
  );
  const records: TurnRecord[] = [],
    calls: ParticipantCommand[] = [],
    turns: TurnCommand[] = [];
  let message: ParticipantMessage | null = null,
    lose = false;
  const host: NativeChatHost & {
    participants: {
      call(command: ParticipantCommand): Promise<ParticipantValue>;
    };
  } = {
    allowed: () => true,
    activate: vi.fn(async () => {}),
    leave: vi.fn(async () => {}),
    async call(command): Promise<TurnValue> {
      turns.push(structuredClone(command));
      switch (command.kind) {
        case "targets":
          return {
            kind: "targets",
            targets: [
              { id: runtime, label: "Runtime display", default_mode: "plan" },
            ],
          };
        case "set_enabled":
          return { kind: "availability", enabled: command.enabled };
        case "list":
          return {
            kind: "records",
            records: records.map((r) => ({
              request_id: r.input.request_id,
              conversation_id: r.conversation_id,
              target_id: r.input.target_id,
              scope_dir: r.input.scope_dir,
              phase: r.phase,
              accepted_at_ms: r.accepted_at_ms,
              updated_at_ms: r.updated_at_ms,
              failure_code: r.failure_code,
            })),
          };
        case "read":
          return {
            kind: "record",
            record:
              records.find((r) => r.input.request_id === command.request_id) ??
              null,
          };
        case "cancel":
          return { kind: "cancel_requested", accepted: true };
        case "submit": {
          const record: TurnRecord = {
            schema_version: 1,
            vault_id: vault,
            conversation_id: conversation,
            input: command.input,
            phase: "running",
            accepted_at_ms: 1000,
            updated_at_ms: 1000,
            output: null,
            failure_code: null,
          };
          records.push(record);
          return { kind: "record", record };
        }
      }
    },
    participants: {
      async call(command) {
        calls.push(structuredClone(command));
        switch (command.kind) {
          case "profiles":
            return {
              kind: "profiles",
              profiles: declared ? structuredClone(profiles) : [],
            };
          case "accept": {
            const captured = structuredClone(command.input);
            captured.acceptance_id = nativeId(captured.acceptance_id);
            message = {
              schema_version: 1,
              vault_id: vault,
              acceptance_id: captured.acceptance_id,
              conversation_id: conversation,
              input: captured,
              deliveries: command.input.turns.map((t, i) => ({
                delivery_id: (command.input.dispatch as any).deliveries[i].id,
                request_id: t.request_id,
                agent_binding_id: crypto.randomUUID(),
                session_id: crypto.randomUUID(),
                state: "started",
                outcome_published: false,
              })),
              recovered: false,
            };
            records.push(
              ...command.input.turns.map((input, i) => ({
                schema_version: 1,
                vault_id: vault,
                conversation_id: conversation,
                input,
                phase: "running" as const,
                accepted_at_ms: 1000 + i,
                updated_at_ms: 1000 + i,
                output: null,
                failure_code: null,
              })),
            );
            if (lose) throw Error("Accepted reply was lost");
            return { kind: "message", message: structuredClone(message) };
          }
          case "read":
            return {
              kind: "message",
              message:
                message?.acceptance_id === nativeId(command.acceptance_id)
                  ? structuredClone(message)
                  : null,
            };
          case "for_turn":
            return {
              kind: "message",
              message: message?.deliveries.some(
                (d) => d.request_id === command.request_id,
              )
                ? structuredClone(message)
                : null,
            };
          case "stop":
            return { kind: "stop_requested", accepted: true };
          case "cancel":
            return { kind: "cancel_requested", accepted: true };
        }
      },
    },
    readText: vi.fn(async (path) => {
      if (path.endsWith("metadata.yaml"))
        return JSON.stringify({
          schemaVersion: 3,
          id: conversation,
          title: "Saved group",
          status: "active",
          ...(message ? { pendingDispatch: message.input.dispatch } : {}),
        });
      if (path.endsWith("agents.jsonl"))
        return (
          message?.deliveries
            .map((d, i) =>
              JSON.stringify({
                schemaVersion: 3,
                type: "binding.created",
                id: d.agent_binding_id,
                runtime: "acp",
                agent: runtime,
                participant: message!.input.profiles![i].selection.recipient,
              }),
            )
            .join("\n") ?? ""
        );
      return [
        message?.input.user ?? {
          schemaVersion: 3,
          id: records[0]?.input.request_id,
          type: "message",
          role: "user",
          text: records[0]?.input.prompt ?? "",
        },
        ...records
          .map((r, i) => ({
            schemaVersion: 3,
            id: `reply-${r.input.request_id}`,
            type: "message",
            role: "assistant",
            text: r.output,
            parentId: (message?.input.user as any)?.id,
            agentBindingId: message?.deliveries[i]?.agent_binding_id,
          }))
          .filter((r) => r.text),
      ]
        .map((v) => JSON.stringify(v))
        .join("\n");
    }),
  };
  const session = new NativeChatSession(host);
  const observer = (cold = false) =>
    new NativeChatObserver(session, {
      target: () => (declared ? "writer" : runtime),
      ...(cold
        ? { initialSession: conversation, initialScope: "Notes" }
        : { initialScope: "Notes" }),
    });
  const port = observer();
  const action = (recipients = ["writer", "reviewer"]) => {
    const id = crypto.randomUUID();
    return {
      id,
      kind: "send",
      submission: { id, text: "Authored roles café 📝", comments: [] },
      attachments: [],
      recipients,
    };
  };
  const seed = () => {
    const id = crypto.randomUUID(),
      parent = crypto.randomUUID(),
      createdAt = "2026-10-27T00:00:00.000Z";
    const input = {
      acceptance_id: id,
      user: {
        schemaVersion: 3,
        id: parent,
        type: "message",
        role: "user",
        text: "Authored roles café 📝",
        createdAt,
        recipients: profiles.map((p) => p.selection.recipient),
      },
      dispatch: {
        version: 1,
        id: crypto.randomUUID(),
        userEntryId: parent,
        startedAt: createdAt,
        deliveries: profiles.map((p) => ({
          id: crypto.randomUUID(),
          recipient: p.selection.recipient,
          state: "pending",
        })),
      },
      turns: profiles.map((p) => ({
        request_id: crypto.randomUUID(),
        target_id: runtime,
        scope_dir: "Notes",
        prompt: "Authored roles café 📝",
        context: null,
        options: p.options,
      })),
      profiles,
    };
    message = {
      schema_version: 1,
      vault_id: vault,
      acceptance_id: id,
      conversation_id: conversation,
      input: structuredClone(input),
      deliveries: input.turns.map((t, i) => ({
        delivery_id: input.dispatch.deliveries[i].id,
        request_id: t.request_id,
        agent_binding_id: crypto.randomUUID(),
        session_id: crypto.randomUUID(),
        state: i ? "completed" : "started",
        outcome_published: !!i,
      })),
      recovered: false,
    };
    records.push(
      ...input.turns.map((input, i) => ({
        schema_version: 1,
        vault_id: vault,
        conversation_id: conversation,
        input,
        phase: i ? ("completed" as const) : ("running" as const),
        accepted_at_ms: 1000 + i,
        updated_at_ms: 1000 + i,
        output: i ? "Reviewer complete" : "Writer partial",
        failure_code: null,
      })),
    );
  };
  return {
    host,
    session,
    port,
    observer,
    action,
    seed,
    profiles,
    records,
    calls,
    turns,
    runtime,
    conversation,
    get message() {
      return message;
    },
    set declared(v: boolean) {
      declared = v;
    },
    set lose(v: boolean) {
      lose = v;
    },
  };
}
