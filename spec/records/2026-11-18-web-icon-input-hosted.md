# Web icon prerequisite hosted qualification and landing

Requirement: LN-WEB-093. Source and integrated Docker qualification remain in
the immutable [source](2026-11-17-web-icon-input-retirement.md) and
[integration](2026-11-17-web-icon-input-integration.md) receipts. The seven output
hashes are unchanged; this record adds actual hosted acceptance at the final
candidate rather than extrapolating the earlier fixture-only Web run.

- PR: [Notes #166](https://github.com/lapismd/lapis-notes/pull/166).
- Checked head: `ac2abc714d535753929ef0036bbaa2c0a79db5fa`.
- Base: main `545284a05f418b8d8b882c797b48878cf820bab1`.
- Hosted run: [44203317311](https://github.com/lapismd/lapis-notes/actions/runs/44203317311), completed successfully.
- Merge: `6787e8248146edcd75e78228a28738840be8fce4`, exact-head merge on 2026-11-18.

All 12 executed jobs pass: resolver, build cache, signed registry fixture,
quality, Cloudflare PWA packaging, Storybook specification, governance, unit,
release artifacts, static Storybook, Web acceptance and aggregate validation.
Web job `134475283472` passes all 13 browser cases in 2.8 minutes; final aggregate
job `134494382522` passes. The existing configured Storybook interaction
quarantine is skipped, not counted as a pass. No gate, assertion or protection
was weakened or waived.

Superseded run `44199598509` remains cancelled after its stale deleted-base
SPEC-FIRST-VCS failure; its separate 13-pass Web result does not make that run
successful. The new event targets main and passes its complete required gates.
The [fixture hosted receipt](2026-11-17-retired-ai-fixture-hosted.md) and retirement
progress retain that failure and cancellation context.

This lands Web's independent icon input only. The frozen host remains for its
separate Desktop/Deno removal. Core API services/functions, planned Language
Service wiring, native/data acceptance, Website deployment, package publication
and installed-app replacement are unchanged. Terminal migration remains last.

The documentation refresh uses published Spec Validator 0.2.1. Host doctor
reports the existing QMD native ABI 147 mismatch; the specification search
explicitly falls back to text. No semantic-search success or host product
fallback is claimed. Documentation validation run
`fbfeb256-3bdf-448f-ab05-4f2cb9ce0ec0` passes all six canonical lanes and all 68
specification-tool tests in omarchy Docker (Node 24.15.0, pnpm 10.34.5, 2 CPU/4
GiB). All five changed planning/canonical/receipt documents pass Prettier 3.3.3.
