# Packages / Context — Part 2

- `@lapis-notes/markdown` owns Mira-backed Markdown views and intaken Markdown side panels.

- Its packaged metadata worker import stays extensionless so web and desktop Vite resolve `dist/metadata/metadata-worker.js`.

- `@lapis-notes/markdown-lint` and the internal `@lapis-notes/language-service` package are the focused diagnostics exceptions.

- Markdownlint Settings seed MD013/line-length in `disabledRules` so the editor matches vscode-markdownlint rather than the CLI's all-rules-on library default.

- Published diagnostics use that same rule-path message form, and the API language-service bridge attaches each markdownlint rule's documentation URL.

- Markdownlint code actions use vscode-markdownlint titles, including vault `disabledRules` (LN-MDL-005).

- Spell Check Problems actions use cspell-style bare suggestions plus dictionary and ignore-word commands (LN-SPL-010).

- The manager merges diagnostics and code actions from every matching provider so Spell Check appears beside Markdownlint (LN-WS-076).

- A provider that throws or does not complete publishes a workspace-wide Problems row (LN-WS-077).

- Lapis plugin load and enable failures use the same workspace-wide path (LN-WS-078).

- Web development, preview, and production MUST serve `*.wasm` as `application/wasm` so Harper `WorkerLinter` can instantiate (LN-WEB-030).

- An open misspelled web note MUST then show a Harper Problems row (LN-SPL-009).

- API lint hover opens only from `.cm-lintRange` or `.cm-lint-marker`, not from a same-line document-position hit.

- Hover cards expose one Quick Fix control for cached actions instead of listing each title (LN-WS-079).

- `@lapis-notes/history` owns vault file-revision capture, the History panel, the compare tab, and the Design Core History settings section while persisting revisions only through `AppDatabase`.

- `@lapis-notes/bases` owns its parser, query controller, layouts, editors, private TanStack adapter, and native stylesheet.

- It consumes API contracts and public Design Core primitives directly, exports its stylesheet explicitly, and does not reintroduce a dependency on the pruned Lapis UI package.

- The package also owns the accessible names, metadata-key adaptation, ordered column tracks, measured row sizes, and token mappings used by its table, cards, and grouped-list presentation.

- Inline cells compose Design Core's public input and autocomplete forms without exposing those private adapters through the package API.

- Tag and multivalue cells wrap within their tracks while the owning row grows to keep all cell boundaries aligned.

- Checkbox cells retain the full-cell layout wrapper while rendering a centered 1rem control.

- The outer editable cell alone paints its inset focus boundary; inner input and autocomplete wrappers retain only their control surface paint.

- Cell-level focus delegation resolves from the semantic cell root rather than the clicked descendant so cell chrome and visible input text enter edit mode.

- Single-line editors use the compact row content height at the cell start while wrapped tag and multivalue editors expand downward from the same origin.

- The shared `@lapis-notes/ai` package and its Notes catalog are retired. Current native AI is owned by Desktop and App Profile; Notes API file-tools remain active. Historical provider/presentation contracts require a caller-aware ownership audit before their remaining authority is retired.

- It also owns an ungrouped History sidebar leaf, a movable Catalog command leaf, and an Open Chat left-ribbon action that reuses the opening command.

- Its paperclip attach picker keeps host Popover chrome—visible border, shadow, and stacking above an open composer drawer—and composes Command View for the searchable file list.

- The composer overflow menu sits after History and attach, sizes to its labels so they stay fully visible at the model-menu type size (LN-AI-123), archives or restores in place, deletes through vault trash, and offers New Chat (LN-AI-109).

- The first submitted user message stays in the transcript while session start is still pending (LN-AI-120).

- Thinking stays expanded only while it streams and collapses when later transcript data arrives (LN-AI-131).

- Stop settles leftover spinners immediately and posts a cancelled system notice after cancel confirms (LN-AI-132).

- The notice reads `Agent turn cancelled`.

- An unreadable open conversation is reported and released so the next send starts a replacement chat (LN-AI-124).

- Runtime Allow always and Deny always decisions persist on conversation metadata (LN-AI-156).

- Application-tool names and arguments stay visible when ACP only reports a generic `tool call` title (LN-AI-125).

- Assistant MarkdownEmbed content grows with the transcript instead of a nested scroller (LN-AI-122).

- Drawer attachment chips use Design Core's public `attachment-chip` parts instead of plugin-local paint.

- Permission and question option buttons use the public `feedback-option` part (LN-AI-157).

- An unpinned idle chat follows the active-file folder and shows a faded centered scope control.

- Its searchable folder Command View includes Vault root and routes explicit selection through the existing zero, one, or many conversation transition while revealing the same path in Explorer.

- Pinning still prevents automatic active-file follow (LN-AI-160, LN-AI-161, LN-AI-162, LN-AI-163, LN-AI-178).

- AI History chrome keeps a visible hover on search actions, a dimmed creation-folder path, and New chat in that Explorer or History-tree folder (LN-AI-165, LN-AI-166, LN-AI-167, LN-AI-168).

