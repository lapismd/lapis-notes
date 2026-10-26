# Native Search App replacement

This slice starts on committed Notes metadata intake `d133a31b` in isolated
workspace `hosted-native-search-20261026`. Qualified Search source `bd305e58`
selects the existing App-owned native port; both hosts keep their current
explicit native-owner opt-in and renderer defaults.

Desktop native adoption identified an omitted-plugin transition: passive detach
correctly retains native work, but a new safe-mode/disabled App never loads Search
to issue its explicit disable. The fix belongs to the shared App observer.
The real plugin declares providers during refresh after metadata emits loaded;
checking only the observer's earlier declarations would incorrectly disable an
enabled plugin. Reconcile its owning App registry and serialize native Search
controls, retaining fail-closed drain and late-enable behavior.

The exact target is `pnpm --filter @lapis-notes/api exec vitest run
src/lib/__tests__/native-search-observer.test.ts`. The baseline and qualified owner
results below distinguish source repair from consumer archive intake.
Native Desktop transition acceptance and hosted native Search adoption remain
separate from this source gate. No new screen, scheduler or Tasks input is added.

## Baseline

Worker `lapis-hosted-native-search-startup-order-1f45e1ef` at `cc9b8843`
records 11 passing and five failing cases. Missing, disabled and failed Search
plugins leave retained native selection active; drain failure is not observed;
a late-declaration case never reaches a startup drain. Enabled Search awaiting
metadata and all ten existing observer cases already pass.

The exact retry at `d6352aa7`, worker
`lapis-hosted-native-search-startup-order-990c11df`, passes all 16 cases.
The shared observer checks the owning enabled-plugin registry before deciding
absence, serializes Search controls, and fences stale disable cleanup from a
later declaration. No producer, provider, screen or host-specific policy changes.

First combined owner attempt `lapis-hosted-native-search-api-owner-8efb1c58`
at `f60ce7f7` passes all 28 background/Search cases but stops at six metadata
fixture failures. That narrow fake App omitted the real App's plugin registry;
adding its empty registry preserves every metadata ordering assertion and source
byte-copy behavior. No production fallback or optional ownership lookup is added.
The exact six metadata cases and full owner target are rerun before packing.

The exact metadata retry at `d6b34a20`, worker
`lapis-hosted-native-search-metadata-regression-81067945`, passes all six original
cases with the registry-complete fake App and unchanged assertions.

## Qualified API owner

Worker `lapis-hosted-native-search-api-owner-703a0796` at
`eea52e15aa55ad8988ffe2fda00b58f067333d0c` passes all 34 focused native cases,
all 1,625 API cases/153 files, strict zero errors/warnings, UI/API build with
publint and packed public declarations, six hosted adapter cases, ownership
and structural specification validation. The replacement public API archive has
SHA-256 `aa1a5d5212cd6a78d4f71a54193d8ceed9b0ab74fa4d22aadb56ab68cf552f5f`.
Desktop receives this documented temporary archive while full Notes and actual
hosted qualification continue. No package is published.

## Hosted Search admission

The retained real hosted metadata browser journey now also requires native
Search declaration, Canvas results, writer fencing, existing refresh and semantic
rebuild controls, indexing after detach and a persisted-disabled replacement.
Its first run retains old Search `39ba` to prove the missing native adapter;
then qualified Search `bd305e58` / archive `aa1caa1e` replaces that one input.
No new flag, native engine, screen or renderer scheduler is introduced.

Old-adapter hosted baseline `620b2bac`, worker
`lapis-hosted-native-search-focused-5800c789`, passes exact six/full 73 Web cases,
strict Web/Svelte/e2e declarations and required public/native builds. The actual
browser case fails at the required `select_search` observation (zero passes/one
failure), while metadata selection/refresh succeeds. The next snapshot changes
only the Search archive from `39baabc1` to qualified `aa1caa1e`; the API product
remains the owner-qualified `eea52e15` source. An additional response assertion
keeps native indexing failures visible during the new retained controls.

