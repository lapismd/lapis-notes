# Editor document persistence and protection

API editors now register each original App/file/persistence context with
`App.fileEditingSessions`. Save state is independent across documents while
actual writes remain serialized. Rebinding drains the old debounce into its
original context; subsequent documents cannot replace that payload or clear
its failed-save state. Retired dirty contexts stay registered until successful
persistence, including contexts whose views have been destroyed.

`Editor.protect()` blocks ordinary CodeMirror document transactions, public
resets, explicit persistence and rebinding before yielding. Native readonly and
editable facets survive extension reconfiguration, independent leases release
idempotently, and inline title editing observes the same state. Controlled
clean file refresh uses the private synchronization annotation and does not
queue another write.

`setExternalPersistenceWriter()` captures an explicit asynchronous owner. Each
snapshot keeps its original writer, App, file and content; saved data is
acknowledged only after that owner resolves. Failures retain the buffer and are
retryable. Notification-only legacy external editing stays available outside
protected admission, but unverified queued sessions retain their barrier even
after retirement; protection refuses an external context without an owner.

Synchronous `destroy()` stops editing and begins draining snapshots, and the
new awaitable `dispose()` reports persistence failure. Both old and current
contexts can be explicitly retried after destruction without notifying another
surface. `TextFileView.save()` now persists its current Editor buffer through
that same owner and protection boundary; it no longer writes cached view data
in parallel. Clearing after save applies only to the captured file binding.

## Exact regressions

The original editor fails all three document-lifetime targets: old failure
retry after another document saves, destroy before debounce, and two queued
files before either timer fires. The unchanged three assertions are rerun
against the original parent implementation, including an explicit second-file
save before retry, and again fail three cases. The implemented version passes
those exact targets.

The intermediate implementation finds four existing persistence regressions
because a plain file becomes a Svelte state proxy with a different identity.
Using raw file state preserves the original supplied handle; all four exact
existing cases pass again without changing their assertions.

The TextFileView save target initially writes stale cached data. Routing its
save through the current editor repairs that one failure and the same case
proves protected save rejection. Final document-lifetime qualification passes
14 cases. The adjacent four-file family passes 56 cases, covering existing
persistence, registry admission and workspace discovery.

The real `workspace-lapis-editor-demo--sync-protected-editor` story passes
interaction and accessibility. It verifies a saved draft, readonly content and
title, rejected typing/reset, protected extension reconfiguration, controlled
incoming refresh and resumed editing. Its declared independent baseline stays
`visual-pending`; no capture or approval is performed.

## Qualification

Root check, test and build pass with 18, 18 and 10 tasks. The API suite passes
936 cases, including the original 922 cases. Native services pass 98 cases,
desktop 281 with its existing integration skip, server 28, Web 55 and workspace 23. Emitted public declaration acceptance covers the new writer, protection,
awaitable disposal and state getters through the existing required pack-type
fixture. Builds and API publint pass.

The complete cold host catalog passes 246 interaction/accessibility cases in
four fresh browser shards (87, 65, 40 and 54). Its affected editor family passes
all 17 cases. The owning static build renders all 172 specification chapters.

The packed API passes the original Nostr consumer's strict public type fixture,
full source checks, 116 unit cases with its existing integration skip, build
and publint, 58 cold interaction/accessibility stories, static build and
specification/ownership checks. Six installed runtime/declaration files match
the verified public output. The package includes the private save helper while
excluding its executable regression test. The ignored Workspace/Mira validation
overrides remain; this is not registry-only installation evidence.
The fresh host audit remains the previously recorded 8 low, 39 moderate,
31 high and 3 critical findings. No dependency range, lock or exception changes.

## Completion boundary

This qualifies API editor context registration, persistence and protection.
It does not activate production Sync apply. Full file/view loading and rename
coordination, independent Mira adapter registration, external domain writer
coverage, the scoped host flush port and application shutdown wiring remain
required before guard selection. The native incoming path and legacy vault
mutation path still need composed App protection and exclusive writer ownership.

The original Deno-first objective remains: live client actions/checkpointing and
reconnect, durable Deno event/object APIs and query filtering, independent
protected server enrollment and continuous participation, managed/external
capture and origin suppression, integrated merge/restore/recovery, remaining
fault/security/multi-device/consumer/platform qualification, main landing and
workspace cleanup. The wider 195-pass/29-failure plugin catalog limitation
remains separate and unresolved. Signed Nostr/encryption formats are unchanged.

## Reproduction

```sh
pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/editor-document-lifetime.test.ts
pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/editor-document-lifetime.test.ts -t 'Editor document lifetime'
pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/editor-document-lifetime.test.ts -t 'routes TextFileView saves'
pnpm exec vitest run --project storybook stories/workspace/lapis-editor-demo/LapisEditorDemo.stories.ts -t 'Sync Protected Editor'
pnpm check
pnpm test
pnpm build
pnpm spec:check
pnpm test:storybook
pnpm build-storybook
```

Ignored evidence is `.release/sync-editor-binding-*`. The API pack is
`.release/sync-editor-binding-validation/api.tgz`; the existing original Nostr
consumer remains `.release/sync-native-validation/nostr-api-consumer`, using
ignored validation overrides rather than registry-only dependency acceptance.
