# Native refresh completed-pass observation

An R4 queue qualification run at `1f8440c0` passed ten queue cases, three
unchanged capture-parity cases and strict checks, then stopped in the complete
native suite at `native_indexing_authority::typed_projection_selection_preserves_queries_detach_and_explicit_disable`.
That binary passed four cases and failed one at line 121, `!refreshed.active`.
Queue source does not touch indexing, its tests or the service History lane.
The prior `a26d1c70` full source run passed all 599 ordinary Rust cases.

Root assigned the narrow indexing source boundary to this lane. The independent
workspace starts from immutable codec checkpoint `a3cbf03f`, without queue
implementation changes. Unchanged baseline/current exact reproduction and a
deterministic existing-Clock fixture are prepared; execution is waiting for a
shared worker slot. No assertion is relaxed and no passing baseline is claimed.

Read-only diagnosis: refresh waits for a completed requested revision, then
`control_indexing` separately reads current live progress. The existing watcher
can start another pass between those operations. The intended contract returns
the completed pass's progress for Refresh, while Status keeps observing live
progress. A native completed snapshot can use the existing completion channel;
no second scheduler, writer, DTO field or host activation is needed.

The unchanged original target passes 20/20 on both `a3cbf03f` and `1f8440c0`;
that does not waive the wider failure. The deterministic new fixture uses the
existing Clock seam, leaves the refresh future unpolled, and holds the next
real watcher pass active. It fails 0/1 at `f02d3c35` with unchanged indexing
algorithm bytes: `Explicit refresh must return its own completed pass, not later live activity`.
Receipts: baseline `db192d62`, candidate/unit `15a8adfe`. The first receipt's
candidate import failed before executing that stage; the second imported its
exact object ref and continued without rerunning the passed baseline.

The narrow repair sends the completed native status with its requested revision
on the existing completion channel. Explicit Refresh returns that snapshot;
Status still reads live progress. Existing callers that only wait retain their
unit-result helper. No protocol field, second actor, scheduler, writer or host
default changes. Exact before/after and complete source qualification follow below.

At `e606e0087e7c4dc38ca195f19ad276a94b44bf03`, exact deterministic
reproduction passes 1/1 after 0/1, all five original indexing-authority cases
pass, and strict boundary/protocol/fmt/all-target Clippy checks pass. Full
ordinary native/build/specification checks are running in receipt
`f71a7340-e19b-4da0-b8ca-3be6dd587f02`.

## Qualified source

Frozen source `e606e0087e7c4dc38ca195f19ad276a94b44bf03` passes every requested
source lane in `f71a7340-e19b-4da0-b8ca-3be6dd587f02` (exit 0, no OOM):

| Gate                                                    | Result                                            |
| ------------------------------------------------------- | ------------------------------------------------- |
| Exact deterministic held-next-pass regression           | 1 pass, 0 failures after 0/1 before               |
| Original complete `native_indexing_authority`           | 5 pass, 0 failures                                |
| Complete ordinary Rust workspace                        | 591 pass, 0 failures, 7 existing explicit ignores |
| Boundary / generated protocol / fmt / all-target Clippy | Pass, warnings denied                             |
| Locked Rust workspace build                             | Pass                                              |
| Generated migration progress                            | 107 tasks valid                                   |
| Canonical specification and governance                  | All ten lanes and 78 cases pass                   |

The single 4-CPU/12-GiB worker uses image
`sha256:9fa6f3fb3c8787ac38334c121bce350f005454b079e4dbe090d5c10a6d460be9`,
Rust/Cargo 1.99.0 and the private `lapis-notes-r4-capture-rust-20261027` target.
Its 16 public and six native archive inputs exactly match Root's final manifest;
complete source/input/tool/command receipts remain in the named validation run.
This repair commit contains no queue service implementation, protocol DTO,
History/state mutation or host/default activation. Queue acceptance and final
actual-host composition are separate gates. Only documentary qualification
updates differ from the tested source. Final documentary snapshot
`230ecd0d12d4990d274c3dcd0bfcdd1d7dc66e15` passes formatter, 78 governance
cases, 107-task progress and all ten specification lanes in
`df0f6016-6ced-409e-8da5-6cf9d3e91840` (exit 0, no OOM). This supporting
receipt annotation is formatted after that run; protected source/test/canonical
contract bytes remain identical.
