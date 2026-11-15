import type { FileEditingSessionRegistry } from "./file-editing-sessions";

export type NativeSyncProvider = "lapis-server";

export type NativeSyncCommand = {
  provider: NativeSyncProvider;
  requestId: string;
  operation: string;
  input: Record<string, unknown>;
};

export type NativeSyncReply = {
  provider: NativeSyncProvider;
  requestId: string;
  value: unknown;
};

export type NativeSyncObservation = {
  provider: NativeSyncProvider;
  revision: number;
  snapshot: unknown;
};

/** Host-owned transport already admitted to one vault and native owner. */
export interface NativeSyncPort {
  readonly provider: NativeSyncProvider;
  snapshot(): NativeSyncObservation;
  call(command: NativeSyncCommand): Promise<NativeSyncReply>;
  observe(
    listener: (observation: NativeSyncObservation) => void,
    reportError: (error: unknown) => void,
  ): () => void;
}

function unavailable(): Error {
  return new Error("The selected native Sync provider is not available");
}

function revoked(): Error {
  return new Error("The selected native Sync capability has been revoked");
}

function validateCommand(
  command: NativeSyncCommand,
  provider: NativeSyncProvider,
): void {
  if (
    !command ||
    command.provider !== provider ||
    typeof command.requestId !== "string" ||
    command.requestId.length === 0 ||
    typeof command.operation !== "string" ||
    !/^[a-z][a-z0-9-]{0,63}$/u.test(command.operation) ||
    !command.input ||
    typeof command.input !== "object" ||
    Array.isArray(command.input)
  )
    throw new Error("Invalid native Sync command");
}

function cloneObservation(
  observation: NativeSyncObservation,
  provider: NativeSyncProvider,
): NativeSyncObservation {
  if (
    !observation ||
    observation.provider !== provider ||
    !Number.isSafeInteger(observation.revision) ||
    observation.revision < 0
  )
    throw new Error("Invalid native Sync observation");
  return structuredClone(observation);
}

function cloneReply(
  reply: NativeSyncReply,
  command: NativeSyncCommand,
): NativeSyncReply {
  if (
    !reply ||
    reply.provider !== command.provider ||
    reply.requestId !== command.requestId
  )
    throw new Error("Invalid native Sync reply");
  return structuredClone(reply);
}

/** One plugin activation's revocable view of the App-owned native service. */
export class NativeSyncLease {
  readonly provider: NativeSyncProvider;
  readonly #listeners = new Set<() => void>();
  readonly #errorListeners = new Set<(error: unknown) => void>();
  readonly #pending = new Set<Promise<unknown>>();
  #stopped = false;
  #detachPromise?: Promise<void>;

  constructor(private readonly owner: NativeSyncService) {
    this.provider = owner.provider;
  }

  get detached(): boolean {
    return this.#stopped;
  }

  snapshot(): NativeSyncObservation {
    this.assertActive();
    return this.owner.snapshot();
  }

  subscribe(
    listener: () => void,
    reportError: (error: unknown) => void = () => {},
  ): () => void {
    this.assertActive();
    this.#listeners.add(listener);
    this.#errorListeners.add(reportError);
    let subscribed = true;
    return () => {
      if (!subscribed) return;
      subscribed = false;
      this.#listeners.delete(listener);
      this.#errorListeners.delete(reportError);
    };
  }

  call(command: NativeSyncCommand): Promise<NativeSyncReply> {
    try {
      this.assertActive();
    } catch (error) {
      return Promise.reject(error);
    }
    return this.#track(this.owner.invoke(this, command, false));
  }

  /** Run a working-vault mutation inside the App's whole-vault writer guard. */
  apply(command: NativeSyncCommand): Promise<NativeSyncReply> {
    try {
      this.assertActive();
    } catch (error) {
      return Promise.reject(error);
    }
    return this.#track(this.owner.invoke(this, command, true));
  }

