export type FileTextResolution = "keep-local" | "use-external";

/** A captured recovery decision; stale objects cannot resolve newer conflicts. */
export interface FileTextConflict {
  readonly id: string;
  readonly path: string;
  readonly baseline: string | null;
  readonly local: string;
  /** Undefined means the authoritative disk read failed; null means deletion. */
  readonly external: string | null | undefined;
  readonly readError?: string;
  resolve(choice: FileTextResolution): Promise<void>;
  refresh(): Promise<void>;
}

/** App-owned text recovery, independent of the lifetime of individual views. */
export class FileTextConflictRegistry {
  readonly #entries = new Map<string, FileTextConflict>();
  readonly #listeners = new Set<
    (entries: readonly FileTextConflict[]) => void
  >();

  get entries(): readonly FileTextConflict[] {
    return [...this.#entries.values()];
  }

  subscribe(
    listener: (entries: readonly FileTextConflict[]) => void,
  ): () => void {
    this.#listeners.add(listener);
    listener(this.entries);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  /** @internal Writer-owned publication; hosts consume entries and their actions. */
  publish(conflict: FileTextConflict): void {
    this.#entries.set(conflict.id, Object.freeze(conflict));
    this.#notify();
  }

  /** @internal Release only after persistence or an explicit discard succeeds. */
  clear(id: string): void {
    if (this.#entries.delete(id)) this.#notify();
  }

  #notify(): void {
    for (const listener of this.#listeners) {
      try {
        listener(this.entries);
      } catch (error) {
        console.error("Text conflict subscriber failed", error);
      }
    }
  }
}