- History folder counts share one trailing edge across depths (LN-AI-169).

- API owns result-view registration; Search owns the `notes_search` view; AI owns lookup and `/skills` `/tools` inventories (LN-PKG-100).

- The root export stays plugin-safe; ACP and native Codex adapters publish only on `./runtimes`.

- Cursor uses the same ACP adapter through a known agent name.

- Domain plugins register tools.

- The package does not declare an acpx dependency.

- Public `@lapismd/ai-host` owns ACP and process transport mechanics.

- The standalone `lapis-ai-controller` owns orchestration and its authenticated service protocol.

- Development Storybook can attach to an explicitly supplied URL and token. Web AI and Terminal remain retired host features under LN-PLUG-113.

- The AI plugin uses the controller SDK for events, recovery and tool callbacks.

- Web no longer exposes runtime connection Settings and removes dedicated obsolete tokens after loading configuration.

- Retained conversations and plugin settings survive the Web retirement; no service attachment is attempted.

- When the selected runtime is not Fake and no host is connected, chat tells the user to start the local server and set URL, port, and token.

- Web and root Storybook consume the package through published npm semver ranges.

- The sibling `@lapis-notes/lapis-plugin-cv-roles` package owns role workflows plus CV YAML file views and browser preview.

- Its compiled Markdown artifact composes Mira's public read-only source and preview surfaces under the Lapis theme.

- The sibling `@lapis-notes/lapis-plugin-tasks` package owns the Tasks plugin, planner view, and Design Core catalog; desktop and web hosts load it only through configured installation and MUST NOT register Tasks views themselves.

- The sibling `@lapis-notes/lapis-plugin-docs` package owns Core Docs notes, books, cards, and FSRS review; desktop and web hosts load it only through configured installation and MUST NOT register Docs views themselves.

- Other extracted plugins and notebook remain out of scope until separately specified.

- Web is authorized by its canonical host chapter; Desktop integration belongs
  to the sibling `lapis-desktop` repository.

- Storybook exercises those registered panel views through the separate `@lapis-notes/workspace` shell adapter; movable-surface fixtures remain consumer verification and do not move workspace rendering ownership into the markdown package.

- Design-core's `WorkspaceViewHost` selects body, sidebar, bottom, and grouped paint and exposes the resolved public view tokens; the shared markdown panel shell consumes those tokens and carries no placement selectors or cached placement state.

- Brand palette and semantic tokens live in design-core `themes/lapis.css`.

- `@lapis-notes/ui/theme.css` is an Obsidian-compatibility alias layer only.

- Storybook theme controls and their manager dependencies remain root-only development tooling rather than package exports or runtime dependencies.

- Specification validation remains root tooling configured by `spec-validator.config.mjs`; reusable validators and their tests belong to `@lapismd/spec-validator`, not a runtime package.

- The root development dependency resolves from npm.

- The QMD CLI and its local native dependencies follow that root-only rule.

- The editor demo's CodeMirror Markdown and JSON language packages follow that same root-only rule; the source view and editor registry remain language-policy neutral package contracts.

- The shared source-editor shell depends on public `@lapismd/mira` for base CodeMirror extensions and Obsidian theme CSS.

- The Markdown plugin composes the public Mira authoring stack with that duplicate base layer disabled, imports the public Mira Editor stylesheet for its optional toolbar, and preserves borderless Lapis editing and Reading surfaces.

- Toolbar controls persist only through API configuration.

- Consumers must not reconstruct the portable Mira feature stack from internal source modules.

- The API manifest declares `dist/enhance.js` and its source counterpart as side effects so a production consumer cannot tree-shake the compatibility DOM initialization required before constructing `App`.

The private web package consumes the public API, current core plugins,
workspace, and Design Core presentation. It owns browser vault selection,
Workbox, window-controls overlay state, and web-session lifecycle; its
production database dependency remains the pinned API-owned Turso WASM provider
rather than a package-local persistence implementation.
Root `dev:web` and `restart:web` start that host after an API build; restart
first frees listeners on Vite port 4174.

- Its launcher imports shadcn presentation from Design Core and profile/search helpers from public Lapis exports.

- Application-host “View all” palettes compose Command View for searchable
  vault selection.

- The server Web host also owns the hidden-and-inert live-session overlay used by its return control.

- It does not add launcher policy to the workspace package or copy a private UI implementation.

- The renderer consumes Design Core's public `styles.css` and Lapis theme export instead of reconstructing workspace CSS.

- Session boot consumes public `@lapismd/design-core/workspace/startup` and the shared drag-region stylesheet rather than a host-owned loading stub or `-webkit-app-region` override.

- Hosts also use that startup surface while resolving a saved current profile so the branded chooser cannot flash first.

- The plugins task reports the current plugin name.

- Metadata index load starts after layout restoration so database readiness does not contend with `loadLayout`.

