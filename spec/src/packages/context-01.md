# Packages / Context — Part 1

Pages publication restores or builds workspace `dist` outputs through the
existing Turbo wrapper before starting Storybook (LN-PKG-152). This satisfies
the API build-tool imports on a fresh checkout and reuses signed cache entries
when available; cache absence still builds the required outputs.

The dependency-image producer refreshes current-lockfile metadata before its
verified digest PR. The release-test lane includes image-context and container
regressions, so the normal CI unit job catches refresh failures before merge
under LN-PKG-142. Producer refresh does not authorize consumption of a stale
image or publish npm packages.

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

Desktop and registry UI consumers use published Design Core `0.3.2` for the
upstream overlay inset, bold settings headings, selected-tab indicator and mobile
teardown fixes. Publishable manifests require `^0.3.2`; the portable lockfile
resolves the checksum-bound npm artifact. No local Design Core archive is
required by the release candidate.
Workspace media presentation remains consumer-owned under LN-PLUG-092.

The static registry prerequisite release starts from independently versioned
0.1.1 framework candidates. Pending Changesets select API, UI and File Explorer
0.1.2 plus Workspace 0.2.0; public framework peers keep compatible API/UI ranges.
Local candidate verification may use ignored npm tarballs until those prerequisites
are approved and available from npm.

Public packages that consume Design Core keep their portable semver ranges and
the workspace lockfile on the repository's current supported npm release.

The API package owns `AppDatabase` contracts and transport-neutral
metadata/revision types. The Deno desktop host owns native connections and
bounded bindings; domain persistence remains API-owned.

The API package also owns the transport-neutral Nostr signer facade described
by LN-ARCH-099 and LN-PLUG-078. Platform hosts supply custody and consent
brokers; public packages and plugins never gain keychain or private-key access.

`@lapis-notes/api` owns the transport-neutral Markdown contribution and file
surface registries. `@lapis-notes/markdown` adapts them to Mira and registers
the full-file provider, including the LN-MD-108 and LN-MD-109 document defaults;
its Reading wrapper owns the LN-MD-110 viewport placement and content clearance.
The same package supplies Mira with vault-backed frontmatter value suggestions
for Live Preview, Reading, and File Properties without moving vault access into
the linked renderer.
Domain plugins consume only the API contract.

- Repository-only Storybook taxonomy, mirror, and built-index checks remain development tooling at the root and are excluded from publishable package runtime closures.

- AI model menus consume structured host catalog labels while `@lapis-notes/ai` still has no runtime `@lapismd/ai-host` dependency.

- The external Roles package remains a production host dependency only and does not enter the root Storybook development closure.

- CI prepares package outputs once, then fans out quality, unit, static Storybook, interaction/accessibility, and release-candidate work in independent blocking jobs.

- A stable aggregate job is the branch-protection boundary, while visual comparison remains wired but non-blocking.

- The Storybook host resolves Spellcheck's Harper binary import through the installed package closure while preserving the worker-facing binary export.

- `@lapis-notes/api` exports the namespaced projection query AST and allowlisted `queryProjection` methods so plugins can register collections and read public rows, including `tasks/task`, without importing each other.

- The tasks projection `planKind` values are `anytime`, `morning`, `afternoon`, `evening`, and `time`.

- `NativeDesktopRuntime` names only `deno-desktop`; the production hosts are Deno desktop and web.

- Root `dev:desktop`, `dev:desktop:cef`, `build:desktop`, `package:desktop`, and `test:desktop:packaged` scripts select and exercise the Deno package.

- The Web and Deno packages share the same renderer dependency-optimization boundary for registry-installed plugins.

- They also own plugin import-map proxy entries for declared shared API modules, so installed browser ESM plugins consume the same `@lapis-notes/api` and workspace-host runtime as the application.

- Deep Mira modules and their transitive CommonJS dependencies cross that boundary as one package-level pre-bundle.

- The local release-candidate installer preserves the committed registry lockfile, reuses a matching verified install, and invalidates generated Vite and Storybook caches when its package fingerprint changes.

- The desktop development script is a pnpm entrypoint that starts the Deno desktop host, so its Deno arguments must stay consistent with the package-local `deno.json` imports rather than imposing a root-level package-manager policy.

- It may discover the sibling Community fixture's public relay, curator, and loopback manifest and asset values for local registry debugging, then statically embed them in the renderer, but it never imports fixture signer secrets.

- The Deno package also owns the initial HTML boot surface displayed before the renderer mounts.

- It uses the package-local Lapis logo without visible loading copy, retains an accessible status name, and must not move workspace startup policy out of the application packages.

- It also owns the native console threshold.

- `LAPIS_DENO_LOG_LEVEL=debug` enables command-name-only bridge traces; the default `info` level suppresses that routine traffic while retaining lifecycle, warning, and failure diagnostics.

- The package development launcher MUST pass Deno's quiet flag, omit native inspection by default, and reject it in telemetry mode so inspector-only binding diagnostics cannot expose arguments or return values outside that threshold.

