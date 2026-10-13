# Generated Changesets PR governance

Run `38337214781` on the generated Version Packages PR (#5) failed two lanes:
seven missing-chapter diagnostics from spec-first and two release-intent unit
assertions. Ordinary PRs passed because their source changes included chapter
updates and their branch environment did not trigger the generated-release
shortcut.

Notes now follows Mira's documented policy: only PRs from the exact
`changeset-release/main` branch skip CI spec-first and release-intent. Those
source-change gates were satisfied by the constituent source commits. Canonical
spec validation/build and every package, unit, Storybook, artifact, and aggregate
lane remain required. The exception is documented by LN-GOV-047.

Release-intent tests inject an explicit ordinary-branch context instead of
inheriting `GITHUB_HEAD_REF`; the generated-branch case remains explicit. That
independent repair is commit `69fb4a09`.

Evidence:

- `GITHUB_HEAD_REF=changeset-release/main node --test
scripts/check-release-intent.spec.mjs`: 1 pass / 2 failures before, 3/3 after.
- `node --test --test-name-pattern 'generated Changesets'
scripts/check-release-workflow.spec.mjs`: 1 pass / 2 failures before, 3/3 after.
  These tests parse the actual workflow, evaluate both gate conditions for the
  exact generated branch, other branches, and non-PR events, and verify the
  remaining lanes still feed the aggregate.
- `GITHUB_HEAD_REF=changeset-release/main pnpm release:test`: 46/46.
- `pnpm release:check`: release configuration and workflow checks pass.
- `pnpm spec:check`: specification validation, mdBook, ownership/metadata-query
  audits, and all 27 specification regressions pass.
- Explicit repair diff against main passes spec-first and release intent.

The repair PR targets main. After merge, the existing Changesets automation can
refresh #5 with this policy and the test repair. It does not hand-edit package
versions, modify the generated release branch, merge main, or publish packages.
Aggregate application/browser verification remains assigned to GitHub CI.
