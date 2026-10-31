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

Owner: each published package's source repository. Keep remaining retained UI
families and public extension points documented in their owning feature chapters;
consolidate overlapping primitives upstream in Design Core. Package releases and
consumer adoption require separate evidence of public export bytes, portable
registry ranges and the affected hosts/stories. A source checkpoint alone cannot
qualify a consumer or authorize publication.

The historical release-wave register predates newer registry releases. Future
release preparation must inspect live package versions and required public
contracts rather than treating its old wave positions as pending work.

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
