# Native memory database storage

Date: 2026-10-24. R1.3/R3 catalogue continuation after task source `fa9581f0`.
R5 scheduling/maintenance and host adapter adoption remain separate gates.

Core exposes the existing thirteen source, candidate/origin, recall and job
methods through its serialized database owner. All memory writes, claim/update
checks and post-commit revision changes share a transaction. Denied claims and
updates publish nothing. Source deletion retains its known affected path;
conversation deletion removes every candidate with an origin in that
conversation, including that candidate's other origins. Complete memory clear
leaves History, notebooks, metadata and notifications intact.

Typed DTOs preserve full records and prohibit unknown transport fields,
including raw recall queries and attempts to replace owner authority through a
job patch. Same-owner renewal retains its attempt/start time, another live owner
is rejected, exact expiry follows the retained boundary, and completed jobs
remain terminal. Zero-duration claims get one tick and exhausted attempts cannot
restart a failed job. A detached caller cannot cancel an accepted transaction.

Candidate queries retain Turso's default/capped limit and empty-state behavior;
ordinary shared cases also run against Memory. Origin reads use bounded 128-ID
chunks rather than one SQL request per candidate. Reads retain the native
32 MiB/100,000-record result guard. Schema creation is additive and transactional.
No new Cargo dependency or lockfile edge is introduced.

Focused verification:

- Existing Memory regression: **one passes**, 24 unselected cases. Log
  `.local/rust-memory-existing-before.log`.
- New independent retained-provider fixture: **six pass** before native code.
  The final fixture plus existing regression run passes **seven**, with 24
  unselected cases. The fixture includes full records, five common candidate
  queries, three Turso-specific empty-state/minimum-limit queries and ten lease
  transitions. Logs `.local/rust-memory-reference-{before,final}.log`.
- Native baseline: **24 missing-method diagnostics**, zero runtime cases
  (`.local/rust-memory-before.log`).
- First native run: **zero pass / three fail** on test-only JSON number
  representation: serde_json distinguishes integer `100` from f64 `100.0`,
  while the public transport uses JavaScript Number. The test comparator now
  normalizes only numeric representation and still compares every key/value.
  Production code was unchanged. Log `.local/rust-memory-focused-first.log`.
- Two test-compilation retries reported two then one borrowed-Value move
  diagnostics while converting those assertions; zero runtime cases. Fixed the
  test borrows. Logs `.local/rust-memory-focused-{second,third}.log`.
- Original three native cases then pass. Expanded transactional target passes
  **seven**, including sixteen competing claimants, cancelled-waiter drain,
  duplicate-origin rollback, attempts, finite-number admission and domain-safe
  clear. Logs `.local/rust-memory-focused-{pass,expanded}.log`.
- Additional schema/bulk target initially reports one test-helper compilation
  diagnostic: Turso Connection has no `checkpoint()` method. Use its real
  `PRAGMA wal_checkpoint(TRUNCATE)` query and inspect the result. No production
  code changes. Log `.local/rust-memory-focused-final.log`.
- Final focused native run: **nine pass / zero fail** across the three memory
  files, including **130 candidates** spanning origin bind chunks and failed
  schema creation with no partial memory tables. Log
  `.local/rust-memory-focused-final-pass.log`.
- Protocol runtime: **two pass**. Generated JSON schema/TypeScript drift and
  positive/negative TypeScript clients pass. Final runtime checks also accept
  importance `4.0` with integer Number semantics while rejecting 0, 6 and 4.5.
  Logs `.local/rust-memory-{protocol,drift}.log` and the final
  `.local/rust-memory-{protocol-final,drift-commit}.log`.
- Formatting expanded two negative TypeScript examples, leaving their
  `@ts-expect-error` comments before the declaration rather than the offending
  property. The drift/client check reports **four TypeScript diagnostics**
  (two unused directives and the two intended forbidden properties). Move each
  directive to its property; the exact check passes without weakening the
  negative cases. Log `.local/rust-memory-drift-final.log`.

Commands:

- `pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/memory-storage-contract.test.ts src/lib/__tests__/app-database.test.ts -t 'memory|Memory'`
- `pnpm rust:core -- test --locked -p lapis-app-core --test database_memory --test database_memory_transactions --test database_memory_queries`
- `pnpm rust:core -- test --locked -p lapis-app-protocol --test memory`
- `pnpm protocol:generate` and `pnpm check:protocol`

The first full `pnpm build` stops before native compilation at the 30 GiB
free-space guard (`.local/rust-memory-root-build.log`). Under standing cache
approval, after checking compiler/Turbo/test inactivity, open files and unchanged
file identities, remove **1,347 old Turbo archive/metadata files (2.001 GiB)** and
**43 obsolete Desktop test executables (0.666 GiB)**. Keep newer cache entries,
the newest native executable per stem, all libraries/apps and all user data.
The two exact inventories are `.local/obsolete-memory-turbo-cache.json` and
Desktop `.local/obsolete-memory-consumer-test-executables.json`. Free space is
32.031 GiB before the exact build rerun.

Broader source verification passes:

- `pnpm build`: **11/11 tasks** pass. Log
  `.local/rust-memory-root-build-final.log` is the exact rerun after cleanup.
- `pnpm check`: **20/20 tasks** pass, including strict native Clippy,
  boundaries, generated clients and the retained package checks. Log
  `.local/rust-memory-root-check.log`.
- `pnpm test`: **138 Rust cases**, zero failed/ignored; **20/20 package
  tasks** pass, including **1,261 API cases**. The unchanged retained Deno
  suite's existing skipped case stays skipped. Log
  `.local/rust-memory-root-test.log`.
- `pnpm spec:check`: **nine lanes** and **38 validator regression cases**
  pass, including spec-first, App ownership and metadata-query audits. Log
  `.local/rust-memory-spec.log`.
- Changed-document, fixture and TypeScript formatting passes. This slice does
  not change UI production code or Storybook infrastructure, so the earlier
  catalog result remains separate evidence rather than a new UI claim.
  No renderer production code, Storybook
  presentation or host database selection changes. Desktop's last compatibility
  record remains E-CORE-008 against the committed task source. Search storage and
  retrieval, cross-domain indexed mutations, host intake and original R1.3/R3/R5
  completion gates remain open; this storage slice cannot qualify those journeys.
