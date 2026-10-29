# Conditional native text writes

LN-PKG-167 adds an optional `VaultAdapter.writeTextIfUnchanged` port with exact
expected text or explicit expected absence. LN-PKG-168 governs its shared native
transport and capability. The Tauri owner supplies the implementation; legacy
native hosts reject before IO because they do not advertise support. The
adapter preserves portable errors and never substitutes an ordinary write.

This is the storage component of desktop M4. Editor document baselines,
conflict presentation and explicit recovery are not implemented by this port.
The original combined M4 gate remains open. Publication and signing stay
deferred; tracked dependency manifests and lockfiles remain registry-based.

## Regressions

- `pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/conditional-native-write.test.ts`
  before: all five selected cases fail because the method is absent. After:
  all six final cases pass, including a legacy host with no advertisement.
- The affected native storage target also passes the twelve existing profile,
  bridge and adapter cases. Its expanded final target is recorded below.
- Initial specification validation rejects five sentences in one requirement.
  Split the independent optional-port and native-transport concerns into
  LN-PKG-167 and LN-PKG-168. Existing IDs are retained, including the previous
  packaging requirements that occupy 161 through 164.
- The first spec-first run then identifies the native bridge's database and
  Deno-host mappings. Their owning chapters now distinguish file capability
  from database authority and document unsupported legacy-host behavior.

## Qualification

Node 26.9.0 / pnpm 10.34.5; macOS ARM64. Rust 1.99.0; Tauri API/backend
2.12.4 and CLI 2.12.3.

- `pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/conditional-native-write.test.ts src/lib/__tests__/desktop-native-storage.test.ts`:
  18 passed, including six new conditional-write and twelve existing native
  profile/bridge/adapter cases.
- `pnpm test`: 1,569 passed with one existing skip, including 992 API cases.
- `pnpm build`: all ten tasks pass, including API publint and the built public
  type contract. `pnpm check`: all 18 tasks pass with zero Svelte diagnostics.
- `pnpm test:storybook --force`: 249 interactions pass in four fresh shards
  (90 + 65 + 40 + 54), with no interaction or accessibility failures.
- `pnpm packages:check`: package boundaries, nine local archive-consumer tests
  and all 101 release-tool tests pass. No dependency policy is relaxed.
- `pnpm spec:check`: all six configured lanes and 38 validator regression tests
  pass after the requirement and mapping repairs recorded above.
- Rebuild the legacy ARM64 application with
  `pnpm --filter @lapis-notes/desktop-deno package:app`. Both
  `pnpm test:desktop:packaged --force --core` and
  `pnpm test:desktop:packaged --force` pass. Its existing local factory uses an
  ad-hoc launch signature; Developer ID, notarization and release remain deferred.
- The Tauri consumer installs all ten checksum-verified local archives without
  changing tracked manifests or lockfiles. `pnpm test:desktop` passes 27 actual
  WebView cases and eight cold lifecycle cases, including three new conditional
  storage cases through this public adapter. They verify Unicode writes,
  `ECONFLICT`, unchanged external bytes and expected absence/deletion on disk.
- Desktop Node tests pass 30 cases; Rust passes 34 with two intentionally
  ignored subprocess helpers. The six native conditional-storage regressions
  include a change during staging, containment, permissions/metadata and size
  bounds. Their initial missing-method/type build failed with nine diagnostics
  before any test ran. The ordinary ARM64 bundle passes its exclusion check:
  108.26 MiB, 216 renderer JavaScript files and zero automation markers.

- `LAPIS_SERVER_E2E_IMAGE=lapis-server-desktop-migration:runtime pnpm test:web:e2e --force`:
  all twelve browser cases pass, including OPFS reload, database-owner takeover,
  server editing/sharing and restart. Linux dependency/runtime images were
  rebuilt; all 445 current host-built server frontend files were individually
  hashed before copying into the runtime image. Docker configuration and its
  build limit remain unchanged.

Native requests serialize and compare before staging and immediately before
atomic replacement. This is not a filesystem transaction with arbitrary
external processes; an uncoordinated check/rename race remains possible. The
editor still saves unconditionally. Document-owned baselines, observable
conflicts and explicit recovery remain required for desktop LD-LIFE-004 and
the original M4 gate. No visual baselines, publications or production signing
are included in this slice.
