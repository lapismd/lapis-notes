# Lapis Notes CI images

Lapis Notes CI uses two public, multi-architecture GHCR images:

- `ghcr.io/lapismd/lapis-ci` supplies the pinned Node, pnpm, Playwright,
  Chromium, mdBook, and system toolchain.
- `ghcr.io/lapismd/lapis-notes-ci` extends that toolchain with a pnpm store
  fetched from this repository's manifests, patches, and lockfile.

`.ci/images.json` records both immutable digests and the full lockfile hash.
Workflows and local container runs consume digests, never mutable tags. The
dependency image deliberately excludes repository source and `node_modules`;
the shared `ci-setup` action always runs a frozen, prefer-offline install for
the checked-out commit.

Notes validation also requires Deno `2.9.7`. The Notes `ci-setup` action installs
and verifies that pinned runtime before package tasks; the base image inventory
above does not include Deno. Local container acceptance needs an image with Deno
provisioned as well; installing it on the host does not expose it in a container.

## Refreshing the dependency image

Changes to `pnpm-lock.yaml`, `pnpm-workspace.yaml`, package manifests, patches,
or the image build inputs trigger `dependency-image.yml` on `main`. The workflow
builds AMD64 and ARM64 images with provenance and an SBOM, publishes the
lockfile tag, and opens or updates an automation PR containing the verified
digest. Merge that PR before changing CI workflows to consume the new layer.

The producer derives its hash and tag from the current lockfile, even when
`.ci/images.json` still describes the previous dependency image. Preparing the
build context preserves that old pin; the verified digest PR updates the hash,
tag, and digest together. The updater also records those values in generated
snapshot blocks in Architecture, Packages, and Specification Governance. The
automation PR stages all three chapters with the manifest and passes the normal
spec-first gate. Missing chapters or malformed markers stop the updater before
it changes the pin. Consumers continue to reject a stale pin or a missing
dependency digest.

If the checked-in dependency digest is null, `pnpm ci:container` fails closed
with an actionable error instead of falling back to a mutable tag.

## Local parity and remote cache

Run the default release validation in the native Linux architecture:

```sh
pnpm ci:container
```

Pass a narrower command after `--` when iterating:

```sh
pnpm ci:container -- --no-remote-cache -- pnpm ci:packages
```

The runner bind-mounts source and uses lockfile-keyed named volumes for the pnpm
store, root/package `node_modules`, and `.turbo`. Copy `.env.example` to the
ignored root `.env` for local cache testing. `--remote-cache` requires all four
signed-cache values; `--no-remote-cache` proves the same command without the
service. Secrets must remain in the ignored `.env` or organization secrets and
must never enter this image, its build context, logs, artifacts, or commits.

## Storybook cache tasks

CI, Pages, and the local `ci:release` parity script invoke `node scripts/run-turbo.mjs ci:storybook-static --summarize`.
The static task restores `storybook-static` and `.visual-delta/cache` on a hit;
on a miss it runs the existing build and specification-index audit. CI invokes
`ci:storybook-interaction` through the same wrapper for the complete four-shard
interaction/a11y sequence. Only successful results are cached. Both tasks
depend on workspace builds, and each workflow reports the Storybook cache
result separately from package restoration.

The cache includes tracked root inputs, directly aliased workspace sources,
package/build configuration, dependency metadata, CI image/setup configuration,
and actual Node version/platform/architecture. CI mode, Node options, and
Playwright browser path are hashed. Cache-service tokens do not affect result
identity. Remote cache absence retains normal execution.

Manual `pnpm build-storybook` and `pnpm test:storybook` remain direct commands
for development and live-host acceptance. Cached CI tasks omit live controller
and terminal credentials from their strict task environment.

API build caches include the generated source host-module catalogue alongside
`dist`. A fresh checkout therefore receives the same generated source as a
fresh build before Storybook's source aliases read it.
