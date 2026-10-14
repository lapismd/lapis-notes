# Durable Sync repository foundation

This slice supplies the host boundary needed by Lapis Sync's encrypted offline
history. It does not connect the production plugin or implement the Deno sync
destination, enrollment ceremony or server participant.

## Delivered

- API exports the protocol-neutral `SyncRepository` contract through
  `@lapis-notes/api/sync-repository`.
- Host crypto adds the purpose-separated `local-state` envelope with tag 8;
  existing object tags, signatures and encryption formats remain unchanged.
- The shared native kernel stores immutable ciphertext objects and sealed state
  in a dedicated SQLite database. Object reads verify SHA-256; atomic state
  updates reject stale versions. Repository namespaces remain isolated.
- A portable acceptance script accepts a built plugin engine file, uses the
  real host crypto implementation and native repository, and checks restart,
  key lock/unlock, stable outbox and plaintext absence from database files.

The acceptance script's passphrase and low-cost KDF are test fixtures. They are
not application configuration or a production credential-storage implementation.
The public host-module inventory is regenerated from the current API manifest.

## Verification

- Exact new encryption regression: one failure before tag 8, zero after it.
- API check and build pass; all 829 API tests pass in 97 files.
- Native repository: three tests pass for disk reopening, namespace isolation,
  stale updates and concurrent updates.
- Native host services: Deno check and all 32 tests pass in eight files.
- Real Deno process reopens the native repository and imports the bundled engine.
- Built/packed plugin engine acceptance passes with actual opaque host crypto.
- Root `pnpm build`, `pnpm check` and `pnpm test` pass. The final test run has
  18 successful Turbo tasks. An earlier concurrent run timed out in the
  unchanged Vite declaration test; its exact retry and the complete sequential
  rerun pass without assertion or timeout changes.
- `pnpm spec:check`, App ownership and metadata-query gates pass.

Reproduce engine acceptance after building the API and the plugin package:

```sh
pnpm --dir packages/deno-host-services test:sync-engine /absolute/path/to/packed/engine.js
```

The frozen host dependency install succeeds. Dependency ranges and the committed
lockfile are unchanged. `pnpm audit --json` reports existing dependency advisories
(8 low, 39 moderate, 31 high, 3 critical); this slice adds no dependency versions
or advisory exceptions. This is not release or security qualification for those
dependencies.

## Still required

Host bridges must provide a durable repository for each authorized local vault,
with lifecycle and exclusive apply ownership. Key custody must survive restart
outside disposable indexes. Deno still needs durable events, encrypted object
routes, authenticated enrollment/catch-up and an enrolled capture/apply
participant. Desktop/Web integration and the plan's complete fault/encryption
acceptance remain required before activation or release.

## Enrolled history authority acceptance

The portable script additionally loads the packed engine's
`createMembershipHistoryAuthority()` and supplies real host-generated
membership. It verifies active authority, false device attribution rejection,
an owner-authorized Sync Identity rotation, the retired identity's cutoff
ancestry and locked-key rejection. Native ciphertext repository reopen, stable
outbox and plaintext-absence checks continue to pass. The old packed engine
fails the added export assertion; the new engine passes the exact same command.

This script uses a test-owned security database and an epoch-1 fixture. It
does not establish persistent production key custody, installed-epoch capability
wiring, remote membership-chain catch-up or native working-file receipts.

The native package Deno/type check and all 32 tests pass. The first specification
check reported three missing mapped chapter updates; desktop, server and package
acceptance boundaries are now explicit and the complete specification/App
ownership/metadata-query gates pass. The existing dependency audit still reports
8 low, 39 moderate, 31 high and 3 critical advisories. No dependency versions or
advisory exceptions changed.

The owning repository aggregate check/test/build lanes pass. Native/server/
desktop/Web tests pass with 32/28/219/55 cases respectively and one existing
desktop integration skip; unchanged package tasks reuse their caches.
