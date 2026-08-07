# Architecture

## Requirements

| ID          | Requirement                                                                                                                                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-ARCH-001 | The repository MUST be a pnpm workspace orchestrated by Turbo.                                                                                                                                                       |
| LN-ARCH-002 | Workspace packages MUST live under `packages/*` and expose `build`, `check`, and `test` scripts.                                                                                                                     |
| LN-ARCH-003 | The browsable docs host MUST be Storybook on port 7010 (`pnpm dev`).                                                                                                                                                 |
| LN-ARCH-004 | The monorepo MUST NOT reintroduce multi-script first-party import-resolution gates; resolution issues MUST be fixed inline when packages are added.                                                                  |
| LN-ARCH-005 | `@lapismd/design-core` MUST be consumed through the sibling checkout (`file:../design-core` at the repo root and pnpm override); publishable package manifests MUST use a portable dependency range.                 |
| LN-ARCH-006 | Root `pnpm check` MUST run `pnpm check:no-tailwind` before Turbo package checks so Tailwind utility regressions in ui/api component sources fail closed.                                                             |
| LN-ARCH-007 | `@lapis-notes/workspace` MUST be a presentation/controller integration package; vault selection, routing, persistence boot, and plugin loading remain consumer or api responsibilities.                              |
| LN-ARCH-008 | Storybook MUST consume design-core's shared catalog stylesheet and layout synchronizer so Workspace stories receive the same edge-to-edge viewport contract while ordinary component stories retain catalog padding. |

## Package graph

```text
@lapis-notes/ui  (leaf UI)
       ↑ peer
@lapis-notes/api (kernel)
       ↑
@lapis-notes/workspace (thin Storybook-runnable shell host)

@lapismd/design-core (sibling; UI primitives + workspace layout engine)
```

Overlapping shadcn and forms controls used by `@lapis-notes/api` import from
`@lapismd/design-core`. `@lapis-notes/ui` retains only Lapis compounds
(`modal`, `confirm-dialog`, `search`, `sidebar-custom`, `table-dnd`) that
compose design-core primitives with colocated CSS and `--ui-*` tokens. Brand
tokens live in design-core `themes/lapis.css`; ui `theme.css` is alias-only.
Storybook loads design-core's shared catalog stylesheet + Lapis theme + ui
aliases, and uses the shared layout synchronizer for full-viewport Workspace
stories.
The workspace package renders the api-owned design-core controller; it does not
own a second layout model or persistence adapter.
`@lapis-notes/api/workspace-host` is the explicit integration seam: root api
exports retain their compatibility shape while workspace hosts can obtain the
controller without reaching into api internals.
Every workspace package exposes the common `build`, `check`, and `test`
contract, so the shell participates in the same Turbo verification graph as
the kernel and retained UI surface.

## Tooling policy

Root scripts stay thin: `check:no-tailwind`, Turbo for package tasks,
`spec:first` for governance, and Storybook for docs. Do not grow a parallel
script forest for import path syncing. Storybook manager-only dependencies,
including the shared theme toolbar icons, remain root development tooling and
do not enter the runtime package graph.
