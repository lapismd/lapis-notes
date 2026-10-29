# Shared native chat queue adoption

Status: shared source and actual hosted deterministic acceptance qualified.
Tauri/main intake and actual installed-provider acceptance remain separate.
No ordinary host or AI default has changed.

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
each; shared queue/session plus existing observer pass 32; admitted Web chat/queue
transport passes 9 (43 focused cases total). AppProfile and all Web strict lanes
pass with zero Svelte errors/warnings. The complete native workspace passes 620
cases, zero failures and seven retained asset/provider ignores. Generated DTOs
and Rust formatting are copied back with per-file SHA-256 checks. No claimed
actual-provider or source catalog acceptance follows from this receipt alone.

The isolated source change is rebased onto the master R3 completion `dc03d375`.
Only current documentation/status conflicts were reconciled, preserving all 104
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

## Full package and canonical checkpoints

Source `cdbffcedc3ce41c796334dfbe91c864e32127faf`, worker
`e0b38825-2595-4bca-9997-3b8d0b83cd22`, passes the repaired capability case,
all shared 32/Web 9 cases, public packs and complete check 20/test 20/build 11 gates.
The full package suite has 2,451 passes and the one retained frozen Deno skip;
the native suite again passes 620 with seven existing ignores. Canonical
validators, mdBook and governance pass, then spec-first correctly reports three
missing host mappings. The fix documents queue ownership in Plugin Model and
Web plus the unchanged frozen Deno boundary, without editing Deno code.

The optional-metadata case is tightened: source `334a261777bb35183f24a37595d4703d7d5bb36f`,
worker `9bc7cddb-6e34-48c1-8ed0-0e3aa9dbc1e2`, records one failure because an
older target advertises busy sending without a declared queue selection. The
repair checks availability for that UI capability; idle R2 continuation and the
existing raw admitted capture port retain their contracts.

Source `6dcd67776cccdada84f62c29af318d4ad8eb17ce`, worker
`9430f760-2b4f-478e-8911-2ace5fcdf529`, passes that exact case, shared 32/Web 9,
full check 20/package-test 20/build 11 and the complete canonical/governance 78
lane. Only formatting of this new, uncommitted record fails; it is repaired
before the remaining browser/catalog job. Rust/Cargo/native inputs are unchanged
from the qualified 620 cohort. Build-generated Deno lock output stays in the
private report and is never imported into the frozen source.

The public API archive remains SHA-256 `ef8170a6f77d811f1d62c3c567dc1b07a8c30418ec3fce538f4e3838a09c1cfc`.
The latest AppProfile archive is SHA-256 `0e792e5aa693ce69aada8690c3f78f74084bc82e192632907db5fed9106471fd`.
Their frozen source, tool image, six native pins and 16 public inputs are retained
in the worker's `live-packs.json`; tracked manifests and pnpm lock stay portable.

The queue requirements 029–032/036–037 move verbatim into
`spec/src/architecture/rust-queue-admission.md`, preserving IDs and every clause.
Mutable links, the ledger, SUMMARY and generated mirror follow the new chapter.
The underlying turn chapter is 207 lines and queue chapter 158, leaving room for
parallel participant/context additions below the 400-line canonical limit.

## Exact thinking inheritance and hosted readiness

Frozen Desktop applies `target.thinking ?? selection.thinking` before dispatch.
Snapshot `d5a34e42`, worker `5c287cbf-cb2b-46ca-94c6-24b1eb6e1496`, records two
exact failures: the Core selection case and actual HTTP-to-ACP case both lose
captured `high` effort when the target field is null. The repair ignores only
that null target value before consulting global selection; explicit
`default`, `off` and `low` retain their original meaning and capture bytes remain
unchanged. Snapshot `065dadc1`, worker `99893f7f-5cf2-4eac-af29-028c57e61c7f`,
passes both exact regressions and affected native queue suites. Its boundary
audit rejects the test's path attribute; the tests now use Rust's standard
`admission/tests.rs` module without weakening the audit. Complete 622-case native,
strict, build and canonical gates are rerunning.

The first actual hosted queue journey, snapshot `d5a34e42`, worker
`f17714b4-8d0a-4542-af54-eb659f2e310d`, fails before checking a prompt because
`worker.jsonl` does not exist yet. `frames()` now treats only ENOENT as the empty
pre-start state, retaining all assertions and deadlines and rethrowing other
read errors. The next hosted run will consume the qualified upstream Agent UI
send-admission repair, with browser and catalog acceptance still unclaimed.

