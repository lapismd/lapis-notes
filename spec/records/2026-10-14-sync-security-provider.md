# Scoped Sync security delegation

This slice implements LN-ARCH-117 and LN-ARCH-118. It adds the host boundary
needed to route new Sync security to native custody while retaining the legacy
Nostr credential location. It does not yet install a production native broker
or activate application/server synchronization.

## Host contract and lifecycle

`SyncHostServiceOptions.securityProvider` selects a trusted provider per plugin.
Selection is lazy, after the crypto grant and runtime checks. The provider
creates separate runtime capabilities for crypto, Sync Identity, pairing,
membership and recovery. Every operation rechecks the grant/runtime after its
asynchronous result. Failed or malformed providers never select local custody.
The provider and selector remain absent from plugin facades and public options.

Undelegated plugins retain their configured local store, including existing
AppDatabase-backed Nostr credentials. The local host enrollment/unlock/lock
entrypoints reject a delegated plugin, preventing accidental split custody.
Network and file capabilities retain their existing host ownership.

`revokePlugin()` invalidates runtime IDs before requesting delegated cleanup
and returns a promise that drains every requested cleanup. `dispose()` rejects
new runtimes, removes vault observation and joins both current and already
running revocations. Cleanup failures remain observable after draining.

Plugin runtime hooks accept asynchronous revocation. `Plugin.disable()` awaits
it even if component unload throws, and clears its cached capability facade
in either case. The existing failed-plugin state retains teardown errors.

## Regression and repository evidence

```sh
cd packages/api
pnpm exec vitest run src/lib/__tests__/sync-host-security-provider.test.ts
pnpm exec vitest run src/lib/__tests__/sync-host-security-provider.test.ts -t 'plugin disable'
```

The initial target had six failures. The additional unload-failure target had
one failure; both targets now have zero failures. The final provider family has
12 passing cases. All five focused host/storage/plugin-manager files pass 112
cases. The full API suite passes 862 cases in 99 files, without unhandled errors.

Root check/test/build pass with 18/18/10 successful Turbo tasks. API package
check/build/publint, specification, App ownership and metadata audits pass.
The final fresh host browser run passes 243 interaction/accessibility stories
in 54 files, with shard counts 84/65/40/54 and zero failures. Source and test
formatting are checked without reformatting unrelated existing Plugin code.

The source audit retains 8 low, 39 moderate, 31 high and 3 critical findings.
Dependency versions, committed lockfiles and advisory exceptions are unchanged;
these results do not constitute release approval.

## Packed legacy consumer

The ignored `lapis-notes-api-provider-0.1.2.tgz` contains the same qualified
runtime and declarations for `sync-host` and `plugin`; it excludes the new test
fixture. The installed legacy consumer runtime is byte-equal to that build.
The tarball SHA-256 is
`06f73ceec8c5840d64488f56cd64e8d3fbb16c64b94a72937bfa871e64366b1e`.

The existing ignored consumer setup passes full source checks, 116 unit cases
with the existing integration skip, all 58 fresh interaction/accessibility
stories, package build and publint. Its first full check could not discover
tracked stories from inside the parent's ignored directory; initializing the
exported source fixture as its own JJ repository restores the intended source
inventory and the exact full check passes. No production validator was changed.

This keeps the documented temporary peer alignment and Workspace tarball.
It is not registry-only installation evidence. Original Nostr source,
dependency ranges and committed lockfiles are unchanged.

## Remaining full-plan work

The desktop still needs an admitted profile/runtime-scoped native broker,
protected wrapping-key lifecycle, durable profile paths, renderer RPC and
shutdown wiring. Production enrollment, pairing delivery and recovery remain
unwired. Deno event/object storage, server participation, live client scheduling,
integrated merge/restore, full consumer/security acceptance and final landing
remain in the active implementation objective.
