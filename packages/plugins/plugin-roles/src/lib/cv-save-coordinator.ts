export type CvSaveState = {
  pending: boolean;
  saving: boolean;
  error: string | null;
};

type SaveWaiter = {
  resolve: () => void;
  reject: (error: unknown) => void;
};

export class CvSaveCoordinator<T> {
  readonly #write: (value: T) => Promise<void>;
  readonly #delay: number;
  readonly #onStateChange?: (state: CvSaveState) => void;
  #pending: T | null = null;
  #timer: ReturnType<typeof setTimeout> | null = null;
  #running: Promise<void> | null = null;
  #waiters: SaveWaiter[] = [];
  #state: CvSaveState = { pending: false, saving: false, error: null };

  constructor(
    write: (value: T) => void | Promise<void>,
    options: {
      delay?: number;
      onStateChange?: (state: CvSaveState) => void;
    } = {},
  ) {
    this.#write = async (value) => write(value);
    this.#delay = options.delay ?? 1_200;
    this.#onStateChange = options.onStateChange;
  }

  get state(): Readonly<CvSaveState> {
    return { ...this.#state };
  }

  queue(value: T): Promise<void> {
    this.#pending = value;
    this.#setState({ pending: true, error: null });
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      this.#timer = null;
      void this.flush().catch(() => undefined);
    }, this.#delay);
    return new Promise<void>((resolve, reject) => {
      this.#waiters.push({ resolve, reject });
    });
  }

  async flush(): Promise<void> {
    if (this.#timer) {
      clearTimeout(this.#timer);
      this.#timer = null;
    }
    if (!this.#running && this.#pending !== null) {
      this.#running = this.#drain().finally(() => {
        this.#running = null;
      });
    }
    await this.#running;
  }

  cancel(): void {
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = null;
    this.#pending = null;
    const error = new Error("CV save was cancelled");
    for (const waiter of this.#waiters.splice(0)) waiter.reject(error);
    this.#setState({ pending: false, saving: false });
  }

  async #drain(): Promise<void> {
    this.#setState({ saving: true });
    try {
      while (this.#pending !== null) {
        const value = this.#pending;
        this.#pending = null;
        try {
          await this.#write(value);
        } catch (error) {
          if (this.#pending === null) this.#pending = value;
          const message = error instanceof Error ? error.message : String(error);
          this.#setState({ pending: true, saving: false, error: message });
          for (const waiter of this.#waiters.splice(0)) waiter.reject(error);
          throw error;
        }
      }
      this.#setState({ pending: false, saving: false, error: null });
      for (const waiter of this.#waiters.splice(0)) waiter.resolve();
    } finally {
      if (this.#state.saving) this.#setState({ saving: false });
    }
  }

  #setState(next: Partial<CvSaveState>): void {
    this.#state = { ...this.#state, ...next };
    this.#onStateChange?.({ ...this.#state });
  }
}
