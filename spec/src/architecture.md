# Architecture

## Requirements

| ID          | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-ARCH-001 | The repository MUST be a pnpm workspace orchestrated by Turbo. Targeted host builds and distribution or acceptance preflights MUST select the host and dependency closure through the root Turbo graph so unchanged work can use the shared cache.                                                                                                                                                                                                                                                                                                                                                                                    |
| LN-ARCH-002 | Workspace packages MUST live under `packages/*` (including authorized packages under `packages/plugins/*`) and expose `build`, `check`, and `test` scripts.                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| LN-ARCH-017 | `@lapismd/mira-editor`, `@lapismd/mira-plugin-mermaid`, and `@lapismd/mira-plugin-ai` MUST be consumed through sibling `link:` dependencies plus root `pnpm-workspace.yaml` overrides for `@lapis-notes/markdown` document rendering. Consumers MUST resolve their public package exports, and Mira source changes MUST be rebuilt in the sibling checkout before Lapis consumes them.                                                                                                                                                                                                                                                |
| LN-ARCH-003 | The repository catalog MUST be Storybook on port 7010 (`pnpm dev`). Authorized plugin packages MAY host an additional Storybook on a dedicated port for package-local UI.                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| LN-ARCH-004 | The monorepo MUST NOT reintroduce multi-script first-party import-resolution gates; resolution issues MUST be fixed inline when packages are added.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| LN-ARCH-005 | `@lapismd/design-core` MUST be consumed through the sibling checkout (`link:../design-core` at the repo root and a root `pnpm-workspace.yaml` override); consumers MUST resolve its declared package exports, while publishable package manifests use a portable dependency range. Reusable sidebar view-host sizing MUST remain Design Core-owned, while Lapis plugins fill the bounded host without consumer-side layout overrides.                                                                                                                                                                                                 |
| LN-ARCH-014 | `@lapismd/mira` MUST be consumed through the sibling checkout (`link:../mira-mde/packages/mira` at the repo root and a root `pnpm-workspace.yaml` override) for the source-editor CodeMirror shell; consumers MUST resolve its built package exports, while publishable package manifests use a portable dependency range.                                                                                                                                                                                                                                                                                                            |
| LN-ARCH-006 | Root `pnpm check` MUST run `pnpm check:no-tailwind` before Turbo package checks so Tailwind utility regressions in ui/api component sources fail closed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| LN-ARCH-007 | `@lapis-notes/workspace` MUST be a presentation/controller integration package; vault selection, routing, persistence boot, and plugin loading remain consumer or api responsibilities, while flat application configuration MAY map to generic Design Core presentation policies.                                                                                                                                                                                                                                                                                                                                                    |
| LN-ARCH-008 | Storybook MUST consume design-core's shared catalog stylesheet and layout synchronizer so Workspace stories receive the same edge-to-edge viewport contract while ordinary component stories retain catalog padding.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| LN-ARCH-009 | The api compatibility projection MUST preserve every persisted design-core V3 workspace region, including the bottom panel, while keeping the api-owned workspace writer as the only layout persistence adapter.                                                                                                                                                                                                                                                                                                                                                                                                                      |
| LN-ARCH-010 | The runnable editor demo MUST keep demo bootstrap and source-editor policy in Storybook fixtures while reusable runtime contracts remain in API, reusable File Explorer remains in `@lapis-notes/file-explorer`, Markdown owns Tags, and generic startup presentation remains in Design Core. Design Core MUST own current, reveal-or-create, and forced-new-tab Explorer intents while Lapis maps them to workspace leaves.                                                                                                                                                                                                          |
| LN-ARCH-011 | Storybook-local source plugins MAY declare CodeMirror language packages as root development dependencies. CodeMirror/Lezer singleton peers deduplicated across linked sibling packages MUST also be explicit root development dependencies; neither case moves demo plugin policy into api or workspace.                                                                                                                                                                                                                                                                                                                              |
| LN-ARCH-012 | Storybook MUST resolve design-core and Mira entry points through their installed sibling links and public package exports. Docker visual capture MAY temporarily install ignored staged package copies, but Lapis-owned Vite configuration MUST NOT bypass either package with external source aliases.                                                                                                                                                                                                                                                                                                                               |
| LN-ARCH-013 | Storybook MUST resolve the API editor, editor-core, and editor-language-service subpaths from the same API source root as the root API alias. Source-editor fixtures MUST NOT mix packaged and source editor state fields or implementations.                                                                                                                                                                                                                                                                                                                                                                                         |
| LN-ARCH-015 | File-view chrome (path breadcrumbs, leaf history, and optional header title rename) MUST project from the api workspace host `getChrome` bridge into design-core `WorkspaceViewHeader`; the source-editor inline title remains a separate in-document filename surface when enabled.                                                                                                                                                                                                                                                                                                                                                  |
| LN-ARCH-016 | The api source-editor shell MUST label CodeMirror hosts with `data-language` and default editor typography to Mira monospace, with sans overrides only for Markdown and text.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| LN-ARCH-018 | Root Storybook tooling MUST resolve `@lapismd/storybook-addon-visual-delta` through the sibling checkout at `link:../storybook-addon-visual-delta`; linked-source staging remains owned by Visual Delta and MUST NOT move the tool into a runtime package dependency.                                                                                                                                                                                                                                                                                                                                                                 |
| LN-ARCH-019 | Design Core MUST be the sole owner of trigger-based overlay portal resolution. Lapis consumers MUST compose its public Popover, Hover Card, Tooltip, Dropdown Menu, Context Menu, and Select exports, inherit their trigger-owner-document behavior, and MUST NOT publish a competing overlay portal context, package export, or Vite alias.                                                                                                                                                                                                                                                                                          |
| LN-ARCH-020 | The api source-editor shell MUST expose the configured CodeMirror fold gutter for language-provided fold ranges outside Markdown. Markdown MUST use Mira's inline fold controls without also painting the generic gutter.                                                                                                                                                                                                                                                                                                                                                                                                             |
| LN-ARCH-021 | The source editor's design-core ScrollArea MUST remain bounded by its workspace view and own vertical document scrolling. Nested CodeMirror scrollers MUST expand with content and MUST NOT paint a second vertical scrollbar.                                                                                                                                                                                                                                                                                                                                                                                                        |
| LN-ARCH-022 | Root `pnpm check` MUST run shared configured specification validation before the no-Tailwind and Turbo package checks. Root `pnpm test` MUST run Lapis package tests without copying the shared validator's own regression suite.                                                                                                                                                                                                                                                                                                                                                                                                     |
| LN-ARCH-023 | Root specification discovery MUST invoke the repository-local QMD binary through `@lapismd/spec-validator`. It MUST NOT depend on a global executable or run during normal checks.                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| LN-ARCH-024 | The API workspace-host bridge MUST translate compatibility view actions and pane-menu contributions into design-core view chrome. Translated view-menu sections MUST precede generic pane actions; the workspace shell MUST NOT duplicate plugin controls.                                                                                                                                                                                                                                                                                                                                                                            |
| LN-ARCH-025 | Design Core MUST own reusable diagnostics state and Problems presentation. Lapis API MUST adapt that contract to plugins, vault navigation, and language services; provider packages MUST remain independent of Design Core and workspace layout.                                                                                                                                                                                                                                                                                                                                                                                     |
| LN-ARCH-026 | The API editor MUST consume diagnostic glyphs and semantic colours from Design Core's public workspace contract. It MUST keep CodeMirror-specific marker mounting, tooltip geometry, and pointer lifecycle inside the editor boundary. An open diagnostic card MUST retain its origin and placement throughout pointer handoff.                                                                                                                                                                                                                                                                                                       |
| LN-ARCH-027 | The API editor MUST own CodeMirror inline-problem structure and styling. It MUST consume public workspace semantic tokens without moving editor-specific widgets into Design Core or application-global styles.                                                                                                                                                                                                                                                                                                                                                                                                                       |
| LN-ARCH-028 | The Electron desktop host MUST remain a consumer of `@lapis-notes/api` and `@lapis-notes/workspace`. Native lifecycle, vault discovery and selection, session boot, and IPC belong to the host; the workspace package MAY forward generic navigation presentation while rendering and persisted layout compatibility remain in their owning packages.                                                                                                                                                                                                                                                                                 |
| LN-ARCH-029 | Electron main, preload, and renderer code MUST communicate through the typed desktop-neutral bridge. The renderer MUST NOT receive Node integration or raw Electron IPC access.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| LN-ARCH-030 | Production application hosts MUST load Design Core's public runtime stylesheet and theme entries directly. Storybook-only host configuration MUST NOT be required for reusable workspace components to render correctly.                                                                                                                                                                                                                                                                                                                                                                                                              |
| LN-ARCH-031 | Native application hosts MUST map typed platform metadata to host-owned root CSS state. Reusable workspace components MUST expose semantic styling hosts without detecting Electron or hard-coding native window-control geometry.                                                                                                                                                                                                                                                                                                                                                                                                    |
| LN-ARCH-032 | Application hosts MAY register the reusable `@lapis-notes/file-explorer` contribution, but plugin enablement order, configuration and metadata boot, community-plugin policy, and teardown MUST remain host-owned. `@lapis-notes/workspace` MUST remain shell-only.                                                                                                                                                                                                                                                                                                                                                                   |
| LN-ARCH-033 | `@lapis-notes/search` MUST keep indexing and query execution behind API contracts while composing its grouped tree, settings, facets, badges, and overlays from public Design Core exports. Markdown panels MAY invoke Search only through commands.                                                                                                                                                                                                                                                                                                                                                                                  |
| LN-ARCH-034 | App-database selection MUST use an API-owned provider contract. Production hosts MUST register Turso providers without retaining SQLite compatibility or non-Turso fallback paths, while Search and workspace consumers MUST depend only on generic `AppDatabase` capabilities.                                                                                                                                                                                                                                                                                                                                                       |
| LN-ARCH-035 | `@lapis-notes/web` MUST own browser vault selection, session boot, PWA lifecycle, and plugin loading while consuming `@lapis-notes/api` and `@lapis-notes/workspace`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| LN-ARCH-036 | Browser database coordination MUST elect one local owner per vault and delegate typed operations from proxy tabs. Coordination MUST NOT be presented as cloud sync.                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| LN-ARCH-037 | The API editor host MUST be the sole owner of readable-column geometry after composing Mira. It MUST neutralize inherited outer-sizer width and margin constraints before applying file margins, so widening a workspace pane or closing sidebars cannot reduce the Markdown content width.                                                                                                                                                                                                                                                                                                                                           |
| LN-ARCH-038 | CV compilation, generated-artifact export, and form-toolbar composition MUST remain plugin-owned, including document-action order after YAML. Compiled Markdown presentation composes Mira's public read-only surfaces. The plugin MUST keep vault persistence behind its host adapter and MUST NOT create another Markdown rendering stack. Shared form disclosure behavior MUST remain owned by Design Core.                                                                                                                                                                                                                        |
| LN-ARCH-039 | Roles MUST own the ported legacy Applications page presentation and adapt only domain, vault, navigation, and Markdown/editor boundaries to Lapis APIs. Design Core remains the source of shared controls and Lapis remains the source of the outer workspace shell; neither boundary may recompose the ticket board, activity timeline, actions board, or `detail-perma` role sheet into a visually different page.                                                                                                                                                                                                                  |
| LN-ARCH-040 | Lapis MUST classify statically shipped plugins by distribution while retaining one API core lifecycle. Design Core MUST own only the managed-plugin settings source and grouped presentation; Lapis MUST own registration, persistence, failures, and workspace recovery policy.                                                                                                                                                                                                                                                                                                                                                      |
| LN-ARCH-041 | External-plugin dependency closure, including the public workspace shell used by plugin catalogs, MUST cross repository boundaries through published package exports and portable semver manifests. Colocated workspaces MAY resolve matching sibling versions locally, but consumer manifests and packed artifacts MUST NOT encode machine-specific paths.                                                                                                                                                                                                                                                                           |
| LN-ARCH-042 | Bases MUST own its query controller, document model, rendering helpers, view layouts, editing workflows, semantic CSS, private table-track model, measured variable-height rows, and compact table-control density. API owns App, database, metadata, plugin, editor, and Markdown processor contracts; Design Core owns shared input, autocomplete, Select, Popover sizing, and Accordion indicator primitives; hosts own boot and persistence ordering. Source-linked Storybook MUST preserve the package's public-entrypoint runtime semantics and deduplicate shared component runtimes such as `bits-ui` across linked packages. |
| LN-ARCH-043 | The API MUST own the public search-document contribution registry, Search MUST own provider selection and generated index state, and domain plugins MUST own parsing and semantic projection for their file formats.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| LN-ARCH-044 | The API workspace host MUST project compatibility ribbon and status contributions into Design Core registries while plugins retain command and lifecycle ownership.                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| LN-ARCH-045 | Generated search-document metadata MUST remain search-scoped while participating in API-owned property query evaluation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| LN-ARCH-046 | Reusable editor presentation MUST enter through the API editor package while language plugins retain rich extension and toolbar policy. Its public embedded editor MUST support self-owned or ancestor-owned vertical scrolling without a second scroll host. External plugins MUST NOT import bundled-plugin implementation files or create a competing CodeMirror persistence path.                                                                                                                                                                                                                                                 |
| LN-ARCH-047 | Domain file previews MAY delegate whole-file editing to the registered Markdown leaf through public serialized view state. Markdown MUST retain editor, settings, keybinding, and persistence ownership while the domain plugin owns only the return target and its structured preview. Linked external-plugin catalogs MUST deduplicate the API peer runtime so compatibility view identity and chrome projection remain valid.                                                                                                                                                                                                      |
| LN-ARCH-048 | File-opening navigation MUST capture the initiating leaf state before constructing a target view that may eagerly attach itself. Back MUST restore the initiating view rather than an incomplete target-view state and MUST discard the previous file-view root before mounting it.                                                                                                                                                                                                                                                                                                                                                   |
| LN-ARCH-049 | `pnpm-workspace.yaml` MUST limit workspace membership to Lapis-owned directories. Colocated sibling repositories MUST resolve through explicit root `link:` dependencies and `link:`-valued root overrides, never external workspace membership.                                                                                                                                                                                                                                                                                                                                                                                      |
| LN-ARCH-050 | Bases MUST treat its initial blank filter row as the first predicate so the first Add Filter activation appends a second visible predicate. Nested Design Core Select portals MUST paint above the enclosing filter Popover through shared portal ordering without a Bases-owned z-index override.                                                                                                                                                                                                                                                                                                                                    |
| LN-ARCH-051 | Bases MUST own one semantic query-popover width contract shared by Sort and Filter. Their portaled outer Popover contents MUST resolve the same bounded inline size while each workflow retains its own content, scrolling, and surface treatment.                                                                                                                                                                                                                                                                                                                                                                                    |
| LN-ARCH-052 | API MUST retain the shared CodeMirror autocomplete extension while UI owns its completion-popover stylesheet and application hosts load that public stylesheet after Design Core paint. Bases owns only its inline query-editor surface and focus treatment and MUST NOT gain a runtime dependency on the pruned UI package.                                                                                                                                                                                                                                                                                                          |
| LN-ARCH-053 | Bases MUST own advanced-filter draft validation inside its query workflow. CodeMirror presents and describes the draft's accessible invalid state, while only a valid expression may cross into the applied document filter; API and Design Core contracts remain unchanged.                                                                                                                                                                                                                                                                                                                                                          |
| LN-ARCH-054 | App-linked runtime objects MUST resolve App through explicit injection, workspace ownership, or Svelte context. `globalThis.app` MAY remain only as a host-installed compatibility fallback, and constructing an App MUST NOT mutate global state.                                                                                                                                                                                                                                                                                                                                                                                    |
| LN-ARCH-055 | Folder-contained AI conversation files MUST be the portable source of truth and use API-owned vault durability. Chat and folder-aware history MUST remain separate views joined by a non-authoritative scope-and-ID hint that follows live folder moves in memory. The selected history scope MUST read portable source while the provider-filtered AppDatabase projection remains disposable and limited to cross-scope discovery and full-text previews. |
| LN-ARCH-056 | AI History MUST remain an AI-owned, placement-neutral Explorer-style tree composed from public shared primitives. Host replay and native agent state MUST remain bounded, non-canonical, and safe to lose without automatically repeating a side-effecting turn. |
| LN-ARCH-057 | Real-agent diagnostics MUST use explicit developer-invoked supervisors around the production host boundaries. Storybook MUST remain passive, an attached loopback token MUST exist only in the supervised child environment, and Electron MUST use one seeded folder as both portable vault source and native agent workspace. |
| LN-ARCH-058 | AI chat view construction MUST remain synchronous and presentation-first while conversation, catalog, and runtime preparation continue behind the mounted surface. Conversation history MUST use generic workspace leaf activation to preserve its sidebar view and route location-keyed conversations into reusable main-area tabs. |

