import type {
  NativeTaskCommand,
  NativeTaskFailure,
  NativeTaskValue,
} from "./native-tasks-protocol";
import { DateTime, Info } from "luxon";
export type * from "./native-tasks-protocol";

/** A bounded transport already admitted to one native vault owner. */
export interface NativeTasks {
  call(command: NativeTaskCommand): Promise<NativeTaskValue>;
}

/** Capture the existing default daily provider's Luxon formatting context. */
export function nativeTaskDailyFormat() {
  return {
    locale: DateTime.fromISO("2000-01-01", {
      zone: "utc",
    }).resolvedLocaleOptions().locale,
    firstDay: Info.getStartOfWeek(),
    minimalDays: Info.getMinimumDaysInFirstWeek(),
  };
}

export class NativeTaskError extends Error {
  readonly code: string | null;
  readonly parts: string[] | null;
  readonly requestId: string | null;
  readonly uncertain: boolean;
  readonly operation: NativeTaskFailure["operation"];
  constructor(failure: NativeTaskFailure) {
    super(failure.message);
    this.name = failure.name;
    this.code = failure.code;
    this.parts = failure.parts;
    this.requestId = failure.request_id;
    this.uncertain = failure.uncertain;
    this.operation = failure.operation;
  }
}

/** Observation lifetime is independent of accepted native work. */
export class NativeTasksSession implements NativeTasks {
  private pending = new Set<Promise<unknown>>();
  private stopped = false;
  private detachPromise?: Promise<void>;
  constructor(
    private readonly transport: NativeTasks,
    private readonly declared: () => boolean = () => true,
  ) {}
  get detached(): boolean {
    return this.stopped;
  }

  call(command: NativeTaskCommand): Promise<NativeTaskValue> {
    if (this.stopped)
      return Promise.reject(new Error("Native Tasks observer detached"));
    const operation = Promise.resolve()
      .then(() => this.transport.call(command))
      .then((value) => {
        if (value.kind === "failure") throw new NativeTaskError(value.failure);
        return value;
      });
    this.pending.add(operation);
    void operation
      .finally(() => this.pending.delete(operation))
      .catch(() => undefined);
    return operation;
  }

  /** Disable is explicit policy, never a consequence of closing a window. */
  async load(): Promise<void> {
    await Promise.all([...this.pending]);
    if (this.stopped) return;
    if (!this.declared()) {
      await this.disable();
      return;
    }
    const value = await this.call({ kind: "status" });
    if (value.kind !== "status") throw new Error("Invalid native Tasks status");
  }

  async disable(): Promise<void> {
    await this.call({ kind: "disable" });
  }

  detach(): Promise<void> {
    this.stopped = true;
    this.detachPromise ??= Promise.allSettled([...this.pending]).then(
      () => undefined,
    );
    return this.detachPromise;
  }
}
