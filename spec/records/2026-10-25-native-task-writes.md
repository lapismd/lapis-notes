# Guarded native Task transformations

Status: qualified one-file native source intake; host adoption remains pending.
Last updated: 2026-10-26T00:18:05Z.
Migration task: R3.2.1.2.10.2. Requirements: LN-CORE-003/005/006.

This slice directly consumes qualified Tasks
`fde58de0b03f97691a109b3448f414c5ac19eb5a` through the existing admitted native
Work and byte writer. It provides one-file Task actions, daily observation
materialization and observation completion. Daily provider creation, scheduled
materialization, two-file coordination, transports and both host selections
remain pending.

The exact new native regression is authored before implementation. Existing
service lifetime, dirty/alias and replaced-root checks, plus seeded old-config
same-byte/cold-reopen acceptance, remain required. Source error metadata stays
distinct from native admission failures. No-op writes must retain freshness and
dirty protection inside the existing writer boundary.

All portable qualification uses serialized Docker slot 3 with four CPUs,
12 GiB memory, 2 GiB shared memory and pinned sibling revisions. There is no
host compiler/test fallback. Root owns the master migration tracker; source
receipts and final qualification will be sent for its next commit.

## Captured baseline

The corrected locked regression
`pnpm validation:rust -- test -p lapis-app-core --test service_task_writes --locked -- --nocapture`
failed with three missing `Work` methods and no fixture failure. Receipt:
`2b9d143a-9cf2-409f-abad-cebdefd655b5`, snapshot
`4f74b31dc5b0457809898ee52dab89fd956eb94d`. The earlier authoring attempt
`3b3ca3d9-8b97-4263-85dd-efd078c03f35` had those three expected compiler
errors plus an absent fixture caused by selecting a nonexistent fixture case.
That authoring defect was repaired before the corrected baseline; it is not
counted as a product failure.

Seven selected complete cases are copied unchanged from qualified Tasks'
`transformations.json` (SHA-256
`35b099569d7aa630380828891ca682f250e6d84126b45c9051ec6433f250dea8`):
`trimmed-envelope / cancel`, `no Tasks / anytime / None`, boolean LF
completion, `ordinary-markdown / checklist`, `existing`, `duplicate`, and
`missing-id / checklist`. The unusual non-ASCII task ID in the materialization
fixture intentionally retains the qualified source's non-idempotent repeated
result. No-op coverage uses the separate qualified `existing` case.

The Docs/History integration base is
`5ee783f1df95a37e552947d12d73127dd8a49eec`. Its existing Saphyr dependency
features are retained; the Task package lock only gains `saphyr` and `ryu-js`
edges, without upgrading any existing package.

The exact same-byte cache baseline failed once at the old private signature:
`native-tasks-document-v4` versus `native-tasks-document-v4-yaml12-1`, after
confirming that the seeded old folded title was actually stored and the new
reader refreshed it. Command:
`pnpm validation:rust -- test -p lapis-app-core --lib cold_same_byte_yaml12_intake_replaces_old_private_cache_identity --locked -- --nocapture`;
receipt `a8547746-38c7-4c60-8521-dd3f53ac5315`. The prior cache authoring run
`dcff2ae7-688c-440c-8a31-ee7e68bd25c1` seeded a nested field instead of the
public flat title, so its seed assertion failed. That test-only authoring error
was corrected before capturing the actual private-signature failure.

During first after-run `c49482cf-25ef-4a32-95a0-236938a1202e`, the seed
assertion used the public Task facade after deliberately restoring the old
private config. The facade correctly hides that old config after the bump.
The seed assertion now reads the raw projection directly, retaining the exact
stored-title check. The final test is rerun against the old signature before
qualifying the bump; this authoring failure does not represent a product defect.

Final corrected cache-test baseline:
`13b7167b-ab87-436d-a142-cdbe6a151e61`, one exact failure at the old
private signature. It confirms stored old-title bytes through the raw
projection reader, then the cold selected owner reparses unchanged physical
Markdown before asserting the advanced config. No expected values were changed.

## Targeted after results

- Final cache regression: **1 passed, 0 failed**, receipt
  `5574d0cc-ed40-4f99-b034-bbd64970b694`.
- Original three-method complete-output regression: **1 passed, 0 failed**,
  receipt `5992eafa-37a0-480d-8814-b9220019ef23`. The fixture's entire
  replacement text is compared to the returned snapshot and actual vault bytes;
  returned versions match fresh reads.
- Native Task guard target: **9 passed, 0 failed**, receipt
  `daab75a6-81f5-4c8a-a0ae-7e196e3f37f7`, command
  `pnpm validation:rust -- test -p lapis-app-core --test service_task_write_guards --locked -- --nocapture`.
  This covers no-op mtime/version, stale no-op, attached/detached dirty claims,
  explicit recovery, hardlink alias claims, replaced physical root, competing
  revisions, admitted close drain, full source errors and existing-file-only
  daily-note refusal.

Two deterministic private persistence regressions additionally change physical
bytes or establish a dirty claim between pure transformation and final writer
admission. They preserve external bytes and reject both changed and unchanged
results. The complete native suite must qualify those races plus the existing
service lifetime/file/stream acceptance. No host default has changed.

## Complete Notes qualification

`pnpm check:all` passed in immutable Docker run
`f3c2ded0-9e7c-4dbd-b7bc-96a0434a3092`, source revision
`9a00bf23a0d639e46e0aa7f8901f84e0dcb77452`. This includes:

- Rust boundary audit, generated protocol checks, canonical rustfmt and
  all-target strict clippy; all 20 repository check tasks passed.
- **404 native cases passed, 0 failed**; six existing optional/manual cases
  remain ignored. Both new persistence-race cases and all existing
  lifetime/file/stream/indexing tests passed.
- **2,253 package unit cases passed, 0 failed**, with one unchanged frozen
  Deno-host skipped case; all 20 package test tasks passed.
- Complete native build and all 11 workspace production build tasks passed,
  including the retained browser and frozen desktop renderer bundles.

This qualification uses the combined Docs/History base above. The separately
qualified newer Plugins parser source/config/cache gate is integrated by the
root lane; its additional case is not included in this source-slice count.
Canonical specification/evidence check is recorded below after final authoring.

The source-level gate is complete. Default host selection, native provider
selection/creation, tracked-today materialization, daily-before-rolling-Task
coordination and accepted-operation recovery remain separate pending work.
No renderer writer, fallback mutation path or second scheduler was added.

`pnpm spec:check` passed in final canonical/evidence run
`5e390415-7e3d-4a17-95d9-16168a7dc01f`, snapshot
`252944f4e77e7205fe5527cff428e4d273a50284`, including 78 specification-validator
regression cases with zero failures. Relative to the full product-qualified
snapshot, only this supporting evidence record changed. Root updates the master
tracker when integrating this qualified source commit.
