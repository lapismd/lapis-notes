# Released Core and Mira qualification

The candidate above `73c4b61c` consumes released Design Core `^0.13.2` with
Mira `~0.2.0`, retaining the deferred plugin-discovery implementation from
PR #100. Core source/release run `43544917962` passes installed-package and
provenance verification. Its public tarball independently matches the retained
verified artifact, SHA-256
`67dd4396df5b72fe10dd3cc122bbc5f309071a5cb5737b7b0208e3b8a1e8953f`.

Root, API/UI development graphs and the Web, application-profile and reusable
Workspace consumers resolve that registry floor. Existing broad API/Core peer
contracts remain unchanged. The Workspace patch Changeset accompanies the
existing API minor release intent; no modified old-version archive is published.

Qualified source snapshot: `bd7f53548acd64221459e74b8733a004fa9a6cf9`.
The final addition of this record changes documentation only.

- Frozen registry installation and complete canonical specification pass.
- Whole PR spec-first passes seven protected files and nine mapped chapters.
  The first per-slice check identified two missing unchanged-host confirmations;
  both were restored without weakening the map.
- All 16 quality tasks, complete unit lane (2,131 reported cases including 1,785
  API cases), all nine build tasks and package lint pass in Docker.
- The first complete catalog run passes 102, 70 and 47 cases in its first three
  shards. Its fourth shard reports one browser transport disconnect before
  collecting the two Link Preview cases (55 cases execute successfully).
- A cold focused Link Preview run passes 2/2; a cold complete fourth shard
  passes 57/57. The unchanged full `pnpm test:storybook` command then passes all
  four shards, retaining the first three exact-source successful cached results
  and executing the fourth again. All 276 catalog cases are qualified.

No assertion, browser configuration, timing, accessibility policy, quarantine or
visual baseline changes. The transport error remains recorded separately; no
claim of an upstream browser fix is made. Required hosted CI, package versioning,
publication and consumer admission remain separate gates.
