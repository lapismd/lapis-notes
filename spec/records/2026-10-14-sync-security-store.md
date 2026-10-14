# Independent native Sync security storage

This slice implements LN-ARCH-114 through LN-ARCH-116. It supplies durable
wrapped-key storage and its host injection boundary. Production profile paths,
OS/server wrapping-secret lifecycle, renderer/native bridges and server
enrollment remain integration work in the full Deno-first plan.

## Storage and public contracts

`SyncHostServiceOptions.securityStore` selects a host-owned store for all Sync
key envelopes and network grants. Omitting it retains legacy AppDatabase
behavior. An invalid supplied store rejects; storage errors never select the
index as a fallback. The store is absent from plugin facades and the service's
retained public options. Enrollment destroys temporary key material if its
durable insert fails, including a response lost after a successful commit.

`@lapis-notes/api/metadata-store` defines the small generic metadata contract.
AppDatabase inherits it and re-exports the original check/mutation/transaction
types. Native code no longer imports browser/search implementations to obtain
those types. The new entry has no runtime exports and no plugin runtime
platforms. Both official renderer and sidecar declarations reject it.

`NativeSyncSecurityStore` uses its own SQLite database with `user_version = 1`.
It rejects foreign objects, unknown versions and incompatible column/key
shapes before access. Namespaces and security-key prefixes isolate records.
Conditional checks and all mutations run inside `BEGIN IMMEDIATE` through
commit, with rollback on failure. A per-connection queue prevents interleaving;
close drains admitted work and rejects new operations.

Values must serialize to JSON within 4 MiB. All writes validate before mutation;
oversized/corrupt stored values reject without clearing data. The cryptographic
service wraps private key material before these writes; the generic backend
does not encrypt arbitrary metadata. Public network grant metadata remains
distinct from credentials. No wrapping secret is stored here.

## Focused evidence

The initial API target had two failures: records still entered the index, and
an injected dedicated-store error was ignored. Its seven final cases cover
identity survival after index replacement, hidden store ownership, grant
routing, invalid-store rejection and lost insert responses before/after commit.

```sh
cd packages/api
pnpm exec vitest run src/lib/__tests__/sync-host-security-store.test.ts
```

All 61 cases across that file, Sync host, plugin harness and release-runtime
validation pass. The full API suite passes 850 cases in 98 files.

The native target initially failed to import the missing backend. Its thirteen
final cases cover reopen/copy/isolation, concurrent enrollment claims, atomic
validation and rollback, foreign/future/malformed schemas, namespace guards,
close ordering and corruption. All 90 native service cases and Deno check pass.

```sh
cd packages/deno-host-services
pnpm exec vitest run src/sync-security-store.test.ts
pnpm exec vitest run src/sync-security-store.test.ts -t 'lookalike|invalid host namespace'
```

The second exact target had two failures and now passes all four selected cases.
SQLite `LIKE` treated the underscore in `sqlite_%` as a wildcard and mistakenly
ignored a foreign `sqlitex_application_index`. The schema reader now uses a
literal-underscore GLOB pattern. NUL-containing namespaces also reject before
opening a database. Schema introspection normalizes the pinned driver's boolean
primary-key flags without accepting a missing composite-key member.

The first native type-check attempt exposed four browser/search errors caused
by the broad AppDatabase export graph. The shared public metadata contract
removes that dependency; the same native check now passes without changing
dependency ranges, adding a shim or modifying dependency implementations.

## Real native acceptance

The existing packed-engine/native-file acceptance now uses the dedicated store
for both paired devices. It destroys and recreates security services and
database connections before use and after interrupted apply. Identities,
membership, Sync Identity and installed epochs remain unchanged. Wrong
passphrases reject and existing enrollment cannot be silently overwritten.
Bidirectional ancestry, the 20 MiB attachment and apply recovery still pass in
Node and a real Deno process. Security/engine/apply databases contain none of
the known plaintext content, passphrases or private-key field names.

The separate `test:sync-security` script proves a fresh process can recover the
same wrapped identity and decrypt an earlier local-state object. Node writes
one fresh fixture directory and Deno reads it; Deno writes another and Node
reads it. Both directions pass. Only public status and ciphertext enter the
readback fixture. The initial script attempt incorrectly handled the crypto
result as bytes; it now uses the public `bytes` and `envelope` fields.

```sh
pnpm --dir packages/deno-host-services test:sync-security write <fresh-directory>
```

Run `read` in a separate Node/Deno process against that same directory. Real
Deno calls retain `DENO_NO_PACKAGE_JSON=1`, `--sloppy-imports` and the ignored
validation map, as documented in the pairing record. Fixed passphrases and
low-cost KDF options belong only to these acceptance fixtures; they do not
qualify live OS credential access or production server secret provisioning.

## Final host qualification

Root check/test/build pass with 18/18/10 successful Turbo tasks. Unchanged API
tasks reuse tracked caches after the final native guard changes; the fresh API
run has 850 passing cases. All 90 native, 28 server, 219 desktop and 55 Web
cases pass, with the existing desktop integration skip retained. The final
cold host browser run passes 243 interaction/accessibility stories in 54 files,
with shard counts 84/65/40/54 and zero failures.

All three packed-engine/native-file/earlier-kernel scripts pass in Node and
Deno after the final guards. Cross-process security readback is also repeated
against those final guards. Specification, ownership, metadata, format and
public build/publint gates pass. The source audit retains 8 low, 39 moderate,
31 high and 3 critical findings; dependency ranges, committed lockfiles and
advisory exceptions remain unchanged. This does not qualify those dependencies
for release.

## Consumer and release limits

The new API is packed separately as the ignored
`lapis-notes-api-security-0.1.2.tgz` and installed into the existing tracked-source
Nostr consumer snapshot. Its source checks, 116 unit cases, 58 fresh browser
interaction/accessibility stories, build/publint and static Storybook build
pass. The existing integration skip remains. Strict Node imports of both
headless entries pass through the installed tarball. This retains the temporary
peer/dependency setup documented in the pairing record and is not registry-only
installation evidence. Original Nostr source and lockfiles remain unchanged.

This is opt-in storage; it does not migrate existing AppDatabase credentials.
Host integration must preserve legacy Nostr custody and require deliberate
recovery/enrollment for missing keys. App profiles still need durable paths,
protected wrapping material, capability bridges and ownership/teardown wiring.
Metadata/history-size qualification and the remaining Deno destination, server
participant, client runtime and merge/restore work remain open. Advanced GC,
visual-baseline approval, publication, signing and deployment remain deferred.
