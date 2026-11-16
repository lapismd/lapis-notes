# Verified Notes dependency caches

LN-ARCH-095, LN-GOV-046/050/052/053 and LN-PKG-142 move active validation,
version preparation, package publication and Storybook Pages to the reviewed
shared current-input resolver. Source context/Dockerfile and frozen candidate
installs remain Notes-owned. The legacy pin updater/manifest remain available
only for explicit rollback; ordinary cache publication has no source/PR write
permission and retains only input, resolution and publication receipts.

All four shared actions pin the corrected reviewed Lapis CI cohort
`29d83b5a61c0cf2b895873489de43f0d85e38e48`. Complete context bytes, paths,
modes, reviewed base, pinned builder and both platforms determine identity.
The shared verifier checks the immutable index, cryptographic signature,
trusted main workflow/runner/source and complete inputs. Missing or unavailable
caches use the reviewed base; invalid proof is fatal. Every source container
still runs the exact frozen install. The stable blocking aggregate additionally
requires successful resolution. Runtime/host quarantine, release approval,
version writer authority and every pre-existing functional lane are retained.

## Regression ledger

- Initial exact `node --test scripts/dependency-image-adoption.test.mjs`:
  one frozen-install guard passed, five migration targets failed.
- After implementation: six of six passed; an additional release-policy
  mutation test guards missing resolver dependency, widened authority and a
  mutable helper. Focused final totals are recorded after complete checks.
- Wider old-contract suite initially passed 12 rollback tests and failed nine
  superseded pin-workflow expectations. Ordinary publication is now governed by
  no-PR producer/receipt contracts; explicit pin-updater tests remain.
- A new rollback source-path assertion initially failed because the helper
  stores chapter paths relative to spec/src; its corrected expectation keeps
  all three mapped output paths, alongside executable atomic updater tests.
- Initial release policy rejected the new dynamic container references. The
  policy now requires the reviewed reusable resolver and an explicit dependency
  for every dynamic container; missing wiring and mutable references fail.

Actual hosted publication, cold/warm complete consumer acceptance, repeated
reuse without a pin PR and bounded cleanup of obsolete bot-only image PRs
remain pending. Local wiring tests do not establish those hosted results.
No Deno host/package source, signing secret, visual baseline or advisory
exception is changed by this portable CI cache migration.

## Local qualification

Final exact source-wiring and policy target: 55 tests passed, zero failed.
The added negative dynamic-container fixture initially hit an earlier YAML
format-sensitive guard after stringify; preserving the original workflow bytes
while removing only its resolver dependency proves the intended rejection.
`LAPIS_NOTES_VALIDATION_RUNTIME=native pnpm release:test`: 120 passed, zero
failed. `pnpm spec:check` passes all six configured lanes and all 69 validator
regressions, App ownership and metadata-query audits. `pnpm release:check`
passes all applicable portable release/configuration gates; desktop release
jobs remain absent. Existing audit policy passes with one recorded LOW ignore.
Actionlint passes all five touched workflows. Node-based context preparation
and shared identity validation accept 17 permitted context files, identity
`sha256:c64d20c0e8030fbb0626f70e6e2dcd37af724b83af131515a9113939f91da3d9`.
This verifies actual context completeness and policy, without claiming a built
or signed dependency image or hosted consumer acceptance.

The candidate was rebased onto main `4d9e01e61eed701febe76c4899df63a09aa45b08`
after the genuine App Profile version PR merged. All 120 release tests, six
specification lanes, ownership/metadata audits and release policy checks pass
again. The current 17-file identity is
`sha256:b5d06ecd5afd83d6a6a85de8137cc8b90d521f285306d029c9af7528d0f915bf`;
the earlier receipt above records the initial candidate. The unchanged lockfile
with a changed package manifest correctly produces a different complete-input
identity. No incoming version, changelog or consumed Changeset is reverted.

## Requalification against current main — 2026-11-16

PR #135 was rebased without conflicts onto main
`ee6615b2bb2fe63642d7288763fa7e5816edca16`, retaining the unrelated Sync
integration from PR #136. A byte comparison preserves all sixteen incoming
non-overlapping Sync files and every unrelated package-verification row;
only the already-scoped cache row differs in the overlapping verification file.
Root manifest, workspace configuration and lockfile are unchanged from the
previous cache candidate. No frozen-host or Deno package change is introduced.

The exact cache-adoption target passes 7/7. Complete release tooling passes
120/120; specification checks pass all six configured lanes and all 69 validator
regressions, including App ownership and metadata-query audits. Release policy,
formatter and actionlint for all five touched workflows pass. Audit retains the
existing one recorded LOW ignore without adding an exception. Hosted CI for the
refreshed head, actual publication and complete warm consumer acceptance remain
required; this requalification does not claim those hosted results.
