# Packages

The API package owns `AppDatabase` contracts and transport-neutral
metadata/revision types. The Deno desktop host owns native connections and
bounded bindings; domain persistence remains API-owned.

`@lapis-notes/api` owns the transport-neutral Markdown contribution and file
surface registries. `@lapis-notes/markdown` adapts them to Mira and registers
the full-file provider, including the LN-MD-108 and LN-MD-109 document defaults;
its Reading wrapper owns the LN-MD-110 viewport placement and content clearance.
The same package supplies Mira with vault-backed frontmatter value suggestions
for Live Preview, Reading, and File Properties without moving vault access into
the linked renderer.
Domain plugins consume only the API contract.

Repository-only Storybook taxonomy, mirror, and built-index checks remain
development tooling at the root and are excluded from publishable package
runtime closures. AI model menus consume structured host catalog labels while
`@lapis-notes/ai` still has no runtime `@lapismd/ai-host` dependency. The external Roles package remains a production host
dependency only and does not enter the root Storybook development closure.
`@lapis-notes/api` exports the namespaced projection query AST and allowlisted
`queryProjection` methods so plugins can register collections and read public
rows, including `tasks/task`, without importing each other. The tasks
projection `planKind` values are `anytime`, `morning`, `afternoon`,
`evening`, and `time`. `NativeDesktopRuntime` names only `deno-desktop`; the
production hosts are Deno desktop and web. Root `dev:desktop`,
`dev:desktop:cef`, `build:desktop`, `package:desktop`, and
`test:desktop:packaged` scripts select and exercise the Deno package.
The desktop development script is a pnpm entrypoint that starts the Deno desktop
host, so its Deno arguments must stay consistent with the package-local
`deno.json` imports rather than imposing a root-level package-manager policy.
The Deno package also owns the initial HTML boot surface displayed before the
renderer mounts. It uses the package-local Lapis logo without visible loading
copy, retains an accessible status name, and must not move workspace startup
policy out of the application packages.
It also owns the native console threshold. `LAPIS_DENO_LOG_LEVEL=debug` enables
command-name-only bridge traces; the default `info` level suppresses that
routine traffic while retaining lifecycle, warning, and failure diagnostics.
The package development launcher MUST pass Deno's quiet flag, omit native
inspection by default, and reject it in telemetry mode so inspector-only
binding diagnostics cannot expose arguments or return values outside that
threshold.

## Requirements

