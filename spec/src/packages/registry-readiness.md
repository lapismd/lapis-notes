# Packages / Registry readiness

## LN-PKG-195 — Bounded exact-candidate installation readiness

<a id="ln-pkg-195"></a>

**Requirement.** Registry installation readiness MUST verify each selected candidate's exact name, version and integrity in npm installation metadata before installing it. Readiness requests and consumer-install attempts MUST share a deadline shorter than two minutes and fresh per-attempt metadata caches. Only typed exact-candidate missing-version or transient transport failures MAY retry. Identity mismatches, unrelated failures and exhaustion MUST fail without rebuilding or republishing.

### Acceptance details

The source-owned verifier preserves these boundaries:

- Request the pinned client's actual `install-v1` representation, with bounded
  requests and no shared metadata cache. Existing full-metadata, tarball,
  signature, provenance and source checks remain independently required.
- Bound readiness plus installation by110 seconds and at most six attempts;
  backoff consumes that same deadline. A timed-out install terminates its owned
  Linux/macOS process group; unsupported native platforms fail closed. Authentication, invalid metadata, integrity mismatches,
  dependency-build failures and unrelated missing packages stop immediately.
- Emit timestamp, phase, attempt and elapsed-budget diagnostics; exhaustion
  reports the exact candidate boundary and remains a failed gate. No finite
  deadline guarantees npm convergence, and this grants no blind workflow or
  publication retry. Actual Vite/import/CSS acceptance remains blocking after
  installation and is not substituted by a metadata response.

[The installation-readiness record](../../records/2026-11-16-installation-readiness.md)
retains before/after evidence and consumer reuse limits.

## LN-PKG-196 — Shared readiness implementation authority

<a id="ln-pkg-196"></a>

**Requirement.** Notes MUST obtain installation-metadata retry and process execution from the qualified immutable shared Lapis CI readiness source. Its local adapter MAY select existing owner budgets and client policy and map verified publication identities. Missing setup MUST fail without a local-engine fallback.

The source-pinned setup precedes both CI regression execution and publication
verification. Notes retains its110-second deadline, five backoff delays, exact
root pnpm10 pin and approved minimal consumer dependency-build policy. The
shared pnpm profile preserves that policy; it does not blanket-enable scripts.
The duplicate metadata/retry and process engines are removed from Notes.

Local test fixtures use the same three public shared files, bound to immutable
source69a81e05 and their SHA256 values, in owned temporary directories. Provided
CI setup is verified against those hashes; unavailable or altered evidence
fails. This test-only fixture staging is not a production download fallback or
a vendored implementation. The [shared-source adoption record](../../records/2026-11-16-shared-registry-readiness.md)
keeps source checks, retained consumer acceptance and deployment distinct.
