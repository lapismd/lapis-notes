import { View } from "@lapis-notes/api";
import TagsComponent from "./tags.svelte";
import { mount, unmount } from "svelte";

export const TagsViewType = "tag";
export const TagsLegacyViewTypes = ["tags"] as const;

export { TagsComponent as Root, TagsComponent as Tags };

export class TagsView extends View {
  private component: unknown = null;

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }

  onload(): void {
    this.component = mount(TagsComponent, {
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
    return TagsViewType;
  }

  getIcon(): string {
    return "tags";
  }

  getDisplayText(): string {
    return "Tags";
  }
}
