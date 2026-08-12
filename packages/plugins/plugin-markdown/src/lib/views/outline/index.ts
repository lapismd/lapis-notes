import { View } from "@lapis-notes/api";
import OutlineComponent from "./outline.svelte";
import { mount, unmount } from "svelte";

export const OutlineViewType = "outline";
export const OutlineLegacyViewTypes = ["file:outline"] as const;

export { OutlineComponent as Root, OutlineComponent as Outline };

export class OutlineView extends View {
  private component: unknown = null;

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }

  onload(): void {
    this.containerEl.classList.add("markdown-outline-view");
    this.component = mount(OutlineComponent, {
      target: this.containerEl,
      props: {
        app: this.app,
      },
    });
  }

  onunload(): void {
    if (this.component) {
      unmount(this.component as Parameters<typeof unmount>[0]);
      this.component = null;
    }
  }

  getViewType(): string {
    return OutlineViewType;
  }

  getIcon(): string {
    return "list";
  }

  getDisplayText(): string {
    return "Outline";
  }
}
