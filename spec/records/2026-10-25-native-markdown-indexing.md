# Native unattended Markdown indexing intake

Date: 2026-10-25. R3.2.1 source intake under LN-CORE-003/005/006; this is a
partial real Markdown implementation, not completion of the whole R3 gate.

## Implemented source

An explicitly selected `VaultService::start_markdown_indexing` starts one native
owner over the existing admitted vault/database. Startup, filesystem hints and
periodic repair reconcile actual Markdown files without clients. Existing
indexed metadata/delete actors retain publication and relationship cleanup.
There is no JavaScript runtime, renderer scheduler or secondary database writer.

The parser belongs to the sibling private `lapis-plugin-services` crate, consumed
through the documented temporary native migration path. Notes owns normalized
tags/properties/links, ordinary property inference, `.lapis/types.json`
declarations and the vault lifetime. Input hashes remain the retained MD5.

The scan bounds directory entries, total manifest entries/path bytes and file
reads. It skips hidden content and symlinks, verifies the retained physical
root, checks source bytes after parsing and retries changed sources. Observation
is eventually consistent with external writers: a racing final edit is repaired
by a queued hint or the next 30-second periodic scan and complete pass. The
derived database is not an atomic transaction with external filesystem IO.

## Narrow before and after

`pnpm rust:core -- test -p lapis-app-core --test service_indexing` first reported
zero passes and two failures: startup and external changes never indexed. The
same target now passes all ten cases:

- Actual Markdown startup with no client scheduler.
- External create/edit/delete after the last client detaches.
- One owner, unchanged-record idempotence, hidden/symlink exclusion.
- Identical-size, identical-mtime rewrites detected by source identity.
- Cold recovery of changes made while the service was stopped.
- Dirty-close refusal retaining the running owner.
- Observable invalid-source failure, repair and replaced-root refusal.
- Twelve start/close contention rounds without a retired scheduler or DB lease.
- Partial progress retaining committed-row counts before a later failure.
- Property-type configuration changes without note-content changes.

The race test exposed a blocking-close-gate deadlock. Final start admission
uses a nonblocking gate and returns Busy/Closed while close retires the owner.
Close fences admission before stopping indexing. The exact race and complete
ten-case target pass after repair; no timeout was increased.

## Retained normalization reference

`packages/api/src/lib/__tests__/native-indexing-reference.test.ts` compares
18 inferred-type cases and three complete normalized records against the
retained application builder. The same fixtures qualify two native unit tests
under `services::indexing`. They cover declared types, null/primitive/nested
arrays, tags/aliases, date/datetime strings, hierarchy/deduplication, relative
links, same basenames, fragment-only and external links. The native fixture
adapts only its deliberate parser-version identity. Typed DTO decoding preserves
equivalent JSON numeric representations without dropping record fields.

The first native normalization run had one pass/one failure because `../`
links resolved incorrectly. Final native reference tests both pass; all 21
retained application cases pass. The sibling extractor separately qualifies six
shared outputs, including UTF-16/CRLF offsets and invalid YAML.

## Impact qualification

After close-order changes all 27 existing database/backup/lifetime cases pass:

```sh
pnpm rust:core -- test -p lapis-app-core --test service_indexing --test service_database --test service_lifetime --test service_backup
pnpm rust:core -- test -p lapis-app-core --lib services::indexing
pnpm --dir packages/api exec vitest run src/lib/__tests__/native-indexing-reference.test.ts
pnpm --dir packages/api check
pnpm --dir packages/api build
```

API checks and package build/publint/type-contract lanes pass. The final complete
`pnpm --dir packages/api exec vitest run --maxWorkers=2` passes all 1,555 cases in
147 files. An earlier contended run timed out the unchanged build-helper
declaration test at its existing five-second limit. Its exact serialized rerun
passes, followed by the complete passing suite; no assertion or timeout changed.
This is separate from the parent task's full Rust/host and shared UI lanes.

Native commands use Rust 1.99, two Cargo jobs, disabled incremental builds and
macOS deployment target 13. The build guard was preserved. Under standing cache
approval, only inactive obsolete build outputs were removed; newest variants,
main binaries, app packages, vaults, profiles and models remain.

## Gates retained

Task/custom projection processors, complete metadata normalization/conformance,
Search/history scheduling and both hosts' owner cutover remain pending. Neither
host selects this scheduler by default. Source fixtures do not qualify native
UI, provider, Linux, publication or installed-app acceptance. The sibling
parser is committed at `6af2420ff720cf8ce04581306c9c7b8d12b126e4`. The user
accepted its nine unchanged parent npm audit findings for this parser slice only;
that receipt retains one critical, three high, two moderate and three low
findings as separate dependency work. Unrelated npm and unfinished asset-source
work is preserved.

## Full native qualification in progress

The first strict workspace check reports one `collapsible_if` style finding in
index-owner shutdown; its let-chain repair changes no behavior. The first full
Rust suite stops before executing the server `turns` test because that cached
executable was removed as an obsolete same-name variant. Different crates can
have same-named targets: cleanup must retain each crate/configuration separately.
The build passes; strict check, complete tests and build are rerunning serially.
This failed attempt is retained and does not count as product acceptance.

The repaired strict workspace check passes. One later full-run HTTP backup case
fails opening the native History binding (31 HTTP passes / one failure). Its
unchanged exact rerun passes, then the complete 32-case HTTP target passes at
normal concurrency. A bounded full workspace rerun is in progress; no test,
assertion or timeout was changed.

## Completed native and catalog qualification

The final bounded `pnpm rust:core -- test --workspace --locked --
--test-threads=2` passes all 338 ordinary cases/doctests with six intentionally
ignored model cases. `pnpm rust:core -- build --workspace --locked` passes.
The dedicated `LAPIS_NOTES_VALIDATION_RUNTIME=native pnpm test:search:onnx`
passes all five unique model cases, including child-process cache recovery.
The complete cold `pnpm test:storybook` passes 261 cases across four sequential
shards, with zero functional or accessibility failures.

While qualification was running, the separately committed validation runner
changed portable command defaults to Docker. A concurrent portable package
retry stops at its per-checkout container lease; the Docker model lane stops
because ignored Mac model files are not transferred. Both failed attempts are
retained. This macOS source/application qualification explicitly uses the
supported native override; it does not claim Linux or Docker model acceptance.
The validation worker/source-manifest edits are independently owned and excluded
from this migration commit.

The final package/source lane passes 33 forced check/test/build tasks and 2,209
unique cases across eleven packages. All twelve fresh PWA, eight Rust-hosted and
one Node-hosted browser journeys pass. Native Markdown selected-source intake is
Source complete; task/custom processors and both host selections remain pending.
The source commit preserves independently owned validation worker changes.
