# Desktop migration Storybook qualification

The end-of-M7 full source qualification ran against the verified migration
archive cohort, preserving registry manifests and the frozen Deno host.
This record covers two story defects; neither changes runtime behavior.

- Before: `pnpm test:storybook --force` stops in shard 1 with 90 passing and
  two failing stories. The other three shards have not run in this attempt.
- Exact before: `pnpm exec vitest run --project storybook
stories/workspace/Plugins.stories.ts -t 'Install Failure'` fails one case.
  The rejected install correctly renders both a titled detail alert and a
  notification toast; an unscoped singular alert query is ambiguous.
- Exact before: `pnpm exec vitest run --project storybook
stories/workspace/lapis-editor-demo/LapisEditorDemo.stories.ts
-t 'Sync Document Loading And Rename'` fails one case. Managed rename mutates
  the public file object's path, so querying `second.path` afterward queries
  the new file rather than the original location.
- After: `pnpm exec vitest run --project storybook
stories/workspace/Plugins.stories.ts
stories/workspace/lapis-editor-demo/LapisEditorDemo.stories.ts
-t 'Install Failure|Sync Document Loading And Rename'` passes two cases in
  two files, with 43 unrelated cases filtered out.

Install acceptance now requires exactly one alert with the existing visible
installation-error title and retains its diagnostic and retry assertions.
Rename acceptance snapshots the original path before mutation and retains the
old-path absence, complete saved draft, new editor path and protection checks.
No assertion, timeout, accessibility rule or baseline is weakened.

Full qualification now passes:

- `pnpm test:storybook`: 257 cases in 57 files across four fresh shards
  (92/65/45/55), including interaction and accessibility assertions.
- `pnpm build-storybook`: static catalog succeeds.
- `pnpm packages:check`: public package/type/publint checks and 101 release
  tooling cases pass.
- `pnpm spec:check`: canonical validation, build, ownership and spec tests pass.
- `LAPIS_SERVER_E2E_IMAGE=lapis-server:desktop-migration-m7-69cb664e
pnpm test:web:e2e`: 12 cases pass after a fresh build. The candidate Docker
  repair and earlier failure are recorded in the
  [server qualification record](2026-10-16-m7-server-qualification.md).

The earlier forced source check, 1,411 unit tests and public build lanes pass,
excluding the frozen Deno desktop package. These two corrections change no
public runtime, package manifest, timeout, baseline or archive payload.