`@lapis-notes/ai` may offer a Node-backed user-agents command store only through
a runtime-only module boundary. Browser and renderer builds consume the portable
memory path unless a host capability supplies the user-agents directory, and
MUST NOT statically bundle Node file-system modules through the plugin's public
entrypoints.

The native filesystem adapter restores binding error codes under LN-DENO-077.
The API owns startup fingerprint deletion recovery under LN-DB-054. Missing
files do not abort identity reconciliation; unrelated read errors remain failures.

The private host-services package exports root-bound filesystem execution,
portable path and error handling, file-watch mapping, vault-resource and plugin
asset responses, Markdown language operations, and the native AppDatabase worker
protocol/runtime. Desktop keeps window events, folder selection, and native file
actions in desktop-owned wrappers.

`@lapis-notes/api/app-database` exports the shared remote method contract, and
`@lapis-notes/api/server-host` exports protocol, profile, capability, and stable
error types. Neither entry exports a Deno server or tRPC implementation.

- `@lapis-notes/server-deno` pins matching tRPC v11 client and server packages, exports only the router type and browser client factory through its client entry, and keeps control migrations, password/session handling, Deno workers, managed storage, Fetch routing, and server startup in server-only modules.

- Bounded ZIP transfer and authenticated immutable plugin assets remain private data-plane implementations and do not enter that browser client entry.

- The browser entry may additionally export explicit server vault, database, event-stream, and plugin-asset adapters; those modules use Fetch and public API types only and contain no Deno globals or server implementation imports.

- `@lapis-notes/web` consumes that browser entry only from its compile-time server profile.

- Its default build and dependency-owned PWA behavior remain unchanged.

- The Web package also owns the server profile's branded login and managed chooser, including browser-side directory enumeration and ZIP creation.

- The server package continues to own authenticated upload limits, entry validation, and managed-vault creation for both picked folders and uploaded ZIP files.

- The server entry publishes the `deno-server` document runtime before mount and does not publish the PWA-host document attributes.

- The server package owns a multi-stage, non-root container definition, health check, example secret mount, and operator documentation.

- Packaging does not publish, deploy, or change any public package.

- `@lapis-notes/spellcheck` registers a Harper language-service provider and a Lucide status item.

- Provider warmup is non-blocking for diagnostics, and the status item refreshes from configuration, not `layout-change`.

- It stays a bundled core plugin and does not import Design Core presentation.

- `@lapis-notes/wordcount` updates the API status bar for the active text editor and stays a bundled core plugin.

- Clicking the item shows reading time through the projected status menu.

- Design Core F-Mode remains an optional static shell plugin on the API-owned controller.

- A vault without workspace.json receives File Explorer, Search, then Bookmarks on the left and Outline, File Properties, then Tags on the right when those views are registered.

- The Bookmarks panel snapshots persisted items so add and remove refresh the tree, insets rows with the public Explorer content-padding token, uses Explorer toolbar hover tokens, and follows Explorer tree indent, chevron-centered guides, and leaf rows that omit the disclosure column.

- The API workspace registers Save, Load, and Reset layout commands for named snapshots and the same default seed.

- `@lapis-notes/file-explorer` adds native system-path copy, Lapis URL copy, open, and OS reveal only through Design Core `buildItemMenu` and the existing desktop `file-system-actions` IPC.

- Those extras stay out of the web and Storybook memory vaults.

- It also persists Show hidden files, registers the matching Workspace setting and palette command, and lets Design Core hide dotted names until that setting is on.

- Its vault-file palette provider declares the Files tab, exposes up to 25 recent files or a lexical fallback, lets Design Core cap that provider to five rows in All, and keeps path filtering when the user types.

- The API workspace records file recents on `file-open` and registers `app:go-to-file` so landing and empty-view actions open that tab.

- `@lapis-notes/ai` registers an Agents provider that groups conversations by date without adding one command per chat.

- It coalesces source-file events per portable conversation and incrementally maintains only the affected derived Search document (LN-AI-176).

- `@lapis-notes/markdown` File Properties uses Mira `valueSuggestions` and the existing Lapis file adapter for wikilink pills without forking pill-list editing.

- The API package delegates reusable diagnostic state and presentation to Design Core while exporting only Lapis-owned structural types and lifecycle helpers.

- Desktop Deno owns a worker boundary around its native Turso handle so database execution cannot starve the package's window and agent transports (LN-DENO-059).

- Its shared dynamic compile inputs keep the worker entry embedded in both development and distribution hosts (LN-DENO-062).

- Its private event transport retains monotonic replay and current ACP terminal state; AI consumes that state only to recover live presentation and remains the sole durable transcript owner (LN-DENO-060, LN-DENO-061, LN-AI-177).

- Live Problems totals therefore use Design Core's structured, ephemeral view badge and never enter Lapis layout state or package-owned panel markup.

