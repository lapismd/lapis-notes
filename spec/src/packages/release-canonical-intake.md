# Packages / Canonical version preparation

Source package versions only; publication and host adoption remain separate.

<!-- notes-release-versions:start -->

```json
{
  "schemaVersion": 1,
  "packages": {
    "@lapis-notes/api": "0.6.15",
    "@lapis-notes/app-profile": "0.3.1",
    "@lapis-notes/file-explorer": "0.2.8",
    "@lapis-notes/language-service": "0.1.6",
    "@lapis-notes/ui": "0.2.8",
    "@lapis-notes/workspace": "0.4.11"
  }
}
```

<!-- notes-release-versions:end -->

Version preparation records source manifest versions only. Package publication,
artifact/provenance verification and installed-host adoption remain separate.
Managed version facts do not assert that a runtime, browser or release lane ran.

## LN-PKG-197 — Mapped source version facts

<a id="ln-pkg-197"></a>

**Requirement.** Public version preparation MUST carry current source manifest versions into every mapped canonical topic in the same candidate. The normal specification-first gate MUST remain enabled on main.

### Acceptance details

The source-owned preparation has these bounds:

- The existing public package graph and specification map determine package ownership and required topics; unknown or ambiguous topic coverage fails before edits.
- Managed sections and the owning verification evidence contain only current source versions; topic sections retain their mapped package scope, preserving other packages and native host contracts.
- Changesets preparation updates those sections after version mutation and generated host metadata, then checks their agreement before completing release preparation.
- Source version facts never authorize publication, claim unrun acceptance or qualify frozen-host adoption.

## LN-PKG-198 — Bounded canonical version edits

<a id="ln-pkg-198"></a>

**Requirement.** Automatic version facts MUST modify only unambiguous source-owned sections and preserve all authored text. Missing, malformed, conflicting or oversized sections MUST fail before any canonical write.

### Acceptance details

The canonical edit contract retains these checks:

- Every selected page must have one exact marker pair and the expected package-name/schema shape; unknown fields or manual text inside the managed section fail closed.
- Read/check mode performs no writes, version regressions are rejected and repeated writes are deterministic no-ops.
- All outputs must satisfy canonical line and byte limits before the first page is written.
- Recipe regressions and the real candidate's complete main-range comparison remain distinct from PR specification exemptions and final publication acceptance.

## LN-PKG-200 — Factual framework dependency intake

<a id="ln-pkg-200"></a>

**Requirement.** Compatible Design Core dependency intake MUST carry current declared ranges, resolved registry versions and integrity fingerprints into all seven source-owned canonical areas. An independent offline check MUST verify those facts in ordinary functional and canonical check lanes, including bot PRs.

### Acceptance details

The source-owned opt-in retains these controls:

- The schema2 policy names every active Core importer and mapped chapter; source review is required to extend that scope. Root, API, UI, Workspace, Web, Profile and File Explorer retain their distinct declared and peer ranges.
- The verifier checks current manifests, catalog routing, lock specifiers, one released registry identity and SHA512 integrity independently of the coordinator renderer. Missing importers, malformed or ambiguous sections and mismatched rows or fingerprints fail without writes.
- The shared coordinator alone prepares bounded slots after immutable-source admission; authored contracts, release intent, retired-host guards and functional, audit and exact-main specification gates remain binding.
- Current dependency facts never assert publication, browser acceptance or installed-host adoption. The normal check runs before specification exemptions and canonical aggregate checks retain it as a functional lane.
