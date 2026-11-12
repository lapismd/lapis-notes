# Passive editing-intent observation

The user explicitly approved the optional API observation port and authenticated
Server invalidation stream. This record covers the API owner slice under
LN-CORE-054. Server transport, released-package intake and actual public-image
acceptance remain separate gates. Notebook/directive activation is independent.

## Regression and behavior

Exact command before implementation:

```sh
pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/native-editing-observation.test.ts
```

All four initial cases failed. The idle sample made 21 List calls over 20 seconds
despite an available observation port. The unchanged exact target passed after
implementation; the expanded seven-case family also covers registration failure,
fresh observation after remount and refresh following a failed List.

The optional `observe(invalidate, error)` port returns a disposer. One App
recovery controller shares that subscription between mounted shells. It lists
initial claims and refreshes on invalidation, including a follow-up read when a
notification races an in-flight list. Observation failure retains visible claims
and error state until a successful connection invalidates them. Last unmount
disposes observation and fences pending reads and late callbacks. Hosts without
the optional method retain the existing one-second shared poll.

The existing recover/discard, captured generation/revision, read-only lost-reply
inspection and destructive-close preflight remain authoritative. Public packed
types retain the old port and check the optional observer and required disposer.

## Executed qualification

- Exact four-case regression: four failures before, four passes after.
- Expanded observation suite: seven passes. Complete directly affected recovery,
  registry, issue, state and editing-session family: 67 passes.
- Clean registry-only `pnpm check:all` on Docker context `omarchy`: all 16 check,
  16 test and nine build tasks pass; 1,768 API and 2,110 package tests pass.
  Public package build, publint and positive/negative declaration checks pass.
- Fresh focused `Workspace/Editing recovery` interaction/accessibility: all
  three stories pass, retaining captured recovery and saved-byte assertions.
- Complete cold catalog: all 275 interaction/accessibility cases pass across
  four fresh sequential shards (102/70/46/57); no assertion or budget changes.
- Final canonical checks, mdBook, spec-first, App ownership, metadata queries and
  all 67 specification-governance cases pass. An initial spec-first failure
  required mapping the public port in the package API chapter; it is repaired.
- Package verification stopped at its intentional empty-working-copy guard
  before packing. Commit the verified source slice, then rerun that gate; this
  operational refusal is not a package or product pass.

Receipts live in ignored `.local/editing-intent-observation/`. The clean build is
run `lapis-notes-validation-f3adf7f8-e232-4034-9c3b-58d2bec06160`; focused cold
catalog run is `lapis-notes-validation-6b3c3417-27af-479b-90bd-56a305671d0d`.
Both installed the tracked frozen registry graph without temporary archives.
The complete cold catalog run is
`lapis-notes-validation-2feff391-7c3e-4e4d-957c-853518e303d1`.
Final canonical run is
`lapis-notes-validation-5fc2b4f9-65e7-4583-97ff-6e52bfd4218c`.
Source gates do not claim npm publication, Server delivery or production use.

## Observation health across confirmed actions

Final review found that confirmed recovery or discard could clear a stream
warning without reconnecting the observer. Two exact action cases failed before
the repair:

```sh
pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/native-editing-observation.test.ts -t 'keeps a disconnected observer'
```

The recovery controller now retains the observation error when publishing a
confirmed action result. Reconnection invalidation remains the health boundary.
This follow-up requires fresh focused and complete source qualification before
PR delivery; earlier checkpoint receipts retain their original scope.

Final follow-up qualification:

- Both exact disconnected-observer action cases pass; the expanded observation
  suite has nine passes and the complete affected family has 69 passes.
- Clean registry-only check/test/build passes again: all16check/16test/ninebuild
  tasks, 1,770 API and 2,112 total package cases, with public declaration guards.
  Run: `lapis-notes-validation-2643504e-b7d7-4c25-8460-8ae586ee78cc`.
- All three focused cold recovery stories pass again, run
  `lapis-notes-validation-40d35915-d344-478b-93df-fe2bcf3de211`.
- A complete cold diagnostic was interrupted by the existing browser-RPC class:
  the browser connection closed while starting `History.stories.ts`, leaving
  258 passing cases and17 unexecuted. No assertion failed; the run itself failed.
  Worker inspection and Docker events show no container OOM termination.
