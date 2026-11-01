# Storybook browser-runner quarantine

Status: **automatic execution disabled** under LN-CAT-121 on November 1, 2026,
at the user's explicit request to quarantine, document and disable flaky tests.
Owner: **Notes validation tooling / lapis-notes maintainers**.

## Scope and coverage gap

The quarantined boundary is the shared Vitest/Chromium Storybook runner. It
loses its browser RPC connection while starting different story modules; no
individual failing assertion consistently identifies a smaller safe boundary.
Disabling only the named story would move or conceal the transport failure.

Normal pull-request/reusable CI skips `storybook-interaction`, excludes it from
the blocking aggregate, and reports the quarantine in the specification job's
warning and summary. Local `ci:release` also omits this runner. **All 275 current
Storybook interaction and axe cases lose automatic CI coverage. Skipped coverage
is not passing coverage.** No assertion, timeout, runtime-warning guard, story,
visual baseline or browser retry setting is relaxed.

Static Storybook and static specification checks, separate development
specification browser acceptance, package tests/checks, governance, release
artifacts, Web end-to-end acceptance and PWA artifact acceptance remain enabled
and blocking. Visual review retains its existing independent policy.

## Retained evidence

| Candidate                     | Run / job                                                                                                               | Observation                                                                                                                                 |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Mira #72, `ad5acea8`          | [run 41349857180](https://github.com/lapismd/lapis-notes/actions/runs/41349857180), jobs `124978123342`, `124981550571` | Both attempts pass 102 + 70 + 46 cases, then lose browser RPC at Search Highlight after 51 final-shard passes.                              |
| Visual Delta #74, `747c9ba4`  | [run 41349858630](https://github.com/lapismd/lapis-notes/actions/runs/41349858630), jobs `124978170649`, `124981546680` | First attempt loses RPC at AI Chat after 91 passes; retry reaches Link Preview with 55 final-shard passes, then module import and RPC fail. |
| Shared repair #77, `a27b7499` | [run 41349869202](https://github.com/lapismd/lapis-notes/actions/runs/41349869202), job `124978144235`                  | Initial attempt loses RPC at Link Preview after 55 final-shard passes; the unchanged retry passes.                                          |
| AI Host #73, `8a7ec3c3`       | [run 41349858008](https://github.com/lapismd/lapis-notes/actions/runs/41349858008)                                      | Storybook passes. A separate transient plugin-bundle download failure passes its isolated PWA retry.                                        |

Exact Visual Delta frozen-registry qualification under CI's Node 24.15.0 passes
AI Chat 6/6, the first complete shard 102/102, then the complete catalog
102 + 70 + 46 + 57 = **275/275**. `DEBUG=pw:browser` records all four Chromium
processes exiting with code 0. These local passes demonstrate intermittency;
they do not prove the Linux transport cause fixed or replace disabled CI coverage.
The separate UI optimizer repair and its 19-failure-to-19-pass regression remain
in [the dependency investigation](2026-11-01-dependency-update-ci.md).

## Explicit diagnostics

Run locally with the repository's provisioned Node/pnpm toolchain:

```sh
LAPIS_NOTES_VALIDATION_RUNTIME=native DEBUG=pw:browser pnpm test:storybook:run
```

Or explicitly dispatch **Lapis CI** at the candidate ref with
`run_quarantined_storybook=true`. That job restores package builds, runs the
complete browser catalog without a cached result, retains browser stderr/exit
diagnostics and reports cgroup memory counters and filesystem capacity. Its
errors remain fatal. A manual diagnostic result does not silently re-enable CI.

## Restoration

Identify and fix the transport cause at its owning boundary, retaining browser
stderr, child exit and live resource evidence. Require three consecutive full
cold Linux runs at the repaired candidate with zero failed cases, unhandled
errors or retries. Then remove the dispatch-only condition, restore the browser
lane to `validate.needs` and its result array, restore it to local `ci:release`,
update the policy regressions, and retire this quarantine in canonical
requirements, verification and backlog. Keep the separately blocking
specification browser lane unless its coverage is explicitly restored elsewhere.

## Quarantine validation

The two focused quarantine-policy regressions change from **2 failed to 2
passed**. Complete release tooling passes **109/109** cases, including aggregate
failure checks for every enabled lane. `release:check`, formatting and
`spec:check` pass, including six validator lanes and 67 specification regressions.
The full root build passes all nine tasks before the concurrent AI Host merge;
its generated Deno lockfile refresh is excluded from this CI-only change.

After rebasing onto main `e157bf8c` and a frozen registry install,
`LAPIS_NOTES_VALIDATION_RUNTIME=native TURBO_CONCURRENCY=2 SPECIFICATION_PORT=17310 pnpm test:specification:dev`
passes **8/8** cases against a fresh Storybook server under Node 24.15.0, with
four prerequisite package builds. Final main-integration specification checks
also pass. Hosted results remain separate; the quarantined browser suite is
disabled coverage, regardless of local historical passes.
