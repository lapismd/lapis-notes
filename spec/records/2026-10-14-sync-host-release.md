# Sync host release reconciliation — 14 October 2026

Status: [source PR #28](https://github.com/lapismd/lapis-notes/pull/28) is draft;
CI repair verification and publication remain pending. This is the Notes public-package checkpoint
under the Plugins incremental delivery plan's stage 0B. Sync landing and
activation remain later checkpoints.

## Remote refresh and preserved input

Fetched both remotes. Current main is
`9fed4f1577a6beb27168d0b83b9ea42408d4f1b1`, including Homebrew distribution PR
#26. The default workspace now contains that main plus the preserved audit
and qualified host/API changes. The original audit stack, generated metadata
edit and qualified runtime stack remain recoverable through named references.
Unqualified navigation at `local/sync-navigation-pending-20261014` is excluded.

The audit commits `a60b5bd6` and `63fb3b83` were copied onto remote main.
Their root script conflict is resolved by retaining both the published desktop
release tests and the local dependency-security tests. Package JSON initially
failed to parse at one conflict marker; the exact parser/registration check
passes after resolution, and the combined 17-test family passes.

Copied the 15 qualified commits ending at
`5f672a5a100947abf4258ae9f66c3a59d94e38f1` and consolidated the copies into
one source candidate. Original commits and records remain unchanged. Runtime
changes retain their original implementation; reconciliation repairs canonical
text and public host metadata against current main.

Remote main and the unpublished Sync branch independently allocated Deno IDs
079–087. Preserve published Homebrew definitions 079–085 and assign the nine
unpublished Sync definitions 086–094. Their wording, acceptance evidence and
references are retained. Both current registry/App URL text and new host
contracts survive the documentation conflicts. The moved ARCH-095 row retains
remote main's CI-image evidence.

The initial unrelated metadata edit updates existing API module versions to
0.1.3. The release candidate's normal generator retains those current versions
alongside the required new public module entries. Its original snapshot remains
recoverable. Loader configuration and ordinary development data are untouched.

## Focused evidence

- Before transfer, the exact API writer/session/crypto command passes 24
  existing cases in two files; the new session file is absent. After transfer,
  the same command passes 69 cases across all three files.
- Frozen registry install uses `--ignore-pnpmfile`, preserving manifests and
  bypassing the ignored local-tarball hook.
- Normal audit passes under the unchanged, explicitly approved QMD exception;
  its one high-severity underlying finding remains. Production audit has zero
  findings. This reconciliation adds no exception.
- Specification validation passes 10 validators, 172 chapters and 1,439
  requirements. Explicit spec-first covers 80 protected paths and 23 canonical
  chapters; release intent passes. All 172 rendered specification mirrors are
  current.
- All ten root build tasks pass, including API declarations/publint, native
  service checks and Web/desktop output.
- Full root check/test pass all 18 tasks each. API has 964 passing cases;
  native services 98, desktop 296 plus its existing integration skip, server
  28, Web 55 and Workspace 25. All relevant Svelte checks report zero errors
  and zero warnings.
- All 18 editor-demo interaction/accessibility stories pass from a fresh browser
  run. No visual baselines changed.
- A comparison against the initial metadata snapshot verifies all 34 existing
  API module version values are retained. Published Homebrew requirement
  definitions in packaging-and-acceptance remain byte-identical to remote main.

Exact focused commands:

```sh
pnpm --filter @lapis-notes/api exec vitest run \
  src/lib/__tests__/file-editing-sessions.test.ts \
  src/lib/__tests__/sync-host.test.ts \
  src/lib/__tests__/editor-persistence.test.ts
node --test scripts/dependency-security.spec.mjs \
  scripts/desktop-release.test.mjs scripts/desktop-release-workflow.test.mjs
```

The complete cold catalog passes 249 interaction/accessibility stories across
four fresh shards (90, 65, 40, 54). Static Storybook renders all 172 chapters.
The API and Workspace versions in source are already published, so the package
planner selects no tarballs at this source-PR stage. Actual packed-consumer and
npm verification follow the Changesets version PR; this no-work result is not
packed-artifact acceptance.

## CI findings and bounded repair

The [initial source CI](https://github.com/lapismd/lapis-notes/actions/runs/38640300007)
passes ten required jobs, including governance, quality, full catalog, Web
acceptance and both packaged desktop lanes. Unit and its aggregate job fail:
the 20 MiB native bridge case exceeds its unchanged five-second budget on
Node 24.15.0. It passes locally on Node 26, and takes 2.47 seconds when isolated
locally on Node 24.15.0. The Linux x64 desktop-release lane fails the same case.

Optimize the existing codec rather than changing size, assertions, timeouts or
wire format. Node uses its native Buffer conversion when Uint8Array base64
methods are unavailable; other hosts retain the portable path. Portable decode
preallocates its output, and Node decoding copies only payload bytes into an
independent buffer. The existing native/fallback case now also proves Node
equivalence and isolation from pooled backing bytes.

The exact Node 24 20 MiB target passes in 512 ms afterward. Its complete
codec/bridge family passes 36 cases, and all 296 desktop cases pass on Node 24
with the existing one integration skip. Desktop check has zero errors/warnings
and its build passes. Frozen Deno checks pass. Root check/test/build then pass
again (18/18/10 tasks), and explicit spec-first covers the two changed runtime/
test paths plus all three mapped canonical chapters. CI revalidation is
required before calling the timeout resolved on hosted runners.

The separate Linux ARM desktop-release lane fails the unchanged compiled
AI-controller integration target: no completed event appears within its
20-second polling budget. This is separate from the passing classic packaged
desktop lanes and the default local integration skip. Root cause remains open;
no controller workaround or assertion change is added.

The candidate's aggregate second catalog shard logs five caught AI Catalog
line-range errors while passing all 65 cases. Its exact six-story Catalog
family passes cleanly in isolation. The same second shard on refreshed main
plus the audit commits passes 65 cases without those diagnostics. This
candidate-dependent lifecycle diagnostic remains open for a focused follow-up;
zero assertion/accessibility failures do not imply diagnostic-free operation.

No assertion, timeout, test size, audit policy or visual baseline is weakened.
The default workspace is back on the source candidate after the temporary
baseline comparison; no new implementation workspace was created.

Existing prior qualification is supporting evidence; it does not replace
current release checks. Keep the PR draft and withhold publication while the
remaining CI and lifecycle findings are unresolved.

## Completion boundary

This candidate exposes the qualified generic host and editor contracts. It does
not connect Deno signed-event/object routes, production apply, independent Mira
writer registration, complete navigation or the Sync plugin. Published npm
artifacts and registry-only consumer verification are required before this
checkpoint is complete. Stop at the agreed session budget with the concrete
PR and exact pending gates if publication cannot finish within it.
