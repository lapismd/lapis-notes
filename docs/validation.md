# Local validation

`pnpm check`, `pnpm test`, `pnpm build`, `pnpm spec:check`,
`pnpm test:storybook` and the other portable lanes in
`scripts/validation/lanes.json` default to Docker. A missing image is built
automatically. Docker errors fail the command; they never rerun on macOS.
Hosted CI explicitly selects its already-provisioned native environment.
Platform-native packaging, live-provider acceptance and visual baseline approval
remain independent lanes.

## Images and execution

```sh
pnpm validation:doctor
pnpm validation:images
pnpm validation:smoke
pnpm validation:check
pnpm check:storybook-parity
pnpm test:storybook -- stories/plugins/ai/AiLiveHost.stories.ts
```

Images are fingerprinted by the pinned Docker recipe, tool installer, target
and daemon architecture. Application manifests and locks belong to dependency
caches, so ordinary dependency changes cannot rebuild the tool image. Use
`pnpm validation:images -- --rebuild` to rebuild explicitly.
Explicit native Rust lanes select the full image automatically. JavaScript root
checks, tests, builds and specification lanes use the UI image and do not require
the removed root Cargo workspace. Prepare the full image with
`pnpm validation:images -- --target full`. Its recorded sibling revisions are in
`scripts/validation/native-sources.json`; the runner transfers those committed
sources, never another workspace’s dirty tree.

Each run transfers the exact tracked Jujutsu working-copy revision and ancestry,
including from an isolated workspace. Secrets, ignored local configuration and
host node_modules are not transferred. Frozen registry installs and persistent
pnpm/Turbo volumes are keyed by dependency and tool identities. JavaScript and
native caches use separate keys: UI archives/pnpm locks cannot cold-bust Cargo,
and native pins/Cargo locks cannot cold-bust JavaScript stores. Both use the
exact image identity; Cargo still validates source fingerprints. Inputs come
from the transferred snapshot and reports record both cache identities. Browser suites
run bounded sequential shards; explicit file, test and shard arguments stay
literal. Runs use bounded CPU, memory and shared-memory limits. No host source
bind mount or Docker socket is exposed inside a worker.
Workers retain an init reaper and drop all Linux capabilities. The smoke checks
denied file reads and directory writes, so root cannot mask native permission
regressions through discretionary-access overrides.

## Move the test load to another machine

Local Docker still consumes this Mac's resources. To run on another machine,
create a Docker context for its daemon and save ignored
`.local/validation/config.json`:

```json
{
  "context": "my-linux-host",
  "transport": "ssh-cli",
  "cpus": 4,
  "memoryGiB": 12,
  "shmGiB": 2
}
```

Omit `transport` for ordinary Docker context transport; `ssh-cli` streams source,
build context and reports through the SSH endpoint configured in that context.
No local path needs to exist on the remote host. Explicit environment overrides
are `LAPIS_NOTES_VALIDATION_CONTEXT` and
`LAPIS_NOTES_VALIDATION_RUNTIME`. For an intentional host run:

```sh
LAPIS_NOTES_VALIDATION_RUNTIME=native pnpm check
```

`LAPIS_NOTES_VALIDATION_ARCHIVES` may name an ignored JSON array of
`{name, version, path, sha256}` package archives for documented temporary
consumer qualification. Registry-only installation is the default. Archive
identity and checksum are verified; tracked manifests and locks stay portable.

## Reports and cleanup

Native daily-provider authoring uses `pnpm capture:native-daily-reference` to
collect `test-results/daily-provider.json` from the actual API provider and
Luxon formatter. The artifact is reviewed and frozen separately; ordinary
`pnpm test:native-daily-reference` compares it without rewriting expected bytes.
Neither capture nor source replay qualifies native persistence or host defaults.

Reports are copied to `.local/validation/runs/<run>/`, including the exact source,
image/tool identities, invocation outcomes and available test/build reports.
Npm pack outputs persist in the run’s `.release_npm/` directory, including the
manifest and archive checksums. Docker builds qualify Linux outputs; use the
explicit native override when building macOS application artifacts.
Failures retain their container for inspection. Use `pnpm validation -- collect
<run>` to retry report collection, `pnpm validation -- stop <run>` to stop an
owned run, and `pnpm validation -- clean` to preview cleanup. `clean --apply`
removes stopped owned runs after collection; add `--caches` only to explicitly
remove unused owned cache volumes. No global Docker prune is used.
Only completed `exited`/`dead` workers qualify for cleanup. Created, paused,
running or unreachable workers keep their workspace lease; an SSH failure is
not proof of completion. Collection and cleanup use verified immutable IDs.

## Story composition

`stories/catalog/story-parity.json` is the explicit inventory under LN-CAT-118.
Application stories must reach public `WorkspaceShell` through the actual
selected render path, including imported factories and literal props. An unused
shell import cannot qualify a replacement. Duplicate roots, replacement
children, production-style overrides, unresolved alternate branches and
unisolated synthetic controls fail checks. Mixed families use named story
overrides; missing, removed or stale entries fail closed.

Focused component stories name the real public subject. Imperative registry
integration fixtures declare a governing requirement and specific purpose;
they do not claim application-shell parity. Prototypes follow that same explicit
exception policy. Updating a declaration requires review of the rendered path,
not just its title or metadata component.

`FixtureControls.svelte` provides padded dotted-border setup controls. Overlay
placement keeps synthetic actions outside production shell geometry; focused
component and manual attachment fixtures may use inline placement. Functional,
axe and visual approval remain separate. This change does not update PNGs.

`pnpm validation:consumer-pack` builds and packs the six public Notes host
packages into ignored `.release/validation-packages`, with a SHA-256 archive
inventory and exact source provenance. Docker reports collect these for temporary
consumer qualification. This command creates no release candidate or publication. The cohort includes the
publishable application profile and its built workspace-session exports.
For registry-only qualification when a saved local configuration selects archives,
pass `LAPIS_NOTES_VALIDATION_ARCHIVES` pointing to an ignored JSON file containing
`[]`; receipts must show an empty archive list.

## Explicit native provider qualification

Hosted provider transport and screen qualification live outside this
repository. This checkout does not seed bootstrap credentials, build that
image, or launch that binary. Portable Docker validation is not native
qualification.

`pnpm test:web:e2e` routes the complete PWA browser lane through the same
bounded Docker worker. Its uncached Turbo task preserves selectors and normal
registry acceptance; supplied fixture qualification remains distinct.
