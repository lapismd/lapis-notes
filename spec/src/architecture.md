# Architecture

## Requirements

| ID          | Requirement                                                                                                                                                                                                                                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-ARCH-001 | The repository MUST be a pnpm workspace orchestrated by Turbo.                                                                                                                                                                                                                                                                                                |
| LN-ARCH-002 | Workspace packages MUST live under `packages/*` (including authorized packages under `packages/plugins/*`) and expose `build`, `check`, and `test` scripts.                                                                                                                                                                                                |
| LN-ARCH-017 | `@lapismd/mira-editor`, `@lapismd/mira-plugin-mermaid`, and `@lapismd/mira-plugin-ai` MUST be consumed through sibling `link:` dependencies + pnpm overrides for `@lapis-notes/markdown` document rendering. Consumers MUST resolve their public package exports, and Mira source changes MUST be rebuilt in the sibling checkout before Lapis consumes them. |
| LN-ARCH-003 | The browsable docs host MUST be Storybook on port 7010 (`pnpm dev`).                                                                                                                                                                                                                                                                                          |
| LN-ARCH-004 | The monorepo MUST NOT reintroduce multi-script first-party import-resolution gates; resolution issues MUST be fixed inline when packages are added.                                                                                                                                                                                                           |
| LN-ARCH-005 | `@lapismd/design-core` MUST be consumed through the sibling checkout (`link:../design-core` at the repo root and pnpm override); consumers MUST resolve its declared package exports, while publishable package manifests use a portable dependency range.                                                                                                    |
| LN-ARCH-014 | `@lapismd/mira` MUST be consumed through the sibling checkout (`link:../mira-mde/packages/mira` at the repo root and pnpm override) for the source-editor CodeMirror shell; consumers MUST resolve its built package exports, while publishable package manifests use a portable dependency range.                                                            |
| LN-ARCH-006 | Root `pnpm check` MUST run `pnpm check:no-tailwind` before Turbo package checks so Tailwind utility regressions in ui/api component sources fail closed.                                                                                                                                                                                                      |
| LN-ARCH-007 | `@lapis-notes/workspace` MUST be a presentation/controller integration package; vault selection, routing, persistence boot, and plugin loading remain consumer or api responsibilities.                                                                                                                                                                       |
| LN-ARCH-008 | Storybook MUST consume design-core's shared catalog stylesheet and layout synchronizer so Workspace stories receive the same edge-to-edge viewport contract while ordinary component stories retain catalog padding.                                                                                                                                          |
| LN-ARCH-009 | The api compatibility projection MUST preserve every persisted design-core V3 workspace region, including the bottom panel, while keeping the api-owned workspace writer as the only layout persistence adapter.                                                                                                                                              |
| LN-ARCH-010 | The runnable editor demo MUST keep demo bootstrap and source-editor policy in Storybook fixtures while reusable runtime contracts remain in API, reusable File Explorer remains in `@lapis-notes/file-explorer`, Markdown owns Tags, and generic startup presentation remains in Design Core.                                                                                                                                                                |
| LN-ARCH-011 | Storybook-local source plugins MAY declare CodeMirror language packages as root development dependencies. CodeMirror/Lezer singleton peers deduplicated across linked sibling packages MUST also be explicit root development dependencies; neither case moves demo plugin policy into api or workspace.                                                      |
| LN-ARCH-012 | Storybook MUST resolve design-core and Mira entry points through their installed sibling links and public package exports. Docker visual capture MAY temporarily install ignored staged package copies, but Lapis-owned Vite configuration MUST NOT bypass either package with external source aliases.                                                       |
| LN-ARCH-013 | Storybook MUST resolve the API editor, editor-core, and editor-language-service subpaths from the same API source root as the root API alias. Source-editor fixtures MUST NOT mix packaged and source editor state fields or implementations. |
| LN-ARCH-015 | File-view chrome (path breadcrumbs, leaf history, and optional header title rename) MUST project from the api workspace host `getChrome` bridge into design-core `WorkspaceViewHeader`; the source-editor inline title remains a separate in-document filename surface when enabled.                                                                          |
| LN-ARCH-016 | The api source-editor shell MUST label CodeMirror hosts with `data-language` and default editor typography to Mira monospace, with sans overrides only for Markdown and text. |
| LN-ARCH-018 | Root Storybook tooling MUST resolve `@lapismd/storybook-addon-visual-delta` through the sibling checkout at `link:../storybook-addon-visual-delta`; linked-source staging remains owned by Visual Delta and MUST NOT move the tool into a runtime package dependency.                                                                                         |
| LN-ARCH-019 | Design Core MUST be the sole owner of trigger-based overlay portal resolution. Lapis consumers MUST compose its public Popover, Hover Card, Tooltip, Dropdown Menu, Context Menu, and Select exports, inherit their trigger-owner-document behavior, and MUST NOT publish a competing overlay portal context, package export, or Vite alias.                                                             |
| LN-ARCH-020 | The api source-editor shell MUST expose the configured CodeMirror fold gutter for language-provided fold ranges outside Markdown. Markdown MUST use Mira's inline fold controls without also painting the generic gutter. |
| LN-ARCH-021 | The source editor's design-core ScrollArea MUST remain bounded by its workspace view and own vertical document scrolling. Nested CodeMirror scrollers MUST expand with content and MUST NOT paint a second vertical scrollbar. |
| LN-ARCH-022 | Root `pnpm check` MUST run specification validation before the no-Tailwind and Turbo package checks. Root `pnpm test` MUST run the specification-validator tests before Turbo package tests. |
| LN-ARCH-023 | Root specification discovery MUST invoke the repository-local QMD binary through `scripts/spec-validation/`. It MUST NOT depend on a global executable or run during normal checks. |
| LN-ARCH-024 | The API workspace-host bridge MUST translate compatibility view actions and pane-menu contributions into design-core view chrome. Translated view-menu sections MUST precede generic pane actions; the workspace shell MUST NOT duplicate plugin controls. |
| LN-ARCH-025 | Design Core MUST own reusable diagnostics state and Problems presentation. Lapis API MUST adapt that contract to plugins, vault navigation, and language services; provider packages MUST remain independent of Design Core and workspace layout. |
| LN-ARCH-026 | The API editor MUST consume diagnostic glyphs and semantic colours from Design Core's public workspace contract. It MUST keep CodeMirror-specific marker mounting, tooltip geometry, and pointer lifecycle inside the editor boundary. An open diagnostic card MUST retain its origin and placement throughout pointer handoff. |
| LN-ARCH-027 | The API editor MUST own CodeMirror inline-problem structure and styling. It MUST consume public workspace semantic tokens without moving editor-specific widgets into Design Core or application-global styles. |
| LN-ARCH-028 | The Electron desktop host MUST remain a consumer of `@lapis-notes/api` and `@lapis-notes/workspace`. Native lifecycle, vault discovery and selection, session boot, and IPC belong to the host; the workspace package MAY forward generic navigation presentation while rendering and persisted layout compatibility remain in their owning packages. |
| LN-ARCH-029 | Electron main, preload, and renderer code MUST communicate through the typed desktop-neutral bridge. The renderer MUST NOT receive Node integration or raw Electron IPC access. |
| LN-ARCH-030 | Production application hosts MUST load Design Core's public runtime stylesheet and theme entries directly. Storybook-only host configuration MUST NOT be required for reusable workspace components to render correctly. |
| LN-ARCH-031 | Native application hosts MUST map typed platform metadata to host-owned root CSS state. Reusable workspace components MUST expose semantic styling hosts without detecting Electron or hard-coding native window-control geometry. |
| LN-ARCH-032 | Application hosts MAY register the reusable `@lapis-notes/file-explorer` contribution, but plugin enablement order, configuration and metadata boot, community-plugin policy, and teardown MUST remain host-owned. `@lapis-notes/workspace` MUST remain shell-only. |
| LN-ARCH-033 | `@lapis-notes/search` MUST keep indexing and query execution behind API contracts while composing its grouped tree, settings, facets, badges, and overlays from public Design Core exports. Markdown panels MAY invoke Search only through commands. |
| LN-ARCH-034 | App-database selection MUST use an API-owned provider contract. Production hosts MUST register Turso providers without retaining SQLite compatibility or non-Turso fallback paths, while Search and workspace consumers MUST depend only on generic `AppDatabase` capabilities. |
| LN-ARCH-035 | `@lapis-notes/web` MUST own browser vault selection, session boot, PWA lifecycle, and plugin loading while consuming `@lapis-notes/api` and `@lapis-notes/workspace`. |
| LN-ARCH-036 | Browser database coordination MUST elect one local owner per vault and delegate typed operations from proxy tabs. Coordination MUST NOT be presented as cloud sync. |

