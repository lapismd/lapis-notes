# Shared retained file-conflict review

Base: immutable Notes `6e76be48`, without changing qualified hosted Tasks commit
`85fcb0ee`. This addresses the existing R7 hosted-presentation parity gap.
Native claim recovery and captured file-text resolution retain separate authority.

Desktop's five existing feature files are copied and adapted into Workspace's
`file-conflicts` feature. The shared shell and an optional early host lease
reference-count one App-owned binding; live disabled predicates combine. The
view ID `desktop:file-conflict`, owner `desktop:file-conflicts`, opaque URI,
MergeEditor, captured writer actions and layout-only review closure are retained.
No alternate writer, native API, browser global or host-specific screen is added.

Exact source command:

```sh
pnpm --filter @lapis-notes/workspace exec vitest run src/lib/file-conflicts/binding.test.ts
```

Before snapshot `bc1e77d9`, receipt `56091bac`, records **four failures/zero
passes**: the public Workspace binding is absent. The first controller dispatch
stops before any worker because its private request lacks cache fields; the
corrected request uses the retained fingerprinted transfer and four-worker guard.

Focused qualification includes the complete Workspace package, new real-shell
stale-writer/edit/save and close/reopen stories, existing native Editing Recovery
stories and the App-ownership audit. Root owns the one combined broad source
qualification; final Desktop and hosted intake remain separately recorded.
Visual paths are declared `visual-pending`; no baseline is created or approved.

Focused receipt `b3c2b6f5` passes **all four exact cases**, then reports three
TypeScript import-extension errors because Desktop permits explicit `.ts`
imports while the Workspace package uses extensionless imports. The copied
imports are adapted to the destination convention; no contract or assertion
changes. Remaining package/browser gates had not started in that attempt.

Rerun `5ccb910d` passes strict Workspace checks and 36 package assertions,
but its unit fixture returns the controller rather than the public binding's
`{ controller }` shape. The registry catches four subscriber errors; those
assertion counts are not clean qualification. The fixture now returns the
correct shape and asserts the actual Show Problems call. Production code and
writer authority are unchanged. Real-shell checks continue independently in
that frozen attempt before the corrected focused rerun.

The frozen real-shell attempt reports two new-story failures and one unexecuted
Editing Recovery file. The fixture targeted a contenteditable node instead of MergeEditor's
existing editable textarea and requested a renamed side-action label;
the retained public component exposes `Accept All Incoming Changes from Left`.
The following attempt calibrates those public controls without changing production UI.
Separately, first loading four newly shared icons triggers a Vite optimizer
reload and invalidates the existing file import. They are added to the existing
eager dependency list; neither browser nor assertion/reload guards are weakened.


Receipt `7fe298d1` passes the corrected four exact cases, all 36 Workspace
cases, strict/public build and App ownership without the prior subscriber
errors. Both existing native Editing Recovery stories pass cold, with no
optimizer reload. Both new plays still fail because the accessible name
`Edit Merged version` belongs to the existing editable textarea, not a button.
They now target that public textbox and read its value, without changing the UI.

Read-only coordinator review additionally identifies a disposed-opener race.
Two exact cases freeze a pending setViewState/revealLeaf, release the final
binding, then finish the pending work. Active checks after those asynchronous
boundaries prevent later selection, reveal or layout publication. Captured
writer operations remain unchanged and are not cancelled or replayed.


The new disposed-opener before receipt `82661eb9`, frozen `26651629`,
reproduces **two failures/four passes**: the delayed setViewState continuation
selects/reveals after final release, and the delayed reveal publishes layout.
The new active checks now fence both continuations. The following focused run
retains those exact assertions and all package/cold real-shell targets.
