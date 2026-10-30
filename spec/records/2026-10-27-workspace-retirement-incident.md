# Historical workspace-retirement incident

Retained from the 2026-10-27 migration handoff. This is incident evidence, not
a workspace register or current work schedule. Paths/revisions describe that
audit; no workspaces are changed by specification consolidation.

## Incident record: `.workspaces` destruction (unrecoverable)

During the retirement sweep a plugins-side cleanup ran a bare
`rm -rf .workspaces` while the shared directory still held other repositories'
checkouts. Tracked content was safe (snapshotted in jj stores; zero abandons),
but ignored evidence was destroyed before preservation:

- Desktop: E-CORE-045 native receipt payloads
  (`desktop-native-queue-provider-20261027/.local`, 17G) and the private
  `native-build.mjs`/`mac-rust.mjs`/`bootstrap-native.mjs` helpers — the
  E-CORE-045 command lineage is unreproducible; future provider/native proofs
  must generate fresh receipts. `E-CORE-045.md` committed evidence and main
  `.local/qualification/r7-cohort/` (4 receipts + 33 archives covering all
  E-CORE-046 identities) are intact.
- Notes: ~70GB of `.local` receipt bulk across the 57 `.workspaces`-hosted
  workspaces (sizes itemized in the manifest). Final worker receipts,
  `.local/server-container/`, `.local/r7-provider-final/macos-20261027/`,
  `.local/r7-cutover/` and `.local/search-models/` in main are intact.
- Plugins: native-search-adapter `.local` (~906MB). 6,808 files (~1.0GB) were
  preserved before deletion, incl. the desktop-migration `.release` payload
  tree and all 13 static-ci `.lapis-plugin` bundles.

Lesson (now register policy): retirement sweeps never delete a shared parent
directory while sibling agents run; preservation precedes every deletion.
