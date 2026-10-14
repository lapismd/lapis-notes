# Guarded native Sync vault

This slice implements and qualifies the native working-file kernel required by
the active Deno-first Sync plan. It does not activate the production plugin,
enroll a Deno destination or complete the desktop/server lifecycle integrations.

## Implemented boundary

- API `./sync-repository` exports protocol-neutral file generations, guarded
  mutations, immutable operation IDs, durable receipts and an opaque crypto port.
  No private keys cross that port. A patch Changeset records the new types.
- Private `deno-host-services/sync-vault` captures real files through bounded
  streams and a persistent identity/generation index. A unique physical rename
  retains identity; equality of content never establishes rename identity.
- The kernel seals its journal with the existing `local-state` purpose/tag 8,
  binding version, epoch, vault, device and physical root. Unsupported suites,
  locked/revoked endpoints and substituted roots fail closed.
- A process-held native database lease excludes another kernel even when it
  chooses a different journal path. Process death releases ownership.
- Working bytes are streamed to private staging before intent persistence.
  Mutation retains a displaced preimage and installs into absence with a
  no-replace hard link. A concurrent target is never replaced by installation.
- Encrypted phase progress and receipts let reopen distinguish an unrecorded
  claim/install from a new user edit. Ambiguous recovery retains content and
  intent; retries of a completed operation do not repeat its mutation.
- Membership/epoch changes during a mutation stop stale progress. A lost
  persistence response forces reopen instead of trusting stale in-memory state.
- Close cancels staging, closes captured streams, clears decrypted metadata and
  releases ownership. A source with an unfinished cancellation cannot hold the
  kernel's files or lease indefinitely.

Readable staging lives under the authorized endpoint's excluded `.lapis`
working area. Ciphertext repositories stay outside the working vault. Retained
preimages are recovery data, not provider objects or an unencrypted sync mode.

## Focused evidence

- The first new target failed because the kernel module did not exist. The
  initial two real-file cases then exposed `/var` canonicalization on macOS;
  both pass after physical-root normalization.
- The lost prepared-commit response regression failed once before staged bytes
  were retained across an uncertain save; it now passes, as does the completed
  receipt response-loss case.
- Membership changes during streaming and unsupported encryption suites each
  reproduced one failure before their guards and now pass.
- The cross-process ownership target initially exposed an unclassified native
  open-time lock error. Its retry proves rejection while held and successful
  acquisition after killing the owner process.
- The staging collision target reproduced one failure: exclusive creation
  rejected an existing file, but error cleanup removed it. Cleanup now requires
  the physical identity of bytes created by that preparation. The exact target
  passes, and interrupted-stream tests cover owned cleanup and replacement
  preservation. Uncertain intent commits still retain their staging bytes.
- Native kernel/lease qualification has 25 passing tests, including deterministic
  races at actual preimage capture and no-replace installation. One streaming
  fixture needed zero prefetch so its edit happens during preparation rather
  than before the first guard; its assertion remains unchanged.
- API check/build/publint and all 829 API tests pass. Specification, ownership
  and metadata-query gates pass. Root check/test/build pass with 18/18/10
  successful Turbo tasks; unchanged package results reuse tracked caches.
  Native/server/desktop/Web tests pass with 57/28/219/55 cases respectively,
  alongside one existing desktop integration skip.
- The earlier root build reproduced the same single staging-collision failure;
  the final build passes after the ownership fix. No assertions or baseline
  thresholds were weakened.
- The fresh host audit reports 8 low, 39 moderate, 31 high and 3 critical
  existing dependency advisories. No dependency versions, committed lockfiles
  or advisory exceptions changed. This slice does not qualify those dependencies
  for release.

## Packed engine and real files

```sh
pnpm --dir packages/deno-host-services test:sync-native-vault /absolute/path/to/packed/engine.js
```

The script uses actual host crypto/membership and independent owner/member
device keys sharing the authorized vault Sync Identity. It exchanges signed
ancestry and encrypted objects through an in-process test transport, applies
changes in both directions to real native files, transfers a 20 MiB attachment,
and recovers an installed-before-progress failure after closing/reopening native
repositories and locking/unlocking keys. Engine and native journal files contain
none of the known plaintext path, messages or contents. The test passes in Node
and in a separate real Deno process on the current macOS host.

The legacy pairing API still requires a relay-address field in invitation
metadata; this fixture uses `wss://unused.invalid` and delivers returned events
directly. It opens no relay, Blossom service or sync server. The Deno rendezvous
and invitation transport extension remain required production work.

Deno validation uses an ignored import map under `.release/sync-native-validation`
with exact installed dependency versions. `DENO_NO_PACKAGE_JSON=1` prevents
workspace migration while the map resolves packages independently of pnpm's
symlink layout. Deno's initially generated root workspace entry was reverted;
committed dependency ranges and lockfiles remain unchanged. This is source and
packed-engine qualification, not a registry-only install or release claim.

## Still required

- Desktop/server capability grants, renderer/host bridges, editor-buffer guards,
  exclusive ownership alongside the legacy plugin, origin propagation and
  production key lifecycle/custody.
- A first-class host-delivered pairing transport and installed key epoch listing.
- Integrated stale-apply review/abandonment and merge/restore decisions. The kernel
  currently retains ambiguous intent; a user-facing resolution is not wired.
- Metadata-size qualification for the root's current file-identity index,
  which still has the host crypto record-size bound. Completed receipts use
  [independently encrypted indexed storage](2026-10-14-sync-indexed-receipts.md)
  and no longer grow that root. Cleanup removes unchanged completed download
  staging; preimages and ambiguous data remain retained. Advanced receipt/history
  garbage collection stays deferred by the plan.
- Cold application/server process acceptance, Deno network event/object APIs,
  active server participation and the complete consumer/fault/security matrix.

The acceptance uses test-owned security databases and low-cost fixture wrapping
passphrases. It does not establish persistent production secret custody or
native desktop/Web integration. No visual baselines, package versions, registry
activation, public publication, signing or deployment are changed by this slice.
