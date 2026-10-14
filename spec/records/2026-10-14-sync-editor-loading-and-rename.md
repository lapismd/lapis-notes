# Guarded editor loading and managed rename

This slice implements LN-ARCH-137 through LN-ARCH-139. It remains one part of
the complete Deno-first Lapis Sync objective; it does not select production
apply protection or activate application synchronization.

`Editor.loadDocument()` registers the target session before asynchronous reads,
protects typing, and drains captured drafts from the original persistence
contexts. Target guards and registry flush wait for publication or cancellation.
File, buffer and editor extensions publish through one protected synchronous
boundary. A failed read/save/publisher preserves the original document.

A newer load cancels an obsolete publication without waiting for its reader.
Unload/destruction also cancel it; late read rejection remains observed.
Protected replacement admission preserves an existing pending load. Changed
editor/view App or target path rejects publication, and a synchronous publisher
that cancels its own load rolls back rather than leaving an unregistered target.
Public declarations and the persistent pack-type fixture cover both new methods.

`FileManager.renameFile()` protects and flushes the entire editing-session
registry before moving a file/folder or collecting/applying link replacements.
This covers descendant drafts and independent source editors. Failed saves,
changed source paths and failed filesystem movement release protection and
report failure. It does not turn low-level `Vault.rename()` into an editing guard.

## Exact regressions and evidence

The original loading boundary fails four cases: obsolete read publication,
typing through the previous file during loading, target mutation before load
completion, and replacing a binding whose draft cannot persist. The original
managed rename fails two cases: recreating the old filename from pending drafts
and allowing movement despite failed persistence. Both exact targets pass after
the change.

Expanded cancellation/ownership checking finds two further failures among
14 loading cases: changed view ownership and synchronous publisher cancellation.
Both become passes with unchanged assertions. The original expanded loading
qualification also finds one existing FileManager fixture without a registry
and two deferred-read fixtures that reject before their readers start. Adding
the actual registry and waiting for reader invocation repairs the fixtures;
their product assertions remain unchanged.

The final focused three-file command passes 29 cases: 15 loading, six rename
and eight existing FileManager cases. Rename coverage includes folder descendants,
protected link collection/rewrite, changed-source refusal and filesystem failure.
The new real-App `Sync Document Loading And Rename` story passes interaction
and accessibility; the complete editor-demo family passes all 18 cases.
Its rendered Show Code is manually expanded in the built Docs page and confirms
public bootstrap, vault seed, plugin loading, layout restoration and disposal. The independent baseline remains
`visual-pending`; no PNG is captured or approved.

Root check/test/build pass with 18/18/10 successful tasks. All 957 API tests
pass, as do native services (98), desktop (281 plus its existing integration
skip), server (28), Web (55) and workspace (23). Specification, App ownership,
public declarations, package/release policy and tooling gates pass. The initial
spec-first catalog failure is repaired with its mapped canonical chapter.
The audit remains 8 low, 39 moderate, 31 high and three critical findings;
no dependency ranges, committed lockfiles or advisory exceptions change.

All 247 host interaction/accessibility stories pass in four fresh Chromium
shards (88, 65, 40 and 54). Static Storybook renders all 172 specification
chapters; six static navigation/accessibility tests pass with the two existing
live-watching cases skipped in the static lane.

The packed original Nostr consumer passes strict public declaration acceptance,
source checks, 116 unit cases with its existing integration skip, build/publint,
58 cold interaction/accessibility stories, static build and specification gates.
Six installed runtime/declaration files match the qualified build. The new pack
includes the save helper and excludes the executable loading/rename fixtures.
A final read-failure case independently verifies preserved original content,
drained target admission and removal of the failed provisional registration;
its exact target and the complete API suite pass without a product-code change.

## Remaining integration boundaries

Workspace navigation can still emit an obsolete `file-open` event after an
older request's suppressed read. Multi-view/folder rename rebinding, independent
Mira sessions and external domain writers remain required. Complete scoped host
flush, App shutdown, composed native/legacy guards and old/new writer exclusivity
must pass before production apply is enabled.

The full objective still includes actual client actions and automatic/offline
checkpoints, durable Deno event/object routes and query filtering, independent
protected server enrollment/keys, continuous server participation, managed and
external capture, origin suppression, integrated merge/restore/recovery, remaining
fault/security and real multi-device/platform/consumer acceptance, main landing
and temporary-workspace cleanup. The separate broader plugin catalog limitation
remains unresolved. Existing Nostr signed records and encryption stay unchanged.

## Reproduction

```sh
pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/editor-document-loading.test.ts
pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/editor-rename-persistence.test.ts
pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/editor-document-loading.test.ts src/lib/__tests__/editor-rename-persistence.test.ts src/lib/__tests__/file-manager.test.ts
pnpm exec vitest run --project storybook stories/workspace/lapis-editor-demo/LapisEditorDemo.stories.ts -t 'Sync Document Loading And Rename'
pnpm exec vitest run --project storybook stories/workspace/lapis-editor-demo/LapisEditorDemo.stories.ts
pnpm check
pnpm test
pnpm build
pnpm packages:check
pnpm spec:check
pnpm test:storybook
pnpm build-storybook
```

Ignored logs use `.release/sync-editor-loading-*`. The API pack is
`.release/sync-editor-loading-validation/api.tgz`; the independent original
Nostr consumer remains `.release/sync-native-validation/nostr-api-consumer`.
Its ignored packed API/Mira/Workspace overrides do not establish registry-only
installation acceptance. Committed dependency manifests and locks are preserved.
