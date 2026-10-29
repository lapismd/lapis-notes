# Native tracked-today materialization on the admitted indexing owner

Status: native tracked-today implementation source-qualified; host adoptions waiting.
Last updated: 2026-10-26 04:47:09 UTC. Task: R3.2.1.2.10.3.
Requirements: LN-CORE-003/005/006.

Recovery source base: `8e09a5dea0da3569816ce22a2ada76ef137ed976`.
The separate Tasks reference invokes the unchanged plugin method and real
repositories over 15 scenarios / 45 attempts. The retained candidate is copied
byte-for-byte as `tests/fixtures/task-tracked-today.json`, SHA-256
`1f2133e948ef8827349a981a09c491871e0a02dbcdbba6fb440334d4a1b2d0eb`.
Capture `b477e6b3-ca5e-4db7-9735-686ead6dbb57` and ordinary replay
`1dc2350e-2972-4318-ad66-e9e9a1d6b74b` pass before native implementation.
The complete reference source is committed at Tasks `49ed2c13`.

The new native source must reuse the existing indexing owner, Task projections,
explicit date clock, lifecycle gate and guarded default daily writer. Selection
stays explicit/off. Default-provider availability is supplied explicitly;
provider errors must not become fallback writes. Native status retains failed
sources and readable daily partials. Original Tasks remain unchanged. No timer,
renderer authority, database publisher, host DTO or application default is
introduced. Both native host Task selections remain separate gates.

The exact native reference target first stopped at missing selection/status
interfaces. After fixing missing imports in the new fixture, clean baseline
`530b0d86-2519-4dbf-b34e-1d40e3d69341` retains five diagnostics naming only
the absent provider, selection method and status field, with no runtime cases.
The earlier setup attempt `471631bb-711b-4c02-bfcb-a9ac7c15e4dd` also retained
eight fixture-import diagnostics. No expected data or assertion was weakened.

The first implementation attempt fixed one MutexGuard coercion and updated the
existing snapshot-test caller directly for the private pass result. Exact
native replay then passes all 45 retained attempts at
`f3896a2b-7f8b-4c89-aeb1-a6ef95860e4e`. The original owner identity is retained,
the initial selection stays off, and every original Task is byte-identical.

Expanded owner controls pass five exact cases at
`b77e6b64-768d-4f8a-9ffc-d72a9d90b985`: the reference plus explicit selection/
deselection, Markdown-only admission, observable provider unavailability,
dirty/detached original and daily guards, aliases and repair to one observation.
There are no failures. Changing provider availability wakes the same owner;
unavailable providers never create a fallback daily note.

Three private physical-stage cases pass at
`be05f967-0b36-4899-aeb6-e2a45908d6c2`: stale-original admission, retained
ensured seed/cold idempotent retry, and accepted mutation after detach/during
close drain. The first seed case incorrectly assumed a clean hardlink alone
would fail the existing atomic writer; `66623cbb-9998-4d31-8a7d-8497666dc1bd`
retains its two passes/one fixture failure. The corrected injection makes that
new alias dirty after ensure, exercising the actual existing guard while
preserving every seed, Task-byte and retry assertion. No writer contract or
assertion is weakened.

Full `pnpm check:all` passes at `92c76bdc-314d-4df3-8993-b0850945f42f`: all
467 Rust cases, zero failures and seven retained intentional ignores, six native
boundary regressions, strict Clippy/fmt, native application build and complete
package check/test/build. Unchanged package/story/config inputs retain their
valid Turbo receipts. The root architecture chapter remains exactly 400 lines.
Final canonical specification, mdBook, spec-first, App ownership, metadata query
audit and all 78 governance cases pass at
`16be58f2-bd7c-41f0-a6e1-964f2200089b`. The final source ledger and evidence
retain their own formatter/progress check before the commit.

The selection adds no host DTOs, application defaults or renderer scheduler.
Typed per-pass failures retain current readable daily content; its projection
is published only by the existing owner's ordinary next Markdown pass. Native
Tasks algorithms and its `da17eba0` pin remain unchanged, and this slice changes
no `lapis-ai` code. Both native host Task adapters, their default selection and
their own functional/native acceptance remain separate application gates.
