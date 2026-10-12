<script lang="ts">
  import { onMount, tick, untrack } from "svelte";
  import {
    pluginDownloadCounts,
    type App,
    type PluginCatalogEntry,
  } from "@lapis-notes/api";
  import { AppShell, AppShellController } from "@lapismd/design-core/shell";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as Tooltip from "@lapismd/design-core/shadcn/tooltip";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import * as Breadcrumb from "@lapismd/design-core/shadcn/breadcrumb";
  import {
    communityDetail,
    type RegistryInstallAction,
  } from "./community-presentation/model-adapter";
  import PluginReadmeRenderer from "./PluginReadmeRenderer.svelte";
  import { getPluginRegistryController } from "./plugin-registry-controller.svelte";
  import { PluginRegistryDetailSession } from "./plugin-registry-detail-session.svelte";
  import { defaultDirectoryState } from "./plugin-browser-model";
  import type {
    PluginBrowserRoute,
    PluginDirectoryState,
  } from "./plugin-browser-model";
  import { formatApproximateDownloadCount } from "./plugin-download-stats";
  import PluginBrowserLanding from "./PluginBrowserLanding.svelte";
  import PluginBrowserDirectory from "./PluginBrowserDirectory.svelte";
  import PluginRegistryContentState from "./PluginRegistryContentState.svelte";
  import PluginBrowserDetail from "./PluginBrowserDetail.svelte";
  import "./community-presentation/community-typography.css";
  export interface PluginBrowserNavigation {
    route: PluginBrowserRoute;
    directory: PluginDirectoryState;
    returnPage: "landing" | "directory";
    scrollTop: number;
  }
  let {
    app,
    navigation,
    onstatechange,
  }: {
    app: App;
    navigation: PluginBrowserNavigation;
    onstatechange?: () => void;
  } = $props();
  const ownedApp = untrack(() => app);
  const registry = getPluginRegistryController(ownedApp);
  const session = new PluginRegistryDetailSession(ownedApp);
  let contentRegion = $state<HTMLDivElement | null>(null);
  const scroller = $derived(
    contentRegion?.querySelector<HTMLElement>(
      '[data-ui-part="scroll-area-viewport"]',
    ),
  );
  $effect(() => {
    const page = navigation.route.page;
    const region = scroller;
    const scrollTop = untrack(() => navigation.scrollTop);
    if (region)
      void tick().then(() => {
        if (navigation.route.page === page)
          region.scrollTop = page === "plugin" ? 0 : scrollTop;
      });
  });
  let previousDetail = "";
  const installedIds = $derived(
    new Set(registry.installed.map((record) => record.pluginId)),
  );
  const bundledIds = $derived(
    new Set(ownedApp.plugins.corePluginEntries.map((p) => p.manifest.id)),
  );
  const updateIds = $derived(
    new Set(
      registry.updates
        .filter((update) => update.canUpdate && !bundledIds.has(update.id))
        .map((update) => update.id),
    ),
  );
  const availableIds = $derived(new Set([...installedIds, ...bundledIds]));
  const selectedId = $derived(
    navigation.route.page === "plugin" ? navigation.route.pluginId : null,
  );
  const selected = $derived(
    registry.catalogEntries.find((p) => p.id === selectedId) ?? null,
  );
  const update = $derived(
    registry.updates.find((p) => p.id === selected?.id) ?? null,
  );
  const shell = untrack(
    () =>
      new AppShellController({
        rightClosed: true,
        sidebarMinWidth: 48,
        sidebarMaxWidth: 440,
      }),
  );
  let selectedVersion = $state<string>();
  const resolved = $derived(
    selected && session.detail
      ? communityDetail(selected, session.detail)
      : null,
  );
  const related = $derived(
    selected
      ? registry.catalogEntries
          .filter(
            (entry) =>
              entry.id !== selected.id &&
              entry.categories.some((category) =>
                selected.categories.includes(category),
              ),
          )
          .slice(0, 3)
      : [],
  );
  const installAction = $derived.by<RegistryInstallAction>(() => {
    if (!selected) return { state: "disabled" };
    const feedback =
      registry.actionFeedback?.pluginId === selected.id
        ? registry.actionFeedback
        : null;
    if (
      registry.runningAction === `install:${selected.id}` ||
      registry.runningAction === `update:${selected.id}`
    )
      return { state: "installing" };
    if (feedback?.state === "error")
      return { state: "rejected", reason: feedback.message };
    if (bundledIds.has(selected.id))
      return { state: "installed", label: "Bundled" };
    if (update?.canUpdate) return { state: "available", label: "Update" };
    if (installedIds.has(selected.id)) return { state: "installed" };
    const disabled = reason(selected);
    return disabled
      ? { state: "disabled", reason: disabled }
      : { state: "available" };
  });
  const downloads = (id: string) =>
    registry.downloadStats?.periods["30d"].plugins[id]?.total ?? 0;
  function reason(entry: PluginCatalogEntry): string | undefined {
    if (entry.status && entry.status !== "active")
      return `This plugin is ${entry.status}.`;
    if (
      !ownedApp.pluginDistribution
        .search({ compatibleOnly: true })
        .some((p) => p.id === entry.id)
    )
      return "This plugin is incompatible with this app.";
    if (
      !registry.registrySources.some(
        (source) => source.source.enabled && source.installReady,
      )
    )
      return "No enabled registry is ready to install plugins.";
    const bundle =
      session.entryId === entry.id
        ? session.detail?.versions[entry.latestVersion]?.bundle
        : undefined;
    if (bundle && "pending" in bundle && bundle.pending === true)
      return "The verified bundle is not ready.";
    return undefined;
  }
  onMount(() => {
    const release = registry.retain();
    void registry.refresh(false);
    return () => {
      session.dispose();
      release();
    };
  });
  $effect(() => {
    if (selected && previousDetail !== selected.id) {
      previousDetail = selected.id;
      selectedVersion = undefined;
      void session.select(selected);
    }
    if (navigation.route.page !== "plugin") {
      previousDetail = "";
      session.dispose();
      if (navigation.route.page === "landing" && scroller)
        scroller.scrollTop = 0;
    }
  });
  function persist() {
    onstatechange?.();
  }
  function go(
    page: "landing" | "directory",
    category?: string,
    platform?: string,
  ) {
    navigation.scrollTop = 0;
    navigation.route = { page };
    if (category)
      navigation.directory = {
        ...navigation.directory,
        categories: [category],
      };
    if (platform)
      navigation.directory = { ...navigation.directory, platforms: [platform] };
    if (scroller) scroller.scrollTop = 0;
    persist();
  }
  function backToPlugins() {
    navigation.route = { page: navigation.returnPage };
    persist();
  }
  function open(entry: PluginCatalogEntry) {
    navigation.returnPage =
      navigation.route.page === "directory" ? "directory" : "landing";
    navigation.scrollTop = scroller?.scrollTop ?? 0;
    navigation.route = { page: "plugin", pluginId: entry.id };
    if (scroller) scroller.scrollTop = 0;
    persist();
  }
