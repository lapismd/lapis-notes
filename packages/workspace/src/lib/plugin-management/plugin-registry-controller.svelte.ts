import {
  isAbortError,
  Notice,
  PluginDistributionError,
  withPluginInstallProgress,
  type App,
  type InstalledPluginRecord,
  type PluginCatalogEntry,
  type PluginDownloadStatsSummary,
  type PluginRegistrySourceState,
  type PluginUpdateInfo,
} from "@lapis-notes/api";
import type { PluginRegistryActionFeedback } from "./plugin-registry-detail";

export const registryErrorMessage = (error: unknown) =>
  error instanceof PluginDistributionError
    ? `${error.code}: ${error.message}`
    : error instanceof Error
      ? error.message
      : String(error);
const controllers = new WeakMap<App, PluginRegistryController>();
export function getPluginRegistryController(
  app: App,
): PluginRegistryController {
  let controller = controllers.get(app);
  if (!controller) {
    controller = new PluginRegistryController(app);
    controllers.set(app, controller);
  }
  return controller;
}
/** One shared read model and action flow for the browser and Settings. */
export class PluginRegistryController {
  catalogEntries = $state<PluginCatalogEntry[]>([]);
  installed = $state<InstalledPluginRecord[]>([]);
  updates = $state<PluginUpdateInfo[]>([]);
  downloadStats = $state<PluginDownloadStatsSummary | null>(null);
  registrySources = $state<readonly PluginRegistrySourceState[]>([]);
  lastError = $state<Error | null>(null);
  initialLoading = $state(true);
  refreshing = $state(false);
  runningAction = $state<string | null>(null);
  actionFeedback = $state<PluginRegistryActionFeedback | null>(null);
  pluginLifecycleRevision = $state(0);
  private references = 0;
  private disposers: (() => void)[] = [];
  private generation = 0;
  private refreshTask: Promise<void> | null = null;
  constructor(readonly app: App) {
    this.registrySources = app.pluginDistribution.listSources();
  }
  retain(): () => void {
    if (this.references++ === 0) {
      for (const name of [
        "plugin-enabled",
        "plugin-disabled",
        "plugin-unloaded",
      ] as const) {
        const ref = this.app.plugins.on(name, () => {
          this.pluginLifecycleRevision += 1;
        });
        this.disposers.push(() => this.app.plugins.offref(ref));
      }
    }
    let released = false;
    return () => {
      if (released) return;
      released = true;
      if (--this.references === 0) {
        this.disposers.splice(0).forEach((dispose) => dispose());
        this.generation += 1;
        this.refreshTask = null;
        this.refreshing = false;
      }
    };
  }
  async refresh(force: boolean): Promise<void> {
    if (this.refreshTask) {
      await this.refreshTask;
      if (!force) return;
    }
    const generation = this.generation;
    this.refreshing = true;
    const task = (async () => {
      try {
        this.lastError = null;
        if (force || !this.catalogEntries.length)
          await this.app.pluginDistribution.refreshCatalog({ force });
        const catalogEntries = this.app.pluginDistribution.search({
          channel: "all",
        });
        const [installed, updates, downloadStats] = await Promise.all([
          this.app.pluginDistribution.listInstalled(),
          this.app.pluginDistribution.listUpdates(),
          this.app.pluginDistribution
            .getDownloadStats?.({ force })
            .catch(() => null) ?? null,
        ]);
        if (generation !== this.generation) return;
        this.catalogEntries = catalogEntries;
        this.installed = installed;
        this.updates = updates;
        this.downloadStats = downloadStats;
      } catch (error) {
        if (generation === this.generation)
          this.lastError =
            error instanceof Error ? error : new Error(String(error));
      } finally {
        if (generation === this.generation) {
          this.registrySources = this.app.pluginDistribution.listSources();
          this.initialLoading = false;
          this.refreshing = false;
        }
      }
    })();
    this.refreshTask = task;
    await task;
    if (this.refreshTask === task) this.refreshTask = null;
  }
  async runPluginAction(
    actionId: string,
    pluginId: string,
    title: string,
    action: (signal: AbortSignal) => Promise<unknown>,
  ): Promise<void> {
    if (this.runningAction) return;
    this.runningAction = actionId;
    this.actionFeedback = { pluginId, state: "running", message: title };
    try {
      await withPluginInstallProgress(this.app, { pluginId, title }, action);
      await this.refresh(false);
      this.actionFeedback = {
        pluginId,
        state: "success",
        message: actionId.startsWith("update:")
          ? "Update installed"
          : "Installed",
      };
    } catch (error) {
      if (isAbortError(error)) {
        this.actionFeedback = null;
        await this.refresh(false);
        return;
      }
      this.actionFeedback = {
        pluginId,
        state: "error",
        message: registryErrorMessage(error),
      };
      new Notice(
        `Plugin registry action failed: ${registryErrorMessage(error)}`,
        undefined,
        this.app,
      );
    } finally {
      this.runningAction = null;
    }
  }
  install(entry: PluginCatalogEntry, version?: string) {
    return this.runPluginAction(
      `install:${entry.id}`,
      entry.id,
      `Installing ${entry.name}`,
      (signal) =>
        this.app.pluginDistribution.install(entry.id, {
          version,
          enable: true,
          requireOfficial: entry.channel === "official",
          signal,
        }),
    );
  }
  update(update: PluginUpdateInfo) {
    return this.runPluginAction(
      `update:${update.id}`,
      update.id,
      `Updating ${update.name}`,
      (signal) =>
        this.app.pluginDistribution.update(update.id, update.targetVersion, {
          signal,
        }),
    );
  }
}
