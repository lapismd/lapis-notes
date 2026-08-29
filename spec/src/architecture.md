# Architecture

Production generated state now uses direct, row-scoped Turso access with typed
post-commit revisions. Memory remains the explicit test and Storybook provider;
renderer transports relay the database revision contract without owning domain
state.

Daily-note path policy is a host concern exposed through the API-owned
`DailyDocumentProviderRegistry`. Desktop and web install the same default
provider before loading configuration; Tasks consumes the resolved provider
without owning vault folders, filename formats, or daily-note identity.

Storybook is a documentation projection over the package graph. Its exact
specification mirrors and post-build index acceptance do not add a runtime
dependency or move plugin ownership into the catalog host. Composer agent and
model defaults persist in AI plugin data; workspace dock selection persists
through the existing 1000 ms writer. Separately versioned
Roles/CV catalog coverage remains in its owning repository while Lapis hosts
load that plugin only after a verified install. Tasks remains independently
owned and hosts MUST NOT register its workspace views themselves. AppDatabase owns
namespaced plugin projections and a serializable query AST, including the public
`tasks/task` collection. That projection stores `planKind` as the Tasks
`plan.at` kind (`anytime`, `morning`, `afternoon`, `evening`, or `time`).
The workspace presentation package owns the compact Community Plugins trust
status card defined by LN-PLUG-047; the API trust service remains the state and
action authority. It also owns the registry and community empty-state and
selected-tab presentation defined by LN-PLUG-048 through LN-PLUG-052.
The API parses additive signed registry metadata and verifies referenced
Markdown before Workspace rendering (LN-PLUG-053, LN-PLUG-054). Workspace owns
the responsive row and detail presentation in LN-PLUG-055 through LN-PLUG-058
by composing Design Core's expandable SearchFilterBar and public controls.
It does so without moving source, signature, installation, or lifecycle
authority out of App services.

Frontmatter value discovery remains application-owned: Markdown adapts the
App metadata type manager into Mira's portable property configuration, while
Mira owns the editor presentation and portalled suggestion surface. This keeps
vault enumeration out of the shared renderer without duplicating its controls.
Deno desktop sessions use the same API vault-session factory with a
desktop-native Turso provider supplied by the host. `packages/desktop-deno` is
the sole native desktop consumer and owns the Deno window, `win.bind()` bridge,
native app-database handle, native host lifecycle, and services while remaining
a consumer of public Lapis package boundaries.
Vault resources stay within that host boundary: the renderer receives an
opaque same-origin loopback URL, while Deno validates the capability and vault
path before returning the binary HTTP response. Binary file bytes never travel
through Laufey's string-valued binding response, and the host rejects NUL-bearing
text reads before they can reach that response boundary.
Its native console uses severity thresholds: routine bridge traffic is
debug-only, while the default output is limited to bounded lifecycle notices,
warnings, and failures and never includes invocation payloads or credentials.
The development launcher also keeps Deno's native inspector opt-in and rejects
it in telemetry mode because Deno 2.9.5 couples inspector activation to a raw
binding-payload trace that would bypass that policy.
Its production acceptance builds through the package and restores an isolated
real vault rather than substituting a browser-only renderer test.
Target-specific artifact naming, metadata, icons, verified PTY libraries, and
credential-selecting signing orchestration remain owned by that host package.
The development launcher is part of that host boundary: `pnpm dev:desktop`
starts Vite, then runs `deno desktop` against the same Deno import map used by
the native host, including its declared npm compatibility imports. The
`pnpm dev:desktop:cef` debug launcher selects Deno Desktop's Chromium Embedded
Framework backend so renderer DevTools can inspect the real bound desktop
document rather than an unbound browser tab. When Deno Desktop needs embedded
source inputs that are not available as published packages, the launcher may
prepare ignored package-local files only for declared owned sources and refuses
to replace an existing non-owned path.
The pre-renderer boot document is part of the same desktop boundary and owns
only transient startup presentation. It shows only the centred Lapis logo while
the Svelte renderer and native bridge initialize, exposes the loading state to
assistive technology, then yields to the mounted application.
Packaged acceptance reads the renderer-visible AppDatabase descriptor and must
observe the host-owned `turso-native-desktop` provider over `native` transport;
the browser-only WASM descriptor is not valid desktop evidence.

## Requirements

