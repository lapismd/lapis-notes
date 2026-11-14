# CLI settings public UI package qualification

The final shared compound lives at `@lapis-notes/ui/cli`. UI has no App API
dependency, so server API 0.2.8 and desktop API 0.3.1 retain their existing
runtime cohorts. The earlier Workspace receipt remains historical and immutable.
The minor changeset prepares UI 0.2.0; Changesets also schedules ordinary
API/Workspace dependency patch releases, without requiring those consumers to
adopt a different App API.

The interaction follows [GitButler’s General settings installation](https://docs.gitbutler.com/cli-guides/installation)
and the per-user bundled command described in [Buzz’s README](https://github.com/block/buzz-app/blob/main/README.md).
Lapis keeps shell changes behind explicit consent and browser setup on the
browser user’s computer.

- The focused registration test initially failed once because UI’s Node test
  configuration did not compile Svelte imports. The real Svelte test pipeline now
  runs both registration/disposal cases successfully; no component was mocked.
- `pnpm --filter @lapis-notes/ui exec vitest run src/lib/cli/cli-settings.test.ts`:
  2 passed, 0 failed. The complete UI suite passes all 17 tests.
- `pnpm check`: all 16 tasks pass, with no source type errors or warnings.
  `pnpm test`: 2,151 tests pass across the complete package lane.
  `pnpm build`: all 9 tasks pass, including public builds/publint.
- Full `pnpm test:storybook` after moving the compound to UI passes all 282
  interaction/axe cases across 63 files. `pnpm build-storybook` and
  `pnpm spec:check` pass. CLI scenarios now follow the retained UI `API/`
  catalog policy; their exact six-case target also passes.
- The published-cohort refresh initially exposed missing mapped UI/Workspace
  chapter updates. Canonical contracts now name the UI public export.
- Changed source formatting passes. An exploratory repository-wide Prettier scan
  reported 179 existing files; the one touched barrel was restored byte-for-byte
  to main when removing the abandoned Workspace export. Unrelated formatting
  was preserved.

Consumer acceptance uses the built UI candidate tarball with SHA-256
`87b70824eba9a0ab2ba48fea74739bb758de514609ad11ae1246940d07d33159`.
A final pack after correcting the README’s export list has SHA-256
`79e7585317dedc3de97c1fbf27242f6f83fe9032fc9cd93848b5d324577e5eff`;
a byte comparison confirms README is the only differing archive member.
All runtime code, exports and declarations are identical.

The source candidate uses the existing 0.1.10 source manifest for temporary
acceptance; it is not a registry release. Both hosts must adopt the governed UI
0.2.0 release before ordinary registry-only builds use `/cli`. No publication,
deployment, installed-app replacement or visual baseline update was performed.
