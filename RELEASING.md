# Releasing Lapis Notes packages

This repository publishes the reusable Lapis Notes packages from the
`lapismd/lapis-notes` monorepo:

1. `@lapis-notes/ui`
2. `@lapis-notes/api`
3. `@lapis-notes/workspace`

The first public version for each package is `0.1.0`.

## Release model

Changesets owns future version PR creation. The release workflow builds and
validates a release artifact on `main`, then:

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
pnpm packages:pack
pnpm check:all
pnpm build-storybook
pnpm release:plan -- --registry https://registry.npmjs.org
pnpm release:prepare -- --registry https://registry.npmjs.org
```

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

## Storybook Pages

The Storybook Pages workflow builds the root Storybook and deploys
`storybook-static` to:

<https://lapismd.github.io/lapis-notes/>
