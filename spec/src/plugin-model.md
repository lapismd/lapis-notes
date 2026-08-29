# Plugin Model

Markdown extensions and file-surface providers use the normal `Plugin`
lifecycle. Registration is plugin-scoped and automatic teardown removes each
contribution without adding another loader or contribution manifest.
Markdown's frontmatter and inline-outline preferences remain flat plugin
settings; they do not add another Mira extension or plugin lifecycle. The
Markdown-owned Reading wrapper adapts the floating outline to its shared outer
scroll owner without changing Mira's portable outline contract.
Markdown likewise adapts its App-scoped metadata type manager to Mira's
frontmatter value-suggestion callback. Storybook panel fixtures must exercise
that plugin boundary rather than providing a component-only completion list.

Lapis distinguishes ownership and distribution without changing runtime plugin
identities or creating a second lifecycle. A `deno-desktop` session reports
plugin-distribution platform `desktop` rather than `electron` or `web`.
Electron-labelled manifest hosts remain accepted compatibility vocabulary for
installed plugins; they do not imply an Electron application runtime. Verified
desktop assets are served only through the Deno host's same-origin route, while
web retains its public route. Workspace `activateLeaf` remains an
API-owned selection that the persisted layout must restore. Statically shipped plugins use the
core manager even when their source is maintained in a separate repository.
First-party plugin surfaces compose Design Core public parts for shared chrome;
plugin projection and search-document registrations stay plugin-scoped even
when Deno desktop persists their generated rows through the native AppDatabase
bridge.
Global Graph initially fits and centers its complete visible projection; it
does not inherit the active document as an implicit focus. Local Graph retains
its explicit active-note center contract. The explicit Focus active file action
may zoom and center the active note, but it does not participate in Global
Graph startup.
AI composer drawer chips use the public `attachment-chip` contract instead of
plugin-local paint. Bundled AI MUST remain a Lapis plugin and MUST NOT gain a
runtime dependency on sibling `@lapismd/ai-host`. Assistant chat Markdown uses
the public Markdown embed helper rather than a second renderer and grows with
the transcript instead of a nested scroller (LN-AI-122). Folder-scoped
chats project path breadcrumbs through the same View chrome hooks as History.
A busy chat Stop control cancels the active agent turn, including a send that
is still preparing a session.
The same enabled AI plugin owns one memory service per App. It registers
provider-neutral read tools, consumes durable conversation checkpoints, writes
curated vault records through its own store, and schedules derived ingestion
and consolidation work. AppDatabase and native hosts provide generic storage
and transport only; disabling or switching an ACP binding does not transfer or
delete this plugin-owned memory lifecycle (LN-AI-179, LN-ARCH-083).
For a native host that advertises deferred ACP start, the AI runtime adapter
reserves the session and subscribes before start; other hosts retain the
awaited start path (LN-AI-172).
For a native host that advertises deferred model discovery, the model provider
subscribes before sending its request and resolves the matching catalog event;
other hosts retain the awaited catalog path. Both default Codex and Cursor
providers use this agent-scoped ACP route; the separately exported native Codex
process provider remains explicit rather than replacing Codex ACP discovery
(LN-AI-173, LN-AI-175).
Tool details unwrap envelope fields such as
`output` and choose `json`, `bash`, or `plaintext` for the Design Core
`CodeBlock` (LN-AI-133). Thinking stays expanded only while it streams
and collapses when later transcript data arrives (LN-AI-131). Stop settles
leftover spinners immediately and posts a cancelled system notice after cancel
confirms (LN-AI-132). The notice reads `Agent turn cancelled`.
Visible runtime and host errors remove the working indicator and leave the chat
able to retry (LN-AI-052).
An unreadable open conversation is reported and
released so the next send starts a replacement chat (LN-AI-124).
Runtime Allow always and Deny always decisions persist on conversation
metadata (LN-AI-156).
An unpinned idle chat follows the active-file folder and shows a faded centered
scope control. The host supplies its visible-folder catalogue; the control adds
Vault root, reuses the existing conversation transition, and reveals an
explicitly selected scope through Explorer's public command. Pinning still
prevents automatic active-file follow (LN-AI-160, LN-AI-161, LN-AI-162,
LN-AI-163, LN-AI-178).
File Explorer publishes `selectedPath` and a workspace selection-change
event so AI History can follow folder context without importing Explorer
internals (LN-EXP-005, LN-AI-165, LN-AI-166, LN-AI-167, LN-AI-168).
History folder counts share one trailing edge across depths (LN-AI-169). The
public AI renderer entry keeps optional Node user-agent storage outside browser
and WebView bundles (LN-AI-170).
Permission and question option buttons use the public `feedback-option` part
(LN-AI-157).
Plugins contribute tool and command result views through the API registry
(LN-PLUG-024).
Application-tool names and arguments stay visible when ACP only reports a
generic `tool call` title (LN-AI-125). The composer overflow
menu sits after History and attach, sizes to its labels so they stay fully
visible at the model-menu type size (LN-AI-123), archives or restores in
place, deletes through vault
trash, and offers New Chat (LN-AI-109). AI History opens as a
single sidebar leaf rather than a default sidebar group. The AI catalog
opens as a single left-sidebar leaf of live tools, commands, and skills in
an explorer-aligned tree. Opening a vault skill file MUST NOT scope a new
chat to `.agents`.

