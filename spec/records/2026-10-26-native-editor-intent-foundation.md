# Native editor-intent foundation — 2026-10-26

This source slice implements CORE019–021's native fence and shared App writer
handoff. It does not select either host or qualify abandoned-editor recovery.
The [canonical contract](../src/architecture/native-editor-intents.md) and
[current ledger](../../MIGRATION.md) retain those separate gates.

## Ownership and behavior

- Core extends the existing Editor record with an independent active intent;
  clean content remains clean. The existing physical-alias, descendant and
  native writer guards also fence active intents.
- Client-minted IDs admit once. Dirty revisions and intent generations advance
  independently. Yield validates exact saved-file version or expected absence;
  stale acknowledgements cannot clear newer state. Clean retirement retains a
  bounded tombstone, including the existing explicit close/discard routes.
- The existing sole `Client::detach` fences retained callers and keeps blocking
  clean intents as well as dirty editors. Recovery remains explicit.
- The App registry adds synchronous input protection, awaitable native readiness,
  retained dirty notification, protected flush/yield/rearm and clean retirement.
  API text editors, mutable state and one-shot conditional writers use their
  existing persistence. No native content-write replay or second save path is
  introduced.
- Read-only inspection can reconcile an applied lost transition. Failed rearm
  retains local protection and the registry release barrier. An explicit ready
  retry preserves the original identity and initial dirty generation.

## Source cohort

The feature workspace is `lapis-notes-native-editor-claims-20261026`.
Its final parent is qualified main `2e9ed95cd56d594e5be240459967767c1aff90f9`,
combining Tasks `ac580dec` and Repository reader `a741604d`.
Rebase conflicts were documentation-only. The inherited native Tasks retirement
test is the only changed native source-test file relative to the qualified
feature snapshot; API production bytes remain equal.

Canonical Docker validation uses the qualified reader/current Tasks public
archive manifest. API is built from this owning source. The temporary setup
never changes tracked npm ranges or lockfiles, patches dependencies or aliases
source modules. Archive provenance and exact source revisions remain in each
private run report.

The old Desktop Markdown archive `56f9ffc7` remains immutable historical intake.
It predates the committed source preview binding and cannot qualify native
preview admission. Mira's independent raw-input lease is qualified at
`c5d1e4b68ed616c18eb8a0f57014c83ed3acc7f9`, public archive
`e79ba9cd1fbdc3e1e078dbea6c1dac9e49a11e045dcd58fa329401cff2fa8d82`.
Markdown source binding and actual host adoption remain separate follow-ups.

## Regression evidence

The exact native command is:

```sh
node scripts/validation.mjs run validation:rust -- test -p lapis-app-core --test editor_intents --locked
```

Before: **0 passed / 8 failed** at the missing shared protocol operation,
frozen report `cba09c40-0287-4882-9e5e-00da22b35f57`.
After: **8 passed / 0 failed**, report
`22292363-a2bc-4a5e-a484-5e71ec1a75f3`.
The qualified-reader rebase also passes all eight cases in report
`10dda0d2-9577-43f2-896a-33fc8ea2f66a`.
Expanded native coverage contains ten cases, adding bounded admission and
late acquire after explicit discard; explicit detach is tested with a retained
Arc, rather than relying only on Drop.

The exact API target is:

```sh
pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/native-editing-registry.test.ts
```

It runs in an ignored frozen Docker worker with checked source/parent/archive
identities. Baseline **0 passed / 9 failed** is retained at
`lapis-editor-intents-adapter-before-98b3eb0b-0380-4123-b121-d16fe7040ad5`;
the matching after report passes **9/9**. Expanded real CodeMirror loading,
typing, failed destroyed-save and one-shot writer cases pass **12/12**.
Lost applied rearm, exact saved bytes and admitted state persistence expand
that to **15/15**.