Existing-file navigation maps Explorer intent through the public
`Workspace.activateLeaf` contract so compatibility selection, the Design Core
controller, focus, and persisted layout remain synchronized. Setting
`activeLeaf` and calling `revealLeaf` alone does not represent user-visible tab
activation.

Current first-party hosts install a disposable application compatibility lease,
but workspace, editor, plugin, and story code resolve the App from explicit
ownership or Svelte context. The compatibility alias therefore serves legacy
consumers without selecting the owner for newly constructed runtime objects.

Vault glob discovery remains an API-owned in-memory file-tree concern. It may
maintain filename indexes for enumeration, but it does not move arbitrary
metadata or property queries out of Bases and the app-database boundary.

The CV plugin owns the placement of document actions in its main toolbar and
which form-area actions are contextual. Form-area overflow composes Design Core
Scroll Area rather than introducing a plugin-local scroll primitive.

Preview zoom likewise remains CV-plugin presentation. It treats the preview
pane's usable width as 100% and scales generated page and text surfaces from
that boundary without resizing the workspace split.

The generated CV Markdown surface remains a CV-owned composition of Mira's
public layout contract. It may replace Mira's note-oriented readable column
with a full-width artifact surface without changing Mira's defaults for notes.
Its public wrapper selector must keep that contract stable when linked Mira
styles load later than the CV component styles.

