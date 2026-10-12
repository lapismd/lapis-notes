# Design Core refresh and framework release start

On 2026-10-12 the user confirmed the Design Core release and requested consumer
dependency updates plus the next repository release. Live npm metadata confirms
`@lapismd/design-core@0.3.2` and its successful protected release workflow.

Notes is next: it owns the UI, API registry schema, language service, File
Explorer and Workspace packages required by plugins and the static registry.
The root and six consuming workspace package manifests require `^0.3.2` wherever
they declare Design Core. The pnpm lockfile is refreshed without loading the
ignored local validation hook, and retains npm integrity. Public package versions
remain owned by Changesets; this preparation does not hand-edit versions.

The update is limited to the released provider. The pnpm package and snapshot
inventories retain their counts and replace only the Design Core 0.3.1 entry
with 0.3.2. Existing peer graph references follow the new entry. Final source,
browser, host and packed acceptance remains delegated to GitHub CI as requested.

Deno initially refused the release because its default minimum dependency age
is 24 hours. The lockfile refresh uses a one-command age override for this
explicitly requested, verified first-party release; persistent policy is unchanged.

After framework publication, refresh the Plugins and static registry consumers
against the actually published framework versions. Plugins cannot complete a
registry-only install while its required API `^0.1.1` is unpublished. Keep
Community parked and relay discovery deferred. Package publication, signing and
registry deployment remain separate workflow gates.

## Preparation evidence

- Registry-only pnpm lockfile generation succeeded with `--ignore-pnpmfile`.
- A frozen install succeeded with hooks and lifecycle scripts disabled; the
  installed Design Core version is `0.3.2` from npm, with the exact published
  SHA-512 integrity. Product builds and acceptance remain CI gates.
- Deno lockfile generation succeeded using the existing sloppy-imports host
  mode and the scoped dependency-age override. Its previously stale graph also
  materialized the current controller/native imports and normalized peer
  contexts: 131 npm keys added, 65 removed, plus 20 selector keys added. This
  is recorded separately from pnpm's single-provider replacement.
- `pnpm release:check` passed both configuration and workflow checks.
- Changesets status selects UI/API/File Explorer `0.1.2` and Workspace `0.2.0`.
  Language Service is already an unpublished `0.1.1` candidate and is included
  by the public release planner. No package version was hand-edited here.
- Full functional, Storybook, host and artifact verification is pending in CI.
- The focused spec-first check initially reported five missing mapped chapters;
  after documenting the dependency refresh in those owners it passed for eight
  protected files and eleven canonical chapters. The release metadata and
  manifest-range checks also pass.
