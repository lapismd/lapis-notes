# Native daily Task observation processing

Status: combined native daily Task observation processing source qualified.
Last updated: 2026-10-26T01:44:13Z. Migration task: R3.2.1.2.10.3.
Requirements: LN-CORE-003/005/006. Base: `974d0a39`.

This bounded stage reuses the existing admitted Tasks writer, source-owned
materialization/completion/scanner and qualified default daily-document ensure.
It adds no parser, scheduler, journal engine, Task advancement or host selection.
Original Task preflight, ordered persistence, typed partial outcomes and durable
recovery remain the following application stage.

## Frozen retained source

The complete 95-case repository trace is copied byte-for-byte from qualified
Tasks `a2e9f126afd54ab3e9f4418c5c41769bbf9876b0` to the native fixture.
SHA-256: `0d9de47410ffaba45a495c2df1b484c13b2a736a7f64c7263a1b4f8354732551`.
Eight LF/CRLF completion cases preserve complete objects selected from that
source's already-frozen `transformations.json`; original artifact SHA-256 is
`35b099569d7aa630380828891ca682f250e6d84126b45c9051ec6433f250dea8`.
No expected value is regenerated from the new native application code.

The daily-stage target replays 38 physical observation attempts: 33 successful
complete Markdown/returned-observation outcomes and five complete transform
errors. The retained injected JavaScript daily-write exception is counted
separately and is not executed by this source replay. Native dirty/alias/version
checks cover real denied publication; original first/second-write injection
and partial/cold recovery remain later application acceptance. Cases without
observation intent remain preserved in the unchanged trace, not claimed here.

Source custom/noncanonical provider presentation is a distinct boundary: the
noncanonical case invokes the explicit checked existing-file stage, retaining
its complete named source error. Default ensure cannot legitimately return a
noncanonical note. Other cases exercise default ensure, including existing
custom paths and a missing target. Exact Markdown and full observations,
including UTF-16 ranges, are compared; only JavaScript Number transport
representation is canonicalized on both full JSON operands, as in prior source
conformance. The Task source file must remain byte-identical throughout.

Guard acceptance additionally covers same-date no-op mtime/version/identity,
attached and detached dirty claims, hardlink aliases, stale versions, failure
after default creation, typed provider errors, and accepted work during
client detach and close/drain. Exact baseline target is `pnpm validation:rust --
test -p lapis-app-core --test service_daily_task_reference --test
service_daily_task_guards --locked`.

## Exact regression and implementation

The exact baseline fails in receipt
`c79643da-4eca-4757-b1c9-c24cbe8cd6b9`, reaching the missing native result,
error and processing methods with nine compiler diagnostics. All fixtures are
present; dependency installation succeeds; neither test binary runs. During
fixture authoring, selection initially used the input-only corpus and stopped
because it contains no expected values. It was corrected to the already-frozen
output corpus before this baseline, without generating any expectation.

After implementation, the exact same command passes all nine tests, zero
failures, in receipt `e4569546-f737-413e-89c9-48dc71ce0610`. The two reference
cases preserve all 38 executed daily outcomes and eight tracking-completion
outcomes. The seven guard cases cover changed/no-op dirty and detached states,
hardlink aliases, stale versions, typed provider failure, failed completion
leaving only the source seed, and accepted work after detach during close.

`Work::process_task_occurrence` composes the existing source transforms in the
existing guarded Tasks persistence helper. That helper retains one writer and
all prior guards while returning typed output alongside the exact published
snapshot; existing simple transformations still delegate to it. Default
processing uses qualified ensure and pins its returned content version before
entering this existing-file operation. Provider and write errors retain their
typed sources. No source fixture, source engine, native dependency pin, npm
input, Task advancement or host configuration is replaced by this stage.

## Complete source qualification

`pnpm check:all` passes in receipt
`aad6e7f5-539d-4586-9dff-229532cc486f`, finished 2026-10-26T01:34:57Z.
Product snapshot: `72f4289d818d0b695ee170f6ec482cd592d08b91`, parent
`974d0a39`. All 431 Rust cases pass, zero failures, six existing ignored cases.
This includes the original Tasks writer, dirty/alias/version and injected
between-transform-and-publication races affected by the private helper.
Native architecture/protocol, formatting, strict workspace/all-targets Clippy
and workspace build pass. All 20 package check, 20 test and 11 production
build tasks pass through unchanged-input Turbo cache reuse. No TypeScript,
Cargo/pnpm lock or native source pin changes need a consumer package refresh.

A separate byte/value audit verifies the copied lifecycle artifact equals its
qualified source byte-for-byte and all eight selected completion objects equal
the complete frozen source objects. The previous source archive cohort remains
explicit in the immutable Docker receipt; no new publication/intake is claimed.
The final specification gate is running after this record refresh.

## Final acceptance refinement

The first specification attempt `414b9193-9dff-457c-8a6f-dc48d53c649f` fails
with one `SPEC-FIRST-MISSING LN-GOV-003` diagnostic. New service-module changes
map to the root Rust application-services chapter as well as the detailed
indexing chapter. That root chapter now names the processing stage; no
requirement or checker is weakened.

Final review also strengthens the private reference test to compare complete
observation arrays for every retained daily snapshot and the entire eight-case
completion output objects, including repeated Markdown and repeated
observations. The fixtures and production implementation remain unchanged.
The strengthened exact target passes all nine cases, zero failures, in receipt
`d38b3a8b-0d24-4f8b-8a0b-b5790a09e0b9`. Full check/test/build and final
specification qualification are running again with those complete assertions.
Earlier passing counts remain recorded above rather than being replaced by the
stronger final receipt.

## Final source gate and remaining application work

The final `pnpm check:all` passes in receipt
`866a846c-8238-4ef2-a29b-8893b0bcfc63`, with all 431 Rust cases, zero failures
and the same six existing ignored cases. It includes the strengthened exact
reference assertions and corrected canonical chapter mapping. Strict native
formatting/workspace Clippy, protocol/architecture and workspace build pass;
all 20 package check, 20 test and 11 build tasks pass through unchanged-input
cache reuse. The final specification check passes on this qualified source.

Final product snapshot: `c4486adc388210a57f553444ff4a720d2bfef73b`, finished `2026-10-26T01:42:13.452Z`.

Ordered complete/skip admission, original-Task preflight before the first daily
mutation, retained partial outcomes and typed journal/cold recovery remain
unqualified. The next lifecycle source gate must also capture a valid duration
Task using its source-owned target-string shape: the retained 95-case trace's
`targetMinutes` Task YAML normalizes to no tracking. Those exact outcomes are
preserved here; valid duration observation completion is covered separately
by the unchanged LF/CRLF source corpus. Existing-owner tracked-today scheduling,
provider-owner configuration, both host selections and visible application
acceptance remain open. No independent engine or automatic retry is added.

Final `pnpm spec:check` passes in receipt
`666f11e9-c2c6-4880-8d34-488716edde79`: canonical validation, mdBook,
protected-source spec-first, App/query ownership and all 78 governance cases,
zero failures. The earlier missing-chapter attempt remains recorded above.
Only the timestamped activity/ledger and this evidence differ from the final
check/test/build product snapshot. The generator and final document formatting
checks pass after those evidence-only updates. R3.2.1.2.10.3 remains Working;
this source stage does not close its ordered application or either-host gate.
