# Migration Status

Living checklist for the minimal Lapis Notes monorepo. Update this file when
intake or UI swap status changes.

## Application ownership intake and integration (2026-08-16)

- [x] Review the latest Lapis API, Workspace, Electron, web/PWA, Bases, AI,
      root Storybook, and external CV Roles histories before implementation.
- [x] Rebase the isolated Lapis implementation onto `aee0cc25`, preserving its
      newer AI host, Bases query/editor, embedded Markdown, workspace-history, and
      external Roles integration changes while resolving specification and story
      conflicts against the current contracts.
- [x] Rebase external CV Roles onto `fef50854`; the ownership slice applies
      without content conflicts.
- [x] Inventory ambient App access in core views, editors, command scopes,
      hosts, PWA integration, Storybook harnesses, and CV Roles public surfaces.
- [x] Publish a compatibility bridge while making explicit or owned App state
      authoritative throughout first-party runtime code.
- [x] Migrate Electron, web/PWA, Bases, AI, root Storybook, and the external CV
      Roles runtime/catalog; retain compatibility only for legacy consumers.
- [x] Add fail-closed ambient-App source audits to root check and spec-check,
      plus tracked repository and shared sibling guidance.
- [x] Re-run focused and broad non-visual acceptance after integration into the
      original repositories: Lapis package/root gates, 43 Storybook files / 107
      scenarios, five real pointer tests, four web E2E cases, eight Electron
      smokes, Mira 59 files / 334 tests, and CV Roles package/Storybook/static
      lanes pass. Visual baselines remain unchanged by explicit user request.

## Bootstrap

| Area                                      | Status      | Notes                                                                                                                                                                                                                                               |
| ----------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| pnpm + Turbo scaffold                     | Done        | No multi-script import-resolution gates                                                                                                                                                                                                             |
| Spec governance + validation              | Done        | Modular validation covers canonical Markdown, verification, mdBook output, Storybook consumer source, database ownership, and web-host intake; local QMD discovery remains disposable                                                               |
| Storybook host (port 7010)                | Done        | `API/` verification stories + catalog                                                                                                                                                                                                               |
| Storybook consumer Show Code              | In progress | Panels use layout-derived examples; API and workspace demos expose explicit implementation/consumer source instead of demo invocation; Date Setting still needs a public-boundary example                                                           |
| API Storybook verification + Visual Delta | Done        | Plays green; `visual-pending` PNG baselines generated (review → `visual-approved` later)                                                                                                                                                            |
| Sibling dependency normalization          | Done        | Five root `link:` dependencies + overrides; package exports are authoritative; CodeMirror/Lezer peers are host-owned; focused editor capture restored all links and removed `.deps/` (4 baseline matches, 3 current-sibling mismatches; no updates) |
| `@lapismd/design-core` sibling            | Done        | Root `link:../design-core` + pnpm override; its package-declared source exports remain live; package manifests use portable `*` contracts                                                                                                           |
| `@lapismd/mira` siblings                  | Done        | Root `link:../mira-mde/packages/*` deps + overrides; rebuild Mira to refresh its linked `dist` exports without reinstalling Lapis                                                                                                                   |
| Storybook a11y in Vitest                  | Done        | `vitest.setup.ts` + `a11y.test: "error"`; filled action tokens AA-tuned                                                                                                                                                                             |
| Storybook style authority                 | Done        | design-core styles + lapis theme; ui `theme.css` only (avoid dual Tailwind)                                                                                                                                                                         |
| Storybook Vite config layout              | Done        | `.storybook/vite-final.ts` holds aliases; slim `main.ts` avoids Storybook CJS-scan ReDoS hang on large configs                                                                                                                                      |
| Editor settings parity                    | Done        | Legacy `editor.alwaysFocusNewTabs` defaults off and drives Design Core's created-tab policy; canonical descriptors keep every Editor field description aligned with its schema                                                                      |

## Packages

