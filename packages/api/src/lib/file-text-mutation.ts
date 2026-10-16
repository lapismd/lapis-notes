import type { App } from "./context.svelte";
import type { FileEditingSession } from "./file-editing-sessions";
import { FileTextPersistence } from "./file-text-persistence";
import type { TFile, DataWriteOptions } from "./storage/fs";

export type FileTextMutationOptions = DataWriteOptions & {
  /**
   * A presentation-owned snapshot; omit to transform the authoritative latest
   * text.
   */
  expectedText?: string | null;
  onSaved?(text: string): void;
  onReset?(text: string, expected: string | null): void;
  validateBaseline?(): boolean;
};

/** A retained one-shot draft; it has no view, timer or independent save path. */
class TextMutation implements FileEditingSession {
  dirty = true;
  readonly #path: string;
  #draft = "";
  #persistence: FileTextPersistence | undefined;

  constructor(
    private readonly app: App,
    private readonly file: TFile,
    private readonly transform: (text: string) => Promise<string>,
    private readonly options: FileTextMutationOptions,
  ) {
    this.#path = file.path;
  }

  async flush(): Promise<void> {
    if (!this.dirty) return;
    if (this.file.path !== this.#path)
      throw new Error("File mutation target changed");
    if (!this.#persistence) {
      try {
        const expected = this.options.expectedText;
        const baseline =
          expected === undefined
            ? await this.app.vault.read(this.file)
            : expected;
        this.#draft = await this.transform(baseline ?? "");
        if (this.file.path !== this.#path)
          throw new Error("File mutation target changed");
        if (this.#draft === baseline) {
          this.dirty = false;
          return;
        }
        this.#persistence = new FileTextPersistence({
          vault: {
            read: (file) => this.app.vault.read(file),
            modifyIfUnchanged: (file, value, expected) =>
              this.app.vault.modifyIfUnchanged(
                file,
                value,
                expected,
                this.options,
              ),
          },
          file: this.file,
          baseline,
          conflicts: this.app.fileEditingSessions.textConflicts,
          local: () => this.#draft,
          protect: () => ({
            release() {},
            saved: () => this.#saved(),
            reset: (text) => {
              this.#draft = text;
              this.dirty = false;
              this.options.onReset?.(text, this.#persistence!.baseline);
            },
          }),
          serialize: (run) => this.app.fileEditingSessions.recover(this, run),
        });
      } catch (error) {
        // There is no computed draft to preserve after a read/parse/callback error.
        this.dirty = false;
        throw error;
      }
    }
    if (this.options.validateBaseline?.() === false)
      await this.#persistence.rejectPersistence();
    try {
      await this.#persistence.persist(this.#draft);
    } catch (error) {
      if (!this.#persistence.hasConflict)
        await this.#persistence.rejectPersistence(error);
      throw error;
    }
    this.#saved();
  }

  #saved(): void {
    this.dirty = false;
    this.options.onSaved?.(this.#draft);
  }

  async protect(): Promise<() => void> {
    // No user edits enter this captured one-shot draft after admission.
    return () => {};
  }
}

export function mutateFileText(
  app: App,
  file: TFile,
  transform: (text: string) => Promise<string>,
  options: FileTextMutationOptions = {},
): Promise<void> {
  const path = file.path;
  return app.fileEditingSessions.mutate(path, () => {
    if (file.path !== path) throw new Error("File mutation target changed");
    return new TextMutation(app, file, transform, options);
  });
}
