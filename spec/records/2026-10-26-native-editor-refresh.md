# Protected native editor saved-text refresh — 2026-10-26

The actual two-App hosted editor/Tasks journey completes native mutation and
preserves the user's draft, but its final ordinary close refuses with
`Saved editor content changed: Hosted.md`. The tab and buffer remain mounted;
this is a stale producer-baseline refusal rather than a native close deadlock.

Hosted receipts `6bcccbe5`, trace-only `4ad4be4f` and uninstrumented `0e5b974b`
retain the failure. The trace confirms settled operations and layout, five
protected writers and failure during the note's native saved-text comparison.
There is no second Yield command, Editor destruction or native retirement.

## Exact owner regression

```sh
pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/native-editing-registry.test.ts -t 'closes a real editor'
```

Before: **0 passed / 1 failed**, source `6eee8d28`, receipt
`2c2b0ae0-08dd-412b-aa1d-26afdcfa4b3e`. The actual API Editor reproduces the
same `ECONFLICT` on clean close after native saved bytes change inside its guard.
An initial protected-refresh prototype passes **1/1**, receipt
`6178bed2-dde1-4519-9024-54949eb13867`.

The final race-safe boundary passes **23/23** in receipt
`5e93c6f8-2784-4535-b9d2-1f7ac99320b2`, source `517ad6f9`: all 18 existing
registry/actual-producer cases plus five new protected refresh cases. It reads
only after confirmed native rearm, retains failed refresh protection for explicit
retry without replay, refuses unrelated saved mismatches and dirty persistence,
and preserves expected absence through ordinary retirement.

Owner receipt `56ea7368-1502-4f43-b50a-04908d612c04`, source `1c10db6d`, passes
**28 native/state cases**, **118 affected persistence cases**, **1,686 API cases**,
strict checks, public build/declarations, App ownership and public pack. API
archive SHA-256 is
`adbfcacf7827d52faf305d16ee0952d417fe9d9b2ced4a90a2faabc287b9d963`.

Actual hosted receipt `93b38546-d280-4ace-a2e4-583d5020af39`, source `6857f317`
over independent duplicate `f92f4a0e` of `1c10db6d`, passes **1/1**. It preserves
foreign dirty rejection, protected native completion, the retained draft and
same-identity rearm; the real close removes the tab/editor and native claims.
Runtime/Svelte diagnostics and native clean shutdown pass as well.

The final implementation resumes the native fence before observing authoritative
bytes, keeps local input protected and retains failed-refresh state for retry.
Expected absence remains null; dirty persistence and unrelated external changes
keep their original barriers. Markdown's public protected-text binding and the
complete coherent source cohort remain under qualification. No content mutation is replayed.

CORE028 source, both actual hosts and final R3 completion retain separate gates.
Temporary trace-only instrumentation is removed and will not land. Publication,
app signing, installed-app replacement and default cutover remain deferred.
