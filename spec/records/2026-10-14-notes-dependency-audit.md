# Notes dependency audit remediation — 14 October 2026

## Outcome

The registry-backed pnpm audit decreased from 81 findings to one. All critical,
moderate, and low findings were removed. Production dependency auditing passes;
the complete audit still fails on an unpatched development dependency. No audit
exception was added and this record does not claim release qualification.

| Severity | Before | After |
| -------- | -----: | ----: |
| Critical |      3 |     0 |
| High     |     31 |     1 |
| Moderate |     39 |     0 |
| Low      |      8 |     0 |
| Total    |     81 |     1 |

The exact reproduction and final check were `pnpm audit --json` (exit 1).
`pnpm audit --prod --json` exits 0 with no vulnerabilities.

## Changes

- Bounded third-party overrides select patched releases while preserving the
  separate js-yaml 3 and 4 API families. Vitest and its browser tools resolve to
  4.1.11 together. Simple Git 4.0.1 and its argument parser 2.0.1 replace the
  vulnerable native Git chain.
- Changesets 3.0.3 removes its obsolete glob and YAML-reader dependency chains.
  Root development tooling now requires Node 22.11 or newer. Transformers
  resolves to 4.3.1 within its existing declared API range.
- `pnpm-lock.yaml` was refreshed with `--ignore-pnpmfile`, bypassing the ignored
  development tarball hook. The frozen registry install passes. The Deno host
  build prunes the obsolete Changesets 2 graph from `deno.lock`; it does not
  change Deno import-map pins or qualify a separate Deno dependency audit.
- Public Lapis package versions and external LapisMD dependency ranges are
  unchanged. Unrelated generated API host metadata is excluded from this slice.
- The release test lane includes three native Git compatibility/security checks
  resolved through the actual AI Controller → node-llama-cpp caller.

Resolution commands:

```sh
pnpm update --recursive --lockfile-only --ignore-pnpmfile --no-save \
  @changesets/cli @huggingface/transformers vitest \
  @vitest/browser @vitest/browser-playwright \
  @modelcontextprotocol/sdk sharp
CI=true pnpm install --frozen-lockfile --ignore-pnpmfile
```

## Remaining finding and decision

`GHSA-vfj7-8cjw-p6xm` affects `braces@3.0.3` through
`@tobilu/qmd → fast-glob → micromatch → braces`. Deeply nested brace patterns
can exhaust the stack. npm has no patched braces release; the current QMD
release also retains this chain. Updating QMD alone cannot resolve the finding.

QMD remains installed at 2.5.3 pending the user's choice. The alternatives are
removing QMD, explicitly accepting a temporary exception, or retaining the open
finding. The existing incremental Sync plan forbids new exceptions.

Removing QMD would disable `pnpm spec:search`, indexing, and semantic search.
The installed spec-validator prints a manual `rg` fallback rather than executing
it automatically. `rg -n -i --glob '*.md' 'LN-ARCH-049' spec/src` successfully
locates the canonical chapter and its verification row. Preserve `.qmd/index.yml`
and generated index data if QMD is later removed, and update LN-ARCH-023 and
LN-PKG-031 with their verification rows to describe the changed tooling contract.

## Focused validation

| Boundary                                        | Result                                                                                                               |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Release plan, changelog, package boundary tests | 11 passed before; 11 passed after                                                                                    |
| Actual native Git caller                        | 3 passed: object-option clone/removeRemote and rejection of `--receive-p`/`--exe` push options                       |
| Release configuration and workflow              | `pnpm release:check` passed                                                                                          |
| API embedding provider                          | 5 passed via focused Vitest file                                                                                     |
| Transformers import                             | Real `Tensor` construction and `pipeline` export passed                                                              |
| Mira-resolved KaTeX                             | Rendering and untrusted JavaScript-link rejection passed                                                             |
| Retained QMD CLI                                | `pnpm exec qmd --help` passed                                                                                        |
| Web build                                       | All 9 build tasks passed; included 29 native-service and 28 server tests; app-profile check had zero errors/warnings |
| Cold web persistence                            | 1 passed: `OPFS vault and workspace layout survive a full PWA reload`, with a fresh preview process                  |

Specification validation passed all 10 validators across 172 chapters and 1,387
requirements. The first spec-first run found one missing packages-chapter mapping
for the root dependency changes. LN-PKG-064 and its verification evidence were
updated alongside LN-ARCH-049; the gate and specification mirror checks were
rerun before committing.

Exact focused test commands:

```sh
node --test scripts/dependency-security.spec.mjs scripts/release-plan.spec.mjs \
  scripts/release-changelog.spec.mjs scripts/check-package-boundaries.spec.mjs
pnpm --filter @lapis-notes/api exec vitest run \
  src/lib/storage/search-embedding-provider.test.ts
pnpm --filter @lapis-notes/web exec playwright test -c playwright.config.ts \
  e2e/web-host.spec.ts \
  -g 'OPFS vault and workspace layout survive a full PWA reload'
```

An actual `changeset status` invocation exits 1 because changed packages have no
release Changesets in the already-dirty workspace. No fake Changeset was added.
Full catalog, packaged desktop, live-service, and release qualification lanes
are deferred in accordance with the user's request for bounded targeted slices.
