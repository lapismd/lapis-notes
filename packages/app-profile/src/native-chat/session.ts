import type {
  NativeTurnService,
  NativeQueueService,
  QueueCommand,
  QueueValue,
  TurnCommand,
  TurnValue,
  NativeParticipantService,
  ParticipantCommand,
  ParticipantValue,
} from "@lapis-notes/api/native-turns";

import type { NativeQueueSelection } from "./queue-capture";

export interface NativeChatQueue extends NativeQueueService {
  selection(targetId: string): Promise<NativeQueueSelection | undefined>;
}

export type NativeChatLeave = "detach" | "close" | "disable";
export interface NativeChatHost extends NativeTurnService {
  queue?: NativeChatQueue;
  participants?: NativeParticipantService;
  allowed(): boolean;
  activate(): Promise<void>;
  leave(reason: NativeChatLeave): Promise<void>;
  readText(path: string): Promise<string>;
  report?(error: Error): void;
}

/** Feature lifetime only. It never owns a transcript writer or accepted job. */
export class NativeChatSession {
  #opening?: Promise<void>;
  #closing?: Promise<void>;
  #fenced = false;
  constructor(readonly host: NativeChatHost) {}
  private live(): void {
    if (this.#fenced) throw new Error("Native chat is closed");
    if (!this.host.allowed())
      throw new Error("AI requires a trusted workspace");
  }
  private open(): Promise<void> {
    this.live();
    return (this.#opening ??= (async () => {
      await this.host.activate();
      this.live();
      const value = await this.host.call({
        kind: "set_enabled",
        enabled: true,
      });
      if (value.kind !== "availability" || !value.enabled)
        throw new Error("Native AI is unavailable");
      this.live();
    })().catch((error) => {
      this.#opening = undefined;
      throw error;
    }));
  }
  async call(command: TurnCommand): Promise<TurnValue> {
    await this.open();
    this.live();
    return this.host.call(command);
  }
  get hasQueue(): boolean {
    return !!this.host.queue;
  }
  get hasParticipants(): boolean {
    return !!this.host.participants;
  }
  async participant(command: ParticipantCommand): Promise<ParticipantValue> {
    await this.open();
    this.live();
    if (!this.host.participants)
      throw new Error("Native participants are unavailable");
    const value = await this.host.participants.call(command);
    this.live();
    return value;
  }
  async queue(command: QueueCommand): Promise<QueueValue> {
    await this.open();
    this.live();
    if (!this.host.queue) throw new Error("Native queue is unavailable");
    return this.host.queue.call(command);
  }
  async queueSelection(
    targetId: string,
  ): Promise<NativeQueueSelection | undefined> {
    await this.open();
    this.live();
    const selection = await this.host.queue?.selection(targetId);
    this.live();
    return selection;
  }
  async readText(path: string): Promise<string> {
    this.live();
    return this.host.readText(path);
  }
  report(error: Error): void {
    this.host.report?.(error);
  }
  close(reason: NativeChatLeave): Promise<void> {
    this.#fenced = true;
    // Native leave fences/drains independently of lost activation/send replies.
    return (this.#closing ??= this.host.leave(reason).catch((error) => {
      this.#closing = undefined;
      throw error;
    }));
  }
}
