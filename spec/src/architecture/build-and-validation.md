# Architecture / Build and validation

Hosted default build/test lanes select the full native image and export pinned
sibling Rust inputs. The server container uses an exact tracked context and
private archive projection, with no local vault/profile material in its build.
GNU tar context transfer preserves long pinned-sibling paths. An explicit local
`LAPIS_NOTES_VALIDATION_SSH_IDENTITY` may select a file identity for remote Docker
without an ambient interactive agent; the default SSH configuration is retained
when that option is absent.

## LN-ARCH-146 — Docker-first local validation

<a id="ln-arch-146"></a>

**Requirement.** Root checks, builds and portable tests MUST default to isolated Docker runs with exact tracked source, frozen registry dependencies, reusable fingerprinted images and dependency-keyed caches; missing images MUST build automatically. Native execution MUST require an explicit override; Docker failure MUST NOT fall back to the host. Runs MUST preserve arguments, bounded resources, source/tool identities and reports, including separate Jujutsu workspaces and remote daemons. Platform-native delivery and live-provider acceptance remain separate lanes.

Temporary source-archive qualification installs its declared, checksum-verified
prerequisites before validation. It does not require unpublished identities to
resolve from the registry first; tracked manifests and lockfiles remain portable.
Registry-only release qualification stays a separate gate.
An archive projection preserves pnpm's effective dependency override policy
before adding selected archives. A package-level projection must not shadow
workspace security overrides; invalid policy stops before installation. Tracked
manifests and lockfiles are restored before checks, including failed installs.
Workers drop Linux capabilities so permission regressions cannot pass through
root's discretionary-access overrides. The actual Docker smoke verifies denied
file reads, denied directory writes and zero effective capabilities before the
browser checks. The existing init process reaps owned subprocesses.
Runtime selection is per invocation: hosted CI keeps its provisioned native
environment while the actual-image acceptance step explicitly re-selects the
Docker runtime, because the image harness fails closed without Docker.
Aggregate Storybook lanes enter the public dependency-aware build/test commands
inside the worker. A clean snapshot cannot assume that API or profile `dist`
already exists from an earlier host run.
JavaScript and native cache identities are independent. JavaScript archives and
pnpm locks MUST NOT invalidate Cargo targets; native source pins and Cargo locks
MUST NOT invalidate JavaScript caches. Exact image/tool identities fence both.
Image fingerprints use only the actual Docker build inputs, architecture and
target; application manifests and dependency locks cannot rebuild a tool image.
Cache inputs come from the transferred immutable source snapshot, and receipts
record both identities. Cargo still validates changed Rust source fingerprints.
Workspace leases remain held for created, active, paused or unreachable workers.
Cleanup collects only completed owned runs and removes their immutable container
IDs; an SSH failure cannot authorize an overlapping run or cache cleanup.

Native daily-reference, Task adapter/installed-host and editing/leave test
entry points use the same bounded Turbo boundary as other public local tests.
Their internal `:run` scripts preserve the original commands and arguments;
registered uncached root tasks retain live native/browser execution and explicit
runtime selection. Package-build preflights use declared root-task dependencies;
raw scripts cannot invoke Turbo recursively or redispatch their public entry.
Public-router cache fixtures copy the real controller and lanes into their
temporary root, explicitly select native execution and retain production output
ignores; cache-hit and invalidation assertions remain independent of Docker.
Disposable snapshot fixtures explicitly select and verify their own real parent
as the exported check base, then restore the outer qualification environment.

The root migration tracker projects gate-status tables from its owned JSON
ledger through `pnpm progress:generate`. `pnpm check:progress` runs in normal
and specification validation to reject stale status groups and invalid task
links. The authored activity checkpoint and historical intake remain separate
from the generated task block; LN-GOV-051 governs their freshness.

The shared application core has a separate root Cargo workspace and pinned
Rust 1.99 toolchain. `pnpm rust:core` uses checkout-owned
`.local/rust-core-target`, rejects target/manifest/config overrides and requires
30 GiB free before compilation. Normal check/test/build include the core lanes;
canonical specification checks also run native source/dependency boundaries and
their regressions. The transitional native companion remains an excluded,
independently built package until the hosted cutover.

Native source snapshots pin the sibling plugin, Tasks and Docs algorithm crates
separately in `scripts/validation/native-sources.json`. Their qualified parser
revisions do not select a host writer or admit a UI dependency cohort. Native
Markdown version-2 parser intake retains its own locked source and cold-cache
proof. Docs is
exported from its committed source revision; unrelated dirty npm manifests are
excluded, as recorded in the [Docs intake](../../records/2026-10-25-native-docs-projection-intake.md).

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

Linux native qualification retains atomic cache durability by reopening the
capability-relative parent directory for reading before synchronizing it. A
search-only directory capability cannot serve as an fsync handle. The exact
model-cache regression passes ten cases after four initial failures.
