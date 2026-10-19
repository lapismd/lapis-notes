# Plugin Model / Context — Part 1

The File Explorer 0.1.1 release retains its existing plugin identity and records
the landing-leaf reuse behavior. API and Workspace 0.1.1 provide the static
registry host contracts; plugin installation must satisfy those public peers.

Plugin-facing Design Core presentation resolves through the host's portable npm
range and committed lockfile; dependency refreshes do not expand the host API.

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
App-backed fixtures sequence startup and teardown through an owned lifecycle;
they do not disable never-started plugin instances or let one story's
compatibility lease overlap another story's boot.

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

Search checkpoint validation uses the public metadata reconciliation fingerprint
with a predicate selecting only files accepted by registered Search providers.
Selected metadata parser changes invalidate Search; unrelated metadata inputs
retain the checkpoint. The unfiltered API call continues to cover every
processable metadata file (LN-DB-035, LN-PLUG-030).

- The online Deno-server profile uses that same public version-and-digest plugin asset URL, but the authenticated server validates and serves the bytes instead of mirroring them into PWA Cache Storage.

- Installed metadata remains the asset authority in both Web profiles.

- The profile is explicitly identified by the document runtime `node-server`; plugins must not use the absence of PWA attributes as a substitute capability check.

- Server login, vault selection, and local-folder import occur before plugin boot and remain host-owned.

- They do not add plugin lifecycle hooks, static plugin registrations, or browser filesystem capabilities to an opened server vault.

- Global Graph initially fits and centers its complete visible projection; it does not inherit the active document as an implicit focus.

- Local Graph retains its explicit active-note center contract.

- The explicit Focus active file action may zoom and center the active note, but it does not participate in Global Graph startup.

- AI composer drawer chips use the public `attachment-chip` contract instead of plugin-local paint.

- Bundled AI MUST remain a Lapis plugin and MUST NOT gain a runtime dependency on sibling `@lapismd/ai-host`.

- Assistant chat Markdown uses the public Markdown embed helper rather than a second renderer and grows with the transcript instead of a nested scroller (LN-AI-122).

- Folder-scoped chats project path breadcrumbs through the same View chrome hooks as History.

- A busy chat Stop control cancels the active agent turn, including a send that is still preparing a session.

- The same enabled AI plugin owns one memory service per App.

- It registers provider-neutral read tools, consumes durable conversation checkpoints, writes curated vault records through its own store, and schedules derived ingestion and consolidation work.

- AppDatabase and native hosts provide generic storage and transport only; disabling or switching an ACP binding does not transfer or delete this plugin-owned memory lifecycle (LN-AI-179, LN-ARCH-083).

- For a native host that advertises deferred ACP start, the AI runtime adapter reserves the session and subscribes before start; other hosts retain the awaited start path (LN-AI-172).

- For a native host that advertises deferred model discovery, the model provider subscribes before sending its request and resolves the matching catalog event; other hosts retain the awaited catalog path.

- Both default Codex and Cursor providers use this agent-scoped ACP route; the separately exported native Codex process provider remains explicit rather than replacing Codex ACP discovery (LN-AI-173, LN-AI-175).

- Tool details unwrap envelope fields such as `output` and choose `json`, `bash`, or `plaintext` for the Design Core `CodeBlock` (LN-AI-133).

- Thinking stays expanded only while it streams and collapses when later transcript data arrives (LN-AI-131).

- Stop settles leftover spinners immediately and posts a cancelled system notice after cancel confirms (LN-AI-132).

- The notice reads `Agent turn cancelled`.

- Visible runtime and host errors remove the working indicator and leave the chat able to retry (LN-AI-052).

- An unreadable open conversation is reported and released so the next send starts a replacement chat (LN-AI-124).

- Runtime Allow always and Deny always decisions persist on conversation metadata (LN-AI-156).

- An unpinned idle chat follows the active-file folder and shows a faded centered scope control.

- The host supplies its visible-folder catalogue; the control adds Vault root, reuses the existing conversation transition, and reveals an explicitly selected scope through Explorer's public command.

- Pinning still prevents automatic active-file follow (LN-AI-160, LN-AI-161, LN-AI-162, LN-AI-163, LN-AI-178).

- File Explorer publishes `selectedPath` and a workspace selection-change event so AI History can follow folder context without importing Explorer internals (LN-EXP-005, LN-AI-165, LN-AI-166, LN-AI-167, LN-AI-168).

- History folder counts share one trailing edge across depths (LN-AI-169).

- The public AI renderer entry keeps optional Node user-agent storage outside browser and WebView bundles (LN-AI-170).

- Permission and question option buttons use the public `feedback-option` part (LN-AI-157).

- Plugins contribute tool and command result views through the API registry (LN-PLUG-024).

- Application-tool names and arguments stay visible when ACP only reports a generic `tool call` title (LN-AI-125).

- The composer overflow menu sits after History and attach, sizes to its labels so they stay fully visible at the model-menu type size (LN-AI-123), archives or restores in place, deletes through vault trash, and offers New Chat (LN-AI-109).

- AI History opens as a single sidebar leaf rather than a default sidebar group.