| ID          | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-ARCH-001 | The repository MUST be a pnpm workspace orchestrated by Turbo. Targeted host builds and distribution or acceptance preflights MUST select the host and dependency closure through the root Turbo graph so unchanged work can use the shared cache.                                                                                                                                                                                                               |
| LN-ARCH-002 | Framework and private application packages MUST live under `packages/*` and expose appropriate build, check, and test scripts. The eleven extracted first-party plugin packages MUST be owned by the sibling `lapis-plugins` workspace rather than duplicated as long-term Lapis Notes sources. |
| LN-ARCH-017 | `@lapismd/mira-editor`, `@lapismd/mira-plugin-mermaid`, and `@lapismd/mira-plugin-ai` MUST be consumed through published npm semver ranges for `@lapis-notes/markdown` document rendering. Consumers MUST resolve their public package exports, and Mira source changes MUST be released before Lapis consumes them through tracked manifests.                                                                                                                     |
| LN-ARCH-003 | The Lapis Notes repository catalog MUST be one Storybook on port 7010 (`pnpm dev`) for framework, application-profile, host integration, and plugin-management UI. The sibling `lapis-plugins` repository MUST use one repository-level Storybook for all eleven extracted packages rather than one Storybook per package. |
| LN-ARCH-004 | The monorepo MUST NOT reintroduce multi-script first-party import-resolution gates; resolution issues MUST be fixed inline when packages are added.                                                                                                                                                                                                                                                                                                              |
| LN-ARCH-005 | `@lapismd/design-core` MUST be consumed through a published npm semver range; consumers MUST resolve its declared package exports, while source fixes remain owned by the Design Core repository. Reusable sidebar view-host sizing MUST remain Design Core-owned, while Lapis plugins fill the bounded host without consumer-side layout overrides.                                                                                                             |
| LN-ARCH-014 | `@lapismd/mira` MUST be consumed through a published npm semver range for the source-editor CodeMirror shell; consumers MUST resolve its built package exports, while source fixes remain owned by the Mira repository.                                                                                                                                                                                                                                         |
| LN-ARCH-006 | Root `pnpm check` MUST run `pnpm check:no-tailwind` before Turbo package checks so Tailwind utility regressions in ui/api component sources fail closed.                                                                                                                                                                                                                                                                                                         |
| LN-ARCH-007 | `@lapis-notes/workspace` MUST be a presentation/controller integration package; vault selection, routing, persistence boot, plugin loading, and the selected static profile remain application or API responsibilities. The package MAY render app-registered plugin-management pages and injected README content without importing a plugin implementation. |
| LN-ARCH-008 | Storybook MUST consume design-core's shared catalog stylesheet and layout synchronizer so Workspace stories receive the same edge-to-edge viewport contract while ordinary component stories retain catalog padding.                                                                                                                                                                                                                                             |
| LN-ARCH-009 | The api compatibility projection MUST preserve every persisted design-core V3 workspace region, including the bottom panel, while keeping the api-owned workspace writer as the only layout persistence adapter. Host-registered Problems leaves MUST remain that view type across API layout commits. Claimed leaves MUST keep their serialized id and live `getState()`, and file opens MUST target an empty or file-backed main leaf.                         |
| LN-ARCH-010 | The runnable editor demo MUST keep demo bootstrap and source-editor policy in Storybook fixtures while reusable runtime contracts remain in API, reusable File Explorer remains in `@lapis-notes/file-explorer`, Markdown owns Tags, and generic startup presentation remains in Design Core. Design Core MUST own current, reveal-or-create, and forced-new-tab Explorer intents while Lapis maps them to workspace leaves.                                     |
| LN-ARCH-011 | Storybook-local source plugins MAY declare CodeMirror language packages as root development dependencies. CodeMirror/Lezer singleton peers shared with published packages MUST also be explicit root development dependencies; neither case moves demo plugin policy into api or workspace.                                                                                                                                                                      |
| LN-ARCH-012 | Storybook MUST resolve Design Core, Mira, and extracted plugin entry points through installed package dependencies and public package exports. Docker visual capture MAY temporarily install ignored staged package copies, but Lapis-owned Vite configuration MUST NOT bypass external packages with source aliases. Framework packages owned by Lapis Notes MAY resolve from their workspace source roots. |
| LN-ARCH-013 | Storybook MUST resolve the API editor, editor-core, and editor-language-service subpaths from the same API source root as the root API alias. Source-editor fixtures MUST NOT mix packaged and source editor state fields or implementations.                                                                                                                                                                                                                    |
| LN-ARCH-015 | File-view chrome (path breadcrumbs, leaf history, and optional header title rename) MUST project from the api workspace host `getChrome` bridge into design-core `WorkspaceViewHeader`; the source-editor inline title remains a separate in-document filename surface when enabled. Non-file views MAY contribute breadcrumbs through View hooks.                                                                                                               |
| LN-ARCH-016 | The api source-editor shell MUST label CodeMirror hosts with `data-language` and default editor typography to Mira monospace, with sans overrides only for Markdown and text.                                                                                                                                                                                                                                                                                    |
| LN-ARCH-018 | Root Storybook tooling MUST resolve `@lapismd/storybook-addon-visual-delta` from its published npm semver dependency; registry-package staging remains owned by Visual Delta and MUST NOT move the tool into a runtime package dependency.                                                                                                                                                                                                                       |
| LN-ARCH-019 | Design Core MUST be the sole owner of trigger-based overlay portal resolution. Lapis consumers MUST compose its public Popover, Hover Card, Tooltip, Dropdown Menu, Context Menu, and Select exports, inherit their trigger-owner-document behavior, and MUST NOT publish a competing overlay portal context, package export, or Vite alias.                                                                                                                     |
| LN-ARCH-020 | The api source-editor shell MUST expose the configured CodeMirror fold gutter for language-provided fold ranges outside Markdown. Markdown MUST use Mira's inline fold controls without also painting the generic gutter.                                                                                                                                                                                                                                        |
| LN-ARCH-021 | The source editor's design-core ScrollArea MUST remain bounded by its workspace view and own vertical document scrolling. Nested CodeMirror scrollers MUST expand with content and MUST NOT paint a second vertical scrollbar. Its scrollbar interaction rail MUST remain pointer-reachable above an adjacent workspace resize rail.                                                                                                                             |
| LN-ARCH-022 | Root `pnpm check` MUST run shared configured specification validation before the no-Tailwind and Turbo package checks. Root `pnpm test` MUST run Lapis package tests without copying the shared validator's own regression suite.                                                                                                                                                                                                                                |

