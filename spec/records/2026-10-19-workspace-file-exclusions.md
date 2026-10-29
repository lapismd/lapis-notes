# Workspace file discovery settings

LN-PKG-185; enclosing Jujutsu change; 2026-10-19. API 0.1.4,
pnpm 10.34.5, macOS ARM64.

The core Workspace configuration bridge now registers File discovery /
Excluded paths as the same Design Core string-list field used by History.
The list starts with `.git` and `.jj`, preserves existing Workspace fields and
stored values, supports add/edit/remove, and permits an empty list. The normal
App configuration writer persists `files.exclude`; its existing Vault load
notification refreshes listing consumers. Backup selection, explicit adapter
access, native admission, Markdown writes, diagnostics and plugin lifetimes
remain unchanged. No plugin is required and no second policy is introduced.

Before: the new Desktop Settings story has 1 failure/1 existing pass because
the Excluded paths input is absent (`/tmp/desktop-file-settings-before.log`).
The two new source tests also fail on missing registration
(`/tmp/notes-file-settings-before.log`). Initial source after-run has 22 passes
and one fixture failure: Settings snapshots admit registered keys only, so the
saved-value fixture now registers its schema before loading values, matching
the actual App lifecycle. Final targeted registration, exclusion, configuration
and workspace-bridge selection passes 20 cases (134 unrelated cases filtered),
`/tmp/notes-file-settings-final.log`.

Concurrent search-provider edits appeared in App startup while working. The
registration lives in the existing Workspace bridge, leaving those edits
untouched. A disposable build staging directory uses a read-only Git archive
of the Jujutsu parent plus only this slice's files, with existing installed
dependencies; it is not a registered or development workspace. This keeps the
prepared API package independent of unfinished concurrent source changes.

Qualification:

- Three complete registration/exclusion/configuration files pass 23 cases;
  `/tmp/notes-file-settings-complete.log`; the selected Workspace persistence
  bridge also passes in the 20-case focused run.
- API `check` and `build` pass in the clean staging source, including source
  Svelte/types, no-Tailwind audit, public package lint and declaration contracts;
  `/tmp/notes-file-settings-stage-{check,build}-final.log`.
- Initial staging preparation tried linking a package absent from the base and
  left the API dependency link missing; check/build could not find their tools.
  Retained logs are `/tmp/notes-file-settings-stage-{check,build}.log`;
  linking only packages present in the snapshot repairs the setup.
- Clean-source `pnpm spec:validate` passes 10 validators, 172 chapters and
  1489 requirements. Explicit `pnpm spec:first --file` for the slice passes
  3 protected files and 8 canonical chapters. Logs:
  `/tmp/notes-file-settings-stage-{spec,first}.log`.
- Initial main `pnpm spec:check` was blocked by the concurrent new
  Problems provider-boundaries page missing from inline Storybook order
  (SPEC-MIRROR-ORDER); `/tmp/notes-file-settings-spec.log`. No external edits
  or suppressions are included in this slice.
- Built API packing uses `pnpm --dir STAGE/packages/api pack
--config.ignore-scripts=true --pack-destination OUTPUT`. Archive:
  `.local/packages/workspace-file-exclusions/lapis-notes-api-0.1.4.tgz`, SHA256
  `9ca63c9e01829efe52c67f69833ff9f2adce8ebabed76f01f38487595e70b8bf`;
  `/tmp/notes-file-settings-pack.log`. The three production/test files match
  the selected committed source; no unfinished search-provider code is packed.

Desktop owns the real App Settings interaction and review refresh evidence. There is no package
publication or visual-baseline update. The user's minimal-testing scope keeps
aggregate, native/provider/platform and release matrices deferred.

Milestone review: this completes the visible control for LN-PKG-185; unrelated
source migration, host and distribution gates remain unchanged. The original
discovery implementation and explicit-resource authority remain intact.

Final qualification: after the concurrent owner synchronized its specification
mirror, main `pnpm spec:check` passes all 6 lanes, App ownership, metadata-query
audit and all 38 specification tests; `/tmp/notes-file-settings-spec-retry.log`.
Desktop public-archive checks pass 2 interaction/accessibility scenarios,
including actual Workspace list edits, physical configuration persistence,
close/reopen, remove-all, live Vault enumeration and unchanged raw file bytes
without Repository History. E-CATALOG-015 records adoption and review refresh.
Desktop types and both source-boundary audits pass. The API runtime source is
commit `f828eaeba8411aa342d7ab4954393e84612af2f3`; staging source files match
that exact commit and the disposable build directory is removed after packing.
The verified archive and ignored manifest/evidence metadata remain available.
