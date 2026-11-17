# Packages / Canonical version preparation

Source package versions only; publication and host adoption remain separate.

<!-- notes-release-versions:start -->

```json
{
  "schemaVersion": 1,
  "packages": {
    "@lapis-notes/api": "0.6.7",
    "@lapis-notes/app-profile": "0.2.5",
    "@lapis-notes/file-explorer": "0.2.8",
    "@lapis-notes/language-service": "0.1.6",
    "@lapis-notes/ui": "0.2.2",
    "@lapis-notes/workspace": "0.4.7"
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
