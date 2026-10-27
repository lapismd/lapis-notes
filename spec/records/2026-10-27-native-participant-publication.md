# Native participant publication source checkpoint

Work starts in a new isolated Jujutsu workspace on committed queue transport
`079065a611ed59dd66ba73a442adc3e9f1b77689`. Desktop's clean `f276120b` source
and its canonical addressed-message/local-history contracts supply the retained
identity and outcome semantics. No Desktop or coordinator workspace is changed.
The older API 1,705-test source tree remains an independent source checkpoint;
final R3/editor/API composition and both-host qualification are not claimed.

`Conversation::write_transcript` currently reconstructs captured prior text,
one authored user and one assistant through one per-job revision. Removing the
single-job guard would give simultaneous participants competing snapshots. The
new source checkpoint keeps ordinary admission and FIFO behavior unchanged,
coordinates one publication owner, and reuses private RecordStore, TurnJournal
and the existing supervised execution port. Captured recipient tags never
supply launch, credential or provider-resume authority.

The first exact test is
`one_native_participant_owner_retains_authored_parent_and_independent_outputs_after_detach`
in `lapis-app-core --test native_participants`. Its explicit source-only port
is declared first with an unavailable refusal, so the missing participant
behavior can be observed before business implementation. The test retains one
exact authored parent and dispatch capture, separate delivery/request/binding
identities, two outputs and started/terminal attribution after client detach.
The baseline and its immutable source receipt are pending an assigned remote
slot. No implementation, provider or feature qualification is claimed yet.

The retained reference is generated from actual Desktop validators and
`deliveryEntry`, not a hand-authored expected-result mirror: 69 complete dispatch
and delivery validator outcomes plus seven full constructed outcome entries.
Six source files are byte-checked against `f276120b` and SHA-256-pinned inside
`tests/fixtures/participant-capture-v1.json`. The corpus SHA-256 is
`06618d279558de5736e226fc92962a0e6a382fe3fbb8d96d1761f9e37c59d4d0`.
Generation uses the installed public token SDK and a fixed clock; it does not
run product tests or providers. A reproducible source-checking generator accepts
an explicit absolute Desktop checkout; tracked product imports remain portable.

## Exact missing-service baseline

Frozen `d88b167a1e7625384835d50bdf466cb700f0df99` runs exact spec-first
successfully (five protected files/three chapters), then the named exact native
regression fails **0/1**, specifically at the new contract's `Unsupported`
refusal: `Native participant publication is unavailable`. This is a test-first
new service boundary; ordinary turn admission and publication are unchanged.
Receipt `eb455635-032c-4ea8-8059-62f93ef43b9d` ends at 2026-10-27 04:42:25 UTC,
exit one, no OOM, with no wider gate run and no provider launch. Business
implementation follows this observed failure; no replacement engine is used.

Exact command:

```sh
pnpm rust:core -- test -p lapis-app-core --test native_participants one_native_participant_owner_retains_authored_parent_and_independent_outputs_after_detach --locked -- --exact
```

First implementation snapshot `d6435b9fc31e004f88f82475bfd3d170d7d736a3`
passes exact spec-first (25 protected files/three chapters), then compilation
stops before any test on E0596: the new optional participant-store retirement
used a shared reference although retirement requires a mutable one. The binding
is corrected; no assertion or authority check changes. Receipt
`966fd800-a788-45b8-b4a4-6ba3ccdacbb3` exits one without OOM. The exact runtime
regression and affected parity/continuation targets rerun before broader gates.

## First runtime and compatibility pass

At `2607c38d916dcd92e56e57f999af903f6ef6f7cd`, the same exact native
regression passes **1/1** after the observed Unsupported 0/1 baseline. Original
native continuation/history cases pass 4/4, complete participant source parity
passes 2/2 (69 full validator results/seven constructed entries), and unchanged
queue compatibility passes 3/3. Receipt
`f56ee15c-38a6-4e86-be1a-4d8a7e1c8061` exits zero without OOM; exact spec-first
passes 25 protected files/three chapters. No broader source gate is claimed yet.

The expanded surface adds interleaved output and independent unknown/rejection,
all three external file-revision fences, consistent accepted/started cold
checkpoints, four equal-label/same-target participants, exact/changed retries,
invalid authority, per-delivery cancel, disable, active vault close and Quit.
Fresh explicit continuations also acknowledge exact unknown/not-sent outcomes
under the existing writer before replacing old pending metadata; cold queries
remain read-only for portable files. Checkpoints copy actual stable native and
portable bytes before draining, then reopen those bytes without live claims.
They do not fabricate a dispatch claim or replay a provider.