| Package / area                             | Status              | Notes                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@lapis-notes/api`                         | Copied              | Kernel from full lapis-notes; scripts slimmed                                                                                                                                                                                                                                                                                |
| `@lapis-notes/ui`                          | Pruned              | Kept compounds only: modal, confirm-dialog, search, sidebar-custom, table-dnd + helpers                                                                                                                                                                                                                                      |
| `@lapis-notes/workspace` shell integration | Done                | Public thin design-core host; portable api compatibility + persistence façade                                                                                                                                                                                                                                                |
| `@lapis-notes/web`                         | Done                | Legacy `8ec68e18` PWA intake; browser-owned vault/session boot and cross-tab Turso coordination pass focused browser acceptance                                                                                                                                                                                              |
| `@lapis-notes/desktop-electron`            | Done (partial host) | Source-first native-folder host from legacy commit `8ec68e18`; current core plugins, retained native services/sidecars, and local distribution only                                                                                                                                                                          |
| `@lapis-notes/markdown`                    | Done (slice)        | Authorized plugin; Mira document render + public app-only panels including Tags; Obsidian-compatible panel IDs retain load aliases for prior Lapis layouts                                                                                                                                                                   |
| `@lapis-notes/language-service`            | Done                | Provider-neutral Markdown client/worker supplies open-document diagnostics and cached actions                                                                                                                                                                                                                                |
| `@lapis-notes/markdown-lint`               | Done                | Enabled core plugin selects the probed native service or worker fallback and preserves configured rules, fixes, and ignores                                                                                                                                                                                                  |
| `@lapis-notes/lapis-plugin-cv-roles`       | Done                | Clean rename and vault workflows plus the legacy Applications, Activity, Actions, ticket-card, and role-detail component/CSS presentation are complete. Lapis owns the shell and vault/Mira adapters; Tasks and AI remain excluded. Fixed-profile browser review passed, with visual baseline work deferred at user request. |
| `@lapis-notes/ai`                          | In progress         | Bundled provider-agnostic AgentRuntime, host-gated live adapters on `./runtimes`, Codex and Cursor via ACP, Fake without a host, and a Design Core chat panel whose drawer owns pending permissions and agent questions; CV-domain MCP tools remain outside this package                                                  |
| `@lapis-notes/ai-host`                     | In progress         | Private process host: acpx executor with capability-aware thinking fallback, `lapis-ai-host serve`, required WebSocket token handshake; Electron uses the library in-process; PWA attach and Storybook `Plugins/AI/Live Host` use URL and token                                                                                     |
| Notebook / remaining unlisted plugins      | Not started         | Remain blocked by LN-PKG-004 until separately specified                                                                                                                                                                                                                                                                      |
| `@lapis-notes/file-explorer`               | Done                | Reusable File Explorer plugin shared by Storybook and Electron; single-click current/reuse, double-click reuse-or-create, and Command-click forced creation map to API workspace leaves; source-editor remains a Storybook-local fixture                                                                                     |
| `@lapis-notes/search`                      | Done                | Grouped-tree Search, settings, semantic retrieval, and cross-tab execution are shared by Storybook, Electron, and web hosts                                                                                                                                                                                                  |
| `@lapis-notes/history`                     | In progress         | Enabled-by-default file-history plugin captures vault revisions through AppDatabase, exposes a movable History panel, and compares through Design Core FileDiff / MergeEditor. Visual baselines remain `visual-pending`.                                                                                                    |
| `@lapis-notes/wordcount`                   | Done                | Enabled-by-default status-bar word and character count over the API status-bar contract. Design Core F-Mode is included on the default shell and disabled until the user enables it.                                                                                                                                       |
| `@lapis-notes/bases`                       | Done                | Legacy revision `8ec68e18` runtime and native presentation pass 20 test files / 161 tests, focused Storybook and pointer coverage, Electron and web persistence acceptance, and root check/test/build. Visual baselines remain deferred by request.                                                                          |
| design-core workspace engine               | Done                | Consumes public workspace APIs; shared stacked-pane width fixed at the design-core source                                                                                                                                                                                                                                    |

### App database replacement progress

- [x] Canonical provider, Turso, capability, and cross-tab requirements
- [x] Provider-neutral descriptor, capability, factory, and vault-session contracts
- [x] Turso native and WASM drivers with normalized generated-state persistence
- [x] Turso full-text, vector, hybrid, and local embedding execution
- [x] Remove legacy SQLite, sqlite-vec, and IndexedDB app-database implementations and dependencies
- [x] Pure typed Electron database proxy and bounded main-process RPC
- [x] Generic Web Locks and BroadcastChannel owner/proxy coordination
- [x] Block unsupported production runtimes instead of opening a non-Turso database

### Electron desktop host intake progress

Source: `/Users/stevejuma/code/lapis-notes/packages/desktop-electron` at
legacy commit `8ec68e18`.

- [x] Canonical desktop-host requirements, package authorization, verification mapping, and source provenance
- [x] Private `@lapis-notes/desktop-electron` package scaffold at version `2026.31.5`
- [x] Electron lifecycle, context-isolated preload, native menus, app URLs, window chrome, and bounded IPC
- [x] Native folder/profile bootstrap, filesystem/resource access, database/search, watches, notifications, and file actions
- [x] Markdown-only native language-service sidecar
- [x] Community-plugin sidecar, capability broker, and verified plugin asset protocol
- [x] Empty native-vault `WorkspaceShell` boot, persisted layout, reopen, fallback, switching, and teardown
- [x] macOS arm64/x64 local packaging, icons, entitlements, credential-safe signing/notarization hooks, and packaged smoke
- [x] Local-only macOS artifact manifest with sizes, SHA-256 checksums, and blockmap metadata
- [ ] Linux x64 AppImage/tar production and smoke on a Linux builder
- [x] Focused package, Electron, and macOS distribution validation
- [x] Root specification, check, test, and build validation
- [x] Focused `Workspace/Shell / PersistedDesktop` Storybook interaction and accessibility validation
- [x] Replace the temporary handwritten landing page with the branded `8ec68e18` native launcher while keeping demo seeding pruned
- [x] Load the production Design Core stylesheet pipeline and Lapis aliases in Electron
- [x] Match the default empty-vault shell: File Explorer then Search on the left, Outline / File Properties / Tags on the right, bottom closed
- [x] Route native “Open Vault…” through the launcher after orderly session teardown
- [x] Restore the legacy footer vault switcher with recent selection and “Manage Vaults” launcher return
- [x] Center native loading, restore compact launcher overlays, and reserve macOS traffic-light space through desktop CSS classes
- [x] Replace the session-boot stub with Design Core `WorkspaceStartup` and restore Design Core window-drag regions
- [x] Serve variable-font assets from the resolved linked Design Core package during desktop development
- [x] Load Markdown (including Tags), Markdownlint, and File Explorer before layout restoration; recover previously unavailable view placeholders when their implementation now exists
- [x] Load Search before layout restoration; restore canonical `search` leaves and execute queries through the native app database
- [x] Preserve a larger macOS traffic-light inset for the expanded left sidebar without changing the collapsed control geometry
- [x] Replace renderer database mirrors with window/vault-owned native Turso handles behind a bounded typed RPC allowlist
- [x] Serve packaged renderer assets from isolated `lapis-app://app/` with COOP/COEP and retain Turso WASM assets for Intel macOS
- [x] Full Storybook suite: 43 files / 107 interaction and accessibility scenarios pass, including Bases, CV Roles, application ownership, Markdown authoring/problems/frontmatter, and Outgoing Links geometry.
- [ ] `PersistedDesktop` Visual Delta comparison: blocked because Docker Desktop cannot start; no baseline was updated

