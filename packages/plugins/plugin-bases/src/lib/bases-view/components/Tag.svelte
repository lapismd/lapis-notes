<script lang="ts">
  import Tag from "./tag-chip.svelte";

  let {
    class: className,
    name,
    ...props
  }: {
    class?: string;
    name: string;
  } = $props();
</script>

<Tag class={className} {name} {...props} />
