import { EventDispatcher } from "./events";
import type {
  AppDatabaseNotificationRecord,
  AppDatabaseNotificationSeverity,
} from "./storage/app-database";

export type NotificationSeverity = AppDatabaseNotificationSeverity;
export type NotificationLocation = "status" | "notification" | "silent";
export type NotificationProgressStatus =
  | "running"
  | "cancelling"
  | "completed"
  | "failed"
  | "cancelled";

/**
 * Options for creating a one-shot notification record.
 *
 * @public
 */
export interface NotifyOptions {
  id?: string;
  title?: string;
  message: string;
  severity?: NotificationSeverity;
  source?: string;
  persist?: boolean;
}

/**
 * Options for creating a long-running progress item.
 *
 * @public
 */
export interface NotificationProgressOptions {
  id?: string;
  title: string;
  message?: string;
  source?: string;
  location?: NotificationLocation;
  cancellable?: boolean;
  persistOnComplete?: boolean;
  persistOnError?: boolean;
}

/**
 * Incremental progress update payload passed to a running progress handle.
 *
 * @public
 */
export interface NotificationProgressReport {
  message?: string;
  current?: number;
  total?: number;
  increment?: number;
  indeterminate?: boolean;
}

/**
 * Serializable view of the current progress state.
 *
 * @public
 */
export interface NotificationProgressSnapshot {
  id: string;
  title: string;
  message?: string;
  source?: string;
  location: NotificationLocation;
  status: NotificationProgressStatus;
  cancellable: boolean;
  cancelRequested: boolean;
  current?: number;
  total?: number;
  percent?: number;
  indeterminate: boolean;
  startedAt: number;
  updatedAt: number;
  error?: string;
}

/**
 * Cancellation token exposed to long-running tasks started through the
 * notification progress API.
 *
 * @public
 */
export interface NotificationProgressToken {
  readonly signal: AbortSignal;
  readonly isCancellationRequested: boolean;
  throwIfCancellationRequested(): void;
}

type NotificationEvents = {
  changed: [];
  notify: [record: AppDatabaseNotificationRecord];
};

