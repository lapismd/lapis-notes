import { ServerHostError } from "@lapis-notes/api/server-host";

export type VaultEventKind = "file" | "database" | "resync-required";

export type VaultEvent = {
  id: string;
  kind: VaultEventKind;
  vaultId: string;
  payload: unknown;
};

type Subscriber = (event: VaultEvent) => void;

type VaultEventState = {
  epoch: string;
  sequence: number;
  replay: VaultEvent[];
  subscribers: Set<Subscriber>;
};

export class VaultEventHub {
  readonly #states = new Map<string, VaultEventState>();

  constructor(private readonly replayLimit = 512) {
    if (!Number.isSafeInteger(replayLimit) || replayLimit < 1) {
      throw new Error("Vault event replay limit must be positive");
    }
  }

  publish(
    vaultId: string,
    kind: Exclude<VaultEventKind, "resync-required">,
    payload: unknown,
  ): VaultEvent {
    const state = this.#state(vaultId);
    const event = {
      id: `${state.epoch}:${++state.sequence}`,
      kind,
      vaultId,
      payload,
    } satisfies VaultEvent;
    state.replay.push(event);
    if (state.replay.length > this.replayLimit) state.replay.shift();
    for (const subscriber of state.subscribers) subscriber(event);
    return event;
  }

  replay(vaultId: string, cursor?: string): VaultEvent[] {
    if (!cursor) return [];
    const state = this.#state(vaultId);
    const separator = cursor.lastIndexOf(":");
    const epoch = cursor.slice(0, separator);
    const sequence = Number(cursor.slice(separator + 1));
    const first = state.replay.at(0);
    if (
      separator < 1 ||
      epoch !== state.epoch ||
      !Number.isSafeInteger(sequence) ||
      sequence < 0 ||
      (first &&
        sequence < Number(first.id.slice(first.id.lastIndexOf(":") + 1)) - 1) ||
      sequence > state.sequence
    ) {
      throw new ServerHostError(
        "RESYNC_REQUIRED",
        "Vault event cursor is unavailable",
      );
    }
    return state.replay.filter(
      (event) =>
        Number(event.id.slice(event.id.lastIndexOf(":") + 1)) > sequence,
    );
  }

  subscribe(vaultId: string, subscriber: Subscriber): () => void {
    const subscribers = this.#state(vaultId).subscribers;
    subscribers.add(subscriber);
    return () => subscribers.delete(subscriber);
  }

  reset(vaultId: string): void {
    const current = this.#states.get(vaultId);
    if (current) {
      for (const subscriber of current.subscribers) {
        subscriber({
          id: `${current.epoch}:${++current.sequence}`,
          kind: "resync-required",
          vaultId,
          payload: null,
        });
      }
    }
    this.#states.delete(vaultId);
  }

  close(): void {
    for (const vaultId of [...this.#states.keys()]) this.reset(vaultId);
  }

  #state(vaultId: string): VaultEventState {
    let state = this.#states.get(vaultId);
    if (!state) {
      state = {
        epoch: crypto.randomUUID(),
        sequence: 0,
        replay: [],
        subscribers: new Set(),
      };
      this.#states.set(vaultId, state);
    }
    return state;
  }
}
