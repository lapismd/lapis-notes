<script lang="ts">
  import { getSvg } from "../../icons";
  let {
    name,
    class: className,
  }: {
    name: string | string[];
    class?: string;
  } = $props();
  let svgContent = $derived(getSvg(name, {class: className}));
</script>

{#await svgContent then svg}
  {@html svg}
{/await}