The Lapis façade and navigation bridge preserve this boundary without exposing
vault or editor types to Design Core.

Within that boundary, `LN-SRCH-023` keeps inset result-row and unindented child
surface geometry, primary and contrasting secondary view paint, summary
controls, and hover-stable metadata in the Search package while Design Core
supplies reusable badges, tree primitives, surface tokens, and workspace
placement. Compact parent rows expose only extension-free filenames, while the
expanded body owns path and retrieval metadata. Incremental match context reads the Lapis vault through the Search
component and does not expand the database or Design Core contracts.
Recent-query persistence does not
schedule replacement queries, so expanded context remains component state until
query-driving inputs change or the index explicitly refreshes. Result navigation
reuses an existing document leaf when available, but preserves a body-hosted
Search leaf by opening its target in a sibling tab.

## Package graph

```text
@lapis-notes/ui  (leaf UI)
       ↑ peer
@lapis-notes/api (kernel)
       ↑
@lapis-notes/workspace (thin Storybook-runnable shell host)
@lapis-notes/file-explorer (reusable File Explorer contribution)
@lapis-notes/search (vault indexing + Search workspace contribution)
@lapis-notes/bases (query + document + bundled Bases presentation)
@lapis-notes/lapis-plugin-cv-roles (first-party external plugin; role workflows + retained CV views)
@lapis-notes/markdown (authorized plugin; Mira document render + side panels)
@lapis-notes/language-service (internal provider-neutral client + worker)
@lapis-notes/markdown-lint (authorized core diagnostic provider)
@lapis-notes/desktop-electron (native consumer host)
@lapis-notes/web (browser/PWA consumer host)

@lapismd/design-core (sibling; UI primitives + workspace layout engine)
@lapismd/mira (+ mira-editor / mira plugins; sibling checkout)
@lapismd/storybook-addon-visual-delta (sibling; root-only Storybook tooling)
```