The shared validator is release tooling, not a runtime sibling. The root
manifest MUST resolve `@lapismd/spec-validator` from its published npm semver
dependency once available, while keeping Lapis-owned requirement IDs,
configuration, and verification evidence in this repository.
Visual Delta is likewise root-only Storybook tooling: the root manifest MUST
resolve `@lapismd/storybook-addon-visual-delta` from its published npm semver
dependency once available, and no Lapis runtime package may depend on it.
| LN-ARCH-023 | Root specification discovery MUST invoke the repository-local QMD binary through `@lapismd/spec-validator`. It MUST NOT depend on a global executable or run during normal checks. |
| LN-ARCH-024 | The API workspace-host bridge MUST translate compatibility view actions and pane-menu contributions into design-core view chrome. Translated view-menu sections MUST precede generic pane actions; the workspace shell MUST NOT duplicate plugin controls. |
| LN-ARCH-025 | Design Core MUST own reusable diagnostics state and Problems presentation. Lapis API MUST adapt that contract to plugins, vault navigation, and language services; provider packages MUST remain independent of Design Core and workspace layout. |
| LN-ARCH-026 | The API editor MUST consume diagnostic glyphs and semantic colours from Design Core's public workspace contract. It MUST keep CodeMirror-specific marker mounting, tooltip geometry, and pointer lifecycle inside the editor boundary. An open diagnostic card MUST retain its origin and placement throughout pointer handoff. |
| LN-ARCH-027 | The API editor MUST own CodeMirror inline-problem structure and styling. It MUST consume public workspace semantic tokens without moving editor-specific widgets into Design Core or application-global styles. |
| LN-ARCH-028 | The Deno desktop host MUST remain a consumer of `@lapis-notes/api` and `@lapis-notes/workspace`. Native lifecycle, vault discovery and selection, session boot, and bounded bindings belong to the host; the workspace package MAY forward generic navigation presentation while rendering and persisted layout compatibility remain in their owning packages. |
| LN-ARCH-029 | Deno native and renderer code MUST communicate through the typed native desktop bridge. The renderer MUST NOT receive unrestricted Deno APIs or raw host objects. |
| LN-ARCH-030 | Production application hosts MUST load Design Core's public runtime stylesheet and theme entries directly. Storybook-only host configuration MUST NOT be required for reusable workspace components to render correctly. |
| LN-ARCH-031 | Native application hosts MUST map typed platform metadata to host-owned root CSS state. Reusable workspace components MUST expose semantic styling hosts without detecting a desktop framework or hard-coding native window-control geometry. |
| LN-ARCH-032 | Application hosts MAY register the reusable `@lapis-notes/file-explorer` contribution, but plugin enablement order, configuration and metadata boot, community-plugin policy, and teardown MUST remain host-owned. `@lapis-notes/workspace` MUST remain shell-only. |
| LN-ARCH-033 | `@lapis-notes/search` MUST keep indexing and query execution behind API contracts while composing its grouped tree, settings, facets, badges, and overlays from public Design Core exports. Markdown panels MAY invoke Search only through commands. |
| LN-ARCH-034 | App-database selection MUST use an API-owned provider contract. Production hosts MUST register Turso providers without retaining SQLite compatibility or non-Turso fallback paths, while Search and workspace consumers MUST depend only on generic `AppDatabase` capabilities. |
| LN-ARCH-035 | `@lapis-notes/web` MUST own browser vault selection, session boot, PWA lifecycle, and plugin loading while consuming `@lapis-notes/api` and `@lapis-notes/workspace`. |
| LN-ARCH-036 | Browser database coordination MUST elect one local owner per vault and delegate typed operations from proxy tabs. Coordination MUST NOT be presented as cloud sync. |
| LN-ARCH-037 | The API editor host MUST be the sole owner of readable-column geometry after composing Mira. It MUST neutralize inherited outer-sizer width and margin constraints before applying file margins, so widening a workspace pane or closing sidebars cannot reduce the Markdown content width. |
| LN-ARCH-038 | CV compilation, generated-artifact export, and form-toolbar composition MUST remain plugin-owned, including document-action order after YAML. Compiled Markdown presentation composes Mira's public read-only surfaces. The plugin MUST keep vault persistence behind its host adapter and MUST NOT create another Markdown rendering stack. Shared form disclosure behavior MUST remain owned by Design Core. |
| LN-ARCH-039 | Roles MUST own the ported legacy Applications page presentation and adapt only domain, vault, navigation, and Markdown/editor boundaries to Lapis APIs. Design Core remains the source of shared controls and Lapis remains the source of the outer workspace shell; neither boundary may recompose the ticket board, activity timeline, actions board, or `detail-perma` role sheet into a visually different page. |
| LN-ARCH-040 | Lapis MUST classify statically shipped plugins by distribution while retaining one API core lifecycle. Design Core MUST own only the managed-plugin settings source and grouped presentation; Lapis MUST own registration, persistence, failures, and workspace recovery policy. |
| LN-ARCH-041 | External-plugin dependency closure, including the public workspace shell used by plugin catalogs, MUST cross repository boundaries through published package exports and portable semver manifests. Colocated workspaces MAY resolve matching sibling versions locally, but consumer manifests and packed artifacts MUST NOT encode machine-specific paths. |
| LN-ARCH-042 | Bases MUST own its query controller, document model, rendering helpers, view layouts, editing workflows, semantic CSS, private table-track model, measured variable-height rows, and compact table-control density. API owns App, database, metadata, plugin, editor, and Markdown processor contracts; Design Core owns shared input, autocomplete, Select, Popover sizing, and Accordion indicator primitives; hosts own boot and persistence ordering. Source-linked Storybook MUST preserve the package's public-entrypoint runtime semantics and deduplicate shared component runtimes such as `bits-ui` across linked packages. |
| LN-ARCH-043 | The API MUST own the public search-document contribution registry, Search MUST own provider selection and generated index state, and domain plugins MUST own parsing and semantic projection for their file formats. |
| LN-ARCH-044 | The API workspace host MUST project compatibility ribbon and status contributions into Design Core registries while plugins retain command and lifecycle ownership. |
| LN-ARCH-045 | Generated search-document metadata MUST remain search-scoped while participating in API-owned property query evaluation. |
| LN-ARCH-046 | Reusable editor presentation MUST enter through the API editor package while language plugins retain rich extension and toolbar policy. Its public embedded editor MUST support self-owned or ancestor-owned vertical scrolling without a second scroll host. External plugins MUST NOT import bundled-plugin implementation files or create a competing CodeMirror persistence path. |
| LN-ARCH-047 | Domain file previews MAY delegate whole-file editing to the registered Markdown leaf through public serialized view state. Markdown MUST retain editor, settings, keybinding, and persistence ownership while the domain plugin owns only the return target and its structured preview. Linked external-plugin catalogs MUST deduplicate the API peer runtime so compatibility view identity and chrome projection remain valid. |
| LN-ARCH-048 | File-opening navigation MUST capture the initiating leaf state before constructing a target view that may eagerly attach itself. Back MUST restore the initiating view rather than an incomplete target-view state and MUST discard the previous file-view root before mounting it. |
| LN-ARCH-049 | `pnpm-workspace.yaml` MUST limit workspace membership to Lapis-owned directories. Published external LapisMD packages MUST resolve through registry dependency ranges in tracked manifests and lockfiles, never external workspace membership or checkout-specific paths. |
| LN-ARCH-050 | Bases MUST treat its initial blank filter row as the first predicate so the first Add Filter activation appends a second visible predicate. Nested Design Core Select portals MUST paint above the enclosing filter Popover through shared portal ordering without a Bases-owned z-index override. |
| LN-ARCH-051 | Bases MUST own one semantic query-popover width contract shared by Sort and Filter. Their portaled outer Popover contents MUST resolve the same bounded inline size while each workflow retains its own content, scrolling, and surface treatment. |
| LN-ARCH-052 | API MUST retain the shared CodeMirror autocomplete extension while UI owns its completion-popover stylesheet and application hosts load that public stylesheet after Design Core paint. Bases owns only its inline query-editor surface and focus treatment and MUST NOT gain a runtime dependency on the pruned UI package. |
| LN-ARCH-053 | Bases MUST own advanced-filter draft validation inside its query workflow. CodeMirror presents and describes the draft's accessible invalid state, while only a valid expression may cross into the applied document filter; API and Design Core contracts remain unchanged. |
| LN-ARCH-054 | App-linked runtime objects MUST resolve App through explicit injection, workspace ownership, or Svelte context. `globalThis.app` MAY remain only as a host-installed compatibility fallback, and constructing an App MUST NOT mutate global state. |
| LN-ARCH-055 | Folder-contained AI conversation files MUST be the portable source of truth and use API-owned vault durability. Chat and folder-aware history MUST remain separate views joined by a non-authoritative scope-and-ID hint that follows live folder moves in memory. The selected history scope and empty-query Agents palette MUST read portable source while the provider-filtered AppDatabase projection remains disposable and limited to cross-scope discovery and full-text previews. Workspace layout readiness MUST NOT trigger an unconditional global Search-index rebuild. |
| LN-ARCH-056 | AI History MUST remain an AI-owned, placement-neutral Explorer-style tree composed from public shared primitives. Its SearchFilterBar search field and trailing actions MUST stay centered in the panel. Host replay and native agent state MUST remain bounded, non-canonical, and safe to lose without automatically repeating a side-effecting turn. Chrome actions MUST keep a visible hover fill, and New chat MUST use the dimmed folder-context path. |
| LN-ARCH-057 | Real-agent diagnostics MUST use explicit developer-invoked supervisors around the production host boundaries. Storybook MUST remain passive, an attached loopback token MUST exist only in the supervised child environment, and Deno desktop MUST use one seeded folder as both portable vault source and native agent workspace. |
| LN-ARCH-058 | AI chat view construction MUST remain synchronous and presentation-first while conversation, catalog, and runtime preparation continue behind the mounted surface. Conversation history MUST use generic workspace leaf activation to preserve its sidebar view and route location-keyed conversations into reusable main-area tabs. The chat view MUST project scope path breadcrumbs through the generic view chrome contract. |
| LN-ARCH-059 | API MUST compose generic view access metadata into the existing plugin command lifecycle and project active API commands into the Design Core Actions tab. File Explorer and AI MUST register Files and Agents palette providers. The Files provider MUST expose a bounded recent-file or lexical-path starter set and typed path queries. First-party plugins retain placement, reuse, activation, and reveal policy for their own views. |
| LN-ARCH-060 | API MUST own the transport-neutral application tool registry, domain plugins MUST own their tool implementations, AI MUST own policy and approvals, and `@lapismd/ai-host` MUST own MCP transport. API, Search, Markdown, and portable AI code MUST NOT import MCP, ACP, acpx, or vendor agent SDKs. Authenticated remote transport MUST leave execution and note content in the owning App. |
| LN-ARCH-061 | Native Explorer copy, open, and reveal extras MUST remain File Explorer consumer work over Design Core's built-in vault-path menu. Design Core MUST NOT hardcode system paths or OS reveal. |
| LN-ARCH-062 | Generic file-tool kernels MAY live in `@lapismd/ai-host/file-tools`. API MUST supply Vault operations and AppTool wrappers. The kernel MUST NOT own conversation scope, approvals, or Vault I/O. |
| LN-ARCH-063 | `@lapis-notes/ai` MUST render assistant chat Markdown through `@lapis-notes/markdown/embed`. That helper MUST apply the App's default Mira editor extensions. AI MUST NOT add a plugin-local Markdown renderer. Chat MUST keep the embed preview surface transparent and MUST NOT nest a vertical scroller inside the bubble. |
| LN-ARCH-064 | API MUST own transport-neutral skill-source and composer slash-command registries. AI MUST own discovery, snapshots, routing, and `AppToolHost` invocation. Composer slash commands MUST remain distinct from workspace `addCommand` and from Mira editor slash commands. |
| LN-ARCH-065 | API MUST own plugin-scoped Markdown extension and file-surface registries. Domain plugins MAY contribute CodeMirror and rendered-Markdown behavior through public contracts, while the bundled Markdown plugin remains the sole Mira adapter and full-file surface provider. Contributions and providers MUST be disposed with their registering plugin. |
| LN-ARCH-066 | API-owned workspace leaves MUST split through API leaf duplication before Design Core renders the new pane. Design Core MAY own generic tab splitting, but Lapis-hosted imperative views MUST NOT create orphan design tabs without live `WorkspaceLeaf` containers, host layout projection, or translated split directions. |
| LN-ARCH-067 | The Deno desktop host MUST remain a consumer of `@lapis-notes/api`, `@lapis-notes/workspace`, and public host packages. Native window, bindings, services, vault discovery, session boot, and local distribution orchestration belong to the host. Language diagnostics MUST remain plugin-owned over the public native boundary without a duplicate host provider; terminal execution and verified asset metadata MUST use public boundaries while watching and HTTP delivery remain Deno-owned. |
| LN-ARCH-068 | Deno agent execution MUST consume the public `@lapismd/ai-host` executor. Deno MAY attach the host package's authenticated Web-standard MCP handler to its existing loopback server, but MUST retain renderer routing, event delivery, process lifetime, and shutdown ownership. |
| LN-ARCH-069 | Deno native close, menu, and external-navigation policy MUST remain host-owned while session persistence and disposal remain renderer-owned. On macOS, bootstrap and visible-window close events MUST share one coordinator and private same-origin signal. The renderer MUST show an opaque branded close surface, complete shared teardown, and acknowledge through a bounded native binding. Unavailable telemetry MUST NOT delay that acknowledgement beyond one second. |
| LN-ARCH-070 | Deno single-instance ownership MUST use an exclusive application-data lock and authenticated local handoff. The native host MUST retain URL arguments until a subscribed renderer takes them; only the ready App URL registry MAY interpret their application action. |
| LN-ARCH-071 | Plugin settings materialization MUST be idempotent at the persistence boundary. A normalized no-op update MUST NOT mutate portable vault files whose timestamps participate in generated-state reconciliation checkpoints. |
| LN-ARCH-072 | Local observability MUST remain owned by the Deno desktop host and use the API telemetry boundary. Telemetry development launch MUST require an available loopback collector and MUST NOT require a first-party plugin, product setting, remote collector, or telemetry-enabled production package. |
| LN-ARCH-073 | API MUST expose its transport-neutral telemetry contract through a narrow package entry. The Deno desktop renderer and native host MAY supply local exporters and propagation, but plugins and portable packages MUST remain exporter-neutral. |
| LN-ARCH-074 | Core startup, MetadataCache, and Search MAY emit transport-neutral spans, measurements, and lifecycle events through the App telemetry contract. Normal hosts MUST retain `NoopTelemetryService`; exporters, structured-log relays, service identities, and shutdown flushing MUST remain private to explicitly enabled Deno desktop development. Embedded AI and terminal boundaries MUST remain instrumentation scopes of the desktop service rather than separate services. |
| LN-ARCH-075 | Generated-state consumers MUST request only the indexed metadata domains they need and use path-only Search matching when only membership is required. API providers own bulk materialization, stable pagination, and transport serialization; plugins MUST NOT recreate per-file database fan-out or transfer full Search documents merely to obtain matching paths. |
| LN-ARCH-076 | Graph MUST own one application-plugin-scoped canonical-data coordinator above view instances. AppDatabase owns its disposable snapshot, MetadataCache owns reconciliation readiness and fingerprinting, Graph owns snapshot validation and rebuild scheduling, and renderers own display-only derivation. Views and controls MUST NOT create competing global scans. |
| LN-ARCH-077 | Graph canvas simulation, camera, and emphasis state MUST remain renderer-owned and independent from canonical persistence. Idle paint MUST remain neutral; only an emphasis source and incident links use accent paint. Viewport culling and screen-pixel link width MUST remain paint-only concerns that do not mutate simulation, navigation targets, or hit testing. |
| LN-ARCH-078 | Search owns indexed structured-query evaluation; Graph owns ordered Group policy, filter membership, colour precedence, and time-lapse presentation. Their boundary MUST be ordered path-only membership through AppDatabase. Graph MUST NOT import Search plugin internals, and Search MUST NOT acquire Graph settings or renderer policy. |
| LN-ARCH-079 | Graph MUST persist portable slider positions while translating them to D3 force values only inside its renderer boundary. The renderer MUST derive link weighting from topology degree rather than persisted reference counts. Settings migration MUST remain plugin-owned and preserve unrelated presentation state. |
| LN-ARCH-080 | Graph MUST cross the AppDatabase boundary through bounded metadata and link batches. Graph view failures remain locally visible and MUST also enter an owner-scoped Problems collection as active-file or workspace diagnostics; successful recovery clears them without transferring Graph lifecycle ownership to the shell. |
| LN-ARCH-081 | Desktop product identity has two host-owned layers: the renderer boot document owns branded startup content, while the native bundle owns the macOS application and menu name. Development MAY derive an ignored host bundle through Deno's supported local-host boundary, but MUST NOT mutate shared runtime caches or move identity policy into plugins. |
| LN-ARCH-082 | Design Core MUST own the reusable structured-query input, completion presentation, colour popover, and sortable-row interaction. API MUST own the shared vault syntax/completion model. Graph MUST depend only on those public contracts, AppDatabase path-only membership, and the public Markdown read-only embed while retaining viewport-clamped settings-panel composition with guttered handles, divider-free idle rows, rounded whole-row focus paint with an outer trailing gap, and visible padding-owned row actions with an internal trailing gutter; it MUST NOT import Search-plugin internals or duplicate Markdown rendering. |
| LN-ARCH-083 | The App MUST own AI memory services, durable vault records, derived AppDatabase state, recall policy, and consolidation scheduling. ACP agents and models MAY consume or propose memory through transport-neutral contracts but MUST NOT own its identity, scope, persistence, trust, or lifecycle. |
| LN-ARCH-084 | The App-owned conversation transcript MUST remain canonical across agent and model changes. Native sessions are resumable projections tracked by append-only verified cursors; providers receive only typed transcript context and MUST NOT exchange opaque state. Background summaries MAY optimize projection but MUST NOT replace transcript evidence. |
| LN-ARCH-085 | The Source Editor package MUST own host-neutral text, JSON, and YAML file associations plus shared source-editor settings. Desktop, web, and Storybook MUST load that public plugin before Markdown, while Markdown retains exclusive ownership of Markdown associations and rich rendering policy. |
| LN-ARCH-086 | AI MUST own the read-only `.jsonl` file association because it owns the portable transcript and agent record schemas. The view MUST cross only public API file-view, Design Core chat, and Markdown embed boundaries; it MUST NOT transfer append-only persistence authority to workspace presentation, add a file command, or make Source Editor interpret AI records. |
| LN-ARCH-087 | Public package release workflows MUST remain distribution infrastructure for `@lapis-notes/ui`, `@lapis-notes/api`, `@lapis-notes/language-service`, `@lapis-notes/file-explorer`, and `@lapis-notes/workspace`, in dependency order. They MUST NOT move host boot, application-owned static profiles, vault selection, persistence, desktop native bindings, web routing, or installed-plugin policy into those public packages. |
| LN-ARCH-088 | Workspace-owned plugin management MAY compose public Design Core SearchFilterBar, FilterCommandPicker, Resizable, and settings navigation primitives. Registry state, verified Markdown, filtering, installation actions, and application policy MUST remain in Lapis; reusable search, command-option, resizing, and responsive settings-shell behavior MUST remain in Design Core. |
| LN-ARCH-089 | Workspace-owned plugin management MUST distinguish installed vault artifacts from statically bundled profile plugins. Uninstall and disable actions MUST remain App-owned lifecycle operations and reuse the installed-plugin confirmation boundary without transferring package removal policy to Design Core. |

