import type { BasesOptions } from "@lapis-notes/api";
import { BasesView, QueryController } from "../bases.svelte";
import MapViewComponent from "./view.svelte";

export class MapView extends BasesView {
  type: string = "map";

  constructor(
    readonly controller: QueryController,
    readonly scrollEl: HTMLElement,
  ) {
    super(controller);
    this.mountViewComponent(MapViewComponent, { view: this }, scrollEl);
  }

  onDataUpdated(): void {}

  static getViewOptions(): BasesOptions[] {
    return [];
  }
}
