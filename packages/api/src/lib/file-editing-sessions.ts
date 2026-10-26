import { FileTextConflictRegistry } from "./file-text-conflicts";
import { FileEditingNativeIssues } from "./file-editing-native-issues";
import { NativeEditingRecovery } from "./native-editing-recovery";
import type { NativeEditingIntents } from "./native-editing-intents";
import {
  NativeRegisteredEditingSession,
  type NativeEditingSession,
  type FileEditingRegistration,
} from "./native-editing-session";
export type {
  NativeEditingSession,
  FileEditingRegistration,
} from "./native-editing-session";
export * from "./file-text-conflicts";
export * from "./file-text-persistence";
export type { NativeEditingProblemIssue } from "./file-editing-native-issues";

/**
 * Independent file writers implement this contract without importing a
 * renderer.
 */
export interface FileEditingSession {
  /** Required only when the App selects native editing intents. */
  readonly native?: NativeEditingSession;
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
  native?: NativeRegisteredEditingSession;
  retirement?: Promise<unknown>;
  stopNativeIssues?: () => void;
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
  readonly nativeIssues = new FileEditingNativeIssues();
  readonly nativeRecovery: NativeEditingRecovery | undefined;
  readonly #sessions = new Map<FileEditingSession, Registration>();
  readonly #barriers = new Map<object, string | undefined>();
  readonly #releases = new Set<Release>();
  readonly #held = new Set<Registration>();
  readonly #pendingOperations = new Set<Promise<unknown>>();
  #tail: Promise<void> = Promise.resolve();
  #closing = false;
  #closed = false;
  #disposal: Promise<void> | undefined;

  constructor(private readonly native?: NativeEditingIntents) {
    this.nativeRecovery = native
      ? new NativeEditingRecovery(native, (run) => this.track(run))
      : undefined;
  }

  /** Hosts preflight before disposing the App, preserving failed-leave recovery. */
  async preflightNativeRecovery(): Promise<void> {
    await this.settleOperations();
    await this.nativeRecovery?.assertClear();
    if (this.nativeIssues.entries.length)
      throw new Error(
        "Unresolved editing admission requires review in Problems",
      );
  }

  get closed(): boolean {
    return this.#closing;
  }

  /**
   * Schedule owned event projection between mutations without acquiring an
   * editing guard. Guard callbacks may schedule this but must not await it.
   */
  afterMutations<T>(operation: () => Promise<T>): Promise<T> {
    return this.#enqueue(operation);
  }

  /** Includes retained writers; a failing dirty getter cannot waive protection. */
  hasDirty(path?: string): boolean {
    const scope = path === undefined ? undefined : filePath(path);
    return this.#matching(scope).some(({ session }) => {
      try {
        return session.dirty;
      } catch {
        return true;
      }
    });
  }

  /** Admit a multi-step file operation before its first asynchronous boundary. */
  track<T>(operation: () => Promise<T>): Promise<T> {
    try {
      this.#assertOpen();
      let resolve!: (value: T) => void;
      let reject!: (error: unknown) => void;
      const pending = new Promise<T>((done, fail) => {
        resolve = done;
        reject = fail;
      });
      this.#pendingOperations.add(pending);
      void pending.then(
        () => this.#pendingOperations.delete(pending),
        () => this.#pendingOperations.delete(pending),
      );
      try {
        void operation().then(resolve, reject);
      } catch (error) {
        reject(error);
      }
      return pending;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Hosts drain admitted operations before entering their global teardown
   * guard.
   */
  async settleOperations(): Promise<void> {
    this.#assertOpen();
    while (this.#pendingOperations.size)
      await Promise.all([...this.#pendingOperations]);
  }

  register(path: string, session: FileEditingSession): FileEditingRegistration {
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
      if (this.native) {
        entry.native = new NativeRegisteredEditingSession(
          session,
          this.native,
          capturedPath,
          () => this.#closing || entry!.references === 0,
        );
        entry.session = entry.native;
        this.#observeNativeIssues(entry);
      }
      this.#sessions.set(session, entry);
    }
    entry.references++;
    let registered = true;
    return Object.assign(
      () => {
        if (!registered) return;
        registered = false;
        entry.references--;
        this.#prune(entry);
      },
      {
        native: !!entry.native,
        ready: () => entry.native?.ready() ?? Promise.resolve(),
        changed: () => entry.native?.changed(),
        idle: () => entry.native?.idle() ?? Promise.resolve(),
      },
    );
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

  /** Admit a one-shot writer only after existing document writers settle. */
  mutate(path: string, create: () => FileEditingSession): Promise<void> {
    const scope = filePath(path);
    return this.guard(scope, async () => {
      const session = create();
      if (
        !session ||
        typeof session.flush !== "function" ||
        typeof session.protect !== "function" ||
        typeof session.dirty !== "boolean"
      )
        throw new Error("Invalid file editing session");
      const entry: Registration = { path: scope, session, references: 0 };
      if (this.native) {
        const native = new NativeRegisteredEditingSession(
          session,
          this.native,
          scope,
          () => true,
        );
        Object.assign(entry, { native, session: native });
        this.#observeNativeIssues(entry);
      }
      this.#sessions.set(session, entry);
      try {
        await entry.session.flush();
        if (session.dirty)
          throw new Error(`File mutation remains dirty: ${scope}`);
      } finally {
        this.#prune(entry);
      }
    });
  }

  /** Recover one retained writer while protecting all other writers of its file. */
  recover<T>(
    session: FileEditingSession,
    operation: () => Promise<T>,
  ): Promise<T> {
    const entry = this.#sessions.get(session);
    if (!entry || this.#closed)
      return Promise.reject(new Error("File writer is unavailable"));
    return this.#enqueue(async () => {
      try {
        return await this.#guard(entry.path, operation, true, entry);
      } finally {
        this.#prune(entry);
      }
    }, true);
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
      for (const entry of this.#sessions.values()) entry.stopNativeIssues?.();
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

  #enqueue<T>(operation: () => Promise<T>, recovery = false): Promise<T> {
    const run = this.#tail.then(() => {
      if (!recovery) this.#assertOpen();
      else if (this.#closed)
        throw new Error("File editing-session registry is closed");
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
      ![...this.#sessions.values()].includes(entry)
    )
      return;
    try {
      if (entry.session.dirty) return;
      if (entry.native && !entry.native.retired) {
        if (!entry.retirement) {
          entry.retirement = this.#enqueue(
            () => this.#guard(entry.path, async () => undefined),
            this.#closing,
          );
          void entry.retirement.catch(() => {
            entry.retirement = undefined;
          });
        }
        return;
      }
      for (const [session, registered] of this.#sessions)
        if (registered === entry) {
          this.#sessions.delete(session);
          entry.stopNativeIssues?.();
        }
    } catch {
      // A failing dirty-state getter must not silently remove a writer.
    }
  }

  #observeNativeIssues(entry: Registration): void {
    if (!entry.native) return;
    entry.stopNativeIssues = this.nativeIssues.register(
      entry.path,
      entry.native,
      (check) =>
        this.track(() =>
          this.#enqueue(async () => {
            check();
            await this.#guard(entry.path, async () => undefined);
          }),
        ),
    );
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
    excluded?: Registration,
  ): Promise<T> {
    // A previous release failure must be repaired before another mutation starts.
    throwFailures(await this.#release([...this.#releases]));
    const barrier = {};
    this.#barriers.set(barrier, path);
    const entries = this.#matching(path).filter((entry) => entry !== excluded);
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
