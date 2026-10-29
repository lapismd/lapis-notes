# Native History read-only lifetime

R3.2.3.2 preserves LN-CORE-003/006/007/008 and the existing historical Search
contract: pausing capture retains read access and rebuilding its disposable
cache cannot capture unsnapshotted files. This is retained migration scope,
not another History engine. It supersedes the capture-bound lifetime recorded
at `cef143cf`; that earlier source qualification remains historical evidence.
Both host selections remain off.

## Exact boundary

`services::backup::history_tests::paused_capture_retains_the_native_history_index_owner`
starts real backup/indexing, pauses capture, then reads cached owner status.
The unchanged baseline in Docker run
`155c9b5f-d1c6-49b5-b7a2-e349b1bb8301`, source `d0bca2c3`, reports zero passes
and one failure: History becomes Unsupported after capture stops.

The same exact command
`pnpm validation:rust -- test -p lapis-app-core --lib --locked services::backup::history_tests::paused_capture_retains_the_native_history_index_owner -- --exact --nocapture`
passes one case, zero failures in run `21b032d8-bc10-427b-ad5e-981ec131a6bf`,
source `42188bc8`. That intermediate repair still retained a redundant backup
reference; the final source removes it and keeps ownership in VaultService.

## Implementation and qualification in progress

One native index owner is retained by the vault. Backup publication supplies
wake notifications but does not own its lifetime. Explicit Rust-only
`start_history_indexing` and `stop_history_indexing` admit/drain derived work;
the existing status API remains passive. The user's latest standing instruction
authorizes logical implementation/API choices without further confirmation.

Every batch resolves the current installed layout using only Storage status and
binding reads. It rejects pending transitions, revalidates physical roots and
never runs Storage recovery, repository initialization, capture or relink.
Selected backup startup reuses this same owner. Pausing capture retains it;
feature disable and successful vault close join it. Failed final capture retains
both original services for repaired close.

Final qualification adds a cold cache-loss case with capture paused, no clients
and unsnapshotted saved edits; it checks the original checkpoint and excludes
the new disk bytes. A new-vault read case verifies that neither a repository,
layout record nor index cache is initialized. Full source results follow.

Two local `pnpm rust:core -- fmt --all` attempts could not resolve sibling paths
inside the isolated authoring workspace and did not format product code. Direct
rustfmt formats the changed native modules without loading sibling manifests;
canonical locked checks run inside the isolated Docker snapshot with pinned
sources. No package path alias or dependency override is committed.

## Narrow and structural follow-up

Final native History acceptance run `b0b65751-7879-4f75-847e-b86b85c85f90`,
source `4828e4bb`, passes all ten real-checkpoint cases with zero failures.
The first complete source run `4a1bddf8-91ec-46c8-8013-887cda3d290a`,
source `951701a2`, stops on one existing boundary rule: inline test modules
under `src` have the production 300-counted-line limit. The new cold/read-only
cases are now grouped in `history_tests/read.rs`; the original paused-owner test identity and all assertions remain unchanged.
The first split still exceeded the inline limit by three counted lines in run
`8d671b86-39b8-4e47-a07a-9a1d30f7cd08`; the existing cold-rebuild case now
shares `history_tests/read.rs` with the new read-only cases. No limit is changed.

## Complete source gate

`pnpm check:all` passes in immutable Docker run
`9183b495-b8bc-4048-8c7f-175b974b8120`, source `9aad4423`.
The native gate passes all 380 Rust cases, zero failures and six unchanged
model-dependent ignores across 87 target/doctest summaries. Five boundary
regression cases pass. Strict locked Clippy, formatting, generated protocol,
source ownership checks and all 20 package check tasks pass. All 20 package-test
tasks pass: 2,253 unique package cases and one unchanged Deno skip. All 11 build
tasks pass.

No UI, Storybook configuration or host adapter changed in this source slice, so
the full native source/package gates are the complete changed surface. Actual
Tauri/HTTP adoption, passive renderer observation and native application
acceptance remain separate; Desktop intake is now being implemented in parallel.

`pnpm spec:check` passes at source `6b69b24a` in run
`51d93cb2-40a8-43ec-a107-c9e955745e3d`, including spec-first, source ownership,
mdBook/navigation and all 78 specification regressions. Final local tracker
regressions pass 11/11 and formatting passes. An initial mistyped local tracker
test path ran no cases; the corrected canonical path supplies that 11/11 proof.
The final delta from the qualified native tree is tracker/evidence prose only;
all eleven final native implementation/test paths remain byte-identical.

R3.2.3.2 is Source complete. R3.2.3 stays Working: Desktop's passive observer
and relocation adapter are in an isolated consumer workspace; HTTP selection
and both complete application acceptance gates remain. No host default, native
engine, repository format, UI or installed application changed here.
