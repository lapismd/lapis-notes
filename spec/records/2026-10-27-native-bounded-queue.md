# Native bounded queue source checkpoint

Native-only source is qualified at `1bb7df17df231284717e5e438fb9b45b969c3b59`
over independently committed R3 indexing repair `cf7bf949`. The isolated R4
workspace began at codec checkpoint `a3cbf03f`. R4/R4.1 remain Waiting on R3
and actual both-host/end-to-end gates. No transport or host controls are added.

## Source contract

Core retains one vault turn owner, one active execution lane, the existing
RecordStore/TurnJournal, injectable ACP execution port and guarded portable
conversation writer. Queues use a separately locked private profile directory.
Admission retains complete captured values, independent acceptance and
dispatch UUIDs, original authored IDs and explicit provider-default omission.
Unsupported rich captures are refused before acknowledgement. Native target,
current default metadata, physical scope, continuation and writer guards are
checked independently of the compatibility codec at admission and dispatch.

Accepted live work owns a native lease through detach. Advancement follows
confirmed cleanup and terminal publication. Stop, disable, close, failed or
unknown delivery and publication conflict pause advancement. Cold recovery
pauses all queues; started entries become unknown and never replay. Explicit
resume acknowledges the exact current native head and dispatches only pending
entries. Terminal receipts use the existing writer or an idle-lane conditional
publication. Retention is bounded without eviction (128 entries, 8 MiB per
conversation, 256 conversations); pending captures retain the 16/128-KiB bounds.

## Qualification

The new source gate had no executable FIFO implementation at the checkpoint.
The first exact execution at `3d0a2a97` stopped on three visibility compile
errors before any tests ran (`7a26494c` receipt). No wider lane ran. The private
store visibility is repaired without changing the public or transport surface;
the same exact target was rerun. At `6ad44eed`, two tests passed and one new
raw-wire assertion failed before the recovery file ran. The pinned AI runtime
`6548afe0` represents typed `None` as private ACP `effort:null`; Control V3
maps that to `None`, and runner configuration makes provider calls only for
`Some(effort)`. The assertion now checks this exact private representation,
typed `None` and retained `default`; the frozen Desktop omission oracle remains
unchanged. No upstream runtime or provider contract changed.

At `49cdec23`, all nine exact tests and all three unchanged parity tests pass.
Strict checks then found two iterator-efficiency Clippy findings in the new
test (`last` on double-ended iterators); no wider suite ran. Both are repaired
without exemptions. The detached test now cold-reads exactly the two authored
entries before its optional continuation, and exercises the lost private
terminal-acknowledgement boundary. Cold recovery reuses durable terminal
journal outcomes and never replays a started entry.

- `pnpm rust:core -- test -p lapis-app-core --test native_queue --locked`
- `pnpm rust:core -- test -p lapis-app-core --test native_queue_recovery --locked`
- Original three `queue_capture_parity` cases and frozen fixture remain unchanged.
- Final strict, complete native test/build and specification results are recorded below.

Ten exact tests cover all-client detach, cleanup ordering, FIFO, authored IDs,
receipt preservation, lost replies, competing clients, count/byte capacity,
rich refusal, Stop/native cancel/disable, target/default revalidation,
failed/unknown/cancelled barriers, cold explicit resume, started no-replay,
scope/dirty guards and external transcript conflict preservation.

The History mutex repair is a separate source slice owned by Root. Aggregate
qualification after its integration remains a separate gate.

At `c1c65eaaa9e9b1708b5828d062bc81ac1ca664c0`, the strengthened nine exact
service cases and all three unchanged parity cases pass. Strict checking in receipt `5d7b638f-0a66-4ddc-b7f7-35f1c8588851` then
requested `rfind` rather than `filter().next_back()` in the same two test
lookups. Those are fixed; exact tests precede the next strict/full run.

At `a26d1c7051b904d3d432d2762722f86678f30b01`, strict checks, all 599
ordinary Rust tests (zero failures, seven existing ignores) and workspace build
pass. Specification checks stop at the missing mapped services-chapter update;
its existing queue reference is updated without growing the 400-line page.

Final review reproduces one native authored-ID regression at `521ebcd9`:
`queued_authored_identity_must_not_alias_portable_entries_or_its_own_receipt`
fails 0/1 because both a prior portable message ID and the capture's own receipt
ID are accepted. Native admission now refuses those aliases before acceptance
and rechecks current portable IDs before dispatch; compatibility decoding and
its frozen corpus remain unchanged. The exact test runs before the expanded ten
service cases and all broader source gates.