The first qualified-archive run `0051677e`, worker `278d463f`, reaches native
Search declaration, Markdown/Canvas results, writer fencing and refresh, then
fails the authored Settings navigation step (zero passes/one failure). Search
still registers only its legacy settings tab; the current Workspace Settings
navigation requires declarative sections. That source-owned settings gap is
recorded separately. This native-routing journey uses Search's existing semantic
rebuild command, which invokes the same public rebuild method, without adding a
screen or weakening native rebuild assertions.

Worker `c0d6484a` at `6ba3173b` passes the full actual hosted journey in 20.4s,
all six focused/73 Web cases, strict Web/Svelte/e2e declarations, public builds
and native server build. It then stops at one spec-first mapping diagnostic:
the plugin-lifecycle chapter must describe the replacement activation boundary.
That overview is added before the complete combined gate; no product code changes.

## Complete retained-host qualification

Formatting/progress/full specification prepare `24e36be0` at `51975921` passes
after the mapped lifecycle overview is added. Its formatted outputs are copied
before the combined run; the API source remains byte-identical to qualified
owner `eea52e15` and public archive `aa1a5d52`.

Complete worker `9698cc82` at
`d4f08b8c1ba3d46cc30abaea17392013ea57288d` passes from
2026-10-26 03:55:39 UTC to 04:15:45 UTC. Results include all 20 strict package
tasks, 461 Rust cases, 2,295 package cases with one retained frozen-Deno skip,
all 11 builds, all 261 cold catalog cases across 59 files, static Storybook with
all 182 specification chapters, and the full specification/78 governance cases.

The actual browser lanes pass all 22 cases: selected native metadata/Search
one case in 20.2s, ordinary Rust-hosted eight in 56.3s, Node-hosted one in 21.7s,
and standalone Web twelve in 1.6 minutes. The selected journey proves native
Markdown/Canvas publication, renderer writer fencing, refresh and semantic
rebuild, retained work after detach, and a persisted-disabled replacement that
releases Search while metadata and saved note bytes remain intact.

These results qualify the shared startup repair and hosted intake against Search
archive `aa1caa1e`. Desktop acceptance, default cutover, publication and the
separate Search settings-recovery source repair remain separate gates. A newer
Search archive must receive its own documented consumer qualification; this
record does not claim that pending archive has been consumed.

## Search recovery archive intake

Search source `898477ad` supplies early archive SHA-256
`1012f4a7da684accdf65d604a102f2044c5bfb06a8edea43a58132845d59f414`.
Its 25 exact units, all 112 Search units, build/publint and exact cold recovery
story pass before the complete owner gate. The existing hosted
journey now checks externally reloaded app configuration, visible Search
controls, retained query/unrelated fields, and a later partial save. The old
`aa1caa1e` archive is retained for its exact baseline before the one archive
input changes. No API/host product code, new screen or recovery authority changes.

The owner's initial strict-pass report is corrected after inspecting its full
worker log: one type error remains because the mounted panel's private plugin
interface omits `manifest`. The source repair uses the stable `search` identity
already used by that panel. Its rebuilt archive will replace the early checksum
before candidate hosted acceptance; the early archive is not treated as qualified.

Old-archive baseline worker `42f69c46` at `c4f5aa93` passes the six focused and
73 complete Web cases, strict checks and required public/native builds. Its
expanded actual browser case fails only at recovered `Show more context`:
the switch remains false after the external configuration changes it to true
(zero passes/one failure). Existing native selection, results, writer fencing,
refresh and semantic rebuild still pass before that assertion. The final
replacement archive must pass this exact unchanged recovery assertion.

Corrected source `ba1d987a` produces final Search archive SHA-256
`2e7f0c428c04344105305a755a657c53ff61b710ed47c95d2ad9596d2476f680`.
Its strict zero errors/warnings, 25 exact/112 complete units, normal public
build/pack, all 17 cold Search cases and complete package checks pass; mapped
documentation/static closure remains separate. The actual Desktop settings
recovery target passes all three cases. No hosted candidate uses withdrawn
early archive `1012f4a7`.

This final hosted candidate also refreshes qualified Design Core source
`0d7a9289` through archive SHA-256
`6f33b681e0050123cbd0501ffe6bfdc37d74625b2687a7e283e06943edda31f6`.
The source-owned selected-picker contrast repair passes its six exact cases,
986 catalog/922 unit cases, complete browser families, final public pack
and cold consumer/specification closure. All other archive inputs remain
unchanged, including Mira 0.1.1 and its 0.0.3 companions. The isolated Notes
workspace rebases only the root's tracker checkpoint `6c8a064e`; its API product
remains byte-identical to qualified `eea52e15`.

