<script lang="ts">
  import { onMount } from "svelte";
  import { type Editor as EditorApi } from "../../editor.svelte";
  import { dirname } from "../../storage/path";
  import { WorkspaceLeaf } from "../../workspace.svelte";
  import { editorConfig } from "./editor";
  import { ScrollArea } from "@lapis-notes/ui/scroll-area";

  type Props = {
    leaf?: WorkspaceLeaf;
    editor: EditorApi;
    class?: string;
  };

  let { editor, class: className = "" }: Props = $props();
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
    if (root instanceof Document || root instanceof ShadowRoot) {
      editor.view.setRoot(root);
    }
    node.append(editor.view.dom);
    focusTimeout = setTimeout(() => {
      editor.view.focus();
    });

    return {
      update(qs: string) {},
      destroy() {
        if (focusTimeout !== null) {
          clearTimeout(focusTimeout);
          focusTimeout = null;
        }
      },
    };
  };

  function editorConfigUpdated({ key, value }: { key: string; value: any }) {
    editorConfig.update(editor.view, key, value);
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
    if (name && editor.file && name !== editor.file.name) {
      const path = `${dirname(editor.file.path)}/${name}.${editor.file.extension}`;
      app.fileManager.renameFile(editor.file, path);
    }
  }

  function renameDone(evt: KeyboardEvent) {
    if (evt.key == "Enter") {
      renameFile((evt.target as HTMLDivElement).getText());
      editor.view.focus();
      evt.preventDefault();
    }
  }
</script>

<ScrollArea class="cm-editor-scroll-area h-full w-full">
  <div class={`cm-editor-scroll-area-content h-fit pt-0 ${className}`.trim()}>
    <div class="cm-editor-scroll-area-inner h-full">
      <div class="cm-scroller h-full">
        <div class="cm-sizer h-full">
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          {#if shouldShowDesktopInlineTitle && file}
            <div
              onkeydown={renameDone}
              onfocusout={(evt) =>
                renameFile((evt.target as HTMLDivElement).getText())}
              class="inline-title cm-editor-inline-title"
              contenteditable="true"
              {spellcheck}
              autocapitalize="on"
              tabindex="-1"
              enterkeyhint="done"
            >
              {file?.name}
            </div>
          {/if}
          {#if shouldShowMobileInlineTitle && file}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              onkeydown={renameDone}
              onfocusout={(evt) =>
                renameFile((evt.target as HTMLDivElement).getText())}
              class="inline-title cm-editor-inline-title"
              data-mobile-inline-title="true"
              data-mobile-inline-title-input="true"
              aria-label="Active note title"
              contenteditable="true"
              {spellcheck}
              autocapitalize="on"
              tabindex="-1"
              enterkeyhint="done"
            >
              {file?.name}
            </div>
          {/if}
          <div use:codeMirror class="cm-editor-content h-full"></div>
        </div>
      </div>
    </div>
  </div>
</ScrollArea>
