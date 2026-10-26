# Native daily Task application coordination

Status: native daily policy source qualified; application writer stages remain waiting.
Last updated: 2026-10-26T01:04:33Z. Migration task: R3.2.1.2.10.3.
Requirements: LN-CORE-003/005/006.

Base: `19b5389d8d385cf363b342e6259e39597465aab9`, including separately
qualified current Markdown parser and one-file guarded Task intake. Existing
native owner controls and the master migration ledger remain root-owned.

| Acceptance step                               | State                         | Remaining boundary                                                                    |
| --------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------- |
| Tasks lifecycle intent                        | Source qualified              | Notes consumes its pin when ordered coordination is added.                            |
| Retained daily-provider reference             | Captured and replay qualified | Normal frozen replay passes inside the full API unit suite.                           |
| Native daily policy and registry              | Source qualified              | No filesystem authority; physical application acceptance remains waiting.             |
| Native provider snapshot and daily processing | Waiting                       | Visible/root-safe snapshots, missing-file creation and one guarded observation write. |
| Daily-before-Task ordering                    | Waiting                       | Original Task preflight, both guarded stages and observable partial outcomes.         |
| Cold recovery and explicit retry              | Waiting                       | Persist pinned stages and reconcile bytes without uncertain replay.                   |
| Tracked-today materialization                 | Waiting                       | Reuse the existing owner and explicit date policy.                                    |
| Both host selections and adapters             | Waiting                       | Preserve renderer authority until application gates qualify.                          |

Tasks owns retained lifecycle intent. Its source gate freezes complete traces
from the actual Task/occurrence repositories and qualifies the private pure
planner before this application consumes it. Notes owns the default daily
provider, safe creation, both guarded writes, partial outcome and recovery.

The daily-policy reference calls the existing Notes API provider/formatter.
Native implementation must follow the canonical coordination section, with
source qualification, native provider/one-file daily processing, ordered Task
writes, retained recovery and existing-owner tracked-today scheduling recorded
as distinct acceptance steps. Host selection remains pending throughout those
prerequisites; this record does not close the application gate prematurely.

## Qualified Tasks source

Tasks `a2e9f126afd54ab3e9f4418c5c41769bbf9876b0` qualifies the pure lifecycle
planner against 95 retained repository cases / 98 complete attempts. Its full
source gates pass 26 native tests, 2,848 unit cases and 62 cold catalog cases.
Native Notes adoption of that source remains a separate step.

## Retained daily-provider reference

`pnpm capture:native-daily-reference` calls the actual API default provider,
formatter and registry without changing their production TypeScript. The first
capture `b5331720-fbce-4b1d-8027-522181313bd7` passes 200 filename cases,
45 provider cases and 19 registry steps. Complete source outputs include exact
filenames, persisted Markdown, returned paths, schema, reads/writes and errors.

Before native implementation, source context is extended with public Luxon
week-setting observations. Local-week tokens depend on runtime Intl locale
week-info; current Node's removed `minimalDays` field uses Luxon's fallback.
The capture must preserve the effective locale and week settings explicitly,
rather than changing expected native filenames or guessing a calendar policy.
The first output remains in its immutable run receipt; the expanded authoring
capture is reviewed and frozen before any native baseline/implementation.

Expanded capture `9537810f-298f-43b6-91e4-2adf6ae3271a` passes. Its 200 filename,
45 provider and 19 registry outputs are byte-equivalent as JSON values to the
first capture; only `weekSettings` metadata is added (`firstDay: 7`,
`minimalDays: 4`, en-US/latn/Gregorian). The collected artifact is copied
byte-for-byte to the native fixture. No existing fixture is regenerated.
The first native policy target runs only after that artifact is present.

Exact baseline `pnpm validation:rust -- test -p lapis-app-core --test
daily_provider_reference --locked` fails with one E0432 diagnostic naming the
absent `services::daily` module. Receipt
`e564de2b-34df-4a9b-ba8e-affa39090136`; the fixture is present, and dependency
installation/compilation succeed before the missing implementation diagnostic.

Native policy implementation follows that baseline. It returns pure existing/
create plans and source-named errors, exposes explicit formatting context and
keeps provider registration separate from persistence. The shared ECMAScript
trim table is extracted unchanged from existing indexed/search code instead of
introducing another subtly different trim implementation. This helper change
retains full Notes check/test/build acceptance.

The first exact native result `8a6307b3-9b4e-4a09-98a2-dda8f73e9390` passes
three tests: all 200 exact filenames/source errors, 45 complete planned path/
Markdown outcomes and 19 complete registration/disposal event snapshots. The
policy comparison adapts only the provider IO boundary and preserves its full
result plus retained files; source IO/schema traces remain frozen for later
application acceptance. The supplied inventory order follows the unchanged
provider's captured read order rather than serde's sorted JSON object map.
Registry numeric fields use the established JavaScript Number canonicalization
on both operands, without relaxing fields, arrays or string equality.

The native formatting boundary explicitly refuses locale/week settings outside
this captured en-US/Gregorian context before creating a new daily plan. A final
exact regression additionally exercises three unqualified contexts. Existing
canonical lookup still bypasses new filename configuration as the source does.
No file writer, root capability, effectful provider invocation, journal,
scheduler or host selection is granted by these plans.

## Policy source qualification

Final exact target `0e805673-7256-4214-800b-2af8f79ac87b` passes all four native
tests, including refusal of three unqualified formatting contexts. Full
`pnpm check:all` passes in `3d9d1fe4-1c07-4e55-a333-fa7053cba185`, finished
2026-10-26T01:02:43Z. Its product snapshot is
`76ac249c904f4b585fb1bcde21f91ade09e1b175`, parent `19b5389d`.

The run passes strict native formatting/workspace Clippy, all package checks,
409 Rust cases (six existing ignored), 2,254 package unit cases (one unchanged
skip), the complete frozen API reference replay and all 11 production build
tasks. There are zero failures. A byte audit against the parent checks all
455 existing API source, fixture, Cargo/pnpm lock and native-pin inputs: no
differences. Existing projection versions and native source pins are unchanged.

Acceptance uses the previously configured temporary Docker archive cohort,
recorded in the immutable run result. Its Bases archive retains an older
provisional source-qualification annotation; this policy slice neither replaces
that artifact nor claims new Bases source/publication qualification. Its own
direct API reference and Rust policy inputs are qualified separately above.

Final `pnpm spec:check` passes in
`0de0ca96-1535-402f-bb45-810416d3f233`, including all 78 validator regressions,
canonical validation, mdBook and spec-first. Only this evidence record differs
from the qualified product snapshot. The frozen provider artifact SHA-256 is
`f14ddc03d15d7e31903109ec7933a25dceef4f524dbf3fdc7f126d26c3d020ff`.
No Storybook presentation, application default, visual baseline, publication or
deployment is selected by this source policy slice.

## Recovery boundary reviewed before the writer stage

Existing `turns/storage.rs` already implements physical profile admission,
single-writer locking, bounded records, conditional publication and retirement.
The later Tasks journal should reuse that IO mechanism while retaining typed
Task stages. It must not repurpose ACP turn records or create another note
writer/scheduler. No journal extraction is part of this policy slice.

Ordinary application-database submission is fenced when vault close begins.
Using repeated ordinary metadata transactions for an accepted multi-stage Task
job would therefore lose later stage publication while Closing. The remaining
application stage must preserve its own accepted durable authority through the
existing work drain, then reconcile pinned physical before/after bytes on cold
open. A successful daily write followed by a failed Task write remains an
explicit partial outcome; recovery does not silently rerun completion.