The first app-owned memory boundary is the disposable database substrate:
portable memory code calls one typed `AppDatabase` surface for checkpoints,
candidates, exact candidate origins, daily salted recall aggregates, and leased
jobs. The memory and Turso providers implement the same surface, while browser
tabs and the Deno renderer forward only the allowlisted methods. This transport
parity does not transfer memory ownership to the database owner, browser tab,
desktop worker, ACP session, or processing model.

AI constructs the native service, record store, ingestion coordinator, and idle
scheduler once per App. Conversation sessions receive only provider-neutral
context blocks and read-effect App tools. The optional consolidator is a
separately configured one-shot processor behind `MemoryConsolidationProvider`;
its restricted host session has no workspace or tool surface. Consequently an
interactive agent, model, runtime, or resumable-session switch changes only who
processes the next turn and never changes memory identity or scope.

Existing-file navigation maps Explorer intent through the public
`Workspace.activateLeaf` contract so compatibility selection, the Design Core
controller, focus, and persisted layout remain synchronized. Setting
`activeLeaf` and calling `revealLeaf` alone does not represent user-visible tab
activation. File Explorer persists Show hidden files and maps that preference
to Design Core so dotted vault names stay hidden unless the setting is on.

Current first-party hosts install a disposable application compatibility lease,
but workspace, editor, plugin, and story code resolve the App from explicit
ownership or Svelte context. The compatibility alias therefore serves legacy
consumers without selecting the owner for newly constructed runtime objects.
App constructs the workspace before the vault, so API-owned AppShell plugin
enablement persistence resolves `app.vault` when load and save run instead of
capturing it during workspace construction.

