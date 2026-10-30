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
