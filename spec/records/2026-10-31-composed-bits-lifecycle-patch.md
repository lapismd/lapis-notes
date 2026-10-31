# Notes composed Bits UI lifecycle patch

This receipt supplements, rather than rewrites, the October 25 runtime intake
and October 31 Sync cleanup evidence. Current policy and removal work belong to
the package integration chapter and runtime backlog.

## Candidate and scope

The candidate merges published main/API 0.2.2 source `8f97e4ba` and PR #51
`6ea18032`, retaining both parents and their committed receipts. API 0.2.2 was
published separately and does not contain PR #51's Sync cleanup. The preserved
patch Changeset therefore plans API 0.2.3. Publication and Desktop adoption
remain separate gates.

The user explicitly approved a tracked, reproducible pnpm patch for this repair.
No ad hoc `node_modules` edits, local source aliases or published forks are used.
`pnpm-workspace.yaml` declares the patch and a bounded Bits 2.20.2 override;
pnpm regenerates the portable lockfile. The override closes an older registry
Mira/Design Core branch that otherwise retains unpatched Bits 2.19.5.

Root patches do not propagate through API or UI publication. LN-PKG-158's minimal
published-package consumer intentionally excludes repository patches, overrides
and hooks; this repair does not alter that verification boundary.

## Official input and composed bytes

The official npm `bits-ui@2.20.2` tarball independently matches both advertised
integrity algorithms:

- SHA-256: `e9dfe0419e82b4b6f6f741c8ce612c86918b30ce8bd95db3457f14d8df3199db`.
- npm SHA-1: `8996fbf7fedc6d8f2de3154418f86cc22911d211`.
- SRI: `sha512-cb1eQD1wZEhJWb1dTLiAdYWqeUI5v7f+7EAHmetxBuELI9lo4cpAIfGEjald/PR4wTR80Fu5DFH+IaY1OKn+tg==`.

The canonical union was generated through pnpm in Design Core and copied
byte-for-byte into Notes. Patch SHA-256:
`debd3bc7d43917f0967f0cc1e212fc5c7721c751d3b92bf8f31030d1c96289ad`.

Its three independent repairs are:

1. Link Preview selection timeout ownership, cancellation and destroyed guard,
   preserving Notes' previously qualified timer repair. Released 2.20.2 already
   includes listener-safe cleanup; no duplicate listener hunk is needed.
2. Slider destroyed lifecycle plus six single/multi pointer-handler early
   returns. Released 2.20.2's Slider is byte-identical to the pre-fix 2.19.5
   implementation. Provenance is Plugins commit
   `201b1feb60fe97ee383ea30b061e453e1ad5e853`.
3. Idempotent FocusScope mount for the same connected DOM node, preserving
   intended focus instead of repeated close/open autofocus. This is the exact
   owner fix `692fbdf5095941464561189fd81ffc2cb4b81c6c`, upstream Bits UI PR #2264.

Expected installed SHA-256 values, under `dist/bits/`:

| Component file                                | Patched SHA-256                                                    |
| --------------------------------------------- | ------------------------------------------------------------------ |
| `link-preview/link-preview.svelte.js`         | `84ceb64f136ffd57c08973ffa70cdcbe8875000d10262244f2fc5dd36b626d14` |
| `slider/slider.svelte.js`                     | `99da433f4cc360138c73c4ba5d2a11083c4dc95720a09bbc8b7ec61e78d2f201` |
| `utilities/focus-scope/focus-scope.svelte.js` | `62c6ee5f7352531f61e465b38ae901bb9b3c2d1c3fb3d5bd7dc445e491a1e0f1` |

## Independent owner regression

Design Core's cold Linux command runs Search Filter Bar, AppShell and both Emoji
Picker story families, with two workers and no file parallelism. On official,
unpatched 2.20.2, source `a99a8d14fe581f326dff01c3f67faa3f8abf1930` produces
**31 passes and one failure**: Restricted Reactions leaves `No emoji selected`
after Enter instead of selecting the heart. With the same assertions and the
canonical composed patch, `938ac8fd956c4ff1d25f9de5390399a44ce176ab` passes
**32 cases, zero failures**. The owner receipt is
`design-core/spec/records/2026-10-31-temporary-bits-patch.md`. This source proof
is separate from Notes consumer acceptance and from any package release claim.

## Exact Notes baseline

Before adding the composed patch and override, the integrated frozen registry
candidate runs this cold Docker command:

```sh
pnpm test:storybook -- stories/api/Slider.stories.ts \
  stories/plugins/markdown/panels/OutgoingLinks.stories.ts \
  stories/plugins/markdown/panels/Backlinks.stories.ts -t 'Slider|Middle'
```

