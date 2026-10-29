# Core vault listing exclusions

LN-PKG-185; enclosing Jujutsu change wtutkuqv; 2026-10-19.

The desktop AI folder picker exposed Git and JJ metadata. The shared API now
registers `files.exclude` without a plugin, defaults it to `.git` and `.jj`,
and applies case-sensitive shared glob patterns to enumeration, folder/file
lists, iterators and indexed/path glob lookups. An excluded ancestor hides its
descendants. Exact lookalikes such as `.github`, `.gitignore` and `.jj-notes.md`
remain visible. Patterns are compiled once per changed configuration.

This is discovery policy, not admission. Explicit resource lookup, adapter IO,
the internal loaded resource map and native backup exclusions remain unchanged.
Changing the setting invalidates listing consumers through the existing Vault
load event without deleting or reloading contents. Optional Vault construction
options preserve the default for standalone consumers. Existing glob exports
remain unchanged; the compiled matcher is internal. The required build refreshes
the generated plugin-module versions to the existing API 0.1.5 manifest.

Verification logs: `.local/verification/core-listing/`.

- Exact regression: `pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/vault-listing-exclusions.test.ts`:
  three failures before (`before-final.log`), three passes after (`after.log`).
- Affected Vault, glob, configuration and exclusion files: same command with
  `src/lib/__tests__/{vault,glob,configuration}.test.ts`: 30 passes (`affected.log`).
- Initial four-case App/jsdom attempts fail on missing browser/lifecycle
  harness support (`before{,-settings,-ready}.log`). The App configuration binding
  moves to a real Desktop App Storybook scenario; no lifecycle mocks added.
- `pnpm --filter @lapis-notes/api check`: initial TFile filter type error
  (`check.log`), repaired explicit predicate, final zero errors/warnings
  (`check-final.log`).
- `pnpm --filter @lapis-notes/api build`: final public package/publint and
  declaration-consumer passes (`build-final.log`).

Desktop records separate before/after public-archive acceptance. Its initial
installed-API story fails because the folder picker exposes metadata. Source
specification checks pass all three validator lanes, App ownership and
metadata-query audits, and 38 specification tests. Initial validation found a
duplicate verification-table structure and a missing details introduction;
these are repaired. Source-first then required three additional mapped chapters;
their unchanged Markdown/diagnostics/App boundaries are now recorded. All failed
attempts remain in `spec{,-final}.log`; final pass in `spec-verified.log`.
The already-built API 0.1.5 archive is prepared with
`pnpm --dir packages/api pack --config.ignore-scripts=true --pack-destination /Users/stevejuma/code/lapismd/lapis-desktop/.local/archives/packed/core-vault-exclusions`
(`pack.log`); Desktop records its checksum and source revision. Aggregate
repository, native and provider matrices are outside the user's minimal-testing
scope. No publication, dependency patches or source aliases.

Contract review: intentional LN-PKG-185 discovery behavior; raw storage,
authorization and plugin authority remain unchanged. Milestone review: source
implementation verified, consumer proof pending; no broader package or host gate
is promoted by focused tests. Visual baselines remain pending and unchanged.

Public-consumer reconciliation: the default checkout began on the independent
Node integration line (4c9d681a/API 0.1.5), while Desktop's verified API base is
cae795d0/API 0.1.4. The first consumer install requires UI 0.1.4 and then fails
on absent Desktop foundation APIs (including FileTextPersistence). Its 66 type
errors and two failed story imports are recorded by E-CATALOG-013.
The exclusion slice is rebased onto the existing verified Desktop API base in
the default source workspace; the independent Node line is preserved. Conflict
resolution retains its editing-session operations argument and adds listing
options as the third optional Vault constructor argument. No broad integration
of the two source lines is claimed.

The compatible API build/publint/declaration lane passes. The first source type
check finds three missing upstream footer/controller APIs because this source
checkout still resolves Design Core 0.5.0. A temporary public-archive pnpm hook
consumes verified Core 0.5.1/7c9e4b84 with tracked manifests/lockfile preserved.
The existing ignored hook references an absent historical Markdown archive, so
the dedicated validation hook replaces only Core and resolves all other packages
normally; the first failed install is retained. Requalification is recorded in
`compatible-{affected,build,check-final,spec}.log`; Desktop owns the final exact
archive checksum and browser results. No source aliases or dependency edits.

Final compatible qualification: 30 affected cases pass again with the verified
Core archive; API Svelte/TypeScript checks have zero errors/warnings and public
build/publint/declarations pass. Spec validation, book, mapped source-first and
38 specification tests plus App/metadata audits pass. The rebased base already
owns LN-PKG-165, so the new discovery requirement is LN-PKG-185; the duplicate-ID
attempt remains in `compatible-spec.log`. `compatible-spec-final.log` passes.
The explicit source range `cae795d0..wtutkuqv` passes its protected mappings.

Desktop's real-App shared-policy story passes: defaults hide metadata, config
updates remove Private from the picker and underlying bytes remain readable.
Its 10 assertions pass, with two previously recorded configuration teardown
rejections in another chat case; the broader suite is not a clean pass. The
exact changed stories are selected separately in E-CATALOG-013. Milestone review:
LN-PKG-185 is Implemented; broader host/native/release gates stay unchanged.
