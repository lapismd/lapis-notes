import type { Component } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
import type {
  ButtonSize,
  ButtonVariant,
} from "../../lib/design-core-button-types";

export type { ButtonSize, ButtonVariant };

export type ButtonProps = HTMLButtonAttributes & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  ref?: HTMLButtonElement | null;
  dataUiComponent?: string;
};

export declare const Button: Component<ButtonProps>;
export declare const Root: Component<ButtonProps>;
export declare function buttonVariants(_opts?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  class?: string;
}): string;
export declare const BUTTON_VARIANTS: readonly ButtonVariant[];
export declare const BUTTON_SIZES: readonly ButtonSize[];
