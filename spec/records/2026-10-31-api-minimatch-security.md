# API Minimatch security qualification

## Scope and regression

The API directly owned Minimatch `^10.2.5`, locked at `10.2.6`, which is affected
by `GHSA-g3hv-75wg-m249` (`CVE-2026-118764`). The patched floor is `11.0.1`.
The API now declares `^11.0.1`; the registry lock resolves `11.0.3` with
`@isaacs/nonrecursive-glob-match` `1.0.3`.

The six existing API glob cases passed on the previous dependency. A
dependency-only upgrade failed five of those six cases: Minimatch 11 removes
`makeRe()`, and the API's catch returned no matcher. The private adapter now
checks parsed alternatives before retaining the matcher. It preserves the
normalization, matching options and fail-closed behavior.

The compiler is not a supported package export. The actual API `0.2.1` npm
archive's main declarations export the normalization, validation, matching,
magic and specificity helpers and their simple option/result types. No supported
entry exports `compileEditorAssociationGlob` or leaks `Minimatch`.
The wildcard export maps to component indexes, not `dist/glob.js`.
The archive SHA-256 is
`d8f6e3f89ce76c06d331dc90d7906118f44aaac8beedc1f2fe1cb8a07509a103`.

## Focused evidence

- `pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/glob.test.ts`:
  original 6/6, dependency-only 1/6, repaired and expanded 10/10.
- New cases cover dotfiles, literal comment/negation/extglob names, compiled
  matcher reuse, braces/classes, platform-sensitive magic and oversized patterns.
  The original/new matchers agree that case-insensitive literal patterns count
  as magic. An initial added case assumed case-sensitive defaults and failed on
  macOS (9/10); direct old/new comparison confirmed the existing contract. The
  corrected fixture controls and restores platform state (10/10).
- The same command with `vault.test.ts` and `workspace.test.ts`: 155/155 cases,
  covering listing exclusions, deterministic vault globs and editor associations.
- `spec-validator doctor --json`: passing repository/QMD/native/mdBook wiring,
  with the existing informational script-alias warning. Semantic QMD discovery
  returned the canonical vault, release and governance topics.

## Audit boundary

Before changes, root `pnpm audit --prod --json` reported seven findings:
Minimatch plus six stale-lock findings through AI Host/MCP/Express/Ajv.
Root full audit reported 59 findings (2 critical, 13 high, 35 moderate, 9 low),
including unrelated development/build tools and an unpatched low `deepmerge`
advisory. No new exception is authorized by this change.

A separate fresh registry-only consumer of published API `0.2.1`, without
Notes' workspace overrides, reported two production findings: direct Minimatch
and KaTeX `0.16.47` through Mira's `rehype-katex` `7.0.1` dependency. Its AI Host
closure already resolves patched `body-parser` `2.4.0`, `fast-uri` `3.1.9` and
`qs` `6.17.1` through existing public ranges. The KaTeX finding remains separate
pending Mira dependency work; Desktop already mitigates it through its existing
bounded patched `0.18.10` override. This change introduces no new override or
waiver and does not claim the plain published API closure is globally audit-clean.

The tracked Notes release workflow does not require a full-root vulnerability
audit. Its existing native Git security regression remains required. Full-root
development findings and actual published runtime findings are separate scopes;
this record does not claim either audit is clean or approve unresolved findings.

After the API-owned upgrade, the configured root audits retain the same seven
production and 59 full findings. The direct API Minimatch path is absent; the
remaining production matcher path is API → Design Core → Minimatch `10.2.6`.
The full audit additionally retains Web build → filelist → Minimatch `5.1.9`.
The separate Design Core owner release and plugin dependency intake remain
distinct from this private API adapter qualification.

## Shared source qualification

These receipts qualify the preliminary source against registry Design Core
`0.7.1`, with API package identity `0.2.1`. Final merge, API `0.2.2` publication
and final consumer qualification remain held until Design Core `0.7.2` actually
publishes, API adopts its `^0.7.2` floor and the required lanes pass on that
released cohort. Preliminary archives cannot authorize publication.

Registry-only Docker `pnpm check:all` passes all nine check and nine build tasks,
and 2,054 tests across 230 files, with no functional failures. The bounded worker
uses four CPUs, 12 GiB memory and 2 GiB shared memory. Its receipt is
`lapis-notes-validation-38535b64-7a34-407e-b6bd-d80d2d52e09c`.

The canonical editor/dependency chapters and verification row cover the API
manifest, lock and adapter changes. Spec-first passes four protected files and
four canonical chapters; full `pnpm spec:check` passes at receipt
`lapis-notes-validation-ff74988a-7367-4561-ad86-d58b0f776b86`.
Initial documentation attempts hit the 400-line chapter limit and the missing
lockfile architecture mapping; the final chapters satisfy both checks without
changing the validator policy.

`pnpm packages:check` passes two boundary cases, nine local-consumer cases and
99 release/security cases at receipt
`lapis-notes-validation-337db94e-3144-4b12-9a83-f34f03795979`.
`pnpm validation:consumer-pack` builds and packs all five public framework
packages through their normal public prepack lanes at receipt
`lapis-notes-validation-b77aa769-9034-421c-abcd-e08774c38214`.

The complete cold `pnpm test:storybook` lane passes 268 cases across 61 files,
with zero failures, errors or skips. Four fresh Vite/browser shards pass
98/67/46/57 cases at receipt
`lapis-notes-validation-fe4b6726-7993-47ad-bc51-04e106f53700`.
All receipts use an empty archive inventory and the frozen registry graph.
Visual baselines were not changed.