At `0b87f758205fef9a072001263e5d881461ee524d`, the original exact regression
and complete affected functional matrix pass, including ten participant cases.
Strict checks stop at one new `clippy::manual_contains` diagnostic in the
acknowledgment helper. No full native suite runs. Receipt
`f693a3ef-87e8-4230-a38c-fa8fc0223a4b` is retained, exit one/no OOM. The source
will use `contains` with diagnostics unchanged. Review also adds an exact
pre-start cancellation case before changing that worker gate: an unstarted
recipient must retain cancelled/no-prompt rather than a started unknown outcome.

The complete affected matrix at `0b87f758` is 54 passes, zero failures and one
existing explicit journal ignore across ten targets. The additional exact
unstarted-cancel case at `30b640ec50f67109b15b95f4a3273c566ee264ff` then fails
**0/1** as observed: actual `Unknown`, expected `Cancelled`. Receipt
`761a108e-d182-46bc-b840-7cb35847748a` runs only exact spec-first and that case,
then exits one/no OOM. The worker now settles a cancellation observed before its
started barrier as cancelled without calling the execution port or publishing a
binding association. Already-started cancellation remains unknown. A rejected or
unknown sibling fences still-unstarted deliveries as not sent; no extra queue or
scheduler is introduced. The rejected-sibling fixture explicitly waits until
both workers own their started checkpoint before allowing one configuration
refusal, so it tests independent in-flight outcomes without an admission race.

## Qualified native source

Frozen source `26dda0927e3e88b695625ec0f988ebed8a053a11` passes every requested
source gate in receipt `2c767b3d-b688-4c87-906f-501b71d699dd`, exit zero/no OOM:

| Gate                                        | Result                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| Original missing-service exact regression   | 0/1 Unsupported before; 1/1 after                                              |
| Exact unstarted cancellation regression     | 0/1 Unknown versus Cancelled before; 1/1 after                                 |
| Native participant ownership and lifecycle  | 1 original + 11 expanded cases pass                                            |
| Complete retained participant compatibility | 2 tests pass; 69 full source results and seven full entries                    |
| Unchanged retained queue compatibility      | 3 tests pass; 145 source results, seven configuration frames and five receipts |
| Complete affected native matrix             | 55 passed, zero failures, one existing journal ignore across ten targets       |
| Full ordinary Rust workspace                | 631 passed, zero failures, seven existing ignores across 121 targets           |
| Boundary/protocol/fmt/all-target Clippy     | Pass with warnings denied; six boundary-validator regression cases also pass   |
| Locked native workspace build               | Pass                                                                           |
| Migration progress and specification        | 110 tasks, all ten lanes and 78 governance cases pass                          |

The worker's final tree is byte-equal to its immutable source snapshot; no
tracked build mutation is retained. The only following edits are canonical
verification, the source-only tracker/evidence and UTC checkpoint. No product or
test byte differs from this qualified source. The fixed rejection fixture proves
independent in-flight completion; the pre-start gate preserves cancelled/not-sent
without entering the existing execution port. The existing ordinary/FIFO lane
remains exclusive, and no new queue, renderer writer or execution engine exists.

All workers use the pinned full image
`sha256:9fa6f3fb3c8787ac38334c121bce350f005454b079e4dbe090d5c10a6d460be9`,
4 CPUs/12 GiB and private `lapis-notes-r4-capture-rust-20261027` target. Each
immutable packet checksums its source and the same 16 public/six native archive
arrays as the coordinator's final input manifest. At most one owned worker runs,
with the shared four-worker inventory guard. Full revisions, input hashes, tool
versions, command results and logs remain in
`.local/validation/runs/lapis-r4-participants-<receipt>/` for each receipt above.
The participant corpus digest is `06618d279558de5736e226fc92962a0e6a382fe3fbb8d96d1761f9e37c59d4d0`;
the existing queue corpus digest stays `6ed23a01cd752407bffda19d85e91de2f79aeb278d6c4a5ebe4415fac63d944c`.

This is native source qualification on isolated `079065a6`, with configured real
protocol fixture processes, not an external provider or adopted host transport.
Current master R3 Complete (`dc03d375`), API `0e42` and native kernel `03b` remain
the coordinator's separate coherent cohort. Intake must preserve those newer
API/ledger changes and the separate R4.1 public queue-selection metadata work;
this slice adds no TurnTarget/protocol/UI metadata, defaults or host activation.
Only R4.2.1 becomes Source complete; actual participant hosts, provider resume,
rich preparation/tools and complete workflow gates retain their original scope.
Final documentary closure follows without repeating unchanged product suites.

Final documentary source `40dfbc554987ba274403080c150ddf6ad366ceca` passes
exact spec-first (30 protected files/three chapters), formatter, all 78 governance
cases, 110-task progress and all ten specification lanes in receipt
`dfdbe333-e8dd-4595-ae79-fa13203c455a` (exit zero/no OOM). Product and test bytes
remain identical to `26dda092`. Only this supporting receipt annotation and the
final activity/UTC stamp follow, with local formatter and generated-progress
checks; no functional lane is substituted or repeated.
