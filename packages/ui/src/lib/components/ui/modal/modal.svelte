<script lang="ts">
  import { Dialog as DialogPrimitive } from "bits-ui";
  import * as Dialog from "@lapismd/design-core/shadcn/dialog";
  import { cn } from "$lib/utils";
  let {
    open = $bindable(false),
    modalEl = $bindable(null),
    titleEl = $bindable(null),
    title = "",
    content = "",
    contentEl = $bindable(null),
    class: className,
    onOpenChange,
    portalProps,
  }: {
    open?: boolean;
    class?: string;
    titleEl?: HTMLElement | null;
    title?: string | DocumentFragment;
    content?: string | DocumentFragment;
    contentEl?: HTMLElement | null;
    modalEl?: HTMLElement | null;
    onOpenChange?: (open: boolean) => void;
    portalProps?: DialogPrimitive.PortalProps;
  } = $props();

  function renderContent(
    el: HTMLDivElement,
    content: string | DocumentFragment,
  ) {
    syncContent(el, content);
    return {
      update(content: string | DocumentFragment) {
        syncContent(el, content);
      },
    };
  }

  function syncContent(
    el: HTMLDivElement,
    content: string | DocumentFragment,
  ): void {
    el.replaceChildren();
    if (typeof content === "string") {
      el.textContent = content;
      return;
    }
    el.append(content.cloneNode(true));
  }
</script>

<Dialog.Root bind:open {onOpenChange}>
  <Dialog.Content
    bind:ref={modalEl}
    {portalProps}
    class={cn(
      "max-h-[var(--dialog-max-height,85vh)] w-[var(--dialog-width,560px)] max-w-[var(--dialog-max-width,80vw)] overflow-auto",
      className,
    )}
  >
    <Dialog.Header>
      <Dialog.Title>
        <div bind:this={titleEl} use:renderContent={title}></div>
      </Dialog.Title>
    </Dialog.Header>
    <div
      class="modal-content"
      bind:this={contentEl}
      use:renderContent={content}
    ></div>
  </Dialog.Content>
</Dialog.Root>