| ID         | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LN-PKG-001 | `@lapis-notes/api` MUST remain the shared runtime kernel: app container, vault/storage contracts, workspace model, plugins, commands, settings, metadata, and editor abstractions.                                                                                                                                                                                                                                                                                                                                                                     |
| LN-PKG-002 | `@lapis-notes/api` MUST depend on `@lapis-notes/ui` as a peer for shared UI primitives used by kernel components.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| LN-PKG-003 | `@lapis-notes/ui` MUST export only the pruned surface required by api (plus documented transitive dependencies).                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| LN-PKG-004 | Notebook and remaining unlisted plugin packages MUST NOT be added until specified and tracked in `MIGRATION.md`. The production hosts are Deno desktop and web. Authorized plugins are Source Editor, Markdown, Markdownlint, Spell Check, File Explorer, Bookmarks, Search, Graph, Bases, AI, History, Word Count, Roles, Tasks, Docs, and Terminal. Authorized host infrastructure MAY include public `@lapismd/ai-host` and `@lapismd/terminal-host`.                                                                                                     |
| LN-PKG-015 | `@lapis-notes/markdown` MUST live in the sibling `lapis-plugins` monorepo, depend on `@lapis-notes/api` and published Mira packages, and preserve the existing Plugin registration and editor configuration/event contracts without forking them. Its full Reading wrapper MUST use an inherited Design Core Scroll Area; its editing wrapper MUST bound the public embedded editor without creating a second vertical document scroll owner. |
| LN-PKG-005 | Package public exports MUST stay source of truth in each package `package.json` `exports` map.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| LN-PKG-006 | Vault profile storage kinds MUST be limited to `opfs`, `file-system-access`, and `desktop-folder`. LightningFS / legacy browser IndexedDB vault adapters and host-framework-specific kinds (for example former `tauri-folder`) MUST NOT be retained.                                                                                                                                                                                                                                                                                                   |
| LN-PKG-007 | `@lapis-notes/workspace` MUST expose the design-core shell around an application-supplied `App` without providing a production in-memory backend or invoking the Lapis plugin loader. It MAY map flat app configuration into generic Design Core shell presentation inputs.                                                                                                                                                                                                                                                                            |
| LN-PKG-008 | `@lapis-notes/api` MUST configure the owned design-core controller with overridable plain Lapis application metadata and the notifications presentation as the minimal required static shell plugin. F-Mode MAY be an additional optional static plugin. This MUST remain separate from api plugin loading and distribution. AppShell configuration, including scrollbar visibility, MUST use the API configuration bridge, while plugin enablement persistence MUST resolve the App vault when load and save run.                                     |
| LN-PKG-009 | `@lapis-notes/api` MUST expose the design-core V3 bottom panel through Lapis-native workspace wrappers and controls without leaking design-core types through the root api export. API layout commits MUST keep a host-registered Problems leaf as that view type rather than a missing-view placeholder. Claimed leaves MUST keep their id and live `getState()`; default file navigation MUST NOT replace a non-file main view.                                                                                                                      |
| LN-PKG-010 | `@lapis-notes/api` MUST expose the reusable volatile vault and concrete source-text view required by the editor demo; application-specific source-editor and Explorer registration policy MUST remain outside the kernel.                                                                                                                                                                                                                                                                                                                              |
| LN-PKG-011 | CodeMirror Markdown and JSON language packages used by Storybook intake plugins MUST remain root development dependencies rather than runtime dependencies of api or workspace.                                                                                                                                                                                                                                                                                                                                                                        |
| LN-PKG-012 | `@lapis-notes/api` MUST consume `@lapismd/mira` through its published npm package and built public exports for the shared source-editor CodeMirror shell; package manifests MUST use a portable semver dependency range.                                                                                                                                                                                                                                                                 |
| LN-PKG-013 | `@lapis-notes/api` MUST paint the source-editor inline filename title with public `--ui-editor-inline-title-*` tokens and MUST contribute file-view breadcrumbs, leaf history, and header title rename (`titleEditable` / `onTitleCommit`) through the workspace-host `getChrome` projection. Non-file views MAY contribute prefix crumbs and a breadcrumb file path through View hooks.                                                                                                                                                               |
| LN-PKG-014 | `@lapis-notes/api` `markupEditor` MUST accept a language ID for `data-language` host attributes and default the editor face to Mira monospace with Markdown and text sans overrides.                                                                                                                                                                                                                                                                                                                                                                   |
| LN-PKG-016 | `@lapismd/storybook-addon-visual-delta` MUST remain a private root development dependency resolved from its published npm semver package; it MUST NOT enter api, ui, workspace, or plugin package manifests.                                                                                                                                                                                                                                                                                                                                           |
| LN-PKG-017 | `@lapis-notes/markdown` MUST publicly export app-only Svelte components for All Properties, File Properties, Outline, Backlinks, Outgoing Links, and Tags as documented by their owning panel pages. The public Outline and Tags surfaces MUST preserve their governed tree geometry without requiring consumer styling, and `@lapis-notes/workspace` MUST remain shell-only.                                                                                                                                                                          |
| LN-PKG-043 | Public `@lapis-notes/file-explorer` MUST own the reusable File Explorer plugin implementation formerly co-located with Storybook, publish from built exports at an independent `0.1.0` baseline, and consume framework dependencies through npm semver ranges. It MAY map Design Core current, reveal-or-create, and forced-new-tab activation intents to API workspace leaves and MUST persist Show hidden files, but MUST NOT own vault selection, session boot, persistence policy, or source-editor fixtures.                                                                 |
| LN-PKG-044 | `@lapis-notes/search` MUST publicly expose its plugin, grouped result panel, manager, settings model, semantic status, and settings tab. It MUST consume API database contracts and Design Core presentation without moving vault search policy into `@lapis-notes/workspace`.                                                                                                                                                                                                                                                                         |
| LN-PKG-045 | `@lapis-notes/api` MUST export provider-neutral app-database descriptors, capabilities, factories, and session integration while retaining explicit database injection for tests and Storybook.                                                                                                                                                                                                                                                                                                                                                        |
| LN-PKG-046 | Private `@lapis-notes/web` version `2026.6.3` MUST live at `packages/web` and expose `dev`, `build`, `check`, and `test` scripts.                                                                                                                                                                                                                                                                                                                                                                                                                      |
| LN-PKG-047 | Production app-database persistence MUST use pinned Turso native or WASM packages. The WASM importer MUST use a host-bundler-compatible package entry. SQLite, sqlite-vec, and IndexedDB app-database implementations MUST NOT remain as importers or fallbacks.                                                                                                                                                                                                                                                                                       |
| LN-PKG-048 | `@lapis-notes/api` `markupEditor` MUST retain a 700px readable content column when its workspace pane is wide enough. Narrow panes MAY use the configured file margins, but closing either sidebar MUST NOT shrink the editor body.                                                                                                                                                                                                                                                                                                                    |
| LN-PKG-049 | `@lapis-notes/lapis-plugin-cv-roles` MUST live in the sibling `lapis-plugin-cv-roles` repository, version independently, and expose `build`, `check`, and `test`. It owns Roles workflows, retained CV behavior, and the ported legacy Applications presentation while delegating reusable leaf controls to public Design Core APIs.                                                                                                                                                                                                                   |
| LN-PKG-050 | `@lapis-notes/lapis-plugin-cv-roles` MUST expose Storybook interaction and static-build scripts. Its package build MUST emit portable declarations without linked sibling implementation paths.                                                                                                                                                                                                                                                                                                                                                        |
| LN-PKG-051 | `@lapis-notes/lapis-plugin-cv-roles` MUST consume Markdown rendering and source presentation from public `@lapismd/mira` exports. It MUST NOT import Mira source paths, target private CodeMirror selectors, or copy its renderer.                                                                                                                                                                                                                                                                                                                     |
| LN-PKG-052 | `@lapis-notes/lapis-plugin-cv-roles` MUST own the adapted legacy Applications components and native CSS in its source tree. It MUST NOT retain a runtime or build dependency on `/Users/stevejuma/code/cv`, `@cvstudio/*`, or legacy Tasks and AI modules.                                                                                                                                                                                                                                                                                             |
| LN-PKG-053 | External plugins MUST consume semver peer dependencies for host runtimes and exact development dependencies. API, UI, Workspace, Design Core, and Mira MUST remain pack-testable versioned artifacts that support clean standalone compilation.                                                                                                                                                                                                                                                                                                        |
| LN-PKG-054 | `@lapis-notes/bases` MUST live in the sibling `lapis-plugins` monorepo, expose build, check, test, publint, root runtime, stylesheet, npm-package, and `.lapis-plugin` contracts, and publish only its governed public surface. It MUST compose shared controls through public Design Core exports and MUST NOT depend on `@lapis-notes/ui`. |
| LN-PKG-055 | `@lapis-notes/api` MUST publicly export search-document provider types and the registry used by separately versioned first-party plugins without requiring an import from `@lapis-notes/search`.                                                                                                                                                                                                                                                                                                                                                       |
| LN-PKG-056 | `@lapis-notes/workspace` MUST be a public, pack-tested package with portable semver dependencies. Colocated first-party consumers MAY exercise matching workspace source during development, but their publishable manifests MUST remain registry-compatible.                                                                                                                                                                                                                                                                                          |
| LN-PKG-057 | `@lapis-notes/api` MUST expose reactive status-item changes and project visible items plus compatibility ribbon actions into the active public workspace shell.                                                                                                                                                                                                                                                                                                                                                                                        |
| LN-PKG-090 | API `StatusBarManager.upsertItem` MUST notify subscribers only when a visible status field changes. Identical id, text, segments, icon, spin, tooltip, command, when, alignment, priority, and sourcePlugin MUST NOT notify. A `buildMenu` replacement alone MUST NOT count as a visible change.                                                                                                                                                                                                                                                       |
| LN-PKG-058 | `@lapis-notes/api` search evaluation MUST derive queryable property records from normalized search-document metadata without mutating the vault metadata index.                                                                                                                                                                                                                                                                                                                                                                                        |
| LN-PKG-059 | `@lapis-notes/api/editor` MUST export the embedded editor component and extension-resolution helpers used by separately versioned plugins. Its `scrollOwner` input MUST default to `self` and permit `ancestor` without mounting an inner Scroll Area. The export MUST remain usable when the bundled Markdown plugin is disabled.                                                                                                                                                                                                                     |
| LN-PKG-060 | `@lapis-notes/api` MUST export the Markdown view return-target and serialized-state types used by separately versioned domain plugins. The bundled Markdown package MUST consume that public state without adding a runtime dependency from the external plugin to Markdown implementation code.                                                                                                                                                                                                                                                       |
| LN-PKG-061 | `@lapis-notes/api` `WorkspaceLeaf.openFile` MUST snapshot history before target-view construction so eager compatibility views cannot replace the initiating state recorded for Back. Restoring a plain `View` MUST remove the shared file-view content root before mounting it.                                                                                                                                                                                                                                                                       |
| LN-PKG-062 | `@lapis-notes/api` `Vault.getFilesByGlob` MUST return current vault files matching the shared editor-association glob dialect without adapter I/O. Exact case-sensitive filenames MUST use an indexed lookup, while filename and path globs MUST remain deterministic across vault lifecycle changes.                                                                                                                                                                                                                                                  |
| LN-PKG-063 | `@lapis-notes/ai` MUST live in the sibling `lapis-plugins` monorepo, expose build, check, test, publint, npm-package, and `.lapis-plugin` contracts, and publish only its governed public surface. It MUST depend on API and Design Core, MUST NOT depend on `@lapis-notes/ui`, and MUST keep provider-specific types behind plugin-owned runtime-neutral contracts. |
| LN-PKG-064 | Root local-development configuration MUST keep published external LapisMD packages on portable registry ranges in tracked manifests and lockfiles. External repositories MUST NOT become Lapis workspace packages.                                                                                                                                                                                                                                                                       |
| LN-PKG-065 | `@lapis-notes/bases` filter groups MUST preserve the initial predicate when adding another row and compose nested Design Core Select portals without package-local stacking overrides. The built package MUST retain these filter interaction semantics.                                                                                                                                                                                                                                                                                               |
| LN-PKG-066 | `@lapis-notes/bases` MUST ship one private semantic query-popover sizing rule consumed by its Sort and Filter Popover contents without changing public package APIs.                                                                                                                                                                                                                                                                                                                                                                                   |
| LN-PKG-067 | `@lapis-notes/ui/codemirror-autocomplete.css` MUST remain a native-CSS public stylesheet that consumes Design Core Popover and Command semantics without requiring a host Tailwind theme. Storybook, web, and desktop hosts MUST load it after the shared theme, while Bases MUST remain independent of `@lapis-notes/ui`.                                                                                                                                                                                                                             |
| LN-PKG-068 | `@lapis-notes/bases` MUST retain advanced-filter draft validation, accessible CodeMirror invalid attributes, and Bases-owned native error paint in its built package. This validation MUST remain private and MUST NOT change the public package API.                                                                                                                                                                                                                                                                                                  |
| LN-PKG-069 | Public `@lapismd/ai-host` MUST live in the `ai-host` repository, version independently, and expose `build`, `check`, `test`, and a `lapis-ai-host` CLI. Lapis hosts MUST consume it through published npm semver ranges. `@lapis-notes/ai` MUST NOT depend on it at runtime.                                                                                                                                                                                                              |
| LN-PKG-070 | `@lapis-notes/api` MUST expose an App context, ownership resolver, and disposable compatibility lease. Explicit or workspace-owned App references MUST win over the compatibility alias, and releasing an older lease MUST NOT clear a newer host's alias.                                                                                                                                                                                                                                                                                             |
| LN-PKG-071 | First-party runtime and Storybook source MUST be audited against direct ambient App reads or assignments outside the compatibility bridge and dedicated fallback tests. Both root `pnpm check` and `pnpm spec:check` MUST run the audit.                                                                                                                                                                                                                                                                                                               |
| LN-PKG-072 | Configuration schema defaults MUST NOT write `.obsidian/app.json` before the initial persisted configuration load completes. Initial loading MUST preserve persisted and unknown keys while adding registered defaults, and later schema registration MUST persist newly introduced defaults through the normal serialized writer.                                                                                                                                                                                                                     |
| LN-PKG-073 | Root web and desktop build scripts MUST select each host plus its dependency closure through Turbo. Host test and distribution preflights MUST invoke those root cached builds rather than rebuilding the host directly.                                                                                                                                                                                                                                                                                                                               |
| LN-PKG-018 | `@lapis-notes/markdown` MUST expose its reusable Mira-backed `FileEmbed`, `MarkdownEmbed`, and `NoteLink` surfaces through the root package and the narrow `@lapis-notes/markdown/embed` export.                                                                                                                                                                                                                                                                                                                                                       |
| LN-PKG-019 | The public Lapis `FileEmbed` wrapper MUST add optional `editable` and bindable `editing` inputs while defaulting to its existing read-only behavior. Editable full-note rendering MUST compose Mira's public `EditableMarkdownPreview`; direct `MarkdownEmbed`, `NoteLink`, and ordinary `FileEmbed` consumers MUST remain source-compatible. The package adapter owns only Lapis vault resolution and persistence, while Mira owns activation, CodeMirror, autosave serialization, dirty-buffer protection, and preview/editor mode changes.          |
| LN-PKG-020 | Editable `FileEmbed` MUST expose an imperative `exit()` that delegates to Mira's persistence-safe editable-preview exit contract and accept an additive `returnToPreviewOnBlur` input. Link-panel consumers MUST disable blur exit and use the imperative operation for outside-click dismissal; default and read-only consumers MUST remain source-compatible.                                                                                                                                                                                        |
| LN-PKG-021 | The Lapis `FileEmbed` wrapper and full-file Markdown surface MUST establish `data-mira-theme="obsidian"` for portable Mira descendants. Editable-card padding MUST target only the rendered preview branch of `EditableMarkdownPreview`; it MUST NOT match CodeMirror's nested rendered widgets or change live-edit frontmatter geometry. No new public component input is introduced.                                                                                                                                                                 |
| LN-PKG-022 | Retained `sidebar-custom` wrappers around design-core Input and Separator MUST publish portable component declarations. Their explicit public prop types MUST derive from design-core's public component contracts, and generated `@lapis-notes/ui` declarations MUST NOT name sibling-repository `node_modules` realpaths or dependency-internal Svelte/Bits UI installations. Runtime markup, bindings, and accepted props remain unchanged.                                                                                                         |
| LN-PKG-023 | `@lapis-notes/api` `markupEditor` MUST mount the configured CodeMirror fold gutter when language ranges and settings enable it. The Markdown integration MUST be able to suppress that gutter because Mira supplies inline fold controls.                                                                                                                                                                                                                                                                                                              |
| LN-PKG-024 | The API-owned editor ScrollArea MUST fill without exceeding its workspace view and own long-document scrolling. Its nested CodeMirror scroller MUST expand without a vertical scrollbar. The editor scrollbar MUST retain its complete pointer target above adjacent workspace resize rails.                                                                                                                                                                                                                                                           |
| LN-PKG-025 | `@lapis-notes/markdown` MUST export the real `AllProperties` Svelte component with only `app: App` as its input so Storybook documents the package interface rather than its placement harness.                                                                                                                                                                                                                                                                                                                                                        |
| LN-PKG-026 | Shared movable-panel chrome MUST consume design-core's resolved workspace-view foreground and background tokens without duplicating workspace placement detection or surface selectors.                                                                                                                                                                                                                                                                                                                                                                |
| LN-PKG-027 | Specialist Markdown panel content MUST shrink to the complete available inline size and MUST NOT request two-axis panel scrolling to preserve a fixed internal width.                                                                                                                                                                                                                                                                                                                                                                                  |
| LN-PKG-028 | Lapis embed wrappers MUST bind Mira's portable rendering contract to an explicit `app: App` without copying Mira's renderer or requiring consumer-owned source aliases.                                                                                                                                                                                                                                                                                                                                                                                |
| LN-PKG-029 | Link-panel previews MUST compose Design Core Hover Card, use a viewport-capped 26rem width, follow the trigger document, and remain open during pointer or focus handoff from the full mention row into interactive content.                                                                                                                                                                                                                                                                                                                           |
| LN-PKG-030 | Ordinary document-link previews MUST remain owned by Mira's built package and receive only Lapis's `MiraFileAdapter`. One App MUST reuse one adapter instance. The Markdown package MUST NOT add a consumer portal or clipping workaround.                                                                                                                                                                                                                                                                                                             |
| LN-PKG-031 | `@tobilu/qmd` 2.5.3 MUST remain a pinned root development dependency. Its native build approvals and TypeScript peer MUST remain root tooling and MUST NOT enter workspace package manifests.                                                                                                                                                                                                                                                                                                                                                          |
| LN-PKG-032 | `@lapis-notes/api` MUST own the ordered adapter from compatibility `ItemView.actions` and `View.onPaneMenu` contributions to design-core workspace chrome. `@lapis-notes/workspace` remains a rendering host and MUST NOT add plugin-specific actions.                                                                                                                                                                                                                                                                                                 |
| LN-PKG-033 | `@lapis-notes/markdown` MUST render grouped Boolean Settings through design-core's public `WorkspaceSettingGroup` toggle-table contract. It MUST NOT introduce a package-local settings table or stored group value.                                                                                                                                                                                                                                                                                                                                   |
| LN-PKG-034 | Public `@lapis-notes/language-service` MUST live at `packages/language-service` as a provider-neutral Markdown client and worker package, publish built root, Markdown, and Markdownlint runtime exports at an independent `0.1.0` baseline, and consume framework dependencies through npm semver ranges. It MUST expose build, check, and test scripts without owning workspace presentation or vault navigation.                                                                                                                               |
| LN-PKG-091 | The Markdownlint worker document shim MUST report `document.compatMode` as `CSS1Compat`. It MUST NOT leave the worker global in quirks mode when renderer libraries inspect that field.                                                                                                                                                                                                                                                                                                                                                                |
| LN-PKG-035 | `@lapis-notes/markdown-lint` MUST live in the sibling `lapis-plugins` monorepo as an independently versioned installable plugin. It MUST depend on the public API and language-service contracts without importing Design Core presentation. |
| LN-PKG-036 | `@lapis-notes/api` MUST provide compact, interactive CodeMirror diagnostic hover cards and centered severity gutter markers. The card MUST remain stable while the pointer enters its controls. The implementation MUST consume public Design Core icons without importing Problems presentation internals.                                                                                                                                                                                                                                            |
| LN-PKG-082 | `@lapis-notes/api` MUST render diagnostic hover-card actions with unique list keys even when titles repeat. The card MUST NOT throw when two actions share a name.                                                                                                                                                                                                                                                                                                                                                                                     |
| LN-PKG-084 | `@lapis-notes/api` MUST NOT read CodeMirror editor layout from a diagnostic hover-card plugin during a view update. Tooltip positioning MUST run in the view measure cycle after the update completes.                                                                                                                                                                                                                                                                                                                                                 |
| LN-PKG-088 | `@lapis-notes/api` lint hover MUST resolve a diagnostic from `.cm-lintRange` or `.cm-lint-marker` only. It MUST NOT open a card from a document-position hit on the same line.                                                                                                                                                                                                                                                                                                                                                                         |
| LN-PKG-085 | `MetadataCache.dispose` MUST wait for in-flight load, reconciliation, query, and index-write work. It MUST release database subscriptions and compatibility leases before the owning AppDatabase closes.                                                                                                                                                                                                                                                                                                                                               |
| LN-PKG-086 | `MetadataCache` MUST keep database readiness, rebuild, and vault reconcile under one `notifications.withProgress` handle. It MUST NOT fire-and-forget reconcile after that handle completes. Load reconciliation and rebuild progress reports MUST remain determinate with current and total processable file counts.                                                                                                                                                                                                                                  |