## Requirements

| ID          | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LN-PLUG-001 | Extracted first-party plugins MUST use package directories named by plugin slug in the sibling `lapis-plugins` monorepo, retain their `@lapis-notes/*` package names and runtime IDs, version independently, and report official provenance.                                                                                                                                                                                                                                                                                                           |
| LN-PLUG-002 | Standalone first-party plugins MUST use repositories named `lapis-plugin-*`, version independently, and report `distribution: "first-party-external"` with official provenance. Tasks, Docs, Terminal, and CV Roles MUST remain standalone rather than moving into `lapis-plugins`.                                                                                                                                                                                                                                                                  |
| LN-PLUG-003 | Statically shipped profile plugins MUST use the static lifecycle and `.obsidian/core-plugins.json`; vault-installed registry or manual plugins MUST use the verified community-plugin persistence and loader.                                                                                                                                                                                                                                                    |
| LN-PLUG-004 | Core plugin registrations and list entries MUST expose distribution metadata, defaulting omitted registrations to `bundled`.                                                                                                                                                                                                                                                                                                                   |
| LN-PLUG-005 | Array-form core configuration MUST remain readable as disabled IDs. Object-form configuration MUST preserve explicit `disabled` and `enabled` IDs.                                                                                                                                                                                                                                                                                             |
| LN-PLUG-006 | The Lapis Notes default profile MUST contain exactly Source Editor, Markdown, File Explorer, and Search in that order. All four MUST default enabled and remain user-disableable. Problems and other declared infrastructure MAY remain required. Required host-owned views such as Problems MUST NOT become missing-view placeholders while their host registration remains. |
| LN-PLUG-007 | Disabling a plugin with open owned views MUST replace those leaves with persisted missing-view placeholders. Re-enabling it MUST restore the leaves without changing active selection or plugin-owned data. Restored imperative plugin views MUST receive a host-filling compatibility root without depending on application-global utility CSS. Collapse, remount, and file-open projection MUST keep the same leaf id and live `getState()`. |
| LN-PLUG-008 | Core and Community plugin settings MUST subscribe to lifecycle changes and failures through the Design Core managed-plugin source contract while preserving the legacy row order, toggles, Options links, restart actions, trust controls, and diagnostic disclosures. |
| LN-PLUG-009 | Default Search, Explorer, or Bookmarks leaves MUST NOT be created while their owning plugin is disabled. A registered `bookmarks` view MUST restore an existing bookmarks leaf instead of leaving a missing-view placeholder.                                                                                                                                                                                                                  |
| LN-PLUG-010 | Community installation, registry, signature, update, and enablement MUST use the verified installed-plugin distribution contract and MUST remain separate from the static application profile. |
| LN-PLUG-011 | A package or repository rename MUST preserve runtime IDs, commands, view types, filenames, and plugin-data paths unless a separate migration requirement explicitly changes them.                                                                                                                                                                                                                                                              |
| LN-PLUG-012 | Core settings MUST list each runtime plugin ID exactly once, including when a statically registered plugin also exposes indexed manifest contributions.                                                                                                                                                                                                                                                                                        |
| LN-PLUG-013 | `Plugin.registerSearchDocumentProvider` MUST namespace provider IDs and dispose registrations with the owning plugin lifecycle. It MUST NOT grant providers direct generated-index ownership.                                                                                                                                                                                                                                                  |
| LN-PLUG-014 | Plugin ribbon and status contributions MUST appear only while their owner is enabled, and their commands MUST reuse existing compatible leaves. Status descriptors MAY attach a click menu through the same projected item.                                                                                                                                                                                                                    |
| LN-PLUG-015 | History-enabled navigation into a plugin-owned file view MUST preserve the initiating leaf state before constructing the target view. Back MUST NOT restore an empty plugin view or retain the previous file-view root.                                                                                                                                                                                                                        |
| LN-PLUG-016 | Every first-party `Plugin.registerView` and `Plugin.registerSidebarView` registration MUST declare `ViewAccess` metadata as exactly one of `command`, `file`, `internal`, or `alias`; omitted metadata remains supported only for third-party compatibility.                                                                                                                                                                                   |
| LN-PLUG-017 | A `ViewAccess.command` registration MUST contribute one concise `Open …` command through its owning plugin, while `file`, `internal`, and `alias` registrations MUST NOT add a duplicate palette opener.                                                                                                                                                                                                                                       |
| LN-PLUG-018 | Non-file views MAY contribute header breadcrumbs through `View.getBreadcrumbs()` and `View.getBreadcrumbFilePath()`. `getChrome` MUST prepend those crumbs, append parent-path segments of the returned path, and keep `titleEditable` only for FileView.                                                                                                                                                                                      |
| LN-PLUG-019 | `Plugin.registerAgentTool` MUST register a transport-neutral tool under the owning plugin ID, reject invalid or duplicate active names, and dispose it with the plugin lifecycle. Community renderer registration MUST remain inert for agents until the user enables that tool in AI settings.                                                                                                                                                |
| LN-PLUG-020 | F-Mode MUST register on the API-owned Design Core controller, default disabled, and remain user-enableable. It MUST NOT enter `registerCorePlugins` or `.obsidian/core-plugins.json`. AppShell enablement persistence MUST resolve the App vault when load and save run.                                                                                                                                                                       |
| LN-PLUG-021 | `loadPlugins({ onProgress })` MUST call `onProgress` immediately before each `enablePlugin` with `id`, `name`, `index`, and `total` for the current activation order.                                                                                                                                                                                                                                                                          |
| LN-PLUG-022 | `Plugin.registerAgentSkillRoot` and `registerAgentSkillDirectory` MUST register file-backed skill sources under the owning plugin, keep paths inside the extension root, and dispose them on unload. Optional `registerAgentSkill` MUST share the same descriptor model. Unloaded sources MUST NOT enter later snapshots.                                                                                                                      |
| LN-PLUG-023 | `Plugin.registerAgentSlashCommand` MUST register a composer slash command under the owning plugin and dispose it on unload. It MUST NOT add a workspace palette command. Dispatch kinds MAY be host, tool, skill, or prompt.                                                                                                                                                                                                                   |
| LN-PLUG-024 | `Plugin.registerAgentResultView` MUST register a transcript result view under the owning plugin and dispose it on unload. The view MUST name exactly one of `tool` or `command`. It MUST NOT add a workspace palette command. Duplicate active keys MUST be rejected.                                                                                                                                                                          |
| LN-PLUG-025 | `Plugin.registerIndexProjection` MUST register a namespaced projection with field schema and a `project` function, MUST NOT write YAML, and MUST dispose with the plugin.                                                                                                                                                                                                                                                                      |
| LN-PLUG-026 | `registerIndexProjection` MUST return a handle with `query`, `get`, and `queryRelated`. Registration MUST backfill from the core file index in bounded batches.                                                                                                                                                                                                                                                                                |
| LN-PLUG-027 | `App` MUST expose an API-owned daily-document provider registry, resolution MUST fail closed when no provider or equal-priority providers exist, and provider registration MUST be disposable without granting plugins ownership of host folder, filename, or front-matter policy.                                                                                                                                                             |
| LN-PLUG-028 | Plugin and host-owned view registrations MUST remain attached to live `WorkspaceLeaf` instances when a pane-menu split duplicates their view. Split panes MUST NOT create a design-only tab, wrong-direction pane, or unprojected API leaf that bypasses the plugin view lifecycle.                                                                                                                                                            |
| LN-PLUG-029 | A Lapis plugin manifest MAY declare database metadata access. Community and official code plugins without that declaration MUST acquire a synchronous metadata compatibility lease before enable and release it after unload.                                                                                                                                                                                                                  |
| LN-PLUG-030 | Search plugin load MUST register its providers and change listeners before scheduling one startup reconciliation after `MetadataCache.load()` resolves. Provider registrations during configured plugin loading MUST be absorbed into that reconciliation, and layout readiness MUST NOT schedule a competing reconciliation. Plugin unload MUST drain owned incremental checkpoint work before disposal.                                      |
| LN-PLUG-031 | First-party plugin and cache instrumentation MUST depend only on the App telemetry contract and remain safe under `NoopTelemetryService`. Search provider failures MAY increment a bounded failure count, but plugin IDs, provider payloads, settings, document paths, content, and error messages MUST NOT become telemetry attributes or structured logs.                                                                                    |
| LN-PLUG-032 | First-party plugins that need only selected indexed metadata domains or Search membership MUST use the API projection and path-only query contracts. They MUST NOT enumerate complete Search documents or issue per-file metadata lookups to reconstruct an indexed page.                                                                                                                                                                      |
| LN-PLUG-033 | A plugin that exposes multiple views over one generated global projection MUST own single-flight construction above the view lifetime. View closure MUST release subscriptions without discarding a valid plugin-owned snapshot, while plugin unload MUST cancel in-flight work and flush pending plugin data.                                                                                                                                 |
| LN-PLUG-034 | Canvas plugin views MAY retain package-owned simulation, camera, culling, pointer-intent timers, and emphasis state when presentation-only. Configured activation and release delays MUST separate immediate labels from emphasis, while paint remains elapsed-time normalized and respects reduced motion. Such state MUST preserve keyboard and pointer navigation and MUST NOT become domain-data or workspace authority.                   |
| LN-PLUG-035 | A plugin MAY use API-owned structured-query syntax and AppDatabase path-only Search to evaluate its own ordered presentation rules. It MUST keep value discovery, rule persistence, precedence, and diagnostics plugin-owned, react to Search-domain revisions, and MUST NOT import another plugin's manager, panel, settings, or autocomplete catalog.                                                                                        |
| LN-PLUG-036 | A plugin-owned presentation-settings migration MUST be versioned, idempotent, and limited to fields whose semantics changed. It MAY remove superseded rule labels or activation flags when the canonical rule shape becomes always-active, but MUST preserve ids, queries, colours, order, and unrelated settings and MUST NOT read another application's configuration as a migration source.                                                 |
| LN-PLUG-037 | A first-party plugin that exposes a retryable generated view MUST publish current build failures through an owner-scoped diagnostic collection when the failure requires user visibility. Resource-specific failures use an opaque resource; workspace failures use `null`. Recovery and plugin disposal MUST clear those diagnostics without opening Problems.                                                                                |
| LN-PLUG-038 | AI agent changes MUST remain plugin-owned conversation operations. The plugin MUST persist portable switch/configuration evidence only after the receiving session accepts its first prompt, MUST resume prior bindings by verified transcript cursor when possible, and MUST fall back to a replacement binding with bounded typed transcript projection when native resume or configuration is unavailable. Runtime adapters MUST remain provider-neutral above their transport boundary. |
| LN-PLUG-039 | Applications MUST compose statically shipped plugins through a readonly `PluginProfile` and `PluginManager.registerStaticPlugins(profile)`. `StaticPluginRegistration` MUST retain the existing required, default-enablement, distribution, and lifecycle-owned styles fields. Deprecated `CorePluginRegistration` and `registerCorePlugins()` aliases MUST preserve source compatibility without creating a second lifecycle. |
| LN-PLUG-040 | Lapis Notes MUST register app-owned custom settings pages named `Plugin registry`, `Core plugins`, and `Community plugins`. Their information architecture, labels, DOM and action order, state transitions, empty/loading/error states, and responsive behavior MUST match the legacy plugin-management family; styling MAY translate only to public `--ui-*` tokens and semantic `data-ui-*` hooks. |
| LN-PLUG-041 | `Plugin registry` MUST preserve Installed, Browse, Updates, and Sources tabs; registry refresh and search; plugin cards; a details dialog with result sidebar, metadata, injected README rendering, and install action; plus a manual `.lapis-plugin` picker with validation and progress. |
| LN-PLUG-042 | Installed plugin rows MUST show provenance, version, size, enabled, revoked, and restart-required state and preserve update, disable, and uninstall-confirmation actions. A statically included profile plugin MUST appear already installed in Browse and MUST have its Install action disabled without requiring a vault install record. |
| LN-PLUG-043 | Both hosts MUST load configured installed plugins after static profile registration so registry and manual installs survive restart. Desktop Safe Mode, Workspace Trust, archive signature and hash verification, revocation handling, and duplicate-ID protection MUST remain enforced. |
| LN-PLUG-044 | Workspace README presentation MUST be injected through the App renderer contract. `@lapis-notes/workspace` MUST NOT depend directly on `@lapis-notes/markdown` or any extracted plugin implementation. |
| LN-PLUG-045 | Design Core custom settings-page search MUST accept page-owned dynamic entries and a reveal callback. Selecting a plugin search result MUST open the owning custom page and expand or reveal the matching row without Design Core importing application plugin state. |
| LN-PLUG-046 | Lapis Notes Storybook MUST cover every plugin-management tab plus empty, installed, manual, update, revoked, failure, progress, details, README, trust, toggle, and confirmation states with interaction and accessibility checks. Fixed-viewport legacy/current review MUST remain visual-pending until explicit parity approval. Visual comparison and missing baselines MUST NOT gate deployment, publication, or registry cutover. |
| LN-PLUG-047 | Community plugins settings MUST render Workspace Trust as one compact state-aware card. Trusted state MUST show a shield/check icon, `Workspace trusted`, a `Trusted` badge, concise enabled-capabilities copy, and only a `Revoke` action. Untrusted state MUST use warning treatment with a shield/warning icon, `Workspace not trusted`, a `Not trusted` badge, disabled-capabilities copy, and only a prominent `Trust workspace` action. Actions MUST retain the existing trust-service behavior. |
| LN-PLUG-048 | When no community plugins or diagnostics exist, Community plugins settings MUST show a centred empty state with a puzzle illustration, `No community plugins found`, the legacy guidance copy, and one prominent `Browse plugins` action that opens the registry Browse tab. |
| LN-PLUG-049 | The Community plugins `Installed Plugins` header MUST retain its explanatory copy and expose one compact outlined `Reload plugins` action with a refresh icon. Activating it MUST retain the existing application reload behavior. |
| LN-PLUG-050 | An empty Plugin registry Installed tab MUST use the shared centred empty-state treatment with a package illustration, `No plugins installed`, the existing installed-plugin copy, and one `Browse plugins` action that selects the Browse tab. |
| LN-PLUG-051 | An empty Plugin registry Updates tab MUST use the shared centred empty-state treatment with a success illustration, `You’re up to date`, the existing no-updates copy, and one `Check for updates` action that retains registry refresh behavior. |
| LN-PLUG-052 | Plugin registry tabs MUST divide the available tab-list width equally, retain uppercase labels and the shared bottom divider, and mark only the selected tab with the Lapis accent underline. Tab selection semantics and keyboard behavior MUST remain Design Core-owned. |
| LN-PLUG-053 | Signed registry V1 metadata MUST parse optional typed status, author URL, latest release summary, owner URL, license, normalized links, highlights, contributions, and Overview or Changelog references while retaining legacy README aliases. Old entries and unknown future fields MUST remain valid. |
| LN-PLUG-054 | `fetchVerifiedPluginMarkdown` MUST fetch bounded UTF-8 Markdown, verify its declared byte size and SHA-256 before returning it, cache only by immutable reference identity, and report existing metadata or integrity error codes. It MUST NOT add a required distribution-manager method. |
| LN-PLUG-055 | Installed, Browse, Updates, and Sources MUST use one compact responsive registry-row system with tab-specific Design Core search that expands to reveal supported filters and sorting, plus active-filter count, matching-result count, and Reset. Actions and status reasons MUST stay inside their owning row without adding ratings, source editing, or Update All. |
| LN-PLUG-056 | Registry details MUST expose signed Overview, Changelog, and Versions. The header MUST span both columns, summary fields MUST wrap equally before links, and the tab underline MUST align with the divider. Results and tab bodies MUST use Design Core Scroll Areas, while selection MUST use a two-pixel accent ring and platform badges MUST include icons. Overview MUST show highlights, compatibility, and verified Markdown while keeping metadata, Retry, source, and diagnostics usable on failure; narrow layouts MUST use a Back-to-results drill-in. |
| LN-PLUG-057 | Plugin registry presentation MUST distinguish initial load, background refresh, empty registry, filtered no-results, no updates, source problems, and registry failure. Refresh, filters, selection, list scroll, manual-install progress, update, enablement, uninstall, trust, restart, revocation, and confirmation behavior MUST retain existing App-owned handlers. |
| LN-PLUG-058 | Registry rows, provenance badges, expandable search, tabs, details, and content states MUST use public Design Core controls and `--ui-*` tokens with visible focus, keyboard activation, ARIA tab semantics, accessible icons, reduced motion, and light/dark contrast. Official and Community provenance MUST remain visually distinct without relying on colour alone. Changed stories MUST remain `visual-pending`; visual comparison MUST stay non-blocking. |
| LN-PLUG-059 | Registry tab search MUST retain the Design Core Ledger Search composition: the search pill and clear action, expandable filters, and searchable `FilterCommandPicker` controls backed by Command View styling. Search and filter controls MUST share the available row when space permits and wrap to separate rows when constrained. |
| LN-PLUG-060 | The registry detail result rail MUST use the Design Core Resizable split at wide widths with an accessible keyboard-operable separator, the prior 16rem-equivalent default proportion, and no visible thumb. Hover, focus, and dragging MUST widen the separator paint slightly and use the primary accent. Narrow detail layouts MUST hide the split separator and preserve the existing Back-to-results drill-in. |
| LN-PLUG-061 | A verified structured Changelog MUST render a bounded preview with a `View full changelog` action when its Markdown exceeds the compact treatment. Expanding or collapsing the preview MUST NOT require a new registry schema field or bypass content integrity verification. |
| LN-PLUG-062 | The selected detail result MUST use one search-control accent ring and tint without a selected border. The detail close action MUST retain Settings-aligned muted paint, hover fill, and visible focus treatment while using compact icon geometry aligned to the dialog corner. |
| LN-PLUG-063 | Browse, Installed, and Updates MUST share one registry-row geometry. The title and each chip MUST participate individually in one vertically centred wrapping identity flow and stay beside each other when space permits. The relevant version MUST remain pinned top-right while description and metadata retain consistent positions. Neutral and platform chips MUST remain visible, and enablement MUST NOT be duplicated when an installed row exposes a switch. |
| LN-PLUG-064 | Installed and Updates row update actions MUST use an icon-only Design Core button with a Shadcn tooltip and an action-specific accessible name. Installed row enablement MUST use the Design Core switch with matching hover/focus tooltip copy while invoking the existing App plugin enable/disable lifecycle and preserving busy/disabled behavior. |
| LN-PLUG-065 | Uninstall confirmation MUST use a compact, viewport-bounded destructive Alert Dialog that identifies the target with the same plugin row presentation, resolved name, version, provenance, description, and available status metadata. Cancel and destructive confirmation MUST preserve the existing uninstall lifecycle and clear the selected target when dismissed. Both actions MUST have explicit token-backed default, hover, visible-focus, disabled, and reduced-motion treatments. |
| LN-PLUG-066 | An installed-plugin enablement switch MUST expose the next lifecycle action through its accessible name and tooltip: enabled plugins say `Disable`, while disabled plugins say `Enable`. The wording MUST follow state changes while retaining the existing App lifecycle and busy-state behavior. |
| LN-PLUG-067 | Browse and plugin details MUST offer Uninstall for vault-installed plugins and open the shared confirmation dialog. Static profile plugins MUST instead show a non-removable `Bundled` state, while unavailable entries retain Install. |
| LN-PLUG-068 | The uninstall dialog MUST offer a `Disable instead` switch for enabled plugins. Selecting it MUST change the confirmed action to the existing disable lifecycle, retain installed files, avoid uninstall, and reset the choice whenever the dialog closes or targets another plugin. |
| LN-PLUG-069 | The API MUST validate the registry's optional download-statistics summary, accept only approximate redirect-request metrics no more than five UTC days behind, and hide missing, malformed, future, or stale data without failing catalog refresh. The distribution-manager accessor MUST remain optional for structural compatibility. |
| LN-PLUG-070 | Registry Browse, Installed, Updates, detail results, and detail summary MUST show available approximate 30-day plugin downloads. Details MUST also show lifetime downloads, the tracking start date, and that counts are approximate redirect requests. Missing statistics MUST omit these fields without placeholders. |
| LN-PLUG-071 | Browse MUST offer `Most downloaded` sorting through the existing Design Core sort picker. It MUST order by descending approximate 30-day requests, treat missing counts as zero, and resolve ties by plugin name while retaining Name and Recently updated sorting. |

