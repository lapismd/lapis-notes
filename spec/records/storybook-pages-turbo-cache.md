# Storybook Pages preflight and CI caching

Pages run `38361443720`, job `115176345057`, failed before building the
catalogue: `@lapis-notes/api/build/vite` resolved to an absent
`dist/build-tools/vite.js`. The workflow installed dependencies and immediately
loaded Storybook configuration without preparing workspace package outputs.

Pages now restores or builds the package graph through the signed Turbo wrapper
before loading Storybook. CI, Pages, and local `ci:release` parity use cacheable
root tasks for static Storybook output and successful interaction/accessibility
results. Static cache entries include the catalogue and Visual Delta build
statistics. A cache miss executes the existing static build/index audit or all
four sequential Vitest shards; failed tasks are never reused. Each workflow
reports Storybook reuse separately from package restoration.

Cache keys include tracked root inputs, aliased workspace source and build
configuration, dependencies/patches, CI setup/image inputs, and the actual
Node version, OS and architecture. CI mode, Node options and Playwright browser
path are hashed. Cached CI tasks receive an isolated toolchain environment;
manual Storybook commands remain available for live-host acceptance.

The API build also regenerates a tracked source host-module catalogue. That
catalogue is now a declared build output alongside `dist`, so a cache restore
provides the same source-aliased runtime input as executing the build. Local
API-version catalogue churn is excluded from this infrastructure change.
Requirements are LN-PKG-152 through LN-PKG-156.

## Evidence

- Pages focused regressions: initial 0 pass / 2 failures; final 3/3, including
  rejection of a package build after Storybook.
- Cache configuration/wiring regressions: initial 0/2; final real-Turbo suite
  7/7. Fixtures prove static artifact restoration, successful interaction
  reuse, story/workspace-source/lockfile/toolchain invalidation, retry after
  failures, and generated API catalogue restoration after a checkout reset.
- The release configuration audit still expected the old direct Pages command.
  Exact `CI and Pages` regression: 0 pass / 1 failure before, 1/1 after requiring
  the cached static task.
- `pnpm release:test`: 56/56, including the seven cache acceptance tests.
- `pnpm release:check`: configuration and workflow checks pass.
- `pnpm spec:check`: canonical validation, mdBook, ownership/metadata audits,
  and 27/27 specification regressions pass.
- `node scripts/run-turbo.mjs build --summarize`: complete ten-package build
  graph passes. A fresh-process `ci:storybook-static` run builds successfully
  and its index audit finds all 36 specification chapters.
- Actual static cache acceptance resets the API catalogue and removes the site
  index before repeating the task: 5/5 local cache hits, zero tasks executed,
  212 ms. The missing page is restored byte-for-byte; all four required static
  and statistics outputs exist.
- Explicit `spec:first` and `release:intent` gates against main pass.

Local fixture acceptance proves local caching. Signed remote Storybook reuse
and the complete interaction/accessibility lane are assigned to GitHub CI,
consistent with the requested pause on broad local final verification. Required
`validate` lanes and branch protection remain intact. Pages publication will
verify its restored output before uploading and deploying after merge.