- Persisted queries become available before rebuild or vault reconcile completes.

- Matching versioned Metadata and Search checkpoints skip full warm scans; stale Metadata reconciliation finishes before the single Search startup reconciliation begins.

- Configured Search providers are absorbed into that single pass, and unrelated vault configuration events do not invalidate its checkpoint.

- That work stays under status progress handles and reports determinate processable-file counts; bounded file batches yield so the notifications status item can paint.

- `App` registers `app:rebuild-vault-cache` and `app:rebuild-generated-state` so hosts can rerun that progress (LN-PKG-097, LN-PKG-098).

- `App` constructs `NotificationManager` before `Workspace` so the host can subscribe.

- Markdown parse runs in a worker, while vault I/O, link resolution, bounded hot-cache apply, and database writes stay on the main thread.

- The development renderer adds the real linked Design Core package root to its narrow Vite filesystem allowlist so public stylesheet assets remain available.

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

- `@lapis-notes/language-service/markdownlint/runtime` is the public boundary
  for native diagnostics and code actions. Concrete hosts own their adapter and
  process lifecycle.

- It continues to own `App`, workspace, plugin, database, and vault-session disposal, bounds best-effort telemetry flushing to one second, and acknowledges native close only after that shared teardown completes.

- Its boot document provides only a branded loading state until the renderer clears it or reports a startup failure through the existing status element.

## `@lapis-notes/workspace` (shell integration)

- The workspace package is a thin Svelte adapter over `@lapismd/design-core/workspace`.

- It receives an initialized api `App`, obtains the host binding from `@lapis-notes/api/workspace-host`, and renders the default design-core app-shell surface.

- It may forward Design Core's generic workspace-navigation presentation contract, but contains no vault discovery or selection policy, router, Lapis plugin bootstrap, persistence implementation, or copied Lapis workspace renderer.

- Its package contract exports `WorkspaceShell` and its component CSS, and its mount test supplies a real initialized api `App` while asserting plugin loading remains consumer-owned.

- Its public package metadata and semver dependency manifest let standalone first-party plugin catalogs use the real shell without source aliases or machine-specific link protocols.

- The package also owns the Community Plugins trust presentation defined by LN-PLUG-047 and the plugin-management empty and selected-tab presentation in LN-PLUG-048 through LN-PLUG-052, while App services retain action authority.

- It owns the shared registry rows, toolbars, structured details, and contextual content states in LN-PLUG-055 through LN-PLUG-058, including composition of the public Design Core expandable SearchFilterBar.

- The API package owns the additive signed metadata parser and verified Markdown fetcher in LN-PLUG-053 and LN-PLUG-054; Workspace receives those contracts without owning registry trust.

## `@lapis-notes/ui` (pruned)

Overlapping shadcn families are consumed from `@lapismd/design-core/shadcn/*`.
`@lapis-notes/ui` keeps Lapis compounds only: `modal`, `search`,
`confirm-dialog`, `sidebar-custom`, and `table-dnd` (plus helpers), each painted
with colocated CSS and `--ui-*` tokens (no Tailwind utilities in sources).
Confirm-dialog keeps the Design Core `dialog` host identity and only adds
`--ui-confirm-dialog-*` max-width and footer gap.

- `@lapis-notes/api` owns the generic secure-sync host contracts and their Memory/Turso/browser/native provider forwarding.

- Web owns browser persistence and WebAuthn/passphrase adapters; native hosts own
  their OS-credential adapters.

- The external `@lapis-notes/lapis-plugin-nostr-sync` package consumes those public capabilities and continues to own Nostr, Blossom, revision, and UI policy; no sync protocol implementation moves into this package graph.

- Host crypto also provides the purpose-separated local-state envelope in LN-ARCH-104 for durable encrypted checkpoint, outbox and merge metadata.

- The host contract also owns explicit vault enrollment, multi-epoch key custody, owner-authorised membership, bounded encrypted device-pairing sessions, and opaque recovery bundles.

- Pairing confirmation echoes and validates the displayed six-digit SAS before key transfer.

- A pairing result MAY expose the invitation's public relay URLs and MAY return at most 16 KiB of cloneable plugin metadata only after that metadata has crossed the encrypted transfer; the public invitation MUST NOT contain that metadata.

- The host emits transport-ready artifacts but never connects to a relay or chooses replication, merge, or recovery-rebind policy.

- LN-ARCH-111 adds explicit host-delivered pairing with empty relay metadata while preserving the existing Nostr invitation/message shapes and relay default. LN-ARCH-112 exposes installed epoch numbers only while unlocked for protocol-owned history authorization.

- Each enrolled vault also has one stable Sync Identity in that same wrapped key material.

- Device, root, and Sync signing remain separate public operations; pairing and recovery transfer the shared remote identity without cloning a device identity, while owner-authorised rotation preserves only public history.

- Date/time settings use design-core `forms` pickers via api `date-setting` (the old `date-time-picker-dialog` ui compound is retired).
