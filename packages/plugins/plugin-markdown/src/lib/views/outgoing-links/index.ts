import { View } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import LinkSidebar from "../link-sidebar/link-sidebar.svelte";

export const OutgoingLinksViewType = "file:outgoing-links";

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
    this.component = mount(LinkSidebar, {
      target: this.containerEl,
      props: {
        app: this.app,
        mode: "outgoing",
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
    return "links";
  }

  getDisplayText(): string {
    return "Outgoing links";
  }
}
