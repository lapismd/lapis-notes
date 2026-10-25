# Native Markdown Search owner source intake

R3.2.2.1 source work under LN-CORE-003/005/006 is qualified. The complete
Search scheduler, provider and host gates remain open under R3.2.2.

## Scope and source ownership

Native-only `VaultService::start_search_indexing` and `stop_search_indexing`
select the Markdown Search source on the existing admitted indexing owner.
Markdown-only startup remains unchanged. No HTTP/renderer command, DTO,
configuration surface or host default changes in this source phase.

Notes owns source reconciliation and publication policy. The existing database
owns Search normalization, chunking, configured inference, retrieval and atomic
publication. Markdown parsing stays in the sibling `lapis-plugin-services`
crate. No engine is copied and no JavaScript runtime is embedded.

The source uses bounded, body-free Search and metadata manifests. Matching
source hash, provider version, projection identity and file statistics skip
Search body hydration, preparation and inference. Missing Search cache rows
repair independently of unchanged metadata. Selected source reads verify the
admitted physical root and compare bytes again before publication; external
edits racing publication converge through the retained watcher/periodic owner.

Only `search:markdown` belongs to this Search source. Its reconciliation does
not adopt or prune foreign provider or unowned rows. Existing indexed-file
facade deletion effects remain unchanged. New Search admissions are fenced on
disable/close; admitted database operations retain their existing drain.

## Retained reference

Thirty-three fixture envelopes are verified against the retained public
SearchManager. Six reuse the source-owned Markdown parser corpus, including
Unicode/CRLF, frontmatter, invalid YAML and adjacent links; three reuse Notes'
complete normalized-metadata fixtures. Twenty-four cases place astral,
accented, combining, U+2028/U+2029 and mixed ASCII text at every 32-bit word
boundary, including JSON quotes, backslashes and escaped controls.

Native envelopes preserve the exact source provider/version, historical
checksum, filename including extension, tags, frontmatter, UTF-16 offsets and
chunking defaults. The native comparison adapts exactly two cache identities:
metadataHash remains the admitted native parser's existing UTF-8 source hash,
and projectionSignature includes that native parser version. Neither is
presented as raw JavaScript identity equality.

The retained API's historical MD5 packs JavaScript UTF-16 code units into
32-bit words. Its high bytes OR into following units and every fourth unit
drops overflow. Search checksum input preserves that packing and logical length
before calling the already-pinned MD5 0.8 primitive; no MD5 engine is copied.
The serialized envelope ends in ASCII so overflow cannot alter final padding.
Source metadata hashing deliberately retains the existing native parser identity.

The reference import needs Vitest to transform the public Search package,
including its CSS. The API test configuration inlines that dependency without
a source alias, private import or product workaround.

## Exact before and after

```sh
pnpm validation:rust -- test -p lapis-app-core --lib --locked services::indexing::search::tests::service::native_markdown_selection_reconciles_search_without_any_client -- --exact --nocapture
```

Run `3ed92d23-8500-41c1-83a4-5b1e875ec8f8` records zero passes and one failure:
selecting Search left zero documents. Run `e5dcdc6d-eaa0-4d8f-8115-0e02abcdbe36`
passes that exact case. Both filter 42 other library tests; they are not full
suite evidence. The earlier `9250d580` compile failure is retained separately.

The exact public reference command is:

```sh
pnpm --dir packages/api exec vitest run src/lib/__tests__/native-search-manager-reference.test.ts --maxWorkers=1 --reporter=default --reporter=junit --outputFile=/results/search-manager-oracle.xml
```

It runs through the established ignored pinned-snapshot worker with the same
validated source/archive/image receipts, four CPUs and 12 GiB. Cold run
`bab45c37-818a-4e85-b7c4-3c140998b565`, source `841d0b7d`, passes all 33 cases,
with zero failures/errors. Original run `61ffd5c9` retains nine assertion failures
that exposed filename and Unicode hash assumptions. Earlier CSS-load `7e326829`
and unsupported CLI `2b79b471` attempts executed no cases and remain failed.

