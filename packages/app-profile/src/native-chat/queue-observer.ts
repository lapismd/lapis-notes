import type { AgentAction, AgentSnapshot } from "@lapismd/agent-ui/core";
import type {
  QueueCommand,
  QueueRecord,
  TurnSummary,
  TurnTarget,
} from "@lapis-notes/api/native-turns";
import type { NativeChatSession } from "./session";
import { refused } from "./send";
import { captureNativeQueue, capturedQueue } from "./queue-capture";

type Recoverable = Exclude<QueueCommand, { kind: "read" }>;
/** Correlation and presentation only. Core alone persists and advances queues. */
export class NativeChatQueueObserver {
  #uncertain = new Map<string, Recoverable>();
  #known = new Map<string, Recoverable>();
  #queues = new Map<string, QueueRecord>();
  constructor(readonly session: NativeChatSession) {}

  async read(
    head?: TurnSummary,
  ): Promise<Pick<AgentSnapshot, "queued" | "queueState">> {
    if (!head || !this.session.hasQueue) return { queued: [] };
    const queue = await this.#read(head.conversation_id);
    if (!queue) return { queued: [] };
    return {
      queued: queue.entries
        .filter(
          (entry) => entry.phase === "pending" || entry.phase === "unknown",
        )
        .map((entry) => {
          const capture = capturedQueue(entry);
          return {
            id: entry.input.acceptance_id,
            submission: {
              id: capture.user.id,
              text: capture.user.text,
              comments: [],
            },
            recipients: capture.user.recipients.map((recipient) => ({
              id: recipient.id,
              label: recipient.label,
              state:
                entry.phase === "unknown"
                  ? ("unknown" as const)
                  : ("queued" as const),
              disabled: entry.phase !== "pending",
            })),
          };
        }),
      queueState: {
        paused: queue.paused,
        saving: false,
        running: queue.entries.some((entry) => entry.phase === "started"),
        resuming: false,
      },
    };
  }
  async #read(id: string): Promise<QueueRecord | null> {
    const value = await this.session.queue({
      kind: "read",
      conversation_id: id,
    });
    if (value.kind !== "queue") throw new Error("Native queue is unavailable");
    if (value.queue) {
      if (value.queue.conversation_id !== id)
        throw new Error("Native queue returned another conversation");
      this.#queues.set(id, value.queue);
    } else this.#queues.delete(id);
    return value.queue;
  }
  has(head?: TurnSummary): boolean {
    return !!head && this.#queues.has(head.conversation_id);
  }
  paused(head?: TurnSummary): boolean {
    const queue = head && this.#queues.get(head.conversation_id);
    return !!queue?.paused && queue.entries.some((e) => e.phase === "pending");
  }
  async accept(
    action: AgentAction,
    head: TurnSummary,
    target: TurnTarget,
  ): Promise<boolean> {
    const original =
      this.#uncertain.get(action.id) ?? this.#known.get(action.id);
    if (original) {
      if (
        original.kind !== "accept" ||
        original.input.conversation_id !== head.conversation_id ||
        original.input.target_id !== target.id ||
        capturedQueue({ input: original.input }).user.text !==
          action.submission!.text.trim()
      )
        throw Object.assign(
          new Error("Queue identity was reused for another submission"),
          { code: "INVALID_REQUEST" },
        );
      if (await this.status(action.id)) return true;
      throw new Error(
        "The original queue acceptance remains uncertain; inspect it without replaying",
      );
    }
    const selection = await this.session.queueSelection(target.id);
    if (!selection) return false;
    let capture;
    try {
      capture = captureNativeQueue(action.submission!.text, {
        ...selection,
        target: {
          ...selection.target,
          executionMode: selection.target.executionMode ?? target.default_mode,
        },
      });
    } catch (error) {
      throw Object.assign(error as Error, { code: "UNSUPPORTED" });
    }
    await this.#call(action.id, {
      kind: "accept",
      input: {
        acceptance_id: action.id,
        conversation_id: head.conversation_id,
        after_request_id: head.request_id,
        scope_dir: head.scope_dir,
        target_id: target.id,
        capture,
      },
    });
    return true;
  }
  async control(action: AgentAction, head: TurnSummary): Promise<void> {
    const conversation_id = head.conversation_id;
    const command: Recoverable =
      action.kind === "resume_queue"
        ? { kind: "resume", conversation_id, after_request_id: head.request_id }
        : action.kind === "cancel_queued"
          ? {
              kind: "cancel",
              conversation_id,
              acceptance_id: action.target ?? "",
            }
          : { kind: "stop", conversation_id };
    await this.#call(action.id, command);
  }
  async #call(id: string, command: Recoverable): Promise<void> {
    if (this.#uncertain.size >= 128)
      throw Object.assign(
        new Error("Inspect outstanding queue actions first"),
        { code: "BUSY" },
      );
    this.#uncertain.set(id, command);
    let value;
    try {
      value = await this.session.queue(command);
    } catch (error) {
      if (refused(error).status === "refused") this.#uncertain.delete(id);
      throw error;
    }
    if (value.kind !== "queue" || !value.queue)
      throw new Error("Native queue acknowledgement is unavailable");
    const expected =
      command.kind === "accept"
        ? command.input.conversation_id
        : command.conversation_id;
    if (value.queue.conversation_id !== expected)
      throw new Error("Native queue acknowledged another conversation");
    this.#queues.set(expected, value.queue);
    this.#remember(id, command);
    this.#uncertain.delete(id);
  }
  async status(id: string): Promise<string | undefined> {
    const command = this.#uncertain.get(id) ?? this.#known.get(id);
    if (!command) return;
    const conversation =
      command.kind === "accept"
        ? command.input.conversation_id
        : command.conversation_id;
    const queue = await this.#read(conversation);
    if (!queue) return;
    const accepted =
      command.kind === "accept"
        ? queue.entries.some(
            (e) =>
              e.input.acceptance_id === command.input.acceptance_id &&
              canonical(e.input) === canonical(command.input),
          )
        : command.kind === "cancel"
          ? queue.entries.some(
              (e) =>
                e.input.acceptance_id === command.acceptance_id &&
                e.phase === "cancelled",
            )
          : command.kind === "stop"
            ? queue.paused
            : !queue.paused;
    if (!accepted) return;
    this.#uncertain.delete(id);
    this.#remember(id, command);
    return conversation;
  }
  #remember(id: string, command: Recoverable): void {
    this.#known.set(id, command);
    if (this.#known.size > 128)
      this.#known.delete(this.#known.keys().next().value!);
  }
  pending(id: string): boolean {
    return this.#uncertain.has(id) || this.#known.has(id);
  }
}

function canonical(value: unknown): string {
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
