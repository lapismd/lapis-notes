# Workspace Shell / Context

The host maps full native window-control clearance to the Design Core overlay
inset independently of ribbon width (LN-DENO-044). Maximized groups restore
ordinary chrome geometry when focus mode ends. Settings headings inherit
Design Core bold defaults; Workspace bounds large verified registry media and
its lightbox without changing standard Button geometry (LN-PLUG-096/097).

Workspace development shares the exact qualified Svelte compiler from
LN-PKG-149 with API, UI and hosts. Shared Design Core controllers therefore
retain their class identity across the application graph.

Workspace shell composition resolves Design Core through the current published
semver range recorded in package manifests and the committed lockfile.

The shell renders the generated `dailyNotes.folder` and
`dailyNotes.dateFormat` configuration controls supplied by the API schema. It
does not choose daily-note paths or interpret occurrence observations.

Workspace consumers may mount a complete Markdown file through the API
file-surface registry. The consumer supplies placement and opaque context;
Markdown retains editor, persistence, and scroll ownership.

Workspace presentation does not own Nostr account secrets or signing policy.
Signer-facing plugins use the App facade governed by LN-ARCH-099 and
LN-PLUG-078 while the host owns any consent or profile-creation surface.

- The shell's reusable movable-view contract is documented separately under [Panels](panels.md).

- This overview retains controller, persistence, and application-host responsibilities.

- Deno desktop is the native consumer and constructs `App` with an API `VaultSession` before mounting the shell.

- Language-service apply paths for serializable command actions live on the Problems panel chapter.

- Workspace `Plugin.addCommand` remains the Actions tab.

- File Explorer and AI register Files and Agents palette providers.

- `app:go-to-file` lands on Files.

- AI composer slash commands are a separate Plugin API (LN-PLUG-023).

- Transcript result views are a separate Plugin API (LN-PLUG-024) and MUST NOT add palette commands.

- Plugins register namespaced AppDatabase projections through `registerIndexProjection`.

- Indexing runs after the core metadata write and MUST NOT register workspace views.

- The application registers plugin-management pages against the shell controller; Workspace renders those pages and an App-injected README renderer without owning the selected static profile, registry policy, or host boot order.

- Its Community Plugins page presents the App-owned trust state through the compact, mutually exclusive status and action contract in LN-PLUG-047.

- Plugin-management pages share the empty-state and selected-tab presentation contracts in LN-PLUG-048 through LN-PLUG-052 without moving registry policy into the shell.

- The same package presents verified registry summaries and detail content through the shared responsive row, toolbar, and contextual-state contracts in LN-PLUG-055 through LN-PLUG-058.

- Its toolbar composes the public Design Core expandable search control and keeps tab filters application-owned.

- It MUST NOT verify signatures, resolve source ownership, or add installation behavior outside the injected App services.

## Ownership and data flow

1. The consumer creates and boots the api `App`, vault, and workspace, then
   provides that App to the shell's descendant context.
2. The api workspace owns one `AppShellController` and hydrates it from the
   normalized Lapis workspace JSON.
3. `WorkspaceShell` renders that controller through design-core `AppShell`.
4. Api calls commit compatibility JSON, including the bottom panel, into the controller. Design-core UI
   events project controller JSON into stable api wrappers and schedule the
   existing api persistence writer.
5. Registered Lapis views mount through imperative design-core view hosts;
   design-core renders the built-in empty state directly. Host-registered
   class views such as Problems stay on the controller. API projection treats
   Problems as host-owned before plugin start so `loadLayout` restores a
   persisted leaf or leftover ghost placeholder, and later API commits do
   not replace it with a missing-view surface. Hydration does not seed a
   quiet bottom tab. After the required plugin starts the leaf remounts as
   Problems.
6. The api configures built-in application/version metadata and the minimal
   design-core notifications presentation without invoking the Lapis plugin
   loader.

Views and leaves derive App from their owning workspace. Compatibility state is
never consulted when that ownership chain or the shell context is available.

Design-core's public workspace controller, legacy JSON bridge, imperative view
registry, and default shell surface are the dependency boundary. The shared
stacked-tabs stylesheet owns the preferred-width behavior; consumers MUST NOT
fork or override that layout logic locally.