`@lapis-notes/ai` may offer a Node-backed user-agents command store only through
a runtime-only module boundary. Browser and renderer builds consume the portable
memory path unless a host capability supplies the user-agents directory, and
MUST NOT statically bundle Node file-system modules through the plugin's public
entrypoints.
| LN-PKG-087 | `MetadataCache` MUST yield between files during load, rebuild, and vault reconcile so progress reports and input stay responsive while worker results are applied. |
| LN-PKG-097 | `App` MUST register palette command `app:rebuild-vault-cache`. That command MUST call `metadataCache.rebuild()`. |
| LN-PKG-098 | `App` MUST register palette command `app:rebuild-generated-state`. That command MUST await `metadataCache.rebuild()`, then execute `search:rebuild-search-index` when that command is registered, otherwise `appDatabase.rebuildSearchIndex()`. |
| LN-PKG-106 | `MetadataCache` MUST surface normalized AppDatabase data through async per-file and query APIs. `loaded` MUST mean persisted queries are available, while reconciliation continues within the load operation and emits committed index changes. |
| LN-PKG-107 | Normal operation MUST retain at most 512 recently used metadata entries. Full synchronous maps MUST exist only under a reference-counted compatibility lease and MUST be released when its last owner unloads. |
| LN-PKG-108 | Automatic metadata snapshots under `.lapis/cache` MUST stop. Existing files MUST remain untouched, and missing or stale rebuildable metadata MUST be recovered from authoritative vault Markdown. |
| LN-PKG-109 | First-party metadata consumers MUST use async indexed queries and revision-aware refresh. A source audit MUST reject first-party enumeration of synchronous `fileCache`, `metadataCache`, `resolvedLinks`, `unresolvedLinks`, or `getAllItems`. |
| LN-PKG-110 | Vault MUST expose a file iterator whose additional memory is bounded by folder depth. Warm MetadataCache reconciliation MUST combine it with exact-path manifest batches no larger than 500 entries. |
| LN-PKG-111 | `@lapis-notes/desktop-deno` MUST be the sole private native desktop package at `packages/desktop-deno`, retain version `2026.31.5`, and expose common build, check, test, CEF debug, icon-generation, current-platform, and explicit macOS/Linux distribution scripts. Root desktop scripts MUST select it without a `-deno` suffix, and no Windows distribution target is supported. Packaged smoke MUST assert native Turso, the shared four-plugin profile, configured-plugin persistence, and structured renderer-ready close acceptance, while vault resources MUST stay on the contained loopback route. |
| LN-PKG-112 | MetadataCache and Search MUST persist separate versioned reconciliation checkpoints in `app_meta` and skip full warm scans when their streaming manifest fingerprints match. Database readiness MUST precede reconciliation, and Search MUST begin its single startup reconciliation only after MetadataCache load completes and configured providers have registered. Non-provider vault events MUST NOT invalidate Search. Failed, cancelled, or undrained work MUST NOT advance a checkpoint. |
| LN-PKG-113 | `@lapis-notes/ai` MUST serve empty-query Agents palette rows from portable conversation files without enumerating or rebuilding the global Search store. Workspace layout readiness MUST NOT trigger AI conversation-index repair. Normalized no-op settings updates MUST NOT rewrite plugin data and invalidate warm-start manifests. |
| LN-PKG-114 | The private desktop package MUST expose local LGTM and telemetry development commands. Root commands MUST delegate to that package, while ordinary development, build, package, test, and distribution commands remain telemetry-disabled. |
| LN-PKG-115 | `@lapis-notes/api` MUST export its telemetry contract through `@lapis-notes/api/telemetry`. Browser OpenTelemetry SDK dependencies MUST remain private to `@lapis-notes/desktop-deno` and load only after explicit telemetry enablement. |
| LN-PKG-116 | `MetadataCache` MUST instrument database-ready load, checkpoint hit or miss, full reconciliation, and bounded manifest batches through the App telemetry contract. Completion, cancellation, and failure events MUST carry only checkpoint state and aggregate file or batch counts; they MUST NOT include vault identity, file paths, parser output, note content, or error messages. Disabled hosts MUST retain identical behavior through the no-op service. |
| LN-PKG-117 | `@lapis-notes/graph` MUST live in the sibling `lapis-plugins` monorepo as an independently versioned installable plugin. It MUST expose its plugin, controls overlay, embed, renderer, views, settings, types, and styles through public package exports, depend on API and Design Core rather than `@lapis-notes/ui`, and retain runtime id `lapis-graph`. |
| LN-PKG-118 | `@lapis-notes/api` MUST expose backward-compatible indexed-metadata domain projections, ordered path-only Search matching, the read-only MetadataCache reconciliation fingerprint, and disposable memory source/candidate/signal/job state. Memory, direct Turso, browser-coordinated, and desktop-native transports MUST retain one typed contract, and the native/browser method catalogues MUST forward derived-memory operations without exposing SQL or durable vault files. |
| LN-PKG-119 | `@lapis-notes/graph` MUST own the canonical global coordinator, versioned AppDatabase snapshot, progress, stale-while-revalidate behavior, and debounced versioned settings persistence. Its one-time unversioned migration MUST replace only force values. Canonical graph data MUST remain independent from view lifetimes. |
| LN-PKG-120 | `@lapis-notes/graph` MUST own deterministic entrance layout, Obsidian-range camera and force transforms, degree-normalized D3 simulation, zoom-stable geometry, direct screen-pixel links, paint culling, exponential emphasis, reduced motion, semantic roles, and bounded telemetry. It MUST NOT add another renderer dependency. |
| LN-PKG-121 | `@lapis-notes/graph` MUST compose Design Core query, colour-picker, and sortable-row contracts inside its viewport-clamped compact settings panel with guttered handles, divider-free idle rows, rounded whole-row focus paint with an outer trailing gap, and visible padding-owned row actions with an internal trailing gutter; preserve the simplified `GraphGroupRule` export; and own delayed canvas emphasis, structured membership policy, preview orchestration, and chronological time-lapse. It MUST depend on the public Markdown embed for read-only note previews and MUST NOT add a direct dependency on `@lapis-notes/search`. |
| LN-PKG-122 | `@lapis-notes/graph` MUST own bind-safe Local Graph frontier batching and its build-failure diagnostic lifecycle through the public API Problems contract. It MUST retain the inline view error, clear recovered diagnostics, and avoid opening the Problems view as a side effect. |
| LN-PKG-123 | `@lapis-notes/desktop-deno` MUST generate its macOS development WebView and CEF hosts under ignored `release/dev-laufey`. Reuse MUST require a matching Deno version, backend, application name, and identifier, repairing an invalid signature before reuse. The launcher MUST ad-hoc sign after identity patching and Deno runtime insertion, then pass the generated parent through `LAUFEY_DEV_DIR`; Linux and packaged output retain their existing paths. |
| LN-PKG-124 | `@lapis-notes/desktop-deno` MUST privately own session-scoped startup recovery persistence and presentation while reusing the public API `AppSafeModeState` and Design Core startup surface. It MUST retain saved vault profiles after recoverable open failures, preserve native filesystem failure classes, and avoid adding public package exports or desktop-only canonical vault settings. |
| LN-PKG-125 | `@lapis-notes/ai` MUST own in-memory turn projection and terminal conversation checkpoints. `@lapismd/ai-host` MUST expose later-task ACP start and prompt operations for embedding hosts, while `@lapis-notes/desktop-deno` MUST adapt those operations and deliver runtime events through its private same-origin stream. Durable conversation authority MUST remain in AI, and native transports MUST NOT write transcript state. |
| LN-PKG-126 | `@lapis-notes/ai` MUST own cross-agent transcript projection, binding cursor reduction, switch/configuration audit records, and optional background handoff summaries. `@lapismd/ai-host` and desktop adapters MAY configure or resume native sessions through versioned transport methods, but MUST NOT copy opaque runtime state, author handoff transcript messages, select durable binding state, or become conversation authority. |
| LN-PKG-127 | `@lapis-notes/source-editor` MUST live in the sibling `lapis-plugins` monorepo and remain an enabled-by-default member of the Lapis Notes static profile. It MUST own the shared Editor settings plus text, JSON, and YAML source associations through API and Design Core public contracts, while Markdown associations remain owned by `@lapis-notes/markdown`. |
| LN-PKG-128 | `@lapis-notes/ai` MUST own the `ai-jsonl` read-only file view and `.jsonl` default association. It MUST reuse API file-view registration, Design Core chat primitives, the public Markdown embed, and AI-owned durable record validation/projection without moving append-only transcript authority into the view or adding a Source Editor override. |
| LN-PKG-129 | Public Lapis Notes framework packages MUST start at version `0.1.0`, publish independently in dependency order `@lapis-notes/ui`, `@lapis-notes/api`, `@lapis-notes/language-service`, `@lapis-notes/file-explorer`, then `@lapis-notes/workspace`, and keep internal runtime ranges compatible with the published provider version before a dependent package can be released. |
| LN-PKG-130 | The Lapis Notes release workflow MUST keep Changesets version PR creation, build and retain a verified tarball manifest, stop with a manual-publish notice while an npm package is not registered, use npm trusted publishing with OIDC after bootstrap through the `npm-production` environment, and create package-scoped GitHub releases from the verified manifest. |
| LN-PKG-131 | Public package checks MUST reject missing README, changelog, license, repository, homepage, bugs, or public publish metadata; tarball checks MUST reject local dependency protocols, private package runtime references, wrong source repository URLs, generated artifacts, and clean-consumer import failures for documented UI, API, Workspace, and CSS entrypoints. |
| LN-PKG-132 | Private `@lapis-notes/app-profile` MUST own the shared Web and Deno static plugin profile and app-owned plugin-management registration. Host packages MUST consume that one profile instead of duplicating registration arrays or importing extracted plugins directly. |
| LN-PKG-133 | The sibling `lapis-plugins` repository MUST own source, behavior specifications, tests, release tooling, and one repository-level Storybook for AI, Bases, Bookmarks, Graph, History, Markdown, Markdown Lint, Search, Source Editor, Spellcheck, and Word Count. Lapis Notes MUST retain only framework, application-profile, host, and install-management integration contracts for those packages. |
| LN-PKG-134 | Lapis Notes manifests and its committed lockfile MUST consume extracted plugins through registry semver ranges. A git-ignored local pnpm hook MAY redirect only those plugin ranges to checksum-verified sibling npm tarballs without changing host-package ranges or the lockfile; Web, Deno desktop, Storybook, and AI integration development entrypoints MUST prepare that package-boundary install before launch. |
| LN-PKG-037 | `@lapis-notes/api` MUST style the CodeMirror inline problem created by `View Problem` through the editor stylesheet and public workspace tokens. The widget MUST NOT depend on application-global utility CSS. |
| LN-PKG-038 | Executing `View Problem` MUST dismiss its originating hover card and clear the active diagnostic before rendering the inline problem. Closing the inline problem MUST leave later hover discovery operational. |
| LN-PKG-040 | `@lapis-notes/language-service` MUST export `./markdownlint/runtime` for native Markdown services. The Deno desktop host MUST consume that public specifier instead of copying the runtime or importing a private implementation path. `@lapis-notes/markdown-lint` MUST remain the sole renderer provider and pass vault rules through the native adapter. |
| LN-PKG-042 | `@lapis-notes/workspace` MAY forward Design Core's generic workspace-navigation contract to its shell surface, but profile discovery, vault labels, selection, management, persistence, and lifecycle policy MUST remain consumer-owned. |
| LN-PKG-074 | `@lapis-notes/ai` MUST own conversations, projection, Explorer-style history presentation, bindings, handoff, and replay provenance. Its history view MAY compose public Design Core search, sidebar-tree, disclosure, menu, badge, and switch primitives but MUST keep that search chrome centered and retain scope selection, filesystem/index merging, conversation actions, and workspace-view registration in AI. API MUST expose generic path, durability, search, highlighting, and native-event primitives through narrow entries. `@lapismd/ai-host` and Deno desktop MUST remain non-authoritative execution transports with only live native state and bounded replay. |
| LN-PKG-075 | Root real-agent smoke scripts MUST remain thin supervisors over public `@lapismd/ai-host`, Storybook, Deno desktop, and Turbo. Seed creation and reset confinement MUST remain deterministic and testable without starting an agent, while the manual checklist stays with `@lapis-notes/ai`. |
| LN-PKG-076 | `@lapis-notes/api/desktop-native` MUST expose the native bridge and capability contract without evaluating the Svelte component barrel. Node-side AI runtime adapters and real-host diagnostics MUST consume that narrow entry. |
| LN-PKG-077 | `@lapis-notes/ai` MUST own asynchronous chat preparation and conversation-location tab reuse. `@lapis-notes/api` MUST remain limited to generic main-tab creation, sidebar-leaf registration, activation, and reveal contracts; workspace packages MUST NOT acquire AI-specific navigation policy. AI MUST project folder scope breadcrumbs through the public View chrome hooks. |
| LN-PKG-078 | `@lapis-notes/api` MUST own the generic `ViewAccess` registration contract, plugin-name command prefixing, and live command-palette projection. First-party plugins MUST own their view classifications and activation callbacks, while the repository-local validator MUST own first-party-only enforcement. |
| LN-PKG-079 | `@lapis-notes/history` MUST live in the sibling `lapis-plugins` monorepo, expose build, check, test, publint, npm-package, and `.lapis-plugin` contracts, and publish its plugin, panel, views, and settings. It MUST depend on API and Design Core, MUST NOT depend on `@lapis-notes/ui`, and MUST persist revisions only through `AppDatabase`. |
| LN-PKG-080 | `@lapis-notes/api` MUST own transport-neutral app-tool contracts, lifecycle, and Vault-backed file-tool wrappers. Search MUST own `notes_search` and Markdown MUST own `notes_list`. AI MUST own snapshots and policy. `@lapismd/ai-host` plus Deno desktop MUST own live MCP transport without becoming durable tool, note-content, or conversation authorities. |
| LN-PKG-094 | `@lapis-notes/api` MAY depend on `@lapismd/ai-host` through its published npm semver range and MUST import only `@lapismd/ai-host/file-tools`. `@lapis-notes/ai`, Search, and Markdown MUST NOT depend on `@lapismd/ai-host`. |
| LN-PKG-095 | `@lapis-notes/ai` MUST depend on `@lapis-notes/markdown` only for the public embed preview. It MUST NOT depend on `@lapismd/mira` or `@lapismd/mira-editor`. Chat styles MUST keep that embed preview surface transparent and MUST NOT nest a vertical scroller inside the bubble. |
| LN-PKG-096 | `@lapis-notes/api` MUST own skill-source and composer slash-command registration. `@lapis-notes/ai` MUST own discovery, snapshots, skill tools, and the composer router. Those APIs MUST NOT expose MCP, ACP, or vendor runtime types. |
| LN-PKG-100 | `@lapis-notes/api` MUST own the agent result-view registry. Search MUST own the `notes_search` view. AI MUST own lookup, CodeBlock fallback, and `/skills` `/tools` inventories. AI MUST NOT import Search internals, and Search MUST NOT import AI internals. |
| LN-PKG-081 | Root Docker visual staging MUST update sibling dependency overrides in `pnpm-workspace.yaml`, regenerate the matching lockfile, and restore the root manifest, workspace configuration, and original lockfile before a frozen relink after capture. It MUST NOT depend on the retired manifest-level `pnpm.overrides` shape. |
| LN-PKG-083 | `@lapis-notes/wordcount` MUST live in the sibling `lapis-plugins` monorepo as an independently versioned installable plugin. It MUST depend on `@lapis-notes/api` and MUST NOT depend on `@lapis-notes/ui`. |
| LN-PKG-089 | `@lapis-notes/spellcheck` MUST live in the sibling `lapis-plugins` monorepo as an independently versioned installable plugin. It MUST depend on the API and `harper.js` without importing Design Core presentation or `@lapis-notes/ui`. |
| LN-PKG-092 | `@lapis-notes/lapis-plugin-terminal` MUST live in the sibling `lapis-plugin-terminal` repository, version independently, and expose `build`, `check`, and `test`. It owns the `terminal` view and commands. Consumer plugins MUST NOT depend on `@lapismd/terminal-host` at runtime. |
| LN-PKG-093 | Public `@lapismd/terminal-host` MUST live in the `terminal-host` repository, version independently, and expose build, check, test, Deno embed, and CLI entries. Lapis hosts MUST consume it through published npm semver ranges. Deno desktop MUST pass the vault path, optional `cwd`, optional absolute `shell`, and a packaged verified native-library path. |
| LN-PKG-099 | `@lapis-notes/bookmarks` MUST live in the sibling `lapis-plugins` monorepo as an independently versioned installable plugin. It MUST depend on API and Design Core, MUST NOT depend on `@lapis-notes/ui`, and MUST persist `{ items }` through `.obsidian/bookmarks.json`. |
| LN-PKG-101 | `@lapis-notes/lapis-plugin-tasks` MUST live in the sibling `lapis-plugin-tasks` repository, version independently, and expose `build`, `check`, and `test`. Desktop and web hosts MUST NOT register it statically; when installed it MUST register its own Tasks workspace views through the configured plugin lifecycle. |
| LN-PKG-102 | `@lapis-notes/lapis-plugin-docs` MUST live in the sibling `lapis-plugin-docs` repository, version independently, and expose `build`, `check`, and `test`. It owns Core Docs notes, books, cards, and FSRS review while delegating reusable leaf controls to Design Core and Markdown reading to Mira. Desktop and web hosts MUST NOT register it statically; when installed it MUST register its own views. |
| LN-PKG-103 | `@lapis-notes/lapis-plugin-docs` MUST NOT depend on `/Users/stevejuma/code/cv` or `@cvstudio/*` at runtime or build time. Coding practice host services MUST remain out of the Core Docs package. |
| LN-PKG-104 | `@lapis-notes/api` MUST own a daily-document provider registry, the desktop and web hosts MUST register the shared default provider before configuration loads, and generated settings MUST persist `dailyNotes.folder` and Luxon `dailyNotes.dateFormat` with defaults `daily` and `yyyy-MM-dd`. The default provider MUST locate canonical `type: daily-note` plus `date: YYYY-MM-DD` front matter before deriving a path, MUST fail visibly on duplicate dates or occupied generated paths, and MUST never move an existing note after configuration changes. |
| LN-PKG-105 | `@lapis-notes/api` MUST own the bridge from Design Core pane-menu split actions to Lapis `WorkspaceLeaf` duplication. Lapis-hosted imperative views MUST keep live leaf ids, containers, copied view state, translated split directions, and projected host layout before the new pane renders. |

