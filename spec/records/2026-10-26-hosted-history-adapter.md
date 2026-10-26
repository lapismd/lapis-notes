# Hosted native History adapter — qualified source intake

Updated 2026-10-26 11:32:25 UTC. The optional App/session port and hosted connection are
source-qualified. Retained Repository reader/screen adoption and R3 stay open.

## Shared ownership

The host reuses its existing admitted `RustVaultClient` and typed
`NativeHistoryIndex` start/status/query/context route. It places the optional
port on `VaultSession` before App construction. An explicit App port wins over
the session; ordinary profiles keep it absent. Construction and preparation do
not select work or acquire another native attachment.

`VITE_LAPIS_NATIVE_HISTORY=1` selects the private renderer port. Native selection
independently needs the existing installation-owned Rust flag; absent selection
stays a visible failure. Detach releases only the client and fences later calls.
The shared History plugin owns its observer/provider and immutable validation;
no browser batch scheduler, screen or fallback is introduced here.

## Exact before and after

Frozen test-only `3572ee5ad687d034378de8013b1c128c95757b02` runs
`pnpm --filter @lapis-notes/web exec vitest run
src/hosted/rust/native-history.test.ts` with **five failures, one pass** before
wiring. Every selected-port case fails; the ordinary profile passes. The failure
case also reports its unconsumed mock at teardown because the absent port cannot
consume it. The exact repaired target passes **six of six**.

The three App cases pass absence, no eager call, explicit-over-session precedence
and independent ownership. Packed public declarations retain the readonly App
field and session injection while rejecting a renderer `step` command.

## Complete source qualification

Frozen `34650276261fc34c98725d9b25be82f25587f36f` passes 3 App, 6 hosted, all
1,628 API and 79 Web cases, strict API/Web checks and build/publint/public
contracts. API archive `c91a8d15f4af9cb3ac7f8f7dee75553adc31bc0e70fa7fc77049ddbf315782a6`
is recorded separately from broader source/consumer acceptance.

Frozen full `50bcc5314edd85a87690c2ce983e55e023d0d557` over combined `790306bb`
passes all **507 Rust**, **2,304 package** and **261 cold catalog** cases; all
strict checks, production builds and static Storybook; and all **22 browser**
cases (1 selected native metadata, 8 ordinary Rust hosted, 1 Node and 12 offline
Web). Existing asset-dependent native ignores and the frozen Deno skip remain.
The API/Web product tree matches the earlier packed candidate exactly.

Producer Plugins `214917c849e7e9440bd6792d480677c745db6873` qualifies its shared
observer/validators with 1,101 package and 285 cold catalog cases. Its npm archive
`0fa89766e6501c7d868772e2da4617598b31c13d385d5942d5448f858ae534f0` is included in
the full Notes cohort. Producer audit/CSV/OIDC-lock exceptions and its failed
aggregate remain in its separate source record; no assertions or audit rules
were weakened.

The full Notes run ends at six missing mapped-chapter confirmations in
spec-first. They concern the shared App field, without a product failure. The
repair adds explicit unchanged-contract notes for AppDatabase, plugin ownership,
Markdown, server hosting, workspace lifecycle and Problems, then rebases onto
committed native intake `8bd2f3d83026c200958d1013d3a600698f0af861` for final
canonical validation. The final frozen `e4f770ca528c66d47351e9da056f3f29fde9d2df`
passes all ten canonical lanes and all 78 governance regressions: six mapped
chapter failures become zero. No runtime input changed after functional
qualification.

## Failed tooling attempts retained

Remote Docker intermittently refused SSH during creation, source transfer,
start and collection until its shared SSH master was reconstructed. The original
frozen baseline completed on explicit retry; incomplete transfers ran no tests.
An attempted container resume used a local path against the remote daemon, then
restarted the original setup entry and failed because its isolated repository
already existed. The corrected stdin transfer resumes that same frozen tree.

The first owner script omitted workspace/app-profile/file-explorer prerequisite
builds and Web check reported ten missing-module/cascaded typing errors. Building
the existing prerequisites yields zero errors/warnings and all 79 Web cases.
Its frontend-only specification attempt lacked native sibling snapshots; the
complete run above uses those snapshots. Failed reports remain failed; no native
fallback was used.

## Remaining adoption and visible backlog

The current Rust minimal profile does not mount the existing Repository plugin
or provide its admitted reader. The preserved hosted-services branch supplies
reusable factory, lifetime and native reader implementations. The next slice
adapts those directly to the admitted shared core and existing screen.

Repository read/search/blame and passive/cold indexing acceptance are separate
from legacy `HistoryPlugin` AppDatabase capture, guarded restore and original
repository source parity. R3.1.3 qualifies storage only; the visible waiting
R3 History child below retains the remaining capture/writer/adoption work under
LN-CORE-003/006/008 and the saved H03 intake. No replacement screen, fake saved
navigation or new history engine is permitted. R3, defaults, release floors,
publication and installed-app replacement remain open.
