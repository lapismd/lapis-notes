import type { App } from "./context.svelte";
import type { FileEditingSession } from "./file-editing-sessions";
import { FileTextPersistence } from "./file-text-persistence";
import type { TFile } from "./storage/fs";
import { dirname } from "./storage/path";

/**
 * App-owned mutable text state using the same persistence contract as
 * documents.
 */
export class FileTextStateWriter implements FileEditingSession {
  readonly #path: string;
  readonly #persistence: FileTextPersistence;
  readonly #unregister: () => void;
  #contents: string;
  #dirty = false;
  #locks = 0;
  #disposed = false;
  #onSaved: (() => void) | undefined;

  constructor(
    private readonly app: App,
    private readonly file: TFile,
    baseline: string | null,
    reset: (text: string) => void,
  ) {
    this.#path = file.path;
    this.#contents = baseline ?? "";
    this.#persistence = new FileTextPersistence({
      vault: app.vault,
      file,
      baseline,
      conflicts: app.fileEditingSessions.textConflicts,
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
          reset: (text) => {
            reset(text);
            this.#contents = text;
            this.#dirty = false;
            this.#onSaved = undefined;
          },
        };
      },
      serialize: (run) => app.fileEditingSessions.recover(this, run),
    });
    this.#unregister = app.fileEditingSessions.register(file.path, this);
  }

  get dirty(): boolean {
    return this.#dirty;
  }

  acceptBaseline(contents: string | null): boolean {
    if (this.#dirty || this.#locks || this.#disposed) return false;
    this.#persistence.acceptBaseline(contents);
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
    this.assertEditable();
    this.#contents = contents;
    this.#dirty = true;
    this.#persistence.updateLocal(contents);
    return this.app.fileEditingSessions.recover(this, () => this.flush());
  }

  /** Calculate a logical change only after every earlier change is acknowledged. */
  update(
    calculate: () => { contents: string; onSaved(): void } | undefined,
  ): Promise<void> {
    this.assertEditable();
    return this.app.fileEditingSessions.recover(this, async () => {
      await this.flush();
      const change = calculate();
      if (!change) return;
      this.#contents = change.contents;
      this.#dirty = true;
      this.#onSaved = change.onSaved;
      await this.flush();
    });
  }

  async flush(): Promise<void> {
    if (!this.#dirty) return;
    const contents = this.#contents;
    const notify = this.#onSaved;
    try {
      await this.app.vault.mkpath(dirname(this.#path));
      await this.#persistence.persist(contents);
    } catch (error) {
      if (!this.#persistence.hasConflict)
        await this.#persistence.rejectPersistence(error);
      throw error;
    }
    this.#dirty = this.#contents !== contents;
    if (!this.#dirty) this.#onSaved = undefined;
    notify?.();
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
