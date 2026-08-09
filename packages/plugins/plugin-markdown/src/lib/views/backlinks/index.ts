import { View } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import LinkSidebar from "../link-sidebar/link-sidebar.svelte";

export const BacklinksViewType = "file:backlinks";

export class BacklinksView extends View {
  private component: unknown = null;

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }

  onload(): void {
    this.containerEl.classList.add("markdown-backlinks-view");
    this.component = mount(LinkSidebar, {
      target: this.containerEl,
      props: {
        app: this.app,
        mode: "backlinks",
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
    return BacklinksViewType;
  }

  getIcon(): string {
    return "link-2";
  }

  getDisplayText(): string {
    return "Backlinks";
  }
}
