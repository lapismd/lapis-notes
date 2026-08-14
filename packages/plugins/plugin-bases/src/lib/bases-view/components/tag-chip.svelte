<script lang="ts">
  let {
    class: className,
    name,
    value,
    hrefPrefix = "#",
    target = "_blank",
    rel = "noopener nofollow",
    ...props
  }: {
    class?: string;
    name?: string;
    value?: string;
    hrefPrefix?: string;
    target?: string;
    rel?: string;
    [key: string]: unknown;
  } = $props();

  let label = $derived((name ?? value ?? "").toString());
  let parts = $derived(
    label
      .replace(/^#/, "")
      .split("/")
      .filter((part) => part.trim()),
  );
  let segments = $derived.by(() =>
    parts.map((segment, index) => ({
      name: segment,
      path: parts.slice(0, index + 1).join("/"),
    })),
  );
</script>

<span
  class={["bases-tag", className].filter(Boolean).join(" ")}
  data-ui-component="bases-tag"
  data-ui-part="root"
>
  <span aria-hidden="true" data-ui-part="hash">#</span>
  {#each segments as segment, index}
    {#if index > 0}<span aria-hidden="true" data-ui-part="separator">/</span>{/if}
    <a href={hrefPrefix + segment.path} {target} {rel} {...props}>
      {segment.name}
    </a>
  {/each}
</span>
