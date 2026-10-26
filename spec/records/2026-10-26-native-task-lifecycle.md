# Ordered native Task lifecycle application stage

Status: source-qualified; durable recovery, scheduling and both hosts remain gated.

This R3.2.1.2.10.3 source stage consumes one original-version-checked, opaque
prepared Task operation. It derives its plan from the qualified Tasks owner,
rechecks original admission before the first daily mutation, processes daily
observation content with the existing writer, then conditionally replaces the
original Task. A later failure retains a typed partial outcome with the original
action, snapshot, replacement intent and published observation.

Preparation owns its admitted Work lease. Lifecycle execution serializes with
other lifecycle operations, while every persistence boundary keeps the existing
physical-root, dirty/detached editor, alias and revision guards. This stage does
not introduce a new note writer, renderer scheduler or retry method.

The exact `pnpm validation:rust -- test -p lapis-app-core --test
service_task_lifecycle --locked` target replays complete retained repository
attempts, including the separately frozen valid-duration extension. Interference
acceptance additionally proves rejection before daily mutation, first-stage
failure without advancement, second-stage partial state and detach/close drain.
Cold recovery, retained operation identities, tracked-today scheduling and both
host selections remain later gates; this record cannot qualify those by itself.

## Exact before and after

The first exact target fails to compile in `1aa3cf9a-042f-4654-9439-f18eefe45944`:
both integration targets lack the ordered native boundary and planner source
pin. Tasks source `da17eba0` qualifies the required planner and separate valid
duration reference; only the private native pin is updated, with no npm or DTO
change.

Implementation run `f1d19be7-2dd0-4523-bce7-df4472d28878` passes all three
reference/admission cases and three guard cases; one newly authored guard
incorrectly expects a negative completion value to fail at planning. Retained
source intentionally validates quantitative ranges after ensure. The preflight
guard now supplies a missing value, which the source planner rejects before
ensure. No runtime check or assertion is weakened to move that validation.

Exact rerun `88ec8b42-5d05-447e-aa4f-9f6d854730ad` passes all seven integration
cases, including 92 original and 18 valid-duration repository attempts, with
zero failures. Existing failed reports retain their actual outcomes. A further
exact run strengthens complete daily-error equality before the private
interference and full source gates.

Complete daily transform-error replay passes in
`b6f8206f-9dd8-442d-a323-f843e14e2c6a`: all seven integration cases,
zero failures. Private interference run `f5e4d6bc-4646-4517-bfa1-f5b3de2a6c9a`
passes three cases and exposes one action-assertion representation mismatch:
JavaScript `8` versus native `8.0`. That assertion now compares the complete
expected action through its typed native representation, retaining every field;
the original captured fixture stays unchanged. Exact private rerun
`2ce992ac-819c-41a8-8b68-76976ed3aa9d` passes all four interference cases,
including daily-first order, second-write partial metadata, newly dirty original/
hardlink aliases, serialized competing plans and first-stage dirty refusal.
There are zero failures. Full `pnpm check:all` qualification follows.

## Rust boundary-audit source correction

The first full gate `ed942767-6614-4ed5-aa40-bc624d310a40` stops before
Clippy because the source audit mistakes the valid Rust field expression
`partial.daily.document.text` for a browser-global `document` reference. The
exact new Node regression fails once before the source audit fix and passes
afterward; all six boundary regressions pass in explicit native diagnostic mode.
The matcher now distinguishes bare names from member fields, including spaced
Rust field syntax, while still rejecting `window`, `document` and `globalThis`
bare accesses and all previous transport dependencies/source routing.
No product field is renamed, no source path is allowlisted, and no checker
finding is suppressed. Exact Docker audit and full source reruns follow.

An intermediate candidate also broadened the suffix grammar to whitespace after
a bare name. Docker `64be8709-710b-4ef1-a653-e80f30bea418` correctly exposed
two newly matched existing Rust locals. That unrelated broadening is removed;
the final matcher retains the previous bare-name grammar and only distinguishes
qualified member fields. Exact Docker audit
`58124a82-9708-4f42-ae51-73c339515c86` passes with zero findings. Full source
qualification is rerun against that final source.

## Complete source qualification

`pnpm check:all` passes in `68338cce-dbaf-4cd5-8c89-fdc0bb3afdc4`:
strict workspace Clippy/formatting and native build, all 442 ordinary Rust cases
(six existing model/platform ignores), six Rust boundary regressions, canonical
validation and all 20 package check, 20 test and 11 build tasks succeed.
Unchanged-input package tasks use their governed Turbo receipts; the workspace
Rust suite executes freshly. There are zero failures. A final path audit checks
all 1,634 retained package, story, catalog and manifest inputs: none differ from
the qualified parent. No UI/component/story output or installed host is selected
by this source-only slice. Final `pnpm spec:check` passes in
`3a3907d4-36e1-4e86-a124-c62bb3a8d5be`: all 78 governance regressions,
canonical validation, mdBook, spec-first and App/metadata audits pass with zero
failures. Final evidence/progress updates change no qualified product inputs.

The original lifecycle corpus retains SHA-256
`0d9de47410ffaba45a495c2df1b484c13b2a736a7f64c7263a1b4f8354732551`.
The separate duration corpus exactly matches its Tasks source artifact,
SHA-256 `55d5cb2a054de33dad58fecfb6cb0d22f1994867159521e2e106cf050734ad1d`.
