# Released Mira dependency intake

Status: the corrected dependency cohort is qualified in source and all required
Notes portable gates. Distribution, native product/actual-provider and visual
acceptance remain separately scoped.

| Current gate                                | Result                                             | Exact receipt                                                     |
| ------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------- |
| Owning source and independent package       | Qualified committed `944cd448`, archive `4f6b3f5c` | Source `dbf23975`, package `49b7e3c5`, public equality `849b56cd` |
| Fresh restricted worker smoke               | Pass                                               | `33dac726`                                                        |
| Runner/source-composition/lease regressions | 59 pass                                            | `e93d035e`                                                        |
| Cold selected editor/chat stories           | 2 pass, 36 unselected                              | `e7ef70cf`                                                        |
| Complete guarded catalog                    | 261 pass in 59 files                               | `620deaac`                                                        |
| Canonical root check/test/build             | 339 Rust, 5 Node boundary, 2,209 package passes    | `3841ad15`                                                        |
| Static catalog                              | Pass, all 181 spec chapters                        | `16e01dce`                                                        |
| Final specification                         | 78 regression passes and all configured gates      | `45d413c2`                                                        |
| Public consumer archives                    | Five identity/checksum-verified packages           | `a2aa42d7`                                                        |

## Selected dependency cohort

The root moves Mira `~0.0.5` to `~0.1.1` and Mira Editor, AI and Mermaid
`~0.0.2` to `~0.0.3`. These are the latest released versions on 2026-10-25.
Design Core remains `^0.6.0`, its latest released version. Source fixes beyond
that publication are consumed through the existing checksum-verified prepared
archive from committed `944cd448b40d53be79624c2a453248af78e513e8`.
Independent dirty source package/lock work remains untouched.

Mira `0.1.1` was released from
`57d6d4409eb61f5b2288ca2d8c4782b88d1b9513`. Its registry archive has SHA-256
`70ff5116998b1c733bbaed43b3ce5e4fe44645550a1fe54d1203c7b8a57ac4d4`.
The prepared Design Core archive has SHA-256
`4f6b3f5c6c619e3154cb2860881b7d89b9c11062db4cfa1eb9ae0488150b7a97`.
Downloads are checked against the registry's SHA-512 integrity and SHA-1
shasums. Companion versions remain `0.0.3`; API and Markdown's existing
published peer ranges already admit Mira `0.1.1`.

Plugins' current lock already resolves Mira `0.1.1` and the three `0.0.3`
companions, and its Docker prerequisites select the current Design Core
archive. Its older local installation remains owned by independently active
CSV/Markdown work; this change does not reinstall it or alter its dirty lock.
Desktop records its separate consumer intake in `E-CORE-023`.

## Before state and lock boundary

Root Notes previously selected registry Mira `0.0.5` and companions `0.0.2`.
No existing override requires those old versions. The ignored `.pnpmfile.cjs`
contains older plugin archive routes and is preserved without modification.
Registry and Docker qualification explicitly bypass that hook and declare
their archive prerequisites separately.

Before changing the ranges, this exact command fails once:

```sh
pnpm install --lockfile-only --ignore-pnpmfile --frozen-lockfile --ignore-scripts
```

It reports `ERR_PNPM_OUTDATED_LOCKFILE`: App Profile's existing manifest has
three dependencies missing from its lock importer: `@sveltejs/package`,
`@lapismd/agent-ui` and Design Core. Agent UI is unpublished and returns a
registry 404. The tracked lock remains byte-identical; no fabricated registry
identity or knowingly partial lock refresh is committed. An isolated archive
projection is required until publication and complete frozen registry
qualification at the distribution gate.

## Consumer qualification

