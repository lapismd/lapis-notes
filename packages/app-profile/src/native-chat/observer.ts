import type {
  AgentAction,
  AgentOutcome,
  AgentPort,
  AgentSnapshot,
} from "@lapismd/agent-ui/core";
import type { TurnInput, TurnSummary } from "@lapis-notes/api/native-turns";
import { active, conversation, directory } from "./conversation";
import type { NativeChatSession } from "./session";
import { NativeChatMetadata } from "./metadata";
import { NativeChatQueueObserver } from "./queue-observer";
import { nativeSendTarget, refused } from "./send";

/** One view's read-only projection. Native commands retain all durable authority. */
export class NativeChatObserver implements AgentPort {
  selected: string;
  #draft = `draft:${crypto.randomUUID()}`;
  #heads = new Map<string, TurnSummary>();
  #firsts = new Map<string, TurnSummary>();
  #metadata: NativeChatMetadata;
  #queue: NativeChatQueueObserver;
  #scope: string;
  #closed = false;
  #tail = Promise.resolve();
  #listeners = new Set<(snapshot: AgentSnapshot) => void>();
  #timer?: ReturnType<typeof setTimeout>;
  constructor(
    readonly session: NativeChatSession,
    readonly options: {
      target(): string;
      initialSession?: string;
      initialScope?: string;
    },
  ) {
    this.selected = options.initialSession ?? this.#draft;
    this.#scope = options.initialScope ?? "";
    this.#metadata = new NativeChatMetadata(session);
    this.#queue = new NativeChatQueueObserver(session);
  }
  resolveRecipients(input: { selected: readonly string[] }): readonly string[] {
    return input.selected.length ? input.selected : [this.options.target()];
  }
  #run<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.#tail.then(() => {
      if (this.#closed) throw new Error("The chat view is closed");
      return operation();
    });
    this.#tail = result.then(
      () => {},
      () => {},
    );
    return result;
  }
  read(signal: AbortSignal): Promise<AgentSnapshot> {
    return this.#run(async () => {
      if (signal.aborted) throw new Error("Chat observation was cancelled");
      return this.#snapshot();
    });
  }
  async #snapshot(): Promise<AgentSnapshot> {
    const [list, targets] = await Promise.all([
      this.session.call({ kind: "list" }),
      this.session.call({ kind: "targets" }),
    ]);
    if (list.kind !== "records" || targets.kind !== "targets")
      throw new Error("Native chat state is unavailable");
    this.#heads.clear();
    this.#firsts.clear();
    for (const record of list.records) {
      directory(record);
      const previous = this.#heads.get(record.conversation_id);
      if (!previous || record.accepted_at_ms > previous.accepted_at_ms)
        this.#heads.set(record.conversation_id, record);
      const first = this.#firsts.get(record.conversation_id);
      if (!first || record.accepted_at_ms < first.accepted_at_ms)
        this.#firsts.set(record.conversation_id, record);
    }
    const heads = [...this.#heads.values()].sort(
      (a, b) => b.updated_at_ms - a.updated_at_ms,
    );
    const metadata = await this.#metadata.read(heads, this.#firsts);
    const sessions: AgentSnapshot["sessions"] = heads.map((head) => ({
      id: head.conversation_id,
      title: metadata.get(head.conversation_id)?.title ?? "Conversation",
      agent: head.target_id,
      updatedAt: new Date(head.updated_at_ms).toISOString(),
      status: metadata.get(head.conversation_id)?.status ?? "active",
      scope: head.scope_dir,
      path: directory(head),
      items: [],
    }));
    const head = this.#heads.get(this.selected);
    if (head) {
      const value = await this.session.call({
        kind: "read",
        request_id: head.request_id,
      });
      if (value.kind !== "record" || !value.record)
        throw new Error("Native conversation is unavailable");
      const saved = await conversation(this.session, head, value.record);
      Object.assign(sessions.find((row) => row.id === this.selected)!, saved);
    } else if (this.selected !== this.#draft) {
      throw new Error("The selected native conversation is unavailable");
    }
    if (this.selected === this.#draft)
      sessions.unshift({
        id: this.#draft,
        title: "New conversation",
        agent: this.options.target() || targets.targets[0]?.id || "",
        updatedAt: "",
        status: "active",
        scope: this.#scope,
        items: [],
      });
    const running = !!head && active(head.phase),
      busy = heads.some((row) => active(row.phase));
    const queue = await this.#queue.read(head);
    const selectedBusy = running || !!queue.queueState?.running;
    const vaultBusy = busy || !!queue.queueState?.running;
    const canSend =
      !!targets.targets.length &&
      !this.#queue.paused(head) &&
      (!vaultBusy ||
        (!!head &&
          this.session.hasQueue &&
          !!(await this.session.queueSelection(
            this.options.target() || head.target_id,
          ))));
    const snapshot: AgentSnapshot = {
      sessions,
      agents: targets.targets.map((target) => ({
        id: target.id,
        name: target.label,
        enabled: true,
        description: "",
        provider: "Native ACP",
        model: "",
      })),
      catalog: [],
      imports: [],
      requests: [],
      ...queue,
      busy: selectedBusy,
      capabilities: [
        "new_session",
        ...(canSend ? ["send"] : []),
        ...(queue.queueState
          ? ["cancel_queued", "pause_queue", "resume_queue"]
          : []),
        ...(selectedBusy ? ["stop"] : []),
      ],
      chat: {
        scope: head?.scope_dir ?? this.#scope,
        scopes: [...new Set([this.#scope, ...heads.map((h) => h.scope_dir)])],
        files: [],
        controls: { attachments: false, approvalPolicy: false, runtime: false },
      },
    };
    if (!this.#closed)
      for (const listener of this.#listeners) listener(snapshot);
    return snapshot;
  }
  selectSession(id: string): Promise<AgentSnapshot> {
    return this.#run(async () => {
      this.selected = id;
      return this.#snapshot();
    });
  }
  act(action: AgentAction): Promise<AgentOutcome> {
    return this.#run(() => this.#act(action));
  }
  async #act(action: AgentAction): Promise<AgentOutcome> {
    if (action.kind === "new_session") {
      this.#draft = `draft:${crypto.randomUUID()}`;
      this.selected = this.#draft;
      return { status: "acknowledged", snapshot: await this.#snapshot() };
    }
    if (
      ["stop", "pause_queue", "resume_queue", "cancel_queued"].includes(
        action.kind,
      )
    ) {
      const head = this.#heads.get(action.session ?? this.selected);
      if (!head)
        return {
          status: "refused",
          reason: "No native conversation is selected",
        };
      try {
        if (this.session.hasQueue && this.#queue.has(head))
          await this.#queue.control(action, head);
        else if (action.kind === "stop" && active(head.phase))
          await this.session.call({
            kind: "cancel",
            request_id: head.request_id,
          });
        else
          return {
            status: "refused",
            reason: "No native queue or running turn is available",
          };
      } catch (error) {
        return refused(error);
      }
      return { status: "acknowledged", snapshot: await this.#snapshot() };
    }
    if (action.kind !== "send")
      return {
        status: "refused",
        reason: "This action is not available in native chat yet",
      };
    const head = this.#heads.get(action.session ?? this.selected);
    let target;
    try {
      target = await nativeSendTarget(
        this.session,
        action,
        this.options.target(),
      );
      if (
        head &&
        this.session.hasQueue &&
        (await this.#queue.accept(action, head, target))
      ) {
        return { status: "acknowledged", snapshot: await this.#snapshot() };
      }
    } catch (error) {
      return refused(error);
    }
    if ([...this.#heads.values()].some((row) => active(row.phase)))
      return {
        status: "refused",
        reason: "Wait for the current native turn to finish",
      };
    const input: TurnInput = {
      request_id: action.id,
      target_id: target.id,
      scope_dir: head?.scope_dir ?? this.#scope,
      prompt: action.submission!.text,
      context: null,
      options: {
        mode: target.default_mode,
        model: null,
        effort: null,
        max_duration_ms: 60_000,
      },
      ...(head
        ? {
            continuation: {
              conversation_id: head.conversation_id,
              after_request_id: head.request_id,
            },
          }
        : {}),
    };
    try {
      const accepted = await this.session.call({ kind: "submit", input });
      if (accepted.kind !== "record" || !accepted.record)
        return { status: "unknown" };
      this.selected = accepted.record.conversation_id;
    } catch (error) {
      return refused(error);
    }
    return { status: "acknowledged", snapshot: await this.#snapshot() };
  }
  status(id: string): Promise<AgentOutcome> {
    return this.#run(async () => {
      if (this.#queue.pending(id)) {
        const conversation = await this.#queue.status(id);
        if (!conversation) return { status: "unknown" };
        this.selected = conversation;
        return { status: "acknowledged", snapshot: await this.#snapshot() };
      }
      const value = await this.session.call({ kind: "read", request_id: id });
      if (value.kind !== "record" || !value.record)
        return { status: "unknown" };
      this.selected = value.record.conversation_id;
      return { status: "acknowledged", snapshot: await this.#snapshot() };
    });
  }
  subscribe(listener: (snapshot: AgentSnapshot) => void): () => void {
    this.#listeners.add(listener);
    this.#schedule();
    return () => {
      this.#listeners.delete(listener);
      if (!this.#listeners.size) clearTimeout(this.#timer);
    };
  }
  #schedule(): void {
    if (this.#closed || !this.#listeners.size) return;
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      void this.read(new AbortController().signal)
        .catch((error) => {
          if (!this.#closed) this.session.report(error);
        })
        .finally(() => this.#schedule());
    }, 400);
  }
  report(error: Error): void {
    this.session.report(error);
  }
  close(): void {
    this.#closed = true;
    clearTimeout(this.#timer);
    this.#listeners.clear();
  }
}
