# Merged App Profile peer cleanup and exact consumer cohort

[Notes #164](https://github.com/lapismd/lapis-notes/pull/164) merged at
`5ffb33c152404b6880debd1b5fd70762121d6196`, from checked head
`42da3822fc8cbbab7c5d68940d49de746dc06fa8`, after required workflow
`44186417709` passed. Source/archive qualification remains in the immutable
[owner source](2026-11-17-profile-vite-peer.md) and
[helper archive](2026-11-17-profile-vite-peer-archives.md) records.
[Exact hosted/replay receipts](2026-11-17-profile-vite-peer-hosted.json)
preserve the failed attempt as well as the successful qualification.

## PWA attempt retained

The first hosted PWA acceptance failed once at offline `sync-readiness` after
90 seconds, with no console, page or network errors. Failed job:
`134405933499`. Its actual prepared artifact `14374532361` was downloaded and
independently ZIP SHA-256 verified as
`c0010f3ec1ad1eeda5731619dca6cf643afb53711a9f475beb23ab0c2727a59e`.
Its source-labelled build is `a569eb5728c4c7e84685cde41e87d825ac3e6600`.

Two independent cold omarchy Docker controls passed unchanged acceptance:

- Frozen unchanged-main `af645ddb` production build: one pass, including offline
  reopen, Search, verified plugin cache, appearance and prompt-update data safety.
- The exact failed artifact bytes: one pass of the original script. The smoke,
  preview and acceptance scripts are byte-identical between main and PR head.

One deliberate unchanged-head failed-job retry was then requested; hosted PWA
job `134415532823` and aggregate validation passed. No timeout, assertion,
quarantine, runtime or acceptance gate was changed. The underlying intermittent
stall is **not fixed**; LN-WEB-092 and the existing backlog retain that separate
investigation. Local controls alone were not substituted for the hosted gate.

## Exact merged source adoption

`validation:consumer-pack` at exact merged main passes in
`07cf0ce2-cf5f-4924-8620-3feae56b4313`. Every one of the six archive SHA-256s
matches the earlier `b3a93b2f` source cohort exactly. Desktop can retain its
completed checks against those identical bytes while selecting a reachable
merged source and refreshing its exact-source expectation tests.

An earlier pack from local empty child `5bea69d3` is explicitly discarded.
The immutable checkout guard had rejected ordinary `jj edit`; the accepted run
uses an explicit read-only selection, verifies the exact original main commit,
and returns to a fresh empty child before any further edits. No main bookmark
or immutable commit was rewritten.

Desktop's completed candidate lanes are 794 governance/renderer cases, 748 AI
cases across 153 files, 290 Rust cases and two unchanged existing ignores,
ordinary/e2e strict Clippy, types, formatting, renderer and static catalog build.
The actual installed catalog graph also reports zero production advisories
and zero gate errors under the separately user-approved exact development-only
Picomatch exception through 2026-11-30. Its complete interaction/axe run and
final canonical/hosted adoption remain Desktop-owned work in progress.

Remote Docker exhaustion interrupted the next fixture-build orchestration
before creation. Cleanup removed only 18 stopped task-owned containers whose
receipts/logs were retained, preserving the active catalog worker, a stopped
worker without a receipt, all source repositories, caches and unrelated runs.
No global prune was performed. The fixture build was then retried unchanged.

Package publication, registry-only consumer adoption, website cutover and
installed-app replacement remain separate. The current registry-fixture pin
and Desktop's older Plugins fixture input are further caller-aware cleanup
work; this receipt does not mark the whole shared-AI retirement complete.
