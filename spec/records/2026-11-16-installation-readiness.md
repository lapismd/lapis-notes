# Exact npm installation readiness

Notes source baseline: `1e30827341d09e2f7435cc5b46277142b78558d7`.

## Observed boundary

The UI0.2.2/API0.6.7/Workspace0.4.7 publication's verification job exhausted
five fresh-cache install probes between08:40:06 and08:41:14UTC. Pnpm still
reported UIlatest0.1.0. Earlier full metadata/tarball checks and publication
recovery remain separate evidence. Tasks0.2.1 verified exact registry bytes at
08:44:58 before npm install immediately failed ETARGET for that same version.
Docs0.3.0's initial run differs: its version metadata remained unavailable
about62 seconds after publication, before consumer installation. None of these
observations establishes a universal npm convergence duration.

The pinned pnpm10.34.5 loopback probe confirms installation requests Accept
`application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*`.
Its NDJSON failure has code `ERR_PNPM_NO_MATCHING_VERSION` and an exact
`package.name`/`package.version`. Unsupported full-metadata flags, platform
policy changes and cache-format manipulation are not used.

## Regression and qualification

Before the repair, three public-entrypoint regressions fail: installation
metadata readiness is not checked, a mismatched metadata integrity does not
block installation, and unrelated missing versions are retried. The preserved
fresh-cache controls prove local negative-cache isolation independently.

The three exact public-entrypoint controls change from0 passed/3 failed to
3 passed/0 failed. Complete owning verifier tests pass20/20, including the
actual pinned-client protocol, one shared deadline, exact-cohort failures,
cache cleanup, request timeout, certificate/auth/schema/integrity rejection,
install process-group termination and unsupported native-platform rejection.
The complete default-Docker release tooling suite passes170/170. A preliminary
protocol fixture used an empty version index and correctly received the distinct
`ERR_PNPM_NO_VERSIONS`; the final fixture models the observed stale existing
version, preserving the exact missing-candidate assertion.

## Bounded source contract

Selected-candidate install-v1 readiness and actual consumer installation share
110 seconds and at most six attempts. Backoff is5/10/20/30/30 seconds, charged
against that same deadline, and each metadata request gets at most5 seconds.
Missing exact candidate metadata, HTTP404/429/500/502/503/504 and narrowly typed
transport failures can retry; name/version/integrity mismatches, authentication,
invalid data, unrelated dependencies and build failures stop. The pnpm adapter
uses its supported NDJSON reporter to identify exact candidate errors, keeps
the root package-manager and approved-build policy, explicitly uses the manifest
registry, and preserves the content store while removing each metadata cache.

The Linux CI/container is the actual hosted caller; no private verifier Windows
promise or caller was found. Linux/macOS owned-process groups support bounded
cancellation, and unsupported native platforms fail closed. Tests qualify Linux;
no new native macOS or Windows execution is claimed. This private release-tool
boundary changes no application or package platform support.

Timestamp, phase, candidates, attempt count, elapsed budget and deadline appear
in diagnostic events. Exhaustion stays a typed failed gate. A finite window
cannot guarantee npm convergence; this authorizes no blind workflow/publish
retry. Existing full metadata, artifact identity, signatures, provenance,
idempotence and actual Vite/import/CSS checks remain independent and blocking.

## Published-consumer and specification acceptance

The actual hardened verifier passes against the retained source-qualified
`1e308273` publication manifest: UI0.2.2, API0.6.7 and Workspace0.4.7, plus the
unchanged framework cohort. The first measured run's readiness and installation
finish in6.172 seconds on attempt1, followed by successful existing Vite and
public import/CSS checks. It uses pinned Node24.15.0/pnpm10.34.5 with an empty
npm user configuration and no publication credentials. No candidate is rebuilt,
versioned or published.

Mapped spec validation and69 policy tests pass. An initial new-chapter check
caught missing generated mirror/order and a verification row appended below
prose; corrected canonical wiring passes. The generated195-chapter Storybook
build and index pass; static specification acceptance passes5 cases with three
existing explicit development-only skips. Preview changes only the generated
Specification order, not an application decorator, fixture, boot or story.

Standalone `pnpm spec:first` hits the unchanged runner's `--head requires --base`
invocation diagnostic. Supplying explicit immutable base`1e308273` preserves
its exact snapshot head and passes; aggregate `spec:check` also passes its
spec-first phase. No checker, baseline or assertion is waived.

Release configuration, workflow and Changesets-plan checks pass. Formatter,
actionlint and semantic QMD discovery pass. Spec Validator remains the latest
Deno-free0.2.0; doctor has10 passes and the existing custom-alias warning.
Both audits exit zero under existing policy; production has zero findings,
while full metadata retains the existing ignored development-only LOW finding.
No audit decision, dependency/lock, runtime, version intent, signing, deployment
or publication change is included. Hosted PR acceptance remains separate.

## Reuse proposal and held boundaries

A shared LapisCI core can own exact metadata identity, deadline accounting,
typed transient results and diagnostics once its source/API is reviewed. Keep
npm/pnpm commands and cache controls in separately qualified adapters. The
LapisCI owner has received this proposal; no central or other consumer source
is changed by this slice.

- Tasks is the first adoption case: its real ETARGET happened after exact
  registry bytes were verified. Preserve its reviewed60-by5-second metadata
  policy, strict-peer npm install/ci, signature audit, publint and receipt.
- Docs' retained first failure was version-metadata availability, before npm
  installation. Review its12-by5-second full-metadata window and installation
  together, preserving every artifact and signature gate.
- Tasks/Docs `skip-different` idempotence uses independently verified published
  bytes. A readiness integrity expectation must follow that disposition rather
  than blindly binding a different local candidate's bytes.
- Mira already has36-by10-second publication-integrity grace. Post-publication
  clean-install readiness must preserve that separate reviewed window, installed
  version checks, signature/attestation audit and exact provenance checks.

Npm's public `--cache` control covers both metadata and content, unlike pnpm's
metadata-only `--cache-dir`. Prove its exact ETARGET JSON adapter and fresh-cache
cost in real fixtures before adoption. Notes'110-second policy must not silently
replace another publisher's reviewed grace or crypto semantics.