</script>

{#snippet downloadSummary()}
  {@const counts =
    selected && registry.downloadStats
      ? pluginDownloadCounts(registry.downloadStats, selected.id)
      : null}
  {#if counts}
    <dl>
      <dt>Downloads (30d)</dt>
      <dd>~{formatApproximateDownloadCount(counts.recent)}</dd>
      <dt>Lifetime downloads</dt>
      <dd>~{formatApproximateDownloadCount(counts.lifetime)}</dd>
    </dl>
    <p>
      Tracked downloads since {new Date(
        registry.downloadStats!.trackedSince + "T00:00:00Z",
      ).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })}. Approximate redirect requests.
    </p>
  {/if}
{/snippet}
{#snippet overviewContent()}
  {#if session.overview.status === "loaded"}<PluginReadmeRenderer
      app={ownedApp}
      markdown={session.overview.markdown}
      sourcePath={session.overview.url ?? ""}
    />{:else if session.overview.status === "error"}<PluginRegistryContentState
      kind="warning"
      heading="Overview unavailable"
      description={session.overview.message}
      actionLabel="Retry"
      onaction={() => void session.retry("overview")}
    />{/if}
{/snippet}
{#snippet changelogContent()}
  {#if session.changelog.status === "loaded"}<PluginReadmeRenderer
      app={ownedApp}
      markdown={session.changelog.markdown}
      sourcePath={session.changelog.url ?? ""}
    />{:else if session.changelog.status === "error"}<PluginRegistryContentState
      kind="warning"
      heading="Changelog unavailable"
      description={session.changelog.message}
      actionLabel="Retry"
      onaction={() => void session.retry("changelog")}
    />{/if}
{/snippet}
<div class="plugin-browser community-ui" data-ui-component="plugin-browser">
  <AppShell.Root
    controller={shell}
    class="registry-shell"
    style="--ui-shell-height:100%;"
  >
    <AppShell.Main>
      {#if navigation.route.page === "directory" && !registry.initialLoading && registry.catalogEntries.length}
        <PluginBrowserDirectory
          {registry}
          compact={shell.mobile.resolvedMode === "mobile"}
          onhome={() => go("landing")}
          filtersOpen={shell.mobile.stage === "left" &&
            shell.mobile.activePanelId("left") === "registry-filters"}
          ontogglefilters={(event) => {
            if (shell.mobile.stage === "left") shell.mobile.showMain();
            else
              shell.mobile.show(
                "left",
                "registry-filters",
                event.currentTarget as HTMLButtonElement,
              );
          }}
          bind:contentRef={contentRegion}
          directoryState={navigation.directory}
          installedIds={availableIds}
          {updateIds}
          {downloads}
          onopen={open}
          onchange={(state) => {
            navigation.directory = state;
            persist();
          }}
        />
      {:else}
        <AppShell.Body
          element="section"
          layout="regions"
          label="Registry pages"
        >
          <div class="registry-pages-main">
            {#if navigation.route.page === "plugin"}
              <div class="registry-detail-navigation">
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger>
                      {#snippet child({ props })}
                        <Button
                          {...props}
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          class="registry-detail-back"
                          aria-label="Back to plugins"
                          onclick={backToPlugins}
                        >
                          <ArrowLeft
                            data-icon="inline-start"
                            aria-hidden="true"
                          />
                        </Button>
                      {/snippet}
                    </Tooltip.Trigger>
                    <Tooltip.Content>Back to plugins</Tooltip.Content>
                  </Tooltip.Root>
                </Tooltip.Provider>
                <div
                  class="registry-detail-breadcrumbs"
                  data-ui-part="registry-detail-breadcrumbs"
                >
                  <Breadcrumb.Root>
                    <Breadcrumb.List>
                      <Breadcrumb.Item>
                        <Breadcrumb.Link
                          href="#/registry"
                          onclick={(event) => {
                            event.preventDefault();
                            go("landing");
                          }}>Registry</Breadcrumb.Link
                        >
                      </Breadcrumb.Item>
                      <Breadcrumb.Separator />
                      <Breadcrumb.Item>
                        <Breadcrumb.Link
                          href="#/registry/plugins"
                          onclick={(event) => {
                            event.preventDefault();
                            backToPlugins();
                          }}>Plugins</Breadcrumb.Link
                        >
                      </Breadcrumb.Item>
                      <Breadcrumb.Separator />
                      <Breadcrumb.Item>
                        <Breadcrumb.Page
                          >{selected?.name ??
                            selectedId ??
                            "Plugin"}</Breadcrumb.Page
                        >
                      </Breadcrumb.Item>
                    </Breadcrumb.List>
                  </Breadcrumb.Root>
                </div>
              </div>
            {/if}
            <AppShell.Body.Content
              bind:ref={contentRegion}
              scrollbarVisibility="hover"
              label="Registry content"
            >
              <div class="registry-browser">
                {#if registry.initialLoading}<PluginRegistryContentState
                    kind="loading"
                    heading="Loading plugins"
                    description="Reading your verified registry…"
                  />
                {:else if registry.lastError && !registry.catalogEntries.length}<PluginRegistryContentState
                    kind="warning"
                    heading="Plugins unavailable"
                    description={registry.lastError.message}
                    actionLabel="Retry"
                    onaction={() => void registry.refresh(true)}
                  />
                {:else}
                  {#if registry.lastError}<p role="alert">
                      Refresh failed: {registry.lastError.message}
                    </p>{/if}
                  {#if !registry.catalogEntries.length}<PluginRegistryContentState
                      kind="empty"
                      heading="No plugins available"
                      description="Your enabled registries have no plugins."
                      actionLabel="Refresh"
                      onaction={() => void registry.refresh(true)}
                    />
                  {:else if navigation.route.page === "landing"}<PluginBrowserLanding
                      plugins={registry.catalogEntries}
                      {updateIds}
                      onOpenUpdates={() => {
                        navigation.directory = {
                          ...defaultDirectoryState(),
                          updatesOnly: true,
                        };
                        go("directory");
                      }}
                      onOpenDirectory={() => go("directory")}
                      onOpenPlugin={open}
                      onOpenCategory={(category) => go("directory", category)}
                    />
                  {:else if selected && resolved}<PluginBrowserDetail
                      {resolved}
                      downloadSummary={registry.downloadStats
                        ? downloadSummary
                        : undefined}
                      {related}
                      {installAction}
                      {selectedVersion}
                      currentVersion={selected.latestVersion}
                      overview={session.overview.status === "loaded" ||
                      session.overview.status === "error"
                        ? overviewContent
                        : undefined}
                      changelog={session.changelog.status === "loaded" ||
                      session.changelog.status === "error"
                        ? changelogContent
                        : undefined}
                      onInstall={(request) =>
                        update?.canUpdate
                          ? registry.update(update)
                          : registry.install(selected, request.version)}
                      onOpenPlugin={open}
                      onOpenCategory={(category) => go("directory", category)}
                      onOpenPlatform={(platform) =>
                        go("directory", undefined, platform)}
                      onSelectVersion={(version) => (selectedVersion = version)}
                    />
                  {:else if selected && session.loading}<PluginRegistryContentState
                      kind="loading"
                      heading="Loading plugin details"
                      description="Reading verified plugin metadata…"
                    />
                  {:else}<PluginRegistryContentState
                      kind="empty"
                      heading="Plugin unavailable"
                      description="This plugin is no longer in the enabled catalog."
                      actionLabel="Back to plugins"
                      onaction={() => go("directory")}
                    />{/if}
                {/if}
              </div>
            </AppShell.Body.Content>
          </div>
        </AppShell.Body>
      {/if}
    </AppShell.Main>
  </AppShell.Root>
</div>

<style>
  .plugin-browser {
    container: plugin-browser / inline-size;
    min-width: 0;
    height: 100%;
    width: 100%;
    min-height: 0;
    background: var(--ui-workspace-view-background, var(--background));
    color: var(--ui-workspace-view-foreground, var(--foreground));
  }
  :global(.registry-shell) {
    height: 100%;
    min-height: 0;
  }
  .registry-browser {
    min-height: 100%;
    color: var(--foreground);
    background: var(--background);
  }

  .registry-pages-main {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }
  .registry-detail-navigation {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    flex-shrink: 0;
  }
  .registry-detail-navigation :global(.registry-detail-back) {
    border-radius: 50%;
    flex-shrink: 0;
  }
  .registry-detail-breadcrumbs {
    display: none;
    width: min(100%, 70rem);
    margin-inline: auto;
    padding: clamp(1rem, 4cqi, 3rem);
    padding-block-end: 0;
  }

  :global(
      [data-ui-component="workspace-sidebar"]
        [data-ui-part="sidebar-body"][data-content-kind="tab"]
    )
    .registry-detail-breadcrumbs {
    display: block;
  }
</style>
