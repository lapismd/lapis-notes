# Native handoff recovery

Updated 2026-10-27 04:41:28 UTC. Current scoped source is qualified; final merged documentation and main adoption remain separate. R3 remains Working.

## Scope and cause

Final native Properties acceptance reached the existing editor saved-baseline
fence before the frontmatter transform was admitted. Refusing that handoff is
required by LN-CORE-028. The source defect was cleanup: Resume of an already
active lease succeeded without Yield and cleared the failed handoff issue and
local input protection, contrary to LN-CORE-020/027.

The API repair retains the same writer's failed handoff and release. An explicit
retry must validate/reconcile that Yield before rearming. Normal clean file-change
projection may converge while input stays held; neither cleanup nor retry may
acknowledge mismatched bytes or replay the rejected mutation. Clean terminal
retirement remains distinct. Identical Error objects reported by admission and
cleanup retain their original code; independent errors still aggregate.

## Reproduction

The frozen snapshot uses the composed final frontend/native parent `00492829`,
which is a stable duplicate of `4e7ae1b0`. Native inputs remain the final R3
kernel; this repair changes no Rust, Cargo, protocol, clock or model fixture.
The 16 public dependency archives and pinned Docker image match final R3 intake.

Exact command:

```sh
pnpm --filter @lapis-notes/api exec vitest run \
  src/lib/__tests__/native-protected-refresh.test.ts \
  src/lib/__tests__/native-editor-handoff-recovery.test.ts \
  src/lib/__tests__/file-editing-failures.test.ts
```

- Before: `89eab0a3`, receipt `a005d1c1-6afe-4074-920f-59ca4f2546e8`: three failures and six passes. Native input protection was released in both the model and real Editor; repeated identical errors incorrectly became an aggregate.
- The first after attempt `c8cd22a3`, receipt `f024568d-fa73-4477-bfde-837f665ff8a9`, reached the new protection/recovery assertions but exposed two test-fixture List replies missing the required `states` shape. The fixture is corrected without changing product expectations.
- The corrected snapshot `2f9d5317`, receipt `f45c4a17-f9b6-4292-a1e0-897f7d1360ff`, passes all ten exact cases, 158 affected cases and all 1,713 API cases. API strict checks, five dependency builds, public contract types, publint and pack pass. Complete source, cold catalog and both current hosts remain pending. The first broad snapshot `8515792b` passes exact spec-first and ten exact cases, then finds the mapped Vault chapter at 404 physical lines. The added explanation is shortened to its single distinct concern, preserving all normative contracts and the 400-line limit; no product changes follow the qualified package candidate.

## Ownership

`native-editing-session.ts` retains the existing lease and local release.
`file-editing-sessions.ts` deduplicates only identical error objects. There is no
new save engine, Properties writer, transport API, default switch or native
guard exemption. The original saved-mismatch regression remains unchanged.

The original native stale-Properties test independently needs clean-editor
readiness before committing its retained focused input; otherwise it exercises
pre-admission refusal rather than computed-draft conflict recovery.

## Qualified package candidate

The early API archive is `lapis-notes-api-0.1.4.tgz`, SHA-256
`5cbe9b4e5eff88b3b843ded2bb6f0b959678ba5107ea89ba8ecff8e83d5e92dc`.
It is a private, unversioned validation candidate; registry manifests and lock
remain unchanged. Desktop received this archive for its fresh current native
Problems/protection and complete catalog gates.

The real Editor regression uses the public `trackChanges` file-change event.
Its clean buffer and baseline converge while input stays protected. Explicit
retry retains the editor identity, performs no content write, does not replay
the rejected callback, and clears the captured issue only after real handoff.
Independent same-message Errors and equal primitive throws still aggregate.

## Coherent source and hosted closure in progress

Worker `4f0c3c26-dd56-4eb9-b9dc-2480e716c458` freezes source `3d8d7e97`.
Exact spec-first passes five protected files/four mapped chapters; 11 validators
cover 187 chapters/1,560 requirements. Fresh frontend check20/test20/build11
pass: 2,435 package cases, including all 1,713 API and 123 Web cases; one
intentional frozen-host test remains skipped. Cold264 catalog/static and the
complete original41 plus one actual-model hosted journeys remain active.

The intermediate `b73f2228-a844-48cf-98aa-481f17907ca8` attempt reached those
first specification gates but its optional native-boundary command lacked the
unchanged sibling Cargo manifests. The final worker instead reuses native
qualification under the agreed exact-input guard and freshly checks protocol
TypeScript. This is a private validation-harness correction; no product or
assertion changes followed the package candidate.

All 611 Rust/Cargo/native pins, protocol outputs and native model/clock/daily
inputs match `99d45ef2`. Native qualification receipt
`91dc64c7-6f22-40ea-a178-11a4b5d0b9d8` remains source evidence. The private
worker verifies every file hash and reuses its exact `lapis-server` binary,
202,989,880 bytes, SHA-256
`e31d318a3ced47a7863e8a01f8c2e000d1e5aea276a704558ac0524582c506e6`.
The transport tar is separately pinned at 202,991,616 bytes, SHA-256
`d4a27c17cf7f0ff204c676c858ab48f19efe11334ffd572afe36bcf4949426e8`.
No shared native target is mounted and no Rust compilation occurs.

## Superseded broad candidate and scoped aggregation repair

The early `5cbe9b4e` archive is superseded. Desktop proves its new native
Problems/protection/retry case and all four Properties cases (5/5), but the
unchanged AI LocalConversationStorage GuardedReplacement story detects a
3-to-1 independent-writer admission error collapse. Its three registered
writers share one participant admission Promise and Error; primary writer
multiplicity is an existing contract and is preserved. No assertion is relaxed.

