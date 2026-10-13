# Dependency-image pin PR governance

PR #7 run `38327501661`, governance job `115083021046`, failed the spec-first
command comparing `origin/main` with its merge candidate. The image producer
successfully published the dependency image, but its generated PR changed only
`.ci/images.json`. LN-GOV-003 requires Architecture, Packages, and Specification
Governance updates for that protected configuration.

The verified-pin updater now records the image digest, lockfile tag, and full
lockfile hash in bounded generated blocks in all three mapped chapters. It
reads every chapter and validates existing markers before writing the pin or
any chapter. Repeated identical pins are idempotent; subsequent pins replace
the previous snapshot. The workflow stages the complete output set and checks
that same set for a no-op. LN-GOV-046 documents this automation contract; the
spec-first map and enforcement remain unchanged.

Evidence:

- Exact PR diff gate: three missing-chapter errors before, zero afterward.
  `pnpm spec:first --base 85350434e9d2deb80a52b0010e6ce55e9a96a6bf --head
<repaired-commit>` passes with three protected files and four canonical
  chapters. Release intent also passes for the same diff.
- `node --test scripts/ci-images.test.mjs`: the first two new CLI regressions
  produced 8 passes / 2 failures before implementation; all 12 tests pass after
  implementation and additional marker/staging coverage.
- `pnpm release:test`: 43/43, including all image and container regressions.
- `pnpm release:check`: release configuration and workflow checks pass.
- `pnpm spec:check`: all configured lanes, mdBook, ownership and metadata-query
  audits pass; specification regression tests pass 27/27.

The repair uses the already published digest from PR #7 and does not publish
another image, publish npm packages, or merge protected main. Aggregate product
and browser verification remains assigned to GitHub CI.
