<script lang="ts">
  import { Skeleton } from "@lapismd/design-core/shadcn/skeleton";
  import * as Empty from "@lapismd/design-core/shadcn/empty";
  import ImageOff from "@lucide/svelte/icons/image-off";
  import type { Snippet } from "svelte";
  import type { HTMLImgAttributes } from "svelte/elements";

  import { fetchVerifiedPluginImage } from "@lapis-notes/api";
  import type { RegistryImageReference } from "./model-adapter";

  let {
    reference,
    alt,
    fallback,
    width,
    height,
    loading,
    class: className,
  }: {
    reference: RegistryImageReference;
    alt: string;
    fallback?: Snippet;
    width?: HTMLImgAttributes["width"];
    height?: HTMLImgAttributes["height"];
    loading?: HTMLImgAttributes["loading"];
    class?: HTMLImgAttributes["class"];
  } = $props();

  const loader = (
    reference: RegistryImageReference,
    options: { signal: AbortSignal },
  ) => fetchVerifiedPluginImage(reference, fetch, options.signal);
  let resolvedUrl = $state("");
  let failed = $state(false);
  let decoded = $state(false);
  let observedElement = $state<HTMLElement>();
  let inView = $state(false);

  $effect(() => {
    if (loader === undefined || loading !== "lazy") {
      inView = true;
      return;
    }
    const element = observedElement;
    if (element === undefined || typeof IntersectionObserver === "undefined") {
      inView = true;
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) inView = true;
      },
      { rootMargin: "240px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  });

  $effect(() => {
    const current = reference;
    if (loader === undefined) {
      resolvedUrl = current.url;
      failed = false;
      return;
    }
    if (!inView) return;

    const controller = new AbortController();
    let active = true;
    let objectUrl = "";
    resolvedUrl = "";
    failed = false;
    decoded = false;
    void loader(current, { signal: controller.signal })
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        resolvedUrl = objectUrl;
      })
      .catch((cause: unknown) => {
        if (
          active &&
          (!(cause instanceof DOMException) || cause.name !== "AbortError")
        ) {
          failed = true;
        }
      });

    return () => {
      active = false;
      controller.abort();
      if (objectUrl !== "") URL.revokeObjectURL(objectUrl);
    };
  });
</script>

<div
  bind:this={observedElement}
  class={["registry-verified-image", className].filter(Boolean).join(" ")}
  data-image-state={failed ? "failed" : decoded ? "loaded" : "loading"}
  style:aspect-ratio={width && height ? `${width} / ${height}` : undefined}
  role={!decoded && alt ? "img" : undefined}
  aria-label={!decoded && alt
    ? `${alt}${failed ? " unavailable" : " loading"}`
    : undefined}
  aria-busy={!decoded && !failed ? "true" : undefined}
>
  {#if resolvedUrl && !failed}
    <img
      src={resolvedUrl}
      {alt}
      {width}
      {height}
      loading="eager"
      class:decoded
      onload={() => (decoded = true)}
      onerror={() => {
        failed = true;
        decoded = false;
      }}
    />
  {/if}
  {#if failed}
    {#if fallback}{@render fallback()}{:else}
      <Empty.Root
        class="registry-verified-image__empty"
        aria-hidden={alt === "" ? "true" : undefined}
      >
        <Empty.Header>
          <Empty.Media variant="icon"
            ><ImageOff aria-hidden="true" /></Empty.Media
          >
          {#if alt}<Empty.Title>Image unavailable</Empty.Title>{/if}
        </Empty.Header>
      </Empty.Root>
    {/if}
  {:else if !decoded}
    <Skeleton class="registry-verified-image__skeleton" aria-hidden="true" />
  {/if}
</div>

<style>
  .registry-verified-image {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 2rem;
    overflow: hidden;
    border-radius: inherit;
  }
  .registry-verified-image > img {
    grid-area: 1 / 1;
    display: block;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    opacity: 0;
  }
  .registry-verified-image > img.decoded {
    opacity: 1;
  }
  .registry-verified-image :global(.registry-verified-image__skeleton),
  .registry-verified-image :global(.registry-verified-image__empty) {
    grid-area: 1 / 1;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
  }
  .registry-verified-image :global(.registry-verified-image__empty) {
    padding: 0.5rem;
    background: var(--muted);
    color: var(--muted-foreground);
  }
</style>
