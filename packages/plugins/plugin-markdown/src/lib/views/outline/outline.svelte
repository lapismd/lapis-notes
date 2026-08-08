<script lang="ts">
  import { FileView, type App } from "@lapis-notes/api";
  import type { OutlineView } from ".";
  import { leafInSidebar, resolvePanelTargetFile } from "../panel-target-file";
  import MarkdownSidebarPanel from "../sidebar-panel/markdown-sidebar-panel.svelte";

  let {
    app,
    view,
  }: {
    app: App;
    view: OutlineView;
  } = $props();

  const inSidebar = $derived(leafInSidebar(view.leaf));

  let query = $state("");

  const headings = $derived.by(() => {
    const file = resolvePanelTargetFile(app);
    const path = file?.path;
    if (!path) return [];
    const cache = app.metadataCache.getCache(path);
    const list = cache?.headings ?? [];
    const q = query.trim().toLowerCase();
    return list.filter(
      (heading) => !q || heading.heading.toLowerCase().includes(q),
    );
  });

  function jumpTo(line: number) {
    let editorLeaf = app.workspace.activeLeaf;
    if (!(editorLeaf?.view instanceof FileView)) {
      app.workspace.iterateRootLeaves((leaf) => {
        if (leaf.view instanceof FileView && leaf.view.file) {
          editorLeaf = leaf;
        }
      });
    }
    const editor =
      editorLeaf?.view && "editor" in editorLeaf.view
        ? (
            editorLeaf.view as {
              editor?: {
                setCursor?: (pos: { line: number; ch: number }) => void;
              };
            }
          ).editor
        : null;
    editor?.setCursor?.({ line, ch: 0 });
  }
</script>

<MarkdownSidebarPanel
  title="Outline"
  testId="outline-panel"
  component="outline"
  {inSidebar}
  searchPlaceholder="Search headings"
  bind:query
>
  <ul class="markdown-sidebar-panel__list">
    {#each headings as heading, index (`${heading.heading}-${index}`)}
      <li class="markdown-sidebar-panel__item">
        <button
          type="button"
          class="markdown-sidebar-panel__row"
          data-outline-level={heading.level}
          style={`--outline-level: ${Math.max(0, heading.level - 1)}`}
          onclick={() => jumpTo(heading.position.start.line)}
        >
          <span class="markdown-sidebar-panel__row-label">{heading.heading}</span>
        </button>
      </li>
    {:else}
      <li class="markdown-sidebar-panel__empty">
        No headings in the active file.
      </li>
    {/each}
  </ul>
</MarkdownSidebarPanel>