`@lapis-notes/spellcheck` registers a Harper language-service provider and a
Lucide status item. Provider warmup is non-blocking for diagnostics, and the
status item refreshes from configuration, not `layout-change`. It stays a
bundled core plugin and does not import Design Core presentation.
`@lapis-notes/wordcount` updates the API status bar for the active text editor
and stays a bundled core plugin. Clicking the item shows reading time through
the projected status menu. Design Core F-Mode remains an optional static
shell plugin on the API-owned controller. A vault without workspace.json
receives File Explorer, Search, then Bookmarks on the left and Outline, File Properties,
then Tags on the right when those views are registered. The Bookmarks panel
snapshots persisted items so add and remove refresh the tree, insets
rows with the public Explorer content-padding token, uses Explorer
toolbar hover tokens, and follows Explorer tree indent, chevron-centered
guides, and leaf rows that omit the disclosure column. The API workspace
registers Save, Load, and Reset layout commands for named snapshots and the
same default seed.
`@lapis-notes/file-explorer` adds native system-path copy, Lapis URL copy,
open, and OS reveal only through Design Core `buildItemMenu` and the existing
desktop `file-system-actions` IPC. Those extras stay out of the web and
Storybook memory vaults. It also persists Show hidden files, registers the
matching Workspace setting and palette command, and lets Design Core hide
dotted names until that setting is on. Its vault-file palette provider
declares the Files tab, exposes up to 25 recent files or a lexical fallback,
lets Design Core cap that provider to five rows in All, and keeps path filtering
when the user types. The API workspace records file recents
on `file-open` and registers `app:go-to-file` so landing and empty-view
actions open that tab. `@lapis-notes/ai` registers an Agents provider that
groups conversations by date without adding one command per chat. It coalesces
source-file events per portable conversation and incrementally maintains only
the affected derived Search document (LN-AI-176).
`@lapis-notes/markdown` File Properties uses Mira `valueSuggestions` and the
existing Lapis file adapter for wikilink pills without forking pill-list
editing.

