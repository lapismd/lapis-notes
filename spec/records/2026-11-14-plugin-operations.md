# Native plugin operation API source qualification

LN-PLUG-129 adds generated operation descriptors, manifest declaration validation,
availability resolution and an App-owned native observer. The session port takes
precedence over an explicit App option. Metadata teardown drains accepted
observation without cancelling native work. Public exports include author docs.

The original contribution inventory changed from one failure to nine passes;
operation tests cover declarations, unsupported/unavailable/incompatible hosts,
and detach with an accepted request. Final API acceptance is 1,788 tests in 177
files, with type checks, built public exports, publint and packed type contracts.

Docker root check, test and build pass. The root test snapshot contains 2,133
package tests before the additional availability case. The complete cold
Storybook interaction/accessibility lane passes 276 scenarios. Specification
validation initially reported six missing mapped chapters; their lifecycle and
boundary documentation is now updated, and spec:check passes with 67 validator
tests. Validation reports remain in the checkout-owned `.local/validation/runs`.

Commands: `pnpm check`, `pnpm test`, `pnpm build`, `pnpm spec:check`,
`pnpm test:storybook`; focused/public package commands use
`pnpm --filter @lapis-notes/api test`, `check:types`, and `build`.

Server owns HTTP/MCP/CLI, native credential controls, Tasks provider intake and
hosted cold-process acceptance. This source receipt does not qualify deployment,
Desktop integration or npm publication. Changesets records the public API change.
