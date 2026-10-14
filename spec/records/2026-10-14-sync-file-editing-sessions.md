# App-owned file editing-session registry

`App.fileEditingSessions` now supplies a generic public registration boundary for
independent file writers. API imports no Mira session implementation or Sync
protocol types. A session exposes dirty state, asynchronous flush and protection
with an idempotent release. The public hook accepts Mira's portable session
shape, including synchronous release callbacks.

Registrations capture canonical vault-relative paths, deduplicate a session and
retain detached dirty or failed writers until successful persistence. A session
cannot retarget while its old registration is dirty or protected. Path-specific
admission rejects new matching registrations synchronously; pathless recovery
covers every registered file. Independent Apps retain independent registries.

Guards serialize callbacks, acquire every protection before flushing and drain
all saves before mutation. Failure drains every acquired release, including
asynchronous cleanup. Failed releases retain their admission barrier and retry
before another callback can run. Shutdown closes admission immediately, joins
active callbacks and flushes, rejects callbacks still awaiting admission and
permits explicit retry of failed persistence or cleanup. Session methods and
callbacks must not re-enter queued registry operations.

## Exact regression evidence

The initial `file-editing-sessions.test.ts` command fails one suite because the
public module is absent. After implementation, the original admission case
passes. Detached protected-file retargeting and shutdown-during-admission each
fail once before repair, then pass in the unchanged focused suite. The exact
`-t 'waits for every protection acquisition'` target moves from one failure to
zero. Final focused qualification passes 20 cases; the adjacent editor
persistence and workspace flush family passes 42 cases across three files.

The new `workspace-lapis-editor-demo--sync-independent-writer-admission` story
uses a real App, public registry and vault. Its first attempt fails one suite
because its catalog registration is absent; registering the exact governed ID
repairs startup. The exact story passes interaction and accessibility. It
retains `visual-pending` and a declared independent baseline path; no baseline
is captured or approved.

Source Storybook initially passes while built declaration acceptance reports
three TS2339 errors for the missing App property. The handwritten declaration
is corrected. The persistent `test/contracts/file-editing-sessions.ts` fixture
compiles against `dist/index.js` through `pnpm check:pack-types`, now required by
API prepack/build. It verifies registration, generic guarded results, flush and
shutdown through emitted public declarations.

## Wider qualification

Root check passes all 18 tasks. Root test passes all 18 tasks, including 922 API
cases, 98 native-service cases, 281 desktop cases with its existing integration
skip, 28 server cases, 55 Web cases and 23 workspace cases. The original 902 API
cases remain covered. Specification and App-ownership gates pass.

The ARCH verification table reached its size bound after adding three atomic
requirements. Existing rows move into the already-indexed second ARCH table;
a counter comparison proves every original ARCH ID remains exactly once, with
only LN-ARCH-129 through LN-ARCH-131 added. No requirement or prior evidence is
removed, and the navigation retains the existing 172 chapters.

Final root build passes all ten tasks, including the persistent public type
fixture and API publint. The complete cold Storybook lane passes 245
interaction/accessibility cases across four fresh browser shards: 86, 65, 40
and 54. The affected real editor-demo family passes all 16 cases, including
independent writer admission and existing inactive-editor persistence.

The packed API is installed into the existing ignored original Nostr consumer.
Its public editing-session type fixture, full source checks and 116 unit cases
pass with the existing integration skip. Six installed runtime/declaration
files byte-match the verified public build. The npm pack contains the session
runtime and declaration only; its executable regression tests and type fixture
are excluded. This remains temporary tarball/peer validation, not registry-only
installation evidence. The consumer also passes build/publint, 58 cold interaction/accessibility
stories, static Storybook build and specification/ownership checks. The owning
host static build renders all 172 specification chapters. Package/release
checks pass, including all 70 release-tooling cases.

The fresh audit remains 8 low, 39 moderate, 31 high and 3 critical; no advisory
exception or dependency range changes.

## Completion boundary

This is the App-owned registry contract, not complete production apply safety.
API editors, Mira's Lapis adapter, asynchronous external persistence owners and
file/view switching/closing must still register and obey protection. Application
teardown must connect the registry's explicit shutdown at the complete writer
lifetime boundary. Default Sync apply remains disconnected; a caller must not
select this registry as the production guard with unregistered writers.

Exclusive legacy/new writer ownership, client actions/checkpoint/reconnect,
Deno durable signed events and encrypted objects, independent server enrollment
and continuous participation, managed/external capture and origin suppression,
merge/restore and recovery, remaining fault/security/multi-device/platform and
registry-only qualification, landing and workspace cleanup remain in the saved
plan. The recorded wider plugin catalog limit of 195 passing and 29 failing
cases remains separate and unresolved. Encryption formats, Nostr events and
query semantics are unchanged.

## Reproduction commands

Run in the owning host workspace:

```sh
pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/file-editing-sessions.test.ts
pnpm --filter @lapis-notes/api check:pack-types
pnpm exec vitest run --project storybook stories/workspace/lapis-editor-demo/LapisEditorDemo.stories.ts -t 'Sync Independent Writer Admission'
pnpm check
pnpm test
pnpm build
pnpm spec:check
pnpm test:storybook
pnpm build-storybook
```

Ignored logs are `.release/sync-sessions-*`; the public archive is
`.release/sync-sessions-validation/api.tgz`. The installed consumer is
`.release/sync-native-validation/nostr-api-consumer`. Its local override retains
the previously qualified Mira and Workspace tarballs; source manifests and
committed locks keep their registry ranges.
