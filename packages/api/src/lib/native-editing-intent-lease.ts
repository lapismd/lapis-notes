import type {
  EditingIntentCommand,
  EditingIntentState,
  EditingIntentValue,
  ExpectedVersion,
  NativeEditingIntents,
} from "./native-editing-intents";

/** One document's native fence; this class never writes document content. */
export class NativeEditingIntentLease {
  readonly id = crypto.randomUUID();
  #generation = 1;
  #revision = 0;
  #tail: Promise<void> = Promise.resolve();
  #admission: Promise<void> | undefined;
  readonly #changes = new Map<number, EditingIntentCommand>();
  #resuming: number | undefined;
  #retiring = false;
  #state: "unknown" | "active" | "yielded" | "retired" = "unknown";

  constructor(
    private readonly port: NativeEditingIntents,
    private readonly path: string,
    private readonly savedText: () => string | null | undefined,
  ) {}

  get retired(): boolean {
    return this.#state === "retired";
  }

  get yielded(): boolean {
    return this.#state === "yielded";
  }

  #valid(value: EditingIntentValue): EditingIntentState {
    if (
      value.kind !== "state" ||
      value.state.editor_id !== this.id ||
      value.state.path !== this.path ||
      value.state.detached
    )
      throw new Error(`Native editor intent is unavailable: ${this.path}`);
    return value.state;
  }

  async #transition(
    command: EditingIntentCommand,
    accepts: (value: EditingIntentValue) => boolean,
  ): Promise<EditingIntentValue> {
    try {
      const value = await this.port.call(command);
      if (!accepts(value))
        throw new Error("Native editor intent reply changed");
      return value;
    } catch (error) {
      // Status can prove an applied transition. It never retries file writes.
      try {
        const observed = await this.port.call({
          kind: "inspect",
          editor_id: this.id,
        });
        if (accepts(observed)) return observed;
      } catch {
        /* Preserve the definitive transition error and local protection. */
      }
      this.#state = "unknown";
      throw error;
    }
  }

  ready(): Promise<void> {
    if (this.#state === "retired")
      return Promise.reject(new Error("Native editor intent is retired"));
    if (this.#admission) return this.#admission;
    this.#admission = this.#transition(
      { kind: "acquire", editor_id: this.id, path: this.path },
      (value) => {
        const state = this.#valid(value);
        return (
          state.generation === 1 &&
          state.revision === 0 &&
          state.active &&
          !state.dirty
        );
      },
    ).then(() => {
      this.#state = "active";
    });
    void this.#admission.catch(() => {
      this.#admission = undefined;
    });
    return this.#admission;
  }

  changed(): Promise<void> {
    const revision = ++this.#revision;
    this.#changes.set(revision, {
      kind: "changed",
      editor_id: this.id,
      generation: this.#generation,
      revision,
    });
    const changed = this.#tail
      .catch(() => {})
      .then(() => this.#settleChanges());
    this.#tail = changed;
    // Native failures are observed by ready/flush/guard, including debounce callers.
    void changed.catch(() => {});
    return changed;
  }

  async #settleChanges(): Promise<void> {
    await this.ready();
    for (const [revision, command] of this.#changes) {
      await this.#transition(command, (value) => {
        const state = this.#valid(value);
        return (
          state.generation === this.#generation &&
          state.revision === revision &&
          state.active &&
          state.dirty
        );
      });
      this.#changes.delete(revision);
    }
  }

  async #reconcile(): Promise<void> {
    const value = await this.port.call({ kind: "inspect", editor_id: this.id });
    if (value.kind === "retired" && this.#retiring) {
      this.#state = "retired";
      return;
    }
    const state = this.#valid(value);
    if (
      state.revision !== this.#revision ||
      (state.generation !== this.#generation &&
        !(state.active && state.generation === this.#resuming))
    )
      throw new Error(`Native editor intent requires recovery: ${this.path}`);
    this.#generation = state.generation;
    this.#state = state.active ? "active" : "yielded";
    this.#resuming = undefined;
  }

  yield(): Promise<void> {
    return this.#yield(true);
  }

  async #yield(requireSavedMatch: boolean): Promise<void> {
    await this.ready();
    await this.#tail.catch(() => {});
    await this.#settleChanges();
    if (this.#state === "unknown") await this.#reconcile();
    if (this.#state === "yielded") return;
    const saved = this.savedText();
    const current = await this.port.read(this.path);
    if (
      requireSavedMatch &&
      saved !== undefined &&
      saved !== (current?.text ?? null)
    )
      throw Object.assign(
        new Error(`Saved editor content changed: ${this.path}`),
        { code: "ECONFLICT" },
      );
    const expected: ExpectedVersion = current
      ? { kind: "version", version: current.version }
      : { kind: "missing" };
    await this.#transition(
      {
        kind: "yield",
        editor_id: this.id,
        generation: this.#generation,
        revision: this.#revision,
        expected,
      },
      (value) => {
        const state = this.#valid(value);
        return (
          state.generation === this.#generation &&
          state.revision === this.#revision &&
          !state.active &&
          !state.dirty
        );
      },
    );
    this.#state = "yielded";
  }

  async resume(): Promise<void> {
    await this.ready();
    await this.#tail.catch(() => {});
    await this.#settleChanges();
    if (this.#state === "unknown") await this.#reconcile();
    if (this.#state === "active") return;
    const generation = this.#generation + 1;
    this.#resuming = generation;
    await this.#transition(
      { kind: "resume", editor_id: this.id, generation },
      (value) => {
        const state = this.#valid(value);
        return (
          state.generation === generation &&
          state.revision === this.#revision &&
          state.active
        );
      },
    );
    this.#generation = generation;
    this.#resuming = undefined;
    this.#state = "active";
  }

  async retire(): Promise<void> {
    if (this.#state === "unknown" && this.#retiring) await this.#reconcile();
    if (this.retired) return;
    // The registry permits terminal retirement only after the producer is clean.
    // External deletion/rename may change saved bytes; no mutation follows.
    await this.#yield(false);
    this.#retiring = true;
    await this.#transition(
      { kind: "retire", editor_id: this.id, generation: this.#generation },
      (value) => value.kind === "retired",
    );
    this.#state = "retired";
  }
}
