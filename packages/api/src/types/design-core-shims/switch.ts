import type { Component } from "svelte";

export type SwitchProps = {
  checked?: boolean;
  disabled?: boolean;
  ref?: HTMLElement | null;
  class?: string;
  size?: "sm" | "default";
};

export declare const Switch: Component<SwitchProps>;
export declare const Root: Component<SwitchProps>;
