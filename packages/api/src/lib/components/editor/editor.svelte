<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { type Editor as EditorApi } from "../../editor.svelte";
  import { dirname } from "../../storage/path";
  import { WorkspaceLeaf } from "../../workspace.svelte";
  import { editorConfig } from "./editor";
  import { syncInlineTitleAlignment } from "./inline-title-alignment";
  import { ScrollArea } from "@lapismd/design-core/shadcn/scroll-area";
  import { cn } from "../../utils";
  import type { App } from "../../context.svelte";
  import { useApplicationState } from "../../application-state.svelte";
  import "@lapismd/mira/themes/obsidian.css";
  import "./editor.css";

  type Props = {
    app?: App;
    leaf?: WorkspaceLeaf;
    editor: EditorApi;
    class?: string;
    scrollOwner?: "self" | "ancestor";
  };

  let {
    app: providedApplication,
    leaf,
    editor,
    class: className = "",
    scrollOwner = "self",
  }: Props = $props();
  const ownership = untrack(() => ({ providedApplication, leaf, editor }));
  const app = useApplicationState(
    ownership.providedApplication ?? ownership.leaf?.application,
  );
  ownership.editor.bindApplication(app);
  let file = $derived(editor.file);
  let isMobileWorkspace = $derived(app.workspace.displayMode === "mobile");
  let showInlineTitle = $derived(
    app.configuration
      .getConfiguration()
      .get("appearence.interface.showInlineTitle"),
  );
  let shouldShowDesktopInlineTitle = $derived(
    showInlineTitle && !isMobileWorkspace,
  );
  let shouldShowMobileInlineTitle = $derived(
    isMobileWorkspace && file !== null,
  );

  let spellcheck = $derived(
    app.configuration
      .getConfiguration()
      .get("editor.behaviour.spellCheck", false),
  );
  const codeMirror = (node: HTMLDivElement) => {
    let focusTimeout: ReturnType<typeof setTimeout> | null = null;
    const root = node.getRootNode();
    if (root.nodeType === 9 || root.nodeType === 11) {
      editor.view.setRoot(root as Document | ShadowRoot);
    }
    node.append(editor.view.dom);
    const stopTitleAlignment = syncInlineTitleAlignment(editor.view, node);
    focusTimeout = setTimeout(() => {
      editor.view.focus();
    });

    return {
      update(qs: string) {},
      destroy() {
        stopTitleAlignment();
        if (focusTimeout !== null) {
          clearTimeout(focusTimeout);
          focusTimeout = null;
        }
      },
    };
  };

  function editorConfigUpdated({ key, value }: { key: string; value: any }) {
    editorConfig.update(editor.view, key, value, app);
  }

  onMount(() => {
    const trackChanges = editor.trackChanges();
    const configUpdated = app.configuration.on("updated", editorConfigUpdated);
    return () => {
      trackChanges();
      app.configuration.offref(configUpdated);
    };
  });

  function renameFile(name: string | null) {
    if (editor.editingProtected) return;
    if (name && editor.file && name !== editor.file.name) {
      const path = `${dirname(editor.file.path)}/${name}.${editor.file.extension}`;
      app.fileManager.renameFile(editor.file, path);
    }
  }

  function titleText(node: HTMLDivElement, name: string) {
    const update = (value: string) => {
      // Native contenteditable input can replace Svelte's original text node.
      // Project committed filenames onto the element, including after renames.
      if (node.textContent !== value) node.textContent = value;
    };
    update(name);
    return { update };
  }

  function renameDone(evt: KeyboardEvent) {
    if (evt.key == "Enter") {
      // Focusing the editor commits through onfocusout. Starting another rename
      // here races that same file operation against its original source path.
      editor.view.focus();
      evt.preventDefault();
    }
  }
</script>

{#snippet editorContent()}
  <div
    class={cn(
      "cm-editor-scroll-area-content markdown-editor-surface",
      className,
    )}
    data-ui-component="editor"
    data-ui-part="scroll-content"
    data-mira-theme="obsidian"
  >
    <div
      class="cm-editor-scroll-area-inner"
      data-ui-component="editor"
      data-ui-part="scroll-inner"
    >
      <div class="cm-scroller">
        <div class="cm-sizer">
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          {#if shouldShowDesktopInlineTitle && file}
            <div
              use:titleText={file?.name ?? ""}
              onkeydown={renameDone}
              onfocusout={(evt) =>
                renameFile((evt.target as HTMLDivElement).getText())}
              class="inline-title cm-editor-inline-title"
              contenteditable={!editor.editingProtected}
              {spellcheck}
              autocapitalize="on"
              tabindex="-1"
              enterkeyhint="done"
            ></div>
          {/if}
          {#if shouldShowMobileInlineTitle && file}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              use:titleText={file?.name ?? ""}
              onkeydown={renameDone}
              onfocusout={(evt) =>
                renameFile((evt.target as HTMLDivElement).getText())}
              class="inline-title cm-editor-inline-title"
              data-mobile-inline-title="true"
              data-mobile-inline-title-input="true"
              aria-label="Active note title"
              contenteditable={!editor.editingProtected}
              {spellcheck}
              autocapitalize="on"
              tabindex="-1"
              enterkeyhint="done"
            ></div>
          {/if}
          <div use:codeMirror class="cm-editor-content"></div>
        </div>
      </div>
    </div>
  </div>
{/snippet}

{#if scrollOwner === "self"}
  <ScrollArea class="cm-editor-scroll-area" data-mira-theme="obsidian">
    {@render editorContent()}
  </ScrollArea>
{:else}
  <div
    class="cm-editor-scroll-area cm-editor-scroll-area--ancestor"
    data-ui-component="editor"
    data-ui-part="scroll-owner-ancestor"
    data-mira-theme="obsidian"
  >
    {@render editorContent()}
  </div>
{/if}
