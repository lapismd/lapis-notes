import type { BasesOptions } from "@lapis-notes/api";
import { BasesView, QueryController } from "../bases.svelte";
import ListViewComponent from "./list.svelte";

export class ListView extends BasesView {
  type: string = "list";

  constructor(
    readonly controller: QueryController,
    readonly scrollEl: HTMLElement,
  ) {
    super(controller);
    this.mountViewComponent(ListViewComponent, { view: this }, scrollEl);
  }

  onDataUpdated(): void {}

  static getViewOptions(): BasesOptions[] {
    return [];
  }
}
