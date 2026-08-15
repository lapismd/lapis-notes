# UI Package Spec

Canonical requirements: [UI and styling](../../spec/src/ui-and-styling.md),
[Packages](../../spec/src/packages.md).

## Purpose

`@lapis-notes/ui` holds Lapis-specific compounds that compose
`@lapismd/design-core` primitives. Overlapping shadcn families are not forked
here.

## Current surface

Kept compounds: `modal`, `confirm-dialog`, `search`, `sidebar-custom`,
`table-dnd` (plus helpers / `cn`). Paint is colocated CSS + `--ui-*` tokens;
sources MUST pass `pnpm check:no-tailwind`.

`theme.css` is Obsidian-era **alias-only** onto design-core semantics. Brand
palette lives in design-core `themes/lapis.css`. `styles.css` re-exports
`theme.css` without Tailwind.

`codemirror-autocomplete.css` is a native-CSS public surface that maps shared
CodeMirror completion tooltips onto Design Core Popover and Command semantics.
Application hosts load it after the shared theme.

## Validation

`pnpm check` (includes no-Tailwind gate), `svelte-check`, Storybook
`API/` plays, Visual Delta baselines.