Intentionally pruned: notebook/DuckDB, TypeScript-only language-service paths,
demo-vault seeding, bundled-plugin startup/build steps, the legacy full app
bootstrap, Windows targets, and remote release publication.

### History plugin intake progress

Source: `/Users/stevejuma/code/lapis-notes/packages/plugins/plugin-history`
adapted for the current App, Design Core diff surfaces, and VS Code-like caps.

- [x] Canonical `LN-HIST-001` through `LN-HIST-011`, host/catalog requirements, verification mappings, and spec-first routing
- [x] Reusable `@lapis-notes/history` package with `history` command view and internal `history-compare`
- [x] Vault-event capture with 256 KiB / 50-revision caps, 10s merge window, and glob excludes including `.jj`
- [x] Design Core History settings section for exclude/include globs, tracked extensions, and capture caps
- [x] Design Core FileDiff for previous and selected-pair compares; MergeEditor one-way for the live file
- [x] Select for compare / Compare with selected timeline actions
- [x] Electron, web, and Storybook host registration enabled by default
- [x] Six governed Storybook placements, compare story, and History Shell Desktop/Mobile
- [ ] History panel Visual Delta capture/review; stories remain `visual-pending` and no baseline is updated in this slice

### Application-tool MCP bridge progress

Transport-neutral app tools on the owning App, with AI policy snapshots and an
AI Host-owned `lapis-tools` MCP bridge. Canonical IDs: `LN-AI-086`–`LN-AI-095`,
`LN-SRCH-039`, `LN-DESK-047`, `LN-CAT-081`, `LN-PKG-080`. Delivery evidence:
[`spec/records/app-tool-mcp-bridge.md`](spec/records/app-tool-mcp-bridge.md).

