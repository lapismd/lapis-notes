<script lang="ts">
  import type { App } from "@lapis-notes/api";
  import type { BacklinksView } from "../backlinks";
  import type { OutgoingLinksView } from "../outgoing-links";
  import { leafInSidebar, resolvePanelTargetFile } from "../panel-target-file";
  import MarkdownSidebarPanel from "../sidebar-panel/markdown-sidebar-panel.svelte";

  type LinkSidebarMode = "backlinks" | "outgoing";

  let {
    app,
    view,
    mode,
  }: {
    app: App;
    view: BacklinksView | OutgoingLinksView;
    mode: LinkSidebarMode;
  } = $props();

  const inSidebar = $derived(leafInSidebar(view.leaf));

  const activeFile = $derived.by(() => resolvePanelTargetFile(app));

  const links = $derived.by(() => {
    const file = activeFile;
    if (!file) return [] as Array<{ path: string; label: string }>;

    if (mode === "outgoing") {
      const cache = app.metadataCache.getFileCache(file);
      const refs = cache?.links ?? [];
      return refs.map((ref) => {
        const resolved =
          app.metadataCache.getFirstLinkpathDest(ref.link, file.path) ?? null;
        return {
          path: resolved?.path ?? ref.link,
          label: ref.displayText || ref.link,
        };
      });
    }

    return app.metadataCache
      .getDirectReferencingPaths(file.path)
      .map((path) => ({
        path,
        label: path.split("/").pop() ?? path,
      }));
  });

  function openPath(path: string) {
    const abstract = app.vault.getAbstractFileByPath(path);
    if (abstract && "extension" in abstract) {
      void app.workspace.openLinkText(path, "", false);
    }
  }

  const title = $derived(mode === "backlinks" ? "Backlinks" : "Outgoing links");
  const testId = $derived(
    mode === "backlinks" ? "backlinks-panel" : "outgoing-links-panel",
  );
  const component = $derived(
    mode === "backlinks" ? "backlinks" : "outgoing-links",
  );
</script>

<MarkdownSidebarPanel
  {title}
  {testId}
  {component}
  {inSidebar}
  meta={activeFile?.path ?? "No active file"}
>
  <ul class="markdown-sidebar-panel__list">
    {#each links as link (`${link.path}-${link.label}`)}
      <li class="markdown-sidebar-panel__item">
        <button
          type="button"
          class="markdown-sidebar-panel__row"
          onclick={() => openPath(link.path)}
        >
          <span class="markdown-sidebar-panel__row-label">{link.label}</span>
        </button>
      </li>
    {:else}
      <li class="markdown-sidebar-panel__empty">
        {mode === "backlinks"
          ? "No backlinks found."
          : "No outgoing links found."}
      </li>
    {/each}
  </ul>
</MarkdownSidebarPanel>
