import { type VariantProps, tv } from "tailwind-variants";

export const drawerVariants = tv({
  base: "bg-background fixed z-50 flex flex-col gap-4 border shadow-lg outline-hidden",
  variants: {
    direction: {
      top: "inset-x-0 top-0 max-h-[92svh] rounded-b-[1.5rem] border-b",
      bottom: "inset-x-0 bottom-0 max-h-[92svh] rounded-t-[1.5rem] border-t",
      left: "inset-y-0 left-0 h-full w-[min(24rem,85vw)] border-r",
      right: "inset-y-0 right-0 h-full w-[min(24rem,85vw)] border-l",
    },
  },
  defaultVariants: {
    direction: "bottom",
  },
});

export type Direction = VariantProps<typeof drawerVariants>["direction"];
