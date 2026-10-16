import { FileTextConflictRegistry } from "./file-text-conflicts";
export * from "./file-text-conflicts";

/**
 * Independent file writers implement this contract without importing a
 * renderer.
 */
export interface FileEditingSession {
  /** Includes queued, in-flight and failed persistence. */
  readonly dirty: boolean;
  flush(): Promise<void>;
  /**
   * Block edits before yielding; drain pending saves and return an idempotent
   * release.
   */
  protect(): Promise<() => void | Promise<void>>;
}

type Registration = {
  path: string;
  session: FileEditingSession;
  references: number;
};
type Release = {
  barrier: object;
  entry: Registration;
  release: () => void | Promise<void>;
};

function filePath(path: string): string {
  if (typeof path !== "string" || /[\\\0]/u.test(path))
    throw new Error("Editing sessions require a vault-relative file path");
  const parts = path
    .replace(/^\/+/, "")
    .split("/")
    .filter((part) => part !== "." && part !== "");
  if (!parts.length || parts.some((part) => part === ".."))
    throw new Error("Editing sessions require a vault-relative file path");
  return parts.join("/");
}

function throwFailures(errors: unknown[]): void {
  if (errors.length === 1) throw errors[0];
  if (errors.length)
    throw new AggregateError(errors, "File editing-session cleanup failed");
}
function failures(results: PromiseSettledResult<unknown>[]): unknown[] {
  return results.flatMap((result) =>
    result.status === "rejected" ? [result.reason] : [],
  );
}

/**
 * An App-owned persistence and protection boundary for independent file
 * writers. Hosts must register every writer before selecting this as an apply
 * guard.
 */
export class FileEditingSessionRegistry {
  readonly textConflicts = new FileTextConflictRegistry();
  readonly #sessions = new Map<FileEditingSession, Registration>();
  readonly #barriers = new Map<object, string | undefined>();
  readonly #releases = new Set<Release>();
  readonly #held = new Set<Registration>();
  #tail: Promise<void> = Promise.resolve();
  #closing = false;
  #closed = false;
  #disposal: Promise<void> | undefined;

  register(path: string, session: FileEditingSession): () => void {
    this.#assertOpen();
    const capturedPath = filePath(path);
    if (
      [...this.#barriers.values()].some(
        (scope) => scope === undefined || scope === capturedPath,
      )
    )
      throw new Error(`File editing is protected: ${capturedPath}`);
    if (
      !session ||
      typeof session.flush !== "function" ||
      typeof session.protect !== "function" ||
      typeof session.dirty !== "boolean"
    )
      throw new Error("Invalid file editing session");
    let entry = this.#sessions.get(session);
    if (entry && entry.path !== capturedPath)
      throw new Error("An editing session cannot change its registered file");
    if (!entry) {
      entry = { path: capturedPath, session, references: 0 };
      this.#sessions.set(session, entry);
    }
    entry.references++;
    let registered = true;
    return () => {
      if (!registered) return;
      registered = false;
      entry.references--;
      this.#prune(entry);
    };
  }

  /** Flush the captured sessions; protection is required for mutation admission. */
  async flush(path?: string): Promise<{ flushed: boolean; path?: string }> {
    this.#assertOpen();
    const scope = path === undefined ? undefined : filePath(path);
    return this.#enqueue(async () => {
      const entries = this.#matching(scope);
      const results = await Promise.allSettled(
        entries.map(async (entry) => {
          await entry.session.flush();
          if (entry.session.dirty)
            throw new Error(
              `File editing session remains dirty: ${entry.path}`,
            );
          this.#prune(entry);
        }),
      );
      throwFailures(failures(results));
      return {
        flushed: entries.length > 0,
        ...(scope === undefined ? {} : { path: scope }),
      };
    });
  }

  /**
   * Serialize mutations, holding matching sessions protected throughout the
   * callback. Callbacks and session methods must not re-enter queued registry
   * operations.
   */
  guard<T>(path: string | undefined, operation: () => Promise<T>): Promise<T> {
    try {
      this.#assertOpen();
      const scope = path === undefined ? undefined : filePath(path);
      return this.#enqueue(() => this.#guard(scope, operation));
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Stop admission immediately, drain callbacks and retry failed
   * persistence/cleanup.
   */
  dispose(): Promise<void> {
    if (this.#disposal) return this.#disposal;
    this.#closing = true;
    this.#disposal = (async () => {
      await this.#tail;
      if (this.#closed) return;
      await this.#guard(undefined, async () => undefined, true);
      this.#sessions.clear();
      this.#closed = true;
    })();
    // Keep closure permanent, but allow explicitly requested cleanup retries.
    void this.#disposal.catch(() => {
      this.#disposal = undefined;
    });
    return this.#disposal;
  }

  #assertOpen(): void {
    if (this.#closing)
      throw new Error("File editing-session registry is closed");
  }

  #enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const run = this.#tail.then(() => {
      this.#assertOpen();
      return operation();
    });
    this.#tail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  #matching(path: string | undefined): Registration[] {
    return [...this.#sessions.values()].filter(
      (entry) => path === undefined || entry.path === path,
    );
  }

  #prune(entry: Registration): void {
    // A detached writer's failed or in-flight persistence remains a barrier.
    if (
      entry.references ||
      this.#held.has(entry) ||
      this.#sessions.get(entry.session) !== entry
    )
      return;
    try {
      if (!entry.session.dirty) this.#sessions.delete(entry.session);
    } catch {
      // A failing dirty-state getter must not silently remove a writer.
    }
  }

  async #release(pending: Release[]): Promise<unknown[]> {
    const results = await Promise.allSettled(
      pending.map(async (lease) => {
        await lease.release();
        this.#releases.delete(lease);
        this.#held.delete(lease.entry);
        this.#prune(lease.entry);
      }),
    );
    for (const barrier of this.#barriers.keys())
      if (![...this.#releases].some((lease) => lease.barrier === barrier))
        this.#barriers.delete(barrier);
    return failures(results);
  }

  async #guard<T>(
    path: string | undefined,
    operation: () => Promise<T>,
    shutdown = false,
  ): Promise<T> {
    // A previous release failure must be repaired before another mutation starts.
    throwFailures(await this.#release([...this.#releases]));
    const barrier = {};
    this.#barriers.set(barrier, path);
    const entries = this.#matching(path);
    for (const entry of entries) this.#held.add(entry);
    let result!: T;
    const errors: unknown[] = [];
    try {
      const protectedEntries: Registration[] = [];
      const admission = await Promise.allSettled(
        entries.map(async (entry) => {
          const release = await entry.session.protect();
          if (typeof release !== "function")
            throw new Error("Invalid editing-session protection release");
          this.#releases.add({ barrier, entry, release });
          protectedEntries.push(entry);
        }),
      );
      const saved = await Promise.allSettled(
        protectedEntries.map(async (entry) => {
          await entry.session.flush();
          if (entry.session.dirty)
            throw new Error(
              `File editing session remains dirty: ${entry.path}`,
            );
          this.#prune(entry);
        }),
      );
      throwFailures([...failures(admission), ...failures(saved)]);
      if (!shutdown) this.#assertOpen();
      result = await operation();
    } catch (error) {
      errors.push(error);
    }
    errors.push(
      ...(await this.#release(
        [...this.#releases].filter((lease) => lease.barrier === barrier),
      )),
    );
    for (const entry of entries) {
      if (![...this.#releases].some((lease) => lease.entry === entry)) {
        this.#held.delete(entry);
        this.#prune(entry);
      }
    }
    throwFailures(errors);
    return result;
  }
}
