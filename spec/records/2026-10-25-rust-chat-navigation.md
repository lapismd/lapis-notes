# Retained native chat and History navigation — R2.2.3

This work continues the committed observer/transport checkpoint at Notes
`58dc50ac` and Desktop `83b82d7f`. It does not promote either default owner or
qualify an actual provider. The same private Notes application profile owns
both hosts' public Agent screens and workspace routing.

## Before and focused source regression

The real Rust-hosted browser test
`rust-server-chat.spec.ts` first used an incorrect composer combobox role;
its corrected textbox selector reaches an actual fixture-worker reply. The
remaining product assertion fails once: History is on surface `body` instead
of `right-sidebar`.

`pnpm --filter @lapis-notes/app-profile exec vitest run
src/native-chat/navigation.test.ts src/native-chat/observer.test.ts` first
has one missing-navigation suite failure, one saved-title failure and seven
passes. After the first fix all fourteen cases pass. Added scope coverage and
final qualification are pending.

## Implementation

App-owned navigation defaults History to an ungrouped right sidebar, preserves
moved History leaves and opens/reuses exact main-area scope/conversation pairs.
Concurrent open requests serialize within this presentation navigator only;
native services remain the accepted-work authority. New scoped drafts preserve
other open chats and do not submit. Saved leaves retain scope and conversation.

The public History presentation controller routes selections through the owned
App rather than replacing History. A bounded read-only metadata projection
loads titles/status without every transcript, refreshes changed heads and
expires cached metadata after two seconds. New journal entries may precede
their first portable metadata publication; missing files are retried only for
active turns. Malformed or terminal missing data remains an error.

## Qualification and remaining gates

Source package checks/build and the fourteen focused cases pass. Built browser,
affected package/catalog lanes, final archives and actual Tauri chat acceptance
are pending. R2.2.3 remains Working; real-provider detach/cold recovery remains
R2.3. No release, signing, Node cutover or new renderer writer is claimed.

## Updated source/browser checkpoint

All eighteen focused navigation/observer cases pass. The complete forced
`pnpm exec turbo run check test build --concurrency=1 --force` lane passes
33 tasks across eleven packages with 2,184 unique package cases; the frozen
Deno test retains one intentional skip. No Deno source changes.

The first built after-run rejects valid metadata without an optional title;
the projection now derives that fallback from the first immutable native
authored request, cached separately from editable metadata. No transcript is
loaded for that fallback. Subsequent attempts repair ambiguous title buttons,
count actual tab labels instead of hover-only close buttons, and explicitly
reopen the vault from the retained chooser after reload. These are test
corrections, not new application screens.

The expanded exact cold browser case passes (12.2 seconds), then all eight
Rust-hosted journeys pass (1.1 minutes). The expanded case retains History,
reuses the exact tab, preserves a new draft, reloads and restarts the real
service; the worker log still contains exactly one prompt. Actual-provider
acceptance remains separate. All 37 application-profile cases pass.

## Final source qualification in progress

The complete cold Notes catalog passes all 261 cases with zero failures. The
combined native Markdown intake passes all 338 ordinary Rust cases/doctests and
all five unique real-model cases. The final package lane is explicitly native
for macOS application acceptance after the independently committed validation
runner changed portable defaults to Docker. A concurrent lease failure is kept
as a failed attempt; no automatic fallback, dependency changes or suppressed
assertions were added. Final source commit and committed-profile/native intake
remain pending. The Desktop five-package cohort retains its verified `58dc50ac`
archives; only this slice's changed private chat package needs a new archive.

## Verified source checkpoint

Final explicit macOS qualification passes all 33 forced package check/test/build
tasks across eleven packages with 2,209 unique cases. The fresh built renderer
passes all twelve PWA, eight Rust-hosted and one Node-hosted journeys. Rust chat
retains History, reuses the exact conversation, preserves drafts and restores
after actual service restart with exactly one recorded prompt. Node remains the
serving baseline. The final source specification checks, 49 validator cases,
181 generated mirrors and grouped/spec-linked progress checks pass.

One attempted browser retry used the root Playwright CLI and collected no tests.
The package-owned SDK CLI is the correct boundary; its complete twelve-case PWA
rerun and both hosted lanes pass without test-source or timeout changes.

The source gate is verified. Tauri committed-archive adoption remains the next
consumer gate; R2.2.3 remains Working until it passes. R2.3 provider acceptance,
other services and Node retirement retain their original gates.

## Committed source and final formatting

Notes `7161a447ef365df498371d7bad491df5f5da431c` commits the verified source.
Final JSON fixture indentation is verified again by two native and 21 retained
reference cases. Final callback-only Svelte formatting produces byte-identical
production JavaScript and CSS with Svelte 5.56.10; compiled JavaScript SHA-256 is
`e0014bbcccd2e25bb777bbcdc2eb65d8b5bdacc0ff24f1fbea277a9f9685f530`.
Private-profile checks/build and all 37 cases pass again. Only the changed
private profile is repacked; the other nineteen peer archives retain their
qualified identities. Final consumer acceptance remains separate.
