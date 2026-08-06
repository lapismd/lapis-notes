import type { Component } from "svelte";
import type { HTMLTextareaAttributes } from "svelte/elements";

export type TextareaProps = HTMLTextareaAttributes & {
  ref?: HTMLTextAreaElement | null;
  value?: string;
};

export declare const Textarea: Component<TextareaProps>;
export declare const Root: Component<TextareaProps>;