function createNotificationId(prefix = "notification"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function cloneRecord(
  record: AppDatabaseNotificationRecord,
): AppDatabaseNotificationRecord {
  return { ...record };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

class CancellationError extends Error {
  constructor() {
    super("Operation cancelled");
    this.name = "AbortError";
  }
}

/**
 * Mutable handle returned for a running progress item.
 *
 * @public
 */
export class NotificationProgressHandle implements NotificationProgressToken {
  readonly id: string;
  readonly signal: AbortSignal;
  private controller: AbortController;
  private snapshot: NotificationProgressSnapshot;
  private completed = false;

  constructor(
    private readonly manager: NotificationManager,
    options: NotificationProgressOptions,
  ) {
    this.id = options.id ?? createNotificationId("progress");
    this.controller = new AbortController();
    this.signal = this.controller.signal;
    const now = Date.now();
    this.snapshot = {
      id: this.id,
      title: options.title,
      message: options.message,
      source: options.source,
      location: options.location ?? "status",
      status: "running",
      cancellable: options.cancellable === true,
      cancelRequested: false,
      indeterminate: true,
      startedAt: now,
      updatedAt: now,
    };
  }

  get isCancellationRequested(): boolean {
    return this.signal.aborted;
  }

  get currentSnapshot(): NotificationProgressSnapshot {
    return { ...this.snapshot };
  }

  /**
   * Update the current progress state.
   *
   * @param report - Partial progress information to merge into the live state.
   * @public
   */
  report(report: NotificationProgressReport): void {
    if (this.completed) {
      return;
    }
    const next: NotificationProgressSnapshot = {
      ...this.snapshot,
      updatedAt: Date.now(),
    };
    if (report.message !== undefined) {
      next.message = report.message;
    }
    if (typeof report.increment === "number") {
      const previous = next.percent ?? 0;
      next.percent = Math.max(0, Math.min(100, previous + report.increment));
      next.current = next.percent;
      next.total = 100;
      next.indeterminate = false;
    }
    if (
      typeof report.current === "number" ||
      typeof report.total === "number"
    ) {
      next.current = report.current ?? next.current;
      next.total = report.total ?? next.total;
      if (typeof next.current === "number" && typeof next.total === "number") {
        next.percent =
          next.total > 0
            ? Math.max(0, Math.min(100, (next.current / next.total) * 100))
            : 0;
      }
      next.indeterminate = false;
    }
    if (report.indeterminate === true) {
      delete next.current;
      delete next.total;
      delete next.percent;
      next.indeterminate = true;
    }
    this.snapshot = next;
    this.manager.updateProgress(this.snapshot);
  }

  /**
   * Alias for {@link report}.
   *
   * @param report - Partial progress information to merge into the live state.
   * @public
   */
  update(report: NotificationProgressReport): void {
    this.report(report);
  }

  /**
   * Request cancellation for the running progress item.
   *
   * @public
   */
  cancel(): void {
    if (this.completed || !this.snapshot.cancellable) {
      return;
    }
    this.snapshot = {
      ...this.snapshot,
      status: "cancelling",
      cancelRequested: true,
      updatedAt: Date.now(),
    };
    this.controller.abort();
    this.manager.updateProgress(this.snapshot);
  }

  /**
   * Mark the progress item as completed.
   *
   * @param message - Optional terminal message shown to the user.
   * @public
   */
  complete(message?: string): void {
    this.finish("completed", message);
  }

  /**
   * Mark the progress item as failed.
   *
   * @param error - Failure value to surface in the final progress state.
   * @public
   */
  fail(error: unknown): void {
    this.finish("failed", errorMessage(error), errorMessage(error));
  }

  /**
   * Mark the progress item as cancelled.
   *
   * @param message - Optional terminal message shown after cancellation.
   * @public
   */
  cancelled(message = "Cancelled"): void {
    this.finish("cancelled", message);
  }

  /**
   * Throw an abort error when cancellation has been requested.
   *
   * @public
   */
  throwIfCancellationRequested(): void {
    if (this.signal.aborted) {
      throw new CancellationError();
    }
  }

  private finish(
    status: Exclude<NotificationProgressStatus, "running" | "cancelling">,
    message?: string,
    error?: string,
  ): void {
    if (this.completed) {
      return;
    }
    this.completed = true;
    this.snapshot = {
      ...this.snapshot,
      status,
      message: message ?? this.snapshot.message,
      error,
      updatedAt: Date.now(),
    };
    this.manager.finishProgress(this.snapshot);
  }
}

/**
 * Records user-visible notifications and tracks live progress handles.
 *
 * @public
 */
export class NotificationManager extends EventDispatcher<NotificationEvents> {
  records: AppDatabaseNotificationRecord[] = [];
  activeProgress: NotificationProgressSnapshot[] = [];
  private progressHandles = new Map<string, NotificationProgressHandle>();

  constructor(
    private readonly database: {
      listNotifications(): Promise<AppDatabaseNotificationRecord[]>;
      upsertNotification(record: AppDatabaseNotificationRecord): Promise<void>;
      markNotificationRead(id: string): Promise<void>;
      clearNotification(id: string): Promise<void>;
      clearAllNotifications(): Promise<void>;
    },
  ) {
    super();
  }

  /**
   * Load persisted notification history for the current vault.
   *
   * @public
   */
  async loadPersisted(): Promise<void> {
    this.records = await this.database.listNotifications();
    this.trigger("changed");
  }

  /**
   * Return the current persisted notification history.
   *
   * @public
   */
  list(): AppDatabaseNotificationRecord[] {
    return this.records.map(cloneRecord);
  }

  /**
   * Record a notification and optionally persist it to history.
   *
   * @param options - Notification payload or a shorthand message string.
   * @returns The recorded notification snapshot.
   * @public
   */
  notify(options: NotifyOptions | string): AppDatabaseNotificationRecord {
    const normalized =
      typeof options === "string" ? { message: options } : options;
    const now = Date.now();
    const record: AppDatabaseNotificationRecord = {
      id: normalized.id ?? createNotificationId(),
      title: normalized.title,
      message: normalized.message,
      severity: normalized.severity ?? "info",
      source: normalized.source,
      createdAt: now,
      updatedAt: now,
      read: false,
      cleared: false,
    };
    if (normalized.persist) {
      this.records = [
        record,
        ...this.records.filter((it) => it.id !== record.id),
      ];
      void this.database.upsertNotification(record).catch((error) => {
        console.warn("Failed to persist notification", error);
      });
      this.trigger("changed");
    }
    this.trigger("notify", cloneRecord(record));
    return cloneRecord(record);
  }

  /**
   * Create a mutable progress handle for a long-running task.
   *
   * @param options - Progress metadata shown to the user.
   * @returns The new progress handle.
   * @public
   */
  createProgress(
    options: NotificationProgressOptions,
  ): NotificationProgressHandle {
    const handle = new NotificationProgressHandle(this, options);
    this.progressHandles.set(handle.id, handle);
    this.updateProgress(handle.currentSnapshot);
    return handle;
  }

  /**
   * Run a task with a managed progress handle.
   *
   * @param options - Progress metadata shown to the user.
   * @param task - Task that receives the progress handle and cancellation
   *   token.
   * @returns The task result.
   * @public
   */
  async withProgress<T>(
    options: NotificationProgressOptions,
    task: (
      progress: NotificationProgressHandle,
      token: NotificationProgressToken,
    ) => Promise<T> | T,
  ): Promise<T> {
    const progress = this.createProgress(options);
    try {
      const result = await task(progress, progress);
      progress.complete();
      if (options.persistOnComplete) {
        this.notify({
          title: options.title,
          message: progress.currentSnapshot.message ?? "Completed",
          severity: "info",
          source: options.source,
          persist: true,
        });
      }
      return result;
    } catch (error) {
      if (progress.signal.aborted) {
        progress.cancelled();
      } else {
        progress.fail(error);
        if (options.persistOnError !== false) {
          this.notify({
            title: options.title,
            message: errorMessage(error),
            severity: "error",
            source: options.source,
            persist: true,
          });
        }
      }
      throw error;
    }
  }

  cancel(id: string): void {
    this.progressHandles.get(id)?.cancel();
  }

  async markRead(id: string): Promise<void> {
    this.records = this.records.map((record) =>
      record.id === id
        ? { ...record, read: true, updatedAt: Date.now() }
        : record,
    );
    this.trigger("changed");
    await this.database.markNotificationRead(id);
  }

  async clear(id: string): Promise<void> {
    this.records = this.records.filter((record) => record.id !== id);
    this.trigger("changed");
    await this.database.clearNotification(id);
  }

  async clearAll(): Promise<void> {
    this.records = [];
    this.trigger("changed");
    await this.database.clearAllNotifications();
  }

  updateProgress(snapshot: NotificationProgressSnapshot): void {
    this.activeProgress = [
      snapshot,
      ...this.activeProgress.filter((entry) => entry.id !== snapshot.id),
    ];
    this.trigger("changed");
  }

  finishProgress(snapshot: NotificationProgressSnapshot): void {
    this.progressHandles.delete(snapshot.id);
    this.activeProgress = this.activeProgress.filter(
      (entry) => entry.id !== snapshot.id,
    );
    this.trigger("changed");
  }
}
