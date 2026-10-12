# PR 4 CI Deno runtime repair

The first Lapis CI run for PR 4 failed in `build-cache` at
`@lapis-notes/deno-host-services#build`: `sh: 1: deno: not found`. Four build tasks
completed before the failure; downstream acceptance jobs were skipped and the
aggregate failed. This is provisioning evidence, not a source typecheck failure.

The shared toolchain image promises Node, pnpm, Playwright/Chromium and mdBook.
Notes owns the additional application-runtime requirement. Its shared CI action
now installs official Deno `2.9.7` using the commit-pinned Node 24 setup action,
then verifies the exact Deno version before frozen installation or package tasks.
The same action is used by validation, package release and Storybook Pages jobs.
The shared image repository and its release contract are unchanged.

The executed shell-contract regression initially recorded three failures and one
pass. After the fix all four tests pass: missing Deno is rejected, a wrong version
is rejected, the complete pinned toolchain passes, and provisioning precedes
verification and installation. The regression runs inside the existing release
workflow test lane. Full source/browser/artifact acceptance remains in GitHub CI.

Source CI can proceed with this action-based runtime setup. The optional local
container runner still needs a Deno-equipped image for full native parity; a
host installation does not provide a binary inside the existing container.
