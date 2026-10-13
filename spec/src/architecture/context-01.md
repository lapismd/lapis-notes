# Architecture / Context — Part 1

Storybook's host configuration imports the API's public build tooling through
its `dist` exports. Pages publication must prepare the workspace package build
graph before loading that configuration (LN-PKG-152), using the same Turbo
restore-or-build path as static Storybook CI rather than source aliases.

Changesets version PRs inherit source-change governance from their constituent
commits under LN-GOV-047. Only the generated release PR skips those two diff
gates; all package, specification, browser, and artifact validation remains in
the same CI graph. Publication continues through the existing manual approval
boundary under LN-ARCH-087.

For LN-ARCH-095, the dependency-image producer derives its candidate hash and
tag from the current lockfile while validating the pinned base image. An older
dependency pin MUST NOT prevent creation of its replacement build context. The
verified digest pin updates the hash, tag, and digest together; consumers still
reject stale lockfile metadata and missing digests.

The existing user-approved Bits UI `2.19.5` Link Preview lifecycle patch is
retained for the direct runtime refresh, so canceled selection probes and listener
cleanup remain qualified. This reuses the approved correction without extending
its scope; the legacy `2.18.1` patch still covers remaining transitive users.

Notes pins its direct Bits UI runtime to published `2.19.5`, including the
upstream document text-selection listener teardown fix. Dependency-originated
Svelte diagnostics remain fatal, and retained diagnostics fail after story
teardown even when component cleanup catches the immediate exception.

Notes owns its Deno CI runtime prerequisite: the shared `ci-setup` action installs
Deno `2.9.7` through the pinned setup action before toolchain verification and
frozen installation. Every validation, release and Pages job that uses this action
receives the same runtime. Missing or mismatched Deno fails before package tasks;
the shared Node/pnpm image does not promise a Deno runtime.

The application-owned profile follows LN-PLUG-006: Source Editor, Markdown,
File Explorer, and Search. Community is parked; its runtime and stylesheet are
absent from the profile while generic installed-plugin infrastructure and the
API-owned registry schema remain available.

Workspace owns the verified registry image presentation under LN-PLUG-092;
Community-derived presentation keeps the screenshot carousel, banner, and overview
separate and composes a navigable, viewport-bounded viewer without a Community dependency. Deno
owns native traffic-light selection and lifecycle under LN-DENO-046, while
Design Core owns maximized group inset geometry and bold Settings headings.

Static registry release candidates use the independently versioned framework
0.1.1 contracts. Temporary tarball validation retains source ownership and
does not replace portable registry-only qualification before publication.

Design Core-dependent surfaces follow the repository's portable published
semver boundary; dependency refreshes update manifests and the lockfile without
introducing sibling source paths.

Production generated state now uses direct, row-scoped Turso access with typed
post-commit revisions. Memory remains the explicit test and Storybook provider;
renderer transports relay the database revision contract without owning domain
state.

Daily-note path policy is a host concern exposed through the API-owned
`DailyDocumentProviderRegistry`. Desktop and web install the same default
provider before loading configuration; Tasks consumes the resolved provider
without owning vault folders, filename formats, or daily-note identity.

- Storybook is a documentation projection over the package graph.

- Its exact specification mirrors and post-build index acceptance do not add a runtime dependency or move plugin ownership into the catalog host.

- Composer agent and model defaults persist in AI plugin data; workspace dock selection persists through the existing 1000 ms writer.

- App-backed browser acceptance serializes story files because compatibility leases, portalled overlays, and worker-backed plugin resources share one browser realm; each story still owns and disposes its own App.

- Root package validation uses one bounded Turbo graph with signed organization remote caching.

- CI runs in an immutable lockfile-specific dependency image over the shared Lapis toolchain image; local container validation uses the same digest and remains functional without cache credentials.

- Separately versioned Roles/CV catalog coverage remains in its owning repository while Lapis hosts load that plugin only after a verified install.

- Tasks remains independently owned and hosts MUST NOT register its workspace views themselves.

- AppDatabase owns namespaced plugin projections and a serializable query AST, including the public `tasks/task` collection.

- That projection stores `planKind` as the Tasks `plan.at` kind (`anytime`, `morning`, `afternoon`, `evening`, or `time`).

- The workspace presentation package owns the compact Community Plugins trust status card defined by LN-PLUG-047; the API trust service remains the state and action authority.

- It also owns the registry and community empty-state and selected-tab presentation defined by LN-PLUG-048 through LN-PLUG-052.

- The API parses additive signed registry metadata and verifies referenced Markdown before Workspace rendering (LN-PLUG-053, LN-PLUG-054).

- Workspace owns the responsive row and detail presentation in LN-PLUG-055 through LN-PLUG-058 by composing Design Core's expandable SearchFilterBar and public controls.

