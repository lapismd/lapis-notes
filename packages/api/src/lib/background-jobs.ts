import { EventDispatcher } from "./events";
import { jobSnapshotSchema } from "./background-jobs-validation";
import type {
  JobCommand,
  JobSnapshot,
} from "./native-background-jobs-protocol";
import type {
  AppDatabaseIndexedMetadataPage,
  AppDatabaseIndexedMetadataPageQuery,
} from "./storage/app-database";

export type {
  JobCommand as BackgroundJobCommand,
  JobConfiguration as BackgroundJobConfiguration,
  JobDescriptor as BackgroundJobDescriptor,
  JobPermissions as BackgroundJobPermissions,
  JobPhase as BackgroundJobPhase,
  JobRun as BackgroundJobRun,
  JobSnapshot as BackgroundJobSnapshot,
  JobStatus as BackgroundJobStatus,
  JobTransfer as BackgroundJobTransfer,
  Schedule as BackgroundJobSchedule,
  JobNetworkGrant as BackgroundJobNetworkGrant,
  JobCredentialBinding as BackgroundJobCredentialBinding,
  JobCredentialStatus as BackgroundJobCredentialStatus,
} from "./native-background-jobs-protocol";

/** An admitted native vault transport. A renderer observes and controls jobs. */
export interface NativeBackgroundJobs {
  call(command: JobCommand): Promise<JobSnapshot>;
}

/** Available inside a signed, self-contained headless ESM job module. */
export interface BackgroundJobContext {
  readonly pluginId: string;
  readonly jobId: string;
  readonly runId: string;
  readonly occurrence: string;
  readonly scheduledAt: number;
  readonly localDate: string;
  readonly signal: { readonly aborted: boolean };
  readonly state: { load(): unknown; save(value: unknown): void };
  readonly metadata: {
    query(
      query?: AppDatabaseIndexedMetadataPageQuery,
    ): AppDatabaseIndexedMetadataPage;
  };
  readonly notes: {
    frontmatter(path: string): {
      path: string;
      version: string;
      properties: Record<string, unknown>;
    };
    patchFrontmatter(patch: {
      path: string;
      expectedVersion: string;
      set?: Record<string, unknown>;
      remove?: string[];
    }): { path: string; version: string };
  };
  readonly notifications: {
    notify(notification: { id: string; title?: string; message: string }): void;
  };
  /** Native bounded requests, when supported. Binding IDs never expose stored values. */
  readonly network?: {
    request(request: {
      url: string;
      method?: string;
      headers?: Record<string, string>;
      body?: string;
      credential?: string;
    }): { status: number; body: string; headers: Record<string, string> };
  };
}
export type BackgroundJobHandler = (
  context: BackgroundJobContext,
) => void | Promise<void>;

/**
 * Passive App lifetime. Detach drains transport calls and preserves native
 * work.
 */
export class BackgroundJobSession extends EventDispatcher<{
  changed: [JobSnapshot];
}> {
  private isDetached = false;
  private readonly pending = new Set<Promise<unknown>>();
  private snapshotValue: JobSnapshot | undefined;

  constructor(private readonly port: NativeBackgroundJobs) {
    super();
  }

  get detached(): boolean {
    return this.isDetached;
  }
  get snapshot(): JobSnapshot | undefined {
    return this.snapshotValue;
  }

  async call(command: JobCommand): Promise<JobSnapshot> {
    if (this.isDetached) throw new Error("Background job observer is detached");
    const pending = Promise.resolve()
      .then(() => this.port.call(command))
      .then((value) => {
        const parsed = jobSnapshotSchema.safeParse(value);
        if (!parsed.success)
          throw new Error("Invalid native background jobs response");
        if (
          !this.snapshotValue ||
          parsed.data.revision >= this.snapshotValue.revision
        ) {
          this.snapshotValue = parsed.data;
          if (!this.isDetached) this.emit("changed", parsed.data);
        }
        return this.snapshotValue;
      });
    this.pending.add(pending);
    try {
      return await pending;
    } finally {
      this.pending.delete(pending);
    }
  }

  async initialize(policy: {
    trusted: boolean;
    safeMode: boolean;
  }): Promise<void> {
    const snapshot = await this.call({ kind: "list" });
    // Startup can narrow native admission. Reapproval is an explicit owner action.
    if (!policy.trusted || policy.safeMode) {
      await this.call({
        kind: "fence",
        trusted: snapshot.trusted && policy.trusted,
        safeMode: snapshot.safeMode || policy.safeMode,
      });
    }
  }

  async setTrust(trusted: boolean): Promise<void> {
    const snapshot = await this.call({ kind: "list" });
    await this.call({ kind: "fence", trusted, safeMode: snapshot.safeMode });
  }

  async pausePlugin(pluginId: string): Promise<void> {
    const snapshot = await this.call({ kind: "list" });
    for (const job of snapshot.jobs.filter(
      (job) => job.pluginId === pluginId && job.configuration,
    )) {
      await this.call({ kind: "pause", pluginId, jobId: job.descriptor.id });
    }
    const deadline = Date.now() + 35_000;
    while (
      (await this.call({ kind: "list" })).jobs.some(
        (job) => job.pluginId === pluginId && job.phase === "running",
      )
    ) {
      if (Date.now() > deadline)
        throw new Error(
          "Background work is still draining. Its native owner retains the paused job.",
        );
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  async detach(): Promise<void> {
    this.isDetached = true;
    const results = await Promise.allSettled([...this.pending]);
    const failures = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    if (failures.length)
      throw new AggregateError(
        failures.map((result) => result.reason),
        "Background job observation failed while detaching",
      );
  }
}
