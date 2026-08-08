# Architecture

## Requirements

| ID          | Requirement                                                                                                                                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-ARCH-001 | The repository MUST be a pnpm workspace orchestrated by Turbo.                                                                                                                                                               |
| LN-ARCH-002 | Workspace packages MUST live under `packages/*` and expose `build`, `check`, and `test` scripts.                                                                                                                             |
| LN-ARCH-003 | The browsable docs host MUST be Storybook on port 7010 (`pnpm dev`).                                                                                                                                                         |
| LN-ARCH-004 | The monorepo MUST NOT reintroduce multi-script first-party import-resolution gates; resolution issues MUST be fixed inline when packages are added.                                                                          |
| LN-ARCH-005 | `@lapismd/design-core` MUST be consumed through the sibling checkout (`file:../design-core` at the repo root and pnpm override); publishable package manifests MUST use a portable dependency range.                         |
| LN-ARCH-014 | `@lapismd/mira` MUST be consumed through the sibling checkout (`file:../mira-mde/packages/mira` at the repo root and pnpm override) for the source-editor CodeMirror shell; publishable package manifests MUST use a portable dependency range. |
| LN-ARCH-006 | Root `pnpm check` MUST run `pnpm check:no-tailwind` before Turbo package checks so Tailwind utility regressions in ui/api component sources fail closed.                                                                     |
| LN-ARCH-007 | `@lapis-notes/workspace` MUST be a presentation/controller integration package; vault selection, routing, persistence boot, and plugin loading remain consumer or api responsibilities.                                      |
| LN-ARCH-008 | Storybook MUST consume design-core's shared catalog stylesheet and layout synchronizer so Workspace stories receive the same edge-to-edge viewport contract while ordinary component stories retain catalog padding.         |
| LN-ARCH-009 | The api compatibility projection MUST preserve every persisted design-core V3 workspace region, including the bottom panel, while keeping the api-owned workspace writer as the only layout persistence adapter.             |
| LN-ARCH-010 | The runnable editor demo MUST keep Lapis plugin/bootstrap policy in Storybook fixtures while reusable runtime contracts remain in api and generic startup presentation remains in design-core.                               |
| LN-ARCH-011 | Storybook-local source plugins MAY declare CodeMirror language packages as root development dependencies; those dependencies MUST NOT move demo plugin policy into api or workspace.                                         |
| LN-ARCH-012 | Storybook MUST resolve the design-core app-shell, core, empty, Explorer, startup, and notifications workspace entry points through the sibling source root so browser tests and staged visual builds use one implementation. |
| LN-ARCH-013 | Storybook MUST resolve the API editor subpath from the same API source root as the root API alias so source-editor fixtures do not mix packaged and source editor implementations.                                           |
| LN-ARCH-015 | File-view chrome (path breadcrumbs, leaf history, and optional header title rename) MUST project from the api workspace host `getChrome` bridge into design-core `WorkspaceViewHeader`; the source-editor inline title remains a separate in-document filename surface when enabled. |
| LN-ARCH-016 | The api source-editor shell MUST label CodeMirror hosts with `data-language`, default editor typography to Mira monospace (sans only for Markdown/text), and expose the stock CodeMirror fold gutter for language-provided fold ranges through the Lapis editor configuration surface. |

## Package graph

```text
@lapis-notes/ui  (leaf UI)
       ↑ peer
@lapis-notes/api (kernel)
       ↑
@lapis-notes/workspace (thin Storybook-runnable shell host)

@lapismd/design-core (sibling; UI primitives + workspace layout engine)
@lapismd/mira (sibling; source-editor CodeMirror shell + Obsidian theme)
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
