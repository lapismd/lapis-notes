import type { AgentAction } from "@lapismd/agent-ui/core";
import type {
  ParticipantCommand,
  ParticipantMessage,
  ParticipantMessageInput,
  ParticipantProfile,
  ParticipantValue,
  TurnSummary,
} from "@lapis-notes/api/native-turns";
import {
  captureNativeParticipants,
  canonicalParticipant,
  participantAgents,
} from "./participant-capture";
import { refused } from "./send";

type Port = {
  readonly hasParticipants: boolean;
  participant(command: ParticipantCommand): Promise<ParticipantValue>;
};
type Capture = {
  fingerprint: string;
  input: ParticipantMessageInput;
  acknowledged?: boolean;
};
const running = (message: ParticipantMessage) =>
  message.deliveries.some(
    (d) => d.state === "pending" || d.state === "started",
  );

/** View-local correlation only. There is no writer, dispatch loop or retry here. */
export class NativeChatParticipantObserver {
  profiles: ParticipantProfile[] = [];
  #captures = new Map<string, Capture>();
  #messages = new Map<string, ParticipantMessage>();
  constructor(readonly session: Port) {}
  get declared(): boolean {
    return !!this.profiles.length;
  }
  get uncertain(): boolean {
    return [...this.#captures.values()].some(
      (capture) => !capture.acknowledged,
    );
  }
  has(head?: TurnSummary): boolean {
    return !!head && this.#messages.has(head.conversation_id);
  }
  async catalog() {
    if (!this.session.hasParticipants) {
      this.profiles = [];
      return [];
    }
    const value = await this.session.participant({ kind: "profiles" });
    if (value.kind !== "profiles")
      throw new Error("Native participant profiles are unavailable");
    const agents = participantAgents(value.profiles);
    this.profiles = structuredClone(value.profiles);
    return agents;
  }
  async read(head?: TurnSummary): Promise<ParticipantMessage | undefined> {
    if (!head || !this.session.hasParticipants) return;
    const value = await this.session.participant({
      kind: "for_turn",
      request_id: head.request_id,
    });
    if (value.kind !== "message")
      throw new Error("Native participant receipt is unavailable");
    if (!value.message) {
      this.#messages.delete(head.conversation_id);
      return;
    }
    const message = value.message;
    if (
      message.conversation_id !== head.conversation_id ||
      !message.deliveries.some((d) => d.request_id === head.request_id)
    )
      throw new Error("Native participant receipt belongs to another request");
    this.#messages.set(head.conversation_id, message);
    return message;
  }
  busy(head?: TurnSummary): boolean {
    const message = head && this.#messages.get(head.conversation_id);
    return !!message && running(message);
  }
  async stop(head: TurnSummary): Promise<boolean> {
    const message = this.#messages.get(head.conversation_id);
    if (!message || !running(message)) return false;
    const value = await this.session.participant({
      kind: "stop",
      acceptance_id: message.acceptance_id,
    });
    if (value.kind !== "stop_requested")
      throw new Error("Native participant Stop acknowledgement is unavailable");
    return value.accepted;
  }
  async accept(
    action: AgentAction,
    scope: string,
    fallback: string,
    head?: TurnSummary,
  ): Promise<string> {
    const fingerprint = canonicalParticipant(action);
    const previous = this.#captures.get(action.id);
    if (previous) {
      if (fingerprint !== previous.fingerprint)
        throw Object.assign(
          new Error("Participant identity was reused for another submission"),
          { code: "INVALID_REQUEST" },
        );
      const retained = await this.status(action.id);
      if (retained) return retained;
      throw new Error(
        "The original participant acceptance remains uncertain; inspect it without replaying",
      );
    }
    if (this.uncertain)
      throw Object.assign(
        new Error("Inspect outstanding participant actions first"),
        { code: "BUSY" },
      );
    if (this.#captures.size >= 128)
      this.#captures.delete(this.#captures.keys().next().value!);
    const input = captureNativeParticipants(
      action,
      this.profiles,
      scope,
      fallback,
      head,
    );
    this.#captures.set(action.id, { fingerprint, input });
    let value;
    try {
      value = await this.session.participant({ kind: "accept", input });
    } catch (error) {
      if (refused(error).status === "refused") this.#captures.delete(action.id);
      throw error;
    }
    return this.#accepted(action.id, input, value);
  }
  #accepted(
    actionId: string,
    input: ParticipantMessageInput,
    value: ParticipantValue,
  ): string {
    if (
      value.kind !== "message" ||
      !value.message ||
      value.message.acceptance_id !== input.acceptance_id ||
      canonicalParticipant(value.message.input) !== canonicalParticipant(input)
    )
      throw new Error("Native participant acknowledgement is unavailable");
    this.#messages.set(value.message.conversation_id, value.message);
    const capture = this.#captures.get(actionId);
    if (capture) capture.acknowledged = true;
    return value.message.conversation_id;
  }
  pending(id: string): boolean {
    return this.#captures.has(id);
  }
  async status(id: string): Promise<string | undefined> {
    const captured = this.#captures.get(id);
    if (!captured) return;
    const value = await this.session.participant({
      kind: "read",
      acceptance_id: captured.input.acceptance_id,
    });
    if (value.kind === "message" && !value.message) return;
    return this.#accepted(id, captured.input, value);
  }
}
