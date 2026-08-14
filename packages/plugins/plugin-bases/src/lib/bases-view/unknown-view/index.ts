import type { BasesOptions } from "@lapis-notes/api";
import { BasesView, QueryController } from "../bases.svelte";
import UnknownViewComponent from "./view.svelte";

export class UnknownView extends BasesView {
  type: string = "unknown";

  constructor(
    readonly controller: QueryController,
    readonly scrollEl: HTMLElement,
  ) {
    super(controller);
    this.mountViewComponent(
      UnknownViewComponent,
      {
        type: controller.selectedView?.type ?? "unknown",
      },
      scrollEl,
    );
  }

  onDataUpdated(): void {}

  static getViewOptions(): BasesOptions[] {
    return [];
  }
}
