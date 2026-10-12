<script lang="ts">
  import type { Snippet } from "svelte";

  import * as Alert from "@lapismd/design-core/shadcn/alert";
  import { ConfirmDialog } from "@lapismd/design-core/forms/dialog";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import * as DropdownMenu from "@lapismd/design-core/shadcn/dropdown-menu";
  import * as Tabs from "@lapismd/design-core/shadcn/tabs";
  import * as Select from "@lapismd/design-core/shadcn/select";
  import BookOpenIcon from "@lucide/svelte/icons/book-open";
  import BugIcon from "@lucide/svelte/icons/bug";
  import CheckCircleIcon from "@lucide/svelte/icons/circle-check";
  import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
  import DownloadIcon from "@lucide/svelte/icons/download";
  import EllipsisIcon from "@lucide/svelte/icons/ellipsis";
  import ExternalLinkIcon from "@lucide/svelte/icons/external-link";

  import {
    formatRegistryBytes,
    registryStatusLabel,
    titleCaseRegistryValue,
    type RegistryCatalogEntry,
    type RegistryInstallAction,
    type RegistryInstallRequest,
    type RegistryMediaItem,
    type RegistryResolvedDetail,
  } from "./community-presentation/model-adapter";
  import CommunityChip from "./community-presentation/CommunityChip.svelte";
  import { registryFilterIcon } from "./community-presentation/registry-filter-icons.js";
  import RegistryMediaGallery from "./community-presentation/RegistryMediaGallery.svelte";
  import RegistryMediaViewer from "./community-presentation/RegistryMediaViewer.svelte";
  import CommunityMemberAvatar from "./community-presentation/CommunityMemberAvatar.svelte";
  import RegistryPluginChangelog from "./community-presentation/RegistryPluginChangelog.svelte";
  import RegistryPluginCard from "./PluginBrowserCard.svelte";
  import RegistryVerifiedImage from "./community-presentation/RegistryVerifiedImage.svelte";
  import { registryPluginIcon } from "./community-presentation/registry-plugin-icons.js";

  let {
    resolved,
    related = [],
    installAction,
    selectedVersion,
    currentVersion,
    overview,
    changelog,
    downloadSummary,
    onInstall,
    onOpenPlugin,
    onOpenCategory,
    onOpenPlatform,
    onSelectVersion,
  }: {
    resolved: RegistryResolvedDetail;
    related?: readonly RegistryCatalogEntry[];
    installAction?: RegistryInstallAction;
    selectedVersion?: string;
    currentVersion?: string;
    overview?: Snippet;
    changelog?: Snippet;
    downloadSummary?: Snippet;
    onInstall?: (request: RegistryInstallRequest) => void | Promise<void>;
    onOpenPlugin: (plugin: RegistryCatalogEntry) => void;
    onOpenCategory: (category: string) => void;
    onOpenPlatform: (platform: string) => void;
    onSelectVersion: (version: string) => void;
  } = $props();

  let activeTab = $state("overview");
  let submitting = $state(false);
  let installError = $state("");
  let detailViewerOpen = $state(false);
  let detailViewerItems = $state<readonly RegistryMediaItem[]>([]);
  let detailViewerInitialMode = $state<"preview" | "full" | "light" | "dark">(
    "full",
  );
  let detailViewerOpener = $state<HTMLElement | null>(null);
  let historicalConfirmationOpen = $state(false);
  const entry = $derived(resolved.entry);
  const detail = $derived(resolved.detail);
  const displayedVersion = $derived(selectedVersion ?? detail.latestVersion);
  const trustedCurrentVersion = $derived(currentVersion ?? entry.latestVersion);
  const release = $derived(detail.versions[displayedVersion]);
  const historical = $derived(displayedVersion !== trustedCurrentVersion);
  const hasExternalLinks = $derived(
    Boolean(
      detail.links?.documentation ||
        detail.links?.repository ||
        detail.links?.issues,
    ),
  );
  const releases = $derived(
    Object.values(detail.versions).toSorted((left, right) =>
      left.releaseSequence !== undefined && right.releaseSequence !== undefined
        ? compareDecimal(right.releaseSequence, left.releaseSequence)
        : right.releasedAt.localeCompare(left.releasedAt) ||
          right.version.localeCompare(left.version),
    ),
  );
  const filePatterns = $derived(
    detail.contributes?.editorViews?.flatMap((view) => view.filenamePatterns) ??
      [],
  );
  const effectiveInstallAction = $derived.by<RegistryInstallAction>(() => {
    if (installAction) return installAction;
    if (onInstall === undefined)
      return {
        state: "disabled",
        reason: "Installation is not available in this host",
      };
    if (detail.status !== "active")
      return {
        state: "disabled",
        reason: `${detail.name} is ${registryStatusLabel(detail.status).toLocaleLowerCase()}`,
      };
    if (release === undefined || release.bundle.pending === true)
      return {
        state: "disabled",
        reason: "The verified plugin bundle is not ready",
      };
    return { state: "available" };
  });
  const installDisabled = $derived(
    submitting ||
      effectiveInstallAction.state === "installing" ||
      effectiveInstallAction.state === "installed" ||
      effectiveInstallAction.state === "disabled",
  );
  const installLabel = $derived(
    effectiveInstallAction.label ??
      (submitting || effectiveInstallAction.state === "installing"
        ? "Installing…"
        : effectiveInstallAction.state === "installed"
          ? "Installed"
          : effectiveInstallAction.state === "disabled"
            ? "Install unavailable"
            : effectiveInstallAction.state === "rejected"
              ? "Retry install"
              : "Install in Lapis"),
  );
  const displayedInstallError = $derived(
    installError ||
      (effectiveInstallAction.state === "rejected"
        ? (effectiveInstallAction.reason ?? "The plugin could not be installed")
        : ""),
  );
  const author = $derived(detail.author || detail.owner.name);
  const authorUrl = $derived(
    detail.authorUrl ?? entry.authorUrl ?? detail.owner.url,
  );
  const authorAvatarUrl = $derived(
    detail.authorAvatarUrl ?? entry.authorAvatarUrl,
  );
  const authorMember = $derived({
    id: authorUrl ?? author,
    name: author,
    handle: author,
    initials: initials(author),
    ...(authorAvatarUrl === undefined ? {} : { avatarUrl: authorAvatarUrl }),
  });
  const bundleHealth = $derived(release?.bundle.pending === true ? 1 : 4);
  const PluginIcon = $derived(
    registryPluginIcon(detail.appearance?.icon ?? entry.categories[0]),
  );

  const dateFormatter = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  });

  function formatDate(value: string | undefined): string {
    return value ? dateFormatter.format(new Date(value)) : "Unknown";
  }

  function openExternal(url: string): void {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function initials(value: string): string {
    return value
      .split(/\s+/u)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toLocaleUpperCase();
  }

  async function install(): Promise<void> {
    if (installDisabled || onInstall === undefined || release === undefined)
      return;
    if (historical) {
      historicalConfirmationOpen = true;
      return;
    }
    await performInstall();
  }

  async function performInstall(): Promise<void> {
    if (onInstall === undefined || release === undefined) return;
    submitting = true;
    installError = "";
    try {
      await onInstall({
        pluginId: detail.id,
        version: release.version,
        bundle: release.bundle,
      });
    } catch (cause) {
      installError =
        cause instanceof Error
          ? cause.message
          : "The plugin could not be installed";
    } finally {
      submitting = false;
    }
  }

  function compareDecimal(left: string, right: string): number {
    return left.length === right.length
      ? left.localeCompare(right)
      : left.length - right.length;
  }

  function selectVersion(version: string): void {
    activeTab = "overview";
    onSelectVersion(version);
  }

  function showMedia(
    item: RegistryMediaItem,
    initialMode: "preview" | "full" | "light" | "dark",
    target: HTMLElement,
  ): void {
    detailViewerItems = [item];
    detailViewerInitialMode = initialMode;
    detailViewerOpener = target;
    detailViewerOpen = true;
  }
</script>

{#snippet pluginIcon()}
  <PluginIcon aria-hidden="true" />
{/snippet}

{#snippet authorAvatar(compact = false)}
  <CommunityMemberAvatar
    member={authorMember}
    size={compact ? "small" : "xsmall"}
    decorative
  />
{/snippet}

{#snippet authorLink(compact = false)}
  {#if authorUrl}
    <a
      class="registry-plugin-detail__author-link"
      class:compact
      href={authorUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      {@render authorAvatar(compact)}
      <span class="registry-plugin-detail__author-name"
        >{compact ? author : `By ${author}`}</span
      >
    </a>
  {:else}
    <span class="registry-plugin-detail__author-link disabled" class:compact>
      {@render authorAvatar(compact)}
      <span class="registry-plugin-detail__author-name"
        >{compact ? author : `By ${author}`}</span
      >
    </span>
  {/if}
{/snippet}

{#snippet filterChip(type: "category" | "platform", value: string)}
  {@const FilterIcon = registryFilterIcon(value)}
  <CommunityChip
    onclick={() => {
      type === "category" ? onOpenCategory(value) : onOpenPlatform(value);
    }}
  >
    <FilterIcon data-icon="inline-start" aria-hidden="true" />
    <span>{titleCaseRegistryValue(value)}</span>
  </CommunityChip>
{/snippet}

<article class="registry-plugin-detail">
  <header
    class="registry-plugin-detail__hero"
    class:with-banner={Boolean(detail.media?.banner)}
  >
    <div class="registry-plugin-detail__hero-copy">
      <div class="registry-plugin-detail__identity">
        <span
          class="registry-plugin-detail__icon"
          style:--registry-plugin-accent={detail.appearance?.accent ??
            "var(--primary)"}
        >
          {#if detail.appearance?.logo}
            <RegistryVerifiedImage
              reference={detail.appearance.logo}
              alt=""
              width={detail.appearance.logo.width}
              height={detail.appearance.logo.height}
              fallback={pluginIcon}
            />
          {:else}
            <PluginIcon aria-hidden="true" />
          {/if}
        </span>
        <div>
          <h1>{detail.name}</h1>
          <div class="registry-plugin-detail__hero-meta">
            {@render authorLink()}
            {#each entry.platforms as platform}
              {@render filterChip("platform", platform)}
            {/each}
          </div>
        </div>
      </div>
      <p class="registry-plugin-detail__description">{detail.description}</p>
      <div class="registry-plugin-detail__actions">
        <Button
          type="button"
          disabled={installDisabled}
          aria-busy={submitting ||
            effectiveInstallAction.state === "installing"}
          title={effectiveInstallAction.state === "disabled"
            ? effectiveInstallAction.reason
            : undefined}
          onclick={() => void install()}
        >
          {#if effectiveInstallAction.state === "installed"}<CheckCircleIcon
              data-icon="inline-start"
              aria-hidden="true"
            />{:else}<DownloadIcon
              data-icon="inline-start"
              aria-hidden="true"
            />{/if}
          {installLabel}
        </Button>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Button
                {...props}
                type="button"
                size="icon"
                variant="secondary"
                aria-label="More actions"
              >
                <EllipsisIcon aria-hidden="true" />
              </Button>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            align="start"
            class="registry-plugin-detail__actions-menu"
          >
            {#if hasExternalLinks}
              <DropdownMenu.Group>
                {#if detail.links?.documentation}
                  <DropdownMenu.Item
                    onSelect={() => openExternal(detail.links!.documentation!)}
                    ><BookOpenIcon
                      data-icon="inline-start"
                      aria-hidden="true"
                    />Documentation</DropdownMenu.Item
                  >
                {/if}
                {#if detail.links?.repository}
                  <DropdownMenu.Item
                    onSelect={() => openExternal(detail.links!.repository!)}
                    ><ExternalLinkIcon
                      data-icon="inline-start"
                      aria-hidden="true"
                    />Repository</DropdownMenu.Item
                  >
                {/if}
                {#if detail.links?.issues}
                  <DropdownMenu.Item
                    onSelect={() => openExternal(detail.links!.issues!)}
                    ><BugIcon
                      data-icon="inline-start"
                      aria-hidden="true"
                    />Report bug</DropdownMenu.Item
                  >
                {/if}
              </DropdownMenu.Group>
            {/if}
            {#if release && release.bundle.pending !== true}
              {#if hasExternalLinks}<DropdownMenu.Separator />{/if}
              <DropdownMenu.Group>
                <DropdownMenu.Item
                  onSelect={() =>
                    openExternal(
                      release.bundle.downloadUrl ?? release.bundle.url,
                    )}
                  ><DownloadIcon
                    data-icon="inline-start"
                    aria-hidden="true"
                  />Download .lapis-plugin</DropdownMenu.Item
                >
              </DropdownMenu.Group>
            {/if}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
      {#if displayedInstallError}
        <Alert.Root
          variant="destructive"
          class="registry-plugin-detail__install-error"
        >
          <CircleAlertIcon aria-hidden="true" />
          <Alert.Title>Couldn’t install {detail.name}</Alert.Title>
          <Alert.Description>{displayedInstallError}</Alert.Description>
        </Alert.Root>
      {/if}
    </div>
    {#if detail.media?.banner}
      <button
        type="button"
        class="registry-plugin-detail__banner"
        aria-label={`Open ${detail.name} banner: ${detail.media.banner.alt}`}
        onclick={(event) =>
          showMedia(detail.media!.banner!, "dark", event.currentTarget)}
      >
        <RegistryVerifiedImage
          reference={detail.media.banner.images.dark}
          alt=""
          width={detail.media.banner.images.dark.width}
          height={detail.media.banner.images.dark.height}
        />
      </button>
    {/if}
  </header>

  {#if detail.gallery?.length}
    <RegistryMediaGallery items={detail.gallery} pluginName={detail.name} />
  {/if}

  <div class="registry-plugin-detail__layout">
    <section class="registry-plugin-detail__content">
      <Tabs.Root bind:value={activeTab}>
        <Tabs.List variant="line" aria-label="Plugin sections">
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <Tabs.Trigger value="changelog">Changelog</Tabs.Trigger>
          <Tabs.Trigger value="releases"
            >Releases
            <CommunityChip
              variant="muted"
              size="compact"
              class="registry-plugin-detail__tab-count"
              >{releases.length}</CommunityChip
            ></Tabs.Trigger
          >
        </Tabs.List>
        <Tabs.Content value="overview">
          <div class="registry-plugin-detail__prose">
            {#if detail.media?.overview}
              <button
                type="button"
                class="registry-plugin-detail__overview-media"
                aria-label={`Open ${detail.name} overview image: ${detail.media.overview.alt}`}
                onclick={(event) =>
                  showMedia(
                    detail.media!.overview!,
                    "preview",
                    event.currentTarget,
                  )}
              >
                <RegistryVerifiedImage
                  reference={detail.media.overview.images.preview}
                  alt=""
                  width={detail.media.overview.images.preview.width}
                  height={detail.media.overview.images.preview.height}
                  loading="lazy"
                />
              </button>
            {/if}
            {#if detail.highlights?.length}
              <section>
                <h2>Highlights</h2>
                <ul>
                  {#each detail.highlights as highlight}<li>
                      {highlight}
                    </li>{/each}
                </ul>
              </section>
            {/if}
            <p>{detail.description}</p>
            {#if overview}{@render overview()}{/if}
            {#if filePatterns.length > 0}
              <section>
                <h2>File handlers</h2>
                <div class="registry-plugin-detail__file-patterns">
                  {#each filePatterns as pattern}<code>{pattern}</code>{/each}
                </div>
              </section>
            {/if}
          </div>
        </Tabs.Content>
        <Tabs.Content value="changelog">
          {#if changelog}{@render changelog()}{:else}<RegistryPluginChangelog
              latestVersion={detail.latestVersion}
              {releases}
            />{/if}
        </Tabs.Content>
        <Tabs.Content value="releases">
          <div class="registry-plugin-detail__releases">
            {#each releases as item (item.version)}
              <article>
                <div>
                  <h3>
                    <a
                      href={`#/registry/plugins/${encodeURIComponent(detail.id)}/versions/${encodeURIComponent(item.version)}`}
                      onclick={(event) => {
                        event.preventDefault();
                        selectVersion(item.version);
                      }}>{item.version}</a
                    >
                  </h3>
                  <p>
                    Lapis {item.minAppVersion}+ · {item.platforms
                      .map(titleCaseRegistryValue)
                      .join(", ")} · {formatRegistryBytes(item.bundle.size)}
                  </p>
                </div>
                <CommunityChip
                  variant={item.bundle.pending ? "outline" : "muted"}
                  tone={item.bundle.pending ? "warning" : "success"}
                  >{item.bundle.pending
                    ? "Pending bundle"
                    : "Signed bundle"}</CommunityChip
                >
              </article>
            {/each}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </section>

    <aside class="registry-plugin-detail__sidebar">
      <section
        class="registry-plugin-detail__health"
        aria-label="Plugin health"
      >
        <div data-complete="true">
          <span><strong>Metadata</strong><strong>Signed</strong></span>
          <div
            class="registry-plugin-detail__health-bar"
            data-ui-part="registry-plugin-health-bar"
            role="progressbar"
            aria-label="Metadata health"
            aria-valuemin="0"
            aria-valuemax="4"
            aria-valuenow="4"
            aria-valuetext="Signed, 4 of 4 checks ready"
          >
            {#each Array.from({ length: 4 }) as _}<i data-active="true"
              ></i>{/each}
          </div>
        </div>
        <div data-complete={bundleHealth === 4 ? "true" : "false"}>
          <span
            ><strong>Plugin bundle</strong><strong
              >{bundleHealth === 4 ? "Ready" : "Pending"}</strong
            ></span
          >
          <div
            class="registry-plugin-detail__health-bar"
            data-ui-part="registry-plugin-health-bar"
            role="progressbar"
            aria-label="Plugin bundle health"
            aria-valuemin="0"
            aria-valuemax="4"
            aria-valuenow={bundleHealth}
            aria-valuetext={`${bundleHealth === 4 ? "Ready" : "Pending"}, ${bundleHealth} of 4 checks ready`}
          >
            {#each Array.from({ length: 4 }) as _, index}
              <i data-active={index < bundleHealth ? "true" : "false"}></i>
            {/each}
          </div>
        </div>
      </section>
      <section>
        <h2>About</h2>
        <p>{detail.description}</p>
        <div class="registry-plugin-detail__chips">
          {#each entry.categories as category}
            {@render filterChip("category", category)}
          {/each}
        </div>
      </section>
      <section>
        <h2>Details</h2>
        <dl>
          <div>
            <dt>Current version</dt>
            <dd>
              {#if releases.length > 1}
                <Select.Root
                  type="single"
                  value={displayedVersion}
                  onValueChange={(value) => {
                    if (value) selectVersion(value);
                  }}
                >
                  <Select.Trigger
                    size="sm"
                    class="registry-plugin-detail__version-trigger"
                    aria-label="Select plugin version"
                    role="combobox"
                  >
                    {displayedVersion}
                    <span>{historical ? "Historical" : "Latest"}</span>
                  </Select.Trigger>
                  <Select.Content aria-label="Plugin versions">
                    <Select.Group>
                      {#each releases as item (item.version)}
                        <Select.Item value={item.version} label={item.version}>
                          {item.version} · {item.version ===
                          trustedCurrentVersion
                            ? "Latest"
                            : "Historical"}
                        </Select.Item>
                      {/each}
                    </Select.Group>
                  </Select.Content>
                </Select.Root>
              {:else}
                {detail.latestVersion}
              {/if}
            </dd>
          </div>
          <div>
            <dt>Last updated</dt>
            <dd>{formatDate(release?.releasedAt)}</dd>
          </div>
          <div>
            <dt>Releases</dt>
            <dd>{releases.length}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{registryStatusLabel(detail.status)}</dd>
          </div>
          <div>
            <dt>Compatible with</dt>
            <dd>Lapis {release?.minAppVersion ?? entry.minAppVersion}+</dd>
          </div>
          <div>
            <dt>Platforms</dt>
            <dd>{entry.platforms.map(titleCaseRegistryValue).join(", ")}</dd>
          </div>
          <div>
            <dt>License</dt>
            <dd>{detail.license ?? "Not specified"}</dd>
          </div>
          <div>
            <dt>Trust</dt>
            <dd>{detail.owner.verified ? "Verified" : "Community"}</dd>
          </div>
          <div>
            <dt>Bundle size</dt>
            <dd>
              {release ? formatRegistryBytes(release.bundle.size) : "Unknown"}
            </dd>
          </div>
        </dl>
      </section>
      <section>
        <h2>Author</h2>
        <div class="registry-plugin-detail__author">
          {@render authorLink(true)}
        </div>
      </section>
      {#if downloadSummary}<section>
          <h2>Downloads</h2>
          {@render downloadSummary()}
        </section>{/if}
    </aside>
  </div>

  {#if related.length > 0}
    <section class="registry-plugin-detail__related">
      <h2>Related plugins</h2>
      <div>
        {#each related as plugin (plugin.id)}<RegistryPluginCard
            {plugin}
            variant="compact"
            onOpen={onOpenPlugin}
          />{/each}
      </div>
    </section>
  {/if}

  <ConfirmDialog
    bind:open={historicalConfirmationOpen}
    pending={submitting}
    error={installError}
    onConfirm={async () => {
      await performInstall();
      return !installError;
    }}
  >
    {#snippet title()}Install historical release?{/snippet}
    {#snippet description()}
      {#if effectiveInstallAction.installedVersion}
        This replaces installed version {effectiveInstallAction.installedVersion}
        with historical version {displayedVersion}. The current trusted release
        is {trustedCurrentVersion}.
      {:else}
        You are installing historical version {displayedVersion}. The current
        trusted release is {trustedCurrentVersion}.
      {/if}
    {/snippet}
    {#snippet confirmLabel()}Install {displayedVersion}{/snippet}
  </ConfirmDialog>

  <RegistryMediaViewer
    items={detailViewerItems}
    pluginName={detail.name}
    opener={detailViewerOpener}
    initialMode={detailViewerInitialMode}
    bind:open={detailViewerOpen}
  />
</article>

<style>
  .registry-plugin-detail {
    display: grid;
    min-width: 0;
    gap: clamp(1.5rem, 4cqi, 3rem);
    width: min(100%, 70rem);
    margin-inline: auto;
    padding: clamp(1rem, 4cqi, 3rem);
    overflow-wrap: anywhere;
  }
  .registry-plugin-detail__hero {
    display: grid;
    gap: 2rem;
    align-items: center;
  }

  .registry-plugin-detail__hero.with-banner {
    grid-template-columns: minmax(0, 1fr) minmax(22.5rem, 32.5rem);
    gap: 3rem;
  }
  .registry-plugin-detail__hero-copy {
    display: grid;
    min-width: 0;
    gap: 1.125rem;
  }
  .registry-plugin-detail__identity {
    display: grid;
    grid-template-columns: 5rem minmax(0, 1fr);
    align-items: center;
    gap: 1.5rem;
  }
  .registry-plugin-detail__identity > div {
    min-width: 0;
  }
  .registry-plugin-detail__identity h1 {
    margin: 0;
    font-size: var(--community-text-page);
    font-weight: 600;
    line-height: 1.1;
    letter-spacing: -0.035em;
  }
  .registry-plugin-detail__icon {
    display: grid;
    width: 5rem;
    height: 5rem;
    place-items: center;
    overflow: hidden;
    border: 1px solid
      color-mix(in srgb, var(--registry-plugin-accent) 38%, var(--border));
    border-radius: calc(var(--radius) * 2);
    color: var(--registry-plugin-accent);
    background: color-mix(
      in srgb,
      var(--registry-plugin-accent) 14%,
      var(--muted)
    );
  }
  .registry-plugin-detail__icon :global(svg) {
    width: 2.25rem;
    height: 2.25rem;
  }
  .registry-plugin-detail__icon :global(img) {
    width: 76%;
    height: 76%;
    object-fit: contain;
  }
  .registry-plugin-detail__hero-meta,
  .registry-plugin-detail__actions,
  .registry-plugin-detail__chips {
    margin-top: 1rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }
  .registry-plugin-detail__hero-meta {
    margin-top: 0.35rem;
    color: var(--muted-foreground);
  }
  .registry-plugin-detail__author-link {
    display: inline-flex;
    align-items: center;
    border: 1px solid var(--border);
    color: var(--foreground);
    text-decoration: none;
    transition:
      background-color 140ms ease,
      border-color 140ms ease,
      color 140ms ease,
      box-shadow 140ms ease;
  }
  .registry-plugin-detail__author-link {
    gap: 0.35rem;
    border-color: transparent;
    border-radius: 999px;
    padding: 0.125rem 0.35rem 0.125rem 0.125rem;
    color: var(--muted-foreground);
  }
  .registry-plugin-detail__author-link.compact {
    gap: 0.55rem;
    padding: 0.25rem 0.5rem 0.25rem 0.25rem;
    color: var(--foreground);
    font-weight: 600;
  }
  .registry-plugin-detail__author-link:not(.disabled):hover,
  .registry-plugin-detail__author-link:not(.disabled):focus-visible {
    color: var(--muted-foreground);
    background: transparent;
  }
  .registry-plugin-detail__author-link:not(.disabled):hover
    .registry-plugin-detail__author-name,
  .registry-plugin-detail__author-link:not(.disabled):focus-visible
    .registry-plugin-detail__author-name {
    color: var(--foreground);
  }
  .registry-plugin-detail__author-link:not(.disabled):focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
  .registry-plugin-detail__description {
    max-width: 48rem;
    margin: 0;
    font-size: var(--community-text-section);
    line-height: 1.4;
  }
  :global(.registry-plugin-detail__install-error[data-ui-component="alert"]) {
    width: min(100%, 38rem);
    border-color: color-mix(in srgb, var(--destructive) 30%, var(--border));
    border-radius: calc(var(--radius) + 0.25rem);
    color: color-mix(in srgb, var(--destructive) 78%, var(--foreground));
    background: color-mix(in srgb, var(--destructive) 6%, var(--card));
    box-shadow: 0 0.25rem 1rem
      color-mix(in srgb, var(--destructive) 8%, transparent);
  }

  :global(
      .registry-plugin-detail__install-error[data-ui-component="alert"] > svg
    ) {
    margin-block-start: 0.125rem;
  }

  :global(
      .registry-plugin-detail__install-error [data-ui-part="alert-description"]
    ) {
    color: inherit;
    opacity: 1;
  }

  :global(
      .registry-plugin-detail__actions-menu[data-ui-part="dropdown-menu-content"]
    ) {
    min-width: 13rem;
  }

  :global(
      .registry-plugin-detail__actions-menu [data-ui-part="dropdown-menu-item"]
    ) {
    white-space: nowrap;
  }

  .registry-plugin-detail__banner {
    display: block;
    width: 100%;
    overflow: hidden;
    border: 0;
    border-radius: 1rem;
    padding: 0;
    background: #09090b;
    cursor: zoom-in;
  }
  .registry-plugin-detail__banner :global(img) {
    display: block;
    width: 100%;
    aspect-ratio: 3 / 2;
    object-fit: cover;
  }
  .registry-plugin-detail__layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 18rem;
    gap: clamp(1.5rem, 4vw, 3rem);
    align-items: start;
  }
  .registry-plugin-detail__content {
    min-width: 0;
  }
  .registry-plugin-detail__content :global([data-ui-part="tabs"]) {
    display: grid;
  }
  .registry-plugin-detail__content :global([data-ui-part="tabs-list"]) {
    justify-content: flex-start;
    width: 100%;
    border-bottom: 1px solid var(--border);
    border-radius: 0;
    padding: 0;
  }
  .registry-plugin-detail__content :global([data-ui-part="tabs-trigger"]) {
    flex: 0 0 auto;
    align-self: stretch;
    height: auto;
    border-radius: 0;
    padding: 0.65rem 0.85rem;
  }
  .registry-plugin-detail__content
    :global([data-ui-part="tabs-trigger"]::after) {
    /* This unpadded rail has one-pixel trigger and list borders. */
    bottom: -2px;
  }
  .registry-plugin-detail__content
    :global([data-ui-part="tabs-trigger"][data-state="active"]) {
    color: var(--primary);
  }
  .registry-plugin-detail__content
    :global([data-ui-part="tabs-trigger"][data-state="active"]::after) {
    background: var(--primary);
  }
  .registry-plugin-detail__content :global([data-ui-part="tabs-content"]) {
    min-width: 0;
  }
  :global(.registry-plugin-detail__tab-count[data-ui-part="community-chip"]) {
    min-width: 1.25rem;
    justify-content: center;
    font-variant-numeric: tabular-nums;
  }
  .registry-plugin-detail__prose {
    display: grid;
    gap: 1.25rem;
    padding-block: 1.25rem;
    line-height: 1.65;
  }
  .registry-plugin-detail__overview-media {
    display: block;
    width: 100%;
    overflow: hidden;
    border: 0;
    border-radius: 0.65rem;
    padding: 0;
    background: #09090b;
    cursor: zoom-in;
  }
  .registry-plugin-detail__overview-media :global(img) {
    display: block;
    width: 100%;
    aspect-ratio: 3 / 2;
    object-fit: cover;
  }
  .registry-plugin-detail__banner:focus-visible,
  .registry-plugin-detail__overview-media:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
  .registry-plugin-detail__prose h2,
  .registry-plugin-detail__related h2,
  .registry-plugin-detail__sidebar h2 {
    margin: 0 0 0.65rem;
    font-size: var(--community-text-section);
    font-weight: 700;
  }
  .registry-plugin-detail__file-patterns {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .registry-plugin-detail__file-patterns code {
    border-radius: var(--radius);
    padding: 0.25rem 0.45rem;
    background: var(--muted);
  }
  .registry-plugin-detail__releases {
    display: grid;
    padding-block: 1rem;
  }
  .registry-plugin-detail__releases article {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    border-bottom: 1px solid var(--border);
    padding: 1rem 0;
  }
  .registry-plugin-detail__releases h3,
  .registry-plugin-detail__releases p {
    margin: 0;
  }
  .registry-plugin-detail__releases a {
    color: inherit;
    text-decoration: none;
  }
  .registry-plugin-detail__releases a:hover,
  .registry-plugin-detail__releases a:focus-visible {
    color: var(--primary);
    text-decoration: underline;
  }
  :global(.registry-plugin-detail__version-trigger) {
    min-width: 10rem;
    max-width: 100%;
    justify-content: space-between;
  }
  :global(.registry-plugin-detail__version-trigger > span) {
    color: var(--muted-foreground);
    font-size: var(--community-text-secondary);
  }
  .registry-plugin-detail__releases p {
    color: var(--muted-foreground);
    font-size: var(--community-text-body);
  }
  .registry-plugin-detail__sidebar {
    display: grid;
    min-width: 0;
    gap: 1.25rem;
  }
  .registry-plugin-detail__sidebar > section {
    border-top: 1px solid var(--border);
    padding-top: 1rem;
  }
  .registry-plugin-detail__sidebar p {
    margin: 0;
    color: var(--muted-foreground);
    font-size: var(--community-text-body);
    line-height: 1.45;
  }
  .registry-plugin-detail__health {
    display: grid;
    gap: 0.85rem;
  }
  .registry-plugin-detail__health div {
    display: grid;
    gap: 0.35rem;
  }
  .registry-plugin-detail__health span {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    font-size: var(--community-text-secondary);
  }
  .registry-plugin-detail__health
    > div[data-complete="true"]
    span
    strong:last-child {
    color: color-mix(in srgb, #16a34a 78%, var(--foreground));
  }
  .registry-plugin-detail__health-bar {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.25rem;
    height: 0.375rem;
  }
  .registry-plugin-detail__health-bar i {
    display: block;
    border-radius: 999px;
    background: var(--muted);
  }
  .registry-plugin-detail__health-bar i[data-active="true"] {
    background: var(--primary);
  }
  .registry-plugin-detail__health
    > div[data-complete="true"]
    .registry-plugin-detail__health-bar
    i[data-active="true"] {
    background: color-mix(in srgb, #16a34a 78%, var(--primary));
  }
  dl {
    display: grid;
    gap: 0.55rem;
    margin: 0;
  }
  dl div {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.75rem;
    font-size: var(--community-text-secondary);
  }
  dt {
    color: var(--muted-foreground);
  }
  dd {
    min-width: 0;
    margin: 0;
    text-align: end;
  }
  .registry-plugin-detail__author {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .registry-plugin-detail__related {
    display: grid;
    gap: 0.75rem;
  }
  .registry-plugin-detail__related > div {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.5rem;
  }
  @container plugin-browser (max-width: 58rem) {
    .registry-plugin-detail__hero.with-banner,
    .registry-plugin-detail__layout {
      grid-template-columns: minmax(0, 1fr);
    }
    .registry-plugin-detail__sidebar {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @container plugin-browser (max-width: 38rem) {
    .registry-plugin-detail__identity {
      grid-template-columns: 4rem minmax(0, 1fr);
      align-items: start;
    }
    .registry-plugin-detail__icon {
      width: 4rem;
      height: 4rem;
    }
    .registry-plugin-detail__sidebar,
    .registry-plugin-detail__related > div {
      grid-template-columns: 1fr;
    }
  }
  @container plugin-browser (max-width: 26rem) {
    .registry-plugin-detail__content :global([data-ui-part="tabs-list"]) {
      height: auto;
      min-height: 2.25rem;
      flex-wrap: wrap;
    }
    .registry-plugin-detail__content :global([data-ui-part="tabs-trigger"]) {
      padding-inline: 0.25rem;
    }
    dl div {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
    }
    dd {
      max-width: 100%;
      margin-inline-start: auto;
    }
  }
</style>
