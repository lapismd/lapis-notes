# Native conversation continuation — R2.2.2 source qualification

Parent source is Notes `fe2f0d93`, the qualified R2.2.1 protocol/HTTP/SDK slice.
Desktop compatibility remains `6c9e55f7`; Lapis AI remains unchanged at
`6548afe0`. This slice does not select a new Desktop/chat profile.

An unrelated documentation-only commit, `78ee5a2c`, lands during this work.
Its seven backlog/navigation files remain separate; no continuation source,
tests or evidence are included in that commit.

Before this slice, the native worker creates a fresh conversation per request.
R2.2.2 adds explicit service-owned sequential continuation before the existing
chat can adopt it. Each follow-up must name its conversation and exact accepted
predecessor. Native authority rejects a stale branch, unknown conversation,
different scope or unfinished predecessor without creating another dispatch.
Cold recovery retains the accepted head and never creates execution authority.

## First target

`CARGO_INCREMENTAL=0 CARGO_BUILD_JOBS=2 RUST_TEST_THREADS=2 pnpm rust:core -- test
-p lapis-app-core --test turn_continuation --locked` introduces three cases:
sequential identity/deduplication/branch rejection; unfinished/foreign/scope
refusal; and accepted-head recovery with an explicit new request. Before: all
three fail because strict input decoding correctly refuses the absent
`continuation` field. After adding the DTO and native lineage check, all three
pass (0.28s). An added retained-future-timestamp case proves ordering after a
clock correction. The expanded four-case target passes (0.35s).

## Native publication

The exact two-case `--test native_conversation` target first fails twice:
follow-up execution becomes Failed because its directory already exists, and
unreadable history is accepted before the worker refuses it. Freeze native
history and its three file revisions before acceptance. Verify those revisions
again after the durable claim, preserve the transcript/binding prefixes and
metadata fields, then publish the new user/assistant through the shared writer.
Both cases pass (2.31s).

The expanded four-case native family passes (3.14s), including completion after
detach and three explicit turns across a fresh service owner; preserved title,
creation time and binding records; refusal before acceptance with the user's
unreadable bytes intact; bounded Unicode evidence without truncating retained
files; and an external change after synchronous acceptance but before the
current-thread worker can run. That last case refuses publication and dispatch,
retaining the external bytes and exactly one earlier prompt.

The existing eleven native execution and ten ordinary journal cases also pass,
retaining the separate ignored crash helper. All three protocol cases pass for
old-input defaults, cursor round-trip and rejection of native resume authority.
Runtime authority remains in native memory; previous messages enter fresh
workers as role-labelled, read-only evidence with the existing 12,000-token
handoff budget. Additional context stays separate from the current prompt.
Completed journal publication and releasing its active job share one lock, so
observing completion permits the next explicit submission immediately.

## Hosted transport

The exact `hosted_followups_keep_one_conversation_across_detach_and_cold_recovery`
case passes (2.37s). It verifies one portable conversation through three actual
fixture workers, HTTP detach, duplicate acceptance after a fresh host opens the
journal, and stale-head refusal as HTTP 409/BUSY without a replay. The existing
route retains operator-only launch selection and admitted client authority.

This is a native protocol fixture, not a provider or existing chat UI. It
continues journal-owned native conversations; arbitrary portable files cannot
become old dispatch authority. The renderer profile is unchanged. Full affected
families and full source qualification were pending at this checkpoint.
R2.2.3 and R2.3 remain separate application/provider gates.

## Strict and affected-family checkpoint

The first full check stops on one strict large-enum-variant finding: adding the
cursor grows `TurnCommand::Submit`. Box the input and dereference it at native
dispatch; JSON/schema/TypeScript shapes remain unchanged. The exact strict
workspace check then passes (14.80s), all three wire cases pass again, and the
complete four-case HTTP family passes (2.75s). No lint allowance or assertion is
weakened. Resume the full check and then the previously unrun test/build/spec
stages. Source, native fixture, browser and application gates remain separate.

## Final source qualification

The bounded commands use `TURBO_CONCURRENCY=1`, `CARGO_INCREMENTAL=0`,
`CARGO_BUILD_JOBS=2` and `RUST_TEST_THREADS=2`.

| Command           | Result                                                                                                                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm check`      | All 20 tasks pass fresh, including strict Rust, protocol drift, ownership, public package/type contracts and all host type checks (2m28.457s).                                                                                             |
| `pnpm test`       | All 321 ordinary Rust cases/doctests pass; six retained ignores. All 20 package tasks pass, nine valid cached; the eleven package Vitest families total 2,157 passes and one retained frozen-Deno integration skip (1m13.471s after Rust). |
| `pnpm build`      | The Rust workspace and all eleven package builds pass; nine valid cached package results (1m11.031s).                                                                                                                                      |
| `pnpm spec:check` | All ten configured lanes and source/App ownership pass, including all 49 specification-regression cases.                                                                                                                                   |

The six Rust ignores remain the five separately qualified asset-dependent
model cases and the explicitly invoked crash-process helper. No test, timeout,
lint or assertion is weakened. The original three journal and two native
failures move to zero; the strict enum finding also moves to zero. The final
HTTP family has four passes, and protocol wire coverage has three passes.

### Impact and retained application gates

This slice changes the native owner, protocol and generated type declarations.
It changes no renderer, public module registration or renderer fixture. The
generated SDK file compiles to exactly the same `export {};` runtime as
`fe2f0d93`, SHA-256
`8e609bb71c20b858c77f0e9f90bb1319db8477b13f9f965f1a1e18524bf50881`.
The new acceptance surface is the native worker/journal, real HTTP/binary and
public SDK/type boundary, all covered above.

The parent slice's 261 cold catalog, seven Rust-hosted and twelve PWA journeys
remain pinned to that source revision. They are not new chat-adoption evidence
for this continuation service. The complete relevant UI/catalog/native/browser
lanes accompany actual screen selection in R2.2.3; real providers remain R2.3.

R2.2.2 is Source complete in this commit. R2.2 remains Working; neither
application selects this owner yet. Publication, installed-app replacement,
Linux/container delivery and final hosted cutover remain separate gates.

### Concurrent documentation isolation

After the full source run passed, the final documentary refresh in the default
workspace reports `SPEC-REQ-SENTENCES` for LN-PKG-004 at
`spec/src/packages/editor-apis.md:27`. Two unrelated in-progress files,
that chapter and `spec/src/verification/pkg-01.md`, are outside this slice's
29 owned paths. Preserve them and validate the exact selected commit tree in a
temporary JJ workspace, based on the committed documentation parent. This does
not waive or repair the other task's finding. Main remains the implementation
workspace and authoritative migration tracker.

The selected tree passes all ten specification lanes, source/App ownership and
all 49 specification-regression cases. The temporary environment first lacks
the CLI, then reports fourteen missing-dependency panel mappings; reusing the
main workspace's verified public tooling/dependency tree resolves those setup
diagnostics without changing installed package contents. Its own Cargo target
and explicit native-source sibling layout remain isolated. The final document
refresh is revalidated on that selected tree before committing.