Skill-source and composer slash-command registries follow the same
explicit ownership boundary as application tools. API stores plugin
registrations. AI discovers vault and folder skills under `.agents/skills`,
snapshots them per binding, and routes composer commands from reserved
host names and `.agents/commands` Markdown, including `/help`, `/scope`,
`/context`, `/status`, and `/agent`. Local slash notices stay start-aligned
with authored line breaks and show the composer working indicator while they
prepare. The slash menu lists the same catalog commands, ranks Fuse name
matches before description hits, and submits argument-free picks
immediately. `/skills` and `/context` hydrate a missing binding snapshot
from current discovery. AI ships bundled `research` and `lapis-notes` skills.
An active skill file MUST NOT scope a new conversation to `.agents`.
Search owns composer `/search` as a `notes_search` tool-dispatch command.
The chat shows that invoke as a `ToolCalls` transcript item.
Live ACP session start appends a path-free `available_skills` manifest and a
generated `sessionBootstrap` through the host, including when the open
conversation still sits under a skill folder. The AI catalog lists live
tools, commands, and skills by owner in an explorer-aligned tree with
filter and expand-all chrome. Mira editor slash commands remain
a Markdown concern.
The application tool registry follows the same explicit ownership boundary.
It stores plugin-owned, transport-neutral callbacks on the owning App while AI
derives binding-local policy snapshots and AI Host adapts descriptors to MCP.
AI names process-backed integrations `McpServerContribution` and carries them
on `AgentRequest.mcpServers`, leaving the reserved `lapis-tools` identity for
the app-owned bridge.
API constructs immutable tool scopes from trusted conversation directories;
scope resolution rejects absolute, traversal, non-portable, and sibling-prefix
paths instead of normalizing them into a different target.
AI persists the master application-tool switch and per-tool enablement by tool
name; invocation grants and binding-local descriptor snapshots are runtime
state.
Search owns `notes_search` and applies conversation scope through the generic
database path-prefix option before result ranking and limits.
Markdown owns `notes_list`. API owns Vault-backed `read`, `write`, `edit`, and
`apply_patch` wrappers over the portable `@lapismd/ai-host/file-tools` kernel.
Those bundled descriptions steer agents to the vault tools instead of host-cwd
shell search (LN-AI-108).
The live transport is host-advertised and AI Host-owned. Node and WebSocket
hosts use the loopback broker plus official-SDK stdio shim; Deno desktop attaches
the broker's authenticated Streamable HTTP handler to its renderer server.
Because that handler shares Deno's native event loop, the renderer reserves and
subscribes to the ACP session before the host begins deferred initialization;
the native binding returns before the agent connects back to the route
(LN-AI-172, LN-DENO-055). Deno model discovery follows the same response-first
boundary: the renderer subscribes with a request id, the binding returns, and
the catalog arrives as a later runtime event (LN-AI-173, LN-DENO-056).
Native-to-renderer events are likewise scheduled for a later browser task so
their handlers cannot re-enter a native binding before window evaluation
returns (LN-DENO-057). Monotonic event replay and protocol-v4 run-state
reconciliation recover unseen terminal delivery without resending a prompt
(LN-DENO-060, LN-DENO-061, LN-AI-177).
The Deno host keeps native Turso work on a dedicated worker; synchronous driver
steps therefore cannot occupy the runtime that owns ACP and renderer events
(LN-DENO-059). Development and distribution compiles explicitly include that
worker entry so the boundary survives Deno's compiled snapshot (LN-DENO-062).
Both carry only generic bridge commands and events and never acquire registry,
policy, or transcript authority.
The AI controller allocates the binding identity before runtime start, opens
the binding-local bridge from that identity, and commits that same identity
only after startup succeeds. Replacing an agent closes the old bridge and its
approval grants before a fresh snapshot is opened for the next binding.
Runtime Allow always and Deny always decisions persist on conversation
metadata so later matching permission requests stay silent; application-tool
write grants remain memory-only (LN-AI-156, LN-AI-088).
Permission and question option buttons use Design Core's public
`feedback-option` part (LN-AI-157).
Any visible runtime or host error removes the composer working indicator while
the controller clears its owned busy state and remains retryable (LN-AI-052).
Portable AI conversation files project into Search per affected conversation;
ordinary turn persistence neither rebuilds the global index nor rewrites an
unchanged full-text row (LN-AI-176).
API owns result-view registration so Search can render `notes_search` hits
and AI can render `/skills` and `/tools` inventories (LN-PKG-100, LN-AI-158,
LN-AI-159).
The explicit real-agent probe composes these same owner boundaries through
narrow package entries: Search and Markdown supply list/search callbacks, API
supplies Vault file tools, AI supplies the binding coordinator, and AI Host
supplies the authenticated MCP transport. Its volatile App-tool vault cannot
mutate the durable seeded workspace.

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
The API owns search-query parsing and parser-safe dynamic-value formatting.
Search supplies human-readable tag, path, and filename labels to Design Core
with a separate formatted insertion value; reusable filter chrome does not
learn Lapis grammar or escaping rules.