An additional retained-dirty initial-admission retry exposes **15 passed /
1 failed** at frozen `77c4a02d`. The first admission's rejected callback did
not report the retained dirty generation after a successful retry. Reporting
that captured generation in the retryable readiness path repairs it without
waiving the native fence. That exact coverage passes **16/16** at frozen `75ef94d0`. A retained
one-shot initial-admission regression adds **16 passed / 1 failed** at
`4142c916`, then **17/17** at final product snapshot `85624571`. All **118**
affected persistence/lifetime cases and **1,658** API cases pass. Public build, publint, packed declaration contracts, App ownership
and strict Svelte/TypeScript checks pass with **0 errors / 0 warnings**.

## Complete source lanes

The canonical source coordinator records each immutable run separately under
`.local/validation/editor-intents-20261026/`; it runs on the remote Docker
daemon with no host fallback or visible application windows.

| Lane                   | Recorded result                                                                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:rust-core`  | **546 passed**, seven intentional asset/provider ignores, 107 targets; report `4dbc7723-294e-403a-a05b-14f6ee48768b`                                                        |
| `pnpm check`           | **20/20 tasks**, strict all-target Clippy, generated protocol, ownership, progress and source specification pass; report `5cf0ccb6-5c32-4e76-ae3f-eb5edd858333`             |
| `pnpm test`            | **20/20 tasks**, 2,341 package cases on the pre-retry-fix snapshot; final affected/API retry qualification is recorded above; report `0baa16bb-b277-4ddb-a391-b58624d243b7` |
| `pnpm build`           | **11/11 tasks**, native workspace and public package outputs; no publication                                                                                                |
| `pnpm test:storybook`  | **261/261**, four cold sequential shards, no interaction or accessibility failures; report `ff522a0a-b166-4093-b79e-c2c5d04da312`                                           |
| `pnpm build-storybook` | Static catalogue builds; no visual baseline approval                                                                                                                        |
| `pnpm spec:check`      | Ten canonical lanes and all **78** governance cases pass; report `117583af-2b4e-40ef-9959-7e4c82749278`                                                                     |

The final current-parent `pnpm check:all` closure passes **20/20** check tasks,
**20/20** test tasks and **11/11** build tasks in report
`642429df-3c2b-4cb2-90c8-be09c161870b`: **2,343** package cases, including
**1,658** API cases, and **547** native cases/doctests pass with the same seven
intentional ignores. It retains strict types, all-target Clippy and generated
protocol equality. Production source is byte-equal to `85624571`; later changes
only extend regression evidence and register the canonical documentation page
in Storybook ordering. Final formatting/progress/specification closure is
verified by the final documentary gate before this slice is committed.

## Retained failed attempts

- The first specification pass reports six authored-document findings: missing
  acceptance introductions/mirror/order and a 402-line aggregate chapter. The
  introductions and generated mirrors are fixed; the aggregate chapter stays
  within its original 400-line limit. No validator or threshold changes.
- An old copied archive manifest produces three AppProfile errors for missing
  public History Repository entries. Selecting the already-qualified reader
  archive cohort repairs all three; no import shim or consumer source alias.
- One overlapping canonical invocation is refused by the existing workspace
  lease. It performs no tests. Subsequent complete lanes run serially.
- Final documentary run `7dc5eb70-3323-4ab0-a953-38e2671ce448` passes
  formatting/progress but finds six missing spec-first chapter mappings after
  the clean-parent rebase. Scoped admission/lifetime cross-references repair
  those mapped chapters; no mapping, validator or threshold is weakened.

## Remaining gates

Source readiness does not prove actual hosted or native WebView acceptance.
Before host selection, implement generation/revision-bound explicit retained
intent recovery using existing Problems/recovery presentation. An active clean
intent left by abnormal client loss cannot be silently cleared. Adopt/discard
actions must refuse stale captured claims, and uncertain content mutations must
never replay automatically.

Qualify the source-owned Mira/Markdown bridge, then both applications' foreign
dirty refusal, saved-generation yield/rearm, failed/detached writer lifetime and
cold/crash recovery. App signing, final distribution and default cutover remain
deferred.
