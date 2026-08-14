import type { BasesOptions } from "@lapis-notes/api";
import { BasesView, QueryController } from "../bases.svelte";
import CardViewComponent from "./components/card.svelte";

export function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export class CardView extends BasesView {
  type: string = "cards";

  constructor(
    readonly controller: QueryController,
    readonly scrollEl: HTMLElement,
  ) {
    super(controller);
    this.mountViewComponent(CardViewComponent, { view: this }, scrollEl);
  }

  onDataUpdated(): void {}

  static getViewOptions(): BasesOptions[] {
    return [
      {
        key: "cardSize",
        type: "slider",
        displayName: "Card size",
        min: 50,
        max: 800,
        step: 1,
      },
      {
        key: "image",
        type: "property",
        displayName: "Image",
      },
      {
        key: "imageFit",
        displayName: "Image fit",
        type: "dropdown",
        default: "contain",
        options: {
          contain: "Contain",
          cover: "Cover",
        },
      },
      {
        key: "imageAspectRatio",
        type: "slider",
        displayName: "image aspect ration",
        min: 0.25,
        max: 2.5,
        step: 0.05,
      },
    ];
  }
}