The ignored installation script
`.local/validation/mira-refresh-20261025/install.mjs` admits the existing four
Docker prerequisites (Design Core, Agent UI, Search and AI) plus the four
released Mira archives. It verifies all eight checksums and package identities,
temporarily projects the root manifest for installation with `--ignore-pnpmfile`,
then restores the tracked manifest and lock byte-for-byte. The existing ignored
hook remains unchanged. Installation takes 9.4s; payload verification passes
across 33 direct, transitive and workspace import routes. Backups, archive
inventory and receipt remain in that ignored directory.

The initial Docker configuration selected that eight-archive inventory and
retains its remote `omarchy` context with four CPU and 12 GiB memory bounds.
The first cold command passes both selected cases with zero failures:

```sh
pnpm test:storybook -- \
  stories/workspace/lapis-editor-demo/LapisEditorDemo.stories.ts \
  stories/plugins/ai/AiChat.stories.ts \
  -t 'Sync Editor Persistence|Send And Complete'
```

Run `lapis-notes-validation-7e1c0399-be89-451c-b282-b01ce82a4127` retains the
exact source, tools and eight archive hashes. Two cases pass, 36 unrelated
cases are unselected; functional and accessibility failures are zero. All four
required public package builds pass before the fresh browser tests.

The complete `pnpm ci:packages` Docker run
`lapis-notes-validation-e345c7b1-8e5d-42c0-9fef-2779252835fd` passes all 33
build/check/test tasks across eleven packages, with no cache hits, in 2m25.695s.
The dedicated test tasks pass 2,209 unique cases with one intentional legacy
skip. Repeated service tests run through check/build are not counted again.
All strict Svelte checks report zero errors/warnings, and public package plus
both renderer-host builds pass. The unchanged Deno-host-services build reports
its existing no-output Turbo warning; no frozen Deno source is modified.
The complete cold `pnpm test:storybook` run
`lapis-notes-validation-e50ccf40-139f-4a34-b979-f642f086a664` passes all 261
cases across 59 files, with zero functional or accessibility failures. Four
sequential shards pass 93, 71, 42 and 55 cases. Each uses the same explicitly
declared eight-archive dependency cohort. At that original checkpoint specification/static results remained
pending; their completed receipts follow below.

The first default Docker `pnpm spec:check` run
`lapis-notes-validation-79dab2db-8b43-441e-a259-84eeb8b8c0b1` passes configured
validation, documentation and mdBook, then reports one spec-first mapping
failure: root dependency changes require both Architecture and Packages
chapters, while only Architecture had changed. A concise Packages integration
note supplies the missing mapping before the exact rerun below.

The exact `pnpm spec:check` rerun passes in
`lapis-notes-validation-50a880ed-cae8-4ba7-b4f8-28f2cd34fc87`, including
all 78 specification regression cases, protocol/boundary checks, migration
progress, App ownership, metadata-query audit and mdBook. The mapping failure
count is one before and zero after; no implementation or assertion is weakened.
All 181 specification mirrors are regenerated from SUMMARY.

The Desktop fatal-diagnostic guard subsequently exposes a shared Design Core
queued-autocomplete lifecycle defect outside this Notes intake. The owning
source repair and replacement archive are being qualified separately. The
results above remain receipts for exact Design Core `67eb392b`; final intake
and affected consumer qualification must use the repaired archive when ready.
Earlier catalog and native results qualify their original dependency cohorts
and are not claimed as acceptance of this update.

No package publication, installed-application replacement, source alias,
dependency patch or visual baseline change is included.

## Other migration source repository audit

The read-only audit reads each tracked guide, current governance, status,
registered workspaces, local ancestry and scripts before considering expansion.

