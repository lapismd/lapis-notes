<script lang="ts">
  import AlertTriangle from "@lucide/svelte/icons/alert-triangle";
  import CheckCircle2 from "@lucide/svelte/icons/check-circle-2";
  import ShieldAlert from "@lucide/svelte/icons/shield-alert";

  let {
    label,
    reason,
    tone = "neutral",
  }: {
    label: string;
    reason?: string;
    tone?: "neutral" | "success" | "warning" | "danger";
  } = $props();
</script>

<div
  class="lapis-plugin-registry-status"
  data-ui-component="plugin-registry-status"
  data-status-tone={tone}
>
  <span class="lapis-plugin-registry-status__label">
    {#if tone === "success"}
      <CheckCircle2 aria-hidden="true" />
    {:else if tone === "danger"}
      <ShieldAlert aria-hidden="true" />
    {:else if tone === "warning"}
      <AlertTriangle aria-hidden="true" />
    {/if}
    {label}
  </span>
  {#if reason}<span class="lapis-plugin-registry-status__reason">{reason}</span>{/if}
</div>
