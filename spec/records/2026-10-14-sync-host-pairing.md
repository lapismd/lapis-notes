# Host-delivered Sync pairing and headless security

This slice supplies host capabilities required by the Deno-first Sync plan.
It does not activate the plugin, enroll a production server, or provide a
network rendezvous service.

## Delivered contracts

- Pairing defaults to the existing relay mode, requiring one to eight validated
  relay URLs. Owners may explicitly select `delivery: "host"`; joining devices
  must also select host delivery. Host invitations have no relay addresses.
  Mixed or unknown modes reject before a session is created.
- Both delivery modes retain invitation version 1 with exactly `e,p,r,s,v`,
  signed kind-24134 messages, NIP-44 transfer, SAS confirmation, replay and
  expiry checks, and independently generated device identities. The service
  returns artifacts for caller delivery and opens no pairing transport.
- Unlocked crypto status exposes a copied, sorted `installedEpochs` list from
  the actual installed content keys. Locked and unenrolled status omit it.
  Pairing, encrypted recovery and rotation tests verify the installed list.
  A revoked device can know the current epoch is 2 while retaining only epoch
  1; history policy must not infer installed keys from the current epoch.
- `@lapis-notes/api/sync-security-host` exports the existing implementation
  without the UI entrypoint. Its generated host-module record advertises no
  plugin runtime platforms. Official renderer and sidecar entries declaring
  that module reject with `runtime-dependency-platform-unsupported`.

## Exact regressions

The explicit host pairing and installed-epoch targets each initially failed
once and now pass. The two renderer/sidecar exclusion cases initially reported
an unknown module; after generating the canonical host metadata, both reject
for the required unsupported-platform reason.

```sh
cd packages/api
pnpm exec vitest run src/lib/__tests__/sync-host.test.ts src/lib/__tests__/plugin-release-runtime-validation.test.ts
```

All 51 focused cases pass. A strict Node ESM import of the built public security
subpath also passes without tsx, Svelte transforms or UI modules. The original
main API entrypoint remains UI-bearing and is not the headless host contract.

## Native and packed-engine acceptance

The portable engine, native-file and earlier-kernel acceptance scripts now
import the security service through its public headless export. Both engine
scripts supply actual installed epochs to enrolled history policy. The paired
native-file acceptance explicitly selects host delivery on both devices and
checks empty relay lists throughout the exchange.

```sh
pnpm --dir packages/deno-host-services test:sync-engine /absolute/path/to/packed/engine.js
pnpm --dir packages/deno-host-services test:sync-native-vault /absolute/path/to/packed/engine.js
pnpm --dir packages/deno-host-services test:sync-journal-upgrade /absolute/path/to/earlier/sync-vault.ts
```

All three pass in Node and a separate real Deno process. The native-file case
retains bidirectional ancestry, a 20 MiB attachment, interrupted apply, reopen,
key lock/unlock and encrypted journal checks. The migration case retains actual
earlier-kernel positive controls and downgrade rejection.

Deno acceptance uses the ignored `.release/sync-native-validation/deno.json`
map, with the new subpath derived from the API manifest's built public export.
It retains exact dependency versions. Use `DENO_NO_PACKAGE_JSON=1 deno run -A
--sloppy-imports --config <map> <script> <argument>` so development acceptance
does not mutate root workspace configuration.

## Host qualification

- API build and publint pass; all 841 API tests pass in 97 files.
- Root check/test/build pass with 18/18/10 successful Turbo tasks. The 77 native,
  28 server, 219 desktop and 55 Web tests pass; the existing desktop integration
  skip remains. Unchanged package tasks reuse tracked caches.
- A fresh full host Storybook run passes all 243 interaction/accessibility
  stories in 54 files, with shard counts 84/65/40/54 and zero failures.
- Specification, App-ownership and metadata-query gates pass. The API tarball
  includes the public security export and its generated no-platform record.
- The audit retains 8 low, 39 moderate, 31 high and 3 critical findings. No
  dependency ranges, committed lockfiles or advisory exceptions changed.

## Consumer compatibility

The original Nostr plugin continues using relay-default pairing calls. Its
ignored packed-API consumer initially passed 115 unit tests but failed one
source type check: the test-owned crypto fixture lacked the already-added
`local-state` purpose. The owning Nostr repository supplies the compatibility
fix in `fe475413` and its focused purpose/epoch-substitution regression; no
production relay or Blossom message changes are required.
With that source fix, existing installed-host and packed-new-API qualification
each pass source Svelte/TypeScript checks, 116 unit tests, public build/publint
and all 58 fresh Nostr Storybook interaction/accessibility stories. The original
integration skip remains; both browser runs have zero failures.
Both consumer Storybook static builds also pass. A strict Node import through
the installed API tarball passes, and its public headless implementation is
byte-identical to the qualified API build.

The isolated consumer is a copy of tracked source under
`.release/sync-native-validation/nostr-api-consumer`. Its temporary dependency
setup uses the built API tarball, the previously qualified Workspace 0.2.0
tarball, registry UI 0.1.2, File Explorer 0.1.0, Markdown 0.1.3, Search 0.1.2,
Design Core 0.3.2 and Svelte 5.56.10, with peer identities aligned. Original
checkout manifests and lockfiles remain unchanged. This setup is not a frozen
registry-only installation or release qualification.

Production protected key persistence, renderer/native capability bridges,
server rendezvous/enrollment, Deno event/object APIs, server participation,
integrated merge/restore and complete consumer/fault acceptance remain open.
Visual baselines, publication, signing, registry activation and deployment are
unchanged.
