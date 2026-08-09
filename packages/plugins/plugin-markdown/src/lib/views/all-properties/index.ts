import { View } from "@lapis-notes/api";
import AllPropertiesComponent from "./all-properties.svelte";
import { mount, unmount } from "svelte";

export const AllPropertiesViewType = "all-properties";

export { AllPropertiesComponent as AllProperties, AllPropertiesComponent as Root };

export class AllPropertiesView extends View {
  private component: unknown = null;

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }

  onload(): void {
    this.containerEl.classList.add("markdown-all-properties-view");
    this.component = mount(AllPropertiesComponent, {
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
    return AllPropertiesViewType;
  }

  getIcon(): string {
    // Obsidian All Properties “file box” / drawer; WorkspaceIcon wants short Lucide names.
    return "archive";
  }

  getDisplayText(): string {
    return "All properties";
  }
}
