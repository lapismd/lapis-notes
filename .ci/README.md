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
tag, and digest together. Consumers continue to reject a stale pin or a missing
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
