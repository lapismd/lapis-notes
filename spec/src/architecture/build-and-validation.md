# Architecture / Build and validation

## LN-ARCH-023 — Root specification discovery: invoke the repository-local QMD binary through @lapismd/spec-validator

<a id="ln-arch-023"></a>

**Requirement.** Root specification discovery MUST invoke the repository-local QMD binary through `@lapismd/spec-validator`. It MUST NOT depend on a global executable or run during normal checks.

## LN-ARCH-045 — Generated search-document metadata: remain search-scoped while participating in API-owned property

<a id="ln-arch-045"></a>

**Requirement.** Generated search-document metadata MUST remain search-scoped while participating in API-owned property query evaluation.

## LN-ARCH-071 — Plugin settings materialization: idempotent at the persistence boundary. A normalized

<a id="ln-arch-071"></a>

**Requirement.** Plugin settings materialization MUST be idempotent at the persistence boundary. A normalized no-op update MUST NOT mutate portable vault files whose timestamps participate in generated-state reconciliation checkpoints.

## LN-ARCH-092 — API: own explicit sync enrollment, multi-epoch key custody

<a id="ln-arch-092"></a>

**Requirement.** API MUST own explicit sync enrollment, multi-epoch key custody, owner membership authority, bounded pairing state including validation of the user-confirmed SAS, and opaque recovery bundles. Protocol plugins MUST remain responsible for transporting returned artifacts, choosing endpoints, validating revision ancestry, and presenting pairing or recovery policy.
