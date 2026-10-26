import type {
  EditingIntentState,
  EditingIntentValue,
  NativeEditingIntents,
} from "./native-editing-intents";

export interface NativeEditingRecoverySnapshot {
  readonly claims: readonly Readonly<EditingIntentState>[];
  readonly error?: string;
}

type Track = <T>(operation: () => Promise<T>) => Promise<T>;
type Listener = (snapshot: NativeEditingRecoverySnapshot) => void;

const matches = (left: EditingIntentState, right: EditingIntentState) =>
  left.editor_id === right.editor_id &&
  left.path === right.path &&
  left.generation === right.generation &&
  left.revision === right.revision &&
  left.active === right.active &&
  left.dirty === right.dirty &&
  left.detached === right.detached;

/** Passive recovery metadata. Native intents contain no document or draft bytes. */
export class NativeEditingRecovery {
  readonly #listeners = new Set<Listener>();
  readonly #adopted = new Set<string>();
  readonly #acting = new Set<string>();
  #snapshot: NativeEditingRecoverySnapshot = Object.freeze({
    claims: Object.freeze([]),
  });
  #observers = 0;
  #epoch = 0;
  #mutation = 0;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #pending: { epoch: number; promise: Promise<void> } | undefined;

  constructor(
    private readonly port: NativeEditingIntents,
    private readonly track: Track,
  ) {}

  snapshot(): NativeEditingRecoverySnapshot {
    return this.#snapshot;
  }

  subscribe(listener: Listener): () => void {
    this.#listeners.add(listener);
    listener(this.#snapshot);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  /** Shell-owned read-only observation; multiple shells share one poll. */
  observe(): () => void {
    if (this.#observers++ === 0) void this.#poll(++this.#epoch);
    let held = true;
    return () => {
      if (!held) return;
      held = false;
      if (--this.#observers === 0) {
        this.#epoch++;
        clearTimeout(this.#timer);
        this.#timer = undefined;
      }
    };
  }

  async #poll(epoch: number): Promise<void> {
    try {
      await this.#load(epoch);
    } catch {
      /* Failure remains in the snapshot. */
    }
    if (this.#observers && epoch === this.#epoch)
      this.#timer = setTimeout(() => void this.#poll(epoch), 1000);
  }

  refresh(): Promise<void> {
    return this.#load(this.#epoch);
  }

  #load(epoch: number): Promise<void> {
    if (this.#pending?.epoch === epoch) return this.#pending.promise;
    const mutation = this.#mutation;
    const promise = (async () => {
      try {
        const value = await this.port.call({ kind: "list" });
        if (value.kind !== "states")
          throw new Error("Native editing claims are unavailable");
        if (epoch !== this.#epoch || mutation !== this.#mutation) return;
        const retained = new Set(value.states.map((state) => state.editor_id));
        for (const id of this.#adopted)
          if (!retained.has(id)) this.#adopted.delete(id);
        this.#publish(
          value.states.filter(
            (state) => state.detached || this.#adopted.has(state.editor_id),
          ),
        );
      } catch (error) {
        if (epoch === this.#epoch && mutation === this.#mutation)
          this.#publish(this.#snapshot.claims, error);
        throw error;
      }
    })();
    const pending = { epoch, promise };
    this.#pending = pending;
    void promise
      .finally(() => {
        if (this.#pending === pending) this.#pending = undefined;
      })
      .catch(() => {});
    return promise;
  }

  /** Hosts call this before destructive App/registry teardown. */
  async assertClear(): Promise<void> {
    await this.refresh();
    if (this.#snapshot.claims.length)
      throw new Error("Unresolved editing claims require review in Problems");
  }

  recover(captured: EditingIntentState): Promise<void> {
    return this.#act("recover", captured);
  }

  discard(captured: EditingIntentState): Promise<void> {
    return this.#act("discard", captured);
  }

  #act(
    kind: "recover" | "discard",
    captured: EditingIntentState,
  ): Promise<void> {
    return this.track(async () => {
      const current = this.#snapshot.claims.find(
        (state) => state.editor_id === captured.editor_id,
      );
      if (!current || !matches(current, captured))
        throw new Error("Editing claim changed; refresh Problems");
      if (this.#acting.has(current.editor_id))
        throw new Error("Editing claim recovery is pending");
      if (kind === "recover" && !current.detached)
        throw new Error("Editing claim is already attached");
      this.#acting.add(current.editor_id);
      this.#mutation++;
      const accepts = (value: EditingIntentValue) =>
        kind === "discard"
          ? value.kind === "retired"
          : value.kind === "state" &&
            matches(value.state, {
              ...current,
              generation: current.generation + 1,
              detached: false,
            });
      try {
        let value: EditingIntentValue;
        try {
          value = await this.port.call({
            kind,
            editor_id: current.editor_id,
            generation: current.generation,
            revision: current.revision,
          });
          if (!accepts(value))
            throw new Error("Editing claim recovery response changed");
        } catch (error) {
          try {
            const inspected = await this.port.call({
              kind: "inspect",
              editor_id: current.editor_id,
            });
            if (!accepts(inspected)) throw error;
            value = inspected;
          } catch {
            throw error;
          }
        }
        const remaining = this.#snapshot.claims.filter(
          (state) => state.editor_id !== current.editor_id,
        );
        if (value.kind === "state") {
          this.#adopted.add(current.editor_id);
          this.#publish([...remaining, value.state]);
        } else {
          this.#adopted.delete(current.editor_id);
          this.#publish(remaining);
        }
      } catch (error) {
        this.#publish(this.#snapshot.claims, error);
        throw error;
      } finally {
        this.#acting.delete(current.editor_id);
      }
    });
  }

  #publish(claims: readonly EditingIntentState[], error?: unknown): void {
    const message = error
      ? error instanceof Error
        ? error.message
        : String(error)
      : undefined;
    if (
      this.#snapshot.error === message &&
      claims.length === this.#snapshot.claims.length &&
      claims.every((state, index) =>
        matches(state, this.#snapshot.claims[index]!),
      )
    )
      return;
    this.#snapshot = Object.freeze({
      claims: Object.freeze(claims.map((state) => Object.freeze({ ...state }))),
      ...(message ? { error: message } : {}),
    });
    for (const listener of this.#listeners) {
      try {
        listener(this.#snapshot);
      } catch (error) {
        console.error("Editing recovery subscriber failed", error);
      }
    }
  }
}