The external Roles repository owns its domain specification and plugin-only
catalog. Lapis consumes its built public exports and owns real-App integration
with File Explorer, Search, managed settings, and persisted layout recovery.
Bases remains Lapis-owned: its explicit App input supplies vault, database,
metadata, navigation, and registry contracts while the package owns document
normalization, query evaluation, rendering, editing, and resource cleanup.
Its focused catalog boots the public plugin boundary and keeps editor labels,
table-control names, wrapped multivalue row geometry, and accessible accent
paint in the owning package.
The outer table cell alone owns its inset active boundary so nested Design Core
editors cannot duplicate or clip focused geometry.
Design Core autocomplete owns outside-focus dismissal without trigger-focus
restoration; Bases owns top-aligned table-cell composition around that control.
Bases resolves delegated editor activation from the semantic cell root for both
cell-chrome and nested-value clicks while preserving genuine nested buttons.
The table fills the remaining Bases surface, composes Design Core's public
shadcn Scroll Area, and binds both virtualizers to its exposed viewport; Bases
owns only table-specific scrollbar tokens and full-height bottom-edge placement
around that shared primitive.
Filter controls consume Design Core's public Popover width token and Accordion
indicator position while Bases owns the legacy 45svw geometry, opaque panel
surface, and on-accent indicator paint.
Electron, web, and the root real-App catalog consume its package exports and
share the Search, Bases, external-Roles boot order without a consumer copy.

