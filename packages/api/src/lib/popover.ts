import { Component } from "./view.svelte";

export interface Point {
  x: number;
  y: number;
}

export enum PopoverState {
  Hidden = "hidden",
  Showing = "showing",
  Shown = "shown",
  Hiding = "hiding",
}

export interface HoverParent {
  hoverPopover: HoverPopover | null;
}

function createHoverEl(): HTMLElement {
  if (typeof document !== "undefined") {
    return document.createElement("div");
  }
  return {} as HTMLElement;
}

export class HoverPopover extends Component {
  hoverEl: HTMLElement;
  state: PopoverState = PopoverState.Showing;

  constructor(
    parent: HoverParent,
    targetEl: HTMLElement | null,
    waitTime?: number,
    staticPos?: Point | null,
  ) {
    super();
    this.hoverEl = targetEl ?? createHoverEl();
    parent.hoverPopover = this;
    this.register(() => {
      if (parent.hoverPopover === this) {
        parent.hoverPopover = null;
      }
    });
  }

  close(): void {
    this.state = PopoverState.Hidden;
    this.unload();
  }
}
