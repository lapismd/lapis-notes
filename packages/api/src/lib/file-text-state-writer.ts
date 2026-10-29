import type { App } from "./context.svelte";
import type {
  FileEditingSession,
  FileEditingRegistration,
} from "./file-editing-sessions";
import { FileTextPersistence } from "./file-text-persistence";
import type { TFile } from "./storage/fs";
import { dirname } from "./storage/path";

/**
 * App-owned mutable text state using the same persistence contract as
 * documents.
 */
export class FileTextStateWriter implements FileEditingSession {
  readonly #path: string;
  #persistence: FileTextPersistence | undefined;
  readonly #unregister: FileEditingRegistration;
  #contents: string;
  #dirty = false;
  #locks = 0;
  #disposed = false;
  #onSaved: (() => void) | undefined;

  constructor(
    private readonly app: App,
    private readonly file: TFile,
    baseline: string | null | undefined,
    private readonly reset: (text: string) => void | Promise<void>,
    private readonly options: { recoverOutsideQueue?: boolean } = {},
  ) {
    this.#path = file.path;
    this.#contents = baseline ?? "";
    if (baseline !== undefined)
      this.#persistence = this.#createPersistence(baseline);
    this.#unregister = app.fileEditingSessions.register(file.path, this);
  }

  #createPersistence(baseline: string | null): FileTextPersistence {
    return new FileTextPersistence({
      vault: this.app.vault,
      file: this.file,
      baseline,
      conflicts: this.app.fileEditingSessions.textConflicts,
      local: () => this.#contents,
      protect: () => {
        const release = this.#protect();
        return {
          release,
          saved: () => {
            this.#dirty = false;
            const notify = this.#onSaved;
            this.#onSaved = undefined;
            notify?.();
          },
          reset: (text) => this.reset(text),
          resetSaved: (text) => {
            this.#contents = text;
            this.#dirty = false;
            this.#onSaved = undefined;
          },
        };
      },
      serialize: (run) =>
        this.app.fileEditingSessions.recover(this, async () => {
          const result = await run();
          await this.#unregister.idle();
          return result;
        }),
      recoverOutsideQueue: this.options.recoverOutsideQueue,
    });
  }

  get dirty(): boolean {
    return this.#dirty || !!this.#persistence?.hasConflict;
  }

  readonly native = {
    lifetime: "operation" as const,
    hold: () => this.#protect(),
    savedText: () => this.#persistence?.baseline,
  };

  acceptBaseline(contents: string | null): boolean {
    if (this.dirty || this.#locks || this.#disposed) return false;
    if (this.#persistence) this.#persistence.acceptBaseline(contents);
    else this.#persistence = this.#createPersistence(contents);
    return true;
  }

  assertEditable(): void {
    if (this.#disposed || this.app.fileEditingSessions.closed)
      throw new Error("File state writer is closed");
    if (this.#locks)
      throw new Error(`File editing is protected: ${this.#path}`);
    if (this.file.path !== this.#path)
      throw new Error("File state target changed");
  }

  set(contents: string): Promise<void> {
    return this.#unregister.native
      ? this.app.fileEditingSessions.track(() =>
          this.app.fileEditingSessions.recover(this, async () => {
            await this.#unregister.ready();
            this.#captureContents(contents);
            await this.flush();
          }),
        )
      : this.#setContents(contents);
  }

  #captureContents(contents: string): void {
    this.assertEditable();
    this.#contents = contents;
    this.#dirty = true;
    this.#unregister.changed();
    this.#persistence?.updateLocal(contents);
  }

  #setContents(contents: string): Promise<void> {
    this.#captureContents(contents);
    return this.app.fileEditingSessions.recover(this, () => this.flush());
  }

  /** Calculate a logical change only after every earlier change is acknowledged. */
  update(
    calculate: () => { contents: string; onSaved(): void } | undefined,
  ): Promise<void> {
    if (!this.#unregister.native) this.assertEditable();
    return this.app.fileEditingSessions.recover(this, async () => {
      await this.flush();
      if (this.#unregister.native) {
        await this.#unregister.ready();
        this.assertEditable();
      }
      const change = calculate();
      if (!change) {
        await this.#unregister.idle();
        return;
      }
      this.#contents = change.contents;
      this.#dirty = true;
      this.#unregister.changed();
      this.#onSaved = change.onSaved;
      await this.flush();
    });
  }

  async flush(): Promise<void> {
    if (!this.#dirty) {
      await this.#unregister.idle();
      return;
    }
    if (this.#unregister.native) await this.#unregister.ready();
    const contents = this.#contents;
    const notify = this.#onSaved;
    try {
      if (!this.#persistence) {
        const adapter = this.app.vault.adapter;
        const baseline = (await adapter.exists(this.#path))
          ? await adapter.read(this.#path)
          : null;
        this.#persistence = this.#createPersistence(baseline);
      }
      await this.app.vault.mkpath(dirname(this.#path));
      await this.#persistence.persist(contents);
    } catch (error) {
      if (this.#persistence && !this.#persistence.hasConflict)
        await this.#persistence.rejectPersistence(error);
      throw error;
    }
    this.#dirty = this.#contents !== contents;
    if (!this.#dirty) this.#onSaved = undefined;
    notify?.();
    if (!this.#dirty) await this.#unregister.idle();
  }

  #protect(): () => void {
    this.#locks++;
    let held = true;
    return () => {
      if (held) {
        held = false;
        this.#locks--;
      }
    };
  }

  async protect(): Promise<() => void> {
    // All persistence is on the registry queue; no queued guard is re-entered here.
    return this.#protect();
  }

  dispose(): void {
    if (this.dirty) throw new Error(`File state remains dirty: ${this.#path}`);
    this.#disposed = true;
    this.#unregister();
  }
}