Frozen source `a86e300e6fbf38c793d8ac0515307e192201f3c7`, worker
`d592c3c1-8eff-456c-9680-7d9a26b9d479`, finishes at 2026-10-27 06:47:10 UTC.
Both exact thinking regressions and all affected native queue cases pass. Full
native acceptance passes 622 cases, zero failures and seven retained ignores, with boundary audit,
generated protocol equality, Rustfmt, Clippy, workspace build and complete
canonical validation and all 78 governance cases. Two Rustfmt outputs are copied back only after checking
their per-file hashes against the receipt. This supersedes the earlier 620-case
native checkpoint, without claiming actual hosted or provider completion.

Root owns the combined actual installed-provider R4.1.6 gate after source and
both-host intake align. It remains Waiting; deterministic ACP/retained-screen
receipts do not substitute for the R2 isolated-vault, read-only installed-provider
path with queue acceptance, detach, retained outcomes and cold no-replay.

## Provider-default representation bridge

The frozen retained codec omits an unset effort property. Native `TurnOptions`
and the existing typed runtime instead carry `Option::None` as JSON `null`; this
is an absent request, not a request for a literal `default` effort. No generic
runtime serialization is changed to satisfy a consumer assertion.

Snapshot `ca61843e7ac56d3a15634d84cc4c3353307ab8fc`, worker
`86419b97-79c4-4a0e-8d41-23188db5dcdd`, runs a bounded read-only probe against
the real pinned `lapis-acp` binary and its existing ACP provider fixture. Its
exact configure frame has `model: null`, `effort: null` and `mode: "default"`.
Both model and effort report `not-requested`. The complete downstream trace
contains exactly one mode setter and no effort/model setter. The harness
confirms clean shutdown. The result finishes at 2026-10-27 06:53:48 UTC.

`lapis-ai` source remains `6548afe0f47c6fa2ff71d326a5f6e8ce4ebbebd8`.
The compiled binary SHA-256 is
`a172d8fae23026257a55a8a3a495e80aa841e1021df1e51bc6afeecd9256a7db`;
fixture SHA-256 is
`392c206d3b38f6a317589dfaf0694162fc2d01cbcba84d52c9164682fedca02c`.
The worker retains its exact source pack, six native pins, tool image,
`provider-default.json` input/output and downstream trace. This deterministic
runtime bridge proof does not close R4.1.6 installed-provider acceptance.

## Hosted composer locator checkpoint

Source `59e5e127218d9f5fcc54d31545e7ed2c0b59a9b4`, worker
`72246cf1-40d2-423a-b204-ad09eef80f3f`, uses Agent UI candidate source
`d2fd86fc24ec344a0817fcaf9eef59d02e456e29`, archive SHA-256
`58bd5870d6d67bd60a1d1c8724eb31d4359c3d923eb673474f6818b9e7f90b95`.
That candidate has 16 focused capability passes and its public build; complete
refined owner qualification and final public-byte equality remain pending.

The cold exact hosted queue test reaches the first real prompt. It then fails
because a role-only Message locator matches both the read-only transcript and
the composer. The fixture now scopes editing to the public Message composer
group. All queue controls, persistence, identity and no-replay assertions remain.
The final effort check now asserts the typed native null representation and adds
separate retained `thinking: "default"` plus persisted `TurnOptions.effort: null`
checks, backed by the downstream runtime probe. The old absent-property check
had not yet been reached; no product/runtime implementation changes follow from
this test-oracle clarification.

## Real-pointer queue reveal checkpoint

Source `c5b893aeda8109182959c0883e5003e051867f54`, worker
`6b00f2f5-427b-4edb-a360-85c52eead1d5`, reaches queue admission and renders the
capture. Its direct Cancel click times out after the original 120 seconds because
the author avatar intercepts the action's hidden resting box. The later held-peer
uncertainty is downstream of that UI interaction failure, not another native
engine defect. The original trace and screenshot remain retained.

Source `591478132f6d3723c9ced695cd3322ee50d8679f`, diagnostic worker
`e5576295-9214-487e-8698-be2d5eaeae64`, captures the before-hover geometry with a
separate 30-second diagnostic CLI deadline. Cancel and the absolutely positioned
links both occupy `(400, 326.484375, 24, 24)` and inherit `pointer-events: none`.
The author trigger occupies that same resting box, while the relative article is
550px wide. The center therefore correctly hits its YO span.

Design Core source `99fa0952` and selected archive SHA-256
`ad82a73a5323b70ac814a69f7db4ee10f032a1b1146eef11d38f341dad1543fb` match this
intentional hidden-action CSS. Its canonical pointer regression in
`tests/shadcn/transcript-review.spec.ts` first hovers the article, then clicks
Cancel. The consumer test now follows that same semantic article/control flow,
records post-hover geometry and a screenshot, and requires opacity 1, active
pointer events and a button-owned center hit before the ordinary click. No
Design Core change, forced action, private click selector or weakened product
assertion is introduced. The final acceptance retains its 120-second deadline.

