# Internal file mutation and editor projection order

The actual Tauri Explorer moves a clean file and updates the tree, but its open
Source Editor cannot save the next edit. Native diagnostics report `Editor
editing is protected`: App view projection rebinds while FileManager still holds
its mutation guard. This is a source API defect, not a native filesystem or
Explorer presentation defect.

Two new real-Editor integration cases in `vault-changes.test.ts` reproduce the
same failure for rename and move. The exact source run initially reports two
failures and fourteen passes. An intermediate wait-for-guard implementation
passes sixteen cases, and a follow-on mutation regression passes with seventeen.
The final implementation schedules projection in the editing registry's existing
serialized mutation queue. It neither acquires another editing guard nor flushes
dirty external writers. Event snapshots retain their original paths and order;
App retirement still prevents stale delivery.

The public `afterMutations` boundary schedules work after already-admitted
mutations. Guard callbacks may schedule detached event work, but cannot await it
from within their own guard. Projection promises remain tracked for App leave
and native watcher retirement. This preserves existing dirty external recovery
and avoids relaxing editor protection or target-baseline checks.

## Qualification

Focused and affected results are recorded before the source commit. Full source,
Storybook/accessibility, web and Desktop suites remain deferred until M7
implementation, under the active session policy. The frozen Deno host is not
changed. Native consumer verification must refresh the public API archive and
repeat the exact three Explorer scenarios before this slice is accepted.

The final exact service file passes seventeen cases. The affected service, editing registry, rename, trash, editor persistence, text persistence, Vault reconciliation and Workspace lane passes 207 cases in eight files. API strict check passes with zero Svelte errors or warnings.

Initial spec-first reports one missing architecture chapter for the editing registry change. Add the owning editor-integration contract rather than weakening the source map.

Public API build, publint, built type contracts, changed-file formatting,
App-ownership audit, spec-first and canonical validation all pass. Validation
retains 1,472 requirements across 172 chapters. Node 26.9.0, pnpm 10.34.5,
Vitest 4.1.11, macOS ARM64. Logs are retained in ignored
`.local/m5-internal-projection`.
