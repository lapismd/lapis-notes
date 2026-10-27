# Hosted Properties shared review acceptance

Prepared on the frozen focused shared Workspace review candidate `87ab2c36`.
The original 15 Tasks/editor/leave assertions and configuration are unchanged;
the selected final source/Workspace archive cohort remains a separate gate.

The two actual Rust-hosted browser cases use the retained installed-plugin and
admitted-vault fixture, real filesystem watch/conditional IO, public File
Properties controls and shared Problems/MergeEditor. One holds a focused local
value across an external metadata revision, preserves saved bytes, explicitly
accepts the captured disk side, saves through the retained writer, then edits
again without erasing the external owner key. The other preserves a compatible
body-only save. Both end with normal user logout and strict runtime/Svelte,
plugin-integrity and clean native-shutdown checks.

No App is obtained through browser globals and no conflict/recovery action is
invoked through test instrumentation. The focused config is
`packages/web/playwright.rust-properties.config.ts`; the renderer/native service
must be built with the same staged native cohort before execution.

## Executed qualification (2026-10-28)

Landed above the repairing slice `b3be91da` ("Reconcile drifted clean saved
text before guarded native yield", LN-CORE-028), this lineage is `54d80c86`
(duplicated from preserved `kpymntwz 845842b8` through the prior resolved
duplicate; conflict-free onto current main).

- **Defect reproduction (pre-fix):** 0/2 shutdown-deadline failures on the bare
  main baseline (prior-agent runs 2026-10-27 20:02–20:29 UTC) and on this
  lineage duplicated onto current main (22:04 UTC re-run). Instrumented
  diagnosis showed the journey bodies never completed: the e2e `finally`
  teardown error masked the body failures. A frontmatter commit racing an
  external file change aborted in the mutation guard ("Saved editor content
  changed" — the panel refreshes through the fast native metadata stream while
  the document baseline only refreshed on the 5s directory-watch poll); Mira's
  controller still advanced its record, so the retried commit carried a
  mismatched `previousRecord`, published a spurious conflict and retained a
  dirty+active `TextMutation` intent lease. The server refusal was the fence
  working on a session that never left; reconciled runs drain to `states=[]`
  and shut down cleanly.
- **Repair:** guarded pre-yield saved-text reconciliation of clean interactive
  producers (LN-CORE-028, `NativeRegisteredEditingSession`); unacknowledgeable
  or dirty producers keep the fail-closed handoff fence and observable retry.
- **Results:** both cases pass 2/2 on three consecutive cold runs (28.6s,
  27.8s, 27.6s) with clean native shutdown and the strict runtime/Svelte,
  plugin-integrity teardown assertions green.
- **Exact commands:** `pnpm --filter @lapis-notes/web build:rust-server`, then
  from `packages/web`: `pnpm exec playwright test -c
  playwright.rust-properties.config.ts`. Native service
  `.local/rust-core-target/debug/lapis-server` built from `44f3b41f` (crate
  sources unchanged through `b3be91da`; no Rust rebuild required).
- **Archive identities:** the frozen r3-public-inputs cohort
  (`.local/r3-public-inputs/receipt.json`, 16 checksummed archives including
  the mira candidate `03e15e02…` as `package-7.tgz` and the Tasks plugin as
  `package-15.tgz`); the Tasks artifact is built at run time from the
  installed public package through the ordinary loader.
- **Adjacent lanes:** complete hosted family 11/11; api 1,723/1,723 + api
  check; web package 136/136 + web check; EditingRecovery stories 3/3. Tasks
  family ran 14/15: the `rust-server-tasks-editors` failure reproduces
  identically without the repair and without both 2026-10-27 landings
  (pre-existing main defect, separately owned and reported for user decision;
  not caused by this slice).
