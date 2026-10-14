# Native desktop Sync security broker

This slice implements LN-DENO-086 through LN-DENO-089. The desktop now selects
native security custody for plugin `sync`, through LN-ARCH-117/LN-ARCH-118.
It does not activate the still-disconnected Sync runtime or implement the Deno
destination/server participant.

## Custody and admission

`DenoAppDatabaseHost` admits a profile only after its worker successfully opens
the database. Closing, worker failure and replacement invalidate the native
lease before asynchronous cleanup. A native Sync session binds that lease,
profile and runtime to an opaque token; one runtime owns each profile.
Every operation checks admission before and after execution. Session open is
idempotent, including a lost response. Renderer retry discards a rejected open
promise; cancellation recovers an uncertain token and never dispatches its
queued content operation.

`DenoSyncSecurityHost` serializes operations, uses the public headless security
implementation and stores wrapped credentials in a dedicated SQLite database
under host-owned user data. A SHA-256 profile path replaces neither the
application index nor the existing legacy Nostr credential location.

New Sync uses OS service `md.lapis.notes.sync.native`. Legacy Nostr keeps
`md.lapis.notes.sync`; a crafted colon-shaped legacy account cannot alias the
native wrapping material. The raw renderer wrapping-key RPC rejects `sync`.
Private keys and wrapping bytes remain native, and temporary wrapping arrays
are zeroed. Empty/corrupt credentials and failed OS lookups never create a
replacement identity. Credential errors omit backend diagnostics.

The renderer receives only the allowlisted crypto, identity, pairing,
membership and recovery operations. Tagged JSON encoding preserves binary
values and arbitrary metadata without marker collisions or prototype mutation.
Recovery passphrases come from host interaction, outside plugin inputs.
Security commands are excluded from renderer/native operation telemetry.

Close invalidates the session immediately, joins admitted work and duplicate
close requests, destroys unlocked material and closes its store. A failed close
retains a failed profile rather than admitting another writer; RPC errors are
sanitized. Desktop component teardown drains host security in `finally` before
closing the vault session, and native shutdown closes security before its
database host.

## Focused regressions

```sh
cd packages/desktop-deno
pnpm exec vitest run src-deno/sync-security-bridge.test.ts src-deno/sync-secure-store.test.ts src/sync-security-protocol.test.ts src-deno/sync-security.test.ts src-deno/app-database.test.ts src/desktop-sync-security.test.ts src-deno/window-bindings.test.ts src/renderer-telemetry.test.ts src-deno/native-telemetry.test.ts
```

The initial protocol/broker target had two missing-module suite failures.
Profile admission initially had two failures; raw-key denial had one failure
and the renderer bridge was missing. Subsequent exact targets reproduced one
raw-close-error failure, one credential-namespace alias failure and one
same-runtime retry failure. A repeated-database-open regression also reproduces
one failure before preserving the original idempotent behavior and its stable
lease. Those exact regressions now have zero failures.
The complete focused family has 62 passing cases in nine files.

The interrupted-enrollment fixture pauses after the actual native transaction
commits, preserving the locked-on-reopen assertion. Closing before obtaining
wrapping material correctly leaves enrollment absent; it is not evidence of a
committed enrollment. The final test checks the intended durable fault window.

JSON-bridge pairing transfers the original signed Nostr messages with explicit
host delivery and no relay addresses. Paired native endpoints keep distinct
device keys, share the intended Sync Identity and decrypt each other's content.
Recovery export returns an encrypted bundle without exposing passphrases or
private fields. Tests also cover replaced leases, competing runtimes, malformed
wire input, backend failure and persistent key restart.

## Real native and OS acceptance

```sh
deno run -A --config packages/desktop-deno/deno.json --sloppy-imports --frozen packages/desktop-deno/scripts/accept-sync-security.mjs write <isolated-existing-directory>
deno run -A --config packages/desktop-deno/deno.json --sloppy-imports --frozen packages/desktop-deno/scripts/accept-sync-security.mjs read <same-directory>
```

Separate real Deno processes use the actual native database worker, production
invoke dispatcher, JSON renderer adapter, dedicated security database and macOS
Keychain. Readback starts locked, retains the same device public key and decrypts
prior ciphertext after unlock. Both direct raw-key RPC and a colon-shaped legacy
account alias reject. Closing the actual database revokes the session.
The isolated generated Keychain account is deleted by the completed read run;
ordinary profiles and development vault data are untouched.

The new broker passes frozen Deno type checking. Its required import maps add
only six lock references to existing `@noble/ciphers` 2.1.1 and `@noble/hashes`
2.0.1. A JSON comparison proves all existing package versions, integrities,
specifier values and other lock data are unchanged. npm manifests, package
versions and the pnpm lockfile remain unchanged.

## Aggregate and cold-host evidence

The full desktop suite passes 257 cases with its existing integration skip.
Root check/test/build pass with 18/18/10 successful Turbo tasks. Unchanged
packages reuse tracked caches, including the already qualified 862 API cases.
Specification, App ownership, metadata and scoped formatting gates pass.
The fresh host catalog passes 243 interaction/accessibility stories in 54 files,
with shards 84/65/40/54 and zero failures.

The actual database-worker smoke passes. A freshly built local macOS arm64
application passes packaged startup, normal plugin acceptance and coordinated
shutdown. The final package is rebuilt after the retry fix. Local QA packaging
uses only an ad-hoc signature; Developer ID, notarization, publication and
registry activation are not performed.

The pnpm audit retains 8 low, 39 moderate, 31 high and 3 critical findings, with
no changed advisory exceptions. This is not dependency release approval.

## Qualification limits and remaining goal

A broader frozen Deno check of the database host reaches the existing
AppDatabase descriptor/search dependency graph and proposes unrelated
Node/Storybook peer lock changes. The same proposal reproduces with the archived
parent database-host source under the current runtime configuration. Those
upgrades are not applied. The focused broker check, frozen real native runs,
normal package checks and actual native worker acceptance remain separate
evidence; this does not claim that broader descriptor graph is qualified.

Live OS verification here is macOS-specific. Linux lookup/failure behavior has
unit evidence; Windows/macOS/Linux release-matrix qualification remains separate.
The existing worker-authority requirement LN-DENO-073 and original broad catalog
and registry-only qualification limits are not waived by this slice.

The full objective still includes native file/repository bridges, dirty-buffer
guards and legacy exclusivity, Deno durable signed events/encrypted objects and
filters/catch-up, server enrollment/participation and change capture, actual
client scheduling/reconnect, integrated merge/restore, full fault/security and
consumer qualification, landing into main and temporary-workspace cleanup.
