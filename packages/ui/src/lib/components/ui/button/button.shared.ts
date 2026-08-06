import type {
  HTMLAnchorAttributes,
  HTMLButtonAttributes,
} from "svelte/elements";
import { type VariantProps, tv } from "tailwind-variants";

import type { WithElementRef } from "../../../utils.js";

export const buttonVariants = tv({
  base: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-colors focus-visible:ring-[2px] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  variants: {
    variant: {
      default:
        "bg-[var(--interactive-accent)] text-[var(--text-on-accent)] hover:bg-[var(--interactive-accent-hover)] active:bg-[var(--interactive-accent-pressed)]",
      destructive:
        "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
      outline:
        "border bg-background hover:bg-[var(--background-modifier-hover)] hover:text-foreground dark:border-input dark:bg-background",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-[var(--background-modifier-hover)] hover:text-foreground",
      ghost:
        "hover:bg-[var(--background-modifier-hover)] hover:text-foreground",
      link: "text-[var(--text-accent)] underline-offset-4 hover:underline",
    },
    size: {
      default: "h-9 px-4 py-2 has-[>svg]:px-3",
      sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
      xs: "h-4 rounded-sm px-1 text-xs [&_svg]:size-3 ",
      lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
      icon: "size-9",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
export type ButtonSize = VariantProps<typeof buttonVariants>["size"];

export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
  WithElementRef<HTMLAnchorAttributes> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
  };
