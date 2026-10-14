# Sync editor persistence barrier

API editors now serialize debounced and explicit persistence, retain their
queue-time application/file/mode, and expose dirty state until saves finish.
Flush joins in-flight work and drains subsequent queued changes. Failed saves
retain the buffer, reject flushing and permit a later explicit retry. Extension
reconfiguration preserves pending persistence.

File refresh rejects stale reads after a buffer, document, application or save
generation changes. Unsaved text survives external file-change notifications;
clean buffers still refresh. Read failures remain observable without an
unhandled rejection. Tracking retains its original application and removes
that application's subscriptions even if the editor is rebound.

The App Sync flush visits every workspace leaf, including inactive, docked,
grouped and floating API editors. It deduplicates shared instances, matches an
optional path, rejects changed bindings and drains every captured flush before
returning a persistence error. Independent Mira writers are outside this API
editor slice and require their own public registration/protection integration.

Mutation input streams now enter the scoped runtime before apply admission.
Missing/rejected guards cancel owned input and await cancellation before
rejection. Revocation joins admission-time cleanup before key-custody teardown;
successful provider work also closes its stream before releasing the guard.

## Exact regression evidence

- `editor-persistence.test.ts`: serialized persistence, queue-time destination,
  extension reconfiguration, failed-save retry, notification ordering, dirty
  refresh, stale/out-of-order reads and disposed/changed-owner subscriptions.
- `sync-editor-flush.test.ts`: all leaves, requested paths, shared-instance
  deduplication, changed bindings, absent editors and failure-time drain.
- `sync-host-local-provider.test.ts`: rejected apply admission, source ownership
  and cancellation before revocation completes.
- `workspace-lapis-editor-demo--sync-editor-persistence`: real App and public
  scoped host flush an inactive file and preserve a later unsaved draft through
  refresh. The original active-only callback fails this exact browser target;
  the workspace-wide callback passes.

The complete three-file focused command passes 43 cases. The added
failure-time drain target moves from one failure to zero, and the changed-owner
file-event target moves from one failure to zero. Each exact target was rerun
after its source fix. The 15-story editor family passes against the initial
persistence implementation; final full-browser qualification follows below.

## Wider qualification

Final `pnpm check`, `pnpm test` and `pnpm build` pass with 18, 18 and 10
successful tasks. API passes 902 tests, native services 98, desktop 281 with its
existing integration skip, server 28, Web 55 and workspace 23. Fresh
`pnpm test:storybook` passes all 244 interaction/accessibility stories across
four cold browser shards.

The rebuilt API pack passes its public build and publint. The original Nostr
plugin uses that tarball only through its ignored validation setup. Its full
checks, 116 tests with the existing integration skip, build/publint, 58 fresh
interaction/accessibility stories and static Storybook build pass. Source
manifests and committed lockfiles retain their existing registry ranges.

Final `pnpm spec:check` and the owning host static Storybook build pass; the
static index includes all 172 specification chapters. The new story retains
`visual-pending` and an independent declared baseline path. No visual baseline
was created or approved.

## Completion boundary

This qualifies API persistence/refresh and workspace discovery. It does not
activate production Sync apply. Independent Mira sessions, asynchronous external
persistence owners, editing protection during an apply, file/view switching and
closing, and exclusive old/new Sync writer ownership remain separate required
integration work. Deno destination APIs, server keys and continuous server
participation, client scheduling/reconnect, integrated merge/restore and the
remaining full-plan acceptance/landing/cleanup are still outstanding.

Committed npm ranges and lockfiles remain unchanged. The fresh dependency audit
reports the same host findings: 8 low, 39 moderate, 31 high and 3 critical. No
versions, ignore rules or visual baselines are changed by this slice.
