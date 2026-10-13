# Dependency-image refresh after a lockfile update

Main run `38324923012`, job `115061263079`, stops in
`Prepare dependency-only build context` with `Dependency image manifest is stale
for pnpm-lock.yaml`. The producer was applying the consumer's strict old-pin
validation before it could build the new lockfile image. The digest updater also
left the old hash and tag behind, so it independently failed after writing a new
digest.

The producer now validates the image configuration and immutable base, derives
fresh hash/tag metadata from the current lockfile, and leaves the checked-in
dependency pin untouched while preparing the context. The digest updater writes
the current hash, current tag, and verified build digest together. Strict image
consumption continues to reject stale metadata and missing digests. Invalid
digest input does not rewrite the manifest.

Evidence:

- The original context-generation CLI fails before the repair and succeeds
  afterward against the unchanged current lockfile. It emits
  `lock-94d5f9a010fea20a` and the matching full SHA-256 to context metadata and
  GitHub outputs.
- `node --test scripts/ci-images.test.mjs`: existing baseline 3/3; new
  regressions 6 passes/2 failures before implementation, then 8/8 afterward.
  The digest-update regression executes the actual CLI in an isolated fixture.
- `pnpm release:test`: 39/39, including all directly affected image and local
  container tests. These regressions now run in the normal CI unit lane.
- `pnpm spec:check`: specification, ownership, metadata-query and all 27 Node
  specification tests pass.

The repair does not build or publish an image locally, change its existing pin,
publish npm packages, or merge into protected main. The PR must pass required CI
before merge; the existing main-triggered workflow then builds the image and
proposes its verified digest pin through a separate automation PR.
