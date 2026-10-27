# Shared native chat queue adoption

Status: active source implementation; actual hosts and provider acceptance remain
separate. No ordinary host or AI default has changed.

The source preparation `079065a611ed59dd66ba73a442adc3e9f1b77689` is selectively
composed onto current R3 Notes `406aa3d158e77e05c557dcef4b21cbb3c1ea12f9` in
`r4-chat-queue-20261027`. Every restored existing product path was byte-identical
to the preparation parent before import. Current R3 editing/recovery/API bytes
and all 104 ledger rows were preserved. Old planning/status files were merged
selectively, never restored wholesale.

## Exact baselines and current proof

- Frozen snapshot `4c1a345d64de6eef229524252fb224074fb2570e`, worker
  `97cf1db3-0367-4f69-8194-d1e987757ea4`: three session and two HTTP queue cases
  fail at missing methods. Both exact commands run independently; five failures.
- Snapshot `c5bbba286ef4be71f73289dbadd42a159db60e06`, worker
  `9163e707-451a-42a1-89ce-b399d858030b`: three queue-session, four new observer
  and 23 existing R2 observer cases pass (30 total), plus both HTTP queue cases.
  Full current source/package/host gates are not implied by those 32 passes.
- Hosted metadata adapter baseline `e2eb9622489c572ceba97519e22c92536772be32`
  could not load the public API AppDatabase dist export. This is a missing build
  prerequisite, not a product failure. The rerun builds the real API dependency
  closure; no alias or source replacement is used.
- Snapshot `d7cfdf69e9d69dedd94c0fefd0a7b4cbe227c0f7`, worker
  `eb28d243-35f8-4805-add1-655f40469b91`: all four API dependency build tasks
  pass; both exact hosted metadata cases then fail at the missing queue port.

The exact commands are `pnpm --filter @lapis-notes/app-profile exec vitest run`
with `src/native-chat/queue-session.test.ts`, `queue-observer.test.ts` and
`observer.test.ts`, and `pnpm --filter @lapis-notes/web exec vitest run` with
`src/hosted/rust/queues.test.ts` or `native-chat-queue.test.ts` respectively.
The frozen source, ancestry, six native pins, 16 existing public archives and
worker receipt remain in the checkout-owned `.local/validation/runs` records.
UI-only workers restore no native sources because those tests do not run Cargo.
- Protocol metadata exact-before `0538f112ecdbffac1993c51c2e7f19fae71bb40d`,
  worker `0eb549f8-0463-4132-a5f0-47bbfa40aada`: one test fails on the exact
  `unknown field queue_selection` boundary after successful native compilation.
  The shared Cargo target was then released for R3's canonical closure.

## Boundaries and remaining work

The optional host queue port supplies admitted commands plus complete declared
recipient and selection data. The shared constructor adapts frozen Desktop
`f276120b` plaintext capture semantics, without importing a renderer scheduler or
generating tokens from display names. Core remains the compatibility validator,
writer, FIFO owner and dispatch/recovery authority. Acceptance, capture, authored
user and native dispatch identities stay distinct. Missing declared selection
preserves R2 idle continuation and busy refusal before any queue mutation.

Operator metadata producer, native wire/source gates, current full source suites,
cold catalog and hosted browser journeys remain active work. Desktop's Tauri
bridge, actual WebView and provider acceptance have their own consumer evidence.
Rich payloads, participants, tools and later R4 requirements stay separately
tracked. Publication, delivery and default cutover remain outside this slice.

## Native producer and current source qualification

Frozen source `766276f4d12ed15ce53fc47f9ca0f057241118b3`, worker
`5d947c7b-d060-4014-a971-899a281e275f`, finishes successfully at
2026-10-27 05:24:24 UTC. Protocol metadata and operator admission pass one case
each; shared queue/session plus existing observer pass32; admitted Web chat/queue
transport passes9 (43 focused cases total). AppProfile and all Web strict lanes
pass with zero Svelte errors/warnings. The complete native workspace passes620
cases, zero failures and seven retained asset/provider ignores. Generated DTOs
and Rust formatting are copied back with per-file SHA-256 checks. No claimed
actual-provider or source catalog acceptance follows from this receipt alone.

The isolated source change is rebased onto the master R3 completion `dc03d375`.
Only current documentation/status conflicts were reconciled, preserving all104
original task IDs and every newer R3 verification fact. Seven child checkpoints
now mirror existing R4.1 scope (111 total rows), separating source completion,
shared host work, Tauri work and combined host/provider acceptance.

A screen-wiring audit then finds that `AgentUiController.action` gates commands
against capabilities. Snapshot `b16ec77b0afe4fb7ddd314ba10ce466dff418a42`, worker
`c1529eda-08f2-4126-ae58-ad9eec5b7791`, records one exact failure in
`queue-observer.test.ts -t "routes Stop"`: queue methods exist, but cancel/pause
capabilities are absent. The repair advertises the retained controls, reflects
native queued execution in busy/Stop and keeps sending unavailable while a
pending queue is paused. This is presentation admission, not another scheduler.

The subsequent full source run remains active; its exact/public-package,
canonical, catalog and actual hosted results will be appended after completion.
