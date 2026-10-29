# Declared native target default modes

Status: Source complete. Full source, cold/static catalog, refreshed hosted,
specification and package-output checks pass. Desktop package intake and
real-provider application-screen acceptance remain separate gates.

## Problem and ownership

The retained native chat observer submitted literal `ask`. Codex's native mode
admission correctly rejects that value; a separate direct `read-only` HTTP probe
already passes without a model override. Display names and opaque browser target
IDs are not provider authority.

LN-CORE-009/010 now require each trusted host installation to declare a bounded
`default_mode`. Rust owns the portable target metadata and the hosted operator
configuration. Missing, untrimmed, control-bearing or over-256-byte values reject
hosted startup. Native chat refreshes target metadata for every new submission,
looks up the exact selected target and submits its declared mode. Missing,
malformed, disappeared or failed metadata refuses before any Submit request.
Explicit low-level modes and accepted records remain unchanged.

Desktop's later host intake must read explicit execution mode or the trusted
prepared runner default: Codex `read-only`, OpenCode `plan`, otherwise existing
`ask`. Neither the connection-kind field nor an ID/name heuristic identifies the
runner. The public metadata extension was explicitly approved by the user.

## Focused evidence

All authoring runs use isolated Docker workers and exact source snapshots. They
retain the previous qualified eight-package archive cohort; final admission must
also adopt the newer shared tooling/dependency slice.

- Original exact observer run `0e494d15-7695-459e-b595-1719e2749a93`: nine failures
  and 12 filtered cases. The same nine pass after the fix, together with the
  complete 21-case observer file (`675d6b6a-cca8-4e77-91ed-2afcfc0fc3ca`).
- Added metadata-refresh transport failure exposes one failure / 22 passes in
  `eca910dc-90b5-4ee1-b2d2-0066a7ffe570`. Refusing that read failure before Submit
  repairs the regression. Final exact 11 cases and all 23 observer cases pass at
  `1b13c0b2-48f6-4a60-85fd-aca59a79c58d`.
- Native run `8e6fa43c-4f66-4f40-8da8-e2e9863d5f93` passes all eight targeted
  installation/operator/transport cases, Rust boundary checks, strict workspace
  Clippy, formatting, generated-protocol drift and protocol TypeScript checks.
  Hosted metadata declares `plan` while an explicit `ask` remains `ask` in the
  accepted record. Invalid operator metadata fails before admission.
- The canonical `pnpm protocol:generate` runs against Rust inside that native
  worker. Its generated schema and two turn TypeScript bindings are copied back;
  no hand-written protocol shim is introduced.

An early authoring selector accidentally ran broader package tests without their
build prerequisite (`faf5ee7d`); that attempt is not qualification. The corrected
exact failure above remains the before evidence. Local workspace Cargo metadata
cannot resolve sibling paths and no local compiler acceptance is claimed.

The first full-source preflight (`df06ec76`) stops at specification validation:
the two new requirement headings used a non-defining level. That authoring error
and the canonical Rust chapter mapping are repaired before the complete rerun;
no functional failure is waived and the failed receipt is retained.

The next preflight (`8e4d2242`) catches the mapped architecture page above its
400-line limit; the duplicated explanation is replaced by a link to the full mode
contract, preserving all requirements. Full run `7228c6b6` then reaches native
execution and exposes one configured-binary fixture that omits the new required
field. Its operator fixture is updated; the unknown-arguments refusal fixture
also declares a valid mode so it continues to test the intended rejection.

## Integrated source evidence

The source is stacked on committed Notes `8fba7f2b` plus tracker-only `5d6f5eb8`
and uses the refreshed
ten-package cohort. Full `check:all` at `dcffcea0-bf1b-401c-bf8c-70886b3b94f9`
passes 346 Rust cases (six retained ignores), 2,220 package cases (one retained
skip), strict checks and all builds. The source mode code is unchanged from its
focused qualification; dependency, fixture and documentation intake are explicit.

The built hosted chat case initially rejects the old operator fixture's missing
mode (`f33dcda1`). Declaring `plan` reaches the reply/History journey, then exposes
an existing cold persistence poll that throws before `workspace.json` first
exists (`e8ff782d`). The poll now waits only for ENOENT and still rejects every
other read error and requires the persisted History marker. Exact chat and all
eight Rust-hosted journeys pass at `135429b4-268c-4385-9ec5-a914b1bf3509`, along
with complete Web checks. The native worker records exactly one prompt and the
declared `plan` configuration after service restart. This is a fixture provider,
not an installed-provider claim.

The initial ignored browser launcher lacks its profile build prerequisite
(`e28b7780`); the corrected worker uses public dependency builds. A subsequent
catalog dispatch stops before creating a worker because its Jujutsu checkout is
stale after the parent intake advances. Updating that checkout onto the stable
committed parent preserves every source edit before the cold rerun. Neither
failed preparation is counted as a functional run or bypasses a workspace lease.

The refreshed ten-package cohort passes the complete cold catalog at
`8e40dedb-25ab-42f3-b8ab-a6b91cf7389e`: all 261 stories and eight development
specification-browser cases. Its static build and all six applicable static
specification-browser cases pass at `aaeff82a-e0c8-47c4-941c-dfc0e149836a`;
two development-only cases retain their static skips.

The refreshed hosted run `7b0bc62b-dfc8-4022-adca-cfece3b2edfa` passes all eight
built Rust-hosted journeys and complete Web checks. Final specification validation
then stops on the missing mapped server-host chapter update, before packing.
That chapter now links the declared-mode contract without changing Node behavior.
Its focused specification/packing follow-up retains the passing functional gates;
no provider or application code changes for this documentation correction.

Final follow-up `97b836ac-6914-4d3c-9f7a-79e292ff263d` passes the complete
specification and progress lanes and builds/packs the public API and private
application-profile boundaries. Snapshot `d6ba8473` has the same implementation,
fixtures, tooling, manifests and lockfile as the complete functional gates;
later changes update only specification/evidence and tracker documents.
The public-input archives retain their original qualified snapshot identity:

- API SHA-256: `119e55457bde59f38c6db14690ccf0fdf5ccc118d1cb9fe7fedc3ff48e05a0a3`.
- App profile SHA-256: `6639a69c5af9f036d7a85d5935aa9d3d29061bae418bfdc2b130bed45cf0e543`.

A final document check (`a365319b`) catches a stale generated tracker after its
CLI was invoked from another checkout. Regeneration uses the same generator's
explicit root argument for this isolated source. No functional gate is rerun
for that document-only correction. Final complete specification follow-up
`4ec4d7cc-3e5a-4f1a-b306-f622d6f83f56` passes.

Desktop's separate prepared-launch adapter is
committed at `f289874c`; three focused and all 240 native cases pass there.
Its source qualification does not admit mismatched protocol/package inputs.

## Remaining gates

Qualify Desktop's matching packed public inputs separately.
Real installed-provider retained-screen detach/cold restart in both hosts must
prove no replay. Direct transport probes, DTO checks and observer fixtures do
not complete R2.3 or select native AI as either host's default.
