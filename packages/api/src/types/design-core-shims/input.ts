import type { Component } from "svelte";
import type { HTMLInputAttributes } from "svelte/elements";

export type InputProps = HTMLInputAttributes & {
  ref?: HTMLInputElement | null;
  value?: string | null;
};

export declare const Input: Component<InputProps>;
export declare const Root: Component<InputProps>;
