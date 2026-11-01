# @lapis-notes/api

## 0.2.5

### Patch Changes

- [#66](https://github.com/lapismd/lapis-notes/pull/66)
  [`6086980`](https://github.com/lapismd/lapis-notes/commit/6086980be8a0d9cf6e697a689b0c17f409afdc3f)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Consume published Design
  Core 0.10.1 so browser hosts can reserve leading and trailing native controls
  and title-bar height, with a continuous divider when sidebars collapse. Keep
  portable registry ranges and existing compatibility.
- Updated dependencies
  [[`6086980`](https://github.com/lapismd/lapis-notes/commit/6086980be8a0d9cf6e697a689b0c17f409afdc3f)]:
  - @lapis-notes/ui@0.1.7

## 0.2.4

### Patch Changes

- [#60](https://github.com/lapismd/lapis-notes/pull/60)
  [`fb2eff2`](https://github.com/lapismd/lapis-notes/commit/fb2eff2b11b4a623ea2780f5e3e0f92a0530844b)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Expose the explicit
  Notebook Design Core/UI host modules and admit Design Core 0.9 compatibility,
  including File Explorer so the host resolves one shared Core installation.
  This changes generated host admission metadata and dependency compatibility,
  not the API runtime interface; retain the 0.2 API peer cohort. Full host
  qualification remains required before release.

  Add a public Vite renderer adapter that binds plugin compiler imports to the
  admitted versioned Svelte namespace and resolves those entries through the
  shared host runtime. Expose the required Markdown and CodeMirror host modules
  while keeping private imports and renderer version mismatches rejected.
- Updated dependencies
  [[`fb2eff2`](https://github.com/lapismd/lapis-notes/commit/fb2eff2b11b4a623ea2780f5e3e0f92a0530844b)]:
  - @lapis-notes/ui@0.1.6

## 0.2.3

### Patch Changes

- [#51](https://github.com/lapismd/lapis-notes/pull/51)
  [`6ea1803`](https://github.com/lapismd/lapis-notes/commit/6ea1803209ebfa336abf8eb0f3903fc62f5b7cb8)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Allow Sync host resource
  cleanup to finish after initialization fails, while preserving readiness
  errors and blocking delegated cleanup failures.

## 0.2.2

### Patch Changes

- [#52](https://github.com/lapismd/lapis-notes/pull/52)
  [`7960c2b`](https://github.com/lapismd/lapis-notes/commit/7960c2b8def265b9af5592693aba4185010fdd21)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Keep embedded inline
  source editors compact by restricting full-document trailing space to document
  editors. Regenerate the public host-module catalogue during versioning so
  later builds preserve committed version metadata.

  Adopt released Design Core 0.7.2 and Mira 0.1.3 for stable Notebook status
  controls, secure editor matching, nested code syntax highlighting and bounded
  recursive embeds.

- [#52](https://github.com/lapismd/lapis-notes/pull/52)
  [`7960c2b`](https://github.com/lapismd/lapis-notes/commit/7960c2b8def265b9af5592693aba4185010fdd21)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Upgrade Minimatch to the
  patched 11.x range and adapt private glob compilation to its parsed matcher
  API while preserving editor associations and vault discovery exclusions.

## 0.2.1

### Patch Changes

- [#44](https://github.com/lapismd/lapis-notes/pull/44)
  [`f2373ba`](https://github.com/lapismd/lapis-notes/commit/f2373baf79db19267f3422895ce321ef1fa3c78d)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Point package
  documentation to the canonical specification and remove stale package-local
  and pre-consolidation specification links.
- Updated dependencies
  [[`f2373ba`](https://github.com/lapismd/lapis-notes/commit/f2373baf79db19267f3422895ce321ef1fa3c78d)]:
  - @lapis-notes/ui@0.1.5

## 0.2.0

### Minor Changes

- [`bdd4923`](https://github.com/lapismd/lapis-notes/commit/bdd492357135de2cc0175fa42413709b2a38cd63)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Expose optional native
  watch registration readiness and preserve it through DirectoryWatcher and
  array subscriptions, allowing an initial reconciliation to run after native
  observation is established.

- [`86e85f6`](https://github.com/lapismd/lapis-notes/commit/86e85f6e814430c1755147c913eb91090a439bf4)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Expose
  `Workspace.flushLayout()` for hosts to await the latest serialized layout
  write before closing or reloading. Retain normal debounced persistence, report
  and retry failures, and drain accepted writes before disposing the host.

- [`fdee7e4`](https://github.com/lapismd/lapis-notes/commit/fdee7e4defde17a1009e16138d78c93c3ead8e2f)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Expose an optional
  conditional text-write port and an explicit native capability. Supporting
  native hosts receive the caller's exact text snapshot or expected absence.
  Unsupported hosts reject without falling back to an ordinary write.

- [`d8946b9`](https://github.com/lapismd/lapis-notes/commit/d8946b941569484b813eb0c1e8b1c5729fffc1a7)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Add owned
  diagnostic-resource navigation and themed recovery-banner actions. Accept
  Design Core 0.5.1 alongside the existing 0.4 range.

- [`ebf033a`](https://github.com/lapismd/lapis-notes/commit/ebf033af0fc0752be5ce5ffa7d55784163d291b4)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Retain document-owned
  conditional save baselines and expose App-owned text conflicts with explicit,
  snapshot-checked recovery for supporting vaults.

- [`978b987`](https://github.com/lapismd/lapis-notes/commit/978b987ba4c95408a63e49fad11bc44bab020758)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Expose an explicit
  AppDatabase provider runtime and retain the deprecated runtime value for
  existing consumers.

- [`ad4490c`](https://github.com/lapismd/lapis-notes/commit/ad4490ca1cd808002765582a17a5c81fa5335e0d)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Expose optional rename
  hints and awaitable native watch cleanup. Retire replaced or closed
  DirectoryWatcher generations before awaiting cleanup, retain failures for
  retry, and preserve complete polling state after read failures.

- [`55be8dc`](https://github.com/lapismd/lapis-notes/commit/55be8dce6f7b19b0e8036be86a3cf5305db25317)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Let file-view plugins
  contribute a fileIcon ID for their filename patterns or registered extensions.
  Add App-owned SVG and icon-pack registration with plugin lifecycle cleanup,
  preserve legacy icon registrations, and refresh Explorer artwork on editor,
  plugin and file changes.

  Release the scoped Design Core resolver first and raise the dependent minimum
  ranges to the releases containing these contracts before publishing consumers.

  Upgrade API-owned Zod to the patched package while retaining its public v3
  schema entry for compatibility.

- [`8a27bc3`](https://github.com/lapismd/lapis-notes/commit/8a27bc36a7a7fa81594e517908a6f5ed8ca77313)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Expose captured, guarded
  merged-text conflict recovery for desktop review.

- [`1e64589`](https://github.com/lapismd/lapis-notes/commit/1e6458922b486c07f36a5bc7d85d020b5805cd49)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Use `.lapis` as the
  shared application-state default and recognize the Tauri desktop runtime.
  Tauri database sessions require an injected native provider. Expose runtime
  classification independently of database and model services. Unreleased state
  is not imported from the old directory.

### Patch Changes

- [`631aeec`](https://github.com/lapismd/lapis-notes/commit/631aeec539e2fb061dc80c5c3a30a248ee15c529)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Preserve newer plugin
  views and activation when an older workspace controller snapshot is still
  queued.

- [`a91d5e2`](https://github.com/lapismd/lapis-notes/commit/a91d5e2eb5ec037029f6a7a2df316a9bd9440af7)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Attach controller-opened
  views after their API workspace projection completes, and cancel deferred
  attachment when the view host closes.

- [`fbba8d4`](https://github.com/lapismd/lapis-notes/commit/fbba8d48498c34939fec475e6bed67a682045820)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Retain plugin-state and
  compatibility-file drafts through close and conflict recovery, drain admitted
  plugin/file operations before teardown, and preserve Properties mutations
  after initial read failures.

- [`023259d`](https://github.com/lapismd/lapis-notes/commit/023259d96d4ff0414fec6427924ed917f89405a3)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Add an optional exclusive
  file-creation transport and route Explorer new-note actions through the
  FileManager creation intent. Preserve existing destinations on collisions and
  keep legacy Vault creation semantics explicit.

- Require released Design Core 0.6 for the close-guard, plugin-flush and
  centered panel contracts used by current source. Retain portable registry
  dependency ranges for the shared application runtime.

- [`63a5e7f`](https://github.com/lapismd/lapis-notes/commit/63a5e7fe40eea45762b5842b588c742076c7dd1d)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Rebind clean file views
  after their rename or move releases editing protection, so the open editor
  continues saving to the new path. Preserve ordered App-owned projection and
  dirty external-file recovery.

- [`2bffe48`](https://github.com/lapismd/lapis-notes/commit/2bffe484b38761af197afe7ab9b0d7b3affb50d7)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Serialize configuration
  changes and retain pending or failed settings and hotkey drafts in the owning
  App's conditional persistence lifecycle. Admit shared Workspace Settings
  changes before presentation debounce so immediate close cannot lose them.

- [`86f6316`](https://github.com/lapismd/lapis-notes/commit/86f63166c3d5be648c595ef4e230ea6c4081bc48)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Protect frontmatter and
  metadata type mutations with the App-owned writer lifecycle, authoritative
  conditional baselines and retained text-conflict recovery.

- [`edf1d76`](https://github.com/lapismd/lapis-notes/commit/edf1d76f4f3aa0442c1d9153d812f29b7d14e5c2)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Allow read-only
  configuration baseline reconciliation after a guarded native mutation without
  materializing defaults or adding another persistence operation.

- [`b3be91d`](https://github.com/lapismd/lapis-notes/commit/b3be91daecbd43187bacf8cfdc39f8311d700720)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Reconcile a clean
  interactive producer's drifted authoritative saved bytes under held protection
  before the guarded native-yield saved-baseline comparison (LN-CORE-028). An
  external file change that a lagging watch projection has not acknowledged no
  longer aborts an admitted frontmatter/state mutation with a bare ECONFLICT
  notice; producers that cannot acknowledge, and dirty writers, keep the
  fail-closed handoff fence with its observable explicit retry.

- [`5ef0a63`](https://github.com/lapismd/lapis-notes/commit/5ef0a6331c1b846b70357f990d919977a561112c)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Qualify the shared editor
  against Mira 0.0.5 so native hosts can consume the source-owned accessible
  block-control repair through verified local archives during migration.

  Retain direct Turso connection ownership after a failed close, drain accepted
  mutations, and share concurrent close completion so native teardown can be
  retried safely.

- [`bac3e5e`](https://github.com/lapismd/lapis-notes/commit/bac3e5eda6f467dbc86ec88c9f27a275f2b27953)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Expose optional
  implemented system trash through the neutral native adapter with explicit
  unsupported fallback and validated acknowledgements. Attribute Explorer
  native/copy feedback to its owning App and reject unavailable clipboard
  support without reporting success.

- [`74f544e`](https://github.com/lapismd/lapis-notes/commit/74f544e2aa8a967524c0c218f3db7e1a495a1a17)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Add an explicitly started
  App-owned watch service with bounded reconciliation and awaitable
  stop/restart. Project external changes through existing workspace/editor
  lifecycles, preserving dirty views and retained writers while clean views
  follow file moves and removals.

- [`501c50e`](https://github.com/lapismd/lapis-notes/commit/501c50e049264560e13e29c75a74c089922c7297)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Project owned App notices
  through the existing workspace notification UI and retire their subscription
  on host disposal. Pass the explicit Explorer App when reporting file-action
  failures.

- [`98b333f`](https://github.com/lapismd/lapis-notes/commit/98b333f73ff5ba8d5f28c52e4e3a2ceaa5ade0fb)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Protect and flush
  registered file writers before FileManager trash or deletion, including folder
  descendants. Route Explorer deletion through that guard so failed writes
  retain the file and dirty draft until explicit recovery.

- [`535a6cc`](https://github.com/lapismd/lapis-notes/commit/535a6cc7b39f397cf8761a06db7b831386121928)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Expose document-owned
  conditional text persistence with asynchronous, operation-owned recovery
  leases for independent file writers.

- [`109e208`](https://github.com/lapismd/lapis-notes/commit/109e208a63253dcc1a7abad3fd5a9b13c39d3def)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Reconcile complete
  bounded disk snapshots while preserving canonical Vault resource identities,
  descendant lifecycle events and filename indexes. Serialize mutations through
  projection and keep existing binary/text writes coherent with cached content
  and tree children.

- [`f828eae`](https://github.com/lapismd/lapis-notes/commit/f828eaeba8411aa342d7ab4954393e84612af2f3)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Expose core file
  discovery exclusions as an editable list under Workspace settings.
- Updated dependencies
  [[`d8946b9`](https://github.com/lapismd/lapis-notes/commit/d8946b941569484b813eb0c1e8b1c5729fffc1a7)]:
  - @lapis-notes/ui@0.1.4

## 0.1.5

### Patch Changes

- [#36](https://github.com/lapismd/lapis-notes/pull/36)
  [`17060a1`](https://github.com/lapismd/lapis-notes/commit/17060a1df152c9fc2302c93767cd7172868ff030)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Consume published Design
  Core 0.5.0 with prepared browser CSS and bundled font assets through normal
  npm ranges.
- Updated dependencies
  [[`17060a1`](https://github.com/lapismd/lapis-notes/commit/17060a1df152c9fc2302c93767cd7172868ff030)]:
  - @lapis-notes/ui@0.1.4

## 0.1.4

### Patch Changes

- [#28](https://github.com/lapismd/lapis-notes/pull/28)
  [`967a92f`](https://github.com/lapismd/lapis-notes/commit/967a92fb123c9cb66fca976c689fafdd00aa65b6)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Keep editor saves and
  failures bound to their original document and App across file switches and
  close. Register retained writers with the App-owned session registry, expose
  protection and awaitable disposal, and support a captured asynchronous
  external persistence writer. Block typing/rebinding during guarded admission
  while allowing controlled clean refresh.

- [#28](https://github.com/lapismd/lapis-notes/pull/28)
  [`967a92f`](https://github.com/lapismd/lapis-notes/commit/967a92fb123c9cb66fca976c689fafdd00aa65b6)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Expose the headless
  opaque Sync repository contract and add purpose-separated local-state
  encryption for durable encrypted checkpoints and publication queues. Existing
  encrypted object tags and wire formats remain compatible.

- [#28](https://github.com/lapismd/lapis-notes/pull/28)
  [`967a92f`](https://github.com/lapismd/lapis-notes/commit/967a92fb123c9cb66fca976c689fafdd00aa65b6)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Expose an App-owned file
  editing-session registry for independent file writers. Serialize guarded
  mutation, protect and flush every matching session before admission, retain
  detached dirty writers for retry, and drain cleanup before another mutation or
  shutdown. Production Sync guard selection still requires complete writer
  integration.

- [#28](https://github.com/lapismd/lapis-notes/pull/28)
  [`967a92f`](https://github.com/lapismd/lapis-notes/commit/967a92fb123c9cb66fca976c689fafdd00aa65b6)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Register and protect
  asynchronous editor document loads before reading, drain original drafts and
  publish the target file and contents together. Superseded, unloaded and failed
  loads preserve the previous document and release their provisional session.
  Managed file and folder renames now protect and flush all registered writers
  before moving files or rewriting links.

- [#28](https://github.com/lapismd/lapis-notes/pull/28)
  [`967a92f`](https://github.com/lapismd/lapis-notes/commit/967a92fb123c9cb66fca976c689fafdd00aa65b6)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Expose protocol-neutral
  guarded file generations, immutable mutation identifiers, durable receipts and
  an opaque local-state crypto boundary for host-owned native Sync vault
  transactions. Existing protocol and encryption formats stay unchanged.

- [#28](https://github.com/lapismd/lapis-notes/pull/28)
  [`967a92f`](https://github.com/lapismd/lapis-notes/commit/967a92fb123c9cb66fca976c689fafdd00aa65b6)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Add explicit
  host-delivered pairing without relay addresses while preserving default relay
  invitations and the signed/encrypted Nostr message format. Expose copied
  installed content-key epoch numbers only while unlocked so history policy can
  use the actual keyring instead of assuming an epoch.

  Expose the same implementation through the headless `sync-security-host`
  export for trusted Node/Deno hosts, with no plugin runtime platforms
  advertised.

- [#28](https://github.com/lapismd/lapis-notes/pull/28)
  [`967a92f`](https://github.com/lapismd/lapis-notes/commit/967a92fb123c9cb66fca976c689fafdd00aa65b6)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Allow trusted hosts to
  retain wrapped Sync keys and network grants in a dedicated security store
  independent of disposable application indexes. Keep legacy storage compatible
  and reject invalid or unavailable dedicated stores without fallback.

  Expose the shared metadata-store types through a headless host-only
  entrypoint, retaining the existing AppDatabase metadata exports.

- [#28](https://github.com/lapismd/lapis-notes/pull/28)
  [`967a92f`](https://github.com/lapismd/lapis-notes/commit/967a92fb123c9cb66fca976c689fafdd00aa65b6)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Add an optional opaque
  immutable record repository extension for independently encrypted local
  receipts. Native mutation recovery can compact completed work without growing
  its active journal or exposing receipt contents in an index.

- [#28](https://github.com/lapismd/lapis-notes/pull/28)
  [`967a92f`](https://github.com/lapismd/lapis-notes/commit/967a92fb123c9cb66fca976c689fafdd00aa65b6)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Allow trusted hosts to
  delegate scoped Sync security to native custody while preserving legacy plugin
  credentials. Check permissions before and after asynchronous operations,
  reject local enrollment for delegated plugins, and await security revocation
  when a plugin is disabled, including unload failures. Add host disposal that
  invalidates runtimes and drains delegated cleanup.

## 0.1.3

### Patch Changes

- [#19](https://github.com/lapismd/lapis-notes/pull/19)
  [`a85055b`](https://github.com/lapismd/lapis-notes/commit/a85055b6570244d5dde2ea1145be3609260d91ca)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Restore the omitted API
  0.1.2 release notes and keep changelog generation independent of optional code
  formatter plugins. Verify current-version notes before and after preparing a
  release so incomplete changelogs stop publication.

- [#17](https://github.com/lapismd/lapis-notes/pull/17)
  [`0c8cbd0`](https://github.com/lapismd/lapis-notes/commit/0c8cbd0811663a9c63590d4d730445c80df91e6c)
  Thanks [@stevejuma](https://github.com/stevejuma)! - Download selected plugin
  releases through the catalog's signed delivery endpoint so browser hosts can
  install archives from the registry. Retain verified archive integrity and
  signatures, allow origin fallback for transport failures, and stop fallback
  after cancellation or revocation.

## 0.1.2

### Patch Changes

- Use published Bits UI 2.19.5 so destroyed text-selection layers stop document
  pointer listeners before reading component-owned reactive state. Retain the
  existing approved Link Preview selection-probe and listener cleanup when
  refreshing the runtime.
- Require published Design Core 0.3.2 for native window-controls spacing, bold
  settings headings, selected-tab indicators and mobile shell teardown. Consume
  the npm release through portable semver ranges and lockfile integrity.
- Expose the existing optional App argument in the Notice declaration so
  app-owned callers can use the public constructor without falling back to
  compatibility state.

## 0.1.1

### Patch Changes

- Own the transport-neutral registry schema and portable Turso build helper,
  removing the Community dependency from static registry producers and hosts.

- Expose host-owned secure sync capabilities and controlled declarative plugin
  settings.

- Allow indexed consumers to select metadata fingerprint inputs. Preserve native
  filesystem error codes and reconcile files removed during startup as deletions
  while retaining unexpected read failures.

- Support verified static V2 catalogs alongside Nostr sources, retain
  installation source provenance, and render themed registry images and
  structured release notes.
- Updated dependencies []:
  - @lapis-notes/ui@0.1.1

## 0.1.0

### Minor Changes

- First public npm release of the Lapis Notes runtime kernel, including the app
  container, vault contracts, workspace model, plugin lifecycle, commands,
  settings, metadata, editor, telemetry, and agent-tool public subpaths.
