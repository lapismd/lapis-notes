import type { BasesOptions } from "@lapis-notes/api";
import { BasesView, QueryController } from "../bases.svelte";
import TableViewComponent from "./components/table.svelte";

export class TableView extends BasesView {
  type: string = "table";

  constructor(
    readonly controller: QueryController,
    readonly scrollEl: HTMLElement,
  ) {
    super(controller);
    this.mountViewComponent(TableViewComponent, { view: this }, scrollEl);
  }

  onDataUpdated(): void {}

  static getViewOptions(): BasesOptions[] {
    return [
      {
        key: "rowHeight",
        displayName: "Row Height",
        type: "dropdown",
        default: "short",
        options: {
          short: "Short",
          medium: "Medium",
          tall: "Tall",
          extra: "Extra tall",
        },
      },
    ];
  }
}