The API package delegates reusable diagnostic state and presentation to Design
Core while exporting only Lapis-owned structural types and lifecycle helpers.
Desktop Deno owns a worker boundary around its native Turso handle so database
execution cannot starve the package's window and agent transports
(LN-DENO-059). Its shared dynamic compile inputs keep the worker entry embedded
in both development and distribution hosts (LN-DENO-062).
Its private event transport retains monotonic replay and current ACP terminal
state; AI consumes that state only to recover live presentation and remains the
sole durable transcript owner (LN-DENO-060, LN-DENO-061, LN-AI-177).
Live Problems totals therefore use Design Core's structured, ephemeral view
badge and never enter Lapis layout state or package-owned panel markup.
API projection treats Problems as host-owned even before the view is
registered, so `loadLayout` restores a persisted leaf or leftover ghost
placeholder as `workspace:problems` and later API commits do not replace it
with an empty missing-view surface. Hydration does not seed a quiet bottom
tab.
The same claim-by-id path keeps each leaf's live `getState()` and opens files
on an empty or file-backed main leaf rather than a plugin item view.
Missing-view placeholders expose the Lucide `ghost` icon through `EmptyView`.
Its narrow editor core and language-service subpaths let Markdown compose the
source shell and diagnostics without importing the editor component barrel or
its unrelated UI runtime.
The Markdown package keeps canonical movable-panel registration, compatibility
aliases, default placement, and opening-command metadata in one package-owned
registry. This coordination is internal and does not add a package export.
It also owns the scoped `notes_list` application tool; that callback captures
Vault directly and exposes no editor, AI host, or MCP service.
API owns Vault-backed `read`, `write`, `edit`, and `apply_patch` wrappers over
the portable file-tools kernel. Markdown and Search expose narrow
`./agent-tools` entries for their portable factories, while AI's existing
`./runtimes` entry exposes the host and desktop bridge coordinator needed by
the explicit real-agent diagnostic. These entries do not make the MCP SDK a
dependency of either domain package.
The worker client uses a narrow API subpath so provider workers never load the
application manager or presentation modules.

