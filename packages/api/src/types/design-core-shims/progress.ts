import type { Component } from "svelte";

export type ProgressProps = {
  value?: number | null;
  max?: number;
  ref?: HTMLElement | null;
  class?: string;
};

export declare const Progress: Component<ProgressProps>;
export declare const Root: Component<ProgressProps>;
