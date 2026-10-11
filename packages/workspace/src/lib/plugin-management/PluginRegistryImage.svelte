<script lang="ts">
  import {
    fetchVerifiedPluginImage,
    type RegistryMediaV2,
    resolveRegistryMedia,
  } from "@lapis-notes/api";
  let {
    media,
    variant = "preview",
  }: {
    media: RegistryMediaV2;
    variant?: "preview" | "full" | "light" | "dark";
  } = $props();
  let imageUrl = $state<string | null>(null);
  let error = $state(false);
  $effect(() => {
    const reference = resolveRegistryMedia(media, variant);
    const controller = new AbortController();
    let ownedUrl: string | null = null;
    imageUrl = null;
    error = false;
    void fetchVerifiedPluginImage(reference, fetch, controller.signal)
      .then((blob) => {
        if (controller.signal.aborted) return;
        ownedUrl = URL.createObjectURL(blob);
        imageUrl = ownedUrl;
      })
      .catch(() => {
        if (!controller.signal.aborted) error = true;
      });
    return () => {
      controller.abort();
      if (ownedUrl) URL.revokeObjectURL(ownedUrl);
    };
  });
</script>

{#if imageUrl}<img src={imageUrl} alt={media.alt} loading="lazy" />
{:else}<p role="status">
    {error ? "Verified image unavailable" : "Loading image…"}
  </p>{/if}

<style>
  img {
    display: block;
    max-width: 100%;
    height: auto;
    border-radius: var(--radius);
  }
</style>