  detach(): Promise<void> {
    if (this.#detachPromise) return this.#detachPromise;
    this.#stopped = true;
    let cleanupFailure: unknown;
    try {
      this.owner.release(this);
    } catch (error) {
      cleanupFailure = error;
    }
    this.#listeners.clear();
    this.#errorListeners.clear();
    this.#detachPromise = Promise.allSettled([...this.#pending]).then(() => {
      if (cleanupFailure !== undefined) throw cleanupFailure;
    });
    return this.#detachPromise;
  }

  assertActive(): void {
    if (this.#stopped) throw revoked();
  }

  notify(): void {
    if (!this.#stopped) for (const listener of this.#listeners) listener();
  }

  report(error: unknown): void {
    if (!this.#stopped)
      for (const listener of this.#errorListeners) listener(error);
  }

  #track<T>(operation: Promise<T>): Promise<T> {
    this.#pending.add(operation);
    void operation
      .finally(() => this.#pending.delete(operation))
      .catch(() => undefined);
    return operation;
  }
}

/** App-owned selection, observation and writer-admission boundary. */
export class NativeSyncService {
  readonly provider: NativeSyncProvider;
  readonly #leases = new Set<NativeSyncLease>();
  #current?: NativeSyncObservation;
  #stopObservation?: () => void;
  #observationGeneration = 0;
  #disposed = false;
  #disposePromise?: Promise<void>;

  constructor(
    private readonly port: NativeSyncPort,
    private readonly editing: FileEditingSessionRegistry,
  ) {
    this.provider = port.provider;
  }

  select(provider: NativeSyncProvider): NativeSyncLease {
    if (this.#disposed || provider !== this.provider) throw unavailable();
    if (!this.#leases.size) this.#startObservation();
    const lease = new NativeSyncLease(this);
    this.#leases.add(lease);
    return lease;
  }

  snapshot(): NativeSyncObservation {
    if (this.#disposed || !this.#current) throw unavailable();
    return structuredClone(this.#current);
  }

  async invoke(
    lease: NativeSyncLease,
    command: NativeSyncCommand,
    guarded: boolean,
  ): Promise<NativeSyncReply> {
    lease.assertActive();
    validateCommand(command, this.provider);
    const call = async () => {
      lease.assertActive();
      try {
        const result = await this.port.call(structuredClone(command));
        lease.assertActive();
        return cloneReply(result, command);
      } catch (error) {
        lease.assertActive();
        throw error;
      }
    };
    return guarded ? this.editing.guard(undefined, call) : call();
  }

  release(lease: NativeSyncLease): void {
    this.#leases.delete(lease);
    if (!this.#leases.size) this.#stopObserving();
  }

  dispose(): Promise<void> {
    if (this.#disposePromise) return this.#disposePromise;
    this.#disposed = true;
    let cleanupFailure: unknown;
    try {
      this.#stopObserving();
    } catch (error) {
      cleanupFailure = error;
    }
    const pending = [...this.#leases].map((lease) => lease.detach());
    this.#leases.clear();
    this.#disposePromise = Promise.allSettled(pending).then((results) => {
      const failures = results.flatMap((result) =>
        result.status === "rejected" ? [result.reason] : [],
      );
      if (cleanupFailure !== undefined) failures.unshift(cleanupFailure);
      if (failures.length === 1) throw failures[0];
      if (failures.length)
        throw new AggregateError(failures, "Native Sync cleanup failed");
    });
    return this.#disposePromise;
  }

  #startObservation(): void {
    const generation = ++this.#observationGeneration;
    this.#current = cloneObservation(this.port.snapshot(), this.provider);
    const stop = this.port.observe(
      (observation) => {
        if (this.#disposed || generation !== this.#observationGeneration)
          return;
        try {
          const next = cloneObservation(observation, this.provider);
          if (next.revision < this.#current!.revision)
            throw new Error("Stale native Sync observation");
          this.#current = next;
          for (const lease of this.#leases) lease.notify();
        } catch (error) {
          for (const lease of this.#leases) lease.report(error);
        }
      },
      (error) => {
        if (this.#disposed || generation !== this.#observationGeneration)
          return;
        for (const lease of this.#leases) lease.report(error);
      },
    );
    if (typeof stop !== "function")
      throw new Error("Invalid native Sync observation disposer");
    this.#stopObservation = stop;
  }

  #stopObserving(): void {
    this.#observationGeneration++;
    const stop = this.#stopObservation;
    this.#stopObservation = undefined;
    stop?.();
  }
}
