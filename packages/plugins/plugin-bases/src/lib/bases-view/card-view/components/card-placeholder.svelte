<script lang="ts">
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import type { BasesView } from "../../bases.svelte";
  import { toNumber } from "..";

  let {
    view,
  }: {
    view: BasesView;
  } = $props();
  let queryResults = $derived(view.data);
  let cardSize: number = $derived(toNumber(view.config.get("cardSize")) || 0);
  let imageAspectRatio: number = $derived(
    toNumber(view.config.get("imageAspectRatio")) || 1,
  );
  let imageFit = $derived(view.config.get("imageFit") || "contain");
  let imageSize: number = $derived.by(() => {
    if (!view.config.get("image")) {
      return 0;
    }
    return cardSize * imageAspectRatio;
  });

  let cardHeight = $derived.by(() => {
    return view.config.getOrder().length * 56 + 17 + imageSize + 28;
  });
</script>

<div
  class="bases-card-grid bases-style-h-full-668b21 bases-style-w-full-6da6a3 bases-style-flex-grow-95a3df bases-style-overflow-auto-73fc3f bases-style-pb-16-db15dd bases-style-pl-5-151215"
  style={`scrollbar-gutter: stable; transform: translate3d(0,0,0);`}
>
  <div class="bases-style-flex-60fbb7 bases-style-w-full-6da6a3 bases-style-items-center-3960ff bases-style-justify-center-86843c">
    <div class="loader"></div>
  </div>
  <div class="bases-style-flex-60fbb7 bases-style-flex-wrap-1eb5c6 bases-style-gap-2-77a2a2">
    {#each queryResults.data as record}
      <div
        style={`width: ${cardSize}}px; height: ${cardHeight}px;`}
        class="bases-card-placeholder bases-style-w-full-6da6a3 bases-style-overflow-hidden-2cd02d bases-style-rounded-lg-5f22e6 border bases-style-text-sm-fc7473 bases-style-whitespace-nowrap-e82ae8"
      >
        <div class="bases-style-h-full-668b21 bases-style-w-full-6da6a3">
          {#if imageSize}
            <div
              class="bases-card__image bases-style-rounded-t-lg-bc0d7f"
              style={`height: ${imageSize}px; background-size: ${imageFit}`}
            ></div>
          {/if}

          {#each view.config.getOrder() as o}
            <div class="bases-style-grid-f3c543 bases-style-grid-cols-1-d7c833 bases-style-items-center-3960ff bases-style-gap-2-77a2a2 bases-style-px-2-d5eab2 bases-style-pt-2-f46b61">
              <div
                class="bases-card-placeholder__label bases-style-overflow-hidden-2cd02d bases-style-text-ellipsis-6e2e11 bases-style-whitespace-nowrap-e82ae8"
              >
                <Skeleton class="bases-style-h-20px-fa9795 bases-style-w-full-6da6a3" />
              </div>
              <div
                class="bases-style-h-full-668b21 bases-style-w-full-6da6a3 bases-style-overflow-hidden-2cd02d bases-style-text-ellipsis-6e2e11 bases-style-whitespace-nowrap-e82ae8"
              >
                <Skeleton class="bases-style-h-28px-d8acda bases-style-w-full-6da6a3" />
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>