Load and enable failures publish workspace-wide Problems rows and clear after
a later successful enable (LN-WS-078). Spell Check setup failure uses the
language-service path and MUST NOT fail enablement (LN-SPL-008, LN-WS-077).
Explorer native copy, open, and reveal extras stay on the File Explorer
`buildItemMenu` hook. They do not add plugin commands or a `file-menu`
dispatch until a listener exists. Show hidden files uses a File Explorer
setting, toolbar preference, and palette toggle command.
AI contributes an Open Chat left-ribbon action through `addRibbonIcon`, so it
appears only while the plugin is enabled and reuses the existing chat command.
The same plugin registers a file-only `ai-jsonl` view as the default `.jsonl`
association. It previews portable transcripts with the established chat
projection, agent bindings as readable events, and unknown JSONL as structured
line records. This association adds no palette opener and remains read-only so
the view cannot become append-only conversation authority.
When AI is installed, Web exposes the same plugin-owned ribbon action. Host
Settings own the agent-server URL and token; the plugin owns the start-server
unavailable copy when a live runtime is selected without a connected host.
A vault without workspace.json seeds File Explorer, Search, then Bookmarks on the left and
Outline, File Properties, then Tags on the right when those plugins loaded.
When Graph is installed and enabled, it contributes no default leaf; persisted
global and local Graph leaves follow the normal missing-view disable and
re-enable lifecycle.
Its Design Core controls preserve the legacy disclosure-header presentation in
a viewport-clamped 300px panel. Compact Group handles use a balanced gutter
without mouse-hover outlines, while divider-free idle rows retain neutral paint.
Visible remove actions occupy the panel's right padding with an internal trailing
gutter and gain a muted hover fill. A public sortable-row token applies rounded
focus paint across every Group control while retaining an outer trailing gap.
Scoped Graph tokens keep idle geometry neutral, while renderer zoom
allows the complete settled graph to fit the viewport and pointer or keyboard
emphasis introduces accent paint without changing domain state.
The Bookmarks panel snapshots persisted items so add and remove refresh the tree,
insets rows with the public Explorer content-padding token, uses Explorer
toolbar hover tokens, and follows Explorer tree indent, chevron-centered
guides, and leaf rows that omit the disclosure column.
Save and Load workspace layout commands store named snapshots; Reset reapplies
that default seed. Collapse, remount, and file-open restore keep the same
plugin leaf by serialized id and its live `getState()`.
The workspace host also projects Lapis notification progress into Design Core
so plugin and determinate metadata background work reuse the notifications
status item.
| LN-CV-010 | Runtime plugin `roles` MUST remain an independently versioned `first-party-external` package that desktop and web can install through the verified registry contract. It MUST NOT enter the default static profile. Package changes MUST preserve its runtime view, command, file, and plugin-data identities. |
| LN-ROLE-016 | Desktop and web MUST restore persisted `role`, `roles`, and `cv` leaves when Roles is enabled without forcing Roles into a default layout. Disabled leaves MUST remain persisted missing-view placeholders and recover after re-enable. |

