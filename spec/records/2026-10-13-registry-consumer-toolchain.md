# Registry-consumer toolchain acceptance

The temporary consumer in [release run 38375257253, attempt 2](https://github.com/lapismd/lapis-notes/actions/runs/38375257253/attempts/2)
selected pnpm 12.11.2 even though CI started with pnpm 10.34.5. Its missing
build policy then rejected esbuild, onnxruntime-node, and protobufjs before
public-export checks or the Vite build.

`scripts/verify-release.mjs` now generates the consumer with the root's exact
`packageManager` pin and a minimal `pnpm-workspace.yaml` containing only its
approved `onlyBuiltDependencies`. Missing or unpinned package managers and
malformed approval lists fail before installation. Repository overrides,
patches, workspace links, and local hooks are not copied; dependency scripts
remain subject to the existing allowlist.

## Focused regressions

The two generated-consumer regressions failed before the fix. All four tests in
`scripts/verify-release.spec.mjs` pass afterward, including malformed-input
coverage. They inspect the actual generated files at the installation boundary.
The combined verifier, release-manifest, and CI-image tests pass 20 tests.
LN-PKG-157 and LN-PKG-158 are new requirements; original requirements and
verification entries remain unchanged.

## Published npm acceptance

The acceptance used the actual release artifact from run 38375257253, for
commit `91bf2195c307286c87718f77824b73d1fe028339`, downloaded with:

```sh
gh run download 38375257253 --repo lapismd/lapis-notes \
  --name lapis-notes-release-91bf2195c307286c87718f77824b73d1fe028339 \
  --dir tmp/published-acceptance-38375257253
pnpm release:verify --manifest tmp/published-acceptance-38375257253/release-manifest.json
```

The manifest selects `@lapis-notes/file-explorer@0.1.2` and
`@lapis-notes/workspace@0.2.0`. The generated consumer also installs the
already-published UI 0.1.2, API 0.1.2, and Language Service 0.1.1 dependencies.
Verification passes registry installation, the Vite production build, and
public-export resolution, ending with `Published package verification passed.`
The captured log is `tmp/published-verification.log`. No packages were published
by this change.

Final full package and browser verification is delegated to pull-request CI at
the user's request. Local acceptance here is limited to focused checks and the
published-package consumer.
