# Runtime and package integration

These entries retain outstanding integration and qualification from the retired
migration plans. They do not reopen completed extraction or hosted cutover.
Current contracts are [Rust services](../architecture/rust-application-services.md),
[web](../web-host.md), [packages](../packages.md) and [styling](../ui-and-styling.md).

## Standalone local and offline browser qualification

Owner: Notes web and API packages. Disposition: qualification pending where no
current receipt proves the complete supported browser profile. Retain the local
browser implementation independently of native-core selection.

Acceptance: a cold local/offline browser can open, edit, persist, reload and
reopen its supported vault, metadata, Search and Tasks features without requiring
the server, Tauri or a native engine. Preserve shared conformance fixtures,
conditional writes, dirty buffers, plugin disablement and teardown. Native or
hosted receipts cannot qualify this profile.

## Optional plugin service adoption

Owner: Notes public service contracts; plugin algorithms remain in lapis-plugins
and native implementations in lapis-server. Optional Docs host/UI adoption and
legacy AppDatabase History capture ownership remain separately deferred.
Current application profiles do not bundle the optional legacy History plugin;
its installed behavior remains client-dependent. Do not activate it or introduce
a native scheduler as documentation cleanup.

Acceptance: define the optional capability first, then prove source/public-package
conformance and each explicitly selected host's admission, disable/re-enable,
passive lifecycle, recovery and cold reopen. Existing current-profile metadata,
Search, Tasks and native repository history qualification remains valid for its
recorded revisions.

## Package and UI integration

The revoked-vault Sync cleanup repair is released in API `0.2.3` on npm's
`next` channel. [Publication and signed provenance](../../records/2026-10-31-api-023-publication.md)
verify its exact bytes and source `0d9d4d92`; the released-source private App
Profile archive depends on API `0.2.3` rather than retaining an older exact copy.
Desktop owns intake of those released exports and the original cold native-close
acceptance in its [backlog](https://github.com/lapismd/lapis-desktop/blob/main/spec/src/backlog.md).
Preserve admission rejection and real cleanup failures; Notes publication does
not substitute for that consumer acceptance.

Owner: each published package's source repository. Keep remaining retained UI
families and public extension points documented in their owning feature chapters;
consolidate overlapping primitives upstream in Design Core. Package releases and
consumer adoption require separate evidence of public export bytes, portable
registry ranges and the affected hosts/stories. A source checkpoint alone cannot
qualify a consumer or authorize publication.

The historical release-wave register predates newer registry releases. Future
release preparation must inspect live package versions and required public
contracts rather than treating its old wave positions as pending work.

## Temporary Bits UI lifecycle patch removal

Owner: Bits UI for the fixes; Notes owns its explicitly approved pnpm intake.
The tracked 2.20.2 patch composes Link Preview timer cancellation, all six
Slider post-destroy pointer guards and the upstream FocusScope idempotent mount
(PR #2264, owner commit `692fbdf5095941464561189fd81ffc2cb4b81c6c`). Its
[receipt](../../records/2026-10-31-composed-bits-lifecycle-patch.md) separates
source provenance, exact installed bytes and current consumer qualification.

Acceptance: select a published upstream version containing every remaining
component fix, remove the patch through pnpm, and rerun exact lifecycle/preview
regressions, affected families, complete check/test/build and cold
Storybook interaction/accessibility, static and host/package acceptance. A
FocusScope-only release cannot close the other components' removal gates.
Published framework consumers do not inherit this root patch; preserve
LN-PKG-158's independent minimal registry consumer.

## Runtime dependency security

Owner: Mira's dependency chain. A fresh registry-only API `0.2.1` consumer
resolves `rehype-katex` `7.0.1` to vulnerable KaTeX `0.16.47`, despite Mira's
patched direct KaTeX dependency. Desktop's existing bounded `0.18.10` override
mitigates its current intake; the plain published API closure remains affected.

Acceptance: qualify and release the owner dependency repair, consume its normal
registry range, and verify a fresh published API production graph without that
consumer override. Preserve public Markdown math behavior and distinct source,
publication and consumer evidence. The separate API Minimatch owner fix and
patched fresh AI Host routes do not close this pre-existing finding.

## Development dependency maintenance

Owner: Notes development/build tooling. The October 31 configured root audit
retains separate Storybook, Vite, Vitest, QMD, Undici, web-build and unpatched
`deepmerge` findings in the [security receipt](../../records/2026-10-31-api-minimatch-security.md).
The tracked release workflow has no full-root vulnerability-audit gate; this
scope statement grants no new exception and does not claim a clean audit.

Acceptance: reproduce each current finding at its owning boundary, qualify
available fixes through the affected tool and consumer lanes, and report any
remaining unsupported or unpatched route explicitly. Keep this maintenance
separate from the focused API matcher compatibility change.

## Browser-runner disconnect investigation

Owner: Notes validation tooling. The initial cold composed-Bits run passes 88
cases before a browser disconnect while starting Chat; the unchanged exact Chat
family passes six cases and the unchanged complete retry passes all 269 cases.
The [source receipt](../../records/2026-10-31-composed-bits-lifecycle-patch.md)
retains the failed run and diagnostics. The source PR, API `0.2.3` version PR and
[actual publication workflow](../../records/2026-10-31-api-023-publication.md)
subsequently pass their required hosted gates. The disconnect's cause remains
unproven; this entry tracks diagnostic follow-up rather than an unpassed release
lane.

Acceptance: retain browser stderr, child exit and live cgroup memory/peak
observations to distinguish a browser crash, resource event and transport loss.
Keep unhandled errors fatal and require the complete current-source catalog and
required hosted checks to pass; a focused family pass cannot replace those
gates. Do not add an assertion, deadline, warning or resource-limit waiver.

## Source-test exceptions owned by siblings

The final migration handoff retained plugin portable-lock/Bits UI guards and
preview-lifecycle failures as source-owned findings. It also named jj-store's
integrated-slice validation and thread-files plan as owner work. These are
historical findings, not claims about today's sibling state. Before qualifying a
consumer that depends on them, reproduce the exact owner command, preserve
failures and consume the owner's verified fix; do not add consumer shims or
waive the acceptance boundary.

## Evidence

[Consolidation reconciliation](../../records/2026-10-30-spec-consolidation.md)
accounts for every former Rust tracking row and explains superseded cutover
claims. Existing receipts in spec/records retain their original revisions,
commands, failures and qualification limits.

## Cloudflare PWA publication

- Review the desktop-aligned browser vault chooser in Storybook before publishing LN-WEB-090.
- Review representative registry loading skeletons under LN-PLUG-125 before merging this Storybook slice.
- Restore installed window chrome and persistence-safe updates and browser appearance (LN-WEB-085–087).
- Qualify the prepared static artifact, automatic main publication and app.lapis.md cutover (LN-WEB-083–084), static caching (LN-WEB-088) and revision-specific installation (LN-WEB-089).
