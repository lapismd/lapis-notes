# Scoped native state ownership — 2026-10-26

The actual two-App hosted Tasks case exposed ordinary config persistence blocked
before any Task Submit. This source repair implements LN-CORE-026 without
changing the native foreign-writer guard or introducing a save path.

## Trigger and original boundary

Hosted receipt `ce5459f2-57c3-4081-a610-9b566341fb0f` (Notes source
`b31722c4` over foundation `d89c0fbe`) shows the first App report config revisions
1–9, then receive BUSY from PUT `.lapis/app.json`. The second App retains clean
active config/plugin/layout intents. Its idle noninteractive ownership therefore
blocks the first App's ordinary save before the recovery scenario begins.

Inspection confirms HTTP `Client::write_from` and text saves already preserve
`Some(self.id)`. There is no new global exemption or HTTP production patch.
The new exact HTTP target proves own conditional saves while preserving foreign
clean/dirty fences against the actual admitted service.

The feature rebases onto qualified main `029e2c22`, including captured native
recovery. It leaves the root-owned Problems/registry facade for its own slice.

## Exact API evidence

```sh
pnpm --filter @lapis-notes/api exec vitest run src/lib/__tests__/native-state-editing.test.ts
```

Before: **0 passed / 3 failed**, frozen `c377a69e`, report
`07cba478-432d-46d7-9d6f-fcf30be1317c`. These reproduce foreign clean-state
blocking, unnecessary idle acquisition and missing lost-idle acknowledgement.
After: **3/3**, then expanded **5/5** in
`2370fd8f-ca02-4d83-a661-f8d1e2b09e14`.

The expanded cases cover two idle Apps, bounded identity reuse, explicit
reconciliation without replaying saved bytes, retained foreign fences and
existing text-conflict recovery, plus passive pending/failed/cleared admission.
The strengthened final five-case run passes in receipt
`23777846-a5ab-4123-ad5a-4de0c30c1e90` on source `f3ff0c66`, using qualified
Markdown `40f8febb` and Mira `c5d1e4b6` public archives.

Owner receipts `c40a9bf8-b0ca-42aa-bc44-7566f454575d` and
`9bf60474-706f-4f54-95fb-cf46526ca3a5` pass all **22 registry/state cases**,
**118 affected persistence cases** and **1,663 API cases**, plus strict checks,
build, public positive/negative declaration tests, App ownership and public pack.
The qualified API archive has SHA-256
`e684eb636e8fb084f156e6afe778b9cdf3c0d073ea749a1349c2fa62f657d80a`.

The actual streamed HTTP regression passes **1/1** with
`pnpm rust:core -- test -p lapis-server --test editor_state_writes --locked`,
receipt `d6dc995b-7c3e-42bc-8e4f-a4ed11d26c42`. It preserves own-client
conditional persistence and foreign clean/dirty fences with no native service
or HTTP production change.

Canonical Docker `check:all`, receipt
`d063c95e-ffb0-40ce-ae92-1833824261e5`, passes on `f3ff0c66`: **562 native
cases** with seven intentional provider/asset ignores, **2,354 package cases**
with one retained skip, and check **20/20**, test **20/20**, build **11/11**
tasks. The complete cold interaction/accessibility catalog passes **261/261**
in receipt `e46cd94b-eee8-457c-b183-29312a358ccd` (93/71/42/55 across four
sequential shards). Static Storybook passes in
`babfbc86-4e6a-41f5-806c-fa58bf0a921b`; complete specification checking passes
in `2e073e0a-9b35-47f2-b73b-524b3c5792b6`. No functional or accessibility
failure is waived. Actual hosted/Desktop adoption remains a separate gate.

The owner archive candidate `9dc607f1` and final source `f3ff0c66` differ only
in strengthened regression tests and public declaration examples. Production
API bytes are identical. The coherent source cohort has 13 verified archive
inputs, including Markdown `d8e7bb59` and Mira `e79ba9cd`; publishable package
manifests and lockfiles remain unchanged.

## Ownership

- Interactive writers retain full-duration fencing. Noninteractive state
  acquires before a queued logical change and quiesces after successful
  conditional persistence; clean construction/guards acquire nothing.
- State writes remain on the existing App queue and FileTextPersistence owner.
  A saved logical change is acknowledged before native idle bookkeeping, so a
  lost bookkeeping reply cannot replay that acknowledged content mutation.
- A clean state writer has no editable buffer to protect while idle; its next
  logical operation still uses its independent conditional baseline. Failed or
  dirty persistence keeps the native claim and existing explicit recovery.
- NativeRegisteredEditingSession exposes readonly issue snapshots with
  `id`, `path`, `phase`, `status` and generic `message`, plus passive subscription.
  Pending transitions are observable before a native List claim exists.
  Root's facade guards captured registration/issue identity and owns explicit
  retry; there are no callbacks or content bytes in diagnostic payloads.

No Deno, signing, publication, installed application or default cutover changes.
