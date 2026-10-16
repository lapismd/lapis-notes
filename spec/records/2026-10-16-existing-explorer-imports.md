# Existing Explorer attachment import

LN-EXP-010/011/012 connect Design Core's existing external-file drop callback to
FileManager new-file intent. No replacement screen, input widget or native
permission is added. Admission starts before asynchronous File byte reads and
remains active through source-owned creation/tree projection. Supporting native
hosts use their exclusive port; destination collisions never retry as overwrite.

Validate every supplied filename and declared size before reading any file.
Process complete buffers sequentially, with the same 64 MiB file bound as the
native host. Invalid dot/parent/separator/NUL names reject. Empty drops do not
write. Existing withNotice reports import errors through the explicitly owned
App. A failed file stops the batch; already completed files remain, rather than
claiming a transactional multi-file import.

## Source evidence

The initial Node-only test imported the whole renderer API unnecessarily and
failed collection on a dependency JSON import attribute. Narrow the unit fixture
to its typed public input ports; no production runtime or package resolution is
modified. The next collection fails because the private import helper does not
exist. After implementation, all five initial cases pass. Add sequential
read/create coverage; the final exact file passes six cases.

```sh
pnpm --filter @lapis-notes/file-explorer exec vitest run src/lib/explorer-imports.test.ts
pnpm --filter @lapis-notes/file-explorer test
pnpm --filter @lapis-notes/file-explorer check
```

The complete Explorer suite passes 37 cases in nine files. Strict package check
reports zero Svelte errors and warnings. The input-port fixture proves admission
and returned-promise duration without pretending to re-test the real API
registry, whose operation/leave contract has its own source evidence.

## Consumer qualification and remaining work

Before refresh, two actual Tauri cases fail: dropping a File through the existing
component does not create bytes and a failed import has no error notice. Refresh
the public Explorer archive and repeat those exact native scenarios, including
binary collision preservation, permission failure/retry, immediate close,
attachment rendering and cold restart. Browser File/DataTransfer dispatch is
recorded separately from a physical operating-system drag gesture.

End-of-M7 full source, Storybook/axe, web and Desktop lanes remain pending under
the active session policy. The frozen Deno host is unchanged. Publishing,
signing, ordinary review profiles and visual baselines remain untouched.

Initial spec-first reports four missing mapped chapter groups: architecture, editor demo, packages and plugin lifecycle. Update the actual import ownership at each required boundary; preserve all mappings.

Normal public build/publint, changed-file formatting, App-ownership audit,
spec-first and canonical validation pass. Validation retains 172 chapters and
now covers 1,475 requirements. Node 26.9.0, pnpm 10.34.5, Vitest 4.1.11,
macOS ARM64. Logs remain in ignored `.local/m5-import`.
