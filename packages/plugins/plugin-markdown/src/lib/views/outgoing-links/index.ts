import { View } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import OutgoingLinks from "./outgoing-links.svelte";

export const OutgoingLinksViewType = "outgoing-link";
export const OutgoingLinksLegacyViewTypes = ["file:outgoing-links"] as const;

export { OutgoingLinks };

export class OutgoingLinksView extends View {
  private component: unknown = null;

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }

  onload(): void {
    this.containerEl.classList.add("markdown-outgoing-links-view");
    this.component = mount(OutgoingLinks, {
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
    return OutgoingLinksViewType;
  }

  getIcon(): string {
    return "external-link";
  }

  getDisplayText(): string {
    return "Outgoing links";
  }
}
