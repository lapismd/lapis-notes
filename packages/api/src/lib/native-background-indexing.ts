import type { App } from "./context.svelte";
import type { IndexProjectionRegistration } from "./storage/index-projection";
import type {
  ContributionStatus,
  IndexingCommand,
  IndexingStatus,
  IndexingValue,
  SearchIndexingSelection,
} from "./native-indexing-protocol";
export type * from "./native-indexing-protocol";

/** An explicitly supplied, already admitted native vault transport. */
export interface NativeBackgroundIndexing {
  call(command: IndexingCommand): Promise<IndexingValue>;
}

export interface NativeIndexingProgressPresentation {
  title: string;
  source: string;
  readyMessage: string;
}

/** One App-owned observation boundary; native work outlives renderer detach. */
export interface NativeBackgroundIndexingObserver {
  readonly detached: boolean;
  selectSearch(selection: SearchIndexingSelection): Promise<ContributionStatus>;
  disableSearch(): Promise<void>;
  getStatus(): Promise<IndexingStatus | null>;
  refresh(
    rebuild: boolean,
    presentation?: NativeIndexingProgressPresentation,
  ): Promise<IndexingStatus>;
}

/** App-owned observer and declaration adapter; never an indexing writer. */
export class NativeBackgroundIndexingSession
  implements NativeBackgroundIndexingObserver
{
  private isDetached = false;
  private searchDeclared = false;
  private searchVersion = 0;
  private searchControl: Promise<void> = Promise.resolve();
  private readonly pending = new Map<string, Promise<unknown>[]>();
  private readonly contributions = new Map<
    string,
    { owner: string; status: ContributionStatus }
  >();
  private readonly observers = new Set<ReturnType<typeof setInterval>>();

  constructor(
    private readonly app: App,
    private readonly port: NativeBackgroundIndexing,
  ) {}

  get detached(): boolean {
    return this.isDetached;
  }

  async selectSearch(
    selection: SearchIndexingSelection,
  ): Promise<ContributionStatus> {
    if (this.detached) throw new Error("Native indexing observer is detached");
    this.searchVersion += 1;
    this.searchDeclared = true;
    const contribution = await this.register("search", {
      kind: "select_search",
      selection,
    });
    if (!contribution || contribution.projection_id !== "search")
      throw new Error("Native Search selection is unavailable");
    return contribution;
  }

  async disableSearch(): Promise<void> {
    if (this.detached) return;
    // Controls share one order even when selection's response is uncertain.
    const version = ++this.searchVersion;
    await this.callSearch({ kind: "disable_search" });
    if (version !== this.searchVersion) return;
    this.searchDeclared = false;
    this.contributions.delete("search");
    this.pending.delete("search");
  }

  async getStatus(): Promise<IndexingStatus | null> {
    return this.detached
      ? null
      : (await this.port.call({ kind: "status" })).status;
  }

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

  private register(
    owner: string,
    command: IndexingCommand,
  ): Promise<ContributionStatus | null> {
    const request =
      owner === "search" ? this.callSearch(command) : this.port.call(command);
    const operation = request.then(({ contribution }) => {
      if (!contribution || this.detached) return contribution;
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
      return contribution;
    });
    this.pending.set(owner, [...(this.pending.get(owner) ?? []), operation]);
    // Activation/load observes failures; do not create an unhandled rejection
    // while a synchronous plugin declaration is still returning its query handle.
    void operation.catch(() => {});
    return operation;
  }

  private callSearch(command: IndexingCommand): Promise<IndexingValue> {
    const operation = this.searchControl.then(() => {
      if (this.detached)
        throw new Error("Native indexing observer is detached");
      return this.port.call(command);
    });
    this.searchControl = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
  }

  async ready(owner?: string): Promise<void> {
    const operations = owner
      ? (this.pending.get(owner) ?? [])
      : [...this.pending.values()].flat();
    await Promise.all(operations);
  }

  async disable(owner: string): Promise<void> {
    if (this.detached) return;
    if (owner === "search" && this.searchDeclared) await this.disableSearch();
    await this.ready(owner);
    for (const [id, contribution] of this.contributions) {
      if (contribution.owner !== owner) continue;
      if (id === "search") {
        await this.disableSearch();
      } else if (
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
    // Search declares after metadata-loaded. Its owning plugin can already be
    // enabled; a replacement App without that plugin must retire the old owner.
    if (
      !this.searchDeclared &&
      !this.app.plugins.plugins.get("search")?.enabled
    )
      await this.disableSearch();
    await this.ready();
    await this.refresh(false);
  }

  async refresh(
    rebuild: boolean,
    presentation?: NativeIndexingProgressPresentation,
  ): Promise<IndexingStatus> {
    if (this.detached) throw new Error("Native indexing observer is detached");
    return this.app.notifications.withProgress(
      {
        title:
          presentation?.title ??
          (rebuild ? "Rebuilding metadata cache" : "Loading metadata cache"),
        source: presentation?.source ?? "Metadata",
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
            message:
              status.error ??
              (status.active
                ? `Indexing ${status.phase}`
                : status.pending > 0
                  ? "Indexing pending changes"
                  : (presentation?.readyMessage ?? "Metadata index ready")),
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
          return result.status;
        } finally {
          clearInterval(timer);
          this.observers.delete(timer);
        }
      },
    );
  }

  dispose(): void {
    this.isDetached = true;
    for (const timer of this.observers) clearInterval(timer);
    this.observers.clear();
  }
}