All **3 selected cases pass**, with 12 cases outside the explicit filter.
This is consumer baseline acceptance, not a reproduction of the owner defect.
Snapshot `ab279f6f`, run
`lapis-notes-validation-8a78929d-928b-4291-9572-8920cf6131f8`, retains JUnit,
container logs, frozen install, fresh package builds and browser execution.
Fatal runtime diagnostics and axe remain enabled.

The complete installed dependency traversal starts at all ten workspace roots
and follows declared runtime, peer and optional edges, including each workspace
root's development dependencies. Before adoption it finds the existing
timer-patched 2.20.2 plus unpatched 2.19.5. Unresolved peer/optional edges are
recorded separately; this is not a claim that every peer edge is resolved.

The first transport attempts stopped before worker creation; no product cases
ran. The ignored checkout configuration reuses the existing Tasks SSH control
socket while preserving Notes' own resource bounds, containers and lease.
It does not change tracked configuration, credentials or another agent's run.

## Composed installation and exact after acceptance

Frozen pnpm installation passes. All ten workspace-root traversals now resolve
exactly one reachable Bits 2.20.2 copy, with every component hash matching the
table above; zero reachable unpatched copies remain. Lockfile package metadata
changes only remove Bits 2.19.5; other package versions remain unchanged. Its
snapshot count changes from 1,709 to 1,708. Existing unresolved peer/optional
edges remain separately recorded, without a global peer-health claim.

The identical exact cold command passes **3 selected cases, zero failures**
after composition (12 cases outside the explicit filter), at snapshot
`a7b53722b38fd0f387892b1352e5bbc7c797804d`, run
`lapis-notes-validation-48ab711e-bf2f-436f-ba55-5e8b340c9734`. All five required
build/test tasks execute without cache hits. Validation-native's three tests
also pass after preserving main's complete lane coverage during merge conflict
resolution. The normal Changesets release-plan assembler selects only public
API **0.2.2 to 0.2.3**; private dependents retain their versions.

The Changesets status CLI cannot read Git HEAD in this separate JJ workspace;
its release-plan assembler runs directly against the same package/config/
Changeset data without changing bookmarks. Governed version CI remains required.

## Affected Notes families

The complete Slider, Backlinks, Outgoing Links and real Lapis Editor Demo
families pass **34 cases across four files**, with zero failures or skipped
cases. This cold Docker command removes the exact-case name filter and adds
`stories/workspace/lapis-editor-demo/LapisEditorDemo.stories.ts`. All five
required build/test tasks execute without cache hits. Snapshot
`b2d9c1a7454da53650696b35e2c48357acb89885`, run
`lapis-notes-validation-271356e3-9f48-4518-aaa9-3e04fad1b882`, retains the
frozen install, package build and JUnit receipts.

## Full package and specification qualification

The registry-only Docker `pnpm ci:release` invocation at snapshot
`84bd2f84320bb11b3ea61186e054e19028a2d6c5` passes all **27 build/check/test
tasks**, with no cache hits. All **2,054 package tests** pass, including 1,729
API tests and both failed-startup disposal regressions. Svelte checks retain
zero errors and warnings. Package policy, nine local-plugin tests, 100 release
regressions, specification validation/build/first, source audits, 67 specification
regressions and mapped specification checks also pass.

The aggregate then stops at package preparation's existing empty-JJ-working-copy
guard because this candidate is still a substantive uncommitted revision.
This is one packaging workflow failure after the passing source tasks, not a
product test failure. The guard is unchanged. Complete browser qualification,
commit the verified source, then retry packaging from the clean empty child.
Reports are retained under
`lapis-notes-validation-72fff533-496f-4915-94a8-5d5d426c8090`.

## Initial complete catalog failure and narrow reproduction

`pnpm ci:storybook-interaction` at snapshot
`837754fa6c8e9dce43e23fbdab34a4c8b502e3bb` passes 88 cases in the first shard
before one unhandled error: the browser connection closes while starting
`stories/plugins/ai/panels/Chat.stories.ts`. No failing product assertion is
reported, but six files remain incomplete and the aggregate correctly fails.
Run `lapis-notes-validation-c08439d1-626b-48ad-8203-7727d6a4f15d` is retained;
Docker reports overall `OOMKilled=false`, 12 GiB memory and 2 GiB shared memory.
That overall flag does not diagnose a possible child resource event.

