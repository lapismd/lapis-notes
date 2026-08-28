# @lapis-notes/ui

Shared Svelte UI primitives for Lapis Notes package consumers.

This package contains the small public UI surface required by
`@lapis-notes/api`, the workspace shell, and separately versioned plugins. It
owns reusable presentation primitives only; vault state, routing, plugin
lifecycle, persistence, and application policy stay in API or host packages.

## Public surface

- Root helpers for class merging, fuzzy search, command filtering, and Svelte
  hooks.
- CSS entrypoints: `theme.css`, `styles.css`, and
  `codemirror-autocomplete.css`.
- Component subpaths for search, modal, confirm-dialog, sidebar-custom, and
  table-dnd.
- Table drag-and-drop utility and sensor subpaths for consumers that need only
  the non-component helpers.

## Usage

```ts
import "@lapis-notes/ui/theme.css";
import "@lapis-notes/ui/styles.css";

import { cn } from "@lapis-notes/ui";
import Search from "@lapis-notes/ui/search";
import { TableDragGrip } from "@lapis-notes/ui/table-dnd";
```

`@lapismd/design-core` and Svelte are peers for the public UI contract. Install
matching published npm versions in standalone consumers.

## Common Scripts

```sh
pnpm --filter @lapis-notes/ui dev
pnpm --filter @lapis-notes/ui build
pnpm --filter @lapis-notes/ui check
```

## References

- [Package spec](spec.md)
- [Canonical spec](../../spec/src/20-packages/ui/index.md)
