# Owned notice projection

LN-WS-096 source component. Cold native dirty-delete acceptance revealed that
FileManager now prevents deletion, but its existing Notice is invisible: the
workspace forwards only progress. API now subscribes to its owning App's notice
events and delegates to Design Core's existing notification manager. Identity,
title, message, severity and source are preserved. Host disposal removes that
subscription. Explorer supplies its explicit App when constructing Notice.
No replacement presentation or native notification permission is introduced.

## Exact and affected evidence

`pnpm --filter @lapis-notes/api exec vitest run
src/lib/__tests__/workspace.test.ts -t 'owned Lapis notices|retires notice delivery'`
first reports two failures: the actual projection is missing, and the new
cleanup fixture omitted the language-service disposer already supplied by the
existing disposal story. Give only that case the same fixture disposer. The
exact command then passes both cases; no shared fixture or assertion is relaxed.

The complete affected command is:

```sh
pnpm --filter @lapis-notes/api exec vitest run \
  src/lib/__tests__/workspace.test.ts \
  src/lib/__tests__/notifications.test.ts \
  src/lib/__tests__/file-manager-trash.test.ts
```

All 135 cases pass in three files, including the whole existing workspace host
suite, progress and silent progress, notification service and deletion guard.
File Explorer retains all 28 package cases. Both API and Explorer strict package
checks and public builds pass; API's build includes publint and built types.
Specification and App ownership audits retain normal rules.

Node 26.9.0, pnpm 10.34.5, Vitest 4.1.11, macOS ARM64. Consumer acceptance is
recorded in Desktop E-TRASH-001 after installing fresh verified archives.

## Scope and remaining lanes

This projects existing in-application notices. M7 native OS notifications,
clipboard, native menus/application delivery and original gates remain open.
Run full Notes, Storybook/accessibility, web and Desktop qualification after M7
implementation under the session-only deferral. Deno host source, signing,
publication, visual baselines and ordinary review profiles are unchanged.