At `1f8440c0cafdad3cef6cdd76d0241844b0f5c3ef`, the exact identity regression
passes 1/1, followed by all ten queue service cases and all three unchanged
compatibility tests. Full strict/native/build/specification checks are running
in receipt `b77f40dc-fdb6-4980-bab5-8f336f2ca24b`.

The `1f8440c0` broader run passes strict checks, then stops at
`native_indexing_authority::typed_projection_selection_preserves_queries_detach_and_explicit_disable`:
four cases pass and one fails at `!refreshed.active`. Prior completed binaries
pass 303 tests with six existing ignores; the remainder does not run. Indexing
source/tests are byte-identical between `a3` and `1f8440c0`. Root assigns a
separate isolated R3 completed-refresh observation repair; this is not waived.
Unchanged `a3` exact repetition passes 20/20; deterministic later-pass overlap
and current-candidate reproduction continue before combined qualification.

The independent R3 indexing repair is committed separately as
`cf7bf94990d26e903e34ec9921054cff07ab6a63`, with deterministic regression
0/1→1/1, all five original authority cases, full 591 ordinary Rust tests,
strict/build/all specification and 78 governance cases qualified. Its final
documentary closure also passes. Queue source is rebased onto that committed
repair; queue implementation/test bytes remain identical to `1f8440c0`.
Combined source qualification resumes before this R4 source commit. Neither
overall R4/R4.1 status nor host/default selection changes.

## Qualified native source

Frozen combined source `1bb7df17df231284717e5e438fb9b45b969c3b59` passes every
requested source lane in `739a12b8-1fc7-41d3-be9a-9ecae6d06091` (exit 0,
no OOM), without further queue product/test changes after `1f8440c0`:

| Gate                                          | Result                                                                                   |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Exact authored-ID alias regression            | 1 pass, 0 failures after 0/1 before                                                      |
| `native_queue` / `native_queue_recovery`      | 3 + 7 pass, 0 failures                                                                   |
| Unchanged `queue_capture_parity`              | 3 pass; all 145 complete frozen outcomes, 7 configuration frames and 5 receipts retained |
| Complete ordinary Rust workspace              | 601 pass, 0 failures, 7 existing explicit ignores                                        |
| Boundary / protocol / fmt / all-target Clippy | Pass, warnings denied                                                                    |
| Locked Rust workspace build                   | Pass                                                                                     |
| Generated migration progress                  | 108 tasks valid                                                                          |
| Canonical specification and governance        | All ten lanes and 78 cases pass                                                          |

The single 4-CPU/12-GiB worker uses the existing full image
`sha256:9fa6f3fb3c8787ac38334c121bce350f005454b079e4dbe090d5c10a6d460be9`
and private `lapis-notes-r4-capture-rust-20261027` target. Its 16 public and six
native archive arrays exactly match Root's final input manifest. Full source,
input hashes, command results, tools and logs are retained in the named run.
The frozen corpus SHA remains
`6ed23a01cd752407bffda19d85e91de2f79aeb278d6c4a5ebe4415fac63d944c`.

The detached fixture holds the first configured-binary protocol turn, accepts
the next capture durably, detaches every client, verifies terminal publication
and prior process cleanup, dispatches the second exactly once, then cold-reads
exactly two authored entries and one complete receipt. Optional continuation
also verifies receipt data is excluded from handoff instructions. A separate
cold fixture never replays a started/unknown entry and resumes only its pending
successor. Cancellation receipts remain privately durable while publication
would race an active writer; idle publication uses exact versions.

This commit's queue product delta is separate from the independently committed
R3 repair. It adds no HTTP/renderer command, wire DTO, replacement UI, host
activation or default. Rich capture/participants/tools and both actual hosts,
providers and end-to-end gates remain separate; R4/R4.1 stay Waiting on R3.
Only documentary qualification updates differ from the fully tested source.
Final documentary snapshot `a702ef70a613b8194042e770448cb0dd83836858` passes
formatter, 78 governance cases, 108-task progress and all ten specification lanes
in `9494c4c0-1149-4d41-b547-b835bdc89f7e` (exit 0, no OOM). This supporting
receipt annotation is formatted afterward; protected source, tests and
canonical contract bytes remain identical.
