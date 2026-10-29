# Problems quick-fix persistence

Date: 2026-10-24. Source repair exposed by projection-reference qualification.
No native service or database adoption is claimed by this record.

The full Storybook lane stopped after 93 passing assertions with one unhandled
`ECONFLICT` for `Notes/Spelling.md`. A cold exact run of Markdown Spellcheck and
Markdown Lint Loft Boarding reproduced it: two passed, one unhandled rejection.
Adding a save-drain and vault-content assertion to Spellcheck turns that hidden
failure into one failed story (the other passes), retaining the unhandled error.

The App-owned Problems quick-fix path dispatched a CodeMirror edit and then
called `vault.modify` directly. The editor's existing queued conditional write
then saw a changed baseline. Open-resource fixes now drain the editor's own
captured save queue; they no longer introduce that competing writer. Closed-file
edits and serializable provider commands retain their existing paths.

The exact cold rerun passes both stories with zero unhandled errors. Spellcheck
now proves the corrected text reaches the vault and no conflict remains.

Exact command: `pnpm exec vitest run --project storybook
stories/workspace/lapis-editor-demo/LapisEditorDemo.stories.ts -t
'Markdown Spellcheck|Markdown Lint Loft Boarding'`.

Logs: `.local/projection-query-storybook-exact.log`,
`.local/projection-query-spellcheck-{before,after}.log`.

The complete editor family then exposed the same competing-write pattern in the
Problems story's fixture restoration: **18 passed with one unhandled error**
for `Notes/Welcome.md`. A final drain assertion made that an exact failure
(**one failed / one passed, one unhandled error**). Restoration now drains the
editor writer and verifies persisted fixture text. The exact three-story rerun
passes **3/3**, and the cold complete family passes **18/18**, with no unhandled
errors. Assertions and conflict protection were preserved.

Final source qualification passes root build (**11/11**), check/test (**20/20**
each, **1,231 API tests**), specification checks including **38** regressions,
and the complete four-shard interaction/accessibility lane (**261/261**).
The first specification rerun reported three missing mapped ownership chapters;
the plugin, Markdown and shell chapters now document the existing writer path.

Logs: `.local/projection-query-problems-restore-{before,after}.log`,
`.local/projection-query-editor-family{,-final}.log`, and
`.local/projection-reference-{build,check,test,storybook}-final.log`.
Native consumer adoption remains separate. Visual baselines remain unchanged.
