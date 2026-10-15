# Architecture / Context — Part 2

@lapismd/design-core (npm; UI primitives + workspace layout engine)
@lapismd/mira (+ mira-editor / mira plugins; npm packages)
@lapismd/storybook-addon-visual-delta (npm; root-only Storybook tooling)

```

The private Deno kernel package is source-exported within this workspace. Its
filesystem, watch, resource, plugin-asset, language, and native database-worker
modules have no desktop-window, authentication, HTTP-router, or Web-composition
dependencies; each host supplies those policies through wrappers.

Server-neutral runtime and transport types remain in API subpath exports.
Desktop and server implementations consume the same remote AppDatabase
catalogue, while tRPC and Deno server implementation types remain outside the
public API barrel and browser graph.

- The server's hybrid boundary mounts the generated JSON control plane at `/api/trpc` and keeps file and resource bytes on authenticated Fetch routes.

- Both paths share request-session, membership, mutation-security, managed-root, and error-code policy; only transport-specific body handling differs.

- Bounded ZIP transfer and verified hash-addressed plugin assets stay on the direct Fetch side and never serialize the derived per-vault database.

- The browser composes explicit vault and database adapters over that boundary; it does not emulate or publish a desktop-native capability bridge.

- The compile-time server Web profile reuses the application workspace shell but excludes local-vault, offline, AI-host, terminal-host, and PWA boot policy.

- It marks the document runtime as `deno-server` before mounting so host-specific code never has to infer the online profile from missing desktop or PWA state.

- Its pre-workspace login and managed-vault launcher remain Web-owned presentation: they compose Design Core with the Lapis theme, while server-owned authentication, membership, archive validation, and managed storage remain behind Fetch and tRPC.

- Container execution preserves the same boundary with non-root ownership and scoped Deno permissions; native database FFI is limited to the dependency cache, while only the managed data root is writable.

- API diagnostic hover cards keep unique action keys when titles repeat and expose one Quick Fix menu for cached actions.

- The language-service cache keeps at most one action per title for the originating diagnostic.

- Markdownlint publishes per-issue Fix this actions plus Fix all when a rule repeats, and Spell Check uses cspell-style titles.

- Problems rows use the Design Core severity-slot lightbulb for those cached actions.

- Diagnostics and code actions merge every matching provider; priority orders them and does not hide a lower-priority match (LN-WS-076).

- Provider throw or timeout and Lapis plugin load or enable failures publish workspace-wide Problems rows (LN-WS-077, LN-WS-078).

- Web hosts serve Harper WASM as `application/wasm` so WorkerLinter setup can finish (LN-WEB-030, LN-SPL-009).

- Markdownlint messages use the vscode rule-path form, and the API bridge publishes each rule code with its documentation URL.

- Hover-card positioning reads editor layout only in the CodeMirror measure cycle so document, viewport, and geometry updates cannot crash the lint plugin.

- Lint hover cards open only from the underlined diagnostic range or gutter marker, not from a same-line document-position hit.

- The external Roles repository owns its domain specification and plugin-only catalog.

- Lapis consumes its built public exports and owns real-App integration with File Explorer, Search, managed settings, and persisted layout recovery.

- Bases remains Lapis-owned: its explicit App input supplies vault, database, metadata, navigation, and registry contracts while the package owns document normalization, query evaluation, rendering, editing, and resource cleanup.

- Its focused catalog boots the public plugin boundary and keeps editor labels, table-control names, wrapped multivalue row geometry, and accessible accent paint in the owning package.

- The outer table cell alone owns its inset active boundary so nested Design Core editors cannot duplicate or clip focused geometry.

- Design Core autocomplete owns outside-focus dismissal without trigger-focus restoration; Bases owns top-aligned table-cell composition around that control.

- Bases resolves delegated editor activation from the semantic cell root for both cell-chrome and nested-value clicks while preserving genuine nested buttons.

- The table fills the remaining Bases surface, composes Design Core's public shadcn Scroll Area, and binds both virtualizers to its exposed viewport; Bases owns only table-specific scrollbar tokens and full-height bottom-edge placement around that shared primitive.

- Filter controls consume Design Core's public Popover width token and Accordion indicator position while Bases owns the legacy 45svw geometry, opaque panel surface, and on-accent indicator paint.

- Deno desktop, web, and the root real-App catalog consume its package exports and share the Search, Bases, external-Roles boot order without a consumer copy.

- Overlapping shadcn and forms controls used by `@lapis-notes/api` import from `@lapismd/design-core`.

- `@lapis-notes/ui` retains only Lapis compounds (`modal`, `confirm-dialog`, `search`, `sidebar-custom`, `table-dnd`) that compose design-core primitives with colocated CSS and `--ui-*` tokens.

- Brand tokens live in design-core `themes/lapis.css`; ui `theme.css` is alias-only.

- Storybook loads design-core's shared catalog stylesheet + Lapis theme + ui aliases, and uses the shared layout synchronizer for full-viewport Workspace stories.

- The public workspace package renders the api-owned design-core controller; it does not own a second layout model or persistence adapter.

- External plugin catalogs consume its versioned export rather than reconstructing that shell or linking to workspace source.

- The api compatibility projection includes the design-core V3 bottom-panel tabs, groups, open state, active leaf, and height, including saves to the currently loaded alternate workspace filename.

- Problems is always a host-owned view type, including during `loadLayout` before plugin start, so a persisted leaf or leftover empty missing-view placeholder remounts as `workspace:problems` instead of a ghost surface.

- Hydration does not seed a quiet bottom tab.

- Claimed leaves keep their serialized id and live `getState()` across collapse, remount, and controller projection.

- Default file navigation reuses an empty or file-backed main leaf instead of replacing a non-file view.

- Restoring a non-file leaf still loads that view when its snapshot includes a follow `file` path.

- Missing-view placeholders use the Lucide ghost icon; ordinary empty New Tabs keep the file empty icon.

- Settings displayed by the shell remain controller-owned while persisting through api configuration; the workspace shell does not initiate configuration or plugin loading.

- A missing workspace file seeds File Explorer, Search, then Bookmarks on the left and Outline, File Properties, and Tags on the right when those views are registered.

- Named Save and Load layout commands persist snapshots in `.lapis/workspaces.json`, and Reset reapplies that default seed.

- `@lapis-notes/api/workspace-host` is the explicit integration seam: root api exports retain their compatibility shape while workspace hosts can obtain the controller without reaching into api internals.

- Every workspace package exposes the common `build`, `check`, and `test` contract, so the shell participates in the same Turbo verification graph as the kernel and retained UI surface.

- The desktop renderer bundles its workspace consumers, while the Deno host retains native lifecycle and service dependencies.

- Native commands cross an explicit binding allowlist.

- Renderer shutdown is acknowledged before window destruction so the API-owned session can persist and dispose without moving ownership into native code or workspace.

- Before shared UI mounts, the renderer projects the native host's selected webview or CEF backend into the document engine marker so compatibility behavior does not depend on Laufey's user-agent shape.

- Deno desktop composes a host-supplied native Turso provider through an allowlisted AppDatabase bridge, while web composes the API-owned WASM provider in the renderer behind the same session boundary.

- Web WASM database imports use the driver's host-bundler entry so Vite serves worker and WASM assets without pulling the prebuilt worker-inline module through Rollup.

- The Deno host also supplies native window-control geometry as a public Design Core workspace token.

- Design Core decides which leading main-pane header uses that input when the left sidebar is closed; the host retains ribbon and macOS traffic-light measurements plus the separate open-sidebar tab-bar inset.

- The macOS host also lowers the three native standard window buttons through a platform-isolated adapter so they share the open left-sidebar header's centreline; renderer controls and shared Design Core geometry remain untouched.

- Its application menu owns a single reusable native About window, whose dedicated renderer composes Design Core's public About surface without creating a vault, plugin runtime, or second application session.

- The host completely closes that secondary native window for renderer and native dismissals before a later menu action creates a fresh instance.

- The pnpm development launcher passes the tracked visible-background Lapis icon to Deno while production retains signed bundle metadata.

- The desktop package owns deterministic light and dark rounded-tile variants.

- On macOS, the main renderer forwards only the operating-system colour-scheme state through a private binding and the native host updates AppKit's application icon when that state changes; no vault, plugin, or application setting owns Dock identity.

- Before the renderer mounts, its boot document presents the Lapis mark and application-specific loading copy.

- During macOS development, the launcher derives a package-local WebView or CEF host from the pinned Deno toolchain, applies the same bundle name and identifier used by packaged output, and asks Deno to launch that ignored host.

- The shared Laufey cache remains immutable.

- The web consumer owns its launcher and PWA lifecycle.

- It opens Turso WASM over OPFS in exactly one Web Locks owner per vault; other tabs retain the generic database contract through bounded BroadcastChannel RPC and may promote when the owner disappears.

- Neither role is cloud synchronization.

- The launcher can copy a picked local folder into a new OPFS vault, and an open OPFS session can import into or export that vault through host Settings and commands (LN-WEB-038, LN-WEB-039, LN-WEB-040, LN-WEB-041, LN-WEB-042, LN-WEB-043).

- The branded vault launcher is a renderer-side desktop consumer: it chooses a native profile, then delegates storage and workspace lifecycle to API sessions.

- While a host resolves a saved current profile, it hosts Design Core `WorkspaceStartup` and MUST NOT paint that chooser.

- Manage Vaults and desktop Open Vault… overlay the chooser over a retained session; Close returns without disposing.

- If saved-vault restore fails, the desktop host retains that profile and presents the native failure instead of silently deleting the recovery route.

- Deno filesystem bindings preserve missing, permission, wrong-type, busy, and existence classifications so a protected folder is not misreported as absent.

- Startup failure details retain the complete stack and local absolute target for copying.

- Recovery choices are session-scoped `AppSafeModeState`: optional core plugins and layout restoration can be disabled before startup, a broken saved layout can be removed explicitly, and a recovered shell shows a Safe Mode banner with generated-index rebuild and normal-restart actions.

- These controls do not add canonical vault settings or unavailable community/notebook policy.

- After that selection, desktop and web session boot render Design Core `WorkspaceStartup` for vault, configuration, plugin, and layout progress instead of a host-owned placeholder.

- The desktop host supplies its package-local Lapis logo in place of the visible loading title while keeping that title as the region's accessible name.

- The plugins task reports the current plugin name.

- Metadata index load starts after layout restoration so database readiness does not contend with `loadLayout`.

- Persisted queries become available before background reconciliation.

- Matching versioned Metadata and Search checkpoints skip full warm scans; stale Metadata reconciliation finishes before the single Search startup reconciliation begins.

- Configured provider registration is folded into that one pass, and unrelated configuration or workspace-file events cannot invalidate the Search checkpoint.

- Load, rebuild, and reconcile stay under status progress handles, report determinate processable-file counts, yield between bounded batches, and parse changed Markdown metadata in a worker.

- `App` registers rebuild-vault-cache and rebuild-generated-state so a later manual rebuild uses the same handle (LN-PKG-097, LN-PKG-098).

- `App` constructs `NotificationManager` before `Workspace` so the host can project that progress.

- Native window-drag regions stay in Design Core chrome CSS; hosts do not re-declare `-webkit-app-region`.

- Desktop, web, and server “View all” palettes keep host-owned Dialog chrome and compose Command View for searchable vault selection.

- A live server workspace stays mounted behind its managed-vault chooser so the named return control can restore that session without reconstructing plugin or workspace state.

- The ready-shell vault menu follows the same boundary: Design Core presents the generic menu, the workspace package forwards its contract, and the desktop consumer supplies profiles plus serialized switch and management callbacks.

- Generated renderer and main outputs are Turbo cache outputs and remain untracked; checked-in build resources are limited to deterministic icon variants, their macOS fallback, and entitlements.

- The production renderer imports Design Core's public stylesheet and Lapis theme plus the Lapis UI alias sheet before mounting either the launcher or workspace.

- Its Vite pipeline compiles the desktop launcher's utility classes; reusable workspace paint remains supplied by the public Design Core stylesheet rather than Storybook-only configuration.

- Native window-control clearance is applied by host CSS against Design Core's semantic shell attributes.

- The development server permits the resolved Design Core package root for imported assets while retaining package-export resolution and the default Lapis workspace boundary.

- The controller configuration adapter lives in api beside the compatibility workspace.

- It reads and atomically writes the flat API configuration store; the workspace package only starts and renders the already-owned controller.

- Editor-view contributions follow the same boundary and are projected from the API registry into the controller registry without moving registration policy into the shell host.

- Compatibility view actions and pane-menu contributions use that same projection, leaving design-core responsible for shared title-bar and menu presentation while plugins retain their control policy.

- Status-bar upserts notify adapters only when visible item fields change (LN-PKG-090), so identical writes cannot loop layout restore (LN-WS-075).

- The adapter keeps compatibility view sections ahead of generic split, move, and close actions.

- The editor demo's Markdown and JSON language packages are root-only Storybook development dependencies.

- The API continues to expose the generic editor extension registry and source view, not a bundled language policy.

- `@lapis-notes/ai` is an authorized bundled plugin.

- It contributes an Open Chat left-ribbon action that reuses the same reveal path as its opening command.

- The desktop native bridge advertises an `agent-runtime` capability for process-backed ACP and Codex sessions while the reserved `model` capability stays unavailable.

- The plugin obtains live runtimes from that host factory and keeps adapters off the root export.

- Cursor uses the same ACP runtime as Codex through the selected agent name.

- Generic orchestration lives in the standalone `lapis-ai-controller` service.

- Deno desktop supervises it; web and Storybook attach to it.

- The shared SDK owns transport and recovery, while `@lapismd/ai-host` supplies provider mechanics.

- User-global agent command storage is a host capability, so renderer bundles must not statically pull the AI plugin's Node-only command-store module into the browser graph.

- The same desktop bridge advertises `terminal-runtime`.

- Deno desktop embeds public `@lapismd/terminal-host/deno` in-process, supplies a verified Sigma native library, and binds each session workspace to the create payload vault path, otherwise `terminal.cwd`, otherwise the home directory.

- Terminal server Settings tell the user to start `lapis-terminal-host serve --workspace` on the vault or a parent of `terminal.cwd`.

- The web host attaches or replaces that WebSocket after configuration load from persisted Settings or env-prefilled URL and token, without overwriting a native desktop bridge.

- The token Settings field stays masked until revealed.

- Chat shows a start-server message when a live runtime is selected and no host is connected.

- Chat sessions persist runtime, provider, model, and thinking context through plugin data.

- Default Codex and Cursor model listing uses the selected agent through an agent-scoped disposable ACP session.

- A native host advertising deferred model discovery returns a request id before delivering that catalog through its runtime event stream, so neither default catalog starts a renderer-owned process.

- The separately exported native Codex adapter retains its process-host catalog for explicit native surfaces only.

- Cleanup falls back to local session closure when the agent does not advertise `session/close`, without discarding a successful catalog.

- The host consumes the maintained ACP adapter supplied by its acpx release and applies optional thinking controls only when the created session advertises them.

- Native Codex and ACP normalize thinking, tool, permission, user-input, and error events before the shared controller renders them.

- Adjacent tool items share one collapsed Design Core `ToolCalls` group, and tool details unwrap envelope payloads into `json`, `bash`, or `plaintext` `CodeBlock` language (LN-AI-133).

- A busy composer Stop control cancels the active turn immediately, without waiting for the runtime cancel to settle, and stays fully opaque while input remains disabled.

- Stop also drops a still-preparing first send so it cannot start after busy clears.

- The first user message stays visible while conversation create and session start finish (LN-AI-106, LN-AI-120).

- Thinking stays expanded only while it streams and collapses when later transcript data arrives (LN-AI-131).

- Stop settles leftover spinners immediately and posts a cancelled system notice after cancel confirms (LN-AI-132).

- The notice reads `Agent turn cancelled`.

- An unreadable open conversation is reported and released so the next send starts a replacement chat (LN-AI-124).

- Runtime Allow always and Deny always decisions persist on conversation metadata (LN-AI-156).

- Permission and question option buttons use Design Core's public `feedback-option` part (LN-AI-157).

- Registered result views render tool detail and `/skills` `/tools` inventories (LN-AI-158, LN-AI-159).

- An unpinned idle chat follows the active-file folder and shows a faded centered scope control.

- Its folder Command View includes Vault root and reveals an explicitly selected scope in Explorer before applying the same zero, one, or many conversation transition.

- Pinning still prevents automatic active-file follow (LN-AI-160, LN-AI-161, LN-AI-162, LN-AI-163, LN-AI-178).

- AI History chrome keeps a visible hover on search actions, a dimmed creation-folder path, and New chat in that Explorer or History-tree folder (LN-AI-165, LN-AI-166, LN-AI-167, LN-AI-168).

- History folder counts share one trailing edge across depths (LN-AI-169).

- Application-tool names and arguments stay visible when ACP only reports a generic `tool call` title (LN-AI-125).

- Assistant MarkdownEmbed content grows with the transcript instead of a nested scroller (LN-AI-122).

- The composer overflow menu sits after History and attach, sizes to its labels so they stay fully visible at the model-menu type size (LN-AI-123), archives or restores in place, deletes through vault trash, and offers New Chat (LN-AI-109).

- AI History opens as an ungrouped right sidebar leaf and keeps that leaf while a conversation opens in the main area.

- Portable conversation bindings and transcript entries are stored beneath the captured vault scope; plugin data remains settings-only.

- Runtime-neutral pending interactions are presented through Design Core's Composer Drawer; provider request objects and secret answers never enter persisted chat data.

- The paperclip attach picker uses that same drawer surface: host Popover chrome stays above the open drawer while Command View owns the searchable file list.

- Attachment chips keep Design Core's public drawer chip and remove parts.

## Tooling policy
```
