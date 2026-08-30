<script lang="ts">
  import ArrowUpCircle from "@lucide/svelte/icons/arrow-up-circle";
  import Check from "@lucide/svelte/icons/check";
  import Download from "@lucide/svelte/icons/download";
  import Power from "@lucide/svelte/icons/power";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import Upload from "@lucide/svelte/icons/upload";
  import {
    DEFAULT_OFFICIAL_PLUGIN_REGISTRY_SOURCE,
    fetchVerifiedPluginMarkdown,
    isAbortError,
    Notice,
    pluginDownloadCounts,
    PluginDistributionError,
    withPluginInstallProgress,
    type InstalledPluginRecord,
    type PluginCatalogDetail,
    type PluginCatalogEntry,
    type PluginDownloadStatsSummary,
    type PluginUpdateInfo,
  } from "@lapis-notes/api";
  import * as AlertDialog from "@lapismd/design-core/shadcn/alert-dialog";
  import * as Button from "@lapismd/design-core/shadcn/button";
  import * as Field from "@lapismd/design-core/shadcn/field";
  import * as Switch from "@lapismd/design-core/shadcn/switch";
  import * as Tabs from "@lapismd/design-core/shadcn/tabs";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import type { WorkspaceSettingsPageProps } from "@lapismd/design-core/workspace/settings";
  import { onMount, tick, untrack } from "svelte";
  import { getPluginManagementContext } from "./plugin-management-context.svelte";
  import "./plugin-management.css";
  import PluginRegistryContentState from "./PluginRegistryContentState.svelte";
  import type { PluginRegistryBadgeTone } from "./PluginRegistryBadge.svelte";
  import PluginRegistryDetailDialog, {
    type PluginMarkdownState,
  } from "./PluginRegistryDetailDialog.svelte";
  import PluginRegistryRow, {
    type RegistryRowBadge,
  } from "./PluginRegistryRow.svelte";
  import PluginRegistryToolbar from "./PluginRegistryToolbar.svelte";
  import {
    fetchPluginReadmeMarkdown,
    resolveReadmeRelativeUrls,
  } from "./plugin-readme";
  import { formatApproximateDownloadCount } from "./plugin-download-stats";

  type PluginsRegistryTabId = "installed" | "browse" | "updates" | "sources";

  let { controller }: WorkspaceSettingsPageProps = $props();
  const context = untrack(() => getPluginManagementContext(controller));
  const app = context.app;

  let activeTab = $state<PluginsRegistryTabId>("installed");
  let catalogEntries = $state<PluginCatalogEntry[]>([]);
  let installed = $state<InstalledPluginRecord[]>([]);
  let updates = $state<PluginUpdateInfo[]>([]);
  let downloadStats = $state<PluginDownloadStatsSummary | null>(null);
  let lastError = $state<Error | null>(null);
  let initialLoading = $state(true);
  let refreshing = $state(false);
  let runningAction = $state<string | null>(null);
  let detailDialogOpen = $state(false);
  let uninstallConfirmOpen = $state(false);
  let uninstallTarget = $state<InstalledPluginRecord | null>(null);
  let uninstallDisableInstead = $state(false);
  let detailPluginId = $state<string | null>(null);
  let detailPluginDetail = $state<PluginCatalogDetail | null>(null);
  let detailLoading = $state(false);
  let pluginLifecycleRevision = $state(0);
  let overviewState = $state<PluginMarkdownState>({ status: "idle" });
  let changelogState = $state<PluginMarkdownState>({ status: "idle" });
  let bundleFileInput = $state<HTMLInputElement | null>(null);

  let installedSearch = $state("");
  let installedStatus = $state("all");
  let installedProvenance = $state("all");
  let installedSort = $state("name");
  let browseSearch = $state("");
  let browsePlatform = $state("all");
  let browseChannel = $state("all");
  let browseCategory = $state("all");
  let browseInstallState = $state("all");
  let browseCompatibleOnly = $state(false);
  let browseSort = $state("name");
  let updatesSearch = $state("");
  let updatesStatus = $state("all");
  let updatesSort = $state("status");

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
  let categories = $derived(
    [...new Set(catalogEntries.flatMap((entry) => entry.categories))].sort(),
  );
  let compatiblePluginIds = $derived(
    new Set(
      app.pluginDistribution
        .search({ compatibleOnly: true })
        .map((entry) => entry.id),
    ),
  );
  let filteredCatalogEntries = $derived.by(() => {
    const text = browseSearch.trim().toLowerCase();
    return catalogEntries
      .filter((entry) => {
        if (
          text &&
          !`${entry.name} ${entry.id} ${entry.description} ${entry.author}`
            .toLowerCase()
            .includes(text)
        ) {
          return false;
        }
        if (
          browsePlatform !== "all" &&
          !entry.platforms.includes(
            browsePlatform as PluginCatalogEntry["platforms"][number],
          )
        ) {
          return false;
        }
        if (browseChannel !== "all" && entry.channel !== browseChannel) {
          return false;
        }
        if (
          browseCategory !== "all" &&
          !entry.categories.includes(browseCategory)
        ) {
          return false;
        }
        if (
          browseInstallState === "installed" &&
          !availablePluginIds.has(entry.id)
        ) {
          return false;
        }
        if (
          browseInstallState === "available" &&
          availablePluginIds.has(entry.id)
        ) {
          return false;
        }
        if (browseCompatibleOnly && !compatiblePluginIds.has(entry.id)) {
          return false;
        }
        return true;
      })
      .sort((left, right) =>
        browseSort === "downloads"
          ? downloadCount(right.id) - downloadCount(left.id) ||
            left.name.localeCompare(right.name)
          : browseSort === "recent"
            ? (right.latestRelease?.releasedAt ?? "").localeCompare(
                left.latestRelease?.releasedAt ?? "",
              ) || left.name.localeCompare(right.name)
            : left.name.localeCompare(right.name),
      );
  });
  let filteredInstalled = $derived.by(() => {
    const text = installedSearch.trim().toLowerCase();
    return installed
      .filter((record) => {
        const entry = catalogEntry(record.pluginId);
        const runtime = app.plugins.plugins.get(record.pluginId);
        const name = entry?.name ?? runtime?.manifest.name ?? record.pluginId;
        const description = entry?.description ?? runtime?.manifest.description ?? "";
        if (
          text &&
          !`${name} ${record.pluginId} ${description}`.toLowerCase().includes(text)
        ) {
          return false;
        }
        if (
          installedProvenance !== "all" &&
          record.provenance !== installedProvenance
        ) {
          return false;
        }
        if (installedStatus === "enabled" && !runtime?.enabled) return false;
        if (installedStatus === "disabled" && runtime?.enabled) return false;
        if (installedStatus === "revoked" && !record.revoked) return false;
        if (installedStatus === "restart" && !record.restartRequired) return false;
        return true;
      })
      .sort((left, right) =>
        installedSort === "recent"
          ? right.updatedAt.localeCompare(left.updatedAt)
          : installedName(left).localeCompare(installedName(right)),
      );
  });
  let filteredCommunityPlugins = $derived.by(() => {
    const text = installedSearch.trim().toLowerCase();
    if (installedProvenance !== "all" && installedProvenance !== "manual") {
      return [];
    }
    return communityPlugins.filter((plugin) => {
      if (
        text &&
        !`${plugin.manifest.name} ${plugin.manifest.id} ${plugin.manifest.description}`
          .toLowerCase()
          .includes(text)
      ) {
        return false;
      }
      if (installedStatus === "enabled" && !plugin.enabled) return false;
      if (installedStatus === "disabled" && plugin.enabled) return false;
      if (installedStatus === "revoked" || installedStatus === "restart") {
        return false;
      }
      return true;
    });
  });
  let filteredUpdates = $derived.by(() => {
    const text = updatesSearch.trim().toLowerCase();
    const priority = (update: PluginUpdateInfo) =>
      update.canUpdate ? 0 : update.status === "revoked" ? 2 : 1;
    return updates
      .filter((update) => {
        if (
          text &&
          !`${update.name} ${update.id}`.toLowerCase().includes(text)
        ) {
          return false;
        }
        if (updatesStatus === "ready" && !update.canUpdate) return false;
        if (
          updatesStatus === "incompatible" &&
          (update.canUpdate || update.status === "revoked")
        ) {
          return false;
        }
        if (updatesStatus === "revoked" && update.status !== "revoked") {
          return false;
        }
        return true;
      })
      .sort((left, right) =>
        updatesSort === "name"
          ? left.name.localeCompare(right.name)
          : priority(left) - priority(right) || left.name.localeCompare(right.name),
      );
  });
  let detailPluginEntry = $derived(
    catalogEntries.find((entry) => entry.id === detailPluginId) ?? null,
  );
  let detailUpdate = $derived(
    updates.find((update) => update.id === detailPluginId) ?? null,
  );
  let browseFilterCount = $derived(
    Number(Boolean(browseSearch.trim())) +
      Number(browsePlatform !== "all") +
      Number(browseChannel !== "all") +
      Number(browseCategory !== "all") +
      Number(browseInstallState !== "all") +
      Number(browseCompatibleOnly) +
      Number(browseSort !== "name"),
  );
  let installedFilterCount = $derived(
    Number(Boolean(installedSearch.trim())) +
      Number(installedStatus !== "all") +
      Number(installedProvenance !== "all") +
      Number(installedSort !== "name"),
  );
  let updatesFilterCount = $derived(
    Number(Boolean(updatesSearch.trim())) +
      Number(updatesStatus !== "all") +
      Number(updatesSort !== "status"),
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
    const disposeEnabled = app.plugins.on("plugin-enabled", () => {
      pluginLifecycleRevision += 1;
    });
    const disposeDisabled = app.plugins.on("plugin-disabled", () => {
      pluginLifecycleRevision += 1;
    });
    return () => {
      app.plugins.offref(disposeEnabled);
      app.plugins.offref(disposeDisabled);
    };
  });

  async function refresh(force: boolean): Promise<void> {
    refreshing = true;
    try {
      lastError = null;
      if (force || !catalogEntries.length) {
        await app.pluginDistribution.refreshCatalog({ force });
      }
      catalogEntries = app.pluginDistribution.search({ channel: "all" });
      downloadStats = await loadDownloadStats(force);
      installed = await app.pluginDistribution.listInstalled();
      updates = await app.pluginDistribution.listUpdates();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      new Notice(`Plugin registry unavailable: ${errorMessage(lastError)}`);
    } finally {
      initialLoading = false;
      refreshing = false;
    }
  }

  async function loadDownloadStats(
    force: boolean,
  ): Promise<PluginDownloadStatsSummary | null> {
    try {
      return (
        (await app.pluginDistribution.getDownloadStats?.({ force })) ?? null
      );
    } catch {
      return null;
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

  async function installEntry(entry: PluginCatalogEntry): Promise<void> {
    await runPluginProgressAction(
      `install:${entry.id}`,
      entry.id,
      `Installing ${entry.name}`,
      (signal) =>
        app.pluginDistribution.install(entry.id, {
          enable: true,
          requireOfficial: entry.channel === "official",
          signal,
        }),
    );
  }

  async function updatePlugin(update: PluginUpdateInfo): Promise<void> {
    await runPluginProgressAction(
      `update:${update.id}`,
      update.id,
      `Updating ${update.name}`,
      (signal) =>
        app.pluginDistribution.update(update.id, update.targetVersion, { signal }),
    );
  }

  async function openDetails(entry: PluginCatalogEntry): Promise<void> {
    detailDialogOpen = true;
    await selectDetail(entry);
  }

  async function selectDetail(entry: PluginCatalogEntry): Promise<void> {
    detailPluginId = entry.id;
    detailPluginDetail = null;
    detailLoading = true;
    overviewState = { status: "loading" };
    changelogState = { status: "loading" };
    try {
      const detail = await app.pluginDistribution.getPluginDetail(entry.id);
      if (detailPluginId !== entry.id) return;
      detailPluginDetail = detail;
      await Promise.all([
        loadDetailContent("overview", entry, detail),
        loadDetailContent("changelog", entry, detail),
      ]);
    } catch (error) {
      if (detailPluginId !== entry.id) return;
      overviewState = {
        status: "error",
        message: errorMessage(
          error instanceof Error ? error : new Error(String(error)),
        ),
      };
      changelogState = { status: "missing" };
    } finally {
      if (detailPluginId === entry.id) detailLoading = false;
    }
  }

  async function loadDetailContent(
    kind: "overview" | "changelog",
    entry: PluginCatalogEntry,
    detail: PluginCatalogDetail | null,
  ): Promise<void> {
    const reference = detail?.content?.[kind];
    const setState = (state: PluginMarkdownState) => {
      if (detailPluginId !== entry.id) return;
      if (kind === "overview") overviewState = state;
      else changelogState = state;
    };
    if (reference) {
      try {
        const markdown = await fetchVerifiedPluginMarkdown(reference);
        setState({
          status: "loaded",
          url: reference.url,
          sourceUrl: reference.sourceUrl,
          markdown: resolveReadmeRelativeUrls(markdown, reference.url),
        });
      } catch (error) {
        setState({
          status: "error",
          message: errorMessage(
            error instanceof Error ? error : new Error(String(error)),
          ),
          sourceUrl: reference.sourceUrl,
        });
      }
      return;
    }
    if (kind === "changelog") {
      setState({ status: "missing" });
      return;
    }
    const readmeUrl = detail?.readmeUrl ?? entry.readmeUrl;
    if (!readmeUrl) {
      setState({ status: "missing" });
      return;
    }
    try {
      const markdown = await fetchPluginReadmeMarkdown(readmeUrl, {
        pluginId: entry.id,
        detailUrl: entry.detail,
      });
      setState({
        status: "loaded",
        url: readmeUrl,
        sourceUrl: readmeUrl,
        markdown,
      });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : String(error),
        sourceUrl: readmeUrl,
      });
    }
  }

  async function retryDetailContent(kind: "overview" | "changelog") {
    if (!detailPluginEntry) return;
    if (kind === "overview") overviewState = { status: "loading" };
    else changelogState = { status: "loading" };
    await loadDetailContent(kind, detailPluginEntry, detailPluginDetail);
  }

  function requestUninstall(record: InstalledPluginRecord): void {
    uninstallDisableInstead = false;
    uninstallTarget = record;
    uninstallConfirmOpen = true;
  }

  function requestUninstallById(pluginId: string): void {
    const record = installed.find((candidate) => candidate.pluginId === pluginId);
    if (record) requestUninstall(record);
  }

  function closeUninstallDialog(): void {
    uninstallConfirmOpen = false;
    uninstallDisableInstead = false;
    uninstallTarget = null;
  }

  async function confirmPluginRemovalChoice(): Promise<void> {
    const record = uninstallTarget;
    if (!record) return;
    const disableInstead = uninstallDisableInstead;
    closeUninstallDialog();
    await runAction(
      `${disableInstead ? "toggle" : "uninstall"}:${record.pluginId}`,
      () =>
        disableInstead
          ? app.plugins.disablePlugin(record.pluginId)
          : app.pluginDistribution.uninstall(record.pluginId),
    );
  }

  function errorMessage(error: Error): string {
    return error instanceof PluginDistributionError
      ? `${error.code}: ${error.message}`
      : error.message;
  }

  function titleCase(value: string): string {
    return value
      .split(/[\s-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function provenanceBadgeTone(value: string): PluginRegistryBadgeTone {
    if (value === "official" || value === "community") return value;
    return "neutral";
  }

  function catalogEntry(pluginId: string): PluginCatalogEntry | undefined {
    return catalogEntries.find((entry) => entry.id === pluginId);
  }

  function installedName(record: InstalledPluginRecord): string {
    return (
      catalogEntry(record.pluginId)?.name ??
      app.plugins.plugins.get(record.pluginId)?.manifest.name ??
      record.pluginId
    );
  }

  function installedDescription(record: InstalledPluginRecord): string {
    return (
      catalogEntry(record.pluginId)?.description ??
      app.plugins.plugins.get(record.pluginId)?.manifest.description ??
      `Installed plugin ${record.pluginId}`
    );
  }

  function pluginToggleAction(enabled: boolean, name: string): string {
    return `${enabled ? "Disable" : "Enable"} ${name}`;
  }

  function resolveRuntimePlugin(pluginId: string) {
    void pluginLifecycleRevision;
    return app.plugins.plugins.get(pluginId);
  }

  function pluginDescription(pluginId: string, fallback: string): string {
    return (
      catalogEntry(pluginId)?.description ??
      app.plugins.plugins.get(pluginId)?.manifest.description ??
      fallback
    );
  }

  function registryRowBadges(
    entry: PluginCatalogEntry | undefined,
    provenance: string,
  ): RegistryRowBadge[] {
    return [
      {
        label: titleCase(provenance),
        tone: provenanceBadgeTone(provenance),
      },
      ...(entry?.platforms.map((platform) => ({
        label: titleCase(platform),
        tone: platform === "web" ? ("web" as const) : ("desktop" as const),
      })) ?? []),
      ...(entry?.categories.slice(0, 2).map((category) => ({
        label: titleCase(category),
        tone: "category" as const,
      })) ?? []),
      ...(entry?.status === "revoked"
        ? [{ label: "Revoked", tone: "danger" as const }]
        : []),
    ];
  }

  function installedSize(record: InstalledPluginRecord): number | null {
    return record.files.length
      ? record.files.reduce((total, file) => total + file.size, 0)
      : null;
  }

  function downloadCount(pluginId: string): number {
    return downloadStats ? pluginDownloadCounts(downloadStats, pluginId).recent : 0;
  }

  function downloadLabel(pluginId: string): string | null {
    if (!downloadStats) return null;
    const count = pluginDownloadCounts(downloadStats, pluginId).recent;
    return `~${formatApproximateDownloadCount(count)} downloads (30d)`;
  }

  function formatDate(value?: string): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  function formatByteSize(bytes?: number | null): string | null {
    if (typeof bytes !== "number") return null;
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

  function updateReason(update: PluginUpdateInfo): string | undefined {
    if (update.status === "revoked") {
      return (
        update.revoked?.message ??
        update.revoked?.reason ??
        "This installed version was revoked by the official registry."
      );
    }
    if (!update.canUpdate) {
      return update.reasons.length
        ? update.reasons.join(", ")
        : "The latest version is not compatible with this runtime.";
    }
    return undefined;
  }

  function resetInstalledFilters(): void {
    installedSearch = "";
    installedStatus = "all";
    installedProvenance = "all";
    installedSort = "name";
  }

  function resetBrowseFilters(): void {
    browseSearch = "";
    browsePlatform = "all";
    browseChannel = "all";
    browseCategory = "all";
    browseInstallState = "all";
    browseCompatibleOnly = false;
    browseSort = "name";
  }

  function resetUpdateFilters(): void {
    updatesSearch = "";
    updatesStatus = "all";
    updatesSort = "status";
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
      ><Upload />Install from .lapis-plugin</Button.Root>
      <Button.Root
        class="lapis-plugin-registry__refresh"
        variant="outline"
        size="sm"
        disabled={refreshing}
        aria-busy={refreshing}
        aria-label={refreshing ? "Refreshing plugin registry" : "Refresh plugin registry"}
        onclick={() => void refresh(true)}
      >
        <RefreshCw data-spinning={refreshing || undefined} />
        <span>Refresh</span>
      </Button.Root>
    </div>
  </header>

  <Tabs.Root bind:value={activeTab} class="lapis-plugin-registry__tabs">
    <Tabs.List class="lapis-plugin-registry__tab-list">
      <Tabs.Trigger class="lapis-plugin-registry__tab" value="installed">Installed</Tabs.Trigger>
      <Tabs.Trigger class="lapis-plugin-registry__tab" value="browse">Browse</Tabs.Trigger>
      <Tabs.Trigger class="lapis-plugin-registry__tab" value="updates">Updates</Tabs.Trigger>
      <Tabs.Trigger class="lapis-plugin-registry__tab" value="sources">Sources</Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="installed" class="lapis-plugin-registry__content">
      <PluginRegistryToolbar
        tab="installed"
        bind:search={installedSearch}
        bind:enabledState={installedStatus}
        bind:provenance={installedProvenance}
        bind:sort={installedSort}
        filterCount={installedFilterCount}
        resultCount={filteredInstalled.length + filteredCommunityPlugins.length}
        onreset={resetInstalledFilters}
      />
      {#if initialLoading}
        <PluginRegistryContentState kind="loading" heading="Loading installed plugins" description="Reading installed plugin state and registry provenance…" />
      {:else if lastError && !installed.length && !communityPlugins.length}
        <PluginRegistryContentState kind="error" heading="Installed plugins unavailable" description={errorMessage(lastError)} actionLabel="Retry" onaction={() => void refresh(true)} />
      {:else if !installed.length && !communityPlugins.length}
        <PluginRegistryContentState part="registry-installed-empty-state" kind="empty" heading="No plugins installed" description="No installed registry or community plugins." actionLabel="Browse plugins" onaction={() => (activeTab = "browse")} />
      {:else if !filteredInstalled.length && !filteredCommunityPlugins.length}
        <PluginRegistryContentState kind="filtered" heading="No installed plugins match" description="Try changing the search or installed-plugin filters." actionLabel="Reset filters" onaction={resetInstalledFilters} />
      {:else}
        <div class="lapis-plugin-registry__rows">
          {#each filteredInstalled as record (record.pluginId)}
            {@const runtimePlugin = resolveRuntimePlugin(record.pluginId)}
            {@const entry = catalogEntry(record.pluginId)}
            {@const size = installedSize(record)}
            {@const update = updates.find((candidate) => candidate.id === record.pluginId)}
            {@const toggleAction = pluginToggleAction(Boolean(runtimePlugin?.enabled), installedName(record))}
            <PluginRegistryRow
              id={record.pluginId}
              name={installedName(record)}
              description={installedDescription(record)}
              version={record.installedVersion}
              appearance={entry?.appearance}
              fallbackIcon={entry?.categories[0]}
              metadata={[
                ...(size === null ? [] : [`Size ${formatByteSize(size)}`]),
                `Updated ${formatDate(record.updatedAt) ?? record.updatedAt}`,
                ...(entry && downloadLabel(entry.id)
                  ? [downloadLabel(entry.id)!]
                  : []),
              ]}
              badges={[
                ...registryRowBadges(entry, record.provenance),
                ...(record.restartRequired ? [{ label: "Restart required" }] : []),
              ]}
              status={record.revoked
                ? {
                    label: "Revoked",
                    reason: record.revoked.message ?? record.revoked.reason,
                    tone: "danger",
                  }
                : update?.canUpdate
                  ? { label: "Update available", tone: "warning" }
                  : undefined}
            >
              {#snippet actions()}
                {#if update?.canUpdate}
                  <Tooltip.Provider>
                    <Tooltip.Root>
                      <Tooltip.Trigger>
                        {#snippet child({ props })}
                          <Button.Root
                            {...props}
                            size="icon"
                            variant="outline"
                            aria-label={`Update ${installedName(record)}`}
                            disabled={runningAction === `update:${record.pluginId}`}
                            onclick={() => void updatePlugin(update)}
                          ><ArrowUpCircle /></Button.Root>
                        {/snippet}
                      </Tooltip.Trigger>
                      <Tooltip.Content>Update {installedName(record)}</Tooltip.Content>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                {/if}
                {#key toggleAction}
                  <Tooltip.Provider>
                    <Tooltip.Root>
                      <Tooltip.Trigger>
                        {#snippet child({ props })}
                          <Switch.Root
                            {...props}
                            checked={Boolean(runtimePlugin?.enabled)}
                            disabled={!runtimePlugin || runningAction === `toggle:${record.pluginId}`}
                            aria-label={toggleAction}
                            data-tooltip-action={toggleAction}
                            onCheckedChange={(checked) =>
                              void runAction(`toggle:${record.pluginId}`, () =>
                                checked
                                  ? app.plugins.enablePlugin(record.pluginId)
                                  : app.plugins.disablePlugin(record.pluginId),
                              )}
                          />
                        {/snippet}
                      </Tooltip.Trigger>
                      <Tooltip.Content>{toggleAction}</Tooltip.Content>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                {/key}
                <Button.Root size="icon" variant="ghost" aria-label={`Uninstall ${record.pluginId}`} title="Uninstall" disabled={runningAction === `uninstall:${record.pluginId}`} onclick={() => requestUninstall(record)}><Trash2 /></Button.Root>
              {/snippet}
            </PluginRegistryRow>
          {/each}
          {#each filteredCommunityPlugins as plugin (plugin.manifest.id)}
            <PluginRegistryRow
              id={plugin.manifest.id}
              name={plugin.manifest.name}
              description={plugin.manifest.description}
              version={plugin.manifest.version}
              badges={[{ label: "Manual" }]}
            />
          {/each}
        </div>
      {/if}
    </Tabs.Content>

    <Tabs.Content value="browse" class="lapis-plugin-registry__content">
      <PluginRegistryToolbar
        tab="browse"
        bind:search={browseSearch}
        bind:platform={browsePlatform}
        bind:channel={browseChannel}
        bind:category={browseCategory}
        bind:installedState={browseInstallState}
        bind:compatibleOnly={browseCompatibleOnly}
        bind:sort={browseSort}
        {categories}
        filterCount={browseFilterCount}
        resultCount={filteredCatalogEntries.length}
        onreset={resetBrowseFilters}
      />
      {#if initialLoading}
        <PluginRegistryContentState kind="loading" heading="Loading plugin registry" description="Verifying the official catalog and revocation metadata…" />
      {:else if lastError && !catalogEntries.length}
        <PluginRegistryContentState kind="error" heading="Plugin registry unavailable" description={errorMessage(lastError)} actionLabel="Retry" onaction={() => void refresh(true)} />
      {:else if !catalogEntries.length}
        <PluginRegistryContentState kind="empty" heading="No registry entries" description="The configured registry did not return any plugin entries." actionLabel="Refresh" onaction={() => void refresh(true)} />
      {:else if !filteredCatalogEntries.length}
        <PluginRegistryContentState kind="filtered" heading="No plugins match" description="Try changing the search or Browse filters." actionLabel="Reset filters" onaction={resetBrowseFilters} />
      {:else}
        <div class="lapis-plugin-registry__rows">
          {#each filteredCatalogEntries as entry (entry.id)}
            {@const installedRecord = installed.find((record) => record.pluginId === entry.id)}
            {@const isBundled = staticPluginIds.has(entry.id)}
            {@const releaseDate = formatDate(entry.latestRelease?.releasedAt)}
            {@const releaseSize = formatByteSize(entry.latestRelease?.bundleSize)}
            <PluginRegistryRow
              id={entry.id}
              name={entry.name}
              description={entry.description}
              version={entry.latestVersion}
              appearance={entry.appearance}
              fallbackIcon={entry.categories[0]}
              metadata={[
                ...(releaseDate ? [`Released ${releaseDate}`] : []),
                ...(releaseSize ? [`Size ${releaseSize}`] : []),
                ...(downloadLabel(entry.id) ? [downloadLabel(entry.id)!] : []),
              ]}
              badges={registryRowBadges(entry, entry.channel)}
              onopen={() => void openDetails(entry)}
            >
              {#snippet actions()}
                {#if installedRecord}
                  <Button.Root
                    size="sm"
                    variant="outline"
                    aria-label={`Uninstall ${entry.name}`}
                    disabled={runningAction === `uninstall:${entry.id}`}
                    onclick={() => requestUninstall(installedRecord)}
                  ><Trash2 data-icon="inline-start" />Uninstall</Button.Root>
                {:else if isBundled}
                  <Button.Root size="sm" variant="outline" disabled><Check data-icon="inline-start" />Bundled</Button.Root>
                {:else}
                  <Button.Root
                    size="sm"
                    disabled={runningAction === `install:${entry.id}`}
                    onclick={() => void installEntry(entry)}
                  ><Download data-icon="inline-start" />Install</Button.Root>
                {/if}
              {/snippet}
            </PluginRegistryRow>
          {/each}
        </div>
      {/if}
    </Tabs.Content>

    <Tabs.Content value="updates" class="lapis-plugin-registry__content">
      <PluginRegistryToolbar
        tab="updates"
        bind:search={updatesSearch}
        bind:updateState={updatesStatus}
        bind:sort={updatesSort}
        filterCount={updatesFilterCount}
        resultCount={filteredUpdates.length}
        onreset={resetUpdateFilters}
      />
      {#if initialLoading}
        <PluginRegistryContentState kind="loading" heading="Checking for updates" description="Comparing installed plugins with verified registry releases…" />
      {:else if lastError && !updates.length}
        <PluginRegistryContentState kind="error" heading="Updates unavailable" description={errorMessage(lastError)} actionLabel="Retry" onaction={() => void refresh(true)} />
      {:else if !updates.length}
        <PluginRegistryContentState part="registry-updates-empty-state" kind="success" heading="You’re up to date" description="No plugin updates available." actionLabel="Check for updates" onaction={() => void refresh(true)} />
      {:else if !filteredUpdates.length}
        <PluginRegistryContentState kind="filtered" heading="No updates match" description="Try changing the search or update-status filter." actionLabel="Reset filters" onaction={resetUpdateFilters} />
      {:else}
        <div class="lapis-plugin-registry__rows">
          {#each filteredUpdates as update (update.id)}
            {@const entry = catalogEntry(update.id)}
            {@const releaseDate = formatDate(entry?.latestRelease?.releasedAt)}
            <PluginRegistryRow
              id={update.id}
              name={update.name}
              description={pluginDescription(
                update.id,
                `Update available for ${update.name}.`,
              )}
              version={`${update.currentVersion} → ${update.targetVersion}`}
              appearance={entry?.appearance}
              fallbackIcon={entry?.categories[0]}
              metadata={[
                ...(releaseDate ? [`Released ${releaseDate}`] : []),
                ...(typeof update.bundleSize === "number" ? [`Size ${formatByteSize(update.bundleSize)}`] : []),
                ...(update.targetVersion !== update.latestVersion ? [`Latest ${update.latestVersion}`] : []),
                ...(entry && downloadLabel(entry.id)
                  ? [downloadLabel(entry.id)!]
                  : []),
              ]}
              badges={registryRowBadges(entry, update.provenance)}
              status={{
                label: update.canUpdate ? "Ready" : update.status === "revoked" ? "Revoked" : "Incompatible",
                reason: updateReason(update),
                tone: update.status === "revoked" ? "danger" : update.canUpdate ? "success" : "warning",
              }}
            >
              {#snippet actions()}
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger>
                      {#snippet child({ props })}
                        <Button.Root
                          {...props}
                          size="icon"
                          variant="outline"
                          aria-label={`Update ${update.name}`}
                          disabled={!update.canUpdate || runningAction === `update:${update.id}`}
                          onclick={() => void updatePlugin(update)}
                        ><ArrowUpCircle /></Button.Root>
                      {/snippet}
                    </Tooltip.Trigger>
                    <Tooltip.Content>Update {update.name}</Tooltip.Content>
                  </Tooltip.Root>
                </Tooltip.Provider>
              {/snippet}
            </PluginRegistryRow>
          {/each}
        </div>
      {/if}
    </Tabs.Content>

    <Tabs.Content value="sources" class="lapis-plugin-registry__content">
      <div class="lapis-plugin-registry__rows">
        <PluginRegistryRow
          id={DEFAULT_OFFICIAL_PLUGIN_REGISTRY_SOURCE.id}
          name={DEFAULT_OFFICIAL_PLUGIN_REGISTRY_SOURCE.name}
          description={DEFAULT_OFFICIAL_PLUGIN_REGISTRY_SOURCE.url}
          metadata={["Built-in source", "Read only"]}
          badges={[
            { label: "Enabled" },
            { label: "Official", tone: "official" },
            { label: "Locked" },
          ]}
          status={lastError
            ? { label: "Source problem", reason: errorMessage(lastError), tone: "warning" }
            : { label: "Available", tone: "success" }}
        >
          {#snippet actions()}
            {#if lastError}
              <Button.Root size="sm" variant="outline" onclick={() => void refresh(true)}><RefreshCw />Retry</Button.Root>
            {/if}
          {/snippet}
        </PluginRegistryRow>
      </div>
    </Tabs.Content>
  </Tabs.Root>

  <PluginRegistryDetailDialog
    app={app}
    bind:open={detailDialogOpen}
    entries={filteredCatalogEntries}
    selectedEntry={detailPluginEntry}
    detail={detailPluginDetail}
    loading={detailLoading}
    overview={overviewState}
    changelog={changelogState}
    {installedIds}
    {staticPluginIds}
    {downloadStats}
    update={detailUpdate}
    {runningAction}
    onselect={selectDetail}
    oninstall={installEntry}
    onupdate={updatePlugin}
    onuninstall={requestUninstallById}
    onretry={retryDetailContent}
  />

  <AlertDialog.Root bind:open={uninstallConfirmOpen}>
    <AlertDialog.Content
      class="lapis-plugin-uninstall-dialog"
      data-action-mode={uninstallDisableInstead ? "disable" : "uninstall"}
    >
      <AlertDialog.Header>
        <AlertDialog.Media class="lapis-plugin-uninstall-dialog__media">
          <Trash2 aria-hidden="true" />
        </AlertDialog.Media>
        <AlertDialog.Title>Uninstall plugin?</AlertDialog.Title>
        <AlertDialog.Description>{uninstallDisableInstead
          ? "The plugin will stay installed in this vault and can be enabled again later."
          : "This removes the installed plugin from this vault. You can reinstall it from the registry later."}</AlertDialog.Description>
      </AlertDialog.Header>
      {#if uninstallTarget}
        {@const entry = catalogEntry(uninstallTarget.pluginId)}
        {@const targetSize = installedSize(uninstallTarget)}
        <div
          class="lapis-plugin-uninstall-dialog__target"
          data-ui-component="plugin-uninstall-target"
        >
          <PluginRegistryRow
            id={uninstallTarget.pluginId}
            name={installedName(uninstallTarget)}
            description={installedDescription(uninstallTarget)}
            version={uninstallTarget.installedVersion}
            appearance={entry?.appearance}
            fallbackIcon={entry?.categories[0]}
            metadata={[
              ...(targetSize === null
                ? []
                : [`Size ${formatByteSize(targetSize)}`]),
            ]}
            badges={registryRowBadges(entry, uninstallTarget.provenance)}
            status={uninstallTarget.revoked
              ? { label: "Revoked", tone: "danger" }
              : undefined}
          />
        </div>
        {#if resolveRuntimePlugin(uninstallTarget.pluginId)?.enabled}
          {@const alternateAction = uninstallDisableInstead
            ? `Choose Uninstall instead for ${installedName(uninstallTarget)}`
            : `Choose Disable instead for ${installedName(uninstallTarget)}`}
          <Field.Field
            orientation="horizontal"
            class="lapis-plugin-uninstall-dialog__alternative"
          >
            <Field.Content>
              <Field.Title>Disable instead</Field.Title>
              <Field.Description>Keep the plugin installed and turn it off.</Field.Description>
            </Field.Content>
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger>
                  {#snippet child({ props })}
                    <Switch.Root
                      {...props}
                      bind:checked={uninstallDisableInstead}
                      aria-label={alternateAction}
                      data-tooltip-action={alternateAction}
                    />
                  {/snippet}
                </Tooltip.Trigger>
                <Tooltip.Content>{alternateAction}</Tooltip.Content>
              </Tooltip.Root>
            </Tooltip.Provider>
          </Field.Field>
        {/if}
      {/if}
      <AlertDialog.Footer>
        <AlertDialog.Cancel onclick={closeUninstallDialog}>Cancel</AlertDialog.Cancel>
        <AlertDialog.Action
          class={uninstallDisableInstead
            ? "lapis-plugin-uninstall-dialog__confirm--disable"
            : "lapis-plugin-uninstall-dialog__confirm--uninstall"}
          variant={uninstallDisableInstead ? "default" : "destructive"}
          data-action-mode={uninstallDisableInstead ? "disable" : "uninstall"}
          aria-label={uninstallTarget
            ? `${uninstallDisableInstead ? "Disable" : "Uninstall"} ${installedName(uninstallTarget)}`
            : `${uninstallDisableInstead ? "Disable" : "Uninstall"} plugin`}
          onclick={() => void confirmPluginRemovalChoice()}
        >{#if uninstallDisableInstead}<Power data-icon="inline-start" aria-hidden="true" />Disable plugin{:else}<Trash2 data-icon="inline-start" aria-hidden="true" />Uninstall plugin{/if}</AlertDialog.Action>
      </AlertDialog.Footer>
    </AlertDialog.Content>
  </AlertDialog.Root>
</section>
