import { View } from "@lapis-notes/api";
import { mount, unmount } from "svelte";
import Backlinks from "./backlinks.svelte";

export const BacklinksViewType = "backlink";
export const BacklinksLegacyViewTypes = ["file:backlinks"] as const;

export { Backlinks };

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
    this.component = mount(Backlinks, {
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
    return BacklinksViewType;
  }

  getIcon(): string {
    return "link-2";
  }

  getDisplayText(): string {
    return "Backlinks";
  }
}
