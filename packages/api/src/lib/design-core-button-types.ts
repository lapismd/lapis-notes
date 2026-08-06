/**
 * Mirror of `@lapismd/design-core/shadcn/button` public variant/size unions.
 * Kept as a plain .ts module so `tsc --noEmit` does not need to parse
 * design-core's `<script module>` exports from `button.svelte`.
 */
export type ButtonVariant =
  | "default"
  | "outline"
  | "secondary"
  | "ghost"
  | "destructive"
  | "link";

export type ButtonSize =
  | "default"
  | "xs"
  | "sm"
  | "lg"
  | "icon"
  | "icon-xs"
  | "icon-sm"
  | "icon-lg";
