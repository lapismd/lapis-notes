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

The current public framework releases are API `0.2.1`, UI `0.1.5`, File Explorer
`0.2.0`, and Workspace `0.3.1`. API, UI, and Workspace completed the approved
October 30 release through Changesets PR #45 and the protected npm workflow.
Their `latest` tags select the highest released stable versions; the retired
`next` channel is not part of the stable publication contract.
[Release evidence](../../records/2026-10-30-framework-release.md) binds registry
bytes, provenance, and consumer verification to the qualified source. Desktop
adoption and its native acceptance remain separate consumer gates.

Public packages that consume Design Core keep their portable semver ranges and
the workspace lockfile on the repository's current supported npm release.

The API package owns `AppDatabase` contracts and transport-neutral
metadata/revision types. Concrete native hosts own connections and bounded
bindings; domain persistence remains API-owned.

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

- The external Roles package remains a production host dependency only and does not enter the root Storybook development closure.

- CI prepares package outputs once, then fans out quality, unit, static Storybook, interaction/accessibility, and release-candidate work in independent blocking jobs.

- A stable aggregate job is the branch-protection boundary, while visual comparison remains wired but non-blocking.

- The Storybook host resolves Spellcheck's Harper binary import through the installed package closure while preserving the worker-facing binary export.

- `@lapis-notes/api` exports the namespaced projection query AST and allowlisted `queryProjection` methods so plugins can register collections and read public rows, including `tasks/task`, without importing each other.

- The tasks projection `planKind` values are `anytime`, `morning`, `afternoon`, `evening`, and `time`.

- `NativeDesktopRuntime` retains `deno-desktop` only as a compatibility name;
  the production Notes host is Web.

- Notes CI does not select `@lapis-notes/desktop-deno` or `@lapis-notes/server-deno`. Desktop packaging stays in lapis-desktop, and server-deno stays retired.

- Browser hosts share the renderer dependency-optimization boundary for registry-installed plugins.

- They also own plugin import-map proxy entries for declared shared API modules, so installed browser ESM plugins consume the same `@lapis-notes/api` and workspace-host runtime as the application.

- Deep Mira modules and their transitive CommonJS dependencies cross that boundary as one package-level pre-bundle.

- The local release-candidate installer preserves the committed registry lockfile, reuses a matching verified install, and invalidates generated Vite and Storybook caches when its package fingerprint changes.

The API owns startup fingerprint deletion recovery under LN-DB-054. Missing
files do not abort identity reconciliation; unrelated read errors remain failures.

The private host-services package exports root-bound filesystem execution,
portable path and error handling, file-watch mapping, vault-resource and plugin
asset responses, Markdown language operations, and the native AppDatabase worker
protocol/runtime. Desktop keeps window events, folder selection, and native file
actions in desktop-owned wrappers.

`@lapis-notes/api/app-database` exports the shared remote method contract, and
`@lapis-notes/api/server-host` exports protocol, profile, capability, and stable
error types. Neither entry exports a Node server or tRPC implementation.

- `@lapis-notes/server-node` pins matching tRPC v11 client and server packages, exports only the router type and browser client factory through its client entry, and keeps control migrations, password/session handling, Deno workers, managed storage, Fetch routing, and server startup in server-only modules.

- Bounded ZIP transfer and authenticated immutable plugin assets remain private data-plane implementations and do not enter that browser client entry.

- The browser entry may additionally export explicit server vault, database, event-stream, and plugin-asset adapters; those modules use Fetch and public API types only and contain no Deno globals or server implementation imports.

- `@lapis-notes/web` consumes that browser entry only from its compile-time server profile.

- Its default build and dependency-owned PWA behavior remain unchanged.

- The Web package also owns the server profile's branded login and managed chooser, including browser-side directory enumeration and ZIP creation.

- The server package continues to own authenticated upload limits, entry validation, and managed-vault creation for both picked folders and uploaded ZIP files.

- The server entry publishes the `node-server` document runtime before mount and does not publish the PWA-host document attributes.

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

- `@lapis-notes/markdown` File Properties uses Mira `valueSuggestions` and the existing Lapis file adapter for wikilink pills without forking pill-list editing.

- The API package delegates reusable diagnostic state and presentation to Design Core while exporting only Lapis-owned structural types and lifecycle helpers.

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

- Markdown and Search expose narrow `./agent-tools` entries for their portable factories.

- These entries do not make the MCP SDK a dependency of either domain package.

- The worker client uses a narrow API subpath so provider workers never load the application manager or presentation modules.

- The API agent-skills surface exports only skill-source and composer slash-command registration.

- Search owns composer `/search` as a `notes_search` tool-dispatch command and shows that invoke as a `ToolCalls` transcript item.

- Neither surface imports MCP, ACP, acpx, or vendor runtime types.

- The API agent-tool surface exports only schemas, results, trusted execution context, owner metadata, and lifecycle registration.

- It does not import or re-export MCP, ACP, acpx, or vendor runtime types.

- Its execution-scope helper validates vault-relative portable paths and exposes only fixed-directory containment and resolution to portable tool callbacks.

- The Search package owns `notes_search`; API owns the generic pre-limit `pathPrefix` database option used consistently by memory, Turso, desktop, and browser-coordinated implementations.

- Tool descriptions identify vault and index behavior so consumers do not substitute host-cwd lookup for note access.

- Sibling `@lapismd/ai-host` remains the transport library and MCP stdio shim.

- Compatibility adapters MAY still advertise deferred ACP start where their
  owning host explicitly supports it.

- The public Search panel keeps database snippet text paired with its highlight ranges.

- Its package-owned result layout follows `LN-SRCH-023`; consumers do not reposition counts, metadata badges, or child result surfaces with placement-specific CSS.

- The package exposes semantic runtime state through its status API and keeps the movable panel free of a persistent status tag.

- Content matches expand from their indexed file offsets, while public Search tokens own highlight paint and consumers remain free of result-row overrides.

- The panel keeps expanded slices stable across recent-query persistence and resets them only when search inputs change or the index explicitly refreshes.

- The results surface uses the resolved view background and expanded result bodies use its contrasting secondary background in every placement.

- Navigation does not replace a Search leaf that has been moved into the body.

- Result parents retain only a regular extension-free filename; expanded-body headers own the full path and applied retrieval mode.

The private native core also exports bounded archive extraction and immutable ZIP
snapshots. Hosts own provisional-root admission/publication and transport; archive
code owns content validation and streaming under the managed-vault contract.

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