Source `29e710c6b6d7c5eac31ad28574de425e3c04b309`, worker
`850d3e3f-62d4-459b-ab7f-9f305e3cf57b`, passes the exact hosted queue journey
1/1 in 10.3 seconds, then all nine affected Rust-hosted browser journeys. The
post-hover cancel box is `(926, 326.484375, 24, 24)`, with static parent,
opacity 1, active pointer events and a button-owned center hit. The normal click
cancels the exact capture. Pause, browser reload, cold server restart, explicit
resume, independent saved identities, authored capture/receipt equality and
provider-default/null options all pass. Shared queue/observer 32, Web 9 and the
exact R2 compatibility case also pass. The remaining source/catalog/static gates
continue in that same frozen worker; Agent UI candidate 58bd final owner
qualification and R4.1.6 installed-provider acceptance remain separate.

The full source check in that same 850d worker then reports two e2e TypeScript
diagnostics in the geometry helper: its array is `HTMLElement | null`, while the
filter incorrectly asserts the broader `Element` type. The predicate is repaired
to `HTMLElement`. This changes no emitted browser behavior. The exact Web e2e
typing gate runs first, then full source/package/build/catalog/static gates;
previous actual-host and native receipts retain their runtime scope.

## Complete shared source and catalog closure

Frozen source `b70c2b9d1f9cb44b1ef2bb1335d1667c0881c40e`, worker
`c34c9f49-95aa-4f03-9dfc-63302d7bbcdc`, finishes at
2026-10-27 07:31:01 UTC. The exact Web e2e type gate has zero diagnostics after
the two-error baseline. Shared 32/Web 9 and exact R2 compatibility pass. Full
check 20, package-test 20 and build 11 pass, with 2,451 package cases, API 1,716,
zero failures and the one retained frozen Deno skip. Canonical validation, all
78 governance cases, progress and formatting pass. All 265 cold catalog
interaction/accessibility cases, static Storybook, 188 SUMMARY-derived mirrors
and static Docs navigation pass; its two development-only watch cases remain
skipped in the static lane. Generated `deno.lock` stays in the private result
and is never imported into frozen source.

The type-only fixture correction emits exactly the same JavaScript as the
actual-host-qualified `29e710c6` fixture under TypeScript 5.9.3, SHA-256
`fd3c1711a49986910aa9c1c1dfd0236ee13074fd618cfc38cf9e513f69421afc`.
The previous native 622 and actual-host exact 1/full 9 receipts therefore retain
their scope without another unchanged runtime run.

Final API archive SHA-256 remains
`ef8170a6f77d811f1d62c3c567dc1b07a8c30418ec3fce538f4e3838a09c1cfc`.
AppProfile now packs as
`fe45dedb08125257a84e57933fcddc9685fa6d559a41821a73b0e654608e2068`.
Of its 48 members, 47 source/runtime/declaration members are byte-identical to
archive `0e792e5a`. The remaining `package.json` differs only in the ordering of
the same file-explorer/workspace dependency keys; parsed manifest values match
exactly. The private equivalence record retains both archives and digests.
No dependency range, declaration or production source changed during closure.

Final upstream Agent UI documentary/provenance closure and coherent main intake
are separate remaining steps. Actual installed-provider R4.1.6 remains Waiting.

## Final upstream provenance and source handoff

Agent UI's composite owner receipt closes the final dependency gate. Build source
`d2fd86fc24ec344a0817fcaf9eef59d02e456e29` and documentary closure
`37f7f33c3d6b408f3d95b50f02281158433a3063` retain archive SHA-256
`58bd5870d6d67bd60a1d1c8724eb31d4359c3d923eb673474f6818b9e7f90b95`.
The owner passes exact 16, unit 234, catalog 1,960, browser 151, packed examples
149, static and strict/fingerprint checks. Its original aggregate failure at
AUI-GOV-003 remains recorded; separate specification/workflow/format runs close
the documentary mapping with exact product-input equality. All 333 public archive
members are independently hash-checked against that receipt; full and focused
dist outputs match. The consumer's previously provisional input is therefore the
same now-qualified public input. No consumer runtime rerun or publication follows.

R4.1.4 is Source complete. R4.1 stays Working; R4.1.6 stays Waiting under Root's
actual installed-provider gate. Final intake must preserve newer main context,
skills and participant task IDs; this isolated source retains all 104 original
rows plus seven queue checkpoints and does not overwrite newer main work.

The owner commits this qualified source at
`2bee4ed673f4fbb82b721268091d75b2392e95d0`. Its closing evidence-only
specification receipt `472aa6fe` passes and matches the committed tree exactly;
the composite receipt records an empty commit-versus-closing-docs delta.
