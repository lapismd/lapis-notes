# Fresh server image qualification for the desktop migration

LN-PKG-161 requires the complete Web suite against a fresh candidate image.
The existing server remains a separate Deno host; the superseded Deno desktop
is frozen and is neither edited nor rerun here.

## Failure and repair

1. The complete Web suite initially passes 11 cases and fails its single server
   case because Docker is stopped.
2. `docker build --progress=plain -f packages/server-deno/Dockerfile
-t lapis-server:desktop-migration-m7-69cb664e .` rejects the frozen hook
   checksum. The Dockerfile ignored the public pnpm hook that the tracked
   lockfile records.
3. The image now recreates the official `.pnpmfile.cjs` entrypoint to
   `scripts/local-plugin-pnpmfile.cjs` before the frozen installation. No local
   tarball manifest is provided, so the public hook preserves registry ranges.
   Ignored development overlays, manifests and lockfiles are unchanged.
4. The repaired frozen install succeeds. The normal renderer build is then
   killed with exit 137 at Docker's original 3072 MiB VM limit.
5. With explicit user approval, Docker temporarily uses 8192 MiB. The identical
   build command succeeds, producing image
   `sha256:eb372c6d34ae2e67c3267ef837735ba9166f0f34cfc4a1d8e41b527cac8819a1`.

## Passing qualification

- `node --test scripts/local-plugin-pnpmfile.test.mjs`: three cases prove
  registry behavior without a local manifest and bounded development routing.
- `pnpm --filter @lapis-notes/server-deno check`: types and 28 tests in eight
  files pass.
- With `LAPIS_SERVER_E2E_IMAGE=lapis-server:desktop-migration-m7-69cb664e`,
  `pnpm --filter @lapis-notes/web exec playwright test -c playwright.config.ts
e2e/server-host.spec.ts --grep 'server-hosted vault survives editing, sharing events, and restart'`
  passes its exact case.
- With the same candidate image, `pnpm test:web:e2e` passes all 12 cases after
  freshly building the Web frontend. This includes editing, events and a clean
  server restart using private disposable data and credential volumes.
- The complete source check/test/build, 257-story interaction/accessibility,
  static catalog and package lanes pass as recorded in the
  [Storybook qualification record](2026-10-16-m7-story-qualification.md).

The test fixture removes its containers and volumes. No containers remain
running. Docker is stopped and its original 3072 MiB setting is restored.
No production signing, publication, deployment or Deno desktop change occurs.
The API archive remains pinned to source revision
`69cb664e49204f4474fb8ff44b14cf3ebc397107`; story and Docker changes do not alter
its runtime payload. Actual Tauri qualification is tracked in the desktop
repository, independently from this source/Web evidence.

The final spec rerun caught a 404-line chapter after adding the hook explanation.
The clarification is condensed in its existing paragraph, keeping the 400-line
limit and all normative requirements unchanged; the detailed rationale stays in
this bounded record.
The next run passed validation and mdBook, then identified the Dockerfile's
additional architecture, server and database chapter mappings. Each now records
its unchanged runtime/storage boundary and the corresponding image evidence;
the mapped spec-first rule is preserved.
