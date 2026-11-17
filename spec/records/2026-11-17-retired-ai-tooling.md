# Retired shared-AI launcher removal

This substep removes Notes-owned paid-agent probes, the shared-controller smoke
launcher and deterministic workspace/reset fixture. These tools imported the
frozen desktop's Deno controller host or retired shared AI runtime. They are
not the current App Profile native-chat registration or the API file-tools.

Seven old script/test files and all root controller/smoke commands are removed.
CI, the validation lane and its bounded Turbo task now run a fail-closed launcher
regression. Normal and canonical checks enforce the same source audit under
LN-CAT-122. No package dependency, lockfile, public export or native host changes.

## Evidence

- Original smoke/fixture/routing baseline: `node --test
scripts/ai-host-storybook-boundary.test.mjs
scripts/lib/ai-real-host-fixture.test.mjs scripts/local-test-routing.test.mjs`:
  6 pass, 0 fail. Five removed tests belonged solely to retired tooling.
- New `node --test scripts/retired-ai-tooling.test.mjs` initially has 1 failure
  and 1 pass, identifying 13 obsolete files/commands before removal.
- After removal the same exact target passes 2/2; with local routing, 3/3 pass.
- Registry-only Docker `test:retired-ai-tooling` passes 2/2.
- Registry-only Docker `spec:check` passes all configured lanes, mdBook,
  specification-first, App-ownership, metadata-query and 69 spec regressions.
- Registry-only Docker `validation:check` passes all 77 tooling cases.
- Registry-only Docker `release:test` passes all 199 cases, including the changed
  CI workflow and actual bounded/cached root test routing.

[Exact source and invocation receipts](2026-11-17-retired-ai-tooling-validation.json)
retain each snapshot. Specification/release/tooling qualification uses source
`a44498b50a9d7429bf3cdfb75f68181f3dd2423b`; later edits only record evidence.
Final Docker specification checks pass again with the completed evidence and
verification updates (run `edcf7da7-bf47-475b-8fb8-93e531c88817`). Formatter and
the original exact target pass again before commit.

The first spec run rejected missing package/governance mappings; those chapters
now explain the private-tooling boundary. A follow-up hit the 400-line limit
when adding package context, so that context moved to the shorter App/services
chapter. Neither guard was weakened. Host mirror generation lacked TypeScript;
Docker validates unchanged metadata-only mirror routes. An initial formatting
invocation received line-number-prefixed paths and changed nothing; explicit
tracked paths corrected it. Host QMD doctor reports a Node ABI mismatch; Notes
search returned verified anchors through its provisioned CLI, while Plugins'
search explicitly used its text fallback. Product checks use remote Docker.

## Remaining boundaries

Notes still has duplicate shared-AI stories, shared panel/workspace registrations,
preview/manual-controller bridge, archive/optimizer entries and dependencies.
Retire those in the next source substep. The direct controller dependency also
still supports the existing dependency-security regression until that owning
consumer closure is migrated or retired. Do not treat this tooling-only source
qualification as native lifecycle, installed-data, release or deployed-registry
acceptance. Preserve the frozen desktop until its later slice, the standalone
controller for excluded consumers, active native chat and API file-tools.
