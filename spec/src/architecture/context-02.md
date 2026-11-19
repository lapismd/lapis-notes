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
catalogue, while tRPC and Node server implementation types remain outside the
public API barrel and browser graph.

- The server's hybrid boundary mounts the generated JSON control plane at `/api/trpc` and keeps file and resource bytes on authenticated Fetch routes.

- Both paths share request-session, membership, mutation-security, managed-root, and error-code policy; only transport-specific body handling differs.

- Bounded ZIP transfer and verified hash-addressed plugin assets stay on the direct Fetch side and never serialize the derived per-vault database.

- The browser composes explicit vault and database adapters over that boundary; it does not emulate or publish a desktop-native capability bridge.

- The compile-time server Web profile reuses the application workspace shell but excludes local-vault, offline, AI-host, terminal-host, and PWA boot policy.

- It marks the document runtime as `node-server` before mounting so host-specific code never has to infer the online profile from missing desktop or PWA state.

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

- Web and the root real-App catalog consume its package exports and share the Search, Bases, external-Roles boot order without a consumer copy.

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

- Native commands cross an explicit binding allowlist.

- Renderer shutdown is acknowledged before window destruction so the API-owned session can persist and dispose without moving ownership into native code or workspace.

- Web composes the API-owned WASM provider in the renderer behind the shared session boundary; native consumers supply their own provider adapter.

- Web WASM database imports use the driver's host-bundler entry so Vite serves worker and WASM assets without pulling the prebuilt worker-inline module through Rollup.

- The web consumer owns its launcher and PWA lifecycle.

- It opens Turso WASM over OPFS in exactly one Web Locks owner per vault; other tabs retain the generic database contract through bounded BroadcastChannel RPC and may promote when the owner disappears.

- Neither role is cloud synchronization.

- The launcher can copy a picked local folder into a new OPFS vault, and an open OPFS session can import into or export that vault through host Settings and commands (LN-WEB-038, LN-WEB-039, LN-WEB-040, LN-WEB-041, LN-WEB-042, LN-WEB-043).

- Startup failure details retain the complete stack and local absolute target for copying.

- Recovery choices are session-scoped `AppSafeModeState`: optional core plugins and layout restoration can be disabled before startup, a broken saved layout can be removed explicitly, and a recovered shell shows a Safe Mode banner with generated-index rebuild and normal-restart actions.

- These controls do not add canonical vault settings or unavailable community/notebook policy.

- Application session boot renders Design Core `WorkspaceStartup` for vault,
  configuration, plugin, and layout progress instead of a host-owned
  placeholder.

- The plugins task reports the current plugin name.

- Metadata index load starts after layout restoration so database readiness does not contend with `loadLayout`.

- Persisted queries become available before background reconciliation.

- Matching versioned Metadata and Search checkpoints skip full warm scans; stale Metadata reconciliation finishes before the single Search startup reconciliation begins.

- Configured provider registration is folded into that one pass, and unrelated configuration or workspace-file events cannot invalidate the Search checkpoint.

- Load, rebuild, and reconcile stay under status progress handles, report determinate processable-file counts, yield between bounded batches, and parse changed Markdown metadata in a worker.

- `App` registers rebuild-vault-cache and rebuild-generated-state so a later manual rebuild uses the same handle (LN-PKG-097, LN-PKG-098).

- `App` constructs `NotificationManager` before `Workspace` so the host can project that progress.

- Native window-drag regions stay in Design Core chrome CSS; hosts do not re-declare `-webkit-app-region`.

- Application hosts keep host-owned Dialog chrome and compose Command View for
  searchable vault selection.

- A live server workspace stays mounted behind its managed-vault chooser so the named return control can restore that session without reconstructing plugin or workspace state.

- The ready-shell vault menu follows the same boundary: Design Core presents
  the generic menu, the workspace package forwards its contract, and the host
  consumer supplies profiles plus serialized switch and management callbacks.

- The controller configuration adapter lives in api beside the compatibility workspace.

- It reads and atomically writes the flat API configuration store; the workspace package only starts and renders the already-owned controller.

- Editor-view contributions follow the same boundary and are projected from the API registry into the controller registry without moving registration policy into the shell host.

- Compatibility view actions and pane-menu contributions use that same projection, leaving design-core responsible for shared title-bar and menu presentation while plugins retain their control policy.

- Status-bar upserts notify adapters only when visible item fields change (LN-PKG-090), so identical writes cannot loop layout restore (LN-WS-075).

- The adapter keeps compatibility view sections ahead of generic split, move, and close actions.

- The editor demo's Markdown and JSON language packages are root-only Storybook development dependencies.

- The API continues to expose the generic editor extension registry and source view, not a bundled language policy.

- The retired shared `@lapis-notes/ai` package and its Notes catalog are not current application authority. Desktop and App Profile own current native AI presentation; Notes retains generic API file-tools, registries, and data contracts.

- The standalone `lapis-ai-controller` and `@lapismd/ai-host` remain sibling services with their own consumers and specifications; Notes does not attach them through Web or Storybook.

- Current Desktop terminal execution is owned by the Rust application in the
  `lapis-terminal` repository; Notes does not embed or launch a terminal host.

- The web host does not attach a terminal-host WebSocket or expose its retired
  Settings fields.

## Tooling policy
```
