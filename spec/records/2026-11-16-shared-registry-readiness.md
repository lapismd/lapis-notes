# Shared registry readiness adoption

Notes' original LN-PKG-195 engine is deployed in PR144. It supplied the source
boundary from which Lapis CI's shared readiness implementation was qualified.
This follow-up removes the local retry/metadata and owned-process engines and
keeps a small Notes policy adapter around accepted immutable shared source
`69a81e05ca32dc5b7024ef2cd0711860b1813926`.

Notes retains its110000ms owner budget and5/10/20/30/30-second backoff, exact
root pnpm10.34.5, full selected candidate name/version/SHA512 identities and
existing minimal approved dependency-build policy. No repository hooks,
patches, overrides or workspace links reach the generated consumer. The shared
source additionally verifies the actual installed pnpm version. Existing Vite,
import and CSS acceptance remains blocking after installation. Production has
no network-download or old-engine fallback when shared setup is absent.

The publisher verifier and the CI release regression job prepare the same
immutable shared action. Existing kernel regressions execute against that real
source rather than a mock replacement: a test-only fixture verifies all three
public files against exact source/SHA256 values and stages them in an owned
temporary directory when CI has not supplied the checkout. Missing or changed
evidence fails before import. No shared implementation is committed into Notes.
Controlled process fixtures continue to prove owned-descendant cancellation,
fresh caches, metadata/identity errors, exact-candidate retry and one deadline.
The real pinned-pnpm loopback counterexample remains an acceptance gate.

The new exact delegation target initially fails once because the adapter's
shared loader is absent, then passes after implementation. The completed
owning verifier controls pass against the actual shared source; old abbreviated
test integrities become valid64-byte SHA512 fixtures. Exhaustion now asserts
the shared structured cause and exact candidate/phase/attempt diagnostics;
unrelated failures retain zero retries. Exact tool-version drift fails before
installation. No assertion, functional gate, visual baseline or audit policy is
weakened.

Workspace guidance requires the Deno-free validator0.2.1 patch before spec
checks. Its manifest/registry lock update changes only that package; two
unrelated pnpm peer normalizations were restored and frozen installation passes.
Public/runtime versions and the actual version command remain unchanged.
The empty maintenance Changeset creates no product bump. Frozen Deno packages
are excluded from implementation and adoption.

## Owning-source qualification

All24 verifier controls and174 complete release tests pass against the actual
shared source, including the real pinned-pnpm loopback counterexample. Normal
Docker specification checks pass with69 repository policy cases, then the full
Docker check/test/build aggregate passes2194 package unit cases. Formatter and
workflow actionlint pass. Existing quarantined Storybook lanes retain their
explicit disposition; this slice neither changes presentation nor claims those
skips as new browser qualification.

The exact workflow/Turbo wiring control additionally caught one missing
task-local pass-through declaration: Turbo's strict environment selection would
otherwise discard CI's prepared module path. The correction passes only this
public path to the release regression task, preserving strict/global scope and
the source-hash verification. Its exact failing-before/passing-after check and
the full owning release/source lanes pass again after that configuration change.

## Retained published-consumer acceptance

The changed verifier passes the actual UI0.2.2/API0.6.7/Workspace0.4.7 cohort from
successful manual publication43830659103 at immutable source
`1e30827341d09e2f7435cc5b46277142b78558d7`. Original build/publication/verification
metadata and artifact14209291060 qualify independently. Its ZIP digest is
`sha256:35252338c14e0d7c882c83423c7466101133515babc1c024db4a3676c6017931`.
Original tarball SHA512 identities match their manifest: UI31679 bytes,
API765279 bytes and Workspace116808 bytes.

On Node24.15.0/pnpm10.34.5, with an empty npm user configuration and no
publication credentials, the actual new verifier completes readiness and
installation on attempt1 in6581ms. Existing Vite/build/public import/CSS checks
then pass; total verification is16551ms. The receipt at
`/home/steve/.cache/notes-s5-shared/retained-receipt.json` binds the actual verifier,
adapter, manifest validator, root manifest and workspace-policy hashes. The
approved minimal build policy and unchanged framework cohort remain intact.
No package is rebuilt, versioned, uploaded or tagged by this acceptance.

Hosted current-head qualification and deployment remain pending. Actual
production verification remains a separate gate for the next genuine
downstream release; this maintenance slice creates no artificial version to
exercise that path. The original PR144 receipt cannot prove the changed
adapter and workflow wiring, and local retained acceptance does not complete
the cross-repository release-wave or deployed-publication exit condition.