- [x] Canonical requirements, ownership chapters, verification mappings, and spec-first routing
- [x] API registry, trusted scopes, and plugin lifecycle
- [x] AI snapshots, master enablement, per-tool opt-ins, approvals, and transcript projection
- [x] Search `notes_search` and Markdown `notes_read` / `notes_list` / `notes_patch`
- [x] AI Host stdio MCP shim, loopback broker, protocol v3, ACP, Codex Native, and authenticated remote WebSocket
- [x] Five governed app-tool Storybook scenarios with approved canonical baselines
- [x] Rebased onto History settings so Workspace Shell asserts the seven bundled plugins from `LN-CAT-077`
- [x] Full Electron `package:dir` lane: renderer Vite includes the Turso WASM bundle; unpacked app ships an executable `mcp-shim.mjs`
- [ ] Live paid-agent probes (`pnpm ai:smoke:probe:*`, Live Host, desktop smoke): 2026-08-17 rerun — harness 3/3; Codex ACP catalog (7) then Internal error on `notes_search`; Cursor ACP catalog (35) then `notes_read` omitted; Codex Native catalog (7) then usage limit. Storybook/desktop UI checklists not completed. Automated Live Host ReloadResume play covers restore-before-resume without a live prompt.

### Search plugin intake progress

Source: `/Users/stevejuma/code/lapis-notes/packages/plugins/plugin-search` at
legacy commit `8ec68e18`.

- [x] Reusable `@lapis-notes/search` package with canonical `search` view and commands
- [x] API `AppDatabase` indexing for Markdown/Canvas, stale pruning, and reactive refresh
- [x] Public lifecycle-managed search-document providers with built-in Markdown/Canvas and external Roles CV projection
- [x] Design Core `SearchFilterBar` with the API CodeMirror query language, diagnostics, completions, help, and facets
- [x] Collapsible file/match result tree with highlighted ranges, sorting, bounded recent searches, and workspace navigation
- [x] Persisted Match case, Collapse results, Show more context, Explain search terms, and structured-semantic toggles inside the single Search Filter Bar disclosure
- [x] Retrieval-mode facet, result badges, copy, semantic provider settings, status, and rebuild
- [x] Disabled-by-default Transformers.js activation with real model download/cache smoke and Electron-main CPU adaptation
- [x] Owner/proxy semantic configuration, rebuild, status, vector query, promotion, and reload acceptance
- [x] Compact Design Core command-picker facets for file type and retrieval mode
- [x] Legacy-aligned inset result geometry with transparent top-right counts, bottom-left metadata, and unindented bordered child surfaces
- [x] Surface-aware Search summary controls and metadata badges, with the redundant panel semantic-status tag removed
- [x] Stable incremental before/after match context, primary and contrasting secondary Search result surfaces, public yellow highlight tokens, faint sans-serif counts, and body-hosted Search preservation during result navigation
- [x] Compact regular-weight Search result filenames with full path and retrieval metadata inside expanded bodies
- [x] Recent searches use the standard result inset so labels and interactive row paint remain clear of panel edges
- [x] Six governed Storybook placements over the indexed in-memory vault
- [x] Tags and All Properties command-only query handoffs
- [x] Electron registration before metadata/layout load plus native persisted-view/result acceptance
- [ ] Search panel Visual Delta capture/review; stories remain `visual-pending` and no baseline is updated in this slice

### Bases plugin intake progress

Source: `/Users/stevejuma/code/lapis-notes/packages/plugins/plugin-bases` at
legacy revision `8ec68e18`.

- [x] Canonical `LN-BASE-001` through `LN-BASE-012`, host/catalog requirements, verification mappings, and spec-first routing
- [x] Buildable `@lapis-notes/bases` package scaffold with explicit root and stylesheet exports
- [x] Port 14 legacy test files and retain the 142-test behavioral baseline (20 files / 161 tests with current regressions)
- [x] Replace pruned UI imports with public Design Core primitives and Bases-owned compounds
- [x] Replace Tailwind utility markup with semantic native CSS and `--ui-bases-*` tokens
- [x] Inject `App` through the surface/controller hierarchy; serialize writes and flush on teardown
- [x] Register optional bundled Bases in Electron, web, and root Storybook before metadata/layout restoration
- [x] Verify persisted missing-view recovery without changing plugin data or `.base` content
- [x] Add focused public view/workflow stories and real-App file, embed, and disable/restore stories
- [x] Run package, focused Storybook, pointer, Electron, web, specification, and root check/test/build acceptance; keep visual capture and approval deferred by request