Without source, environment, diagnostic or resource changes, the exact cold
Chat command passes **6 cases, zero failures** in
`lapis-notes-validation-1285696c-446f-41a4-97e8-436c119fe6e4`. A prior PR #51
hosted attempt and preserved root-owned diagnostic workspace show the same
boundary on earlier source, with a later unchanged hosted run passing all ten
required jobs. This supports investigating a pre-existing runner issue, but no
cause is proven and no failure is waived. The current candidate still requires
complete catalog and hosted qualification. The unchanged full retry collects
live cgroup memory events and peak usage without modifying tracked tooling.

## Complete current-source catalog and static acceptance

The unchanged canonical `pnpm test:storybook` retry passes **269 cases across
61 files**, with zero failures, errors or skipped cases. All four fresh shards
pass **99 / 67 / 46 / 57** cases. Its source is exactly the same
`837754fa6c8e9dce43e23fbdab34a4c8b502e3bb` as the failed invocation, not a
source or diagnostic workaround. Run
`lapis-notes-validation-5d437c40-9728-43fe-880d-9d07f558c327` retains four JUnit
receipts and complete per-invocation outcomes. Fatal Svelte and axe checks remain
unchanged. The original failed run remains separately retained.

Live cgroup observations during this passing retry reach **7,607,754,752 bytes**
peak, with zero high/max/OOM/OOM-kill events and zero PID-limit events. These
observations qualify this run's resource behavior; they do not establish the
cause of the earlier disconnect. The independent Linux traversal in this actual
browser worker confirms all ten roots resolve one patched Bits runtime and all
three resulting file hashes match the earlier local audit.

`pnpm ci:storybook-static` also passes a fresh static build and **six applicable
specification browser cases**, with the existing two development-only cases
intentionally skipped. Snapshot `1350b7f368807cebd030fb96e7ebe1af9d668e53`, run
`lapis-notes-validation-4d557ba0-5e20-40cf-8d56-ee59fdf35a3f`, retains that proof.
No visual baseline or approval state changes.

The development specification browser lane passes all **eight cases**, with no
failures or skips, in `lapis-notes-validation-941df8df-64af-428d-a319-7897904f47fc`,
snapshot `4253e3a1ae4d326b66bc1ced6da521f78872ce11`.

## Final canonical checks and release preflight

Root `pnpm check` passes the current canonical, Storybook parity, styling, App
ownership and metadata audits; all 16 package/build tasks reuse the independently
passing source results. Run
`lapis-notes-validation-769a2bde-3603-4683-9bac-b7fd13524ec3` retains this proof.
The final `pnpm spec:check` passes against exact published base `8f97e4ba`,
including spec-first, mdBook, configured source checks and all 67 specification
regressions, in `lapis-notes-validation-1d3e2c4c-b1ee-4acf-88e3-05337dd99530`.
Only evidence and backlog prose changed after the complete catalog snapshot.

Release preflight inventories all eight registered Notes workspaces and fetches
`codex-https` without further remote changes. The source candidate deliberately
combines the published baseline and PR #51. Default, notebook, private Desktop
profile, earlier release/security and root-owned browser diagnostic workspaces
are preserved; their unrelated work is not added to this public API patch.
The open dependency-image PRs are independent cache-pin proposals; none is a
missing product prerequisite of this source change.

## Qualification and release gates

Clean-candidate packaging and required hosted/package publication lanes remain
pending in this candidate.
Published API verification remains independent of the root patch. Review and
merge the qualified source PR and generated Changesets PR, then verify actual
npm bytes, dist-tags, source/tag identity and GitHub release assets before
claiming publication. Desktop must then prove its original native close case.

Remove the patch only after a released upstream runtime includes every remaining
component fix and passes that same complete qualification. A FocusScope-only
release cannot close the Link Preview or Slider removal gates. Visual baselines
remain unchanged and pending human review.

## Clean-candidate package preflight

After committing verified source `7df3e59c9505c49ace9330cb9081b354b4bef473`,
normal `pnpm packages:pack` passes from its clean empty JJ child. It restores all
nine previously qualified build tasks and retains the unchanged release guard.
Run `lapis-notes-validation-bc3a032d-a1b5-4ea4-a3a4-24a28bf18c42` records that
source identity and successful release-manifest preparation.

The registry and GitHub already contain UI 0.1.5, API 0.2.2, Language Service
0.1.2, File Explorer 0.2.0 and Workspace 0.3.1, so this pre-versioning plan selects
no unpublished artifacts. It does not publish the changed source as API 0.2.2.
The generated Changesets PR must first version API 0.2.3, whose actual tarball,
registry verification and GitHub release remain required before publication can
be claimed complete. Required hosted checks and Desktop adoption remain distinct.