## Validation and remaining gates

The complete native Search family passes all 13 cases in
`e622d973-3eb0-4a6b-85cc-65edf1e75062`; 30 other library cases are filtered.
The source tests cover
startup/enable-after-start, unattended create/edit/delete, unchanged revisions,
cache repair, foreign ownership, stale records, partial failure,
disable/re-enable, cold same-stat edits, hidden/symlink boundaries, periodic
repair, explicit deterministic embedding plumbing and close races.

The deterministic embedding case explicitly configures token-hash data. It does
not replace the actual ONNX provider gate. Complete provider registration,
configuration selection, checkpoint/progress parity, both application hosts,
real semantic-provider journeys and broader R3.2.2 acceptance remain pending.

## Complete source and final dependency cohort

`pnpm check:all` passes in
`lapis-notes-validation-389134ac-519f-4ffc-87b8-0d4979a1311b` on source
`da275938ee91cf84dfe2db8412e1e53ec84823dd`: 369 ordinary Rust tests/doctests,
2,253 unique package cases, full checks and eleven builds. Six unchanged native
model ignores and one frozen Deno integration skip remain explicit. The API
suite's 1,590 cases include the 33 retained envelopes; these are overlapping
counts, not additional unique tests.

That full run uses the earlier eight-archive cohort. Its product bytes equal the
final candidate except formatting of the JSON fixture, whose parsed value is
identical. The later R2 ancestry intake changes only tracking and verification
documents. This is complete source qualification, not final-cohort UI evidence.
The earlier `93e48540` stale-progress and `20c2d13d` Clippy attempts remain failed.
Exact repaired Clippy run `a5e7435c-0a8d-4d7c-968e-3b6ff869e7a4` passes all core
targets with `-D warnings`.

Final ten-archive qualification is
`lapis-native-search-api-final-1fa1690e-6b6e-4ebf-840d-c2e55f3836ee`, source
`342a84655659ff742030286f8dffc77db6a4a45d`. Fresh commands pass the exact
33-case public oracle, API build/publint/contracts, API check, all 1,590 API cases
and all 13 native Search cases. Both XML reports have zero failures/errors.
The native family filters 30 other library cases. Every command executed fresh.

The selected manifest is
`lapis-notes/.local/validation/final-admission-all-select-20261025/archives.json`,
SHA-256 `5455fdfdfc3e4c2693eda34b8f49f9ed5d4b4e386fd76ee419dfb07d160218b6`.
It contains ten actual checksum-verified package archives, including Design
Core, the five Mira packages, Bits and Bases. The older eight-archive manifest's
SHA-256 is `8b1476a2fa787a8637f666bc176ce0de2a84302d0aaf403ff4b2ab312010dc9d`;
it is not presented as the final cohort. Public Search/API archives are identical
across them. The final pinned image is
`sha256:9fa6f3fb3c8787ac38334c121bce350f005454b079e4dbe090d5c10a6d460be9`,
with four CPUs and 12 GiB. The worker validates the source pack, actual checkout,
archive checksums and manifest identities, then restores source manifests/lock.

Initial final-cohort specification run `cc834003-0b14-44ae-8d33-3dfe2a01007a`
passes validation/progress, protocol, boundaries, mirrors and mdBook but fails
spec-first because the new API reference test lacked its mapped package chapter.
The package chapter now documents the public oracle and cache-identity boundary;
no product or protected test change is required for this repair. Final
specification/progress qualification passes in canonical run
`c5c1fcdc-4a76-4be0-baaf-acd349d8c03b`, with all 78 specification regression
cases and zero failures. The exact spec-first failure is closed. The complete
canonical lane includes the progress generator, protocol, boundary, mirror,
mdBook, App-ownership and metadata-query checks. Local immutable result,
log, input and XML receipts live beneath `.local/validation/runs/`; source and
archive equality plus retained failure hashes are captured in
`.local/validation/native-search-source-equality.json`. Source qualification
changes no host selection and does not prove native UI, installation,
publication, deployment or final product parity.
