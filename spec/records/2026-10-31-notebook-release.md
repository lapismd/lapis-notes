# Compact Notebook editor release

The user authorizes push, merge and publication on 2026-10-31. The isolated
candidate combines fetched main `80366a17` (API 0.2.1) with the verified compact
inline-editor source `0e5a4d9d`. It restricts full-document trailing space to
non-inline editors and retains the source slice's portable runner repair after
the root Cargo workspace extraction. A patch Changeset requests the API update;
Changesets owns any dependent package versioning. Existing `next` tag policy
remains unchanged.

## Scope and workspace inventory

All seven registered workspaces are inspected. The detailed statuses, heads,
unique ancestry and owning API differences are retained under ignored
`.local/release-preflight/notebook-20261031/workspace-inventory.json`.

| Workspace                            | Disposition                                                                                                            |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| default                              | Clean; independent Sync cleanup PR #51 is preserved and excluded.                                                      |
| desktop-profile-intake               | Uncommitted generated host-module intake is preserved and excluded.                                                    |
| notebook-inline                      | Clean; compact-editor source included, released main metadata retained.                                                |
| notebook-release                     | Active combined release candidate.                                                                                     |
| notes-ci-browser-repro-20261031      | Uncommitted independent browser-runner diagnosis is preserved and excluded.                                            |
| notes-minimatch-security-20261031    | Qualified API matcher commit `5a24816e` is duplicated into this candidate; its unrelated Sync parent remains excluded. |
| notes-release-followthrough-20261030 | Clean; published main already included.                                                                                |

Independent work is neither overwritten nor merged into the Notebook slice.
Fresh Dependabot queries return zero; no empty dependency PR is created. The
existing automated dependency-image PRs are not Dependabot/product changes.

## Qualification

The source regression in `spec/records/2026-10-30-inline-editor-spacing.md`
records one exact failure before the repair and one pass afterward. The combined
candidate repeats `pnpm test:storybook -- stories/workspace/lapis-editor-demo/LapisEditorDemo.stories.ts -t 'Inline Source Editor Spacing'`:
one pass, 18 skipped, report
`lapis-notes-validation-f8bfdc03-c027-47e3-9e15-695a805b6cc7`.

The fresh combined Docker run passes `pnpm check:all`, including the API's
1,723 tests and all package builds, and all 269 interaction/accessibility
stories across four cold browser shards. Reports:
`lapis-notes-validation-4d473ae5-023b-475f-8291-698e084fd484` and
`lapis-notes-validation-f3a38aa9-84cc-4687-8758-0bdd097a98cb`.
Static Storybook also passes, rendering all 194 specification chapters, report
`lapis-notes-validation-6fd92bd4-2535-425f-ab61-863284012f11`.
`pnpm packages:check` passes. The first `pnpm packages:pack` stops at its
clean-source guard because the integration change is not committed yet, report
`lapis-notes-validation-4e6a634a-6994-4a67-82a0-915b270fb982`. Commit the
qualified integration before repeating that exact command; do not bypass the
guard. Package packing, final specification, hosted CI and registry publication
remain release gates. Visual status remains pending; baselines are unchanged.

The initial merge-shaped candidate's specification check reports three missing
mapped chapters because the validator compares each parent independently,
including already-released main changes. The integration is linearized on main
with an exact tree-equivalence check; no product or canonical content is dropped.
The explicit main-to-candidate `pnpm spec:first` range passes (three protected
files, five canonical chapters), report
`lapis-notes-validation-11c1e58e-df7e-431d-8d8b-f05a4ced806a`.
The standalone runner's unpaired `--head` invocation is rejected by the CLI;
the explicit paired range is used. The original full `pnpm spec:check` now
passes with no selectors or waivers, report
`lapis-notes-validation-21daf7c2-96cf-4b35-b1d0-f68dae272fc8`.

The exact pack command still fails after a clean commit, report
`lapis-notes-validation-d1f806b6-53e0-4929-b476-0c4cc4a79927`. Inspection of
the retained owned worker identifies deterministic generated-source drift:
the host-module catalogue still records API 0.1.4 while the manifest is 0.2.1.
The generator correctly updates those versions during a build, making the
checkout dirty. Regenerate that catalogue and add generation after version
bumps. The isolated version-recipe regression fails once (1.2.3 instead of
1.2.4), then passes with the step wired; a subsequent generator run is identical.
The clean-source guard and frozen registry installation remain unchanged.

After Design Core's packed audit exposes the matcher advisory, the already
qualified API-owned matcher fix is relevant to this release. Only commit
`5a24816e` is integrated, preserving its original workspace and excluding its
unrelated Sync parent. The combined glob/vault/workspace target passes all 155
cases. Final package and browser qualification waits for the released Core
0.7.2 dependency floor required by that source record, avoiding repeated
preliminary full runs against the older cohort.

## Released dependency admission

Design Core 0.7.2 and Mira 0.1.3 are published with verified registry integrity,
provenance and GitHub releases. API and the root development cohort now require
those registry ranges, retaining the existing companion versions and next-channel
release policy. Final focused and full qualification follows on this graph;
no source archive projection is configured.

The final registry-only focused API target passes 155 cases, report
`lapis-notes-validation-c20c4270-9138-4658-9dad-5bbaa3a4f1e1`; the compact
inline-editor story passes once (18 unrelated scenarios skipped), report
`lapis-notes-validation-65a37e52-c58c-4b17-a4ff-08e024b689cf`. The version
recipe regression passes once. Full `pnpm check:all` passes on the released
graph, report `lapis-notes-validation-3e82f716-ba63-4a67-8c00-03f5fbc4aaa6`;
`pnpm spec:check` passes, including all 67 governance cases, report
`lapis-notes-validation-04428317-5995-4621-91e6-011ceff8c8af`.
Clean-source packing and full browser/release qualification follow this commit.

The final clean-source `pnpm ci:release` passes package boundaries, all release
regressions, packing, 194 static specification chapters, all 269
interaction/accessibility stories across four fresh shards (99/67/46/57),
six static documentation checks and eight live documentation checks. Report:
`lapis-notes-validation-7de2379e-86af-4c33-909d-8437251f9f85`.
The final `check:all` has 2,152 package tests; repeated internal build/check
executions are not counted again. No functional or accessibility failures
remain. Fresh fetch retains main `80366a17`, workspace dispositions are
unchanged, and the final Dependabot query is empty. Hosted CI and publication
remain separate gates.