## Package graph

```text
@lapis-notes/ui  (leaf UI)
       ↑ peer
@lapis-notes/api (kernel)
       ↑
@lapis-notes/workspace (thin Storybook-runnable shell host)
@lapis-notes/file-explorer (reusable File Explorer contribution)
@lapis-notes/search (vault indexing + Search workspace contribution)
@lapis-notes/graph (indexed global/local graph contribution; legacy controls, muted note paint, centered whole-graph initial fit, and no default leaf)
@lapis-notes/bookmarks (Obsidian-compatible Bookmarks panel; default left sidebar after Search; tree matches Explorer inset, toolbar hover, chevron-centered guides, and leaf rows that omit the disclosure column)
@lapis-notes/history (vault file-revision capture + History workspace contribution + settings)
@lapis-notes/wordcount (status-bar word, character, and reading-time count)
@lapis-notes/bases (query + document + bundled Bases presentation)
@lapis-notes/lapis-plugin-cv-roles (first-party external plugin; role workflows + retained CV views)
@lapis-notes/lapis-plugin-tasks (first-party external; hosts register the plugin class)
@lapis-notes/markdown (authorized plugin; Mira document render + side panels)
@lapis-notes/language-service (internal provider-neutral client + worker)
@lapis-notes/markdown-lint (authorized core diagnostic provider)
@lapis-notes/spellcheck (authorized Harper diagnostic provider with non-blocking warmup)
@lapis-notes/desktop-deno (native consumer host)
@lapis-notes/web (browser/PWA consumer host)

@lapismd/design-core (npm; UI primitives + workspace layout engine)
@lapismd/mira (+ mira-editor / mira plugins; npm packages)
@lapismd/storybook-addon-visual-delta (npm; root-only Storybook tooling)
```

API diagnostic hover cards keep unique action keys when titles repeat and
expose one Quick Fix menu for cached actions. The
language-service cache keeps at most one action per title for the originating
diagnostic. Markdownlint publishes per-issue Fix this actions plus Fix all
when a rule repeats, and Spell Check uses cspell-style titles. Problems rows
use the Design Core severity-slot lightbulb for those cached actions.
Diagnostics and code actions merge every matching provider; priority orders
them and does not hide a lower-priority match (LN-WS-076). Provider throw or
timeout and Lapis plugin load or enable failures publish workspace-wide
Problems rows (LN-WS-077, LN-WS-078). Web hosts serve Harper WASM as
`application/wasm` so WorkerLinter setup can finish (LN-WEB-030, LN-SPL-009).
Markdownlint messages use the vscode rule-path form, and the API bridge
publishes each rule code with its documentation URL.
Hover-card positioning reads editor layout only in the CodeMirror measure
cycle so document, viewport, and geometry updates cannot crash the lint
plugin.
Lint hover cards open only from the underlined diagnostic range or gutter
marker, not from a same-line document-position hit.
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
Deno desktop, web, and the root real-App catalog consume its package exports and
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
loaded alternate workspace filename. Problems is always a host-owned view type,
including during `loadLayout` before plugin start, so a persisted leaf or
leftover empty missing-view placeholder remounts as `workspace:problems`
instead of a ghost surface. Hydration does not seed a quiet bottom tab. Claimed leaves keep their serialized id and live
`getState()` across collapse, remount, and controller projection. Default file
navigation reuses an empty or file-backed main leaf instead of replacing a
non-file view. Restoring a non-file leaf still loads that view when its
snapshot includes a follow `file` path. Missing-view placeholders use the Lucide ghost icon; ordinary
empty New Tabs keep the file empty icon. Settings displayed by the shell remain
controller-owned while persisting through api configuration; the workspace
shell does not initiate configuration or plugin loading. A missing workspace
file seeds File Explorer, Search, then Bookmarks on the left and Outline, File Properties,
and Tags on the right when those views are registered. Named Save and Load
layout commands persist snapshots in `.obsidian/workspaces.json`, and Reset
reapplies that default seed.
`@lapis-notes/api/workspace-host` is the explicit integration seam: root api
exports retain their compatibility shape while workspace hosts can obtain the
controller without reaching into api internals.
Every workspace package exposes the common `build`, `check`, and `test`
contract, so the shell participates in the same Turbo verification graph as
the kernel and retained UI surface.