Workspace palette providers may define their own query-empty result policy.
File Explorer's Files provider exposes a bounded recent-file or lexical-path
starter set until the user types, while
AI-owned conversation rows reach the palette only through an Agents provider.
Its empty-query recents come from portable conversation files so one derived
index query cannot delay the All palette's commands and Files rows.
Its generated full-text projection coalesces source events by conversation and
does not use an application-wide Search rebuild as a write hook (LN-AI-176).
Desktop AI may reconcile a retained native terminal event after event-stream
interruption, but it never resends the prompt or moves transcript authority
into the host (LN-AI-177).
Plugin settings adapters must also treat normalized no-op updates as read-only
so startup materialization does not invalidate generated-state checkpoints.

Skill roots and composer slash commands follow the same disposable
plugin lifecycle as application tools. They stay off the workspace
command palette and off Mira editor slash registration. AI conversations
reach the palette only through an Agents provider, not `addCommand`
per chat. AI discovers
folder, vault, and user-global command Markdown separately from plugin
registrations. Disposing a slash-command registration removes it from
later composer resolution; reserved application names such as `/help`,
`/scope`, `/context`, `/status`, and `/agent` remain app-owned. Their local
notices stay start-aligned with authored line breaks. The slash menu lists
those catalog commands, ranks Fuse name matches before description hits,
and submits argument-free picks immediately. `/skills` and `/context`
hydrate a missing binding snapshot from current discovery. Search owns composer
`/search` and disposes it on unload. The chat shows that invoke as a
`ToolCalls` transcript item.
Application tool registration follows existing plugin contribution lifecycle:
the helper supplies immutable runtime owner metadata, the App registry rejects
conflicting names, and unload disposes the exact registration.
Invocation resolves that exact registration both before and after a pending
approval, so unloading or replacing a plugin while the card is open cannot
grant or invoke a stale callback.
Developer diagnostics may register the bundled factories directly against a
volatile registry, but production plugins continue to own registration and
automatic disposal through `Plugin.registerAgentTool`.
Search continues to own `notes_search` through that same registration path so
live ACP sessions receive it in the application-tool snapshot.
This callback registry is separate from AI's external
`McpServerContribution` registry; plugins cannot claim the reserved
`lapis-tools` MCP server name through that process-backed integration surface.
Protocol-v3 hosts may carry that reserved bridge through their advertised
authenticated stdio or Streamable HTTP MCP transport; plugins do not select the
transport.
AI snapshots the exact active registration IDs for a new binding, and later
plugin unload or replacement makes those snapshotted callbacks unavailable
instead of transferring authority to a newly registered callback.
Bundled domain plugins register their tools through that same lifecycle helper
and capture their own services rather than receiving execution services in the
host-created invocation context.
Markdown registers `notes_list` during plugin load. AI registers the API
Vault-backed `read`, `write`, `edit`, and `apply_patch` tools during its own
load, so ordinary plugin unload disposes them before any stale binding can
invoke their captured Vault.
Those advertised descriptions steer agents to the vault tools instead of
host-cwd shell commands (LN-AI-108).

