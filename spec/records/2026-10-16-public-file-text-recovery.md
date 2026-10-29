# Public document-owned text recovery

LN-PKG-170 exports FileTextPersistence through the public API. It retains the
captured file and acknowledged text baseline independently of vault-cache reads.
Each recovery operation acquires its own protection, acknowledgement, reset and
release lease. Asynchronous protection is awaited before conflict resolution;
the API editor uses the same contract without a second save implementation.

The consumer is the Markdown preview adapter in its owning plugin repository.
Mira owns portable editing and recovery; the API owns conditional persistence and
the App's conflict registry. Tracked registry dependency files remain unchanged;
the migration uses verified, ignored local pnpm archive overlays. Publication and
production signing remain deferred.

## Source qualification

Node 26.9.0 / pnpm 10.34.5, macOS ARM64.

- `pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/file-text-persistence.test.ts src/lib/__tests__/editor-file-conflicts.test.ts`:
  all 22 exact cases pass (six new public-helper cases and sixteen existing
  editor conflict cases). They cover async admission, concurrent operation-owned
  leases, stale disk decisions and successful document acknowledgements.
- The built public FileTextPersistence contract compiles against API dist.
- `pnpm test --force`: 1,591 cases pass, including all 1,014 API cases, with one
  existing skip. The entire forced root lane passes.
- `pnpm check --force`: eighteen tasks pass with zero Svelte diagnostics.
- `pnpm build --force`: ten tasks pass, including publint and public contracts.
- `pnpm test:storybook --force`: all 249 interaction/axe cases pass in four fresh
  shards (90 + 65 + 40 + 54).
- `pnpm packages:check`: two package-boundary cases, nine local-consumer cases
  and all 101 release-tool tests pass.

The Notes overlay installs five verified archives across seven active import
routes. Both the workspace and Markdown consumer resolve the owning API dist;
the consumer does not import a separate registry API copy.

## Host qualification

Fresh server and legacy packaged-host qualification is pending for this exact
cohort. Prior host acceptance is not evidence for the changed public helper.
The Tauri consumer's three cold preview-conflict cases already pass, including
visible external recovery, a subsequent save, retained owner-tab drafts and
restart. Final desktop evidence records the complete native lane separately.

M4 remains In progress under its original gate. This slice qualifies API editor
and preview recovery components only; enabled Properties/frontmatter and
metadata writers still need protection and a complete writer audit. No visual
baseline, package release or production signing is included.
