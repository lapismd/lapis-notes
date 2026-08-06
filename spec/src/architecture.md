# Architecture

## Requirements

| ID | Requirement |
| --- | --- |
| LN-ARCH-001 | The repository MUST be a pnpm workspace orchestrated by Turbo. |
| LN-ARCH-002 | Workspace packages MUST live under `packages/*` and expose `build`, `check`, and `test` scripts. |
| LN-ARCH-003 | The browsable docs host MUST be Storybook on port 7010 (`pnpm dev`). |
| LN-ARCH-004 | The monorepo MUST NOT reintroduce multi-script first-party import-resolution gates; resolution issues MUST be fixed inline when packages are added. |
| LN-ARCH-005 | `@lapismd/design-core` MUST be consumed as a sibling `file:` dependency (`file:../design-core` at the repo root), not published/npm-vendored. |
| LN-ARCH-006 | Root `pnpm check` MUST run `pnpm check:no-tailwind` before Turbo package checks so Tailwind utility regressions in ui/api component sources fail closed. |

## Package graph

```text
@lapis-notes/ui  (leaf UI)
       ↑ peer
@lapis-notes/api (kernel)
       ↑ (future hosts / plugins)

@lapismd/design-core (sibling; shadcn/forms source of truth for overlapping UI)
```

Overlapping shadcn and forms controls used by `@lapis-notes/api` import from
`@lapismd/design-core`. `@lapis-notes/ui` retains only Lapis compounds
(`modal`, `confirm-dialog`, `search`, `sidebar-custom`, `table-dnd`) that
compose design-core primitives with colocated CSS and `--ui-*` tokens. Brand
tokens live in design-core `themes/lapis.css`; ui `theme.css` is alias-only.
Storybook loads design-core `styles.css` + Lapis theme + ui aliases.

## Tooling policy

Root scripts stay thin: `check:no-tailwind`, Turbo for package tasks,
`spec:first` for governance, and Storybook for docs. Do not grow a parallel
script forest for import path syncing.
