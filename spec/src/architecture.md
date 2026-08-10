# Architecture

## Requirements

| ID          | Requirement                                                                                                                                                                                                                                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-ARCH-001 | The repository MUST be a pnpm workspace orchestrated by Turbo.                                                                                                                                                                                                                                                                                                |
| LN-ARCH-002 | Workspace packages MUST live under `packages/*` (and `packages/plugins/*` for the authorized markdown plugin) and expose `build`, `check`, and `test` scripts.                                                                                                                                                                                                |
| LN-ARCH-017 | `@lapismd/mira-editor`, `@lapismd/mira-plugin-mermaid`, and `@lapismd/mira-plugin-ai` MUST be consumed through sibling `link:` dependencies + pnpm overrides for `@lapis-notes/markdown` document rendering. Consumers MUST resolve their public package exports, and Mira source changes MUST be rebuilt in the sibling checkout before Lapis consumes them. |
| LN-ARCH-003 | The browsable docs host MUST be Storybook on port 7010 (`pnpm dev`).                                                                                                                                                                                                                                                                                          |
| LN-ARCH-004 | The monorepo MUST NOT reintroduce multi-script first-party import-resolution gates; resolution issues MUST be fixed inline when packages are added.                                                                                                                                                                                                           |
| LN-ARCH-005 | `@lapismd/design-core` MUST be consumed through the sibling checkout (`link:../design-core` at the repo root and pnpm override); consumers MUST resolve its declared package exports, while publishable package manifests use a portable dependency range.                                                                                                    |
| LN-ARCH-014 | `@lapismd/mira` MUST be consumed through the sibling checkout (`link:../mira-mde/packages/mira` at the repo root and pnpm override) for the source-editor CodeMirror shell; consumers MUST resolve its built package exports, while publishable package manifests use a portable dependency range.                                                            |
| LN-ARCH-006 | Root `pnpm check` MUST run `pnpm check:no-tailwind` before Turbo package checks so Tailwind utility regressions in ui/api component sources fail closed.                                                                                                                                                                                                      |
| LN-ARCH-007 | `@lapis-notes/workspace` MUST be a presentation/controller integration package; vault selection, routing, persistence boot, and plugin loading remain consumer or api responsibilities.                                                                                                                                                                       |
| LN-ARCH-008 | Storybook MUST consume design-core's shared catalog stylesheet and layout synchronizer so Workspace stories receive the same edge-to-edge viewport contract while ordinary component stories retain catalog padding.                                                                                                                                          |
| LN-ARCH-009 | The api compatibility projection MUST preserve every persisted design-core V3 workspace region, including the bottom panel, while keeping the api-owned workspace writer as the only layout persistence adapter.                                                                                                                                              |
| LN-ARCH-010 | The runnable editor demo MUST keep Lapis plugin/bootstrap policy in Storybook fixtures while reusable runtime contracts remain in api and generic startup presentation remains in design-core.                                                                                                                                                                |
| LN-ARCH-011 | Storybook-local source plugins MAY declare CodeMirror language packages as root development dependencies. CodeMirror/Lezer singleton peers deduplicated across linked sibling packages MUST also be explicit root development dependencies; neither case moves demo plugin policy into api or workspace.                                                      |
| LN-ARCH-012 | Storybook MUST resolve design-core and Mira entry points through their installed sibling links and public package exports. Docker visual capture MAY temporarily install ignored staged package copies, but Lapis-owned Vite configuration MUST NOT bypass either package with external source aliases.                                                       |
| LN-ARCH-013 | Storybook MUST resolve the API editor subpath from the same API source root as the root API alias so source-editor fixtures do not mix packaged and source editor implementations.                                                                                                                                                                            |
| LN-ARCH-015 | File-view chrome (path breadcrumbs, leaf history, and optional header title rename) MUST project from the api workspace host `getChrome` bridge into design-core `WorkspaceViewHeader`; the source-editor inline title remains a separate in-document filename surface when enabled.                                                                          |
| LN-ARCH-016 | The api source-editor shell MUST label CodeMirror hosts with `data-language`, default editor typography to Mira monospace (sans only for Markdown/text), and expose the configured CodeMirror fold gutter for language-provided fold ranges outside Markdown. Markdown MUST use Mira's inline fold controls without also painting the generic gutter. Its design-core ScrollArea root MUST fill and remain bounded by the owning workspace view so that viewport is the sole vertical scroll owner; the nested CodeMirror scroller MUST expand with content and MUST NOT paint a second vertical scrollbar. |
| LN-ARCH-018 | Root Storybook tooling MUST resolve `@lapismd/storybook-addon-visual-delta` through the sibling checkout at `link:../storybook-addon-visual-delta`; linked-source staging remains owned by Visual Delta and MUST NOT move the tool into a runtime package dependency.                                                                                         |
| LN-ARCH-019 | Design Core MUST be the sole owner of trigger-based overlay portal resolution. Lapis consumers MUST compose its public Popover, Hover Card, Tooltip, Dropdown Menu, Context Menu, and Select exports, inherit their trigger-owner-document behavior, and MUST NOT publish a competing overlay portal context, package export, or Vite alias.                                                             |

## Package graph

```text
@lapis-notes/ui  (leaf UI)
       ↑ peer
@lapis-notes/api (kernel)
       ↑
@lapis-notes/workspace (thin Storybook-runnable shell host)
@lapis-notes/markdown (authorized plugin; Mira document render + side panels)

@lapismd/design-core (sibling; UI primitives + workspace layout engine)
@lapismd/mira (+ mira-editor / mira plugins; sibling checkout)
@lapismd/storybook-addon-visual-delta (sibling; root-only Storybook tooling)
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
The api compatibility projection includes the design-core V3 bottom-panel tabs,
groups, open state, active leaf, and height, including saves to the currently
loaded alternate workspace filename. Settings displayed by the shell remain
controller-owned while persisting through api configuration; the workspace
shell does not initiate configuration or plugin loading.
`@lapis-notes/api/workspace-host` is the explicit integration seam: root api
exports retain their compatibility shape while workspace hosts can obtain the
controller without reaching into api internals.
Every workspace package exposes the common `build`, `check`, and `test`
contract, so the shell participates in the same Turbo verification graph as
the kernel and retained UI surface.

The controller configuration adapter lives in api beside the compatibility
workspace. It reads and atomically writes the flat API configuration store;
the workspace package only starts and renders the already-owned controller.
Editor-view contributions follow the same boundary and are projected from the
API registry into the controller registry without moving registration policy
into the shell host.
The editor demo's Markdown and JSON language packages are root-only Storybook
development dependencies. The API continues to expose the generic editor
extension registry and source view, not a bundled language policy.

## Tooling policy

Root scripts stay thin: `check:no-tailwind`, Turbo for package tasks,
`spec:first` for governance, and Storybook for docs. Do not grow a parallel
script forest for import path syncing. Storybook manager-only dependencies,
including the shared theme toolbar icons, remain root development tooling and
do not enter the runtime package graph.