Pending parity gaps intentionally retained by this port: a real map capability;
complete Obsidian value wrappers and method-style formula semantics; `this`
binding and richer file/link behavior; deeper grouped and summary semantics;
the duplicated compatibility/runtime model and stub formula evaluation; and
name-level parity reporting that does not prove behavior. Tasks-owned layouts,
notebook integration, community installation, and broader Obsidian parity are
outside this intake.

### Web host intake progress

Source: `/Users/stevejuma/code/lapis-notes/packages/web` at legacy commit
`8ec68e18`.

- [x] Canonical web-host requirements, package authorization, and provenance
- [x] Private `@lapis-notes/web` package at version `2026.6.3`
- [x] Branded OPFS and File System Access vault launcher and session host
- [x] Current core plugin boot before metadata and layout restoration
- [x] PWA manifest, icons, prompt updates, isolation, and verified asset cache
- [x] Real owner/proxy database status, delegation, and promotion
- [x] Two-tab Playwright acceptance and root web scripts

### Markdown plugin intake progress

Canonical Markdown requirements span `spec/src/plugins/markdown/index.md`, its nested
`spec/src/plugins/markdown/panels/` pages, and the shared movable-panel contract
in `spec/src/workspace-shell/panels.md` (LN-MD-001 through LN-MD-035). Parity
detail lives in `packages/plugins/plugin-markdown/PARITY.md`.

