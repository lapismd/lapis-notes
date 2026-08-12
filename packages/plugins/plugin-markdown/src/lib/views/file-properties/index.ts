import { View } from "@lapis-notes/api";
import FileProperties from "./file-properties.svelte";
import { mount, unmount } from "svelte";

export const FilePropertiesViewType = "file-properties";
export const FilePropertiesLegacyViewTypes = ["file:properties"] as const;

export { FileProperties };

export class FilePropertiesView extends View {
  private component: unknown = null;

  protected onOpen(): Promise<void> {
    return Promise.resolve();
  }

  protected onClose(): Promise<void> {
    return Promise.resolve();
  }

  onload(): void {
    this.containerEl.classList.add("markdown-file-properties-view");
    this.component = mount(FileProperties, {
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
    return FilePropertiesViewType;
  }

  getIcon(): string {
    return "info";
  }

  getDisplayText(): string {
    return "File properties";
  }
}
