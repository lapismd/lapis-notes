# Architecture / Build and validation

The shared application core has a separate root Cargo workspace and pinned
Rust 1.99 toolchain. `pnpm rust:core` uses checkout-owned
`.local/rust-core-target`, rejects target/manifest/config overrides and requires
30 GiB free before compilation. Normal check/test/build include the core lanes;
canonical specification checks also run native source/dependency boundaries and
their regressions. The transitional native companion remains an excluded,
independently built package until the hosted cutover.

The private hosted native companion is grouped by history and IPC functionality
under `packages/server-native`. It pins Rust 1.99 and consumes sibling JJ Store
source at qualified extraction `f58b9363`. `pnpm server:native` uses a separate
checkout-owned target, requires 30 GiB free and never cleans caches implicitly.
This development slice does not package or enable a public native endpoint.

Hosted parity reconciliation consumes released Design Core `^0.6.0` through
registry ranges and a frozen lockfile. This aligns the current API's close guard,
plugin flush and centered panel calls with their owning shared implementation;
no local shim, source alias or package patch substitutes for those capabilities.

LN-SRCH-051 saved-version content identities and checkpoint references are additive presentation types. They preserve provider-owned navigation and introduce no database, Vault or repository authority.

LN-SRCH-051 adds an App-owned result-provider registry. Provider targets remain opaque to Search; database projections, source authority and package ownership do not change.

Candidate server images reconstruct the public pnpm hook before their frozen
registry install. Ignored local archive overlays do not enter that build.
[Fresh server qualification](../../records/2026-10-16-m7-server-qualification.md)
keeps image construction, source tests and full browser evidence distinct.

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

The CI acceptance graph uses exact frozen source candidates for temporary signed
registry fixtures before V2 production cutover. Public package ranges stay
portable; full Web and native packaged results remain blocking under LN-PKG-142.
Fixture builds verify the checked-out Plugins commit before setting source
provenance inside the executing shell, independently of the host workflow SHA.
Final plugin acceptance pins `da7d8bb73541eb3421ca8fdfaf1eaaf2baecc850`,
the version candidate containing AI 0.1.5, History 0.1.4, Markdown 0.1.6 and
released Mira 0.0.4. Ephemeral fixture signatures establish acceptance evidence;
production signing and publication retain their separate approval gate.
Native acceptance provisions the separately installed controller CLI from its
exact validation source based on the public release. Complete Web acceptance retains both browser jobs: the PWA/registry lane and
an independent Node server lane. The latter builds its Docker image from the
checked-out Notes candidate and requires no Deno setup or desktop build job.
The server fixture seeds its private bootstrap secret into a Docker volume owned
by the image's service user, so host UID differences cannot prevent startup.
That file-seeding container has no network. Initial server navigation retries
once only after an observed same-origin Chromium document or script
`ERR_NETWORK_CHANGED` failure and retains a diagnostic attachment. Application
assertions and the later editing, sharing and restart sequence remain unchanged.
Web diagnostic artifacts upload after successful recovery as well as failures,
so a passing retry retains its observed transport errors.
The retry diagnostic is file-backed JSON attached by path, and both Web
Playwright configurations preserve output from passing tests. This keeps
recovery evidence available to the artifact uploader with the line reporter.