- [x] Package scaffold + workspace wiring (`@lapis-notes/markdown`)
- [x] Canonical panel documentation split into one page per panel beneath Markdown Plugin / Panels, with reusable surface and catalog guidance owned by Workspace Shell / Panels
- [x] Mira-owned markdown document modes (`source` / `live-preview` / `preview`)
- [x] Path A / Path B editor extension reload + host editor events preserved
- [x] Markdown settings section (Mira features, mermaid, AI stub)
- [x] Side panels: All Properties, File Properties, Outline, Backlinks, Outgoing Links, Media; Outline and link panels carry the full observable interaction/data slice
- [x] Declarative panel-command registry covers All Properties, Outline, File Properties, Backlinks, Outgoing Links, and Tags; commands reveal moved leaves or create the canonical right-side view, while file-backed views retain editor associations and aliases reuse canonical commands
- [x] Shared `MarkdownSidebarPanel` recipe (LN-MD-018, LN-MD-032 through LN-MD-035) + Markdown-owned Tags view; all movable panels are full-width/titleless with workspace-family 0.75rem list/result controls, and design-core `WorkspaceViewHost` resolves public view paint tokens with a white body/bottom/group default and sidebar paint only for ungrouped top-level side panels; Lapis contains no placement selectors
- [x] Metadata write contract + type widgets + `trackChanges` / `types.json` demo seeds
- [x] File Properties → Mira `FrontmatterEditor` + Lapis `MetadataTypeManager` adapter, no-overflow narrow single-column rows with label-aligned values, native focus geometry with view-token contrast fill, hash Tags icon, and surface-contrasting native pills (LN-MD-017/019)
- [x] Markdown frontmatter integration → public Mira source decorations, Source Code Pro YAML source, Mira-only inline fold controls, working rendered disclosure, and unpadded content-aligned embedded preview (LN-MD-025)
- [x] Complete Mira authoring composition → public base-free factory inside the API editor shell, selection tools, draggable block handles, slash commands, tables, images, completions, smart paste, extension lifecycles, truthful typed settings, optional edit-only top toolbar, and opt-in Doodle Dividers (LN-MD-071 through LN-MD-075)
- [x] Compact Mira feature settings → the 20 capability descriptors retain flat dotted keys/defaults/runtime gates while design-core renders their explicit labels and descriptions in a presentation-only Features toggle table (LN-MD-082/083, LN-ED-042)
- [x] Markdown mode chrome → API-to-design-core projection of compatibility view actions and pane menus; full-repo book-open/pencil mode actions, modifier split behavior, Reading/Source menu toggles, and registered Markdown provider items (LN-MD-076/077, LN-ED-038/039)
- [x] Reusable embedded editor → public API surface composes registered language/view extensions with flushable host-owned persistence and a source-only fallback; Markdown consumes the same surface used by external plugin pages (LN-ED-050/051, LN-MD-090)
- [x] Domain-file Markdown delegation → public serialized return targets let external previews hand a leaf to bundled Markdown Live Preview and restore the originating view; the external Roles package owns rich source and Description acceptance (LN-ED-052, LN-MD-091)
- [x] Markdown view-menu and Reading polish → borderless Mira Reading shell, View-first mode and toolbar controls, plus persisted toolbar indentation settings (LN-MD-078 through LN-MD-081, LN-ED-040/041)
- [x] Mira-backed embed framework → app-bound `MiraFileAdapter`, public `FileEmbed` / `MarkdownEmbed` / `NoteLink` plus `./embed`, shared document and Design Core Hover Card link-panel previews, vault-relative resolution, refresh/navigation, image and registered custom-embed lifecycle (LN-MD-026)
- [x] Ordinary Mira internal-link previews → linked source-owned Bits UI `LinkPreview`, owner-document portal, collision-aware viewport geometry, active appearance, and topmost cross-pane paint without a Lapis wrapper (LN-MD-027)
- [x] Editable note hover previews → Lapis vault-backed `writeMarkdown`, automatic ordinary-link editing, opted-in Backlinks/Outgoing `FileEmbed` editing, 500ms serialized autosave, dirty-error retention, and read-only direct embeds (LN-MD-028)
- [x] Minimal editable preview cards → no resolved filename/path chrome or panel embed guide, disclosure-safe all-round padding, sticky top-right open action, two-pixel editing border, CodeMirror-owned edit scrolling, hover/focus pinning, and persistence-safe outside-click dismissal (LN-MD-029)
- [x] Unified editable preview appearance → inherited Mira portal theme, explicit panel FileEmbed theme, Lapis-aligned Mira accent aliases, and preview padding isolated from live-edit frontmatter (LN-MD-030)
- [x] Focused `Plugins/Markdown/Panels/<Panel>/*` interaction stories: six movable surfaces for All Properties, File Properties, Outline, Backlinks, Outgoing Links, and Tags; file-scoped stories keep one minimal active note and vault-wide stories stay document-free
- [x] Real app-only component metadata with no kind/layout harness controls; real bottom/sidebar groups, stable ViewHost paint assertions, isolated 700px padding-free Docs previews, and explicit persisted-layout Show Code
- [x] Linked Mira package exports + CodeMirror/Lezer dedupe; ignored `.deps/*` staging remains Docker-only
- [ ] Markdown panel Visual Delta capture/review; all placement stories declare independent pending paths, but this slice intentionally generates or updates no PNGs
- [x] File Properties vault-wide value suggestions and wikilink pills through Mira `valueSuggestions` plus the Lapis file adapter
- [ ] Full metadata worker / heavy type widgets remain deferred

### Workspace shell integration progress

- [x] Generic Problems integration → design-core diagnostics façade, plugin-owned collections, open-document language-service bridge, diagnostics-only Markdown composition, Markdownlint provider, navigation/actions with open-editor/vault parity, aligned severity gutter glyphs, compact hover cards with stable origin handoff, styled inline problem expansion with clean hover recovery, transient tree/table presentation with shadcn two-axis scrolling, a live count in the owning leaf badge, an inline severity-filter menu, a leaf-owned title with right-aligned toolbar controls, and runnable editor acceptance (LN-WS-025 through LN-WS-048)
- [x] Diagnostic hover cards keep unique action keys when titles repeat, and cached language-service actions stay scoped to the originating diagnostic with one action per title (LN-PKG-082, LN-WS-056)
- [x] Editor-demo runtime teardown synchronously unloads and destroys retained editors before asynchronous plugin/controller disposal, preventing HMR from accumulating Mira portal hosts (LN-WS-019, LN-ED-009)
- [x] API editor note-column ownership neutralizes linked Mira's inherited outer-sizer constraint before applying file margins, preserving the 700px readable body when sidebars close (LN-ARCH-037, LN-PKG-048, LN-ED-046)
- [x] Full-shell `Workspace/Shell`, `Workspace/Lapis Editor Demo`, and panel Autodocs share an isolated 700px padding-free application viewport; authored shell pages render every canonical story description
- [x] Canonical requirements and governance mapping
- [x] Api-owned design-core controller and compatibility projection
- [x] Host-only `@lapis-notes/api/workspace-host` export
- [x] `@lapis-notes/workspace` package
- [x] Persisted desktop and mobile Storybook stories
- [x] Interaction, accessibility, build, and visual verification
- [x] Full-viewport desktop/mobile parity, Lapis About/version chrome, and notifications presentation
- [x] Empty-view stacked-tab overflow parity with design-core
- [x] Floating-window controls use design-core panel-action hover tokens and consumer Storybook verification
- [x] Top/stacked pane maximize toggles, compact reserved top-tab actions, and conforming floating-window maximize/minimize icons from design-core
- [x] Design-core V3 bottom panel preserved through the api compatibility façade and workspace writer
- [x] Focused bottom-panel/settings Storybook scenario with live shell-setting verification
- [x] API-registered story views visibly consume the live inline-title appearance setting