- API projection treats Problems as host-owned even before the view is registered, so `loadLayout` restores a persisted leaf or leftover ghost placeholder as `workspace:problems` and later API commits do not replace it with an empty missing-view surface.

- Hydration does not seed a quiet bottom tab.

- The same claim-by-id path keeps each leaf's live `getState()` and opens files on an empty or file-backed main leaf rather than a plugin item view.

- Missing-view placeholders expose the Lucide `ghost` icon through `EmptyView`.

- Its narrow editor core and language-service subpaths let Markdown compose the source shell and diagnostics without importing the editor component barrel or its unrelated UI runtime.

- The Markdown package keeps canonical movable-panel registration, compatibility aliases, default placement, and opening-command metadata in one package-owned registry.

- This coordination is internal and does not add a package export.

- It also owns the scoped `notes_list` application tool; that callback captures Vault directly and exposes no editor, AI host, or MCP service.

- API owns Vault-backed `read`, `write`, `edit`, and `apply_patch` wrappers over the portable file-tools kernel.

- Markdown and Search expose narrow `./agent-tools` entries for their portable factories, while AI's existing `./runtimes` entry exposes the host and desktop bridge coordinator needed by the explicit real-agent diagnostic.

- These entries do not make the MCP SDK a dependency of either domain package.

- The worker client uses a narrow API subpath so provider workers never load the application manager or presentation modules.

- The API agent-skills surface exports only skill-source and composer slash-command registration.

- AI owns discovery of `.agents` skill and command Markdown, snapshots, skill tools, and routing, including reserved `/help`, `/scope`, `/context`, `/status`, and `/agent`.

- Local slash notices stay start-aligned with authored line breaks and show the composer working indicator while they prepare.

- The slash menu lists the same catalog commands, ranks Fuse name matches before description hits, and submits argument-free picks immediately.

- `/skills` and `/context` hydrate a missing binding snapshot from current discovery.

- AI ships bundled `research` and `lapis-notes` skills.

- An active skill file MUST NOT scope a new conversation to `.agents`.

- Search owns composer `/search` as a `notes_search` tool-dispatch command and shows that invoke as a `ToolCalls` transcript item.

- Live first-party session start appends a path-free `available_skills` manifest and a generated `sessionBootstrap` through host session setup, including skill-folder chats.

- The AI catalog lists live tools, commands, and skills by owner in an explorer-aligned tree.

- Neither surface imports MCP, ACP, acpx, or vendor runtime types.

- The API agent-tool surface exports only schemas, results, trusted execution context, owner metadata, and lifecycle registration.

- It does not import or re-export MCP, ACP, acpx, or vendor runtime types.

- AI coordinates each registry snapshot with one preallocated native binding and projects its events into the existing transcript.

- Deno desktop and the shared controller continue to transport opaque bridge identifiers rather than importing note-tool implementations.

- The bridge coordinator accepts only protocol-v3 hosts that advertise the owned `stdio-mcp` or `http-mcp` application-tool transport.

- Its execution-scope helper validates vault-relative portable paths and exposes only fixed-directory containment and resolution to portable tool callbacks.

- AI policy imports these contracts through the narrow `@lapis-notes/api/agent-tools` subpath so its non-UI tests and host adapters do not load API presentation code.

- The AI package keeps external MCP server processes in a distinct, deterministic `McpServerContribution` registry that rejects duplicate names and the reserved `lapis-tools` bridge identity.

- It owns the master application-tool switch and per-tool enablement settings and applies those choices only while constructing a new native binding snapshot.

- The Search package owns `notes_search`; API owns the generic pre-limit `pathPrefix` database option used consistently by memory, Turso, desktop, and browser-coordinated implementations.

- Bundled tool descriptions tell the agent to prefer those vault tools over host-cwd shell lookup (LN-AI-108).

- Sibling `@lapismd/ai-host` remains the transport library and MCP stdio shim.

- First-party desktop no longer embeds ACP startup; it exposes only an authenticated `lapis-ai-controller` connection (LN-DENO-055, LN-PKG-125).

- Leftover embed helpers MAY still advertise deferred ACP start for compatibility adapters.

- The public Search panel keeps database snippet text paired with its highlight ranges.

- Its package-owned result layout follows `LN-SRCH-023`; consumers do not reposition counts, metadata badges, or child result surfaces with placement-specific CSS.

- The package exposes semantic runtime state through its status API and keeps the movable panel free of a persistent status tag.

- Content matches expand from their indexed file offsets, while public Search tokens own highlight paint and consumers remain free of result-row overrides.

- The panel keeps expanded slices stable across recent-query persistence and resets them only when search inputs change or the index explicitly refreshes.

- The results surface uses the resolved view background and expanded result bodies use its contrasting secondary background in every placement.

- Navigation does not replace a Search leaf that has been moved into the body.

- Result parents retain only a regular extension-free filename; expanded-body headers own the full path and applied retrieval mode.

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
