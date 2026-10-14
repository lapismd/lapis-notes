# Native Sync data bridge

The desktop's admitted Sync security session now also supplies bounded file,
ciphertext and sealed-state transfers. Physical profile admission, separate
storage, original operation authority and drained teardown remain host-owned.
This qualifies native data ports; the application still requires editor and
exclusive-writer guards before activating its Sync runtime.

## Behavior

- A database profile captures its root input and physical binding before Sync
  file access. Rebinding rejects; close/worker failure revokes admission.
  Ordinary database startup still supports roots without physical Sync
  admission, including a symlink, while withholding guarded file operations.
- Security/data share one opaque, serialized session. Neither transfer payloads
  nor profile operations can substitute a working root.
- Capture pages normally contain at most 128 descriptors; reads resolve original
  path, identities and generation after capture resources are released.
- File chunks are 256 KiB with a 512 Ki-character frame limit. Multipart writes
  stage outside the working vault through exclusively created read/write handles.
  Length/digest verification prevents altered staged bytes from committing.
- State/mutation/receipt calls require the original vault, device, key epoch and
  membership generation. Multipart commits recheck their initial authority.
  API facades snapshot supplied fences before admission; trusted low-level
  ciphertext repositories retain their existing compatibility contract.
- Duplicate start/chunk/finish calls are idempotent; different bytes, purpose,
  authority, completion parameters or sequence reject. Revocation cancels reads
  and uploads, drains storage, then closes keys. Cleanup failure remains visible
  and blocks another writer.
- Native typed-array base64 methods accelerate binary frames where supported;
  the portable fallback produces identical canonical bytes. No frame, fixture,
  integrity assertion or timeout was reduced.

## Verification

`pnpm --filter @lapis-notes/desktop-deno exec vitest run
src-deno/sync-local-bridge.test.ts src-deno/app-database.test.ts
src-deno/sync-security-bridge.test.ts src/renderer-telemetry.test.ts` passes
43 cases in four files before the additional protocol compatibility case.
The 20-case real-file data family includes a 20 MiB patterned attachment,
lost read/chunk/finish responses, both multipart authority races, staging
tamper/truncation/substitution, replay guards, paged capture, ordinary
prototype-shaped filenames, stale descriptors/root replacement, revocation and
cleanup failure. The malformed-response target moved from three failures to
zero; the symlink-startup regression moved from one failure to zero. A staging
parent redirected into the working vault after inspection initially resolved an
upload incorrectly; its exact regression now rejects before an owned upload body
is created in the vault.

`pnpm --filter @lapis-notes/api exec vitest run
src/lib/__tests__/sync-host-local-provider.test.ts` passes all 18 cases,
including two original-fence forwarding cases. A realm-sensitive byte-array
assertion was corrected to check exact byte contents and all state/fence fields.

The new 20 MiB case initially hit Vitest's unchanged five-second default under
the full desktop lane, including a sequential Turbo run. After optimizing the
binary codec, the standard `pnpm test` passes all 18 tasks, with 17 existing task
results cached; the fresh desktop suite has 280 passes and its existing one
integration skip. The unchanged attachment target completes in 785 ms there.
Native/fallback compatibility and malformed frames remain covered. Final full
qualification after the additional staging-parent regression passes 281 desktop
cases and the same existing integration skip.

`pnpm check`, `pnpm build` and `pnpm spec:check` pass (18 check and 10 build
tasks). A fresh `pnpm test:storybook` passes 243 interaction/accessibility
stories across its four shards. `deno check --frozen --sloppy-imports
src-deno/sync-security.ts` passes from the desktop package.

`desktop-deno/scripts/accept-sync-security.mjs` supports an optional packed
headless-engine path. Separate frozen Deno write/read processes use the real
database worker, production dispatcher, JSON adapter and actual macOS Keychain.
Both raw-data and packed-engine acceptance preserve identity, encrypted objects,
sealed state and guarded working-file receipts across restart, reject direct and
aliased raw-key access and revoke admission after database close. The packed
124-file Sync artifact preserves its exact signed revision/HEAD and object hashes
after process restart without authoring another unchanged-file checkpoint.
Generated credential accounts are removed by the read/failed-run cleanup.

The new packed API passes its public build/publint. The original Nostr consumer,
exported to an ignored standalone JJ validation checkout, passes full checks,
116 tests with its existing integration skip, 58 fresh interaction/accessibility
stories, build/publint and static Storybook build. Its existing temporary Workspace tarball/peer setup
is preserved; this is not registry-only dependency qualification.

`pnpm audit --json` retains 8 low, 39 moderate, 31 high and 3 critical findings.
No dependency version, npm range, committed lock or advisory exception changed.

## Remaining objective

All-editor dirty-buffer protection and legacy/new Sync exclusive ownership,
production client scheduling/actions/reconnect, integrated merge/restore,
Deno event/object APIs and server enrollment/capture/apply remain required.
Full remaining fault/security, real multi-device desktop/server-Web, portable
consumer/release qualification, landing and workspace cleanup remain in the
saved plan. Other-platform custody and registry-only acceptance remain separate
open qualification. This milestone does not activate or complete synchronization.
