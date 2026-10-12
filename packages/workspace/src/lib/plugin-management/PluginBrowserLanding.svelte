<script lang="ts">
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import PackageIcon from "@lucide/svelte/icons/package";

  import { landingSections as registryLandingSections } from "./plugin-browser-model";
  import type { PluginCatalogEntry as RegistryCatalogEntry } from "@lapis-notes/api";
  import RegistryPluginCard from "./PluginBrowserCard.svelte";
  import { registryFilterIcon } from "./community-presentation/registry-filter-icons";

  let {
    plugins,
    updateIds,
    onOpenUpdates,
    onOpenDirectory,
    onOpenPlugin,
    onOpenCategory,
  }: {
    plugins: readonly RegistryCatalogEntry[];
    updateIds: ReadonlySet<string>;
    onOpenUpdates: () => void;
    onOpenDirectory: () => void;
    onOpenPlugin: (plugin: RegistryCatalogEntry) => void;
    onOpenCategory: (category: string) => void;
  } = $props();

  const sections = $derived(registryLandingSections(plugins, updateIds));

  function interceptNavigation(event: MouseEvent, action: () => void): void {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    action();
  }
</script>

<div class="registry-landing">
  <header class="registry-landing__hero">
    <span class="registry-landing__eyebrow"
      ><PackageIcon aria-hidden="true" /> Plugin registry</span
    >
    <h1>Make Lapis Notes yours.</h1>
    <p>
      Browse {plugins.length} plugins built for Lapis Notes by the community.
    </p>
  </header>

  {#if sections.updates.length}
    <section
      class="registry-landing__section"
      aria-labelledby="registry-landing-updates"
    >
      <a
        class="registry-landing__section-link"
        href="#/registry/plugins?updates"
        onclick={(event) => interceptNavigation(event, onOpenUpdates)}
      >
        <h2 id="registry-landing-updates">Updates</h2>
        <ChevronRightIcon aria-hidden="true" />
      </a>
      <div class="registry-landing__updates">
        {#each sections.updates as plugin (plugin.id)}
          <RegistryPluginCard
            {plugin}
            variant="compact"
            onOpen={onOpenPlugin}
          />
        {/each}
      </div>
    </section>
  {/if}

  <section
    class="registry-landing__section"
    aria-labelledby="registry-landing-plugins"
  >
    <a
      class="registry-landing__section-link"
      href="#/registry/plugins"
      onclick={(event) => interceptNavigation(event, onOpenDirectory)}
    >
      <h2 id="registry-landing-plugins">Plugins</h2>
      <ChevronRightIcon aria-hidden="true" />
    </a>
    <div class="registry-landing__lanes">
      <section>
        <a
          class="registry-landing__lane-link"
          href="#/registry/plugins"
          onclick={(event) => interceptNavigation(event, onOpenDirectory)}
        >
          Featured <ChevronRightIcon aria-hidden="true" />
        </a>
        <div class="registry-landing__list">
          {#each sections.featured.slice(0, 5) as plugin (plugin.id)}
            <RegistryPluginCard
              {plugin}
              variant="compact"
              onOpen={onOpenPlugin}
            />
          {/each}
        </div>
      </section>
      <section>
        <a
          class="registry-landing__lane-link"
          href="#/registry/plugins"
          onclick={(event) => interceptNavigation(event, onOpenDirectory)}
        >
          New <ChevronRightIcon aria-hidden="true" />
        </a>
        <div class="registry-landing__list">
          {#each sections.newlyReleased as plugin (plugin.id)}
            <RegistryPluginCard
              {plugin}
              variant="compact"
              onOpen={onOpenPlugin}
            />
          {/each}
        </div>
      </section>
      <section>
        <a
          class="registry-landing__lane-link"
          href="#/registry/plugins"
          onclick={(event) => interceptNavigation(event, onOpenDirectory)}
        >
          Recently updated <ChevronRightIcon aria-hidden="true" />
        </a>
        <div class="registry-landing__list">
          {#each sections.recentlyUpdated as plugin (plugin.id)}
            <RegistryPluginCard
              {plugin}
              variant="compact"
              onOpen={onOpenPlugin}
            />
          {/each}
        </div>
      </section>
    </div>
  </section>

  <section
    class="registry-landing__section"
    aria-labelledby="registry-landing-categories"
  >
    <a
      class="registry-landing__section-link"
      href="#/registry/plugins"
      onclick={(event) => interceptNavigation(event, onOpenDirectory)}
    >
      <h2 id="registry-landing-categories">Categories</h2>
      <ChevronRightIcon aria-hidden="true" />
    </a>
    <div class="registry-landing__categories">
      {#each sections.categories as category (category.id)}
        {@const CategoryIcon = registryFilterIcon(category.id)}
        <a
          href="#/registry/plugins"
          aria-label={`${category.label}, ${category.count} plugin${category.count === 1 ? "" : "s"}`}
          onclick={(event) =>
            interceptNavigation(event, () => onOpenCategory(category.id))}
        >
          <CategoryIcon aria-hidden="true" />
          <strong>{category.label}</strong>
          <span>{category.count}</span>
        </a>
      {/each}
    </div>
  </section>
</div>

<style>
  .registry-landing {
    display: grid;
    gap: clamp(2.5rem, 7cqi, 5rem);
    min-width: 0;
    width: min(100%, 76rem);
    margin-inline: auto;
    padding: clamp(2rem, 6cqi, 5rem) clamp(1rem, 4cqi, 3rem);
  }

  .registry-landing__hero {
    display: grid;
    justify-items: center;
    gap: 0.85rem;
    padding-block: clamp(2rem, 8cqi, 5rem);
    text-align: center;
  }

  .registry-landing__eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--primary);
    font-size: var(--community-text-secondary);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .registry-landing__eyebrow :global(svg) {
    width: 1rem;
  }

  h1,
  h2,
  p {
    margin: 0;
  }

  h1 {
    max-width: 15ch;
    font-size: var(--community-text-page);
    line-height: 0.96;
    letter-spacing: -0.05em;
  }

  .registry-landing__hero p {
    color: var(--muted-foreground);
    font-size: var(--community-text-section);
  }

  .registry-landing__section {
    display: grid;
    gap: 1.25rem;
  }

  .registry-landing__section-link,
  .registry-landing__lane-link {
    display: inline-flex;
    width: fit-content;
    align-items: center;
    gap: 0.25rem;
    border: 0;
    padding: 0;
    color: inherit;
    background: none;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
  }

  .registry-landing__section-link :global(svg) {
    width: 1.4rem;
  }

  .registry-landing__lane-link {
    margin-bottom: 0.25rem;
  }

  .registry-landing__lane-link :global(svg) {
    width: 1rem;
  }

  .registry-landing__section-link:hover,
  .registry-landing__lane-link:hover {
    color: var(--primary);
  }

  .registry-landing__lanes,
  .registry-landing__updates {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: clamp(1.5rem, 4cqi, 3rem);
  }

  .registry-landing__list {
    display: grid;
    min-width: 0;
  }

  .registry-landing__categories {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .registry-landing__categories a {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.75rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1rem;
    color: var(--foreground);
    background: var(--card);
    text-align: start;
    cursor: pointer;
    text-decoration: none;
  }

  .registry-landing__categories a:hover,
  .registry-landing__categories a:focus-visible {
    border-color: color-mix(in srgb, var(--primary) 45%, var(--border));
    background: var(--accent);
    outline: none;
  }

  .registry-landing__categories a > span {
    color: var(--muted-foreground);
    font-variant-numeric: tabular-nums;
  }

  .registry-landing__categories a > strong {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .registry-landing__categories a :global(svg) {
    width: 1.4rem;
    height: 1.4rem;
    color: var(--muted-foreground);
  }

  @container plugin-browser (max-width: 58rem) {
    .registry-landing__lanes,
    .registry-landing__updates {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .registry-landing__categories {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @container plugin-browser (max-width: 38rem) {
    .registry-landing__lanes,
    .registry-landing__updates,
    .registry-landing__categories {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
