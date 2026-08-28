# Changesets

Use Changesets for future public package version PRs in this repository.

The initial `0.1.0` publication is a manual bootstrap from reviewed tarballs.
After npm trusted publishers are configured for each public package, the
release workflow builds the release artifact, publishes eligible already-known
packages through npm OIDC, verifies the registry install, and creates
package-scoped GitHub releases.

Public packages are released independently in dependency order:

1. `@lapis-notes/ui`
2. `@lapis-notes/api`
3. `@lapis-notes/workspace`
