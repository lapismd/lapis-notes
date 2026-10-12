<script lang="ts">
  import {
    type RegistryChangelogTag,
    type RegistryRelease,
  } from "./model-adapter";
  import CommunityChip from "./CommunityChip.svelte";

  import { renderRegistryMarkdown } from "./registry-markdown";
  let {
    latestVersion,
    releases,
  }: {
    latestVersion: string;
    releases: readonly RegistryRelease[];
  } = $props();

  const dateFormatter = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  });

  const tagLabels: Record<RegistryChangelogTag, string> = {
    feature: "Feature",
    improvement: "Improvement",
    fix: "Fix",
    security: "Security",
    breaking: "Breaking",
    deprecation: "Deprecation",
    removal: "Removal",
  };

  function versionLabel(version: string): string {
    return version.startsWith("v") ? version : `v${version}`;
  }

  function releasedAt(release: RegistryRelease): string {
    return dateFormatter.format(new Date(release.releasedAt));
  }

  function noteTitle(release: RegistryRelease): string {
    return (
      release.changelog?.title ?? `${versionLabel(release.version)} release`
    );
  }

  function noteDescription(release: RegistryRelease): string | undefined {
    return release.changelog?.description ?? release.releasePost;
  }

  function noteHtml(release: RegistryRelease): string | undefined {
    const description = noteDescription(release);
    return description === undefined
      ? undefined
      : renderRegistryMarkdown(description);
  }
</script>

<div class="registry-plugin-changelog-list">
  {#each releases as release (release.version)}
    <article
      class="registry-plugin-changelog"
      aria-label={`${release.version} changelog`}
    >
      <header class="registry-plugin-changelog__header">
        <div class="registry-plugin-changelog__chips">
          <CommunityChip
            class="registry-plugin-changelog__version"
            variant="muted"
            tone="success">{versionLabel(release.version)}</CommunityChip
          >
          {#if release.version === latestVersion}
            <CommunityChip
              class="registry-plugin-changelog__latest"
              variant="outline"
              tone="success">Latest</CommunityChip
            >
          {/if}
        </div>
        <time datetime={release.releasedAt}>{releasedAt(release)}</time>
      </header>

      <div class="registry-plugin-changelog__prose">
        <h2 class="registry-plugin-changelog__title">{noteTitle(release)}</h2>
        {#if release.changelog?.tags?.length}
          <div
            class="registry-plugin-changelog__tags"
            aria-label="Changelog tags"
          >
            {#each release.changelog.tags as tag}
              <CommunityChip variant="subtle" size="compact"
                >{tagLabels[tag]}</CommunityChip
              >
            {/each}
          </div>
        {/if}
        {#if noteHtml(release)}
          {@html noteHtml(release)}
        {:else}
          <p>This release does not include verified changelog notes.</p>
        {/if}
      </div>
    </article>
  {:else}
    <article class="registry-plugin-changelog" aria-label="No changelog">
      <div class="registry-plugin-changelog__prose">
        <h2 class="registry-plugin-changelog__title">
          No structured changelog yet
        </h2>
        <p>This plugin does not include verified changelog notes.</p>
      </div>
    </article>
  {/each}
</div>

<style>
  .registry-plugin-changelog-list {
    display: grid;
    gap: 1rem;
  }

  .registry-plugin-changelog {
    display: grid;
    min-width: 0;
    gap: 1.4rem;
    padding: clamp(1.4rem, 4vw, 2.4rem);
    border: 1px solid color-mix(in srgb, var(--border) 86%, transparent);
    border-radius: calc(var(--radius) * 1.8);
    background: var(--background);
    box-shadow: 0 1.25rem 3rem
      color-mix(in srgb, var(--foreground) 7%, transparent);
  }

  .registry-plugin-changelog__header {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .registry-plugin-changelog__chips {
    display: flex;
    min-width: 0;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.7rem;
  }

  .registry-plugin-changelog__header time {
    color: color-mix(in srgb, var(--muted-foreground) 84%, var(--foreground));
    font-size: var(--community-text-section);
    font-weight: 500;
    white-space: nowrap;
  }

  .registry-plugin-changelog__prose {
    display: grid;
    gap: 1rem;
    color: color-mix(in srgb, var(--muted-foreground) 84%, var(--foreground));
    font-size: var(--community-text-body);
    line-height: 1.55;
  }

  .registry-plugin-changelog__prose :global(*) {
    margin: 0;
  }

  .registry-plugin-changelog__title,
  .registry-plugin-changelog__prose :global(h1) {
    color: var(--foreground);
    font-size: var(--community-text-page);
    font-weight: 800;
    line-height: 1.12;
  }

  .registry-plugin-changelog__prose :global(h2),
  .registry-plugin-changelog__prose :global(h3) {
    margin-top: 0.75rem;
    color: var(--foreground);
    font-size: var(--community-text-section);
    font-weight: 760;
    line-height: 1.2;
  }

  .registry-plugin-changelog__prose :global(ul),
  .registry-plugin-changelog__prose :global(ol) {
    display: grid;
    gap: 0.45rem;
    padding-inline-start: 1.65rem;
  }

  .registry-plugin-changelog__prose :global(li::marker) {
    color: color-mix(in srgb, var(--muted-foreground) 76%, transparent);
  }

  .registry-plugin-changelog__prose :global(code) {
    border-radius: calc(var(--radius) * 0.6);
    background: color-mix(in srgb, var(--muted) 76%, transparent);
    color: color-mix(in srgb, var(--foreground) 72%, var(--muted-foreground));
    padding: 0.08em 0.28em;
  }

  .registry-plugin-changelog__tags {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  @media (max-width: 34rem) {
    .registry-plugin-changelog__header {
      align-items: flex-start;
      flex-direction: column;
    }
  }
</style>
