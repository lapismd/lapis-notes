<script lang="ts">
  import Globe2 from "@lucide/svelte/icons/globe-2";
  import Monitor from "@lucide/svelte/icons/monitor";
  import ShieldCheck from "@lucide/svelte/icons/shield-check";
  import Tag from "@lucide/svelte/icons/tag";
  import UsersRound from "@lucide/svelte/icons/users-round";
  import * as Badge from "@lapismd/design-core/shadcn/badge";

  export type PluginRegistryBadgeTone =
    | "neutral"
    | "official"
    | "community"
    | "category"
    | "web"
    | "desktop"
    | "danger";

  let {
    label,
    tone = "neutral",
  }: { label: string; tone?: PluginRegistryBadgeTone } = $props();
</script>

<Badge.Badge
  class="lapis-plugin-registry-badge"
  data-registry-badge-tone={tone}
  variant={tone === "danger" ? "destructive" : "outline"}
>
  {#if tone === "official"}
    <ShieldCheck aria-hidden="true" />
  {:else if tone === "community"}
    <UsersRound aria-hidden="true" />
  {:else if tone === "category"}
    <Tag aria-hidden="true" />
  {:else if tone === "web"}
    <Globe2 aria-hidden="true" />
  {:else if tone === "desktop"}
    <Monitor aria-hidden="true" />
  {/if}
  {label}
</Badge.Badge>
