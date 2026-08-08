<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import { MarkdownSidebarPanel } from "@lapis-notes/markdown";
  import type { TagsView } from "./index";

  let {
    app,
    view,
  }: {
    app: App;
    view: TagsView;
  } = $props();

  const inSidebar = $derived(
    Boolean(
      (view.leaf.parent as { inSideBar?: () => boolean } | undefined)?.inSideBar?.(),
    ),
  );

  let query = $state("");

  const tags = $derived.by(() => {
    const values: Record<string, number> = {};
    for (const [, cache] of app.metadataCache.getAllItems().entries()) {
      for (const tag of cache.tags ?? []) {
        const name = tag.tag.startsWith("#") ? tag.tag : `#${tag.tag}`;
        values[name] = (values[name] ?? 0) + 1;
      }
      const frontmatterTags = cache.frontmatter?.tags;
      const list = Array.isArray(frontmatterTags)
        ? frontmatterTags
        : typeof frontmatterTags === "string"
          ? [frontmatterTags]
          : [];
      for (const tag of list) {
        const name = String(tag).startsWith("#")
          ? String(tag)
          : `#${String(tag)}`;
        values[name] = (values[name] ?? 0) + 1;
      }
    }
    const q = query.trim().toLowerCase();
    return Object.entries(values)
      .map(([tag, count]) => ({ tag, count }))
      .filter((entry) => !q || entry.tag.toLowerCase().includes(q))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  });
</script>

<MarkdownSidebarPanel
  title="Tags"
  testId="tags-panel"
  component="tags"
  {inSidebar}
  searchPlaceholder="Search tags"
  bind:query
>
  <ul class="markdown-sidebar-panel__list">
    {#each tags as entry (entry.tag)}
      <li class="markdown-sidebar-panel__item">
        <div class="markdown-sidebar-panel__row">
          <span class="markdown-sidebar-panel__row-label">{entry.tag}</span>
          <span class="markdown-sidebar-panel__row-meta">{entry.count}</span>
        </div>
      </li>
    {:else}
      <li class="markdown-sidebar-panel__empty">No tags in this vault yet.</li>
    {/each}
  </ul>
</MarkdownSidebarPanel>
