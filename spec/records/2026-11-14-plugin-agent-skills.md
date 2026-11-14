# Plugin-contributed skills source qualification

This slice adds the optional `agentSkills` manifest contribution, verified text
assets, a common App service and commands independent of AI. Standalone browser
stores use the protected portable installer; native sessions retain their host
service. Existing agent binding snapshots and discovery precedence are retained.

The installer records source, version and SHA-256 for every file in
`.agents/.lapis-skills.json`. Its pending records distinguish interrupted writes.
Whole-directory comparison protects edited, added and deleted resources;
unmanaged directories, changed owners and interrupted installations are skipped.
Conditional file/receipt writes and per-adapter serialization fence intervening
changes. The App editor guard saves/protects open buffers before browser mutation.
Successful operations reconcile the live vault index before the command returns,
so future skill discovery sees the files while existing binding snapshots stay
immutable.

## Regression and qualification

- Initial missing-module reproduction failed one suite. The first installer
  implementation failed six cases because adapter listings contain child names;
  correcting that boundary made the same cases pass. Manifest registration had
  one expected contribution-list failure, updated for the new public contract.
- Final concurrency and receipt tests pass: simultaneous installs serialize,
  clean updates remove obsolete resources, empty receipt versions are rejected,
  and edits after durable intent remain untouched behind a pending receipt.
  App notifications report installed, updated, unchanged and skipped counts.
- The live-index regression initially failed one of two App cases: direct
  adapter writes were absent from the loaded vault tree. Explicit reconciliation
  repairs browser discovery and projects native results before command completion;
  both cases and the complete API suite pass.
- The final dirty-buffer regression failed one of two cases before using the
  registry's global guard (directory strings are exact-file scopes), then passed
  both. An unsaved skill edit is saved and reported as locally modified.
- `pnpm --filter @lapis-notes/api test`: 180 files, 1,803 tests pass. Cases cover
  install, repeated commands, clean upgrade/removal, edited references, added and
  deleted files, unmanaged collisions, corrupt/pending receipts, conflicts,
  unsafe paths, conditional-write failure and concurrent requests.
- `pnpm --filter @lapis-notes/api check`, build, publint and packed-type checks
  pass. Public `./skill-management` exports and generated host-module schema are
  built with the package; no consumer source alias is used.
- Root Docker `pnpm check`, `pnpm test` and `pnpm build` pass. The full cold
  Storybook interaction/accessibility run passes 276 cases, zero skips; a final
  cold `Skills And Slash` target also passes. No visual baseline is changed.
- Spec-validator 0.2.0 doctor, QMD discovery, validation, mdBook and spec-first
  pass. Broad spec-first initially identified missing mapped chapters; their
  source ownership notes are included rather than weakening the mapping.

## Consumer boundary

Server and Desktop acceptance uses ignored, content-addressed development
archives built from public package exports. Source manifests and registry
lockfiles remain portable. Native installer/CLI qualification belongs to the
Server repository, and Tauri admission belongs to Desktop. Publication and
released-version intake remain a separate release gate.

[Browser storage qualification](2026-11-14-browser-skill-storage.md) completes the
real conditional-write port, cross-client serialization and cold-process checks.
