# Managed controller ready schema acceptance

The host fixture omitted the required `lapis-ai-controller.ready/1` schema.
The exact agent-runtime target initially had one failure and three passes; after
the correction all four pass. The full desktop suite passes 201 tests with the
compiled controller enabled, including the ACP/MCP app-tool round trip. Desktop
Svelte/type checks and the production build pass. Canonical spec checks pass.

The initial type check exposed the older installed Community Vite helper's broad
Plugin return type. The rebuilt Community helper already retains its narrow
public return type; no additional Vite cast or dependency policy change was
needed. Temporary acceptance uses rebuilt Community, Design Core, AI Controller
and Host tarballs, plus the existing local plugin manifest:

```sh
LAPIS_PLUGIN_TARBALL_MANIFEST=/Users/stevejuma/code/lapismd/lapis-plugins/.release/npm/manifest.json \
  pnpm --config.pnpmfile=/tmp/community-agent-alignment/notes-validation.pnpmfile.cjs install --lockfile=false
LAPIS_AI_CONTROLLER_BIN=/tmp/community-agent-alignment/aic/artifacts/lapis-ai-controller \
  pnpm --filter @lapis-notes/desktop-deno test
```

The canonical manifests and lockfile remain unchanged. Installation of the
controller service, release, full Lapis browser acceptance and packaged desktop
acceptance remain separate gates in the cross-repository alignment plan.
