import { SvelteMap } from "svelte/reactivity";
import type {
  FileTextConflict,
  FileTextConflictRegistry,
  FileTextResolution,
} from "@lapis-notes/api";

export class ConflictSelection {
  path = $state("");
  constructor(private readonly results: SvelteMap<string, string>) {}
  get result(): string | undefined {
    return this.results.get(this.path);
  }
  set result(value: string | undefined) {
    if (value === undefined) this.results.delete(this.path);
    else this.results.set(this.path, value);
  }
  #seeds = new WeakMap<FileTextConflict, string>();
  seed(conflict: FileTextConflict): string {
    if (!this.#seeds.has(conflict))
      this.#seeds.set(conflict, this.result ?? conflict.baseline ?? "");
    return this.#seeds.get(conflict)!;
  }
}

/** Presentation state only; every recovery still uses the writer-owned decision. */
export class ConflictReviewState {
  readonly results = new SvelteMap<string, string>();
  entries = $state.raw<readonly FileTextConflict[]>([]);
  busy = $state<string | null>(null);
  error = $state("");

  constructor(
    readonly registry: FileTextConflictRegistry,
    readonly disabled: () => boolean,
  ) {}

  async recover(
    path: string,
    choice?: FileTextResolution,
    merged?: string,
  ): Promise<void> {
    if (this.disabled() || this.busy !== null) return;
    const conflict = this.entries.find((entry) => entry.path === path);
    if (!conflict) return;
    this.busy = path;
    this.error = "";
    try {
      if (merged !== undefined) await conflict.resolveMerged(merged);
      else if (choice === undefined) await conflict.refresh();
      else await conflict.resolve(choice);
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
    } finally {
      this.busy = null;
    }
  }
}
