# Desktop and Deno retirement agent handover

Snapshot: 2026-11-18 (refreshed after Desktop E-RETIRE-014 PR #56). Coordination
owner: `lapismd/lapis-notes`.

This is the takeover entry point for the authorized Desktop/Deno retirement.
The [canonical plan](legacy-runtime-retirement.md) owns scope and ordering. The
[progress ledger](legacy-runtime-retirement-progress.md) retains complete dated
receipts, failed attempts and earlier checkpoints. Do not replace either with
this snapshot; update this file and the GitHub tracker when a listed gate moves.

## Scope that must not drift

- Remove only deprecated Desktop code and unnecessary Deno runtime/tooling.
- Preserve core API services and functions, including presently unused or
  future-facing Language Service declaration, package, projection and build
  wiring. Lack of a current caller is not removal authority.
- Keep E-RETIRE-007 parked. Do not revive or implement it.
- Exclude `nostr-agent-controller`, `community-local` and `nostr-auth`.
- Preserve standalone `ai-controller`, active AI Host execution, MCP and file
  tools, portable Redaction, native AI, planned Sync, historical artifacts,
  signatures, settings, conversations, memory and installed user data.
- Preserve `packages/deno-host-services` until each mixed service is classified.
  Do not remove generic helpers, Sync/core functions or future service contracts.
- Leave terminal migration and old Deno terminal-host retirement until every
  other in-scope removal and required consumer change has landed.
- Use isolated JJ workspaces, one reviewable removal per change, owner-repository
  tests, and ordinary npm semver consumption. Product qualification uses the
  isolated Omarchy Docker runner; never fall back to host execution.
- Publication, deployment, native execution and installed-app replacement are
  separate explicit gates. Preserve unrelated work and commit verified slices
  unsigned with Jujutsu.

## Landed work

- Shared `@lapis-notes/ai` source, package, catalogs, Notes probes and fixture
  inputs are removed. Plugins and Notes source landings have passed hosted CI.
- Signed registry metadata disables the retired package and its indexed download
  links. Disabled downloads return HTTP 410 so stale Notes catalogs cannot fall
  back to the preserved artifact origin.
- All eleven published shared-AI versions are deprecated on npm without
  unpublishing tarballs. Historical hashes and installed data remain intact.
- Notes rejects new installs and updates by retired provenance while preserving
  unrelated third-party plugins named `ai` and bundled/native AI.
- Website source and organization metadata are updated. The frozen Website
  artifact passed 25/25 cold hosted-preview cases at
  <https://9e73869e.lapis-md.pages.dev>; production remains a separate gate.
- Desktop fixture admission, source safeguards, private session UI retirement,
  obsolete Deno validator bootstrap removal and cold-chat collection are on
  Desktop main. The latest relevant merge is Desktop #54 at
  `ed03f5ee585469b0e319535ae95cb6e8bd064282`.
- Notes API 0.6.9, UI 0.2.5 and App Profile 0.2.6 are published. UI 0.2.5 is on
  the npm `next` tag, has integrity
  `sha512-eDDE3XXNpfa8gbHrrQbi4/Z3Lbg4UVi6d4z57LMXeeOIl9oDcdj+OQ8eJv/XhHQ3vcdjvoSeDb49chtNfy/7vg==`,
  and was verified by Notes release run 44315243276.
- Notes handover docs [#176](https://github.com/lapismd/lapis-notes/pull/176)
  merged at `0ad5374294ea20c88b4300b4f86bb45681dc4cd8`; handover refresh
  [#178](https://github.com/lapismd/lapis-notes/pull/178) merged at
  `637255f55a16449e0277b6a05e39792b5bc3a4a9`.
- Desktop [#55](https://github.com/lapismd/lapis-desktop/pull/55) merged at
  `9769c7febbdf7717ec5cac26b83b2ca7c0b51467` and adopted public UI 0.2.5 with
  API 0.6.9 and App Profile 0.2.6.

## Live work and exact resume points

### 1. Adopt the released Notes cohort in Desktop

Desktop [#55](https://github.com/lapismd/lapis-desktop/pull/55) landed. Follow-up
[#56](https://github.com/lapismd/lapis-desktop/pull/56) seals `E-RETIRE-014` on
public UI 0.2.5: removes API/UI/App Profile from unpublished CI projection, adds
the real CLI Workspace story, and records catalog shard failures, the 88/88
focused replay and public-UI Docker gates.

- workspace: `/Users/stevejuma/code/lapismd/lapis-desktop-retirement-e014-public-ui`
- JJ change/commit: `sqkuovow` / `442b15c4c869`
- bookmark: `retirement/e014-public-ui-sqkuovow`
- receipt: `spec/src/history/E-RETIRE-014.md` (`result: pass`)

Public-UI Omarchy Docker gates on five private archives + three npm packages:

- CLI Workspace story 4/4 cold modes (`5d5175cc`);
- `spec:check` (`9d118b1b`);
- `check:evidence` 523 records (`e054a381`);
- `build-storybook` (`f3a76e26`).

Historical private fixed-UI evidence remains recorded only: shards 3/4 passed
504/504 and 604/604; shards 1/2 retain three original transient failures (Chat
Layout Review / Compact Composer booting; Upstream Status / Incoming And
Outgoing dual tooltips; Change History / View Navigation `pointer-events: none`);
focused three-family replay 88/88 (`238012cb`). Those original failures stay
immutable and do not claim clean aggregate admission.

Still required for this step:

- [x] Land Desktop #55 on public UI 0.2.5.
- [x] Seal E-RETIRE-014 on public UI 0.2.5 (no private fixed-UI overlay).
- [x] Run final isolated Docker `build-storybook`, `spec:check` and
      `check:evidence` with the exact final five-private archive inventory.
- [x] Record catalog counts, all three original failures, the 88/88 replay and
      final gate results in E-RETIRE-014.
- [ ] Land Desktop [#56](https://github.com/lapismd/lapis-desktop/pull/56), then
      verify fresh exact-main CI after merge.

### 2. Prove native/data preservation

Run only after explicit approval for the on-demand macOS/native lane. Exercise
old external shared-AI data and bundled/native AI separately: provenance,
settings, conversations, memory, disabled state, Safe Mode, close/reopen and
cold restart. App Profile native-chat lifecycle and storage must use real native
boundaries. Browser, Linux, source and catalog results do not close this gate.
Do not replace an installed application or use a real user profile.

- [ ] Obtain the native-execution gate.
- [ ] Run the prepared preservation matrix without weakening assertions or
      deadlines; retain every failed attempt.
- [ ] Record exact source, package, application and isolated-profile identities.
- [ ] Land preservation evidence before deleting the frozen host.

### 3. Remove the frozen Notes Deno desktop

Only start after steps 1 and 2 land. The audited removal is the 176 tracked
files under `packages/desktop-deno/`, plus obsolete `scripts/desktop-release.mjs`,
its test, obsolete package script collection and Desktop cache ignores.

Preserve `packages/deno-host-services`, Language/core/Sync services and functions,
terminal-host tooling, historical release artifacts and user data. Preserve the
fail-closed `scripts/check-desktop-release-workflow.mjs` guard or replace it with
an equivalent negative regression. Update current Notes specs, verification,
inventories and package/workflow checks; do not rewrite historical receipts.

- [ ] Re-audit exact current main before deletion and record the narrow before
      failures/counts.
- [ ] Delete only confirmed frozen Desktop host/release paths.
- [ ] Prove package, spec, app-ownership, release-policy, Web and affected
      consumer lanes from ordinary registry dependencies.
- [ ] Commit, push and land the Notes removal as its own PR.

### 4. Remove the AI Host orphan Deno fixture

Prepared local workspace:
`/Users/stevejuma/code/lapismd/ai-host-retirement-deno-fixture`, JJ change
`vnrttqpy`, tree `202758caedf41ab56ee06b31c1c4203bd67244d2`. It deletes only
unused private `tests/fixtures/acp-agent.ts`, updates Spec Validator 0.2.0 to
0.2.1 and adds receipts. It must not change AI runtime, controller, MCP,
file-tools or core APIs.

The slice is uncommitted and blocked by an AI Host-specific development-only
GHSA-fc5q-39xc-vjpf exception. Earlier Plugins/Desktop exceptions do not apply.
The prepared but unapplied patch is
`.local/deno-fixture/ai-host-picomatch-dev-audit-exception-proposal.patch`,
SHA-256 `02860cf95ed5984e497403378d5d278f549070cf21b9c81d8114efca44b181c7`.

- [ ] Obtain explicit approval for the exact AI Host exception or wait for a
      patched dependency graph.
- [ ] Apply and verify the policy only if approved; rerun production and
      development audits plus owner checks/spec/build/test.
- [ ] Commit, push and land only after the ordinary gate qualifies.

### 5. Finish external guidance

- [ ] Decide separately whether to promote the already-qualified Website source
      to production. Preview approval did not authorize production deployment.
- [ ] Verify live Website and package/registry guidance after any production
      deployment. Do not reopen shared-AI artifacts or installs.

### 6. Retire terminal Deno last

After every earlier item lands, move the reusable Rust PTY service into the
`lapis-terminal` owner, update and qualify Server/Desktop/Web consumers, then
remove the obsolete Deno terminal host/runtime/tooling. Preserve the existing
Rust PTY crate location and Server pin until the replacement is proven. This is
not authority to change unrelated core services.

- [ ] Re-audit terminal ownership and public contracts at current main.
- [ ] Land the owner move and released consumer intake first.
- [ ] Prove terminal package, Server and Desktop/Web behavior.
- [ ] Remove old Deno terminal-host code only after the replacement lands.

### 7. Close the retirement

- [ ] Search all in-scope repositories for executable Desktop/Deno references;
      classify historical docs, negative guards and active runtime code.
- [ ] Prove supported package/host builds and runtime paths do not require Deno,
      excluding explicitly preserved adapters and out-of-scope consumers.
- [ ] Update the canonical plan, progress ledger, Notes runtime backlog and
      owner verification tables with final evidence.
- [ ] Retire temporary workspaces only after clean/landed/unique-change checks;
      preserve recovery bookmarks and immutable receipts.

## Handover discipline

Start each repository with its tracked `AGENTS.md`, `jj --no-pager st`, fetched
remote state and specification search. Do not infer completion from a prepared
workspace, passing focused replay, published package, merged source PR or hosted
preview. Keep source, consumer, native, deployment and installed-product gates
separate. Update the GitHub issue checklist and this snapshot after every landed
slice so another agent can resume without reconstructing local history.
