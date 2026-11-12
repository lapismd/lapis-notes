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