- It does so without moving source, signature, installation, or lifecycle authority out of App services.

- Frontmatter value discovery remains application-owned: Markdown adapts the App metadata type manager into Mira's portable property configuration, while Mira owns the editor presentation and portalled suggestion surface.

- This keeps vault enumeration out of the shared renderer without duplicating its controls.

- Deno desktop sessions use the same API vault-session factory with a desktop-native Turso provider supplied by the host.

- `packages/desktop-deno` is the sole native desktop consumer and owns the Deno window, `win.bind()` bridge, native app-database handle, native host lifecycle, and services while remaining a consumer of public Lapis package boundaries.

- Vault resources stay within that host boundary: the renderer receives an opaque same-origin loopback URL, while Deno validates the capability and vault path before returning the binary HTTP response.

- Binary file bytes never travel through Laufey's string-valued binding response, and the host rejects NUL-bearing text reads before they can reach that response boundary.

- Its native console uses severity thresholds: routine bridge traffic is debug-only, while the default output is limited to bounded lifecycle notices, warnings, and failures and never includes invocation payloads or credentials.

- The development launcher also keeps Deno's native inspector opt-in and rejects it in telemetry mode because Deno 2.9.5 couples inspector activation to a raw binding-payload trace that would bypass that policy.

- Its production acceptance builds through the package and restores an isolated real vault rather than substituting a browser-only renderer test.

- Target-specific artifact naming, metadata, icons, verified PTY libraries, and credential-selecting signing orchestration remain owned by that host package.

- The development launcher is part of that host boundary: `pnpm dev:desktop` starts Vite, then runs `deno desktop` against the same Deno import map used by the native host, including its declared npm compatibility imports.

- The `pnpm dev:desktop:cef` debug launcher selects Deno Desktop's Chromium Embedded Framework backend so renderer DevTools can inspect the real bound desktop document rather than an unbound browser tab.

- When Deno Desktop needs embedded source inputs that are not available as published packages, the launcher may prepare ignored package-local files only for declared owned sources and refuses to replace an existing non-owned path.

- When the sibling Community registry fixture exists, the launcher derives its public relay and curator configuration plus its ordinary loopback manifest and asset origin for both the registry adapter and Community default scope.

- The renderer statically embeds those build-time values; explicit build configuration remains authoritative.

- The pre-renderer boot document is part of the same desktop boundary and owns only transient startup presentation.

- It shows only the centred Lapis logo while the Svelte renderer and native bridge initialize, exposes the loading state to assistive technology, then yields to the mounted application.

- Packaged acceptance reads the renderer-visible AppDatabase descriptor and must observe the host-owned `turso-native-desktop` provider over `native` transport; the browser-only WASM descriptor is not valid desktop evidence.

The shared validator is release tooling, not a runtime sibling. The root
manifest MUST resolve `@lapismd/spec-validator` from its published npm semver
dependency once available, while keeping Lapis-owned requirement IDs,
configuration, and verification evidence in this repository.
Visual Delta is likewise root-only Storybook tooling: the root manifest MUST
resolve `@lapismd/storybook-addon-visual-delta` from its published npm semver
dependency once available, and no Lapis runtime package may depend on it.

The reusable sync-host implementation follows LN-ARCH-091 through LN-ARCH-093:
API owns opaque identity, enrollment, recovery, cursor, generated-state, file,
network, and cryptographic capabilities; browser and desktop hosts supply only
platform custody and consent adapters. Nostr, Blossom, revision-graph, endpoint,
and synchronization UI policy remain outside the host API in protocol plugins.
Startup identity reconciliation follows LN-DB-054 when a file disappears during
fingerprint reads; the API owns that race across every host.

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

- Skill-source and composer slash-command registries follow the same explicit ownership boundary as application tools.

- API stores plugin registrations.

- AI discovers vault and folder skills under `.agents/skills`, snapshots them per binding, and routes composer commands from reserved host names and `.agents/commands` Markdown, including `/help`, `/scope`, `/context`, `/status`, and `/agent`.

- Local slash notices stay start-aligned with authored line breaks and show the composer working indicator while they prepare.

- The slash menu lists the same catalog commands, ranks Fuse name matches before description hits, and submits argument-free picks immediately.

- `/skills` and `/context` hydrate a missing binding snapshot from current discovery.

- AI ships bundled `research` and `lapis-notes` skills.

- An active skill file MUST NOT scope a new conversation to `.agents`.

- Search owns composer `/search` as a `notes_search` tool-dispatch command.

- The chat shows that invoke as a `ToolCalls` transcript item.

- Live ACP session start appends a path-free `available_skills` manifest and a generated `sessionBootstrap` through the host, including when the open conversation still sits under a skill folder.