The Lapis façade and navigation bridge preserve this boundary without exposing
vault or editor types to Design Core.

Within that boundary, `LN-SRCH-023` keeps inset result-row and unindented child
surface geometry, surface-aware summary controls, and hover-stable metadata in
the Search package while Design Core supplies reusable badges, tree primitives,
surface tokens, and workspace placement. Incremental match context reads the
Lapis vault through the Search component and does not expand the database or
Design Core contracts. Recent-query persistence does not schedule replacement
queries, so expanded context remains component state until query-driving inputs
change or the index explicitly refreshes. Result navigation reuses an existing
document leaf when available, but preserves a body-hosted Search leaf by opening
its target in a sibling tab.

## Package graph

```text
@lapis-notes/ui  (leaf UI)
       ↑ peer
@lapis-notes/api (kernel)
       ↑
@lapis-notes/workspace (thin Storybook-runnable shell host)
@lapis-notes/file-explorer (reusable File Explorer contribution)
@lapis-notes/search (vault indexing + Search workspace contribution)
@lapis-notes/markdown (authorized plugin; Mira document render + side panels)
@lapis-notes/language-service (internal provider-neutral client + worker)
@lapis-notes/markdown-lint (authorized core diagnostic provider)
@lapis-notes/desktop-electron (native consumer host)
@lapis-notes/web (browser/PWA consumer host)

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

The desktop renderer bundles its workspace consumers, while Electron main
retains only native lifecycle and service dependencies. Main communicates with
the context-isolated preload through an explicit command allowlist. Renderer
shutdown is acknowledged before window destruction so the API-owned session
can persist and dispose without moving ownership into main or workspace.
Electron main owns native Turso handles behind a fixed API database RPC
catalogue; the renderer receives descriptors and results, never SQL or storage
paths. Intel macOS composes the API-owned WASM provider in the renderer behind
the same session boundary.
The web consumer owns its launcher and PWA lifecycle. It opens Turso WASM over
OPFS in exactly one Web Locks owner per vault; other tabs retain the generic
database contract through bounded BroadcastChannel RPC and may promote when
the owner disappears. Neither role is cloud synchronization.
The branded vault launcher is a renderer-side desktop consumer: it chooses a
native profile, then delegates storage and workspace lifecycle to API sessions.
The ready-shell vault menu follows the same boundary: Design Core presents the
generic menu, the workspace package forwards its contract, and the desktop
consumer supplies profiles plus serialized switch and management callbacks.
Generated renderer and main outputs are Turbo cache outputs and remain
untracked; checked-in build resources are limited to icons and entitlements.
The production renderer imports Design Core's public stylesheet and Lapis theme
plus the Lapis UI alias sheet before mounting either the launcher or workspace.
Its Vite pipeline compiles the desktop launcher's utility classes; reusable
workspace paint remains supplied by the public Design Core stylesheet rather
than Storybook-only configuration. Electron-specific window-control clearance
is applied by host CSS against Design Core's semantic shell attributes. The
development server permits the resolved Design Core package root for imported
assets while retaining package-export resolution and the default Lapis
workspace boundary.

The controller configuration adapter lives in api beside the compatibility
workspace. It reads and atomically writes the flat API configuration store;
the workspace package only starts and renders the already-owned controller.
Editor-view contributions follow the same boundary and are projected from the
API registry into the controller registry without moving registration policy
into the shell host. Compatibility view actions and pane-menu contributions use
that same projection, leaving design-core responsible for shared title-bar and
menu presentation while plugins retain their control policy. The adapter keeps
compatibility view sections ahead of generic split, move, and close actions.
The editor demo's Markdown and JSON language packages are root-only Storybook
development dependencies. The API continues to expose the generic editor
extension registry and source view, not a bundled language policy.

## Tooling policy

Root scripts stay thin: specification validation, `check:no-tailwind`, Turbo
for package tasks, `spec:first` for change mapping, and Storybook for docs. Do
not grow a parallel script forest for import path syncing. Specification scripts
and their tests stay together under `scripts/spec-validation/`. QMD discovery
uses that same root-only tooling boundary. Storybook manager-only dependencies,
including the shared theme toolbar icons, remain root development tooling and
do not enter the runtime package graph.
