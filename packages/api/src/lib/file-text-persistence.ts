import type { TFile } from "./storage/fs";
import type { Vault } from "./storage/vault.svelte";
import type {
  FileTextConflict,
  FileTextConflictRegistry,
  FileTextResolution,
} from "./file-text-conflicts";

function hasCode(error: unknown, code: string): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === code
  );
}

/** A single recovery operation owns its protected document acknowledgement. */
export type FileTextRecoveryLease = {
  release(): void;
  saved(): void;
  reset(contents: string): void;
};

export type FileTextPersistenceOptions = {
  vault: Pick<Vault, "read" | "modifyIfUnchanged">;
  file: TFile;
  baseline: string;
  conflicts: FileTextConflictRegistry;
  local(): string;
  /** Acquire editing protection synchronously, before asynchronous admission. */
  protect(): FileTextRecoveryLease | Promise<FileTextRecoveryLease>;
  settle?(): Promise<void>;
  serialize(run: () => Promise<void>): Promise<void>;
};

/** A single captured document's baseline and explicit text-conflict recovery. */
export class FileTextPersistence {
  readonly #id = crypto.randomUUID();
  readonly #path: string;
  readonly #error: Error & { code: string };
  #baseline: string | null;
  #conflict: FileTextConflict | undefined;

  constructor(private readonly options: FileTextPersistenceOptions) {
    this.#path = options.file.path;
    this.#baseline = options.baseline;
    this.#error = Object.assign(
      new Error(`File changed on disk: ${this.#path}`),
      { code: "ECONFLICT" },
    );
  }

  get hasConflict(): boolean {
    return !!this.#conflict;
  }

  acceptBaseline(contents: string): void {
    if (!this.#conflict) this.#baseline = contents;
  }

  updateLocal(contents: string): void {
    if (this.#conflict && this.#conflict.local !== contents)
      this.#publish(this.#conflict.external, this.#conflict.readError);
  }

  async persist(contents: string): Promise<void> {
    this.#assertTarget();
    if (this.#conflict) {
      this.updateLocal(this.options.local());
      throw this.#error;
    }
    try {
      await this.options.vault.modifyIfUnchanged(
        this.options.file,
        contents,
        this.#baseline,
      );
      this.#baseline = contents;
    } catch (error) {
      if (hasCode(error, "ECONFLICT")) {
        await this.#captureExternal();
        throw this.#error;
      }
      throw error;
    }
  }

  #assertTarget(): void {
    if (this.options.file.path !== this.#path)
      throw new Error("File text persistence target changed");
  }

  #assertCurrent(conflict: FileTextConflict): void {
    this.#assertTarget();
    if (this.#conflict !== conflict)
      throw new Error("Conflict changed; review the latest versions");
  }

  async #read(): Promise<string | null> {
    this.#assertTarget();
    try {
      return await this.options.vault.read(this.options.file);
    } catch (error) {
      if (hasCode(error, "ENOENT")) return null;
      throw error;
    }
  }

  async #captureExternal(): Promise<void> {
    try {
      this.#publish(await this.#read());
    } catch (error) {
      this.#publish(
        undefined,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  #publish(external: string | null | undefined, readError?: string): void {
    const conflict: FileTextConflict = {
      id: this.#id,
      path: this.#path,
      baseline: this.#baseline,
      local: this.options.local(),
      external,
      ...(readError === undefined ? {} : { readError }),
      resolve: (choice) => this.#recover(conflict, choice),
      refresh: () => this.#recover(conflict),
    };
    this.#conflict = conflict;
    this.options.conflicts.publish(conflict);
  }

  async #recover(
    conflict: FileTextConflict,
    choice?: FileTextResolution,
  ): Promise<void> {
    this.#assertCurrent(conflict);
    if (
      choice !== undefined &&
      choice !== "keep-local" &&
      choice !== "use-external"
    )
      throw new Error("Invalid text conflict resolution");
    const lease = await this.options.protect();
    try {
      await this.options.settle?.();
      await this.options.serialize(async () => {
        this.#assertCurrent(conflict);
        if (choice === undefined) {
          await this.#captureExternal();
          return;
        }
        if (conflict.external === undefined)
          throw new Error(
            "Read the disk version before resolving this conflict",
          );
        if (choice === "keep-local") {
          const contents = this.options.local();
          try {
            await this.options.vault.modifyIfUnchanged(
              this.options.file,
              contents,
              conflict.external,
            );
          } catch (error) {
            if (hasCode(error, "ECONFLICT")) {
              await this.#captureExternal();
              throw this.#error;
            }
            throw error;
          }
          this.#baseline = contents;
          this.#clear();
          lease.saved();
        } else {
          let external: string | null;
          try {
            external = await this.#read();
          } catch (error) {
            await this.#captureExternal();
            throw error;
          }
          if (external !== conflict.external) {
            this.#publish(external);
            throw this.#error;
          }
          this.#baseline = external;
          this.#clear();
          lease.reset(external ?? "");
        }
      });
    } finally {
      lease.release();
    }
  }

  #clear(): void {
    this.#conflict = undefined;
    this.options.conflicts.clear(this.#id);
  }
}
