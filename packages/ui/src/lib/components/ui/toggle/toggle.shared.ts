import { type VariantProps, tv } from "tailwind-variants";

export const toggleVariants = tv({
  base: "hover:bg-[var(--background-modifier-hover)] hover:text-foreground data-[state=on]:bg-[var(--background-modifier-active-hover)] data-[state=on]:text-[var(--text-accent)] data-[state=on]:hover:bg-[var(--background-modifier-active-hover)] data-[state=on]:hover:text-[var(--text-accent)] focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-[color,box-shadow,background-color] focus-visible:ring-[2px] disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  variants: {
    variant: {
      default: "bg-transparent",
      outline:
        "border-input border bg-transparent hover:bg-[var(--background-modifier-hover)] hover:text-foreground",
    },
    size: {
      default: "h-9 min-w-9 px-2",
      sm: "h-8 min-w-8 px-1.5",
      lg: "h-10 min-w-10 px-2.5",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export type ToggleVariant = VariantProps<typeof toggleVariants>["variant"];
export type ToggleSize = VariantProps<typeof toggleVariants>["size"];
export type ToggleVariants = VariantProps<typeof toggleVariants>;