## Distribution and provenance

`distribution` describes where source is owned and released. `provenance`
describes trust. A linked first-party package therefore uses core persistence
with official provenance; an official vault-installed bundle remains on the
installed-plugin path. Those states are not interchangeable.

## Persistence and recovery

The core configuration continues to accept the legacy array and the object
form. Missing-view placeholders retain the original view type and serialized
state so restart and later enablement use the existing workspace recovery path.
Required host-owned views such as Problems keep their host view type,
including during layout restore before plugin start, and remount leftover
ghost placeholders after the required plugin starts.
Plugin configuration and data remain keyed by runtime plugin ID.
Bundled plugins that own user-facing configuration register Design Core
settings sections under `core-plugins` in addition to any legacy
`PluginSettingTab` compatibility surface. Markdown Lint seeds
`markdown-lint.disabledRules` with MD013 and include/exclude globs for open
documents, using the same configuration keys as its manifest schema. Markdown
Lint owns the sole renderer provider in browser and desktop hosts; its native
adapter forwards those live vault rules instead of accepting a host-default
provider alongside it.
Spell Check seeds dialect, Harper rules, dictionaries, file-type filters, and
lint options under `spellcheck.*` keys. Its Problems actions persist
`userDictionary` and `ignoreWords` with cspell-style titles (LN-SPL-010).
Its diagnostics complete empty while Harper is still warming and publish
matching results after setup. Its status item refreshes from those keys and MUST
NOT upsert on `layout-change`. Markdownlint vault disable appends
`disabledRules` (LN-MDL-005).
Plugin instances retain their constructor-supplied App. Managed disable and
restore therefore operate on the owning workspace even while a compatibility
lease exposes a different App for an older consumer.
For the one-release metadata transition, a community or official code plugin
defaults to a full synchronous snapshot lease. Declaring
`lapis.database.metadataAccess: "queries"` opts into the normalized async
contract and skips materialization. Lease acquisition happens before `onload`,
and the Component rollback/unload path releases it exactly once. Bundled core
and system plugins are query-native by policy and never receive an implicit
lease.
`App` registers host-neutral `app:rebuild-vault-cache` and
`app:rebuild-generated-state` so Search can refresh after a later metadata
rebuild without an API import of Search internals (LN-PKG-097, LN-PKG-098).
Browser vault transfer failures report through the owning session App's
notification manager; first-party hosts do not route those commands through the
compatibility `Notice` constructor. AI user-global command storage is likewise
host-owned and enters renderer code only through a runtime-only capability
boundary, not a static Node module import.
Markdown reuses one `MiraFileAdapter` for that same App so preview effects do
not churn when views reconfigure. Its full-file surface establishes the
effective Mira `obsidian` theme so domain contributions inherit Lapis semantic
paint instead of Mira's portable fallback. Its Reading mode makes the inherited
Design Core Scroll Area the sole preview scroll owner while Mira's inner
preview remains non-scrolling. The floating outline stays centered in that
visible Scroll Area and reserves body clearance for its collapsed rail.
Packaged metadata parse uses a standard module-worker URL pointed at the
emitted JavaScript file. Web and desktop retain host-owned dependency interop
for the remaining registry package graph.
`openFile` triggers `file-open` after `onLoadFile` so file-scoped Markdown
panels can follow the restored note without waiting for a layout write.
Restoring a command panel still loads that view when its snapshot includes a
follow `file` path.
The shared helper writes only when that followed path changes.
Linked Backlinks and Outgoing Links then read `getCache` and inbound
`resolvedLinks` for that note even if `getAllItems()` is still empty.
The Storybook command-panel registry maps each `ViewAccess.command` identifier
back to its source declaration and canonical panel story. This is verification
metadata only and does not become a runtime plugin registration surface.
Command-backed openers reuse an exact compatible leaf when one exists. A
conversation opener may claim an unbound main-area AI leaf before creating a
new tab, and it never replaces the dedicated history leaf. That history leaf
keeps Design Core SearchFilterBar chrome centered in the panel. The Catalog
opener reveals or creates the documented left-sidebar leaf.
Code plugins that omit query-native metadata access receive a snapshot lease
for their enabled lifetime. Query-native first-party plugins declare the
database contract and remain on bounded per-file, facet, page, and link APIs.
Storybook's first-party real-App fixtures follow the query-native path and MUST
NOT acquire a compatibility lease merely to seed or assert persisted metadata.
Search completion remains plugin-owned presentation over API-owned grammar:
facet labels expose their original tag values, while their separate apply text
uses the API formatter so slash and quoted space tags are executable queries
rather than display-only suggestions.