The API agent-skills surface exports only skill-source and composer
slash-command registration. AI owns discovery of `.agents` skill and
command Markdown, snapshots, skill tools, and routing, including reserved
`/help`, `/scope`, `/context`, `/status`, and `/agent`.
Local slash notices stay start-aligned with authored line breaks and show
the composer working indicator while they prepare. The slash menu lists the
same catalog commands, ranks Fuse name matches before description hits,
and submits argument-free picks immediately.
`/skills` and `/context` hydrate a missing binding snapshot from current
discovery.
AI ships bundled `research` and `lapis-notes` skills. An active skill file
MUST NOT scope a new conversation to `.agents`. Search owns composer
`/search` as a `notes_search` tool-dispatch command and shows that invoke as
a `ToolCalls` transcript item. Live ACP session start
appends a path-free `available_skills` manifest and a generated
`sessionBootstrap` through host session setup, including skill-folder chats. The AI catalog lists live
tools, commands, and skills by owner in an explorer-aligned tree. Neither
surface imports MCP, ACP, acpx, or vendor runtime types.
The API agent-tool surface exports only schemas, results, trusted execution
context, owner metadata, and lifecycle registration. It does not import or
re-export MCP, ACP, acpx, or vendor runtime types.
AI coordinates each registry snapshot with one preallocated native binding and
projects its events into the existing transcript. Deno desktop and AI Host continue
to transport opaque bridge identifiers rather than importing note-tool
implementations.
The bridge coordinator accepts only protocol-v3 hosts that advertise the owned
`stdio-mcp` or `http-mcp` application-tool transport.
Its execution-scope helper validates vault-relative portable paths and exposes
only fixed-directory containment and resolution to portable tool callbacks.
AI policy imports these contracts through the narrow `@lapis-notes/api/agent-tools`
subpath so its non-UI tests and host adapters do not load API presentation code.
The AI package keeps external MCP server processes in a distinct, deterministic
`McpServerContribution` registry that rejects duplicate names and the reserved
`lapis-tools` bridge identity.
It owns the master application-tool switch and per-tool enablement settings and
applies those choices only while constructing a new native binding snapshot.
The Search package owns `notes_search`; API owns the generic pre-limit
`pathPrefix` database option used consistently by memory, Turso, desktop, and
browser-coordinated implementations.
Bundled tool descriptions tell the agent to prefer those vault tools over
host-cwd shell lookup (LN-AI-108).
AI Host is the only workspace package with the MCP SDK dependency. It bundles
the protocol-clean stdio shim, authorizes each loopback bridge against one host
connection and native binding, converts environment records to ACP name/value
entries, and reserves `lapis-tools` before ACP startup.
Its public executor also provides deferred, caller-identified ACP startup for
embedding hosts. Deno desktop uses that lifecycle so its attached HTTP MCP
route remains serviceable during agent initialization (LN-DENO-055).

The public Search panel keeps database snippet text paired with its highlight
ranges. Its package-owned result layout follows `LN-SRCH-023`; consumers do not
reposition counts, metadata badges, or child result surfaces with
placement-specific CSS. The package exposes semantic runtime state through its
status API and keeps the movable panel free of a persistent status tag. Content
matches expand from their indexed file offsets, while public Search tokens own
highlight paint and consumers remain free of result-row overrides. The panel
keeps expanded slices stable across recent-query persistence and resets them
only when search inputs change or the index explicitly refreshes. The results
surface uses the resolved view background and expanded result bodies use its
contrasting secondary background in every placement. Navigation does not
replace a Search leaf that has been moved into the body. Result parents retain
only a regular extension-free filename; expanded-body headers own the full path
and applied retrieval mode.

## `@lapis-notes/api` (kernel slice)

Purpose (condensed from the full Lapis Notes api package):

- `App` as the root service container for workspace, vault, database, plugins,
  commands, settings, metadata, editor, notifications, and related services
- Workspace data model (splits, tabs, leaves, sidebars, bottom panel, ribbons,
  layout)
- Stable `WorkspaceBottomPanel` tabs wrapper plus bottom-leaf, open, size,
  toggle, and live alignment controls; root api exports remain design-core-free
- Host-only design-core controller binding at `./workspace-host`; the root api
  export remains the Lapis compatibility surface
- Compatibility view-action and pane-menu projection into design-core chrome,
  preserving plugin contributions without moving their policy into the shell
- Plain workspace-shell metadata overrides, with Lapis name/version/logo
  defaults and the design-core notification presentation
- Plugin runtime contracts and distribution primitives
- Vault/storage abstractions: browser OPFS and File System Access adapters,
  plus the desktop-neutral folder bridge (`desktop-folder`). The web host
  copies a picked folder into a new or current OPFS vault and can export an
  OPFS tree back to a local folder.
- Shared editor, menu, settings, and configuration UI building blocks
- Public deterministic in-memory vault storage and a policy-free source-text
  view for tests, Storybook, and explicitly volatile consumers

`MemoryVaultAdapter` implements the complete data-adapter surface, explicit
non-persistent capabilities, binary-safe copies, deterministic metadata, and a
stable vault identity. `SourceTextFileView` mounts the existing `NoteEditor` and
delegates language behavior to registered editor extensions. The same public
editor subpath exposes an embedded surface for document and fragment hosts;
registered language extensions remain authoritative and the API source shell
is the fallback when a rich provider is absent.

