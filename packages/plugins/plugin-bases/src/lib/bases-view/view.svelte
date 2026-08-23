<script lang="ts">
  import { type App, type Component } from "@lapis-notes/api";
  import type { BasesDocument } from "./models";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import { onMount, untrack } from "svelte";
  import {
    BasesViewConfig,
    type BasesViewRegistration,
    QueryController,
  } from "./bases.svelte";
  import { createBasesViewRegistrations } from ".";
  import ViewHeader from "./view-header.svelte";
  import Search from "@lucide/svelte/icons/search";
  import X from "@lucide/svelte/icons/x";

  let {
    registrations,
    app,
    document,
    onChange,
    host = null,
    readOnly = false,
    showHeader = true,
  }: {
    app: App;
    registrations?: ReadonlyMap<string, BasesViewRegistration>;
    document: BasesDocument;
    onChange?: (doc: BasesDocument) => void;
    host?: Component | null;
    readOnly?: boolean;
    showHeader?: boolean;
  } = $props();

  let contentEl: HTMLElement = $state()!;
  let searchInput: HTMLInputElement | null = $state(null);

  let queryController: QueryController = $state(
    untrack(
      () =>
        new QueryController(
          app,
          document,
          createBasesViewRegistrations(app, registrations),
          onChange ?? (() => {}),
          readOnly,
        ),
    ),
  );
  let controllerLoaded = $state(false);
  let componentHost = $derived(host ?? queryController);
  let basesView: BasesViewRegistration | null | undefined = $derived(
    queryController.viewConfig,
  );

  $effect(() => {
    if (
      !controllerLoaded ||
      !basesView ||
      !contentEl ||
      !queryController.selectedView
    ) {
      return;
    }

    const renderer = basesView.factory(queryController, contentEl);
    queryController.view = renderer;
    componentHost.addChild(renderer);

    return () => {
      componentHost.removeChild(renderer);
      renderer.unload();
    };
  });

  $effect(() => {
    if (!queryController.view || !queryController.selectedView) {
      return;
    }

    queryController.view.config = new BasesViewConfig(
      queryController.selectedView,
      queryController.columns,
    );
  });

  let show = $state(false);
  onMount(() => {
    queryController.load();
    controllerLoaded = true;
    setTimeout(() => {
      show = true;
    });

    return () => {
      controllerLoaded = false;
      queryController.unload();
    };
  });

  $effect(() => {
    if (!queryController.searchPanelOpen || !searchInput) return;
    searchInput.focus();
    searchInput.select();
  });

  let activeSearchQuery = $derived(queryController.searchQuery.trim());

  function clearSearch() {
    queryController.searchQuery = "";
    searchInput?.focus();
  }
</script>

<div
  class="bases-view bases-style-flex-60fbb7 bases-style-h-full-668b21 bases-style-min-h-0-fb7302 bases-style-w-full-6da6a3 bases-style-flex-col-8dddea"
  data-ui-component="bases-view"
  data-ui-part="root"
  data-slot="bases-view"
  data-type={queryController.selectedView?.type}
  data-read-only={readOnly ? "true" : "false"}
>
  {#if showHeader}
    <ViewHeader bind:controller={queryController} />
  {/if}
  {#if queryController.searchPanelOpen}
    <div class="bases-view__search-panel bases-style-border-b-65fdba bases-style-px-2-d5eab2 bases-style-pb-2-f4cc51">
      <div class="relative">
        <Search
          class="bases-view__search-icon absolute bases-style-top-1-2-d694ba bases-style-left-3-22e59b bases-style-size-4-f7b5fa -translate-y-1/2"
        />
        <Input
          bind:ref={searchInput}
          bind:value={queryController.searchQuery}
          class="bases-style-h-10-426b8b bases-style-w-full-6da6a3 bases-style-pr-36-180815 bases-style-pl-9-9e83b2"
          placeholder="Find..."
        />
        {#if activeSearchQuery}
          <div
            class="bases-view__search-summary absolute bases-style-top-1-2-d694ba bases-style-right-2-7b2d63 bases-style-flex-60fbb7 -translate-y-1/2 bases-style-items-center-3960ff bases-style-gap-3-1004c0 bases-style-rounded-full-ac204c border bases-style-px-3-0e17f2 bases-style-py-1-660d2e bases-style-text-sm-fc7473"
          >
            <span>Showing {queryController.searchCount}</span>
            <button
              type="button"
              class="bases-view__search-clear bases-style-inline-flex-52083e bases-style-size-5-add63b bases-style-items-center-3960ff bases-style-justify-center-86843c bases-style-rounded-full-ac204c bases-style-transition-colors-ceb69a"
              aria-label="Clear search"
              onclick={clearSearch}
            >
              <X class="bases-style-size-4-f7b5fa" />
            </button>
          </div>
        {/if}
      </div>
    </div>
  {/if}
  {#if queryController.loadError}
    <div class="bases-view__query-error" role="alert">
      <p>Unable to load indexed metadata: {queryController.loadError}</p>
      <button type="button" onclick={() => void queryController.reload()}>
        Retry
      </button>
    </div>
  {:else if show}
    <div
      class="bases-view__content bases-style-min-h-0-fb7302 bases-style-w-full-6da6a3 bases-style-flex-1-36e579"
      bind:this={contentEl}
    ></div>
  {:else}
    <div class="bases-view__loading bases-style-flex-60fbb7 bases-style-flex-1-36e579 bases-style-items-center-3960ff bases-style-justify-center-86843c">
      <div class="loader"></div>
    </div>
  {/if}
</div>

<style>
  .bases-view__query-error {
    align-items: center;
    color: var(--destructive, currentColor);
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.75rem;
    justify-content: center;
    padding: 1rem;
    text-align: center;
  }

  .bases-view__query-error button {
    border: 1px solid currentColor;
    border-radius: 0.375rem;
    padding: 0.375rem 0.75rem;
  }
</style>