- The exact History family passes six cold cases. The unchanged failed shard
  `--shard=1/4` then passes all102 cases on the identical source `41b09a6e`.
  Together with the original successful70/46/57 shards, all275 cases execute
  successfully; this is composite diagnostic evidence, not a clean aggregate
  rerun or restoration of the quarantined lane.

The interrupted run is
`lapis-notes-validation-0783fafe-67b9-41e4-a8b2-41a8230e5bfb`; isolated History is
`lapis-notes-validation-bcaad95a-f70c-4714-a3d4-069ea164331b`; the exact shard
recheck is `lapis-notes-validation-9fe292c5-377d-40d1-929c-f39ee14308f5`.
The existing [LN-CAT-121 quarantine](2026-11-01-storybook-browser-quarantine.md)
and its disabled-coverage reporting and restoration criteria remain unchanged.
Manual diagnostics do not relabel skipped hosted coverage as passing.

The committed-source package gate passes without selecting unpublished versions;
no npm publication occurs. Five explicit development consumer archives from the
first checkpoint were built in run
`lapis-notes-validation-508d311a-e761-4d52-b2d4-06786661fbb1`; API0.2.8 there is
modified development evidence and must not be published over the existing
registry version. Final committed-source consumer archive and canonical closure
follow the health repair.

## Invalidated close preflight

An additional exact race demonstrated that destructive preflight could accept an
empty in-flight List after a native invalidation had already made it stale.
`native-editing-observation.test.ts -t 'refuses destructive preflight'` fails
before the repair. The controller now records the epoch, local mutation and
invalidation represented by an accepted read; preflight rejects a superseded
read while the existing queued reconciliation completes. It performs no implicit
recovery, discard or content mutation.

Final source qualification for this repair:

- The exact preflight regression changes from one failure to one pass. All ten
  observation cases and all 70 directly affected cases pass.
- Clean registry-only `pnpm check:all` passes all 16 check, 16 test and nine build
  tasks: 1,771 API and 2,113 total package cases. Public package builds, publint
  and declaration guards pass. Run:
  `lapis-notes-validation-f128b12f-f5ff-4d31-9588-e1b26eb73b23`.
- All three focused cold recovery stories pass. Run:
  `lapis-notes-validation-0f078257-f4cd-4e95-bb80-ad430b27c174`.
- The complete cold catalog passes all 275 interaction/accessibility cases in
  four sequential shards (102/70/46/57), without retries or assertion changes.
  Run: `lapis-notes-validation-1c99f50d-e0a8-4ca5-962f-55152b11c157`.
- Canonical validation, mdBook, spec-first and App ownership pass. Final
  committed-source development archives and documentation closure follow below.

These runs validate source snapshot `7b66417c60d8f01d5b144ef300cc9b888d6fc627`.
They retain the original idle model sample and existing Problems recovery
assertions. The earlier interrupted health-slice run remains a failed aggregate;
this clean final-source diagnostic does not restore the LN-CAT-121 hosted lane.
Normal CI still reports its skipped interaction/axe coverage as quarantined.

## Committed-source development archives

The preflight repair is committed as `dfd3fa39c910bf6e9948b18189faf82cc5acb958`.
Its API source is identical to the final tested snapshot; intervening changes
only record evidence. `pnpm validation:consumer-pack` passes from clean empty
child `9c2e31f11f409863c0dfb8614114d51d3d9a6274`, producing five development
archives in run `lapis-notes-validation-5cded632-3c93-4556-bfd0-12766fcf54e4`.

All five archive SHA-256 digests match their generated provenance manifest. The
API archive has SHA-256
`1bf6a7fa97e5079579f368ead41652acb3ef7c21fa12dde0b4dc0a0a3a5748cd`.
Inspection confirms the public optional observer declaration and disposer, the
compiled preflight stamp/guard, and observation-error retention across actions.
Receipt: `.local/editing-intent-observation/final-consumer-archives.json`.

The final source canonical run is
`lapis-notes-validation-38c90ac0-e638-4075-a951-0a2117cf4752`; updated source
evidence passes canonical/App ownership and all 67 governance cases in run
`lapis-notes-validation-093c7eac-07c6-46ac-8503-af7e5a151ae9`.

These same-version development archives must never be published over existing
API0.2.8 or other public versions. A new API release remains gated by merged
source, exact-main qualification and publication/provenance verification. Server
adapter, registry intake, browser acceptance and actual public-image delivery
remain outstanding. The separate Mira/Markdown/Notebook release order remains
unchanged; no production or user data was modified.
