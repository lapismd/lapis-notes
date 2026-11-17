# Retired shared AI removed from registry fixture inputs

LN-CAT-124 and LN-CAT-125 close a remaining build-time consumer of the retired
shared AI plugin. Notes' CI pinned Plugins before source retirement, installed
the whole old workspace and built its registry fixture. The fixture now pins
merged Plugins `969356250f26c5561fac22cf00d8da8f395dbdae` and executes that
source's `check-retired-ai.mjs` before dependency installation or builds. Existing
audit, framework publication and signed-artifact checks remain mandatory. The
explicit native selector applies inside the provisioned CI container, avoiding a
nested Docker invocation; product validation still uses omarchy Docker.

The [machine receipt](2026-11-17-retired-ai-registry-fixture.json) retains source
archive identities, exact bundle hashes, failed attempts and remaining gates.
Immutable source tar exports use Plugins `96935625` and Notes `5ffb33c1`; only
the owning Web acceptance test is overlaid for the after run. No dirty sibling
source, dependency patch or production-code override is transferred.

## Producer and signed artifact qualification

The exact workflow regression changes from 196 passes / 1 failure before to
197 passes / 0 failures after. The final complete `release:test` rerun passes all
197 cases in `9d43ede1-b806-41d3-929e-625a6b92cd91`, including rejection before
any install/build, exact source identity, and the retained artifact verifier.

The actual pinned Plugins producer passes its retirement guard, frozen install,
existing dependency audit, framework publication check, package builds/pack/
publint, plugin build and plugin verification. Its fixture contains 16 active
plugins and no shared AI. All 18 signed catalog documents independently verify.
The owning bundle verifier also independently validates all 16 signatures,
exact sorted file lists, sizes, hashes, runtime metadata and source commits.
The fixture signing keys are test keys; no production signing or deployment is
performed.

## Real Web acceptance

The first real post-removal Web suite found one obsolete test requiring the AI
category/detail: 12 passes / 1 failure. The repaired test uses active Graph,
asserts the retired AI category is absent and retains verified Word Count
installation, Settings, single-view ownership, saved navigation and reload.
The exact selected test passes once in a cold browser process after the repair.
The complete cold after suite passes all 13 cases (0 failures), including
legacy data preservation, verified plugin installation, persistence, cold reload
and owner takeover. Fresh after result directories preserve the earlier failure
artifacts independently. The machine receipt records this completed run.

Specification checking passes in `609c58c6-7d07-4d09-af96-dbb0e0100a6d`,
including configured source audits, mdBook, spec-first and 68 specification-tool
regressions. Host QMD doctor reports the existing ABI147 mismatch; semantic
retrieval explicitly degrades to text fallback. Product lanes have no host
fallback. Final documentation formatting/status validation follows this receipt.

## Failed attempts preserved

- Initial container creation failed because remote Docker storage was full.
  Cleanup removed only 18 completed task-owned workers with retained local
  receipts, preserving active workers, source repositories and unrelated data.
- The first Web build exhausted the default 2GiB V8 heap. Subsequent commands
  use a bounded 6144MiB heap inside the existing 12GiB container.
- The first full Web suite failed at the obsolete AI expectation described above.
- A same-workspace concurrent spec runner was correctly refused by its exclusive
  validation lease; it passed when retried after release tooling completed.
- An ad hoc inline bundle-verifier script had a newline-escaping syntax error
  before verification executed. Its file-based correction passes all 16 bundles.
- Optional Playwright HTML report copying found no report directory after the
  focused pass. Fresh result metadata records exit0; the full after collection
  uses independent result directories, preserving the original failed trace.

## Remaining boundaries

Hosted exact-head CI, Desktop's separate fixture/source-build intake, actual
native old-external/bundled data and cold lifecycle acceptance, public API package
publication/adoption and Website cutover remain distinct gates. This slice does
not delete installed data, remove native AI, publish packages or retire the
frozen host. Terminal migration and retirement remain last.
