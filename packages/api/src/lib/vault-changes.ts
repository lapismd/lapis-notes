import type { App } from "./context.svelte";
import {
  DirectoryWatcher,
  TFile,
  type ChangeEvent,
  type WatchErrorEvent,
} from "./storage/fs";
import { projectVaultChange } from "./vault-change-views";

/** One App owns watching, reconciliation and retirement for its live Vault. */
export class VaultChangeService {
  private watcher: DirectoryWatcher | undefined;
  private starting: Promise<void> | undefined;
  private stopping: Promise<void> | undefined;
  private processing: Promise<void> | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private generation = 0;
  private active = false;
  private registered = false;
  private dirty = false;
  private uncertain = false;
  private failures = 0;
  private readonly hints = new Map<string, ChangeEvent>();
  private stopProjection: (() => void) | undefined;
  private readonly projections = new Set<Promise<void>>();
  constructor(private readonly app: App) {}

  start(): Promise<void> {
    if (this.starting) return this.starting;
    if (this.active) return this.settle();
    const run = async () => {
      const retiring = this.stop();
      const requested = this.generation;
      await retiring;
      if (this.generation !== requested) return;
      const generation = ++this.generation;
      this.active = true;
      this.dirty = true;
      const watcher = new DirectoryWatcher(this.app.vault.adapter);
      this.watcher = watcher;
      const projection = this.app.vault.on("all", (event, file, context) => {
        if (!this.live(generation) || !(file instanceof TFile)) return;
        const snapshot = file.copy(),
          details = { ...context };
        const pending = this.app.fileEditingSessions.track(() =>
          this.app.fileEditingSessions.afterMutations(() =>
            projectVaultChange(this.app, event, snapshot, details, () =>
              this.live(generation),
            ),
          ),
        );
        this.projections.add(pending);
        void pending
          .catch((error) => this.report(error))
          .finally(() => this.projections.delete(pending));
      });
      this.stopProjection = () => this.app.vault.offref(projection);
      watcher.on("all", (event) => {
        if (this.live(generation)) this.changed(event, generation);
      });
      const subscription = watcher.watch("/", { recursive: true });
      await subscription.ready;
      if (!this.live(generation)) return;
      this.registered = true;
      await this.drain(generation);
    };
    const pending = run()
      .catch(async (error) => {
        this.active = false;
        this.registered = false;
        ++this.generation;
        this.clearTimer();
        this.stopProjection?.();
        this.stopProjection = undefined;
        try {
          await this.watcher?.close();
        } catch (cleanup) {
          throw new AggregateError(
            [error, cleanup],
            "Vault watch startup and cleanup failed",
          );
        }
        this.watcher = undefined;
        throw error;
      })
      .finally(() => {
        if (this.starting === pending) this.starting = undefined;
      });
    this.starting = pending;
    return pending;
  }

  /**
   * Retire callbacks synchronously, then drain registration, native IO and
   * scans.
   */
  stop(): Promise<void> {
    this.active = false;
    this.registered = false;
    ++this.generation;
    this.clearTimer();
    this.stopProjection?.();
    this.stopProjection = undefined;
    this.hints.clear();
    this.dirty = false;
    this.uncertain = false;
    if (this.stopping) return this.stopping;
    const watcher = this.watcher;
    const pending = Promise.allSettled([
      watcher?.close(),
      this.processing,
      this.starting,
      ...this.projections,
    ])
      .then((results) => {
        const errors = results.flatMap((result) =>
          result.status === "rejected" ? [result.reason] : [],
        );
        if (errors.length)
          throw new AggregateError(errors, "Vault watch cleanup failed");
        if (this.watcher === watcher) this.watcher = undefined;
      })
      .finally(() => {
        if (this.stopping === pending) this.stopping = undefined;
      });
    this.stopping = pending;
    return pending;
  }

  /**
   * Flush pending hints now; explicit calls also retry a previously failed
   * scan.
   */
  async settle(): Promise<void> {
    await this.starting;
    this.clearTimer();
    if (this.active && this.registered) {
      await this.drain(this.generation);
      while (this.projections.size) await Promise.all([...this.projections]);
    }
  }

  private live(generation: number): boolean {
    return this.active && this.generation === generation;
  }
  private clearTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
  }
  private report(error: unknown): void {
    this.app.notifications.notify({
      id: "vault-watch-reconciliation",
      title: "File changes need attention",
      message: error instanceof Error ? error.message : String(error),
      severity: "error",
      source: "vault",
    });
  }
  private schedule(generation: number, delay = 40): void {
    if (!this.registered || this.timer || !this.live(generation)) return;
    this.timer = setTimeout(() => {
      this.timer = undefined;
      void this.drain(generation).catch(() => {});
    }, delay);
  }
  private changed(
    event: ChangeEvent | WatchErrorEvent,
    generation: number,
  ): void {
    this.dirty = true;
    if (event.type === "error") {
      this.uncertain = true;
      this.hints.clear();
      this.report(event.error);
    } else if (!this.uncertain) {
      const previous = event.previousPath
        ? this.hints.get(event.previousPath)
        : this.hints.get(event.path);
      const hint = {
        ...event,
        previousPath: previous?.previousPath ?? event.previousPath,
      };
      if (event.previousPath) this.hints.delete(event.previousPath);
      this.hints.set(event.path, hint);
      const bytes = [...this.hints.values()].reduce(
        (sum, value) =>
          sum +
          new TextEncoder().encode(value.path + (value.previousPath ?? ""))
            .byteLength +
          96,
        0,
      );
      if (
        event.path === "/" ||
        !event.path ||
        this.hints.size > 2048 ||
        bytes > 128 * 1024
      ) {
        this.uncertain = true;
        this.hints.clear();
      }
    }
    this.schedule(generation);
  }

  private drain(generation: number): Promise<void> {
    if (this.processing) return this.processing;
    const run = async () => {
      while (this.live(generation) && this.dirty) {
        const hints = this.uncertain ? [] : [...this.hints.values()];
        this.hints.clear();
        this.dirty = false;
        this.uncertain = false;
        try {
          await this.app.vault.reconcile(hints, () => this.live(generation), {
            external: true,
          });
          while (this.projections.size)
            await Promise.all([...this.projections]);
          this.failures = 0;
        } catch (error) {
          if (this.live(generation)) {
            this.dirty = true;
            this.uncertain = true;
            this.report(error);
            if (++this.failures <= 4)
              this.schedule(generation, 250 * 2 ** (this.failures - 1));
          }
          throw error;
        }
      }
    };
    const pending = run().finally(() => {
      if (this.processing === pending) this.processing = undefined;
    });
    this.processing = pending;
    return pending;
  }
}