`@lapis-notes/markdown` owns Mira-backed Markdown views and intaken Markdown
side panels. Its packaged metadata worker import stays extensionless so web and
desktop Vite resolve `dist/metadata/metadata-worker.js`. `@lapis-notes/markdown-lint` and the internal
`@lapis-notes/language-service` package are the focused diagnostics exceptions.
Markdownlint Settings seed MD013/line-length in `disabledRules` so the editor
matches vscode-markdownlint rather than the CLI's all-rules-on library default.
Published diagnostics use that same rule-path message form, and the API
language-service bridge attaches each markdownlint rule's documentation URL.
Markdownlint code actions use vscode-markdownlint titles, including vault
`disabledRules` (LN-MDL-005). Spell Check Problems actions use cspell-style
bare suggestions plus dictionary and ignore-word commands (LN-SPL-010).
The manager merges diagnostics and code actions from every matching provider
so Spell Check appears beside Markdownlint (LN-WS-076). A provider that throws
or does not complete publishes a workspace-wide Problems row (LN-WS-077).
Lapis plugin load and enable failures use the same workspace-wide path
(LN-WS-078). Web development, preview, and production MUST serve `*.wasm` as
`application/wasm` so Harper `WorkerLinter` can instantiate (LN-WEB-030).
An open misspelled web note MUST then show a Harper Problems row (LN-SPL-009).
API lint hover opens only from `.cm-lintRange` or `.cm-lint-marker`, not from a
same-line document-position hit. Hover cards expose one Quick Fix control for
cached actions instead of listing each title (LN-WS-079).
`@lapis-notes/history` owns vault file-revision capture, the History panel, the
compare tab, and the Design Core History settings section while persisting
revisions only through `AppDatabase`.
`@lapis-notes/bases` owns its parser, query controller, layouts, editors,
private TanStack adapter, and native stylesheet. It consumes API contracts and
public Design Core primitives directly, exports its stylesheet explicitly, and
does not reintroduce a dependency on the pruned Lapis UI package.
The package also owns the accessible names, metadata-key adaptation, ordered
column tracks, measured row sizes, and token mappings used by its table, cards,
and grouped-list presentation. Inline cells compose Design Core's public input
and autocomplete forms without exposing those private adapters through the
package API. Tag and multivalue cells wrap within their tracks while the owning
row grows to keep all cell boundaries aligned. Checkbox cells retain the
full-cell layout wrapper while rendering a centered 1rem control.
The outer editable cell alone paints its inset focus boundary; inner input and
autocomplete wrappers retain only their control surface paint.
Cell-level focus delegation resolves from the semantic cell root rather than
the clicked descendant so cell chrome and visible input text enter edit mode.
Single-line editors use the compact row content height at the cell start while
wrapped tag and multivalue editors expand downward from the same origin.
`@lapis-notes/ai` owns the provider-agnostic agent runtime and model-provider
registries, Fake and ACP adapters, optional native Codex adapter, provider-safe
plugin-data session persistence, vault-scoped file mentions, Codex and Cursor
model catalogs, chat settings, movable chat panel, grouped Design Core tool-call
transcripts that unwrap tool envelopes into `json`, `bash`, or `plaintext`
`CodeBlock` language (LN-AI-133), a busy-turn Stop abort that clears
busy before runtime cancel settles, and error presentation that removes the
working indicator. It also owns an ungrouped History sidebar leaf, a movable Catalog command leaf, and an Open Chat left-ribbon
action that reuses the opening command.
Its paperclip attach picker keeps host Popover chrome—visible border, shadow,
and stacking above an open composer drawer—and composes Command View for the
searchable file list.
The composer overflow menu sits after History and attach, sizes to its
labels so they stay fully visible at the model-menu type size (LN-AI-123),
archives or restores in place,
deletes through vault trash, and offers New Chat (LN-AI-109). The first submitted user message stays in the transcript while
session start is still pending (LN-AI-120). Thinking stays expanded only while
it streams and collapses when later transcript data arrives (LN-AI-131). Stop
settles leftover spinners immediately and posts a cancelled system notice after
cancel confirms (LN-AI-132). The notice reads `Agent turn cancelled`.
An unreadable open conversation
is reported and released so the next send starts a replacement chat
(LN-AI-124).
Runtime Allow always and Deny always decisions persist on conversation
metadata (LN-AI-156).
Application-tool names and arguments stay visible when ACP only reports a
generic `tool call` title (LN-AI-125).
Assistant MarkdownEmbed content grows with the transcript instead of a nested
scroller (LN-AI-122).
Drawer attachment chips use Design Core's public `attachment-chip` parts
instead of plugin-local paint.
Permission and question option buttons use the public `feedback-option` part
(LN-AI-157).
An unpinned idle chat follows the active-file folder and shows a faded centered
scope control. Its searchable folder Command View includes Vault root and
routes explicit selection through the existing zero, one, or many conversation
transition while revealing the same path in Explorer. Pinning still prevents
automatic active-file follow (LN-AI-160, LN-AI-161, LN-AI-162, LN-AI-163,
LN-AI-178).
AI History chrome keeps a visible hover on search actions, a dimmed
creation-folder path, and New chat in that Explorer or History-tree folder
(LN-AI-165, LN-AI-166, LN-AI-167, LN-AI-168).
History folder counts share one trailing edge across depths (LN-AI-169).
API owns result-view registration; Search owns the `notes_search` view; AI
owns lookup and `/skills` `/tools` inventories (LN-PKG-100).
The root export stays plugin-safe; ACP and native Codex adapters publish only on
`./runtimes`. Cursor uses the same ACP adapter through a known agent name.
Domain plugins register tools. The package does not declare an acpx dependency.
Public `@lapismd/ai-host` owns acpx, process spawn, the WebSocket server, and
`lapis-ai-host serve`. Deno desktop embeds that library in-process. Web and
Storybook attach only with a configured URL and token, and transport closure is
forwarded to active plugin sessions.
The web host persists those values as `web.agentRuntime.url` and
`web.agentRuntime.token` in Settings. The token field uses password
presentation so the value stays masked until revealed.
When the selected runtime is not Fake
and no host is connected, chat tells the user to start the local server and
set URL, port, and token.
Deno desktop, web, and root Storybook consume the package through published npm
semver ranges.
The sibling `@lapis-notes/lapis-plugin-cv-roles` package owns role workflows plus CV YAML file views and browser preview. Its compiled
Markdown artifact composes Mira's public read-only source and preview surfaces
under the Lapis theme. The sibling `@lapis-notes/lapis-plugin-tasks` package
owns the Tasks plugin, planner view, and Design Core catalog; desktop and web
hosts load it only through configured installation and MUST NOT register Tasks
views themselves. The sibling
`@lapis-notes/lapis-plugin-docs` package owns Core Docs notes, books, cards, and
FSRS review; desktop and web hosts load it only through configured installation
and MUST NOT register Docs views themselves. Other extracted
plugins, notebook, and plugin-host module generation remain out of scope until
separately specified. Desktop and web hosts are authorized by their canonical
host chapters.
Storybook exercises those registered panel views through the separate
`@lapis-notes/workspace` shell adapter; movable-surface fixtures remain consumer
verification and do not move workspace rendering ownership into the markdown
package. Design-core's `WorkspaceViewHost` selects body, sidebar, bottom, and
grouped paint and exposes the resolved public view tokens; the shared markdown
panel shell consumes those tokens and carries no placement selectors or cached
placement state.

Brand palette and semantic tokens live in design-core `themes/lapis.css`.
`@lapis-notes/ui/theme.css` is an Obsidian-compatibility alias layer only.
Storybook theme controls and their manager dependencies remain root-only
development tooling rather than package exports or runtime dependencies.
Specification validation remains root tooling configured by
`spec-validator.config.mjs`; reusable validators and their tests belong to
`@lapismd/spec-validator`, not a runtime package. The root development
dependency resolves from npm. The QMD CLI and its local native dependencies
follow that root-only rule.
The editor demo's CodeMirror Markdown and JSON language packages follow that
same root-only rule; the source view and editor registry remain language-policy
neutral package contracts. The shared source-editor shell depends on public
`@lapismd/mira` for base CodeMirror extensions and Obsidian theme CSS. The
Markdown plugin composes the public Mira authoring stack with that duplicate
base layer disabled, imports the public Mira Editor stylesheet for its optional
toolbar, and preserves borderless Lapis editing and Reading surfaces. Toolbar
controls persist only through API configuration. Consumers must not reconstruct
the portable Mira feature stack from internal source modules.