Exact source reproduction `83da648d`, receipt
`69739ba2-7836-4330-93c9-ea361d4ea256`, fails one shared-rejection case.
Generic aggregation is restored; only cleanup re-reporting of primary object
references is removed. Primary aggregates keep their multiplicity. Independent
nested cleanup failures retain multiplicity, message and cause, and a rejected
release remains retained even when its duplicate report is removed. Equal
primitive throws are never deduplicated.

The `5cbe9b4e` full-source and host receipts are supporting superseded evidence,
not qualification of this narrower product. Exact, affected, API/archive and
complete current source/host gates are being repeated.

## Current scoped API qualification

Source `0e42a318e888e99b8ed3dca7f952004d4dc86f87`, receipt
`579ccb0b-d767-406f-aa6a-3c2a6763d2de`, passes all13 exact cases,158 affected
and1,716 API cases. Strict/API/public contract types, five dependency builds,
publint and packing pass. The current private API archive is SHA-256
`89e81a5f13469fc3b52652e7822720ef0ec96b555df626a00a9de071f89de98e`.
No registry manifest, lockfile or public API shape changes. Desktop has this
archive and retains the original GuardedReplacement three-writer assertion.

The superseded `4f0c3c26` cohort completed all42 browser journeys (4History,
2metadata/model,8Rust-hosted,1Node-hosted,12standalone-Web,15Tasks). Its final
canonical check lacked the sibling Cargo manifests required by the protocol
exporter, so it is not a passing final receipt. The current coherent worker
restores all six pinned siblings and runs unmodified protocol/boundary/canonical
lanes using the exclusively held warm Rust/Cargo caches. Only the unchanged
protocol exporter may rebuild; complete native597 qualification is reused
under the611-file equality guard.

Current full frontend check/test/build and42 hosted journeys remain active.
The independently authored HandoffFailure story's complete265 catalog/static
will run on the same scoped product and16 public archives, supplying the current
complete source catalog gate without repeating the superseded264 run.

## Verification status audit

CORE019/020/021/025 had stale source-pending descriptions despite their committed
foundation, recovery and protected-refresh closure. Their verification rows now
mark the source contracts Implemented and link the existing immutable records.
Foundation qualifies547 native/2343 package/261 catalog cases; captured recovery
qualifies7 exact plus10 intents and51 HTTP cases, full561 native/2349 package/
261 catalog/24 browser/spec78, with explicit main source intake. Problems and
protected refresh have their own complete source receipts.

This is a documentation status correction, not a requirement waiver or a claim
that all host/default/cutover gates are complete. Broad CORE003/007 and R4–R7
statuses remain unchanged. Current scoped handoff/consumer receipts remain
separate from those earlier source contracts and final main adoption.

## Final current source closure

Frozen `bef7a0a044a5d9f6d3f13f63c97f1e60b3463ba0`, receipt
`4b5e07c4-0cfd-4ae9-91b7-d1ca4dc0b96d`, exits0 without OOM at
2026-10-27 04:36:14 UTC. Its API product equals `0e42a318`; its freshly packed
API archive is byte-identical to qualified `89e81a5f`. Every command passes.

| Current gate             | Result                                                                                                                                                                      |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exact and affected owner | 13 exact;158 affected; all1,716 API cases                                                                                                                                   |
| Complete frontend        | check20/test20/build11; 2,438 package cases; one intentional frozen-host skip                                                                                               |
| Hosted/current profile   | 42/42:4 History,2 metadata/actual-model,8 Rust,1 Node,12 standalone Web,15 Tasks/editor/leave                                                                               |
| Canonical                | spec-first6 protected/four canonical;11 validators/187 chapters/1,560 requirements; unmodified protocol, Rust boundary and complete specification/78 governance; formatting |
| Native reuse             | 611 files equal final99; six pinned sibling source archives restored; native597 qualification reused, fresh protocol exporter/boundary checks executed                      |

Independent current-source catalog receipt
`d7d3d4ae-ad37-4393-b8a3-4523dcf97669`, frozen
`3dff2675f1110c4971f6c0a4f9f631110079603c`, passes the new HandoffFailure
story1/1 after0/1, complete family3, Workspace32, strict/ownership/parity and
all 265 cold cases (95/67/46/57) plus static build. Its API tree equals0e42.
The story and its immutable evidence are a separate Root-owned change; final
merged documentary canonical closure follows source commit.

Current Desktop89e81/Core03b passes all 99 actual native cases:20 API/ONNX,
12 Repository,12 navigation,51 writer/recovery and4 actual installed Tasks.
The ordinary asset bundle and all31 archive/116 route checks pass. Original
GuardedReplacement remains unchanged and passes4/4; the complete LocalStorage
family passes12. Whole Desktop catalog and final main intake remain separate.
No source product, public dependency or protocol changes follow this receipt.

## Optional contribution scope audit

The saved optional Docs contract (`rust-indexing-lifetime.md`, optional Docs
and explicit-background sections) permits native-only compiled selection and
explicitly separates Docs host/UI/editing/FSRS adoption. The current shared
profile does not bundle Docs. The existing Docs source intake and generic
contribution API proof do not constitute actual installed Docs UI acceptance.
Docs source rows retain Source complete; final current-profile status must keep
that optional host boundary visible. Unknown/custom JavaScript callbacks remain
client-dependent/unavailable under CORE005, not promised future native runtime.