## UI → design-core

Styling target: native CSS, `--ui-*` tokens, `data-ui-theme="lapis"`.

**Policy:** any shadcn family that exists in `@lapismd/design-core` MUST come
from design-core. Keep only Lapis-unique compounds and primitives design-core
does not ship yet; prefer upstreaming missing shadcn primitives over long-term
forks.

### From design-core (swap — clear shadcn overlap)

| Family        | design-core target                   | api usage         | Status                        |
| ------------- | ------------------------------------ | ----------------- | ----------------------------- |
| button        | `@lapismd/design-core/shadcn/button` | direct            | Done (api imports)            |
| input         | `…/shadcn/input`                     | direct            | Done (api imports)            |
| textarea      | `…/shadcn/textarea`                  | direct            | Done (api imports)            |
| switch        | `…/shadcn/switch`                    | direct            | Done (api imports)            |
| table         | `…/shadcn/table`                     | direct            | Done (api imports)            |
| select        | `…/shadcn/select`                    | direct            | Done (api imports)            |
| command       | `…/shadcn/command`                   | direct            | Done (api imports)            |
| popover       | `…/shadcn/popover`                   | direct            | Done (api imports)            |
| hover-card    | `…/shadcn/hover-card`                | direct            | Done (Markdown link previews) |
| dropdown-menu | `…/shadcn/dropdown-menu`             | direct            | Done (api imports)            |
| tooltip       | `…/shadcn/tooltip`                   | direct            | Done (api imports)            |
| scroll-area   | `…/shadcn/scroll-area`               | direct            | Done (api imports)            |
| toggle-group  | `…/shadcn/toggle-group`              | direct            | Done (api imports)            |
| toggle        | `…/shadcn/toggle`                    | transitive        | Done (api imports)            |
| dialog        | `…/shadcn/dialog`                    | transitive        | Done (api imports)            |
| sheet         | `…/shadcn/sheet`                     | type + transitive | Done (api imports)            |
| separator     | `…/shadcn/separator`                 | transitive        | Done (api imports)            |
| skeleton      | `…/shadcn/skeleton`                  | transitive        | Done (api imports)            |
| progress      | `…/shadcn/progress`                  | direct            | Done (api imports)            |
| slider        | `…/shadcn/slider`                    | direct            | Done (api imports)            |
| context-menu  | `…/shadcn/context-menu`              | direct            | Done (api imports)            |
| drawer        | `…/shadcn/drawer`                    | direct            | Done (api imports)            |

### Keep in `@lapis-notes/ui` (not in shadcn-svelte registry)

Verified against `https://shadcn-svelte.com/registry/index.json` — these names
are **not** registry UI items. Maintain here (or compose from design-core
primitives) until a deliberate Lapis compound lands in design-core.

| Family         | Why keep                                      | Near-miss                               | Status                                               |
| -------------- | --------------------------------------------- | --------------------------------------- | ---------------------------------------------------- |
| modal          | Imperative DocumentFragment / plugin host API | `shadcn/dialog`                         | Kept; colocated `modal.css` + `--ui-modal-*` (no TW) |
| confirm-dialog | `promptConfirm` → Promise\<boolean\>          | registry `alert-dialog` (different API) | Kept; colocated CSS + `--ui-confirm-dialog-*`        |
| search         | Input + icon + clear compound                 | `filter/SearchFilterBar`, `input-group` | Kept; colocated `search.css` + `--ui-search-*`       |
| sidebar-custom | NestedProvider, resize, `SidebarState`        | registry/design-core `sidebar` (stock)  | Kept; native CSS/tokens + portable wrapper props     |
| table-dnd      | dnd-kit grips/sensors for settings arrays     | forms `SortableArrayItem`               | Kept; grip chrome via `--ui-table-dnd-*`             |

