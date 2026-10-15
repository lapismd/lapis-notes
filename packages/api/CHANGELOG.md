# @lapis-notes/api

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