The desktop renderer bundles its workspace consumers, while the Deno host
retains native lifecycle and service dependencies. Native commands cross an
explicit binding allowlist. Renderer shutdown is acknowledged before window
destruction so the API-owned session can persist and dispose without moving
ownership into native code or workspace. Before shared UI mounts, the renderer
projects the native host's selected webview or CEF backend into the document
engine marker so compatibility behavior does not depend on Laufey's user-agent
shape. Deno desktop composes a host-supplied
native Turso provider through an allowlisted AppDatabase bridge, while web
composes the API-owned WASM provider in the renderer behind the same session
boundary. Web WASM database imports use the driver's host-bundler entry so Vite
serves worker and WASM assets without pulling the prebuilt worker-inline module
through Rollup.
The Deno host also supplies native window-control geometry as a public Design
Core workspace token. Design Core decides which leading main-pane header uses
that input when the left sidebar is closed; the host retains ribbon and macOS
traffic-light measurements plus the separate open-sidebar tab-bar inset.
The macOS host also lowers the three native standard window buttons through a
platform-isolated adapter so they share the open left-sidebar header's
centreline; renderer controls and shared Design Core geometry remain untouched. Its
application menu owns a single reusable native About window, whose dedicated
renderer composes Design Core's public About surface without creating a vault,
plugin runtime, or second application session. The host completely closes that
secondary native window for renderer and native dismissals before a later menu
action creates a fresh instance. The pnpm development launcher passes the
tracked visible-background Lapis icon to Deno while production retains signed
bundle metadata. The desktop package owns deterministic light and dark
rounded-tile variants. On macOS, the main renderer forwards only the
operating-system colour-scheme state through a private binding and the native
host updates AppKit's application icon when that state changes; no vault,
plugin, or application setting owns Dock identity.
Before the renderer mounts, its boot document presents the Lapis mark and
application-specific loading copy. During macOS development, the launcher
derives a package-local WebView or CEF host from the pinned Deno toolchain,
applies the same bundle name and identifier used by packaged output, and asks
Deno to launch that ignored host. The shared Laufey cache remains immutable.
The web consumer owns its launcher and PWA lifecycle. It opens Turso WASM over
OPFS in exactly one Web Locks owner per vault; other tabs retain the generic
database contract through bounded BroadcastChannel RPC and may promote when
the owner disappears. Neither role is cloud synchronization. The launcher can
copy a picked local folder into a new OPFS vault, and an open OPFS session can
import into or export that vault through host Settings and commands
(LN-WEB-038, LN-WEB-039, LN-WEB-040, LN-WEB-041, LN-WEB-042, LN-WEB-043).
The branded vault launcher is a renderer-side desktop consumer: it chooses a
native profile, then delegates storage and workspace lifecycle to API sessions.
While a host resolves a saved current profile, it hosts Design Core
`WorkspaceStartup` and MUST NOT paint that chooser. Manage Vaults and desktop
Open Vault… overlay the chooser over a retained session; Close returns without
disposing.
If saved-vault restore fails, the desktop host retains that profile and presents
the native failure instead of silently deleting the recovery route. Deno
filesystem bindings preserve missing, permission, wrong-type, busy, and
existence classifications so a protected folder is not misreported as absent.
Startup failure details retain the complete stack and local absolute target for
copying. Recovery choices are session-scoped `AppSafeModeState`: optional core
plugins and layout restoration can be disabled before startup, a broken saved
layout can be removed explicitly, and a recovered shell shows a Safe Mode
banner with generated-index rebuild and normal-restart actions. These controls
do not add canonical vault settings or unavailable community/notebook policy.
After that selection, desktop and web session boot render Design Core
`WorkspaceStartup` for vault, configuration, plugin, and layout progress
instead of a host-owned placeholder. The desktop host supplies its package-local
Lapis logo in place of the visible loading title while keeping that title as the
region's accessible name. The plugins task reports the current plugin name.
Metadata index load starts after layout restoration so database
readiness does not contend with `loadLayout`. Persisted queries become
available before background reconciliation. Matching versioned Metadata and
Search checkpoints skip full warm scans; stale Metadata reconciliation finishes
before the single Search startup reconciliation begins. Configured provider
registration is folded into that one pass, and unrelated configuration or
workspace-file events cannot invalidate the Search checkpoint. Load, rebuild, and
reconcile stay under status progress handles, report determinate
processable-file counts, yield between bounded batches, and parse changed
Markdown metadata in a worker. `App`
registers rebuild-vault-cache and
rebuild-generated-state so a later manual rebuild uses the same handle
(LN-PKG-097, LN-PKG-098). `App` constructs `NotificationManager`
before `Workspace` so the host can project that progress. Native window-drag regions stay in Design
Core chrome CSS; hosts do not re-declare `-webkit-app-region`.
Desktop and web “View all” palettes keep host-owned Dialog chrome and compose
Command View for the searchable recent-vault list.
The ready-shell vault menu follows the same boundary: Design Core presents the
generic menu, the workspace package forwards its contract, and the desktop
consumer supplies profiles plus serialized switch and management callbacks.
Generated renderer and main outputs are Turbo cache outputs and remain
untracked; checked-in build resources are limited to deterministic icon
variants, their macOS fallback, and entitlements.
The production renderer imports Design Core's public stylesheet and Lapis theme
plus the Lapis UI alias sheet before mounting either the launcher or workspace.
Its Vite pipeline compiles the desktop launcher's utility classes; reusable
workspace paint remains supplied by the public Design Core stylesheet rather
than Storybook-only configuration. Native window-control clearance is applied
by host CSS against Design Core's semantic shell attributes. The
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
menu presentation while plugins retain their control policy. Status-bar upserts
notify adapters only when visible item fields change (LN-PKG-090), so identical
writes cannot loop layout restore (LN-WS-075). The adapter keeps
compatibility view sections ahead of generic split, move, and close actions.
The editor demo's Markdown and JSON language packages are root-only Storybook
development dependencies. The API continues to expose the generic editor
extension registry and source view, not a bundled language policy.
`@lapis-notes/ai` is an authorized bundled plugin. It contributes an Open Chat
left-ribbon action that reuses the same reveal path as its opening command.
The desktop native bridge
advertises an `agent-runtime` capability for process-backed ACP and Codex
sessions while the reserved `model` capability stays unavailable. The plugin
obtains live runtimes from that host factory and keeps adapters off the root
export. Cursor uses the same ACP runtime as Codex through the selected agent
name. Process execution lives in public `@lapismd/ai-host`, used in-process by
Deno desktop and as `lapis-ai-host serve` for WebSocket clients. User-global agent
command storage is a host capability, so renderer bundles must not statically
pull the AI plugin's Node-only command-store module into the browser graph.
The same desktop bridge advertises `terminal-runtime`. Deno desktop embeds
public `@lapismd/terminal-host/deno` in-process, supplies a verified Sigma
native library, and binds each session workspace to the create payload vault
path, otherwise `terminal.cwd`, otherwise the home directory. Terminal server Settings tell the
user to start `lapis-terminal-host serve --workspace` on the vault or a parent
of `terminal.cwd`.
The web host attaches or replaces that WebSocket after configuration load
from persisted Settings or env-prefilled URL and token, without overwriting a
native desktop bridge. The token Settings field stays masked until revealed. Chat shows a start-server message when a live runtime is
selected and no host is connected. Chat sessions
persist runtime, provider, model, and thinking context through plugin data.
Default Codex and Cursor model listing uses the selected agent through an
agent-scoped disposable ACP session. A native host advertising deferred model
discovery returns a request id before delivering that catalog through its
runtime event stream, so neither default catalog starts a renderer-owned
process. The separately exported native Codex adapter retains its process-host
catalog for explicit native surfaces only. Cleanup falls back to local session
closure when the agent does not advertise `session/close`, without discarding a
successful catalog. The host consumes the maintained ACP adapter supplied by
its acpx release and applies optional thinking controls only when the created
session advertises them. Native Codex and ACP normalize
thinking, tool, permission, user-input, and error events before the shared
controller renders them. Adjacent tool items share one collapsed Design Core
`ToolCalls` group, and tool details unwrap envelope payloads into `json`,
`bash`, or `plaintext` `CodeBlock` language (LN-AI-133). A busy composer
Stop control cancels the active turn immediately, without waiting for the
runtime cancel to settle, and stays fully opaque while input remains disabled.
Stop also drops a still-preparing first send so it cannot start after busy
clears. The first user message stays visible while conversation create and
session start finish (LN-AI-106, LN-AI-120). Thinking stays expanded only while
it streams and collapses when later transcript data arrives (LN-AI-131). Stop
settles leftover spinners immediately and posts a cancelled system notice after
cancel confirms (LN-AI-132). The notice reads `Agent turn cancelled`.
An unreadable open conversation
is reported and released so the next send starts a replacement chat
(LN-AI-124).
Runtime Allow always and Deny always decisions persist on conversation
metadata (LN-AI-156).
Permission and question option buttons use Design Core's public
`feedback-option` part (LN-AI-157).
Registered result views render tool detail and `/skills` `/tools` inventories
(LN-AI-158, LN-AI-159).
An unpinned idle chat follows the active-file folder and shows a faded centered
scope control. Its folder Command View includes Vault root and reveals an
explicitly selected scope in Explorer before applying the same zero, one, or
many conversation transition. Pinning still prevents automatic active-file
follow (LN-AI-160, LN-AI-161, LN-AI-162, LN-AI-163, LN-AI-178).
AI History chrome keeps a visible hover on search actions, a dimmed
creation-folder path, and New chat in that Explorer or History-tree folder
(LN-AI-165, LN-AI-166, LN-AI-167, LN-AI-168).
History folder counts share one trailing edge across depths (LN-AI-169).
Application-tool names and arguments stay visible when ACP only reports a
generic `tool call` title (LN-AI-125).
Assistant MarkdownEmbed content grows with the transcript instead of a nested
scroller (LN-AI-122). The composer overflow menu sits after History and attach, sizes to its
labels so they stay fully visible at the model-menu type size (LN-AI-123),
archives or restores in
place, deletes through vault trash, and offers New Chat (LN-AI-109). AI History opens as an ungrouped right
sidebar leaf and keeps that leaf while a conversation opens in the main area. Portable conversation bindings and transcript entries
are stored beneath the captured vault scope; plugin data remains settings-only.
Runtime-neutral pending interactions are presented
through Design Core's Composer Drawer; provider request objects and secret
answers never enter persisted chat data.
The paperclip attach picker uses that same drawer surface: host Popover chrome
stays above the open drawer while Command View owns the searchable file list.
Attachment chips keep Design Core's public drawer chip and remove parts.

