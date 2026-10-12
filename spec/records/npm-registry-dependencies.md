# Published foundation dependency refresh

The root and consuming workspace manifests use Design Core `^0.3.1`, Mira
`~0.0.3`, Spec Validator `^0.1.4`, and the existing Mira editor, AI, and Mermaid
packages at `~0.0.2`. Direct installed package origins are npm registry entries.
The API type check uses the published Design Core declarations, with its former
Design Core shim mappings removed.

The ignored local hooks retain the existing plugin, Community, and AI Controller
mappings. The tracked local-plugin helper excludes the requested foundations
from both tarball remapping and install fingerprints. Its mixed-manifest
regression changed from one failure to one pass; the complete helper suite has
nine passes after formatting.

Validation on 2026-10-11:

- `pnpm --filter @lapis-notes/api check:types` passes against public declarations.
- API unit suite: 799 passes in 90 files.
- Final File Explorer check: zero errors and warnings.
- Root `pnpm check`: one desktop Vite configuration type error remains. The
  retained Community build plugin resolves a different Vite peer graph with
  Node 26 types while the host resolves Node 22 types. No cast or shim is added.
- `pnpm spec:check` passes, including the source ownership audits and 19
  specification-validation tests.
- `node scripts/prepare-local-plugin-consumer.mjs` remains blocked by an existing
  `@lapis-notes/ai` tarball checksum mismatch. Foundation tarballs are excluded
  before checksum and fingerprint checks; the plugin checksum gate is retained.
- Full application build, unit, Storybook, and host acceptance remain pending.

The committed registry lockfile baseline already omitted unpublished
`@lapis-notes/community`, `@lapismd/lapis-community`, and
`@lapismd/ai-controller`. The refreshed registry dependency graph was generated
in a temporary metadata project omitting only those unavailable entries.
Actual local acceptance uses the retained ignored hooks with
`pnpm install --lockfile=false --force`, preserving the tracked registry lock.
This is a documented temporary validation arrangement; a full frozen registry
install is not qualified until those prerequisites are published. A partial
Deno lock rewrite from checks was discarded; Deno host qualification is pending.

The migration remains uncommitted while required consumer lanes are blocked.
