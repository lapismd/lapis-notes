# Native turn activation — R2.2.3 source checkpoint

Parent source is Notes `d80a22ca`; Desktop remains `6c9e55f7`, with no native
chat selection yet. Lapis AI remains unchanged at `6548afe0`. This is part of
the existing R2.2.3 host-adoption scope, not a new migration gate.

Before changing a host's selected chat owner, explicit plugin disable must fence
new submissions and cancel/drain accepted workers independently of the response
waiter. Reload and observer detach retain accepted work. Core serializes enable
and disable, keeps retained queries and exact duplicates readable while disabled,
and never replays work on enable. Failed cleanup reports failure and retains the
fence and work lease rather than declaring success.

## Exact regression

`CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 RUST_TEST_THREADS=2 pnpm rust:core --
test -p lapis-app-core --test native_turn_activation --locked` initially reports
three failures: the strict wire decoder has no `set_enabled` variant. The first
implementation then reports one E0308 at a temporary MutexGuard. Holding and
dropping an explicit guard fixes the compile error. The three-case target passes
(2.27s), including disabled retained clients, cancellation/drain and losing the
disable response waiter. The repeated three-case target passes (2.50s). The complete affected native
execution, conversation, continuation and journal families pass 32 ordinary
cases, with the retained crash helper ignored. The existing startup-uncertainty
case now also proves failed disable, failed re-enable, retained work and
readable exact duplicates without launching another worker.

The existing failed-owner submit refusal remains BUSY. Feature disable/enable
itself reports IO when cleanup cannot be confirmed. Neither path authorizes a
new worker. Actual Tauri/HTTP screen adoption and provider/cold-application
acceptance remain unfinished R2.2.3/R2.3 gates.

## Wire and HTTP

The exact new HTTP case,
`hosted_disable_fences_retained_clients_without_affecting_another_vault`, passes
(1.32s). It uses the actual authenticated Rust server, confirms retained-client
refusal as HTTP 501/UNSUPPORTED, preserves duplicate reads, leaves another vault
available and proves re-enable does not replay work. A later explicit fresh
submission completes normally. The strict wire fixture covers boolean-only
activation and rejects native launch authority. Full workspace qualification
is running; this checkpoint does not claim host/screen adoption.

## Selected-tree specification isolation

The main checkout's unrelated in-progress `editor-apis.md` and `pkg-01.md`
remain excluded. Main `pnpm spec:validate` reports the existing five-sentence
LN-PKG-004 error. A temporary JJ workspace validates the exact selected slice
instead; it uses the main dependency tooling, its own native target and explicit
read-only native-source sibling links, without editing installed packages.

The first selected-tree run reports two missing mapped chapters. Record native
feature activation in the owning architecture and public exports chapters. The
first expanded export note exceeds that chapter's 400-line limit by two lines;
keeping the concise note on its existing paragraph line corrects that finding.
One retry hits the 30 GiB disk preflight. Under standing cache approval, remove
49 inactive older Desktop integration-test executables (1.09 GiB), retaining
the newest of each test family, all app binaries, bundles, libraries and data.
The candidate Cargo lock and files have no other owner; identities are checked
before deletion. The cleanup initially stops on incompatible double-lock APIs;
retry uses one exclusive Cargo-style lock. No active target is pruned.

The corrected selected tree passes all ten specification lanes, source/App
ownership and all 49 specification-regression cases. No validator, test or
assertion is weakened. That selected-tree result is retained separately from the unrelated main
working-copy finding. Final source qualification follows below.

## Final source qualification

Bounded runs use `CARGO_INCREMENTAL=0`, `CARGO_BUILD_JOBS=2`,
`RUST_TEST_THREADS=2` and `TURBO_CONCURRENCY=1`.

| Boundary                   | Result                                                                                                                                                                                                                                                      |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strict/native/protocol     | `pnpm check:rust-core` passes, including boundary audit, generated schema/type drift, formatting and strict all-target workspace Clippy (50.61s). All four wire cases pass.                                                                                 |
| Remaining check stages     | Progress, specification mirrors, styling, App ownership and metadata-query audits pass. The ordinary `scripts/run-turbo.mjs check` passes all 20 tasks (157.60s).                                                                                           |
| `pnpm test`                | All 326 ordinary Rust cases/doctests pass with six retained ignores; all 20 package tasks pass, nine valid cached. Eleven package Vitest families total 2,157 passes with the retained frozen-Deno integration skip (529.89s including native compilation). |
| `pnpm build`               | The Rust workspace and all eleven package builds pass, nine valid cached (163.89s).                                                                                                                                                                         |
| Selected `pnpm spec:check` | All ten lanes, source/App ownership and 49 specification regressions pass. The main checkout's unrelated documentation finding remains excluded rather than waived.                                                                                         |

The six intentional Rust ignores remain the five model-asset cases and the crash
helper. The complete HTTP family passes all five cases. The initial three
activation failures and one compiler finding move to zero. No source runtime,
renderer, registration or public screen is changed: generated API turn DTOs
remain types only, and built hosted output retains an empty native-turns module.
Existing UI/provider/cold-application receipts keep their original scope.

Later compilation again reaches the disk guard's margin. Safe inactive-cache
cleanup removes seven older Core integration executables (0.19 GiB) and only the
Terminal target's unused incremental cache (716 MiB), retaining all current test
executables, app binaries, bundles, libraries, profiles, vaults and models. The
Cargo locks and candidate open files are checked before removal. No AI or
Terminal source changes occur.

This commit qualifies native activation inside R2.2.3. That task remains Working:
Desktop runtime/typed IPC selection and both existing-screen observer adapters
are unfinished. Real providers and cold applications remain R2.3, and R3–R7
retain their original gates. Signing/M11 and the native AgentStore/ThreadStore
experiment stay Deferred. The final change after these runs is documentary;
formatter, progress and selected-tree specification validation cover it.
