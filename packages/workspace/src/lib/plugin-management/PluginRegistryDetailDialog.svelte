<script lang="ts">
  import AlertTriangle from "@lucide/svelte/icons/alert-triangle";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import ArrowUpCircle from "@lucide/svelte/icons/arrow-up-circle";
  import Check from "@lucide/svelte/icons/check";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import ChevronUp from "@lucide/svelte/icons/chevron-up";
  import Download from "@lucide/svelte/icons/download";
  import ExternalLink from "@lucide/svelte/icons/external-link";
  import PackageIcon from "@lucide/svelte/icons/package";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import {
    type App,
    type PluginCatalogDetail,
    type PluginCatalogEntry,
    type PluginUpdateInfo,
  } from "@lapis-notes/api";
  import * as Button from "@lapismd/design-core/shadcn/button";
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import * as Resizable from "@lapismd/design-core/shadcn/resizable";
  import * as ScrollArea from "@lapismd/design-core/shadcn/scroll-area";
  import * as Tabs from "@lapismd/design-core/shadcn/tabs";
  import PluginReadmeRenderer from "./PluginReadmeRenderer.svelte";
  import PluginRegistryBadge from "./PluginRegistryBadge.svelte";
  import PluginRegistryContentState from "./PluginRegistryContentState.svelte";

  export type PluginMarkdownState =
    | { status: "idle" | "loading" | "missing" }
    | {
        status: "loaded";
        url: string;
        sourceUrl: string;
        markdown: string;
      }
    | { status: "error"; message: string; sourceUrl?: string };

  let {
    app,
    open = $bindable(false),
    entries,
    selectedEntry,
    detail,
    loading,
    overview,
    changelog,
    installedIds,
    staticPluginIds,
    update,
    runningAction,
    onselect,
    oninstall,
    onupdate,
    onuninstall,
    onretry,
  }: {
    app: App;
    open?: boolean;
    entries: PluginCatalogEntry[];
    selectedEntry: PluginCatalogEntry | null;
    detail: PluginCatalogDetail | null;
    loading: boolean;
    overview: PluginMarkdownState;
    changelog: PluginMarkdownState;
    installedIds: Set<string>;
    staticPluginIds: Set<string>;
    update: PluginUpdateInfo | null;
    runningAction: string | null;
    onselect: (entry: PluginCatalogEntry) => void | Promise<void>;
    oninstall: (entry: PluginCatalogEntry) => void | Promise<void>;
    onupdate: (update: PluginUpdateInfo) => void | Promise<void>;
    onuninstall: (pluginId: string) => void;
    onretry: (kind: "overview" | "changelog") => void | Promise<void>;
  } = $props();

  let activeSection = $state<"overview" | "changelog" | "versions">(
    "overview",
  );
  let narrowDetail = $state(true);
  let changelogExpanded = $state(false);
  let resizingResultRail = $state(false);
  const releases = $derived(
    Object.values(detail?.versions ?? {}).sort((left, right) =>
      right.releasedAt.localeCompare(left.releasedAt),
    ),
  );
  const latestRelease = $derived(
    detail?.versions[detail.latestVersion] ?? null,
  );

  $effect(() => {
    if (selectedEntry?.id) {
      activeSection = "overview";
      narrowDetail = true;
      changelogExpanded = false;
    }
  });

  let changelogNeedsExpansion = $derived(
    changelog.status === "loaded" && changelog.markdown.length > 320,
  );

  function titleCase(value: string): string {
    return value
      .split(/[\s-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function formatBytes(bytes?: number): string | null {
    if (typeof bytes !== "number") return null;
    if (bytes < 1024) return `${bytes} B`;
    const units = ["KiB", "MiB", "GiB"];
    let value = bytes / 1024;
    let index = 0;
    while (value >= 1024 && index < units.length - 1) {
      value /= 1024;
      index += 1;
    }
    return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
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
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="lapis-plugin-detail-dialog">
    <Dialog.Header class="sr-only">
      <Dialog.Title>{selectedEntry?.name ?? "Plugin details"}</Dialog.Title>
      <Dialog.Description>Verified plugin metadata, documentation, and versions.</Dialog.Description>
    </Dialog.Header>
    <div
      class="lapis-plugin-detail-dialog__layout"
      data-narrow-view={narrowDetail ? "detail" : "results"}
    >
      <header class="lapis-plugin-detail-dialog__header">
        <Button.Root
          class="lapis-plugin-detail-dialog__back"
          variant="ghost"
          size="sm"
          onclick={() => (narrowDetail = false)}
        ><ArrowLeft />Back to results</Button.Root>
        {#if selectedEntry}
          <div class="lapis-plugin-detail-dialog__identity">
            <span class="lapis-plugin-detail-dialog__icon" aria-hidden="true"><PackageIcon /></span>
            <div>
              <div class="lapis-plugin-detail-dialog__title-line">
                <h2>{selectedEntry.name}</h2>
                {#if detail?.status}<PluginRegistryBadge label={titleCase(detail.status)} tone={detail.status === "revoked" ? "danger" : "neutral"} />{/if}
              </div>
              <p>{detail?.description ?? selectedEntry.description}</p>
              <div class="lapis-plugin-card__badges">
                <PluginRegistryBadge label={titleCase(selectedEntry.channel)} tone={selectedEntry.channel} />
                {#each selectedEntry.platforms as platform}<PluginRegistryBadge label={titleCase(platform)} tone={platform === "web" ? "web" : "desktop"} />{/each}
              </div>
            </div>
          </div>
          <div class="lapis-plugin-detail-dialog__action">
            {#if update?.canUpdate}
              <Button.Root
                size="sm"
                disabled={runningAction === `update:${update.id}`}
                onclick={() => void onupdate(update)}
              ><ArrowUpCircle />Update</Button.Root>
            {:else if installedIds.has(selectedEntry.id)}
              <Button.Root
                size="sm"
                variant="outline"
                aria-label={`Uninstall ${selectedEntry.name}`}
                disabled={runningAction === `uninstall:${selectedEntry.id}`}
                onclick={() => onuninstall(selectedEntry.id)}
              ><Trash2 data-icon="inline-start" />Uninstall</Button.Root>
            {:else if staticPluginIds.has(selectedEntry.id)}
              <Button.Root size="sm" variant="outline" disabled><Check data-icon="inline-start" />Bundled</Button.Root>
            {:else}
              <Button.Root
                size="sm"
                disabled={runningAction === `install:${selectedEntry.id}`}
                onclick={() => void oninstall(selectedEntry)}
              ><Download />Install</Button.Root>
            {/if}
          </div>
        {:else}
          <div><h2>Plugin details</h2><p>Select a plugin from Browse results.</p></div>
        {/if}
      </header>

      <Resizable.PaneGroup
        direction="horizontal"
        class="lapis-plugin-detail-dialog__panes"
      >
        <Resizable.Pane
          defaultSize={23.25}
          minSize={18}
          maxSize={42}
          class="lapis-plugin-detail-dialog__results-pane"
        >
          <aside class="lapis-plugin-detail-dialog__results">
            <ScrollArea.Root class="lapis-plugin-detail-dialog__result-scroll">
              <div class="lapis-plugin-detail-dialog__result-list">
                {#each entries as entry (entry.id)}
                  <button
                    type="button"
                    data-active={entry.id === selectedEntry?.id || undefined}
                    aria-current={entry.id === selectedEntry?.id ? "true" : undefined}
                    onclick={() => {
                      narrowDetail = true;
                      void onselect(entry);
                    }}
                  >
                    <strong>{entry.name}</strong>
                    <span>{entry.description}</span>
                    <small>{entry.latestVersion}</small>
                  </button>
                {/each}
                {#if !entries.length}<p>No plugins match the current Browse filters.</p>{/if}
              </div>
            </ScrollArea.Root>
          </aside>
        </Resizable.Pane>
        <Resizable.Handle
          class="lapis-plugin-detail-dialog__resizer"
          data-dragging={resizingResultRail || undefined}
          aria-label="Resize plugin result rail"
          onDraggingChange={(dragging) => (resizingResultRail = dragging)}
        />
        <Resizable.Pane
          defaultSize={76}
          minSize={45}
          class="lapis-plugin-detail-dialog__detail-pane"
        >

          <section class="lapis-plugin-detail-dialog__detail">
        {#if selectedEntry}
          {@const releaseDate = formatDate(selectedEntry.latestRelease?.releasedAt ?? latestRelease?.releasedAt)}
          {@const releaseSize = formatBytes(selectedEntry.latestRelease?.bundleSize ?? latestRelease?.bundle.size)}
          <div class="lapis-plugin-detail-dialog__summary">
            <dl>
              <div><dt>Version</dt><dd>{selectedEntry.latestVersion}</dd></div>
              {#if releaseDate}<div><dt>Released</dt><dd>{releaseDate}</dd></div>{/if}
              {#if releaseSize}<div><dt>Size</dt><dd>{releaseSize}</dd></div>{/if}
              <div><dt>Owner</dt><dd>{detail?.owner.name ?? selectedEntry.author}</dd></div>
              {#if detail?.license}<div><dt>License</dt><dd>{detail.license}</dd></div>{/if}
            </dl>
            {#if detail?.links && Object.keys(detail.links).length}
              <nav aria-label="Plugin links">
                {#each Object.entries(detail.links) as [label, url]}
                  {#if url}<a href={url}>{titleCase(label)}<ExternalLink aria-hidden="true" /></a>{/if}
                {/each}
              </nav>
            {/if}
          </div>

          <Tabs.Root bind:value={activeSection} class="lapis-plugin-detail-dialog__tabs">
            <Tabs.List>
              <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
              <Tabs.Trigger value="changelog">Changelog</Tabs.Trigger>
              <Tabs.Trigger value="versions">Versions</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="overview" class="lapis-plugin-detail-dialog__tab-content">
              <ScrollArea.Root class="lapis-plugin-detail-dialog__content-scroll">
                <div class="lapis-plugin-detail-dialog__content">
                  {#if detail?.highlights?.length}
                    <section class="lapis-plugin-detail-dialog__highlights">
                      <h3>Highlights</h3>
                      <ul>{#each detail.highlights as highlight}<li>{highlight}</li>{/each}</ul>
                    </section>
                  {/if}
                  <section class="lapis-plugin-detail-dialog__compatibility">
                    <h3>Compatibility</h3>
                    <p>Lapis {latestRelease?.minAppVersion ?? selectedEntry.minAppVersion} or later</p>
                    <div class="lapis-plugin-card__badges">{#each selectedEntry.platforms as platform}<PluginRegistryBadge label={titleCase(platform)} tone={platform === "web" ? "web" : "desktop"} />{/each}</div>
                  </section>
                  {#if loading || overview.status === "loading"}
                    <PluginRegistryContentState compact kind="loading" heading="Loading overview" description="Verifying signed Markdown content…" />
                  {:else if overview.status === "loaded"}
                    <div class="lapis-plugin-detail-dialog__markdown" data-plugin-markdown="overview" data-plugin-markdown-url={overview.url}>
                      <PluginReadmeRenderer app={app} markdown={overview.markdown} sourcePath={overview.url} />
                      <p class="lapis-plugin-detail-dialog__source"><a href={overview.sourceUrl}>View source README</a></p>
                    </div>
                  {:else if overview.status === "error"}
                    <PluginRegistryContentState compact kind="warning" heading="Overview unavailable" description="The signed Markdown could not be loaded. Other plugin metadata remains available." actionLabel="Retry" onaction={() => void onretry("overview")} sourceUrl={overview.sourceUrl} diagnostic={overview.message} />
                  {:else}
                    <PluginRegistryContentState compact kind="empty" heading="No overview available" description="This registry entry has not published structured Overview content." />
                  {/if}
                </div>
              </ScrollArea.Root>
            </Tabs.Content>
            <Tabs.Content value="changelog" class="lapis-plugin-detail-dialog__tab-content">
              <ScrollArea.Root class="lapis-plugin-detail-dialog__content-scroll">
                <div class="lapis-plugin-detail-dialog__content">
                  {#if loading || changelog.status === "loading"}
                    <PluginRegistryContentState compact kind="loading" heading="Loading changelog" description="Verifying signed Markdown content…" />
                  {:else if changelog.status === "loaded"}
                    <section
                      class="lapis-plugin-detail-dialog__changelog"
                      data-expanded={changelogExpanded}
                    >
                      <header>
                        <div>
                          <h3>What changed</h3>
                          <p>Verified release notes supplied by the plugin.</p>
                        </div>
                        {#if changelogNeedsExpansion}
                          <Button.Root
                            variant="ghost"
                            size="sm"
                            aria-expanded={changelogExpanded}
                            onclick={() => (changelogExpanded = !changelogExpanded)}
                          >
                            {changelogExpanded ? "Show less" : "View full changelog"}
                            {#if changelogExpanded}
                              <ChevronUp data-icon="inline-end" />
                            {:else}
                              <ChevronDown data-icon="inline-end" />
                            {/if}
                          </Button.Root>
                        {/if}
                      </header>
                      <div
                        class="lapis-plugin-detail-dialog__changelog-preview"
                        data-expanded={changelogExpanded}
                        data-plugin-markdown="changelog"
                        data-plugin-markdown-url={changelog.url}
                      >
                        <PluginReadmeRenderer app={app} markdown={changelog.markdown} sourcePath={changelog.url} />
                      </div>
                      <p class="lapis-plugin-detail-dialog__source"><a href={changelog.sourceUrl}>View source changelog</a></p>
                    </section>
                  {:else if changelog.status === "error"}
                    <PluginRegistryContentState compact kind="warning" heading="Changelog unavailable" description="The signed Markdown could not be loaded. Version metadata remains available." actionLabel="Retry" onaction={() => void onretry("changelog")} sourceUrl={changelog.sourceUrl} diagnostic={changelog.message} />
                  {:else}
                    <PluginRegistryContentState compact kind="empty" heading="No changelog available" description="This registry entry has not published structured Changelog content." />
                  {/if}
                </div>
              </ScrollArea.Root>
            </Tabs.Content>
            <Tabs.Content value="versions" class="lapis-plugin-detail-dialog__tab-content">
              <ScrollArea.Root class="lapis-plugin-detail-dialog__content-scroll">
                <div class="lapis-plugin-detail-dialog__version-list">
                  {#each releases as release (release.version)}
                    <article data-revoked={release.revoked ? "true" : undefined}>
                      <div><h3>{release.version}</h3><p>{formatDate(release.releasedAt)} · Lapis {release.minAppVersion}+ · {release.platforms.map(titleCase).join(", ")} · {formatBytes(release.bundle.size)}</p></div>
                      <div>
                        {#if release.revoked}<PluginRegistryBadge label="Revoked" tone="danger" />{/if}
                        <a href={release.bundle.url}>Bundle<ExternalLink aria-hidden="true" /></a>
                      </div>
                    </article>
                  {/each}
                  {#if !releases.length}<PluginRegistryContentState compact kind="empty" heading="No versions available" description="The signed registry detail does not contain release history." />{/if}
                </div>
              </ScrollArea.Root>
            </Tabs.Content>
          </Tabs.Root>
        {:else}
          <PluginRegistryContentState kind="empty" heading="Select a plugin" description="Choose a Browse result to review signed metadata and documentation." />
        {/if}
          </section>
        </Resizable.Pane>
      </Resizable.PaneGroup>
    </div>
  </Dialog.Content>
</Dialog.Root>