- The AI catalog opens as a single left-sidebar leaf of live tools, commands, and skills in an explorer-aligned tree.

- Opening a vault skill file MUST NOT scope a new chat to `.agents`.

- Load and enable failures publish workspace-wide Problems rows and clear after a later successful enable (LN-WS-078).

- Spell Check setup failure uses the language-service path and MUST NOT fail enablement (LN-SPL-008, LN-WS-077).

- Explorer native copy, open, and reveal extras stay on the File Explorer `buildItemMenu` hook.

- They do not add plugin commands or a `file-menu` dispatch until a listener exists.

- Show hidden files uses a File Explorer setting, toolbar preference, and palette toggle command.

- AI contributes an Open Chat left-ribbon action through `addRibbonIcon`, so it appears only while the plugin is enabled and reuses the existing chat command.

- The same plugin registers a file-only `ai-jsonl` view as the default `.jsonl` association.

- It previews portable transcripts with the established chat projection, agent bindings as readable events, and unknown JSONL as structured line records.

- This association adds no palette opener and remains read-only so the view cannot become append-only conversation authority.

- When AI is installed, Web exposes the same plugin-owned ribbon action.

- Host Settings own the agent-server URL and token; the plugin owns the start-server unavailable copy when a live runtime is selected without a connected host.

- A vault without workspace.json seeds File Explorer, Search, then Bookmarks on the left and Outline, File Properties, then Tags on the right when those plugins loaded.

- When Graph is installed and enabled, it contributes no default leaf; persisted global and local Graph leaves follow the normal missing-view disable and re-enable lifecycle.

- Its Design Core controls preserve the legacy disclosure-header presentation in a viewport-clamped 300px panel.

- Compact Group handles use a balanced gutter without mouse-hover outlines, while divider-free idle rows retain neutral paint.

- Visible remove actions occupy the panel's right padding with an internal trailing gutter and gain a muted hover fill.

- A public sortable-row token applies rounded focus paint across every Group control while retaining an outer trailing gap.

- Scoped Graph tokens keep idle geometry neutral, while renderer zoom allows the complete settled graph to fit the viewport and pointer or keyboard emphasis introduces accent paint without changing domain state.

- The Bookmarks panel snapshots persisted items so add and remove refresh the tree, insets rows with the public Explorer content-padding token, uses Explorer toolbar hover tokens, and follows Explorer tree indent, chevron-centered guides, and leaf rows that omit the disclosure column.

- Save and Load workspace layout commands store named snapshots; Reset reapplies that default seed.

- Collapse, remount, and file-open restore keep the same plugin leaf by serialized id and its live `getState()`.

- The workspace host also projects Lapis notification progress into Design Core so plugin and determinate metadata background work reuse the notifications status item.

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

- Skill roots and composer slash commands follow the same disposable plugin lifecycle as application tools.

- They stay off the workspace command palette and off Mira editor slash registration.

- AI conversations reach the palette only through an Agents provider, not `addCommand` per chat.

- AI discovers folder, vault, and user-global command Markdown separately from plugin registrations.

- Disposing a slash-command registration removes it from later composer resolution; reserved application names such as `/help`, `/scope`, `/context`, `/status`, and `/agent` remain app-owned.

- Their local notices stay start-aligned with authored line breaks.

- The slash menu lists those catalog commands, ranks Fuse name matches before description hits, and submits argument-free picks immediately.

- `/skills` and `/context` hydrate a missing binding snapshot from current discovery.

- Search owns composer `/search` and disposes it on unload.

- The chat shows that invoke as a `ToolCalls` transcript item.

- Application tool registration follows existing plugin contribution lifecycle: the helper supplies immutable runtime owner metadata, the App registry rejects conflicting names, and unload disposes the exact registration.

- Invocation resolves that exact registration both before and after a pending approval, so unloading or replacing a plugin while the card is open cannot grant or invoke a stale callback.

- Developer diagnostics may register the bundled factories directly against a volatile registry, but production plugins continue to own registration and automatic disposal through `Plugin.registerAgentTool`.

- Search continues to own `notes_search` through that same registration path so live ACP sessions receive it in the application-tool snapshot.

- This callback registry is separate from AI's external `McpServerContribution` registry; plugins cannot claim the reserved `lapis-tools` MCP server name through that process-backed integration surface.

- Protocol-v3 hosts may carry that reserved bridge through their advertised authenticated stdio or Streamable HTTP MCP transport; plugins do not select the transport.

- AI snapshots the exact active registration IDs for a new binding, and later plugin unload or replacement makes those snapshotted callbacks unavailable instead of transferring authority to a newly registered callback.

- Bundled domain plugins register their tools through that same lifecycle helper and capture their own services rather than receiving execution services in the host-created invocation context.

- Markdown registers `notes_list` during plugin load.

- AI registers the API Vault-backed `read`, `write`, `edit`, and `apply_patch` tools during its own load, so ordinary plugin unload disposes them before any stale binding can invoke their captured Vault.

- Those advertised descriptions steer agents to the vault tools instead of host-cwd shell commands (LN-AI-108).

