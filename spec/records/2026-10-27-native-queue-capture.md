# R4.1 retained queue capture compatibility

Status: R4.1.1 source complete. Exact parity, strict checks, full Rust tests,
build and final document/specification qualification pass. R4/R4.1 remain Waiting
on the R3 live gate. R4.1.1 is source-only work,
not end-to-end queue completion, native dispatch or host controls.

Source parent: Notes `9c9705f09a049db5ce3263f91b4805fb98f31aed`.
The retry uses stable duplicate `6d40139ac5aa2233283c1191b04ea48c91c96511`;
its tree is byte-identical to that parent, preserving the final tooling fix
without inheriting future documentary ancestor rewrites.
Retained reference: Desktop `f276120b30395860aebed67362bfb320ded6f22c`.
The generator exports that exact immutable validator/import closure to a
disposable temporary folder, executes the unchanged TypeScript with its public
mention-codec dependency and removes the folder. No renderer scheduler is copied
into Core, and production requires no JavaScript runtime.

The source fixture contains 145 complete validator outcomes (62 accepted,
83 refused), five constructor receipts within that corpus and seven ACP
configuration frames captured from the unchanged source through a recording
test port. No provider is started or qualified. Complete accepted captures and original errors retain
omission semantics, existing unknown-field policy, explicit default thinking,
per-recipient choices, comments and original path strings. Queue capacity is
measured from source at exactly 131,072 accepted bytes versus 131,073 refused;
comment capacity similarly captures 65,536/65,537 bytes. Fixtures cover the
16/17-item and comment-block, 64/65-comment, four/five-recipient and eight/nine
attachment boundaries, UTF-8 text/instructions, UTF-16 path/model/mode/range
bounds and code-point profile/label bounds.

Original source hashes, public mention codec hashes and generator/input hashes
are embedded in `crates/lapis-app-core/tests/fixtures/queue-capture-v1.json`.
Current fixture SHA256:
`6ed23a01cd752407bffda19d85e91de2f79aeb278d6c4a5ebe4415fac63d944c`.

Exact reference capture/recheck:

```sh
PATH=/Users/stevejuma/.nvm/versions/node/v24.10.0/bin:$PATH node crates/lapis-app-core/tests/queue_capture_reference/capture.mjs /Users/stevejuma/code/lapismd/lapis-desktop
PATH=/Users/stevejuma/.nvm/versions/node/v24.10.0/bin:$PATH node crates/lapis-app-core/tests/queue_capture_reference/capture.mjs /Users/stevejuma/code/lapismd/lapis-desktop --check
```

Both pass with byte-identical full results. The first generator attempt failed
before writing a corpus because the public mention package has import-only
exports; source capture succeeded after resolving its declared import entry.
No product behavior or expected result was changed for that tooling repair.

Core owns strict validation of this retained application data in
`turns::queue_capture`. Validated values have no execution, credential, native
binding, admission or file capability. No protocol command or transport DTO is
added. Retained receipt decoding preserves the existing permissive ID/parent
checks; a separate pure constructor produces correctly related capture and
authored-parent identities without a dispatch claim.

Prepared exact native target:

```sh
pnpm rust:core -- test -p lapis-app-core --test queue_capture_parity --locked
```

Three tests compare complete source outcomes and encode round-trips, complete
actual configuration frames, and all five constructed terminal receipts. The
first frozen worker `lapis-r4-capture-15b1b19e-3f25-45a4-afb0-eb23c744f02a`,
source `edc3b360806bcd4163bd66cee3593e314fb89157`, passes all three tests with
zero failures/ignores. Its strict `pnpm check:rust-core` then finds one new
`chunks_exact_to_as_chunks` diagnostic in the token decoder (reported for both
lib targets). The repair uses `as_chunks::<2>().0.iter()` without a lint waiver.
Full test/build/spec gates did not run after that strict failure; a frozen
exact-first retry followed. The receipt/logs are retained under
`.local/validation/runs/lapis-r4-capture-15b1b19e-3f25-45a4-afb0-eb23c744f02a/`.

Retry `lapis-r4-capture-23ee81a7-5bb9-4ec8-aa4f-75165cd06fa2`, frozen source
`90ed10d2ee88e93035e81c58da5c229e37760ee2`, passes the exact three tests again,
`pnpm check:rust-core` (boundary, generated protocol/TypeScript, format, strict
Clippy), all 590 ordinary workspace Rust tests with zero failures and seven
existing asset/provider ignores, workspace build and progress (106 tasks).
Strict finding count moves from one to zero without a waiver. Its final
`pnpm spec:check` reports two navigation findings for the new chapter: missing
Storybook mirror and inline order. The same contract now lives in the existing
turn-admission chapter, retaining its current mirror/navigation and avoiding a
shared Storybook configuration change. No checks are weakened.

All Rust, tests, fixture and reference-generator bytes remain identical to this
fully tested retry after that document-only repair. Final worker
`lapis-r4-capture-3e949630-8c1d-423b-af2c-b3a27f46c24a`, frozen source
`c79f5260790f7601d49056db6c37e3db44aac111`, passes changed-document formatting,
all 78 canonical governance cases, progress and all ten specification lanes,
including protocol generation, Core boundary regressions, view-command and
Storybook-structure audits, mdBook and spec-first. Navigation finding count
moves from two to zero; no Storybook config or mirror is changed. Subsequent
edits only record these outcomes and the source-only child status/UTC ledger.
Node 24.15.0, pnpm 10.34.5 and Rust 1.99.0 run in the
frozen Linux worker; original TypeScript capture uses Node 24.10.0.

Remote inputs compare equal to final R3's sixteen public and six native archives.
One four-CPU/12-GiB/2-GiB-shared-memory worker uses a private mutable Rust target,
sharing only the admitted package/Cargo registry stores with the live R3 worker.
Local Cargo formatting refused the missing workspace-relative
`jj-store` manifest before compiler execution; direct rustfmt succeeded. The
checkout initially lacked pnpm dependencies, so local formatting uses an
existing released formatter tool, not runtime package/source aliases.

The native source, strict/check/test/build, protocol generation and specification
gates are complete for this checkpoint. No native queue scheduling, application
commands, HTTP/renderer controls, publication, consumer intake or default change
is part of this checkpoint.