## Tooling policy

Root scripts stay thin: configured shared specification validation,
`check:no-tailwind`, Turbo for package tasks, `spec:first` for change mapping,
and Storybook for docs. Root `restart:web` frees the web Vite port, then
starts the existing `dev:web` lane. Do not grow a parallel script forest for
import path syncing. Lapis policy stays in `spec-validator.config.mjs`, while reusable
validators and their tests stay in `@lapismd/spec-validator`. QMD discovery
uses that same root-only tooling boundary. Storybook manager-only dependencies,
including the shared theme toolbar icons, remain root development tooling and
do not enter the runtime package graph.
Web and Deno own their Vite renderer interop policy. Registry package source
continues through the appropriate Svelte transform, while deep Mira modules and
their transitive CommonJS dependencies are pre-bundled before a native browser
module loader sees them. Local tarball installation preserves the committed
registry lockfile and invalidates generated consumer caches only when the
verified release-candidate fingerprint changes.
The repository-local Storybook structure audit consumes the same structured
command-panel registry as the visual catalog so command metadata, canonical
story paths, and six-placement coverage cannot drift independently.
Hosts still start metadata index load after layout; file-scoped Markdown
panels query persisted rows at `loaded` and refresh from revisioned changes
without blocking shell mount.
The metadata controller keeps only a 512-entry access-ordered hot set during
normal production use. A community or official compatibility plugin may hold a
reference-counted snapshot lease; the first lease materializes the full maps,
committed database changes refresh them, and the last release returns the
controller to the bounded hot set. Core and system code never acquire this
lease and consume the indexed query boundary instead.
First-party panels suppress stale async results with a local generation and
translate committed database revisions into only the queries their surface
owns. A query failure remains visible and never selects snapshot enumeration
as a fallback.
The deterministic metadata performance runners seed the same normalized schema
for native and real WASM/OPFS sessions. Their 50,000-note gate measures direct
database readiness and indexed queries without mounting a vault-sized
JavaScript model; the 100,000-note lane remains reported stress evidence.
