import type { App } from "./context.svelte";
import type { IndexProjectionRegistration } from "./storage/index-projection";
import type {
  ContributionStatus,
  IndexingCommand,
  IndexingStatus,
  IndexingValue,
} from "./native-indexing-protocol";
export type * from "./native-indexing-protocol";

/** An explicitly supplied, already admitted native vault transport. */
export interface NativeBackgroundIndexing {
  call(command: IndexingCommand): Promise<IndexingValue>;
}

/** App-owned observer and declaration adapter; never an indexing writer. */
export class NativeBackgroundIndexingSession {
  private detached = false;
  private readonly pending = new Map<string, Promise<void>[]>();
  private readonly contributions = new Map<
    string,
    { owner: string; status: ContributionStatus }
  >();
  private readonly observers = new Set<ReturnType<typeof setInterval>>();

  constructor(
    private readonly app: App,
    private readonly port: NativeBackgroundIndexing,
  ) {}

  registerProcessor(owner: string, extension: string): void {
    this.register(owner, {
      kind: "register_processor",
      owner_plugin_id: owner,
      extension,
    });
  }

  registerProjection(
    owner: string,
    id: string,
    registration: IndexProjectionRegistration,
  ): void {
    this.register(owner, {
      kind: "register_projection",
      contribution: {
        projection_id: id,
        owner_plugin_id: owner,
        schema_version: registration.version,
        configuration_hash: registration.configurationHash ?? "",
        path_prefix: registration.source?.pathPrefix ?? null,
      },
    });
  }

  private register(owner: string, command: IndexingCommand): void {
    const operation = this.port.call(command).then(({ contribution }) => {
      if (!contribution || this.detached) return;
      this.contributions.set(contribution.projection_id, {
        owner,
        status: contribution,
      });
      if (contribution.placement === "client_dependent") {
        this.app.notifications.notify({
          title: "Indexing unavailable",
          source: owner,
          severity: "warning",
          message: `${contribution.projection_id}: ${contribution.message ?? "Requires a client processor"}`,
        });
      }
    });
    this.pending.set(owner, [...(this.pending.get(owner) ?? []), operation]);
    // Activation/load observes failures; do not create an unhandled rejection
    // while a synchronous plugin declaration is still returning its query handle.
    void operation.catch(() => {});
  }

  async ready(owner?: string): Promise<void> {
    const operations = owner
      ? (this.pending.get(owner) ?? [])
      : [...this.pending.values()].flat();
    await Promise.all(operations);
  }

  async disable(owner: string): Promise<void> {
    if (this.detached) return;
    await this.ready(owner);
    for (const [id, contribution] of this.contributions) {
      if (contribution.owner !== owner) continue;
      if (
        contribution.status.placement === "native" &&
        !id.startsWith("processor:")
      ) {
        await this.port.call({ kind: "disable_projection", projection_id: id });
      }
      this.contributions.delete(id);
    }
    this.pending.delete(owner);
  }

  getContributionStatuses(): ContributionStatus[] {
    return [...this.contributions.values()].map(({ status }) => ({
      ...status,
    }));
  }

  async load(): Promise<void> {
    const selected = await this.port.call({ kind: "select_metadata" });
    if (!selected.status)
      throw new Error("Native metadata owner was not selected");
    await this.ready();
    await this.refresh(false);
  }

  async refresh(rebuild: boolean): Promise<void> {
    await this.app.notifications.withProgress(
      {
        title: rebuild ? "Rebuilding metadata cache" : "Loading metadata cache",
        source: "Metadata",
        location: "status",
        persistOnError: true,
      },
      async (progress) => {
        let observing = false;
        const report = (status: IndexingStatus | null) => {
          if (!status || this.detached) return;
          progress.report({
            current: status.processed,
            total: status.total,
            message: status.active
              ? `Indexing ${status.phase}`
              : "Metadata index ready",
          });
        };
        const observe = async () => {
          if (observing || this.detached) return;
          observing = true;
          try {
            report((await this.port.call({ kind: "status" })).status);
          } catch {
            /* The accepted refresh owns its definitive outcome. */
          } finally {
            observing = false;
          }
        };
        const timer = setInterval(() => void observe(), 100);
        this.observers.add(timer);
        try {
          const result = await this.port.call({ kind: "refresh", rebuild });
          if (!result.status)
            throw new Error("Native metadata owner is unavailable");
          report(result.status);
          if (result.status.error) throw new Error(result.status.error);
        } finally {
          clearInterval(timer);
          this.observers.delete(timer);
        }
      },
    );
  }

  dispose(): void {
    this.detached = true;
    for (const timer of this.observers) clearInterval(timer);
    this.observers.clear();
  }
}
