import type { FileEditingSession } from "./file-editing-sessions";
import type { NativeEditingIntents } from "./native-editing-intents";
import { NativeEditingIntentLease } from "./native-editing-intent-lease";

/** Producer-owned local protection and last acknowledged destination bytes. */
export interface NativeEditingSession {
  /** Block input synchronously, before native admission's first await. */
  hold(): () => void | Promise<void>;
  savedText(): string | null | undefined;
}

export type FileEditingRegistration = (() => void) & {
  readonly native: boolean;
  /** An explicit retry may reconcile native admission without changing identity. */
  ready(): Promise<void>;
  /** Capture a newer dirty generation; the active intent already fences writers. */
  changed(): void;
};

/** Adds a native fence to an existing writer without replacing its persistence. */
export class NativeRegisteredEditingSession implements FileEditingSession {
  readonly #lease: NativeEditingIntentLease;
  #initialRelease: (() => void | Promise<void>) | undefined;
  #initiallyDirty: boolean;
  #initialDirtyReported = false;
  #protected = 0;

  constructor(
    private readonly session: FileEditingSession,
    port: NativeEditingIntents,
    path: string,
    private readonly retiring: () => boolean,
  ) {
    if (!session.native)
      throw new Error(`Native editing lifecycle is required: ${path}`);
    this.#initialRelease = session.native.hold();
    if (typeof this.#initialRelease !== "function")
      throw new Error("Invalid native editing protection release");
    this.#lease = new NativeEditingIntentLease(port, path, () =>
      session.native!.savedText(),
    );
    this.#initiallyDirty = session.dirty;
    void this.ready().catch(() => {});
  }

  get dirty(): boolean {
    return this.session.dirty;
  }
  get retired(): boolean {
    return this.#lease.retired;
  }

  async ready(): Promise<void> {
    await this.#lease.ready();
    if (this.#initiallyDirty && !this.#initialDirtyReported) {
      this.#initialDirtyReported = true;
      this.changed();
    }
    if (this.#initialRelease) {
      await this.#initialRelease();
      this.#initialRelease = undefined;
    }
  }

  changed(): void {
    this.#lease.changed();
  }

  async flush(): Promise<void> {
    await this.ready();
    await this.session.flush();
    if (this.#protected && !this.session.dirty) await this.#lease.yield();
  }

  async protect(): Promise<() => Promise<void>> {
    // The producer acquires its local lock synchronously before yielding.
    const protection = this.session.protect();
    const release = await protection;
    this.#protected++;
    let held = true;
    return async () => {
      if (!held) return;
      if (this.retiring() && !this.session.dirty) await this.#lease.retire();
      else await this.#lease.resume();
      await release();
      held = false;
      this.#protected--;
    };
  }
}
