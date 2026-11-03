# Same-leaf active-file fallback

Desktop native workspace acceptance exposed a source-owned API race while a
document leaf opened a second file and a metadata panel became active. The
document correctly loaded the second file, but `Workspace.getActiveFile()`
fell back to the first file. Metadata panels therefore continued to query the
stale file even though the editor displayed the new file.

`Workspace` now commits each successful `file-open` file to its active-file
fallback before later event subscribers run. This preserves the panel as the
active leaf while allowing active-file consumers to follow the file that the
document leaf finished opening.

## Evidence

- Exact regression before the fix: `retains a same-leaf file open when a panel
activates before it completes` failed 0/1; `getActiveFile()` returned
  `Notes/First.md` instead of `Notes/Second.md`.
- Exact regression after the fix: 1/1 passed.
- `@lapis-notes/api` check, 1,744-test package suite, public build, Publint and
  packed type contract passed.
- Native root check, root test and root build passed across all workspace
  packages. The first root check was interrupted by a transient Deno npm-cache
  body-read failure; the affected Deno host check then passed 90/90 before the
  complete native root check was repeated successfully.
- Cold focused Storybook interaction runs passed File Conflicts 3/3 and All
  Properties 6/6. A complete portable run passed shards 1–3 (218/218) and all
  55 executed shard-4 assertions before the browser connection closed ahead of
  Link Preview Acceptance. A native shard-4 retry passed 51 assertions before
  separate dynamic-import/iframe disconnects; the three interrupted story
  files then passed together 5/5. These runner disconnects are retained as
  incomplete full-lane evidence and are not represented as product failures or
  as a complete Storybook pass.

The Desktop native metadata scenario remains the consumer qualification
boundary. This source receipt does not substitute for that macOS run or for a
released registry package consumed by Desktop.
