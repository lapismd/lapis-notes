# Local registry review snapshot

Captured on 12 October 2026 from `lapis-plugins`' signed local static-release
acceptance catalog. `provenance.json` records each release's source commit and
every copied metadata/media file's SHA-256. The release plan's older
`generatedFrom` value is retained separately; use the per-release source commits
for provenance. This is not a production publication.

The `v2` index, revocations, 12 detail records and 168 WebP assets are copied
byte-for-byte. Only public test signing keys are included. Bundles, private keys,
download statistics and fabricated optional fields are excluded.

`Workspace/Plugins Registry Snapshot` boots a real App and the production HTTP
distribution manager. Its transport maps signed URLs to bundled snapshot files
without rewriting metadata. The manager verifies signatures and parses all 12
details before mounting the real workspace. Images use the normal byte-size and
SHA-256 verifier. Install controls reflect the real catalog, but bundle requests
return 404: these stories exercise presentation, not plugin installation.

Author avatar URLs remain external and may use the normal initials fallback.
Graph has no logo or signed Markdown content in this snapshot; release notes
come from its structured version records. The existing synthetic scenarios
remain useful for updates, failures and other states this catalog does not have.

To refresh, copy only `index.json`, `revoked.json`, `plugins/*.json` and referenced
`assets/**/*.webp` from a newly verified local catalog. Preserve their exact bytes,
copy only its public trusted keys, and update the capture timestamp, per-release
source commits and SHA-256 inventory in `provenance.json`. Run all four snapshot
stories before requesting visual review. Do not include signing material or
approve baselines as part of a refresh.
