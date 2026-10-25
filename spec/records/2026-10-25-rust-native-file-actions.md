# Both-shell file-action checkpoint — R1.3.11

Status: Acceptance ready; Desktop consumer commit Waiting.
Notes source is committed at `fe604931`. Desktop change `tnnyuvsv`, parent
`a5b936e0`, remains uncommitted. These are separate qualification scopes.

The [hosted receipt](2026-10-25-rust-shell-file-actions.md) qualifies the retained
Explorer's rename/move collisions, post-move saves, actual service restart,
Unicode creation and local trash. It passes all seven cold Rust browser
journeys, twelve PWA cases, the Node24 hosted journey, 283 ordinary Rust cases,
twenty package check/test tasks, eleven builds and 261 catalog cases.

## Fresh Desktop compatibility

Desktop delegates its installed byte verifier directly to the shared Core and
retains URI/origin/resource admission. Its first strict normal check finds one
`needless_borrow` in that private adapter. Passing the existing root reference
directly clears the finding without a lint allowance or behavior change.

The original `cargo test --test plugin_assets` family passes all seven cases
after the correction. Strict all-target normal and e2e Clippy pass. Both fresh
local bundles build with `CARGO_INCREMENTAL=0`, `CARGO_BUILD_JOBS=2` and
`MACOSX_DEPLOYMENT_TARGET=13.0`. Ordinary bundle audit reports zero automation
markers across 327 renderer JavaScript files. The debug linker reports its large
unwind-table warning; no source lint is suppressed.

Actual macOS WebView acceptance, against the rebuilt isolated e2e app, passes:

- `Explorer rename and move preserve collisions, the active editor and restart layout`:
  one pass, 9.35s. Real file bytes, protected collisions, active edits after move
  and restored layout are asserted through the retained production components.
- `native exclusive creation preserves collisions and bytes while Explorer uses new-file intent`:
  one pass, 2.82s. Existing destinations, exact binary/Unicode bytes and visible
  Explorer creation are retained.

Commands are the existing `node --test --test-concurrency=1` targets in
`tests/desktop/file-ui-mutations.test.mjs` (selected happy-path case) and
`tests/desktop/file-creation.test.mjs`, under the isolated fixture
`.local/native-test/rust-file-actions-WxB8kH`. No user vault, profile or clipboard
is used. Both test applications exit normally.

## Remaining gate

Desktop's existing database/backup intake retains its recorded 27-pass/one-fail
native UI result: the unrelated Markdown attachment adapter lacks asset URL
hooks. Its owning repair is unqualified and has separate prerequisite/audit
findings. The workspace rule requires explicit user acceptance before treating
that existing failure as non-blocking. The disposition request is pending.

R1.3.8, R1.3.10 and R1.3.11 therefore retain their separate consumer-commit gate.
Passing the selected file-action paths does not qualify that Markdown scenario,
all native/provider/platform behavior, or final cutover. Desktop's five Notes JS
archives remain at `b55d3492`; no full archive-cohort refresh is claimed. No
Lapis AI source, installed application or model data is changed.
