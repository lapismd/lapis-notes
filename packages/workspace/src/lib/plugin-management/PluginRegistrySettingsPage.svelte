<script lang="ts">
  import AlertTriangle from "@lucide/svelte/icons/alert-triangle";
  import ArrowUpCircle from "@lucide/svelte/icons/arrow-up-circle";
  import BookOpen from "@lucide/svelte/icons/book-open";
  import CalendarClock from "@lucide/svelte/icons/calendar-clock";
  import Check from "@lucide/svelte/icons/check";
  import Download from "@lucide/svelte/icons/download";
  import PackageIcon from "@lucide/svelte/icons/package";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import ShieldAlert from "@lucide/svelte/icons/shield-alert";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import Upload from "@lucide/svelte/icons/upload";
  import {
    DEFAULT_OFFICIAL_PLUGIN_REGISTRY_SOURCE,
    isAbortError,
    Notice,
    PluginDistributionError,
    withPluginInstallProgress,
    type InstalledPluginRecord,
    type PluginCatalogDetail,
    type PluginCatalogEntry,
    type PluginUpdateInfo,
  } from "@lapis-notes/api";
  import * as Alert from "@lapismd/design-core/shadcn/alert";
  import * as AlertDialog from "@lapismd/design-core/shadcn/alert-dialog";
  import * as Badge from "@lapismd/design-core/shadcn/badge";
  import * as Button from "@lapismd/design-core/shadcn/button";
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import * as Input from "@lapismd/design-core/shadcn/input";
  import * as Resizable from "@lapismd/design-core/shadcn/resizable";
  import * as Separator from "@lapismd/design-core/shadcn/separator";
  import * as Tabs from "@lapismd/design-core/shadcn/tabs";
  import type { WorkspaceSettingsPageProps } from "@lapismd/design-core/workspace/settings";
  import { onMount, tick, untrack } from "svelte";
  import { getPluginManagementContext } from "./plugin-management-context.svelte";
  import "./plugin-management.css";
  import {
    fetchPluginReadmeMarkdown,
    type PluginReadmeLoadState,
  } from "./plugin-readme";
  import PluginReadmeRenderer from "./PluginReadmeRenderer.svelte";

  type PluginsRegistryTabId = "installed" | "browse" | "updates" | "sources";

  let { controller }: WorkspaceSettingsPageProps = $props();
  const context = untrack(() => getPluginManagementContext(controller));
  const app = context.app;

  let activeTab = $state<PluginsRegistryTabId>("installed");
  let searchText = $state("");
  let catalogEntries = $state<PluginCatalogEntry[]>([]);
  let installed = $state<InstalledPluginRecord[]>([]);
  let updates = $state<PluginUpdateInfo[]>([]);
  let lastError = $state<Error | null>(null);
  let refreshing = $state(false);
  let runningAction = $state<string | null>(null);
  let detailDialogOpen = $state(false);
  let uninstallConfirmOpen = $state(false);
  let uninstallTarget = $state<InstalledPluginRecord | null>(null);
  let detailPluginId = $state<string | null>(null);
  let detailPluginDetail = $state<PluginCatalogDetail | null>(null);
  let detailLoading = $state(false);
  let readmeState = $state<PluginReadmeLoadState>({ status: "idle" });
  let latestReleaseDates = $state<Record<string, string | null>>({});
  let latestReleaseSizes = $state<Record<string, number | null>>({});
  let bundleFileInput = $state<HTMLInputElement | null>(null);

  let installedIds = $derived(new Set(installed.map((record) => record.pluginId)));
  let staticPluginIds = $derived(
    new Set(app.plugins.corePluginEntries.map((entry) => entry.manifest.id)),
  );
  let availablePluginIds = $derived(
    new Set([...installedIds, ...staticPluginIds]),
  );
  let communityPlugins = $derived(
    app.plugins.communityPlugins.filter(
      (plugin) => !installedIds.has(plugin.manifest.id),
    ),
  );
  let filteredCatalogEntries = $derived(
    catalogEntries.filter((entry) => {
      const text = searchText.trim().toLowerCase();
      if (!text) return true;
      return `${entry.name} ${entry.id} ${entry.description} ${entry.author}`
        .toLowerCase()
        .includes(text);
    }),
  );
  let detailPluginEntry = $derived(
    catalogEntries.find((entry) => entry.id === detailPluginId) ?? null,
  );

  $effect(() => {
    const revealRevision = context.reveal.revision;
    if (
      !revealRevision ||
      context.reveal.sectionId !== "plugin-registry" ||
      !context.reveal.entryId.startsWith("registry:")
    ) {
      return;
    }
    const pluginId = context.reveal.entryId.slice("registry:".length);
    activeTab = "browse";
    void tick().then(async () => {
      const entry = catalogEntries.find((candidate) => candidate.id === pluginId);
      if (entry) await openDetails(entry);
    });
  });

  onMount(() => {
    void refresh(false);
  });

  async function refresh(force: boolean): Promise<void> {
    refreshing = true;
    try {
      lastError = null;
      if (force || !catalogEntries.length) {
        await app.pluginDistribution.refreshCatalog({ force });
        if (force) {
          latestReleaseDates = {};
          latestReleaseSizes = {};
        }
      }
      catalogEntries = app.pluginDistribution.search({ channel: "all" });
      installed = await app.pluginDistribution.listInstalled();
      updates = await app.pluginDistribution.listUpdates();
      void loadLatestReleaseDates(catalogEntries);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      new Notice(`Plugin registry unavailable: ${errorMessage(lastError)}`);
    } finally {
      refreshing = false;
    }
  }

  async function runAction(
    actionId: string,
    action: () => Promise<unknown>,
  ): Promise<void> {
    runningAction = actionId;
    try {
      lastError = null;
      await action();
      await refresh(false);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      new Notice(`Plugin registry action failed: ${errorMessage(lastError)}`);
    } finally {
      runningAction = null;
    }
  }

  async function runPluginProgressAction(
    actionId: string,
    pluginId: string,
    title: string,
    action: (signal: AbortSignal) => Promise<unknown>,
  ): Promise<void> {
    runningAction = actionId;
    try {
      lastError = null;
      await withPluginInstallProgress(app, { pluginId, title }, action);
      await refresh(false);
    } catch (error) {
      if (isAbortError(error)) {
        await refresh(false);
        return;
      }
      lastError = error instanceof Error ? error : new Error(String(error));
      new Notice(`Plugin registry action failed: ${errorMessage(lastError)}`);
    } finally {
      runningAction = null;
    }
  }

  async function openDetails(entry: PluginCatalogEntry): Promise<void> {
    detailDialogOpen = true;
    await selectDetail(entry);
  }

  function requestUninstall(record: InstalledPluginRecord): void {
    uninstallTarget = record;
    uninstallConfirmOpen = true;
  }

  async function confirmUninstall(): Promise<void> {
    const record = uninstallTarget;
    if (!record) return;
    uninstallConfirmOpen = false;
    uninstallTarget = null;
    await runAction(`uninstall:${record.pluginId}`, () =>
      app.pluginDistribution.uninstall(record.pluginId),
    );
  }

  async function selectDetail(entry: PluginCatalogEntry): Promise<void> {
    detailPluginId = entry.id;
    detailPluginDetail = null;
    detailLoading = true;
    readmeState = { status: "loading" };
    try {
      const detail = await app.pluginDistribution.getPluginDetail(entry.id);
      if (detailPluginId !== entry.id) return;
      detailPluginDetail = detail;
      latestReleaseDates = {
        ...latestReleaseDates,
        [entry.id]: latestReleaseDate(detail),
      };
      latestReleaseSizes = {
        ...latestReleaseSizes,
        [entry.id]: latestBundleSize(detail),
      };
      const readmeUrl = detail?.readmeUrl ?? entry.readmeUrl;
      if (!readmeUrl) {
        readmeState = { status: "missing" };
        return;
      }
      const markdown = await fetchPluginReadmeMarkdown(readmeUrl, {
        pluginId: entry.id,
        detailUrl: entry.detail,
      });
      if (detailPluginId !== entry.id) return;
      readmeState = { status: "loaded", url: readmeUrl, markdown };
    } catch (error) {
      if (detailPluginId !== entry.id) return;
      readmeState = {
        status: "error",
        message: error instanceof Error ? error.message : String(error),
      };
    } finally {
      if (detailPluginId === entry.id) detailLoading = false;
    }
  }

  function errorMessage(error: Error): string {
    return error instanceof PluginDistributionError
      ? `${error.code}: ${error.message}`
      : error.message;
  }

  function badge(value: string): string {
    return value
      .split(/[\s-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  async function loadLatestReleaseDates(
    entries: PluginCatalogEntry[],
  ): Promise<void> {
    const missing = entries.filter(
      (entry) =>
        !Object.prototype.hasOwnProperty.call(latestReleaseDates, entry.id) ||
        !Object.prototype.hasOwnProperty.call(latestReleaseSizes, entry.id),
    );
    if (!missing.length) return;
    const summaries = await Promise.all(
      missing.map(async (entry) => {
        try {
          const detail = await app.pluginDistribution.getPluginDetail(entry.id);
          return [
            entry.id,
            { releasedAt: latestReleaseDate(detail), size: latestBundleSize(detail) },
          ] as const;
        } catch {
          return [entry.id, { releasedAt: null, size: null }] as const;
        }
      }),
    );
    latestReleaseDates = {
      ...latestReleaseDates,
      ...Object.fromEntries(summaries.map(([id, value]) => [id, value.releasedAt])),
    };
    latestReleaseSizes = {
      ...latestReleaseSizes,
      ...Object.fromEntries(summaries.map(([id, value]) => [id, value.size])),
    };
  }

  function latestReleaseDate(detail: PluginCatalogDetail | null): string | null {
    return detail?.versions[detail.latestVersion]?.releasedAt ?? null;
  }

  function latestBundleSize(detail: PluginCatalogDetail | null): number | null {
    return detail?.versions[detail.latestVersion]?.bundle.size ?? null;
  }

  function installedSize(record: InstalledPluginRecord): number | null {
    const detailSize = latestReleaseSizes[record.pluginId];
    if (typeof detailSize === "number") return detailSize;
    return record.files.length
      ? record.files.reduce((total, file) => total + file.size, 0)
      : null;
  }

  function formatReleaseDate(value: string): string | null {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  function updateDescription(update: PluginUpdateInfo): string {
    return [
      `${update.currentVersion} -> ${update.targetVersion}`,
      typeof update.bundleSize === "number"
        ? `Size ${formatByteSize(update.bundleSize)}`
        : "",
      update.targetVersion !== update.latestVersion
        ? `Latest ${update.latestVersion}`
        : "",
      update.reasons.length ? `Blocked: ${update.reasons.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
  }

  function formatByteSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const units = ["KiB", "MiB", "GiB"];
    let value = bytes / 1024;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    return `${new Intl.NumberFormat(undefined, {
      maximumFractionDigits: value >= 10 ? 0 : 1,
    }).format(value)} ${units[unitIndex]}`;
  }

  function openBundleFilePicker(): void {
    bundleFileInput?.click();
  }

  async function installSelectedBundle(event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (!file.name.endsWith(".lapis-plugin")) {
      new Notice("Select a .lapis-plugin bundle.");
      return;
    }
    await runPluginProgressAction(
      "install-bundle",
      "*",
      `Installing ${file.name}`,
      async (signal) =>
        app.pluginDistribution.installBundle(await file.arrayBuffer(), {
          enable: true,
          signal,
        }),
    );
  }
</script>

<section
  class="lapis-plugin-management lapis-plugin-registry"
  data-ui-component="lapis-plugin-management"
  data-ui-part="plugin-registry"
>
  <header class="lapis-plugin-management__header">
    <div>
      <h1>Plugin registry</h1>
      <p>Browse verified plugins, manage installed provenance, and review updates.</p>
    </div>
    <div class="lapis-plugin-management__actions">
      <input
        bind:this={bundleFileInput}
        class="sr-only"
        type="file"
        accept=".lapis-plugin"
        aria-label="Choose .lapis-plugin file"
        onchange={(event) => void installSelectedBundle(event)}
      />
      <Button.Root
        variant="outline"
        size="sm"
        disabled={runningAction === "install-bundle"}
        onclick={openBundleFilePicker}
      >
        <Upload class="lapis-plugin-management__icon" />
        Install from .lapis-plugin
      </Button.Root>
      <Button.Root
        variant="outline"
        size="sm"
        disabled={refreshing}
        aria-busy={refreshing}
        aria-label={refreshing ? "Refreshing plugin registry" : "Refresh plugin registry"}
        onclick={() => void refresh(true)}
      >
        <RefreshCw
          class="lapis-plugin-management__icon"
          data-spinning={refreshing || undefined}
        />
        Refresh
      </Button.Root>
    </div>
  </header>

  {#if lastError}
    <Alert.Root variant="destructive">
      <AlertTriangle class="lapis-plugin-management__icon" />
      <Alert.Title>Plugin registry unavailable</Alert.Title>
      <Alert.Description>{errorMessage(lastError)}</Alert.Description>
    </Alert.Root>
  {/if}

  <Tabs.Root bind:value={activeTab} class="lapis-plugin-registry__tabs">
    <Tabs.List class="lapis-plugin-registry__tab-list">
      <Tabs.Trigger class="lapis-plugin-registry__tab" value="installed"
        >Installed</Tabs.Trigger
      >
      <Tabs.Trigger class="lapis-plugin-registry__tab" value="browse"
        >Browse</Tabs.Trigger
      >
      <Tabs.Trigger class="lapis-plugin-registry__tab" value="updates"
        >Updates</Tabs.Trigger
      >
      <Tabs.Trigger class="lapis-plugin-registry__tab" value="sources"
        >Sources</Tabs.Trigger
      >
    </Tabs.List>

    <Tabs.Content value="installed" class="lapis-plugin-management__rows">
      {#if !installed.length && !communityPlugins.length}
        <p class="lapis-plugin-management__empty">
          No installed registry or community plugins.
        </p>
      {/if}
      {#each installed as record (record.pluginId)}
        {@const runtimePlugin = app.plugins.plugins.get(record.pluginId)}
        {@const size = installedSize(record)}
        {@const update = updates.find((candidate) => candidate.id === record.pluginId)}
        <article class="lapis-plugin-card" data-plugin-id={record.pluginId}>
          <div class="lapis-plugin-card__content">
            <h2>{record.pluginId}</h2>
            <p>
              Version {record.installedVersion} | {runtimePlugin?.enabled ? "Enabled" : "Disabled"}{typeof size === "number" ? ` | Size ${formatByteSize(size)}` : ""}
            </p>
            <div class="lapis-plugin-card__badges">
              <Badge.Badge variant="outline">{badge(record.provenance)}</Badge.Badge>
              {#if record.revoked}<Badge.Badge variant="destructive">Revoked</Badge.Badge>{/if}
              {#if record.restartRequired}<Badge.Badge variant="outline">Restart required</Badge.Badge>{/if}
            </div>
          </div>
          <div class="lapis-plugin-card__actions">
            {#if update?.canUpdate}
              <Button.Root
                variant="outline"
                size="sm"
                disabled={runningAction === `update:${record.pluginId}`}
                onclick={() =>
                  void runPluginProgressAction(
                    `update:${record.pluginId}`,
                    record.pluginId,
                    `Updating ${update.name}`,
                    (signal) =>
                      app.pluginDistribution.update(
                        update.id,
                        update.targetVersion,
                        { signal },
                      ),
                  )}
              >
                <ArrowUpCircle class="lapis-plugin-management__icon" />Update
              </Button.Root>
            {/if}
            <Button.Root
              variant="outline"
              size="sm"
              disabled={runningAction === `toggle:${record.pluginId}`}
              onclick={() =>
                void runAction(`toggle:${record.pluginId}`, () =>
                  runtimePlugin?.enabled
                    ? app.plugins.disablePlugin(record.pluginId)
                    : app.plugins.enablePlugin(record.pluginId),
                )}
            >{runtimePlugin?.enabled ? "Disable" : "Enable"}</Button.Root>
            <Button.Root
              variant="outline"
              size="icon"
              aria-label={`Uninstall ${record.pluginId}`}
              title="Uninstall"
              disabled={runningAction === `uninstall:${record.pluginId}`}
              onclick={() => requestUninstall(record)}
            ><Trash2 class="lapis-plugin-management__icon" /></Button.Root>
          </div>
        </article>
        {#if record.revoked}
          <Alert.Root variant="destructive">
            <ShieldAlert class="lapis-plugin-management__icon" />
            <Alert.Title>{record.pluginId} was revoked</Alert.Title>
            <Alert.Description>{record.revoked.message ?? record.revoked.reason}</Alert.Description>
          </Alert.Root>
        {/if}
      {/each}
      {#each communityPlugins as plugin (plugin.manifest.id)}
        <article class="lapis-plugin-card">
          <div class="lapis-plugin-card__content">
            <h2>{plugin.manifest.name}</h2>
            <p>ID {plugin.manifest.id} | {plugin.enabled ? "Enabled" : "Disabled"}</p>
            <div class="lapis-plugin-card__badges">
              <Badge.Badge variant="outline">Manual</Badge.Badge>
            </div>
          </div>
        </article>
      {/each}
    </Tabs.Content>

    <Tabs.Content value="browse" class="lapis-plugin-registry__browse">
      <Input.Input bind:value={searchText} placeholder="Search plugins" aria-label="Search plugins" />
      {#if !filteredCatalogEntries.length}
        <p class="lapis-plugin-management__empty">No registry entries loaded.</p>
      {/if}
      <div class="lapis-plugin-registry__grid">
        {#each filteredCatalogEntries as entry (entry.id)}
          {@const isInstalled = availablePluginIds.has(entry.id)}
          {@const updatedAt = latestReleaseDates[entry.id]}
          {@const size = latestReleaseSizes[entry.id]}
          {@const updatedLabel = updatedAt ? formatReleaseDate(updatedAt) : null}
          <article class="lapis-plugin-registry-card">
            <div class="lapis-plugin-registry-card__icon" aria-hidden="true">
              <PackageIcon class="lapis-plugin-management__icon" />
            </div>
            <div class="lapis-plugin-registry-card__content">
              <div class="lapis-plugin-registry-card__title">
                <h2>{entry.name}</h2>
                {#if entry.channel === "official"}<Badge.Badge variant="outline">Official</Badge.Badge>{/if}
              </div>
              <p>{entry.description}</p>
              <div class="lapis-plugin-registry-card__metadata">
                <span>Version {entry.latestVersion}</span>
                {#if typeof size === "number"}<span>Size {formatByteSize(size)}</span>{/if}
                {#if updatedLabel}<span><CalendarClock class="lapis-plugin-management__small-icon" />Updated {updatedLabel}</span>{/if}
              </div>
              <div class="lapis-plugin-card__actions">
                <Button.Root
                  variant="outline"
                  size="sm"
                  disabled={detailLoading && detailPluginId === entry.id}
                  onclick={() => void openDetails(entry)}
                ><BookOpen class="lapis-plugin-management__icon" />Details</Button.Root>
                <Button.Root
                  variant={isInstalled ? "outline" : "default"}
                  size="sm"
                  disabled={isInstalled || runningAction === `install:${entry.id}`}
                  onclick={() =>
                    void runPluginProgressAction(
                      `install:${entry.id}`,
                      entry.id,
                      `Installing ${entry.name}`,
                      (signal) =>
                        app.pluginDistribution.install(entry.id, {
                          enable: true,
                          requireOfficial: entry.channel === "official",
                          signal,
                        }),
                    )}
                >
                  {#if isInstalled}<Check class="lapis-plugin-management__icon" />Installed{:else}<Download class="lapis-plugin-management__icon" />Install{/if}
                </Button.Root>
              </div>
            </div>
          </article>
        {/each}
      </div>
    </Tabs.Content>

    <Tabs.Content value="updates" class="lapis-plugin-management__rows">
      {#if !updates.length}<p class="lapis-plugin-management__empty">No plugin updates available.</p>{/if}
      {#each updates as update (update.id)}
        {#if update.status === "revoked"}
          <Alert.Root variant="destructive">
            <ShieldAlert class="lapis-plugin-management__icon" />
            <Alert.Title>{update.name} was revoked</Alert.Title>
            <Alert.Description>{update.revoked?.message ?? update.revoked?.reason ?? "This installed version was revoked by the official registry."}</Alert.Description>
          </Alert.Root>
        {:else if !update.canUpdate}
          <Alert.Root>
            <AlertTriangle class="lapis-plugin-management__icon" />
            <Alert.Title>{update.name} update is unavailable</Alert.Title>
            <Alert.Description>{update.reasons.length ? update.reasons.join(", ") : "The latest version is not compatible with this runtime."}</Alert.Description>
          </Alert.Root>
        {/if}
        <article class="lapis-plugin-card">
          <div class="lapis-plugin-card__content">
            <h2>{update.name}</h2>
            <p>{updateDescription(update)}</p>
            <div class="lapis-plugin-card__badges">
              <Badge.Badge variant="outline">{badge(update.provenance)}</Badge.Badge>
              <Badge.Badge variant={update.status === "revoked" ? "destructive" : "outline"}>{badge(update.status.replace(/-/g, " "))}</Badge.Badge>
            </div>
          </div>
          <div class="lapis-plugin-card__actions">
            <Button.Root
              variant="outline"
              size="sm"
              disabled={!update.canUpdate || runningAction === `update:${update.id}`}
              onclick={() =>
                void runPluginProgressAction(
                  `update:${update.id}`,
                  update.id,
                  `Updating ${update.name}`,
                  (signal) =>
                    app.pluginDistribution.update(
                      update.id,
                      update.targetVersion,
                      { signal },
                    ),
                )}
            ><ArrowUpCircle class="lapis-plugin-management__icon" />Update</Button.Root>
          </div>
        </article>
      {/each}
    </Tabs.Content>

    <Tabs.Content value="sources" class="lapis-plugin-management__rows">
      <article class="lapis-plugin-card">
        <div class="lapis-plugin-card__content">
          <h2>{DEFAULT_OFFICIAL_PLUGIN_REGISTRY_SOURCE.name}</h2>
          <p>{DEFAULT_OFFICIAL_PLUGIN_REGISTRY_SOURCE.url}</p>
          <div class="lapis-plugin-card__badges">
            <Badge.Badge variant="outline">Official</Badge.Badge>
            <Badge.Badge variant="outline">Locked</Badge.Badge>
          </div>
        </div>
      </article>
      <Separator.Separator />
      <p class="lapis-plugin-management__empty">Additional third-party registry sources are outside Full Registry V1.</p>
    </Tabs.Content>
  </Tabs.Root>

  <Dialog.Root bind:open={detailDialogOpen}>
    <Dialog.Content class="lapis-plugin-detail-dialog">
      <Dialog.Header class="sr-only">
        <Dialog.Title>{detailPluginEntry?.name ?? "Plugin details"}</Dialog.Title>
        <Dialog.Description>Registry plugin details and README content.</Dialog.Description>
      </Dialog.Header>
      <div class="lapis-plugin-detail-dialog__layout">
        <header class="lapis-plugin-detail-dialog__header">
          <div>
            <h2>{detailPluginEntry?.name ?? "Plugin details"}</h2>
            <p>{detailPluginDetail?.description ?? detailPluginEntry?.description ?? "Select a plugin to review its registry details."}</p>
          </div>
          {#if detailPluginEntry}
            {@const isInstalled = availablePluginIds.has(detailPluginEntry.id)}
            <Button.Root
              variant={isInstalled ? "outline" : "default"}
              size="sm"
              disabled={isInstalled || runningAction === `install:${detailPluginEntry.id}`}
              onclick={() =>
                void runPluginProgressAction(
                  `install:${detailPluginEntry.id}`,
                  detailPluginEntry.id,
                  `Installing ${detailPluginEntry.name}`,
                  (signal) =>
                    app.pluginDistribution.install(detailPluginEntry.id, {
                      enable: true,
                      requireOfficial: detailPluginEntry.channel === "official",
                      signal,
                    }),
                )}
            >{isInstalled ? "Installed" : "Install"}</Button.Root>
          {/if}
        </header>
        <Resizable.PaneGroup direction="horizontal" class="lapis-plugin-detail-dialog__panes">
          <Resizable.Pane defaultSize={30} minSize={22} maxSize={42}>
            <aside class="lapis-plugin-detail-dialog__results">
              <header>
                <strong>Browse results</strong>
                <span>{filteredCatalogEntries.length} {filteredCatalogEntries.length === 1 ? "plugin" : "plugins"}</span>
              </header>
              <div class="lapis-plugin-detail-dialog__result-list">
                {#each filteredCatalogEntries as entry (entry.id)}
                  <button
                    type="button"
                    data-active={entry.id === detailPluginId || undefined}
                    onclick={() => void selectDetail(entry)}
                  >
                    <strong>{entry.name}</strong>
                    <span>{entry.description}</span>
                    <small>{entry.latestVersion}</small>
                  </button>
                {/each}
                {#if !filteredCatalogEntries.length}<p>No plugins match the current Browse search.</p>{/if}
              </div>
            </aside>
          </Resizable.Pane>
          <Resizable.Handle />
          <Resizable.Pane defaultSize={70} minSize={45}>
            <div class="lapis-plugin-detail-dialog__detail">
              {#if detailPluginEntry}
                {@const updatedAt = latestReleaseDates[detailPluginEntry.id]}
                {@const size = detailPluginDetail ? latestBundleSize(detailPluginDetail) : latestReleaseSizes[detailPluginEntry.id]}
                {@const updatedLabel = updatedAt ? formatReleaseDate(updatedAt) : null}
                <div class="lapis-plugin-detail-dialog__metadata">
                  <div>
                    <span>Version {detailPluginEntry.latestVersion}</span>
                    {#if typeof size === "number"}<span>Size {formatByteSize(size)}</span>{/if}
                    <span>{detailPluginEntry.platforms.map(badge).join(", ")}</span>
                    {#if updatedLabel}<span>Updated {updatedLabel}</span>{/if}
                  </div>
                  <div class="lapis-plugin-card__badges">
                    <Badge.Badge variant="outline">{badge(detailPluginEntry.channel)}</Badge.Badge>
                    {#if availablePluginIds.has(detailPluginEntry.id)}<Badge.Badge variant="outline">Installed</Badge.Badge>{/if}
                    {#each detailPluginEntry.badges ?? [] as entryBadge}<Badge.Badge variant={entryBadge === "revoked" ? "destructive" : "outline"}>{badge(entryBadge)}</Badge.Badge>{/each}
                    {#each detailPluginEntry.categories as category}<Badge.Badge variant="outline">{badge(category)}</Badge.Badge>{/each}
                  </div>
                </div>
                <div class="lapis-plugin-detail-dialog__readme" data-plugin-readme-url={readmeState.status === "loaded" ? readmeState.url : undefined}>
                  {#if detailLoading && readmeState.status === "loading"}
                    <p>Loading README...</p>
                  {:else if readmeState.status === "loaded"}
                    <PluginReadmeRenderer app={app} markdown={readmeState.markdown} sourcePath={readmeState.url} />
                  {:else if readmeState.status === "error"}
                    <Alert.Root><AlertTriangle class="lapis-plugin-management__icon" /><Alert.Title>README unavailable</Alert.Title><Alert.Description>{readmeState.message}</Alert.Description></Alert.Root>
                  {:else}
                    <p>No README is available for this registry entry.</p>
                  {/if}
                </div>
              {:else}
                <p class="lapis-plugin-management__empty">Select a plugin from the Browse results.</p>
              {/if}
            </div>
          </Resizable.Pane>
        </Resizable.PaneGroup>
      </div>
    </Dialog.Content>
  </Dialog.Root>

  <AlertDialog.Root bind:open={uninstallConfirmOpen}>
    <AlertDialog.Content>
      <AlertDialog.Header>
        <AlertDialog.Title>Uninstall plugin</AlertDialog.Title>
        <AlertDialog.Description>{uninstallTarget ? `Uninstall ${uninstallTarget.pluginId}? This removes the plugin from the vault.` : ""}</AlertDialog.Description>
      </AlertDialog.Header>
      <AlertDialog.Footer>
        <AlertDialog.Cancel onclick={() => (uninstallTarget = null)}>Cancel</AlertDialog.Cancel>
        <AlertDialog.Action onclick={() => void confirmUninstall()}>Uninstall</AlertDialog.Action>
      </AlertDialog.Footer>
    </AlertDialog.Content>
  </AlertDialog.Root>
</section>