## Distribution and provenance

`distribution` describes where source is owned and released. `provenance`
describes trust. A linked first-party package therefore uses core persistence
with official provenance; an official vault-installed bundle remains on the
installed-plugin path. Those states are not interchangeable.

## Persistence and recovery

- The core configuration continues to accept the legacy array and the object form.

- Missing-view placeholders retain the original view type and serialized state so restart and later enablement use the existing workspace recovery path.

- Required host-owned views such as Problems keep their host view type, including during layout restore before plugin start, and remount leftover ghost placeholders after the required plugin starts.

- Plugin configuration and data remain keyed by runtime plugin ID.

- Bundled plugins that own user-facing configuration register Design Core settings sections under `core-plugins` in addition to any legacy `PluginSettingTab` compatibility surface.

- Markdown Lint seeds `markdown-lint.disabledRules` with MD013 and include/exclude globs for open documents, using the same configuration keys as its manifest schema.

- Markdown Lint owns the sole renderer provider in browser and desktop hosts; its native adapter forwards those live vault rules instead of accepting a host-default provider alongside it.

- Spell Check seeds dialect, Harper rules, dictionaries, file-type filters, and lint options under `spellcheck.*` keys.

- Its Problems actions persist `userDictionary` and `ignoreWords` with cspell-style titles (LN-SPL-010).

- Its diagnostics complete empty while Harper is still warming and publish matching results after setup.

- Its status item refreshes from those keys and MUST NOT upsert on `layout-change`.

- Markdownlint vault disable appends `disabledRules` (LN-MDL-005).

- Plugin instances retain their constructor-supplied App.

- Managed disable and restore therefore operate on the owning workspace even while a compatibility lease exposes a different App for an older consumer.

- For the one-release metadata transition, a community or official code plugin defaults to a full synchronous snapshot lease.

- Declaring `lapis.database.metadataAccess: "queries"` opts into the normalized async contract and skips materialization.

- Lease acquisition happens before `onload`, and the Component rollback/unload path releases it exactly once.

- Bundled core and system plugins are query-native by policy and never receive an implicit lease.

- `App` registers host-neutral `app:rebuild-vault-cache` and `app:rebuild-generated-state` so Search can refresh after a later metadata rebuild without an API import of Search internals (LN-PKG-097, LN-PKG-098).

- Browser vault transfer failures report through the owning session App's notification manager; first-party hosts do not route those commands through the compatibility `Notice` constructor.

- AI user-global command storage is likewise host-owned and enters renderer code only through a runtime-only capability boundary, not a static Node module import.

- Markdown reuses one `MiraFileAdapter` for that same App so preview effects do not churn when views reconfigure.

- Its full-file surface establishes the effective Mira `obsidian` theme so domain contributions inherit Lapis semantic paint instead of Mira's portable fallback.

- Its Reading mode makes the inherited Design Core Scroll Area the sole preview scroll owner while Mira's inner preview remains non-scrolling.

- The floating outline stays centered in that visible Scroll Area and reserves body clearance for its collapsed rail.

- Packaged metadata parse uses a standard module-worker URL pointed at the emitted JavaScript file.

- Web and desktop retain host-owned dependency interop for the remaining registry package graph.

- `openFile` triggers `file-open` after `onLoadFile` so file-scoped Markdown panels can follow the restored note without waiting for a layout write.

- Restoring a command panel still loads that view when its snapshot includes a follow `file` path.

- The shared helper writes only when that followed path changes.

- Linked Backlinks and Outgoing Links then read `getCache` and inbound `resolvedLinks` for that note even if `getAllItems()` is still empty.

- The Storybook command-panel registry maps each `ViewAccess.command` identifier back to its source declaration and canonical panel story.

- This is verification metadata only and does not become a runtime plugin registration surface.

- Command-backed openers reuse an exact compatible leaf when one exists.

- A conversation opener may claim an unbound main-area AI leaf before creating a new tab, and it never replaces the dedicated history leaf.

- That history leaf keeps Design Core SearchFilterBar chrome centered in the panel.

- The Catalog opener reveals or creates the documented left-sidebar leaf.

- Code plugins that omit query-native metadata access receive a snapshot lease for their enabled lifetime.

- Query-native first-party plugins declare the database contract and remain on bounded per-file, facet, page, and link APIs.

- Storybook's first-party real-App fixtures follow the query-native path and MUST NOT acquire a compatibility lease merely to seed or assert persisted metadata.

- Search completion remains plugin-owned presentation over API-owned grammar: facet labels expose their original tag values, while their separate apply text uses the API formatter so slash and quoted space tags are executable queries rather than display-only suggestions.

The AI plugin owns its shared-controller client connections and closes them on
unload. It registers App-scoped tool and context endpoints; the service requests
fresh context only when a turn reaches execution. Markdown transcripts and memory
records remain vault-owned, with shared memory policy in the controller package.

For LN-PLUG-092, App Profile acceptance resolves the public packed plugin and framework exports through Vite, including dependency modules that need Svelte transformation. Local packed validation keeps one API class identity across its dependency peers and does not bypass the public graph with source aliases.
