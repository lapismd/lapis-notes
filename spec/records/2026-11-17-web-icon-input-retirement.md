# Independent Web icon build inputs

Requirement: LN-WEB-093, preserving LN-WEB-001.

## Scope and source audit

Base: Notes `5ffb33c152404b6880debd1b5fd70762121d6196`.
The sole active Web build reference to the frozen desktop host was
`packages/web/scripts/generate-pwa-icons.mjs` reading its raster icon.
The generator now reads `packages/web/assets/app-icon.png`; its API-owned SVG
input, rendering parameters, output names and public icon bytes are unchanged.
The source PNG is an exact copy, SHA-256
`89c801232c2ddbc6dae9cf386a9dd49fcf9151551f59fd3b68901133a5e3ffa2`.
The frozen host retains its own copy for its later removal slice.

No runtime composition, published export, registry metadata, version,
application identity, manifest, pixels or visual baseline changes here.
Historical paths remain provenance, not runtime/build inputs.

## Exact regression

Command: `node --test packages/web/scripts/generate-pwa-icons.test.mjs`.

The test creates a cold temporary tree with only Web's generator, the Web-owned
PNG and API-owned SVG. It provides no frozen desktop package. The real generator
runs in a fresh Node process with the installed Sharp dependency, then the test
compares all seven output names and SHA-256 values with the frozen Web-owned
`assets/pwa-icon-sha256.json` and committed public icons. Build-time regeneration
cannot silently replace those independent expected hashes. `packages/web` runs this regression before its existing Vitest suite.

- Before: 0 passed / 1 failed. The production generator requests the missing
  `packages/desktop-deno/build/icon.png`.
- After: 1 passed / 0 failed. All six PNGs and `favicon.svg` match exactly.
- The source PNG and API SVG hashes match their original source bytes.

## Environment and limits

The isolated omarchy Docker worker uses one CPU, 2 GiB memory and the existing
UI image `sha256:a4ffd16112f050b63d0e53c22ce7f6e8790872c0cdcfb2d8c85d5a6df0bc8345`.
Node is 24.15.0, pnpm 10.34.5 and Sharp 0.35.5, matching the repository lock.
A minimal ignored dependency projection installs exact registry tools outside
the source tree and supplies their node_modules only inside the disposable
worker. No dirty sibling or host dependency tree is transferred.

The initial minimal specification projection lacked TypeScript, yielding one
`SPEC-INTERNAL` configuration diagnostic. Its setup was extended with the
repository's exact TypeScript and Svelte versions before retrying.

Host specification discovery first reported missing local node_modules. Pinned
spec-validator 0.2.1 doctor confirms the existing QMD ABI mismatch (host Node
26.9.0); its conceptual search explicitly degraded to text fallback. No semantic
search success is claimed and no global QMD repair was attempted.

A subsequent minimal-projection specification attempt could not enumerate
tracked files until the disposable tree received a JJ repository and the tool
PATH. That retry reports 11 stale panel-command mappings because the minimal
projection intentionally contains no installed first-party plugin bundles.
Those are incomplete-fixture diagnostics, not waived product regressions. The
complete canonical gate must run with the ordinary verified dependency cohort.

The parent workstream will overlay this committed slice into its already
provisioned worker, preserving exact source provenance, and run Web package
check/test/build plus the complete canonical gates after integration. These
gates and hosted qualification remain pending; the exact generator boundary
is independently qualified. No native acceptance, deployment or frozen-host
removal is claimed.
