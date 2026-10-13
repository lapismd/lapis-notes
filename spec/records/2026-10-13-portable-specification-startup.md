# Portable specification-server startup

[PR run 38382310615, Storybook interaction job](https://github.com/lapismd/lapis-notes/actions/runs/38382310615/job/115246439686?pr=11)
passed all 243 interaction/accessibility tests in its four shards (84, 65, 40,
and 54). The development specification suite then failed before any of its
eight browser tests could start. Its Playwright web-server command called
`pnpm storybook`, which unconditionally prepared local sibling plugin tarballs.
The standalone CI checkout has no
`../lapis-plugins/.release/npm/manifest.json`, producing `ENOENT`.

The specification Playwright server now calls `pnpm storybook:installed`.
This starts the existing checkout-owned supervisor and environment loader
against the installed dependency graph, after Turbo's package-build
prerequisites. No install or sibling release preparation runs in that startup
path. The normal local-development command and explicit
`plugins:local:install` remain available for verified sibling-tarball acceptance.
Extracted plugins still resolve through installed npm exports; no source aliases,
package patches, changed browser assertions, or blanket script approvals were
introduced.

The focused regression imports the actual Playwright configuration and executes
its declared startup command in an isolated workspace without a sibling release
directory. It exercises the real environment loader and selected package script
up to the supervisor boundary, where it records the port and startup arguments
without launching the full browser catalog.

```sh
node --test scripts/spec-validation/specification-server.test.mjs
```

That exact target fails once with the original missing-manifest error and passes
once with the installed-graph startup. The regression is part of normal
`test:spec-validation`, including PR CI. Final development browser acceptance
remains pending the updated PR run; the full local suite is deferred at the
user's request. LN-CAT-117 records this startup contract. The original 1,365
requirements and verification rows remain preserved, with 1,376 requirements
including the explicitly recorded additions across this PR.

A focused runner check also prevents source-only Storybook-structure audits from
being classified as live browser acceptance merely because their task names
contain “storybook”. That narrow regression fails once before the task-name
classification fix and passes afterward. Such pure audits can now reuse their
results even when a developer has live controller settings.

Final `pnpm spec:check` passes all six configured lanes, App ownership and
metadata audits, and 38 specification-regression tests. Four focused
CI/routing/argument checks pass. Formatting and the original-contract
preservation audit pass; final browser acceptance remains in updated PR CI.
