# Patched i18next peer support for the API

Desktop PR 61's actual production audit failed on
GHSA-6jcc-5g8w-32mx through `@lapis-notes/api > i18next@25.10.10`.
The upstream advisory identifies the fix from 26.3.4. The API's existing peer
range excluded that major, so Desktop cannot repair the package contract with
a consumer override.

## Contract and source ownership

API widens its peer range to `^25.3.0 || ^26.3.4` and selects `^26.3.4` for
source development. The registry lock resolves 26.7.2. Retaining old-major
compatibility does not claim old-major security remediation: adopting hosts
must explicitly select the patched peer. The change has patch Changesets intent
because it adds compatible peer support without removing an existing range.
LN-PKG-053 and LN-PKG-064 retain portable registry publication and built-package
acceptance; no dependency source, override, patch or audit exception is added.

## Exact regression

`pnpm --filter @lapis-notes/api exec vitest run src/lib/localization-manager.security.test.ts`
initially reports **1 failed, 1 passed** on 25.10.10. The failing case uses the
real `LocalizationManager.addResourceBundle` default deep/overwrite behavior
with an inherited built-in translation key. The dependency corrupts the shared
function and throws. The fixture restores the original property descriptor
synchronously before assertions or promise continuations, preserving isolation.
The ordinary locale/interpolation/disposal case already passes.

After the dependency change, the same exact command reports **2 passed,
0 failed** on 26.7.2. It preserves ordinary translation data under the formerly
hazardous key, the built-in function, language selection, interpolation and
resource disposal. A repeated exact run after formatting also passes both.
The root lock/install use `--ignore-pnpmfile` and frozen installation; no local
consumer redirection enters tracked package coordinates.

## Qualification and adoption

API build/publint/declaration checks and the complete affected package/root lanes
are recorded below as they finish. Publication and Desktop adoption remain
pending; source success is not a published-package or consumer receipt.

API source qualification passes all 1,846 tests (185 files), strict TypeScript,
and Svelte checks with zero warnings/errors. API build, publint and packed public
declaration checks pass. The production audit reports zero advisories.
Portable root check passes 16 tasks (no cache hits), root test passes 16 tasks
(seven cache hits), and root build passes nine tasks (seven cache hits).
The initial complete spec check correctly reports one missing architecture
chapter mapping; the dependency-boundaries chapter now describes owner-first
patched-peer adoption. The gate and mapping remain unchanged. The repeated complete spec check then passes. Existing approved browser
quarantines and visual baselines remain unchanged.

The complete cold Storybook run passes **241 cases in 58 files** across all four
shards, with interaction/accessibility failures enabled and zero failed cases.
All six Turbo tasks pass without cache hits. The final spec check passes,
including spec-first and 68 specification-tool tests. The missing chapter
failure is repaired by documenting dependency ownership, not changing mappings.
No functional or accessibility failure is deferred by this source change.

Package policy, local plugin consumer and release checks also pass, including
219 release-workflow tests. The ordinary pnpm lock refresh prunes obsolete Babel
runtime and selects the existing jsdom 26 peer context for two Vitest edges;
the complete root test and cold catalog lanes above qualify that installed
graph. Publication and Desktop installed-graph audit remain pending.