| Repository          | Input at initial audit and role                                                                                                      | Observed local tooling gap                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `lapis-ai`          | Clean `6548afe0`; sole default workspace; created 2026-10-16 and subsequently authored for neutral ACP/execution backend extraction. | Portable Rust/TS/spec commands run on the host; no Docker runner. No Storybook exists, so its guards are inapplicable.                                                                                       |
| `lapis-terminal`    | Clean `main` at `d7e0a7cd`; sole default workspace; stable engine input since its 2026-10-16 publishing qualification.               | No Docker runner. Chromium is headless/sequential and axe fails, but fatal-diagnostic/composition guards are absent. Real PTY/WebView acceptance remains native.                                             |
| `lapis-plugin-docs` | `506ad145` from 2026-08-28; sole default workspace; unrelated manifest/lock edits; older planned Docs algorithm source.              | No Docker runner. Taxonomy/mirror/supervisor and headless axe checks exist; fatal-diagnostic guards and explicit bounded browser file parallelism do not. Old Design Core/Mira intake requires coordination. |

AI's local `main` is an ancestor of the selected source; Terminal already
selects local `main`. Existing refs show no upstream-only commits to pick up.
Docs has no local bookmarks. This audit neither fetches nor rebases those
repositories and cannot establish that live remotes are unchanged. It makes
no implementation or new-backlog completion claim and preserves their files.

### Authorized AI follow-up

The subsequent AI tooling lane fetches origin and finds 24 selected source
commits ahead of `main@origin`, with no upstream-only commits. No rebase is
needed. `lapis-ai` then commits bounded Docker-first portable validation at
`b4a5f747c0dd11ec83027e78580875e1cd625c35`; its default workspace is clean.
The complete restricted worker passes 1,076 Rust cases (two inherited ignored),
43 renderer and 57 governance cases, plus check/build/examples/package/workflow
and specification lanes, in 2m21.8s with warm dependencies. The worker uses
an init reaper, zero Linux capabilities and locked all-target Cargo bootstrap;
exact initial setup failures and their passing regressions are retained in
`lapis-ai/spec/src/history/2026-10-25-docker-validation.md`. Actual providers,
models, native UI/platforms and publication remain separate. Terminal has a separately authorized tooling follow-up in progress, including
a live origin fetch with no upstream changes. Docs remains audit-only and its
independent manifest/lock edits are preserved.

## Replacement Design Core cohort

The fatal Desktop guard found queued autocomplete work after editor disposal.
A first owning-source repair at `8940d1af` passed independent package audit
`05ac92e6-d679-4b13-bca7-e9444c9fe95e`, with archive SHA-256
`4f8adef133571b72280c9bac78cc901a670d9f1fe0b47e8a70f3b6102053bd09`.
Its consumer guard then found six missing autocomplete assertions: the view
cleanup incorrectly revoked a live view during extension reconfiguration.
That candidate is superseded and not admitted as final.

The corrected source candidate is
`3bcbae3fcc9e8bfbf75371117b74ceb11173381a`, independently packed and tested in
`49b7e3c5-857e-4938-a7a4-04d421ff775f`. Public types, cold dev/production
runtime/styles and composer lifecycle pass. The replacement archive SHA-256 is
`4f6b3f5c6c619e3154cb2860881b7d89b9c11062db4cfa1eb9ae0488150b7a97`.
Complete source gates and the final committed public-byte equality proof are
required before admission; the source repair retains its own low KaTeX audit
exception without introducing a consumer waiver.

The separate ignored `.local/validation/mira-dc-remount-20261025/` projection
preserves every earlier receipt. It verifies eight package identities and 33
public payload routes, restores tracked manifest/lock bytes and leaves the
existing pnpm hook unchanged. The active Docker inventory selects this corrected
cohort. Fresh Docker smoke `33dac726-32cc-4704-8ac9-ee468eb89f2b` passes exact
source/tools, denied reads/writes and Chromium/WebKit checks. All 59 tooling
regressions pass in `e93d035e-d3e6-4e22-bc91-5e441a90c661`; the two exact cold
editor/chat cases pass in `e7ef70cf-f424-4145-bd9e-e92c42454793` (36 unselected).
Complete cold catalog run `620deaac-ab2a-4881-aa0d-57a5ba30c4d7` passes all
261 cases across 59 files, with zero functional, axe or fatal Svelte failures.
Its sequential shards pass 93, 71, 42 and 55 cases. Later root/static/spec
receipts are recorded in the final sections below.

