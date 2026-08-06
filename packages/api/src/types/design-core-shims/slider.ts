import type { Component } from "svelte";

export type SliderProps = {
  value?: number | number[];
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  type?: "single" | "multiple";
  ref?: HTMLElement | null;
  class?: string;
};

export declare const Slider: Component<SliderProps>;
export declare const Root: Component<SliderProps>;
