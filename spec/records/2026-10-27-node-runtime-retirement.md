# Staged Node runtime retirement

Recorded 2026-10-27 13:09:47 UTC. These changes are staged in the default Notes
workspace; actual native image and cold hosted acceptance remain separate gates.

The obsolete Node application server and its private Rust companion are removed:
59 tracked files under `packages/server-node` and `packages/server-native`, plus
the old launcher, Web Node backend, Node browser runtime/journey and Playwright
configuration. Web no longer depends on the private Node package. Frozen Deno,
its portable host services, public compatibility runtime values and JJ Store's
unrelated collaboration companion remain intact. Ignored retired bootstrap
secrets and compiler caches are preserved and continue to be ignored.

Validation now fingerprints only the application Cargo lock and pinned native
sources. Native cache schema advances to 3, invalidating obsolete compiler-cache
identities while preserving JavaScript cache ownership. The exact command
`node --test scripts/validation-cache.test.mjs scripts/validation-images.test.mjs`
changed from **0 passes / 6 failures** without a companion lock to **6 passes /
0 failures** after retirement. Final broad tooling and host validation are pending.

## Registry release-input blocker

The attempted normal-registry refresh was:

```sh
pnpm install --lockfile-only --ignore-pnpmfile --ignore-scripts
```

It failed with `ERR_PNPM_FETCH_404` for the existing AppProfile dependency
`@lapismd/agent-ui@^0.1.0`. The tracked lock already lacked that package before
this slice; source qualification uses the documented explicit public-archive
cohort. Agent UI publication/registry availability owns this release-input
blocker. No publication or private archive resolution was added to the lock.

The bounded lock update removes only the deleted Node importer and Web's Node
dependency entry. Parsing confirms all existing package resolutions and
dependency snapshots remain identical to the parent. Unreachable registry
snapshots are retained. This does not establish a successful frozen registry
install or resolve the separate Agent UI release gate.
