# Native Search database storage

Date: 2026-10-24. R1.3/R3 continuation from retained reference `89acf34f`.

The shared database actor now owns prepared Search publication, deletion,
single/list reads, body-free manifests and index statistics. Complete documents,
Unicode/UTF-16 offsets, optional source metadata, explicit null frontmatter and
embedding states/vectors retain the existing provider fixture. Typed DTOs reject
unknown fields, SQL, storage paths and invalid enum values. Rust-native numeric
inputs must remain finite.

Document and chunk replacement, cleanup, Search journal revision and post-commit
notification use one transaction. Duplicate chunk identities roll back all
partial rows and publish nothing. Accepted writes complete after the waiter is
dropped; close fences new admission, drains the write and permits cold recovery.
Manifest/statistics queries do not load document bodies. Result materialization
retains the existing 32 MiB/100,000-record native guard.

Turso's existing FTS module/index-method feature is required to open and mutate
already indexed databases. The pinned engine now includes it. Acceptance seeds
the actual retained schema and weighted FTS definition, writes through the core,
then verifies the FTS hit, a real float-vector blob/cosine result, schema version
and unrelated metadata. Additive Search-schema failure rolls back new tables.

This is the native processor's prepared-record publication boundary. It does
not yet prepare documents, generate embeddings, implement Search retrieval or
select a host database adapter. Those original R1.3/R3 gates remain open.

Focused verification:

- Baseline `pnpm rust:core -- test --locked -p lapis-app-core --test database_search`
  reports **16 compilation diagnostics**, zero runtime cases: fifteen missing
  contract/method diagnostics and one test assertion requiring equality on an
  enum without an equality implementation. Use a pattern match
  for that assertion; no production enum changes. Log
  `.local/rust-search-storage-before.log`.
- Original three golden-fixture/manifest/cleanup cases then pass. Adding
  rollback, cancelled-waiter drain and finite-number admission yields **six
  passes / zero failures**. Logs
  `.local/rust-search-storage-focused-{first,expanded}.log`.
- Existing-schema acceptance initially has **two passes / one failure**:
  `unknown module name 'fts'`. Enable the pinned Turso `fts` feature and its
  existing index-method option. The exact storage rerun passes **three**.
  Logs `.local/rust-search-storage-compat-{before,fts}.log`.
- Complete native target rerun passes **ten cases**, including a 36 MiB
  aggregate list rejection, oversized-message admission, still-readable manifests
  and snapshots after rejection, and rollback through an existing FTS index. Logs
  `.local/rust-search-storage-focused-{final,rollback}.log`.
- Protocol runtime cases pass **two**. The first full check reports one
  TypeScript diagnostic: generated embedding enum values used Rust casing while
  serde emits lowercase. Add explicit lowercase TypeScript derives to both Search
  enums, assert a lowercase chunk kind in the client and regenerate. The exact
  protocol/client rerun passes, including the positive/negative TypeScript
  client. Logs `.local/rust-search-storage-root-check.log` and
  `.local/rust-search-storage-protocol-check.log`.
- The existing two cold-process cases also pass after adding Search records
  to the killed-writer/fresh-process fixture. The recovered revision includes
  those writes and the original metadata, History and projection assertions.
  Log `.local/rust-search-storage-focused-cold.log`.

Commands:

- `pnpm rust:core -- test --locked -p lapis-app-core --test database_search --test database_search_transactions --test database_search_storage`
- `pnpm rust:core -- test --locked -p lapis-app-protocol --test search`
- `pnpm protocol:generate` and `pnpm check:protocol`

Broader source verification:

- `CARGO_BUILD_JOBS=2 TURBO_CONCURRENCY=1 pnpm test`: **150 Rust cases**
  pass, zero failed/ignored. All **20/20 package tasks** pass from the existing
  Turbo cache; this is not fresh execution of unchanged JavaScript suites.
  Log `.local/rust-search-storage-root-test.log`.
- `pnpm check`: strict native Clippy, generated-client drift, boundaries,
  ownership and metadata audits pass; **20/20 package tasks** are cached.
  Log `.local/rust-search-storage-root-check-final.log`. The later native
  recheck also includes the final cold-process fixture extension and passes
  strict Clippy, formatting, boundaries and protocol checks. Log
  `.local/rust-search-storage-rust-check-commit.log`.
- `CARGO_BUILD_JOBS=2 pnpm build`: native workspace build and **11/11 package
  tasks** pass; nine package tasks are cached, and the existing desktop/Web
  renderer builds execute. Log `.local/rust-search-storage-root-build-pass.log`.
- `CARGO_BUILD_JOBS=2 pnpm spec:check`: all **nine canonical lanes** and
  **38 validator regressions** pass. Log `.local/rust-search-storage-spec.log`.

Build preflight retries stop at the unchanged 30 GiB free-space guard, without
compiling or deleting anything. Under standing cache approval, first remove
506 inactive fingerprint-confirmed Cargo test binaries (5.320 GiB). After the
build recreates artifacts, the final native recheck stops at the same guard.
Remove another 633 inactive test/library cache files (3.136 GiB), then 1,192 old
AI library/metadata variants (2.020 GiB). Library selection retains the newest
variant for each source/features/profile identity. The inventories are
`.local/search-storage-test-cache-cleanup.json`,
`.local/search-storage-additional-test-cleanup.json` and
`.local/search-storage-ai-library-cleanup.json`. Each deletion checks compiler
and linker inactivity, open files, single-link file identity, size and mtime.
Keep application binaries, current libraries, focused Search/process test
binaries and all user data. Free space is 33.718 GiB before the final recheck.
No source changes to AI, Terminal or JJ Store accompany this cleanup.

Changed-document/generated-client formatting and final `pnpm spec:validate`
pass. Logs `.local/rust-search-storage-format-commit.log` and
`.local/rust-search-storage-spec-commit.log`.

The pinned Turso engine remains 0.7.2. Enabling its FTS feature adds 58 Cargo
packages; no previously locked package identity/version is removed. Node
26.9.0, pnpm 10.34.5, Vitest 4.1.11 and Rust/Cargo 1.99.0 are used.

No production renderer, standalone browser implementation or catalog story is
changed. Prior retained-provider/catalog evidence stays separate from native
storage qualification. Desktop compatibility, native preparation/retrieval,
cross-domain indexed mutations, host intake and unattended indexing remain open.
