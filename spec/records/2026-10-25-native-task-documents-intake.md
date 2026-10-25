# Native complete Tasks projection intake

Status: source-qualified in isolated Notes workspace `native-tasks-index-20261025`;
both application adoptions remain waiting.

Last updated: 2026-10-25 22:39:23 UTC.

This R3.2.1.2.9 source intake rebases the isolated slice onto Notes `27eaa851`
and consumes Tasks
`fcb2a8b514d68464034173e2aed886133d2a2e99` directly. Tasks default is clean and
byte-identical to that qualified source; the two earlier Tasks workspaces are
preserved. No business algorithms or reference fixtures are copied into Notes.

The bounded source slice binds an admitted physical-vault snapshot and existing
native link lookup to the qualified parser, row/recurrence, document structures,
whole-vault graph and projection envelopes. The existing native indexing worker
will publish the existing public Tasks schema and rows, prune sources, observe
watch/local-date refresh and drain on close. Core metadata remains independent.

The service and native database read wiring are private Rust policy. Neither
host default, public wire/config API, renderer scheduler nor authored Markdown
changes. Mutations, daily materialization and both application adoption gates
remain separate.

## Exact source acceptance

The before command is
`pnpm validation:rust -- test -p lapis-app-core --lib services::indexing::tasks::tests --locked`.
On source `f728f176`, run `0a3d37f6-91c9-46b1-8237-53a5be455a0e` reports
10 missing-private-selection compiler diagnostics; zero tests execute.

The identical command on source `c999d4d4`, run
`8fe800eb-1523-439e-b162-a192f86b9ecf`, passes seven real-vault tests with
zero failures. They cover exact public rows/core metadata separation, dependent
target/graph refresh, admitted basename/hidden/symlink policy, repair and
revision idempotence across cold reopen, disable/re-enable, concurrent close and
local-date rollover without client or file mutations. A later exact run on `5e4b3a52` (`679c4fe2-409f-4f04-ba82-39ac92438a74`)
passes nine cases, including changed manifests/bytes and a deleted enumerated
source remaining pending without partial rows.

The additional exact binary-target command is
`pnpm validation:rust -- test -p lapis-app-core --lib binary_attachment_targets_are_unsupported_and_keep_exact_byte_freshness --locked`.
Before the adapter fix, source `5f69d2b0`, run
`6ea66aa8-145b-4138-9529-5c9642c94252`, reports zero passes and one failure:
strict text decoding rejects an otherwise admitted binary attachment. After the
fix, run `9c33e66b-717d-47a7-956b-a35792b948fc` passes one test with zero
failures. Unsupported non-Markdown targets use the retained App text decoding;
all snapshot freshness compares exact original bytes. Markdown remains strict
UTF-8. The complete Tasks target and full repository gates pass below.

The prior strict Rust gate (`63a58e0e-ca03-4b97-a8ad-a0f36cbd3fc8`) passes
boundaries, generated protocol/TypeScript, rustfmt and complete-workspace
Clippy with warnings denied. Its result predates the binary-target fix and is
supporting evidence; the final complete run below supersedes that source gate.

No npm/HTTP/Tauri wire, host default or generated protocol binding changes.
The test-only private selection invokes the same production owner path. Native
Task path and child reads use that projection only when its persisted exact
native configuration is active; stale sources do not fall back to old caches.

The final exact complete Tasks command on source `468a9828`, run
`b3217929-5106-452a-b070-5bfde0b239b3`, passes all 10 tests with zero
failures. The full repository gates also pass below;
host intake and default cutover remain unqualified.

## Full source qualification

`pnpm check:all` passes on source `d2d23a9e`, run
`23fad5f7-1c7b-4b86-a60d-a2db4073dd35`: complete repository checks,
356 ordinary Rust tests, 2,220 package tests and all Rust/package builds.
There are zero functional failures. The six existing Rust ignores comprise
five opt-in qualified-ONNX cases and the isolated crash-process helper; the
frozen Deno agent-runtime integration retains its one existing skip.

The first complete-run attempt (`a4d8bf01-7d75-45b7-97f5-0df9f39d6a55`)
stopped at two rustfmt layout findings and ran no functional tests. Both exact
findings are corrected in the passing complete run. No assertion or expectation
was loosened. Final progress/specification qualification precedes commit.

The generic database/protocol/public host selection surface is unchanged.
The existing Markdown cancellation check and repeated-selection no-op behavior
are retained. No authoritative note, Tasks mutation, daily materialization,
provider, renderer or application default is changed by this source slice.
