# Preserve the latest main tracker during file icon adoption

The enclosing merge combines qualified icon intake `296578c0` with subsequent
main checkpoint `0a4550235b65748018dc0ea9e6ce6e5537a9cfcc`. The latter changes
only `MIGRATION.md` and `spec/migration-progress.json`. All 103 latest-main task
objects, statuses and details are preserved exactly; only the activity timestamp
is refreshed. Its new Tasks/editor/leave, native/hosted acceptance and remaining
R3 statements stay intact. The superseded planned-icons paragraph is replaced
with the qualified source/consumer intake and archive links.

## Qualification boundary

The merge changes no product, test, configuration or package input relative to
`296578c0`. Its complete source, 264-case cold catalog, public archive and both
consumer qualification therefore remain authoritative. Plugins main is
`5b147147`, Desktop main is `f276120b`, and Design Core main is `99fa0952`.
The final canonical/progress/explicit-base spec-first lane is rerun against the
latest main checkpoint before adoption. No Rust, native or distribution task is
promoted. Existing explicitly accepted findings retain their owning records.

## Concurrent-main recovery

Main advances from its original empty working change to checkpoint `0a455023`
while the icon candidate is being finalized. An attempted rebase mistakenly
uses the old working-change identity, creating tracker conflicts in that commit
and a dependent separate workspace. Exact operation `be122384d1a2` is reverted
with `jj op revert`, preserving the intervening independent operation. Main is
restored to `0a455023` with empty child `1201ec98`; the dependent qualified cohort
is restored exactly to `0ff929b1`. Both are conflict-free. The icon intake commit
remains intact. No unrelated commit or workspace is rewritten for final adoption.

This new merge resolves the tracker changes in the isolated intake workspace.
Default adoption checks the live empty working state and latest parent, then
creates a fresh empty child of the verified merge. It does not move the other
task's tracker commit or its dependent workspaces.

Final `LAPIS_NOTES_CHECK_BASE=0a4550235b65748018dc0ea9e6ce6e5537a9cfcc pnpm
spec:check` passes in Docker run `0d596482`, including canonical validation,
mdBook, spec-first, App ownership, all 78 governance cases and the 103-task
progress projection. The diff from qualified icon intake contains only the two
tracker files and this record; all runtime/public package inputs remain equal.
