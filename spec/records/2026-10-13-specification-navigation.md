# Specification readability and navigation migration

This record describes documentation and catalog tooling acceptance on 13 October 2026. It does not change product behavior or qualify a package release.

## Preservation and structure

The baseline at `spec/archive/2026-10-13-specification/` captures source revision
`4c64c05d`: 36 chapters, 1,365 requirements, their acceptance sections, and every
verification status and evidence entry. The baseline was committed as `41465d96`
before migration.

The migrated book has 172 indexed chapters, plus `SUMMARY.md`. Every canonical
Markdown file is below 400 physical lines and 32,768 UTF-8 bytes. The largest page
is 25,236 bytes and the largest line count is 319. Familiar chapter paths remain
landing pages; Panels and Problems are nested
under Workspace Shell. Verification is a landing page and bounded area tables.

`node scripts/spec-validation/audit-specification-migration.mjs` confirms all
1,365 original IDs, statements, acceptance sections, statuses, and evidence rows
remain intact after relocation. The two intentional authoring changes are
LN-GOV-015 and LN-GOV-016: they describe requirement statements and acceptance
headings instead of requirement tables. The 80-word and four-sentence limits
remain enforced.

Six documentation requirements were added: LN-GOV-048 and LN-GOV-049 govern page
bounds and preservation; LN-CAT-113 through LN-CAT-116 govern outlines, canonical
routing, SUMMARY-derived navigation, and generated-output watcher exclusions.
The resulting total is 1,371 requirements and exactly 1,371 verification rows.
No existing implementation status was promoted.

All 31 existing source-change mappings were compared against baseline defining
chapters and their relocated requirements. The new topic patterns preserve that
coverage and exclude landing and context pages. Historical narratives moved to
the dated context records; current constraints remain in the specification.

## Storybook behavior

The Lapis-owned Docs container and Markdown override keep MDX mirrors strictly
metadata-only. SUMMARY supplies topic links, hierarchy, sidebar order,
breadcrumbs, and previous/next links. The sync checker rejects stale sidebar
order as well as missing or stale mirrors. Canonical relative links use manager
routes, stable requirement anchors, and the deployment's base path. The
relocation map preserves old chapter anchors; legacy flat Panels and Problems
Docs routes redirect to their nested routes.

The two original browser regressions failed before implementation: an empty
outline and Workspace Shell's broken Panels link. Both passed after the change.
The complete navigation suite covers requirement links, reload, Back/Forward,
breadcrumbs, keyboard reading order, narrow layouts, legacy routes, and axe.

Cold development acceptance exposed generated files triggering Storybook's
complete reverse-dependency index. Profiling located
`handleFileChange → mirrorUpdate → reverseIndexToStoriesByFile`. Generated book,
build, cache, fixture, log, and test directories are now ignored by the source
watcher. A regression writes 20 generated HTML files and checks that the Docs
frame stays mounted. Authored sources remain watched.

## Completed validation

| Command or lane                      | Result                                                                                                         |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Migration audit                      | All 1,365 originals preserved; intentional authoring changes and additions reported separately                 |
| Changed authored-file Prettier check | Passed; generated lockfile style preserved                                                                     |
| `pnpm spec:validate`                 | 10 validators, 172 chapters, 1,371 requirements                                                                |
| `pnpm spec:check`                    | Passed: canonical validation, mdBook, spec-first, App ownership, metadata audit, and 37 local validation tests |
| `pnpm check:specification-docs`      | Passed: Docs types, exact mirrors, topic links, and sidebar order                                              |
| `pnpm packages:policy`               | Passed; two policy tests                                                                                       |
| `pnpm check`                         | 18 successful Turbo tasks                                                                                      |
| `pnpm test`                          | 18 successful Turbo tasks; 1,250 package tests passed, one skipped                                             |
| `pnpm build`                         | 10 successful Turbo tasks                                                                                      |
| `pnpm test:storybook`                | 243 passed across 54 files; final shards 84, 65, 40, and 54                                                    |
| Fresh development navigation suite   | Initial seven passed; final cold recheck stalled before main refresh (see below)                               |
| `pnpm build-storybook`               | Passed                                                                                                         |
| `pnpm check:storybook-index`         | Exactly 172 specification Docs entries; complete coverage and no stale, duplicate, or incorrect routes         |
| `pnpm test:specification:static`     | Six passed under `/specification-preview/`; watcher-only test intentionally skipped                            |
| Representative requirement discovery | `rg` finds LN-WS-001 in its defining topic and verification row                                                |

## Environment and recovery notes

The ordinary `pnpm storybook` preflight remains blocked by a pre-existing stale
AI tarball checksum in the sibling `lapis-plugins/.release/npm/manifest.json`.
Cold development validation used the checkout-owned supervisor against the
already installed packages:

```sh
STORYBOOK_PORT=7310 VISUAL_SERVER_PORT=7311 WATCHPACK_POLLING=250 \
  node scripts/with-storybook-env.mjs node scripts/storybook-run.mjs --no-open
SPECIFICATION_BASE_URL=http://127.0.0.1:7310/ pnpm test:specification:dev
```

QMD indexing/search remains unavailable because its native modules are unbuilt.
The documented fallback `rg -n --glob '*.md' -- 'LN-WS-001' spec/src` passed.

An initial concurrent package test/build run hit `ENOTEMPTY` in API packaging
temporary output. Serial validation recovered: all required package tasks and
tests passed. No assertion or validator was weakened. Replayed Turbo cache logs
may contain that earlier packaging error even though the successful retry
reports all tasks passing.

The inherited API Prettier configuration references an unavailable jsdoc plugin.
Changed authored files were formatted and checked with the installed Design Core
Prettier executable and an empty temporary configuration. No formatter or local
loader configuration was committed. A formatter-only lockfile rewrite and
unrelated generated API version metadata were removed before delivery.

The structural migration and Docs wiring form one atomic change because the
heading dialect, anchors, mirrors, and routing must agree. Subsequent heading
and prose cleanup is a separate documentation slice: 269 requirement labels
were shortened or completed, including all identified unfinished headings and
the main workspace, panel, editor API, and authoring topics. Their statements,
acceptance details, and ID-based anchors remain unchanged. Visual-baseline updates
and package publication were outside the requested scope.

## Main-refresh checkpoint

The final cold development recheck on the original base stalled in Storybook's
`handleFileChange → mirrorUpdate → reverseIndexToStoriesByFile` path. It produced
three navigation timeouts, one interrupted test, and three tests not run. The
same final navigation suite passed on the rebuilt static deployment subpath.
The owned development server was stopped, and the prose/test slice was committed
before fetching the latest main, as requested. Latest-main integration and a
fresh development recheck remain required at this checkpoint.
