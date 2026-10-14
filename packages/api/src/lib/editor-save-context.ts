import debounce from "lodash-es/debounce";

export interface EditorSaveSnapshot {
  content: string;
  sequence: number;
  documentGeneration: number;
}

/** One document's queued saves and failures; the editor supplies shared serialization. */
export class EditorSaveContext {
  #latest: EditorSaveSnapshot | undefined;
  #completed = 0;
  #failure: { snapshot: EditorSaveSnapshot; error: unknown } | undefined;
  #waitingChange: EditorSaveSnapshot | undefined;
  #waitingSave: EditorSaveSnapshot | undefined;
  #pending = new Set<Promise<void>>();
  #retired = false;
  #unverified = false;
  readonly #change = debounce((snapshot: EditorSaveSnapshot) => {
    this.#waitingChange = undefined;
    return this.#enqueue(snapshot);
  }, 500);
  readonly #save = debounce((snapshot: EditorSaveSnapshot) => {
    this.#waitingSave = undefined;
    return this.#enqueue(snapshot);
  }, 500);

  constructor(
    private readonly options: {
      serialize(run: () => Promise<void>): Promise<void>;
      persist(snapshot: EditorSaveSnapshot): Promise<void>;
      saved(snapshot: EditorSaveSnapshot): void;
      unownedExternal: boolean;
      released(): void;
    },
  ) {}

  get dirty(): boolean {
    return (
      !!this.#waitingChange ||
      !!this.#waitingSave ||
      this.#pending.size > 0 ||
      !!this.#failure ||
      this.#unverified
    );
  }

  queue(
    snapshot: EditorSaveSnapshot,
    explicit = false,
  ): Promise<void> | undefined {
    this.#latest = snapshot;
    if (this.options.unownedExternal) this.#unverified = true;
    if (explicit) {
      this.#waitingSave = snapshot;
      return this.#save(snapshot);
    }
    this.#waitingChange = snapshot;
    return this.#change(snapshot);
  }

  flushSave(): Promise<void> | undefined {
    return this.#save.flush();
  }
  cancelSave(): void {
    this.#save.cancel();
    this.#waitingSave = undefined;
  }
  cancelChange(): void {
    this.#change.cancel();
    this.#waitingChange = undefined;
  }

  #flushPending(): void {
    this.#change.flush();
    this.#save.flush();
  }

  #enqueue(snapshot: EditorSaveSnapshot): Promise<void> {
    const flight = this.options.serialize(async () => {
      if (snapshot.sequence <= this.#completed) return;
      await this.options.persist(snapshot);
      this.options.saved(snapshot);
      this.#completed = snapshot.sequence;
      if (this.#failure && this.#failure.snapshot.sequence <= snapshot.sequence)
        this.#failure = undefined;
    });
    this.#pending.add(flight);
    // Observe failures even when a debounce caller does not await its result.
    void flight.then(
      () => {
        this.#pending.delete(flight);
        this.#releaseIfClean();
      },
      (error) => {
        this.#failure = { snapshot, error };
        this.#pending.delete(flight);
      },
    );
    return flight;
  }

  async flush(retryFailed = true): Promise<void> {
    const retry = this.#failure;
    this.#flushPending();
    if (retryFailed && retry && this.#latest === retry.snapshot)
      this.#enqueue(retry.snapshot);
    do {
      await Promise.allSettled([...this.#pending]);
      this.#flushPending();
    } while (this.#pending.size > 0);
    if (this.#failure) throw this.#failure.error;
    this.#releaseIfClean();
  }

  retire(): void {
    this.#retired = true;
    // Retiring a context never replaces another context's debounce payload.
    this.#flushPending();
    this.#releaseIfClean();
  }

  #releaseIfClean(): void {
    if (this.#retired && !this.dirty) this.options.released();
  }
}
