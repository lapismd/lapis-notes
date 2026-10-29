import type { FileEditingSession } from "./file-editing-sessions";
import type { NativeEditingIntents } from "./native-editing-intents";
import { NativeEditingIntentLease } from "./native-editing-intent-lease";

/** Producer-owned local protection and last acknowledged destination bytes. */
export interface NativeEditingSession {
  /** Block input synchronously, before native admission's first await. */
  hold(): () => void | Promise<void>;
  savedText(): string | null | undefined;
  /**
   * Observe native-owned saved bytes while the existing producer stays
   * protected.
   */
  refreshSavedText?(text: string | null): void | Promise<void>;
  /** Logical state has no editable buffer while idle. Documents remain default. */
  readonly lifetime?: "interactive" | "operation";
}

export type NativeEditingPhase =
  | "admission"
  | "handoff"
  | "rearm"
  | "retirement";
export interface NativeEditingIssue {
  readonly id: string;
  readonly path: string;
  readonly phase: NativeEditingPhase;
  readonly status: "pending" | "failed";
  readonly message: string;
}

export type FileEditingRegistration = (() => void) & {
  readonly native: boolean;
  /** An explicit retry may reconcile native admission without changing identity. */
  ready(): Promise<void>;
  /** Capture a newer dirty generation; the active intent already fences writers. */
  changed(): void;
  /** Quiesce an acknowledged noninteractive operation; documents stay active. */
  idle(): Promise<void>;
};

/** Adds a native fence to an existing writer without replacing its persistence. */
export class NativeRegisteredEditingSession implements FileEditingSession {
  #lease: NativeEditingIntentLease | undefined;
  #initialRelease: (() => void | Promise<void>) | undefined;
  #initiallyDirty: boolean;
  #initialDirtyReported = false;
  #protected = 0;
  readonly #scoped: boolean;
  #admitted = false;
  #idle = false;
  #refreshPending = false;
  #handoffFailure: { error: unknown } | undefined;
  #issue: NativeEditingIssue | undefined;
  #epoch = 0;
  readonly #pending = new Set<Promise<void>>();
  readonly #listeners = new Set<() => void>();

  constructor(
    private readonly session: FileEditingSession,
    private readonly port: NativeEditingIntents,
    private readonly path: string,
    private readonly retiring: () => boolean,
  ) {
    if (!session.native)
      throw new Error(`Native editing lifecycle is required: ${path}`);
    this.#scoped = session.native.lifetime === "operation";
    this.#initiallyDirty = session.dirty;
    if (!this.#scoped || this.#initiallyDirty)
      void this.ready().catch(() => {});
  }

  get dirty(): boolean {
    return this.session.dirty;
  }
  get retired(): boolean {
    return !this.#lease || this.#lease.retired;
  }
  get issue(): NativeEditingIssue | undefined {
    return this.#issue;
  }
  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #publish(issue: NativeEditingIssue | undefined): void {
    this.#issue = issue;
    for (const listener of [...this.#listeners]) {
      try {
        listener();
      } catch (error) {
        console.error("Native editor issue listener failed", error);
      }
    }
  }

  async settle(): Promise<void> {
    while (this.#pending.size) await Promise.allSettled([...this.#pending]);
  }

  #transition(
    phase: NativeEditingPhase,
    run: () => Promise<void>,
  ): Promise<void> {
    this.#epoch++;
    const pending = Object.freeze({
      id: crypto.randomUUID(),
      path: this.path,
      phase,
      status: "pending" as const,
      message: `Native editor ${phase} is pending`,
    });
    this.#publish(pending);
    const transition = (async () => {
      try {
        await run();
        if (this.#issue === pending) this.#publish(undefined);
      } catch (error) {
        if (this.#issue === pending)
          this.#publish(
            Object.freeze({
              ...pending,
              status: "failed" as const,
              message: `Native editor ${phase} requires retry`,
            }),
          );
        throw error;
      }
    })();
    this.#pending.add(transition);
    void transition
      .finally(() => this.#pending.delete(transition))
      .catch(() => {});
    return transition;
  }

  #hold(): void {
    this.#initialRelease ??= this.session.native!.hold();
    if (typeof this.#initialRelease !== "function")
      throw new Error("Invalid native editing protection release");
  }

  #intent(): NativeEditingIntentLease {
    return (this.#lease ??= new NativeEditingIntentLease(
      this.port,
      this.path,
      () =>
        this.#scoped && !this.session.dirty
          ? undefined
          : this.session.native!.savedText(),
    ));
  }

  async #releaseInitial(): Promise<void> {
    if (!this.#initialRelease) return;
    await this.#initialRelease();
    this.#initialRelease = undefined;
  }

  async #refreshSaved(): Promise<void> {
    if (this.session.dirty)
      throw new Error(
        `Protected saved-text refresh requires clean state: ${this.path}`,
      );
    const native = this.session.native!;
    const before = native.savedText();
    const current = await this.port.read(this.path);
    const text = current?.text ?? null;
    if (before === undefined || before === text) return;
    if (!native.refreshSavedText)
      throw new Error(
        `Protected saved-text refresh is unavailable: ${this.path}`,
      );
    await native.refreshSavedText(text);
    if (this.session.dirty || native.savedText() !== text)
      throw new Error(
        `Protected saved-text refresh was not acknowledged: ${this.path}`,
      );
  }

