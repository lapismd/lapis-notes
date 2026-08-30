# Releasing Lapis Notes packages

This repository publishes the reusable Lapis Notes packages from the
`lapismd/lapis-notes` monorepo:

1. `@lapis-notes/ui`
2. `@lapis-notes/api`
3. `@lapis-notes/language-service`
4. `@lapis-notes/file-explorer`
5. `@lapis-notes/workspace`

The first public version for each package is `0.1.0`.

## Release model

Changesets owns future version PR creation. The release workflow builds and
validates a release artifact on `main`. It calls the same parallel CI workflow
used by pull requests, downloads the candidate produced from that exact source
commit, and then:

- stops with a manual-publish notice while a package is not yet registered on
  npm;
- publishes later releases through npm trusted publishing with OIDC after each
  package has a trusted publisher configured;
- verifies the installed npm packages in a clean registry-only consumer; and
- creates package-scoped GitHub releases with changelog and checksum evidence.

Configure one npm trusted publisher per public package:

- repository: `lapismd/lapis-notes`
- workflow: `release.yml`
- environment: `npm-production`

## First manual publication

Run the full local release validation from a clean repository:

```sh
pnpm install --frozen-lockfile
pnpm spec:first
pnpm spec:check
pnpm release:check
pnpm packages:check
pnpm ci:packages
pnpm packages:pack -- --already-built
pnpm ci:release
pnpm release:plan -- --registry https://registry.npmjs.org
```

For Linux parity, run `pnpm ci:container`. The dependency image must have a
non-null digest in `.ci/images.json`; the image contains a lockfile-warmed pnpm
store but never repository source or reusable `node_modules`. The optional
signed Turbo cache values belong in the ignored root `.env` described by
`.env.example`. Use `pnpm ci:container -- --remote-cache` to require all four
cache values, or `--no-remote-cache` to prove a cold/fail-open execution.

Before publishing each package, verify the registry still does not contain the
exact version and inspect the tarball entry in `.release/release-manifest.json`.
Publish only the reviewed tarball, one package at a time, in graph order:

```sh
npm publish .release/tarballs/<package>.tgz --tag next --access public --registry https://registry.npmjs.org
```

After each manual publish, run the plan again to confirm that package is now
visible before moving to the next package:

```sh
pnpm release:plan -- --registry https://registry.npmjs.org
```

Create GitHub releases from the verified manifest after all manually published
packages are registry-verified:

```sh
pnpm release:verify
pnpm release:notes
```

The first manual publish intentionally does not use npm provenance. Future
workflow publishes use npm trusted publishing and provenance through GitHub OIDC.

## Automated validation and publication

The reusable Lapis CI workflow builds packages once through Turbo and then runs
governance, quality, unit, static Storybook, Storybook interaction/accessibility,
and release-candidate jobs concurrently. Its stable `validate` job is the
branch-protection target. Visual comparison remains non-blocking.

Ordinary pushes to `main` prepare and retain a verified `.release` artifact but
do not publish it. A manual Release workflow run with `publish` enabled may
publish only after the reusable validators pass, the candidate reports work,
no bootstrap publication is required, and the `npm-production` environment is
approved. The publish, registry verification, and GitHub release jobs reuse the
same candidate checksums and source commit.

## Storybook Pages

The Storybook Pages workflow builds the root Storybook and deploys
`storybook-static` to:

<https://lapismd.github.io/lapis-notes/>