- The AI catalog lists live tools, commands, and skills by owner in an explorer-aligned tree with filter and expand-all chrome.

- Mira editor slash commands remain a Markdown concern.

- The application tool registry follows the same explicit ownership boundary.

- It stores plugin-owned, transport-neutral callbacks on the owning App while AI derives binding-local policy snapshots and AI Host adapts descriptors to MCP.

- AI names process-backed integrations `McpServerContribution` and carries them on `AgentRequest.mcpServers`, leaving the reserved `lapis-tools` identity for the app-owned bridge.

- API constructs immutable tool scopes from trusted conversation directories; scope resolution rejects absolute, traversal, non-portable, and sibling-prefix paths instead of normalizing them into a different target.

- AI persists the master application-tool switch and per-tool enablement by tool name; invocation grants and binding-local descriptor snapshots are runtime state.

- Search owns `notes_search` and applies conversation scope through the generic database path-prefix option before result ranking and limits.

- Markdown owns `notes_list`.

- API owns Vault-backed `read`, `write`, `edit`, and `apply_patch` wrappers over the portable `@lapismd/ai-host/file-tools` kernel.

- Those bundled descriptions steer agents to the vault tools instead of host-cwd shell search (LN-AI-108).

- The first-party live transport is host-advertised and owned by `@lapismd/ai-controller`.

- Desktop supervises `lapis-ai-controller` and exposes only an authenticated connection; web and Storybook attach by URL and token.

- Leftover ACP embed helpers MAY still use the loopback broker plus official-SDK stdio shim and deferred start so prompt, cancel, and close remain available without holding a Deno binding (LN-AI-172, LN-DENO-055).

- Compatibility model discovery MAY still return a request id before a later catalog event (LN-AI-173, LN-DENO-056).

- Native-to-renderer events are likewise scheduled for a later browser task so their handlers cannot re-enter a native binding before window evaluation returns (LN-DENO-057).

- First-party run state comes from the shared controller journal; leftover protocol-v4 hosts MAY still reconcile retained terminal events (LN-DENO-060, LN-DENO-061, LN-AI-177).

- The Deno host keeps native Turso work on a dedicated worker; synchronous driver steps therefore cannot occupy the runtime that owns controller and renderer events (LN-DENO-059).

- Development and distribution compiles explicitly include that worker entry so the boundary survives Deno's compiled snapshot (LN-DENO-062).

- Both carry only generic bridge commands and events and never acquire registry, policy, or transcript authority.

- The AI controller allocates the binding identity before runtime start, opens the binding-local bridge from that identity, and commits that same identity only after startup succeeds.

- Replacing an agent closes the old bridge and its approval grants before a fresh snapshot is opened for the next binding.

- Runtime Allow always and Deny always decisions persist on conversation metadata so later matching permission requests stay silent; application-tool write grants remain memory-only (LN-AI-156, LN-AI-088).

- Permission and question option buttons use Design Core's public `feedback-option` part (LN-AI-157).

- Any visible runtime or host error removes the composer working indicator while the controller clears its owned busy state and remains retryable (LN-AI-052).

- Portable AI conversation files project into Search per affected conversation; ordinary turn persistence neither rebuilds the global index nor rewrites an unchanged full-text row (LN-AI-176).

- API owns result-view registration so Search can render `notes_search` hits and AI can render `/skills` and `/tools` inventories (LN-PKG-100, LN-AI-158, LN-AI-159).

- The explicit real-agent probe composes these same owner boundaries through narrow package entries: Search and Markdown supply list/search callbacks, API supplies Vault file tools, AI supplies the binding coordinator, and AI Host supplies the authenticated MCP transport.

- Its volatile App-tool vault cannot mutate the durable seeded workspace.

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

- Within that boundary, `LN-SRCH-023` keeps inset result-row and unindented child surface geometry, primary and contrasting secondary view paint, summary controls, and hover-stable metadata in the Search package while Design Core supplies reusable badges, tree primitives, surface tokens, and workspace placement.

- Compact parent rows expose only extension-free filenames, while the expanded body owns path and retrieval metadata.

- Incremental match context reads the Lapis vault through the Search component and does not expand the database or Design Core contracts.

- Recent-query persistence does not schedule replacement queries, so expanded context remains component state until query-driving inputs change or the index explicitly refreshes.

- Result navigation reuses an existing document leaf when available, but preserves a body-hosted Search leaf by opening its target in a sibling tab.

- The API owns search-query parsing and parser-safe dynamic-value formatting.

- Search supplies human-readable tag, path, and filename labels to Design Core with a separate formatted insertion value; reusable filter chrome does not learn Lapis grammar or escaping rules.

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
@lapis-notes/deno-host-services (private reusable Deno service kernels)
@lapis-notes/server-deno (authenticated managed-vault server host)
```
