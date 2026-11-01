# Website API documentation export

The API package owns raw TypeDoc export from its curated docs-api entry point.
The standalone website owns frontmatter, stable routes and import presentation.
The Vault.process, FileManager.processFrontMatter and Command examples had
closing code fences followed by semicolons. These swallowed later API headings
and broke public member anchors. Examples now live in valid fenced remarks,
which preserve the full snippets through the repository formatter. The exporter
rejects malformed or unclosed fences before writing its manifest. Runtime
behavior is unchanged.

## Verification

- Before: the export command did not exist (MODULE_NOT_FOUND).
- `pnpm --filter @lapis-notes/api docs:test`: 3 passed, 0 failed.
- `LAPIS_NOTES_VALIDATION_ARCHIVES=/tmp/lapis-website-registry-only.json pnpm check`:
  Docker registry install; 16 tasks passed.
- Same registry-only selection with `pnpm test`: 16 tasks passed; API Vitest
  173 files and 1,745 tests passed, plus the initial two Node exporter tests; the final focused exporter suite has three tests.
- `pnpm --filter @lapis-notes/api build`: passed prepack, publint and packed types.
- API svelte-check and tsc passed on the host as supporting diagnostics.
- Same registry-only selection with `pnpm spec:check`: passed after adding
  LN-PKG-191 verification and mapped documentation context.
- The real export produced 132 Markdown pages plus a SHA-256 inventory and
  source/package identity. The final TypeDoc run reported zero errors and zero warnings after qualifying
  the NotificationProgressHandle.report link.

## Failed attempts retained

The configured private phase2 archive cohort failed during Bits UI patch
application before static validation. Its pinned packages are older than the
current registry cohort; no user configuration or archive was changed. An
explicit empty archive list selected the normal portable registry lane.

A host Node 26 API run had two ICU date-format fixture failures. A concurrent
host Node 24 diagnostic run also failed two tests under load. Neither host run
qualifies the Docker lane. The isolated pinned Docker run passed all API tests
without changing assertions, fixtures or expected bytes.

An initial Node-test filename was collected by Vitest and failed as an empty
suite; it now uses the explicit node-test filename and is wired into package
`test`. Initial spec checks rejected an unmapped verification row and missing
storage-mapping chapters; those are corrected and the final canonical gate passes.

Website acceptance remains distinct from API source qualification. No package
publication, GitHub push, or website deployment was performed.

The built website crawl reproduced missing Vault.read and FileManager.renameFile
anchors before the comment repair; after import it reports 216 pages and zero
route/anchor/asset failures. A real malformed Command export is retained as the
negative guard run; the final export has 132 pages and no TypeDoc warnings.
