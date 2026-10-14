# Scoped local Sync files and storage

This slice supplies the API local-capability boundary and shared native adapter
for LN-ARCH-119 through LN-ARCH-122. It connects existing guarded native files
and separate engine/apply repositories behind one runtime-scoped contract.
Desktop profile RPC, actual editor guards and legacy/new Sync exclusive writer
selection remain necessary before selecting this provider in the application.
The full Deno destination/client/server implementation goal remains active.

## Public host boundary

`SyncHostServiceOptions.localProvider` selects a trusted adapter lazily, after
the caller's crypto, file, identity or generated-state grants have passed.
`plugin.syncHost.local` exposes capture, encrypted repository operations and
guarded mutation receipts. Hosts without a configured selector omit it;
unavailable, malformed or failed adapters never fall back to ordinary vault
writes or disposable index storage. Selectors and apply guards remain absent
from retained public options and plugin capabilities.

Captured file handles remain scoped to their runtime. Input/output streams
check the runtime around pulls, preserve backpressure and cancel on revocation.
Late output streams are cancelled before their operation drains. Completed and
rejected mutations finish or cancel their input sources and drain the transfer before
releasing the apply guard, including a provider retaining its input reader or
a native stale-target rejection before consumption. Host disposal
joins current revocations, and local cleanup finishes before delegated security
custody is released, including failed local cleanup.

Every mutation and receipt lookup requires a host apply guard. Receipt lookup
can resume an earlier mutation, so it requests a whole-workspace guard; direct
mutation supplies its captured path. Missing guards reject before selecting
a provider. Revocation during guard admission prevents later mutation.
The callback is a contract for a future real editor/exclusivity guard, not
proof that dirty-editor integration has been implemented.

Mutation capture copies supported operation and generation fields. A captured
file's read function does not enter a mutation precondition, and changing an
input while host admission is pending cannot retarget the admitted operation.

## Native adapter

`NativeSyncLocalProvider` owns one runtime and supplies the same contract using
`NativeSyncVault` and `NativeSyncRepository`. It requires an explicit inclusion
policy and admitted, enrolled, active, unlocked endpoint authority. Its
`engine.sqlite` and `apply.sqlite` stay outside working files and application
indexes. Engine state is namespaced by the logical vault and device; the apply
kernel retains its encrypted physical-root binding and process-safe lease.

The adapter reuses guarded file streams, durable ciphertext hashes, atomic state
comparison, encrypted apply journals and independently indexed receipts.
Revoked admission stops new calls and retained read streams. Failed initialization
cleanup retains its resource references and rejects new work until explicit
drained revocation, rather than silently reopening another writer.

## Focused and portable evidence

The original API command was:

```sh
pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/sync-host-local-provider.test.ts
```

It initially had five failures and now passes 16 cases. The complete four-file
local/security/host/plugin-harness family passes 61 cases. The native target
initially failed as one missing-module suite; its final eight cases pass.
The captured-file precondition case also exposed one cloning failure, fixed by
supported-field capture. Native tests use actual filesystem/SQLite storage
and fixture security; they do not qualify OS credentials or profile RPC.
The retained-input-reader and unused-native-source regressions each reproduced
one failure before forcing and draining cancellation; both exact targets now pass.

The existing `test:sync-native-vault` script now exercises the native provider
by default. `--direct-kernel` retains direct-kernel qualification with the same
assertions. Both use the original packed plugin engine, independent paired
device keys and unchanged host-delivered Nostr artifacts. No assertion was
removed for the adapter path.

```sh
pnpm --filter @lapis-notes/deno-host-services test:sync-native-vault -- <current-packed-engine-path>
pnpm --filter @lapis-notes/deno-host-services test:sync-native-vault -- <current-packed-engine-path> --direct-kernel
```

The first attempted artifact path selected an older engine missing the existing
membership-policy export. The current packed engine resolves that artifact
selection error without changing product code or the acceptance contract.
The adapter path passes Node acceptance for bidirectional ancestry, a 20 MiB
attachment, interrupted apply, cold wrapped-security reopen and plaintext
absence from engine/apply/security databases.

## Repository and consumer qualification

After the source-lifetime fix, root check/test/build pass with 18/18/10 successful
Turbo tasks. The final API suite passes 878 cases in 100 files; native services
pass 98 cases in 12 files. Desktop retains 257 passing cases and one existing
integration skip; server and Web pass 28 and 55 cases. Specification, App
ownership and metadata gates pass, including 38 specification-validator cases.
A fresh final host browser run passes 243 interaction/accessibility stories in
54 files, with shard counts 84/65/40/54 and zero failures.

Both direct-kernel and new-provider paired acceptance pass in Node and real
Deno processes after the final source fix. Frozen Deno acceptance uses the
existing ignored map and a copied `.release/sync-local-validation/deno.lock`.
That copy adds only `npm:@noble/hashes@2.0.1`, whose package/integrity was already
present. A JSON equality check proves every other lock field unchanged.
No committed lock or dependency version changes.

The final API tarball has 442 files and SHA-256
`af8972e7be2e860b6852505fb7951f1a48d3b3de3dc5b5ec6e235f3ef430a42a`.
Its new tests are excluded. Six local/repository/host runtime and declaration
files match the qualified output byte-for-byte; the isolated legacy consumer's
installed package matches those same files. The packed engine is byte-equal to
its current public output, SHA-256
`f1ed95bceace8672b179432843be655ef009a6047c7dd2ccfff2c425f694e179`.

The legacy consumer passes complete source checks, 116 unit cases with its
existing integration skip, build, publint and specification/ownership checks.
Its fresh browser run passes all 58 interaction/accessibility stories in 13
files, and its static Storybook build passes. The ignored consumer retains the
documented temporary
Workspace tarball and aligned peers; this is not registry-only qualification.
Original Nostr source, manifests and lockfiles remain unchanged.

The host audit retains 8 low, 39 moderate, 31 high and 3 critical findings.
No advisory exception, visual baseline, publication or release approval changes.
Final logs are under `.release/sync-local-validation/complete-*.log`; focused
and consumer logs are in the same directory.

## Remaining full-plan work

The desktop must still bind this data adapter to its admitted native security
session over bounded RPC and implement editor/exclusive-writer guards. The
production client runtime, scheduling and UI actions remain disconnected.
Deno durable event/object routes, original filters and catch-up, server
enrollment/key lifecycle and continuous participation, full faults/security and
real multi-device/server-Web acceptance remain required. Portable consumer
qualification, landing into main and temporary-workspace cleanup are also open.
