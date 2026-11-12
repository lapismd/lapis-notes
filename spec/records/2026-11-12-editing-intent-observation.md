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
