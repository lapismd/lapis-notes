# CLI settings source qualification

The shared Workspace implementation exposes controller-owned General → Advanced
settings, an independent `/cli` public entry point and host ports for installation,
downloads and scoped desktop access. Host methods and credentials are never
settings values. Existing General owners are preserved, and a stale disposer
cannot remove a newer registration.

## Before and after

- The first `Install And Uninstall` interaction failed once because the test
  clicked through a closing modal. It now waits for real modal removal and pointer
  restoration; assertions and production timing were retained.
- The first installation-failure story revision reported two alerts after moving
  errors into the modal. Production now renders the error in its active surface;
  all six CLI stories pass.
- The final full-catalog attempt recorded two browser-connection closures in
  existing History and Link Preview acceptance, without assertion failures.
  The exact Link Preview file passed both cases in a fresh browser. A fresh full
  lane then passed; the failed receipt remains under `.local/validation/runs/`.

## Commands and results before the published-cohort refresh

- `pnpm --filter @lapis-notes/workspace exec vitest run src/lib/cli/cli-settings.test.ts`:
  2 passed, 0 failed.
- `pnpm exec vitest run --project storybook stories/workspace/CliSettings.stories.ts`:
  6 passed, 0 failed, including real registration/removal dialogs and browser setup.
- `pnpm check`: 16 tasks passed. `pnpm test`: 2,136 unit tests passed across the
  complete package lane. `pnpm build`: 9 tasks passed.
- `pnpm test:storybook`: all 282 interaction/accessibility cases qualified across
  63 files; fresh retry cleared the two connection errors. `pnpm build-storybook`
  passed, including all 194 specification chapters.
- `pnpm spec:check` passed after updating mapped architecture, package, plugin,
  catalog and Workspace contracts. Validator 0.2.0 is the current Deno-free
  registry release; doctor and QMD search ran.
- Workspace public build and publint passed. Consumer acceptance uses ordinary
  built tarballs with recorded SHA-256 rather than source aliases or patches.

## Release boundary

Visual review remains pending; no baselines were changed. Installation and
native consent belong to each host. Registry-only consumer adoption requires
the governed Workspace release containing `/cli`; temporary consumer archives
are validation prerequisites, not a publication claim. Newer already-published
Notes changes discovered during final source-pin review are adopted and qualified
separately from these initial source results.