The private Deno desktop package consumes API, workspace, Design Core, the
internal language service, and Markdownlint while building its bundled
renderer and native graph. It supplies API sessions with a native Turso
AppDatabase provider over the bounded desktop bridge, embeds public Deno host
packages, and materializes checksum-verified PTY libraries for the selected
macOS or Linux target. Its private platform metadata also identifies the
selected renderer engine before application mount so Design Core may select
the system-WebView compatibility path deterministically. The API manifest
declares `dist/enhance.js` and its source counterpart as side effects so a
production consumer cannot tree-shake the compatibility DOM initialization
required before constructing `App`.
Its desktop stylesheet maps ribbon-on and ribbon-off macOS traffic-light
measurements to Design Core's window-controls token. It does not target the
sidebar reopen button directly; top and stacked main-pane headers consume the
generic token, while the open left sidebar keeps its dedicated tab-strip inset.
The package's macOS-only native adapter owns the traffic-light centreline
correction and leaves the open left-sidebar header layout untouched. The
package's native host owns a dedicated,
single-instance About child window that mounts Design Core's public About
surface from a separate Vite entry without creating application or vault state.
Its macOS adapter closes every exact-title About shell on AppKit's main thread
for both native and renderer dismissal while preserving the main window.
Its pnpm development launcher passes the checked-in visible-background Lapis
fallback icon to `deno desktop`; deterministic package-local generation retains
separate light and dark rounded-tile variants. A private renderer/native binding
keeps the macOS Dock icon aligned with the operating-system colour scheme, while
distribution remains responsible for final bundle metadata and signing.

The private web package consumes the public API, current core plugins,
workspace, and Design Core presentation. It owns browser vault selection,
Workbox, window-controls overlay state, and web-session lifecycle; its
production database dependency remains the pinned API-owned Turso WASM provider
rather than a package-local persistence implementation.
Root `dev:web` and `restart:web` start that host after an API build; restart
first frees listeners on Vite port 4174.

Its launcher imports shadcn presentation from Design Core and profile/search
helpers from public Lapis exports. Desktop and web “View all” palettes compose
Command View for the searchable recent-vault list. It does not add launcher
policy to the workspace package or copy a private UI implementation.
The renderer consumes Design Core's public `styles.css` and Lapis theme export
instead of reconstructing workspace CSS. The desktop-only Vite Tailwind pass is
limited to compiling the intaken launcher composition and does not move native
selection or session policy into a shared package. Scoped desktop CSS owns
launcher overlay geometry and class-selected native window-control clearance.
Session boot consumes public `@lapismd/design-core/workspace/startup` and the
shared drag-region stylesheet rather than a host-owned loading stub or
`-webkit-app-region` override. Hosts also use that startup surface while
resolving a saved current profile so the branded chooser cannot flash first.
The desktop adapter supplies the package-local Lapis logo as the visible loading
visual while preserving the startup region's accessible title.
Manage Vaults and desktop Open Vault… overlay the chooser over a retained
session; Close returns without disposing. The plugins task reports the current plugin
name. Metadata index load starts after layout restoration so database readiness
does not contend with `loadLayout`. Persisted queries become available before
rebuild or vault reconcile completes. Matching versioned Metadata and Search
checkpoints skip full warm scans; stale Metadata reconciliation finishes before
the single Search startup reconciliation begins. Configured Search providers
are absorbed into that single pass, and unrelated vault configuration events do
not invalidate its checkpoint. That work stays under status
progress handles and reports determinate processable-file counts; bounded file
batches yield so the notifications status item can paint. `App` registers
`app:rebuild-vault-cache`
and `app:rebuild-generated-state` so hosts can rerun that progress
(LN-PKG-097, LN-PKG-098). `App` constructs `NotificationManager`
before `Workspace` so the host can subscribe. Markdown parse runs in a worker,
while vault I/O, link resolution, bounded hot-cache apply, and database writes
stay on the main thread.
The development renderer adds the real linked Design Core package root to its
narrow Vite filesystem allowlist so public stylesheet assets remain available.

The API's synchronous `metadataCache`, `fileCache`, `resolvedLinks`, and
`unresolvedLinks` objects are a bounded open-file compatibility view, not the
vault index. Async per-file reads populate that view on demand, while paged
queries, facets, links, and query watches execute against `AppDatabase`. The
legacy `.lapis/cache/metadata-cache.json` file is neither read, rewritten, nor
removed.
The API package also exports the canonical search-query value formatter used by
dynamic consumers. It leaves parser-safe slash paths and tags bare, quotes and
escapes unsafe values, and round-trips the decoded literal without changing
leading-regex syntax. Search uses that public boundary for tag, path, and
filename completion insertion.

`@lapis-notes/language-service/markdownlint/runtime` is the public
boundary for Deno desktop diagnostics and code actions. The Deno
package maps that public specifier into its compiled native graph and uses
cache-backed npm resolution so the packaged app embeds Markdownlint instead of
depending on a pnpm symlink tree. Deno serves verified plugin metadata through
a same-origin HTTP route owned by its native host and does not import a
community plugin from an unchecked filesystem URL.
The Deno package consumes public `@lapismd/ai-host`, maps its package entry
and npm transport dependencies into the compiled graph, and delegates process,
ACP, and application-tool execution to that public executor. Its development
launcher may prepare ignored package-local files for declared workspace Deno
source imports so `deno desktop` resolves embedded files without reintroducing
a root Deno workspace. Because Deno
Desktop owns one loopback renderer server, the host attaches the public
Web-standard MCP handler to a reserved same-origin route instead of starting a
Node compatibility listener or copying broker logic.
The bundled AI package selects both default Codex and Cursor catalogs through
its ACP model provider. The Deno package owns deferred discovery execution and
catalog event delivery; the plugin owns request correlation and presentation.
The optional native Codex process catalog remains an explicit AI adapter and is
not the default Codex ACP discovery route (LN-AI-175, LN-DENO-056).
The same private host owns Deno application-menu projection, validated external
URL launch commands, local collector preflight, and the bounded close
coordinator. On macOS it routes both the adopted bootstrap and visible-window
close sources through that coordinator and releases a private same-origin
renderer close signal on the next event-loop turn. The renderer replaces the
workspace with its opaque branded status surface without using post-close
native window close or hide. It continues to own `App`, workspace, plugin,
database, and vault-session disposal, bounds best-effort telemetry flushing to
one second, and acknowledges native close only after that shared teardown
completes.
Its boot document provides only a branded loading state until the renderer
clears it or reports a startup failure through the existing status element.

The Deno host also owns one application-data lock and a bearer-authenticated
loopback activation endpoint. Its distribution metadata declares application
URL schemes, while the shared App URL registry remains the only interpreter of
delivered `lapis` and `lapis-notes` URLs.
Distribution scripts qualify stable artifact names by package version, platform,
and architecture; reuse the Lapis application icons; and select signing
credentials only through OS keychain or agent-backed identities.

## `@lapis-notes/workspace` (shell integration)

The workspace package is a thin Svelte adapter over
`@lapismd/design-core/workspace`. It receives an initialized api `App`, obtains
the host binding from `@lapis-notes/api/workspace-host`, and renders the default
design-core app-shell surface. It may forward Design Core's generic
workspace-navigation presentation contract, but contains no vault discovery or
selection policy, router, Lapis plugin bootstrap, persistence implementation,
or copied Lapis workspace renderer.
Its package contract exports `WorkspaceShell` and its component CSS, and its
mount test supplies a real initialized api `App` while asserting plugin loading
remains consumer-owned. Its public package metadata and semver dependency
manifest let standalone first-party plugin catalogs use the real shell without
source aliases or machine-specific link protocols.

## `@lapis-notes/ui` (pruned)

Overlapping shadcn families are consumed from `@lapismd/design-core/shadcn/*`.
`@lapis-notes/ui` keeps Lapis compounds only: `modal`, `search`,
`confirm-dialog`, `sidebar-custom`, and `table-dnd` (plus helpers), each painted
with colocated CSS and `--ui-*` tokens (no Tailwind utilities in sources).
Confirm-dialog keeps the Design Core `dialog` host identity and only adds
`--ui-confirm-dialog-*` max-width and footer gap.
Date/time settings use design-core `forms` pickers via api `date-setting` (the
old `date-time-picker-dialog` ui compound is retired).

`@lapis-notes/file-explorer` publicly exports `ExplorerPanel` and exposes
`selectedPath` plus a `file-explorer:selection-change` workspace event so
other plugins can follow folder selection without importing Explorer
internals. `@lapis-notes/ai` publicly exports `AiChatPanel`,
`AiHistoryPanel`, and
`AiCatalogPanel`, so
Autodocs can name the production components while stories continue to create
them through real plugin view registrations.
The same public AI entry exports provider-neutral memory service, scope,
retrieval, evidence, and typed turn-context contracts. The implementation and
policy remain AI-owned; API owns only the generic AppDatabase and App-tool
surfaces, and neither public boundary exposes ACP or consolidator-provider
payloads.
`MetadataCache.initialized` and `file-open` after `openFile` stay on the API
kernel so Markdown file-scoped panels can refresh after late metadata load.
Those panels share one follow helper and ignore a leaf event that repeats the
same followed path.
Restoring a non-file leaf still loads that view when its snapshot includes a
follow `file` path.
Backlinks and Outgoing Links read indexed link rows and async per-file metadata
for only the active note and its candidate sources. They neither enumerate
`getAllItems()` nor invert the synchronous link maps. The canonical check and
specification lanes enforce this boundary with the first-party metadata-query
source audit.