Focus-mode presentation is also design-core-owned. The consumer verifies the
public maximize/restore control in both top and stacked stories but does not add
local buttons, focus state, compact action geometry, or paint overrides.

- The compatibility projection reuses split, tabs, group, window, and leaf objects by serialized id and keeps each claimed leaf's live `getState()` snapshot.

- File opens target an empty or file-backed main-area leaf rather than replacing a non-file view.

- Restoring a non-file leaf MUST load that view even when its snapshot includes a follow `file` path.

- Imperative hosts remount only when tab id or view type changes.

- Missing-view placeholders use the Lucide ghost icon on the leaf and Design Core empty surface; ordinary empty New Tabs keep the file icon.

- Api-origin changes are committed under a bridge guard; controller-originated changes are projected asynchronously under persistence suppression and emit one legacy layout-change/save request after reconciliation.

- Projection teardown iterates snapshots of mutable child collections and keeps projection identity state local to the workspace reconciliation, so removed tabs cannot survive and separate api `App` instances cannot interfere with one another.

- Persistence suppression remains active through the Svelte effect flush for each queued projection so compatibility-only sidebar effects cannot write an older layout back over a newer controller mutation.

- The bottom panel is projected as one top-level tabs wrapper rather than a recursive split.

- Center tab and group moves are supported; split-edge and focus mode operations remain restricted to the main workspace.

- Built-in shell settings use design-core's controller directly and do not share the workspace JSON writer.

- Default desktop chrome shows that Settings action in the left ribbon footer while the ribbon is visible.

- A missing workspace file seeds File Explorer then Search on the left and Outline, File Properties, then Tags on the right when those views are registered, without writing workspace.json during that seed.

- Save and Load workspace layout commands store named snapshots in `.obsidian/workspaces.json`.

- Reset workspace layout reapplies that default seed and then persists `workspace.json`.

- The controller's settings persistence delegates to atomic API configuration batches.

- Successful API updates reconcile matching controller fields, while equality checks and unchanged-batch elision prevent a persistence feedback write.

- API editor-view updates replace the corresponding controller registry entry exactly, including filename-pattern removal and plugin disposal.

- Storybook's editor-demo consumer owns the real startup sequence.

- It does not mount the shell until the sequence completes, and retry follows the same deterministic teardown path as story disposal before rebuilding from the canonical seed.

- Language-service provider throw or timeout and Lapis plugin load or enable failures publish workspace-wide Problems rows (LN-WS-077, LN-WS-078).

- Desktop and web hosts report the current plugin name on the plugins startup task through `PluginLoadOptions.onProgress`.

- Metadata cache load starts after layout restoration and does not block shell mount.

- While that cache load, rebuild, or vault reconcile is running, the host projects Lapis progress into Design Core so the notifications status item is the single busy surface.

- The cache's `loaded` event denotes database query readiness rather than full vault materialization.

- Shell and panel mounting may query persisted rows at that point while the same progress task continues manifest reconciliation; no workspace layout state depends on synchronous whole-vault cache maps.

- Manual `app:rebuild-vault-cache` and `app:rebuild-generated-state` reuse that same projected handle (LN-PKG-097, LN-PKG-098).

- Shell mounting therefore depends only on database open and query readiness.

- First-party panel data may continue refreshing from committed revisions without delaying leaf restoration or initial workspace paint.

Web and desktop workspace-session hosts install the sync unlock and exact-origin
consent callbacks while constructing `App`, then immediately claim the
host-only controller. The shell and plugins receive no administrative crypto,
network-grant, or database handle through workspace context. Browser storage
persistence is requested as a best-effort durability signal and never treated
as backup or authoritative vault storage.

LN-PLUG-092 keeps registry V2 detail and media rendering in Workspace plugin management. The owning production story verifies themed image selection, a disposable image dialog and separate structured per-version notes; static source selection and update pinning remain API-owned under LN-PLUG-093.

The app-owned `plugins` leaf is a movable workspace view. `app:open-plugins` and the Plugins left-ribbon action reveal an existing moved leaf or create a main-area tab, then return to the registry homepage. Its navigation state participates in workspace persistence (LN-PLUG-098–103).
