# Sync host release reconciliation — 14 October 2026

Status: source candidate reconciled in the default workspace; PR/release
qualification remains pending. This is the Notes public-package checkpoint
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

Full cold catalog, packed consumers and required PR/release gates remain
pending. Existing prior qualification is supporting evidence; it does not
replace current release checks.

## Completion boundary

This candidate exposes the qualified generic host and editor contracts. It does
not connect Deno signed-event/object routes, production apply, independent Mira
writer registration, complete navigation or the Sync plugin. Published npm
artifacts and registry-only consumer verification are required before this
checkpoint is complete. Stop at the agreed session budget with the concrete
PR and exact pending gates if publication cannot finish within it.
