# Web icon prerequisite integrated with retired-free fixtures

The independent source slice is recorded in immutable
[Web icon evidence](2026-11-17-web-icon-input-retirement.md). Its cold generator
regression fails before and passes after without a frozen desktop directory;
all seven output hashes equal the original committed public files. The raster
input itself is copied byte-for-byte with its original source/hash recorded.

After the real post-retirement signed-fixture Web acceptance passed all 13 cases,
only the six owning Web source/asset files from original source commit
`01d15f0372b14bf21fd2696c27a3b7c9ed0b859c` were overlaid onto its isolated
Notes `5ffb33c152404b6880debd1b5fd70762121d6196` checkout. No dependency,
production-runtime code, compiled package or user profile was changed.

In the existing omarchy Docker worker, Node24.15.0/pnpm10.34.5, the following
complete owning-package lanes pass:

- `pnpm --filter @lapis-notes/web check`: Svelte0errors/0warnings,
  Node/build TypeScript and e2e TypeScript pass.
- `pnpm --filter @lapis-notes/web test`: generator1pass and Vitest39pass
  across11files,0failures.
- `pnpm --filter @lapis-notes/web build`: generator, Vite and PWA build pass.

The 13-case cold browser receipt belongs to the earlier fixture slice, whose
runtime and icon output bytes are unchanged. It is supporting cross-slice
acceptance, not a claim that the icon source overlay reran those browser tests.

The source commit is rebased onto the separately reviewed fixture cleanup
`73c1200d289c70f6d3ad5844a8a3381bab7eed0c`. Three additive canonical-context
conflicts are resolved by retaining both the fixture and icon ownership text.
No executable code conflicts occurred. Full integrated `spec:check` passes in run
`f2ae4e3d-1ad8-4f87-a8cf-f5d2101b4eb1`, including source audits, mdBook,
spec-first and68specification-tool cases. Minimal standalone projection
diagnostics in the original receipt are preserved, not treated as passing.

Frozen desktop removal, native preservation, Website cutover, publication and
terminal retirement remain separate. This prerequisite neither deletes the
frozen host nor changes public pixels, icon identity, service routing or user
data.
