# Actual-provider retained hosted-screen recovery

Status: hosted actual-provider screen accepted. R2.3 remains Working until
Desktop qualifies its separate retained-screen journey and matching intake.

## Scope

The explicit host-only Playwright target mounts the qualified Rust-hosted
renderer, uses its real composer and installed Codex helper with declared
`read-only` mode, signs out through the existing vault menu, and requires the
native client DELETE to finish while the turn remains accepted/running. Its
browser closes before the actual provider finishes. A normal Rust/Vite restart
and fresh browser recover the saved conversation through existing History.
The accepted record, portable transcript hash, observed Submit count and native
journal count must remain exact through cold recovery and another page reload.
No direct Submit call, fixture provider or replacement screen qualifies this
journey.

Native credentials remain on the host. The test copies the explicit installation
configuration into its own ignored private directory; receipts contain only
test-owned identifiers, a nonce and native results. This adds a private opt-in
acceptance target, not a product API, provider default or deployment change.

## Inputs and command

Notes source is committed at `f0cf7b1abb370ea50595c3355763d9bf5abea9fe`.
Its macOS server builds with the normal guarded wrapper in 59.76 seconds.
All directly used native sibling crates/manifests match the pinned qualified
sources; differences in current siblings are only documentation, tooling or
unconsumed frontend files. The portable renderer is copied from the passing
eight-case hosted run `7b0bc62b-dfc8-4022-adca-cfece3b2edfa`, preserving its exact
source and ten-package archive identities. Native acceptance does not relabel
that run's later specification failure; the separate source correction and final
specification qualification are in the declared-mode record.

```sh
node scripts/rust-core.mjs build --locked -p lapis-server -j 4
LAPIS_SERVER_PROVIDER_SCREEN_TEST=1 \
LAPIS_SERVER_TEST_AGENTS_CONFIG="$PWD/.local/qualification/provider-agents-modes.json" \
pnpm --filter @lapis-notes/web exec node node_modules/@playwright/test/cli.js \
  test -c ./playwright.rust-provider.config.ts
```

## Before

The first exact target executes one case and fails once during the cold History
selection: its unanchored accessible-name pattern matches both the conversation
opener and that conversation's action-menu button. The actual provider has
already completed after the observed explicit detach and closed browser.
Anchoring the same expected title selects the opener, as the retained fixture
journey already does; no product code or outcome assertion changes.
The original host log and per-vault receipt are retained. The second exact run
recovers the actual conversation through cold History and page reload, then
fails on one harness identity comparison: the observer submits the compact UUID
form while Rust serializes that same UUID with hyphens. The test compares UUID
identity in a common compact form, still requiring exactly one observed Submit,
one journal and exact complete-record/transcript equality. No product change or
replay assertion is relaxed. This second trace is retained at ignored
`.local/rust-provider-screen-results-attempt2`; both per-vault receipts remain
under `.local/rust-provider-screen-*`.

## After

The final exact target passes **one case, zero failures**, in 20.8 seconds.
Its receipt is `.local/rust-provider-screen-YZ1IT2/receipt.json`. It records the single accepted request,
Running detach, completion without a browser, and unchanged cold History/reload
record and transcript with exactly one observed Submit and one native journal.
The native server SHA-256 is
`333f40e856b68c4e8b612eefd14806a0af036303921c5ff2cba9c3f64eef2a63`;
the installed helper SHA-256 is
`9181b38679aed2c713c225cf8d73a134743b736f113feeb8003f315521530be7`.

## Remaining

The explicit opt-out passes with one intentional skip and no native provider
launch. Complete Web checks pass at `f6ce8bc9`; the mapped documentation correction
and final specification/progress lanes pass at
`693c6e98-e40a-4b95-a9d1-b1961759273d`. Desktop's matching mode/package intake and
actual-provider application screen remain separate R2.3 gates. Node and renderer AI remain the defaults;
Linux server delivery, broader providers and final cutover remain separate.

Final transcript SHA-256: `f78fd6e89fab9e93fb32d4a4d13dce6afee4ada00860b5b2cc26dcf6576190bb`.

Portable follow-up `f6ce8bc9-f71f-4502-a35c-0fe06d02d8d5` passes dependency
builds and the complete Web Svelte, Node/config and e2e TypeScript checks. Its
specification preflight requires all five chapters mapped to Web configuration;
the hosted and shared profile/application chapters now record this acceptance
boundary. The focused specification follow-up does not repeat native prompts or
unchanged functional suites for that documentation correction.
