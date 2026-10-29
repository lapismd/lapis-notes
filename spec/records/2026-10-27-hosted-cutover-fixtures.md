# Hosted cutover lifecycle fixtures

Updated: 2026-10-27 13:04:04 UTC. Exact six pass; complete-profile follow-up pending.

## Original boundary

The cold combined native profile at `c7faed1a` / receipt
`fddcadab-01a8-4e3e-9710-7c44d8f99aeb` reports **5 passes and 6 failures**
for `pnpm --filter @lapis-notes/web exec playwright test -c playwright.rust-server.config.ts`.
Its retained `session.log` separates the failures:

- Explorer rename/move/cold layout and Unicode note/trash: two failures at
  shutdown with `Shutdown blocked: resolve retained editor state before retrying`.
- Hosted chooser/archive/restore/cold restart and signed-plugin/cold restart:
  two failures with the same native shutdown guard.
- Participant passive detach and Stop/cold unknown: two restored-selection
  failures. Those require an actual rerun of the product state repair in
  `d2346704`; their original journeys and assertions remain unchanged.

## Fixture correction

`rust-hosted-session.ts` uses the existing guarded application controls: close
Settings when present, open Manage Vaults when needed, select Sign out, and
wait for Username. Manage Vaults alone intentionally retains the application,
so it does not release native editing claims. The native shutdown denial,
deadline and process-exit assertions remain unchanged.

The files fixture now signs out before cold restart and before stopping its
owned runtime. The host fixture signs out before each cold restart and after
each test, preventing one closed browser context from retaining claims in the
shared server used by later cases. Restart journeys sign back in explicitly
before reopening the persisted vault. The isolated signed-plugin runtime also
signs out before its own stop. No direct database/claim cleanup, dropped editor
state, skip, timeout extension or relaxed assertion is added.

## First actual frozen-candidate qualification

Frozen `11921ea3` / receipt `f79c9fbc-9646-4563-af60-e7bce96a37bd` runs the six
original failures cold against the combined native profile: **6 passes, 0
failures**. The directly following complete hosted lane reports **10 passes, 1
failure**. The chooser restart fails the unchanged native shutdown guard only
after the generic login/persistence case has reloaded an open editable note.

The generic case's bare reload destroys its first App before asynchronous
retirement can finish. Its new App owns a different intent. Final Sign out
retires the first principal's old attachment after the current App preflight,
leaving that old interactive intent as a detached shutdown blocker. This
retention is required by LN-CORE-019/021, including for clean interactive
documents; neither saved bytes nor browser disappearance proves retirement.

The generic login/persistence journey now uses guarded Sign out before its page
reload, signs back in, reopens the saved note and retains the original content,
native disk and no-service-worker assertions. It still proves a real browser
reload and persisted edit. It does not claim abrupt lost-editor recovery.
`rust-server-tasks-leave.spec.ts` separately exercises lost-browser claims,
Problems review/discard and guarded retry; its assertions remain unchanged.
Participant passive reload/detach and cold-unknown journeys also remain intact.
No production lifecycle code, native guard, timeout or assertion is weakened.

## Current qualification status

- Changed TypeScript formatting passes after Prettier normalization.
- Playwright collection for the three affected families finds all nine cases;
  collection is not runtime acceptance.
- The six original failures now pass. The new generic fixture correction must
  first rerun the preceding login and failing chooser pair, then the complete
  eleven-case hosted profile. Final broad validation follows the user's
  landed-main order.
- No fixture change is made to passive participant reload/detach or deliberate
  cold-unknown recovery, so the native selected-conversation repair must prove
  those behaviors under their original assertions.

Reports remain under the source workspace's
`.local/validation/runs/lapis-r7-static-guarded-logout-fddcadab-01a8-4e3e-9710-7c44d8f99aeb/`.
The exact-six result does not close R7.6 or waive the complete-profile failure.