Also keep local: root `cn` / fuzzy helpers. Trigger-overlay portal ownership is
now centralized in Design Core; the retired Lapis `overlay-portal-context`
export and API source alias MUST NOT be restored.

**Retired:** `date-time-picker-dialog` — removed from `@lapis-notes/ui`. Date/time
settings use api `date-setting` → `@lapismd/design-core/forms` `DatePicker` /
`TimePicker` (Storybook: `API/Date Setting`, catalog id `api-date-setting`).

### Add to design-core from shadcn-svelte registry (then swap)

These were on the keep list but **are** upstream registry UI items. Do **not**
maintain separate forks in `@lapis-notes/ui`. In design-core:
`pnpm ui:add <name>` → consume `@lapismd/design-core/shadcn/<name>`.

| Family       | Registry             | design-core today | Action                     |
| ------------ | -------------------- | ----------------- | -------------------------- |
| progress     | yes (`progress`)     | present           | Done — api imports swapped |
| slider       | yes (`slider`)       | present           | Done — api imports swapped |
| context-menu | yes (`context-menu`) | present           | Done — api imports swapped |
| drawer       | yes (`drawer`)       | present           | Done — api imports swapped |

### Prune from local ui

| Family                                                                                                                                                                                                                      | Note                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| All swap families (button, input, textarea, switch, table, select, command, popover, dropdown-menu, tooltip, scroll-area, toggle-group, toggle, dialog, sheet, separator, skeleton, progress, slider, context-menu, drawer) | Done — pruned from local ui; api + stories consume `@lapismd/design-core/shadcn/<family>` |
| date-time-picker-dialog                                                                                                                                                                                                     | Done — retired; date/time via `forms` DatePicker/TimePicker                               |
| label                                                                                                                                                                                                                       | Done — deleted (orphan)                                                                   |
| sidebar (stock)                                                                                                                                                                                                             | Done — deleted; `SIDEBAR_WIDTH_ICON` lives in sidebar-custom constants                    |

All api-consumed families also have `API/` plays and `visual-pending` baselines
(helpers are `skip-visual`). Promote tags to `visual-approved` after human review.

### Theme / CSS

| Item                            | Status          | Notes                                                          |
| ------------------------------- | --------------- | -------------------------------------------------------------- |
| Brand (`themes/lapis.css`)      | Source of truth | design-core Lapis semantic + `--ui-workspace-*`                |
| Local `theme.css`               | Alias-only      | Obsidian-era → design-core map (below); no palette / `@theme`  |
| Local `styles.css`              | Alias re-export | Imports `theme.css` only (no Tailwind)                         |
| design-core styles in Storybook | Done            | `.storybook/preview.ts`; production host cutover still pending |
| `pnpm check:no-tailwind`        | Done            | Scans ui + api components; stories excluded                    |

#### Obsidian / Lapis alias map (`ui/theme.css`)

| Lapis / Obsidian-era                  | design-core target                                               |
| ------------------------------------- | ---------------------------------------------------------------- |
| `--text-normal`                       | `--foreground`                                                   |
| `--text-muted` / `--text-faint`       | `--muted-foreground`                                             |
| `--text-accent`                       | `--ring` / `--primary`                                           |
| `--interactive-accent*`               | `--primary` / `--ring` / `--lapis-accent*`                       |
| `--background-primary` / `-secondary` | `--background` / `--muted`                                       |
| `--background-modifier-border*`       | `--border` / `--input` / `--ring`                                |
| `--input-height`                      | `--ui-control-height` → `--ui-workspace-settings-control-height` |
| `--color-base-*` ramp                 | Dropped from component paint                                     |

### Compound / api chrome conversion

| Surface                                                        | Status                                |
| -------------------------------------------------------------- | ------------------------------------- |
| ui: modal, confirm-dialog, search, table-dnd                   | Done — colocated CSS + tokens         |
| ui: sidebar-custom                                             | Done — native CSS family              |
| api: menu, configuration, editor layout, empty-view, icon-list | Done — colocated CSS; no TW utilities |

## Out of scope (do not copy yet)

- Full-app `scripts/check-first-party-*.mjs` matrix
- Docker / e2e vault / plugin-host generation
- Changesets / npm publication gates