Overlapping shadcn and forms controls used by `@lapis-notes/api` import from
`@lapismd/design-core`. `@lapis-notes/ui` retains only Lapis compounds
(`modal`, `confirm-dialog`, `search`, `sidebar-custom`, `table-dnd`) that
compose design-core primitives with colocated CSS and `--ui-*` tokens. Brand
tokens live in design-core `themes/lapis.css`; ui `theme.css` is alias-only.
Storybook loads design-core's shared catalog stylesheet + Lapis theme + ui
aliases, and uses the shared layout synchronizer for full-viewport Workspace
stories.
The public workspace package renders the api-owned design-core controller; it
does not own a second layout model or persistence adapter. External plugin
catalogs consume its versioned export rather than reconstructing that shell or
linking to workspace source.
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
Desktop and web “View all” palettes keep host-owned Dialog chrome and compose
Command View for the searchable recent-vault list.
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
`@lapis-notes/ai` is an authorized bundled plugin. The desktop native bridge
advertises an `agent-runtime` capability for process-backed ACP and Codex
sessions while the reserved `model` capability stays unavailable. The plugin
obtains live runtimes from that host factory and keeps adapters off the root
export. Cursor uses the same ACP runtime as Codex through the selected agent
name. Process execution lives in `@lapis-notes/ai-host`, used in-process by
Electron and as `lapis-ai-host serve` for WebSocket clients. Chat sessions
persist runtime, provider, model, and thinking context through plugin data.
Codex model listing uses the process host while Cursor model listing uses an
agent-scoped disposable acpx session. Cleanup falls back to local session
closure when the agent does not advertise `session/close`, without discarding a
successful catalog. The host consumes the maintained ACP adapter supplied by
its acpx release and applies optional thinking controls only when the created
session advertises them. Native Codex and ACP normalize
thinking, tool, permission, user-input, and error events before the shared
controller renders them. Runtime-neutral pending interactions are presented
through Design Core's Composer Drawer; provider request objects and secret
answers never enter persisted chat data.
The paperclip attach picker uses that same drawer surface: host Popover chrome
stays above the open drawer while Command View owns the searchable file list.

## Tooling policy

Root scripts stay thin: configured shared specification validation,
`check:no-tailwind`, Turbo for package tasks, `spec:first` for change mapping,
and Storybook for docs. Do not grow a parallel script forest for import path
syncing. Lapis policy stays in `spec-validator.config.mjs`, while reusable
validators and their tests stay in `@lapismd/spec-validator`. QMD discovery
uses that same root-only tooling boundary. Storybook manager-only dependencies,
including the shared theme toolbar icons, remain root development tooling and
do not enter the runtime package graph.
