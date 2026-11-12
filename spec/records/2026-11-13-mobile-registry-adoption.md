# Mobile registry integration

LN-ARCH-005, LN-ARCH-041, LN-WS-105 and LN-WS-106.

This integration builds on the immutable [source qualification](2026-11-12-mobile-layout.md),
rebased onto Notes main `d7cf332f`, preserving its Mira 0.1.5 and Agent UI 0.2.3
refresh. Core PR 74 is merged; release run 43336450960 published
`@lapismd/design-core@0.13.0` and passed clean-install and provenance verification.
Its registry shasum is `a79cf72f85cc30d40a6b59b7e897b2288b896d54`; the
lockfile integrity matches the registry. No local Core projection is used.

Workspace requires Core `^0.13.0` because it uses the mobile contract
unconditionally. Root, API, UI, Web and private App Profile select the released
line; compatible API/UI/File Explorer ranges admit it. The Workspace Changeset
is minor; dependency-only public changes are patches. The assembled pending
plan selects Workspace 0.4.0, API 0.3.1, UI 0.1.9 and File Explorer 0.2.5.
Version preparation and publication remain separate gates.

## Before and retained attempts

Hosted Notes run 43326827625 failed build-cache with two Core API errors:
`mobileNavigation` and `mobileSearchAction` were absent from the old registry
release. Other dependent jobs skipped. The fresh registry graph repairs this
exact integration boundary.

The initial focused unit invocation preceded API dist and failed one suite on
the missing workspace-host export; no test bodies ran. Root build refreshed
those public exports and the exact target passed four tests. QMD initially
reported a Node ABI mismatch; `pnpm rebuild better-sqlite3` under Node 24
repaired it. Doctor then passed 10 checks with the existing alias warning,
and `pnpm spec:search --semantic 'mobile layout'` returned QMD results.

An environment/session reset interrupted early wider lanes. They are incomplete
attempts, not passing results. One concurrent browser-output cleanup disrupted
Turbo traversal during a spec lane; the serial full-range spec check passed.
The dependency manifest intake initially lacked mapped Explorer, editor-demo
and retained-UI chapters; their portable Core identity contract is now recorded.

The new Web test initially imported the full App declaration graph into its
standalone e2e TypeScript project, producing 18 library declaration diagnostics.
It now follows the existing serialized browser-port pattern for its single
vault read. All persistence and responsive assertions remain. The exact
`pnpm --filter @lapis-notes/web check:e2e` and full root check pass.

The initial complete catalog passed shards 1–3 (102, 70 and 47 cases). Shard 4
passed 55 cases but lost its browser connection before LinkPreviewAcceptance
could run: one unhandled transport error, no assertion failures. The exact
LinkPreviewAcceptance file passed both cases unchanged in a fresh process;
the complete shard 4 then passed all 57 cases with zero errors. No assertion,
error handling, accessibility policy or test selection was weakened.

## Released-graph qualification

Local host lanes deliberately select the supported
`LAPIS_NOTES_VALIDATION_RUNTIME=native` under Node 24.15.0 and pnpm 10.34.5.
They do not claim Docker parity or native application qualification.

- `pnpm --filter @lapis-notes/workspace exec vitest run
src/lib/mobile-workspace.test.ts`: 4 pass on the current graph.
- Fresh Storybook at port 7310, exact `tests/workspace/mobile-layout.spec.ts`
  with `--workers=1 --retries=0`: 2 pass. Complete workspace pointer lane: 12 pass.
- `pnpm build`: 9 tasks pass, including public package output and production Web.
- `pnpm check`: 16 tasks pass, including Svelte, TypeScript, Web e2e types,
  App ownership, metadata-query, no-Tailwind and canonical validation.
- `pnpm test`: 16 tasks pass; package logs total 2,123 tests across nine packages.
- Complete Storybook interaction/accessibility coverage: 276 cases pass
  (102 + 70 + 47 + repaired complete 57), with the failed attempt retained above.
- `pnpm exec spec-validator check --base d7cf332f --head <snapshot>`:
  all 6 lanes pass, including full-PR spec-first and mdBook.
- Final `pnpm build-storybook`: 5 tasks pass; all 194 canonical chapters render.
- Built production Web with the signed Plugins fixture from source
  `b1eec1af2f0360f043061ebecc18a6f25f872932`: exact
  `e2e/mobile-layout.spec.ts` passes once, then complete `pnpm test:web:e2e
-- --workers=1 --retries=0` passes all 13 cases, including installed plugins,
  OPFS, PWA reload and secondary-tab takeover.

## Remaining gates

Hosted PR checks, Notes package publication, Desktop consumer adoption and
production deployment remain separate from this local registry integration.
Frozen Deno/native application qualification remains deferred. Visual review
remains pending and no screenshot baseline changed. Original source receipts
retain their original versions, prerequisites and qualification limits.