  async ready(): Promise<void> {
    this.#hold();
    const lease = this.#intent();
    if (!this.#admitted || (this.#scoped && (this.#idle || this.#issue))) {
      const phase = this.#admitted ? "rearm" : "admission";
      await this.#transition(phase, () =>
        this.#scoped ? lease.resume() : lease.ready(),
      );
      this.#admitted = true;
      this.#idle = false;
    } else await lease.ready();
    if (this.#initiallyDirty && !this.#initialDirtyReported) {
      this.#initialDirtyReported = true;
      this.changed();
    }
    await this.#releaseInitial();
  }

  changed(): void {
    if (!this.#lease) throw new Error("Native state admission is required");
    const epoch = this.#epoch;
    void this.#lease.changed().catch(() => {
      if (this.#epoch !== epoch) return;
      this.#publish(
        Object.freeze({
          id: crypto.randomUUID(),
          path: this.path,
          phase: "handoff",
          status: "failed",
          message: "Native editor change reporting requires retry",
        }),
      );
    });
  }

  async idle(): Promise<void> {
    if (
      !this.#scoped ||
      !this.#lease ||
      this.session.dirty ||
      (this.#idle && !this.#issue)
    )
      return;
    this.#hold();
    await this.#transition("handoff", () => this.#lease!.yield());
    this.#idle = true;
    await this.#releaseInitial();
  }

  async flush(): Promise<void> {
    if (this.#lease?.retired && !this.session.dirty) return;
    if (this.#scoped && !this.session.dirty) {
      await this.idle();
      return;
    }
    await this.ready();
    await this.session.flush();
    if (this.retiring() && !this.session.dirty)
      await this.#transition("retirement", () => this.#lease!.retire());
    else if (this.#scoped) await this.idle();
    else if (this.#protected && !this.session.dirty)
      await this.#yieldProtected();
  }

  async #yieldProtected(): Promise<void> {
    try {
      await this.#reconcileBeforeYield();
      await this.#transition("handoff", () => this.#lease!.yield());
      this.#handoffFailure = undefined;
    } catch (error) {
      this.#handoffFailure = { error };
      throw error;
    }
  }

  /**
   * A clean interactive producer acknowledges authoritative saved bytes under
   * the guard's held protection (LN-CORE-028), so external drift reconciles
   * exactly like the producer's own file-change projection before the yield
   * comparison. A failed observation defers to the fenced yield check, which
   * retains protection and the observable handoff retry.
   */
  async #reconcileBeforeYield(): Promise<void> {
    if (this.session.dirty || !this.session.native?.refreshSavedText) return;
    try {
      await this.#refreshSaved();
    } catch {
      /* The yield comparison below remains the authoritative fenced failure. */
    }
  }

  async protect(): Promise<() => Promise<void>> {
    // The producer acquires its local lock synchronously before yielding.
    const protection = this.session.protect();
    const release = await protection;
    this.#protected++;
    let held = true,
      cleanupStarted = false;
    return async () => {
      if (!held) return;
      const retry = cleanupStarted;
      cleanupStarted = true;
      if (this.retiring() && !this.session.dirty && this.#lease) {
        await this.#transition("retirement", () => this.#lease!.retire());
        this.#handoffFailure = undefined;
      } else {
        if (this.#handoffFailure) {
          // Initial cleanup cannot turn the failed Yield into a no-op Resume.
          if (!retry) throw this.#handoffFailure.error;
          await this.#yieldProtected();
        }
        if (!this.#scoped || this.session.dirty)
          await this.#transition("rearm", async () => {
            if (this.#lease?.yielded && !this.session.dirty)
              this.#refreshPending = true;
            await this.#intent().resume();
            if (this.#refreshPending) {
              await this.#refreshSaved();
              this.#refreshPending = false;
            }
          });
      }
      await release();
      held = false;
      this.#protected--;
    };
  }
}
