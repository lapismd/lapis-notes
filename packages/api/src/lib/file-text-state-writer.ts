import type { App } from "./context.svelte";
import type { FileEditingSession } from "./file-editing-sessions";
import { FileTextPersistence } from "./file-text-persistence";
import type { TFile } from "./storage/fs";

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
          },
          reset: (text) => {
            this.#contents = text;
            this.#dirty = false;
            reset(text);
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

  async flush(): Promise<void> {
    if (!this.#dirty) return;
    const contents = this.#contents;
    await this.#persistence.persist(contents);
    this.#dirty = this.#contents !== contents;
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