The preceding provisional candidate also passed canonical `pnpm check:all` in
`33b05d40-a277-40c5-a5b5-352f0ee16a26`: 339 native Rust cases pass with six
explicitly ignored model/crash-helper profiles; five Node Rust-boundary tests
and 2,209 unique package cases pass with one frozen legacy skip. Root check
passes 20 tasks and build passes 11; strict Svelte diagnostics are zero. This
qualifies the admitted Plugins native-source pin and permission setup but does
not replace final renderer acceptance of the corrected archive.

## Final source admission and root gate

Design Core commits `944cd448b40d53be79624c2a453248af78e513e8`. Its complete
source gate `dbf23975-fa7c-4fc0-9299-dc461a5d6053` and final spec `6524981e`
pass. The owner's equality receipt proves all 1,557 public package inputs match
the independently audited `3bcbae3f` candidate, aggregate SHA-256
`849b56cdb469adda80ab163516295b939cb47ed93a39883c7b96e2a80010a081`. Archive
SHA-256 remains `4f6b3f5c6c619e3154cb2860881b7d89b9c11062db4cfa1eb9ae0488150b7a97`.
This final committed source is admitted; prior provisional and failed receipts
remain independently retained.

The corrected-cohort canonical `pnpm check:all` passes in
`3841ad15-bb2d-44de-b98b-c75031a0e5db`, 17:47:20.366–17:55:36.171 UTC
(8m15.805s): 339 Rust cases pass with six explicitly ignored model/crash-helper
profiles, five Node Rust-boundary cases pass, and all 2,209 unique package
cases pass with one frozen legacy skip. Root check and test each pass 20
Turbo tasks; build passes 11. Strict Svelte errors and warnings remain zero.
The browser cohort already passed all 261 cases. Static catalog and final
spec receipts follow below.

## Public UI archive follow-up for Tasks

The same bounded Docker source cohort runs `pnpm validation:consumer-pack` in
`a2aa42d7-de55-4e9e-8b6b-2cb96488a2da`. All five public package archives are
built through their real exports and checked for name, version and SHA-256.
UI `0.1.3` has SHA-256
`177bcce23e652b80f2f2948f69fc4211ee097e3bf0b15c3d0691bdeda1de6868` and its
packed manifest declares Bits UI `2.19.5`. The exact pack snapshot is
`12d3f4a1df948345d502181673995fe7c632b75a`; UI public source is byte-unchanged
from committed `16ab57a1988d467f809585b36461c3e85337d5c6`. Tracked dependency
files remain untouched by the isolated pack.

This archive is byte-identical to Tasks' original UI input. Its stale installed
Bits `2.18.1` comes from Tasks' direct dependency/projection, not a UI source
defect. Read-only registry-integrity-verified utility comparisons show
Bits `2.19.5` already fences the exact destroyed-ref text-selection and
dismissible-layer callbacks; `2.20.2` retains identical text-selection bytes.
Tasks owns the narrow direct-dependency alignment and guarded consumer checks,
recorded separately. No UI product edit or archive-content change is made.

The corrected-cohort `pnpm build-storybook` passes in
`16e01dce-788e-455d-9aae-e58da734aa41`; all five public build/static tasks pass,
and the generated catalog contains all 181 specification chapters. No visual
baseline is captured or approved. Final `pnpm spec:check` follows the completed
source, dependency, permission and provider evidence updates.

Final corrected-cohort `pnpm spec:check` passes in
`45d413c2-5e97-4c81-b025-35eeaa83355b`: all 78 governance regression cases
pass, with canonical requirements/verification/mappings, Rust protocol and
boundary checks, migration progress, App ownership, metadata queries and
mdBook passing. There are zero unexplained functional or accessibility
failures in the required intake lanes. The final record/table formatting is
checked after appending these exact results. Registry-only lock qualification
still requires publication of the documented private prerequisites.