Final-cohort focused worker `13ed07a9` at `50744f7e` passes the expanded actual
hosted journey in 23.1s with Search `2e7f0c42` and Design Core `6f33b681`. The
same `Show more context` assertion now passes; the query remains intact and a
later partial save preserves the recovered controls and unrelated configuration.
Existing native Search selection/Canvas, writer fencing, refresh/rebuild, detach
and disabled replacement still pass. All six focused/73 Web cases, strict
checks, required public/native builds and complete specification/78 governance
cases pass. Formatted outputs are copied and API bytes still match `eea52e15`.

Only the Search runtime recovery and Design Core paint inputs change from the
complete `d4f08b8c` source gate. Their owner suites remain separate from final
Notes consumer acceptance: Web strict/unit/build, the complete cold catalog and
all four actual browser profiles. Unchanged Rust/API product qualification is
retained rather than represented as rerun against a different input set.

## Final consumer results and independent API closure

Final consumer worker `b47c2e12` at `30bd744c` passes all six focused/73 Web
cases, strict checks and required builds, all 261 cold catalog cases/59 files,
static Storybook with all 182 specification chapters, selected native Search
and configuration recovery in 22.9s, ordinary Rust-hosted eight cases and
Node-hosted one case in 21.3s. Its standalone Web lane starts zero cases: the
private runner omitted the normal Web renderer build required by Playwright's
preview server. The container is not OOM-killed. Restoring that prerequisite
requires no product fix, changed assertion, increased timeout or repeat of the
already-passing lanes.

Retry worker `2a78eca9` at `85bc364d` passes all twelve original standalone Web
cases in 1.6 minutes, public dependency and normal renderer builds, structural
specification and the complete specification/78 governance cases. It runs from
2026-10-26 04:54:52 UTC to 04:58:14 UTC. Formatted/generated outputs are copied
only after confirming that local files still match the frozen snapshot; API
product bytes remain identical to `eea52e15`. Together with `b47c2e12`, this
completes functional consumer acceptance for final Search `2e7f0c42` and Design
Core `6f33b681`: all 261 cold catalog, static catalog and all 22 browser cases.

Source Search archive `2e7f0c42` is functionally verified but not yet admitted.
Its owner records inherited required failures: the complete catalog's last
shard disconnects before two LinkPreview cases, one high Zod audit finding,
four CSV styling findings and one release-lock policy failure. The same input
bytes reproduce at the source parent; both exact LinkPreview cases pass and
the cold parent also disconnects after 69 cases. These are pending explicit
acceptance or repair, not waived by consumer success. The owner record is
`lapis-plugins/spec/records/2026-10-26-search-settings-recovery.md` in its isolated
source workspace. No source/adoption commit is claimed here.

The API startup repair and its mapped evidence are committed independently at
`a1b0dfde5941e0f0dfd73b7b3735bdab990cb7e3` against the earlier qualified source
cohort. Its product bytes still match `eea52e15`,
which passed the owner gate before the newer Search recovery change existed.
The hosted regression and its canonical admission chapters remain uncommitted
until the latest Search source-input gate closes. Preserve every assertion and
the distinction between functional consumer receipts and admitted dependencies.

Final-document worker `41317367` at `08b30ea6` passes the formatter, generated
82-task grouped/sorted/spec-linked ledger and complete specification/78 governance
cases before that eleven-path API-only commit. The four hosted adoption files
stay uncommitted; neither the default Notes nor isolated History workspace is
changed by this source closure.

Tracker-follow-up worker `536e5bbe` at `e4bed798` passes formatting and progress,
then reports three spec-first mapping diagnostics for the now-separate hosted
test draft. Its architecture, package-service and plugin-lifecycle overview notes
had been included with the API commit. Add hosted-specific context to those
three chapters so the staged hosted adoption has complete mappings of its own.
No product, test, assertion or validator changes are needed; its full stack is
rechecked before the documentary tracker closure.
