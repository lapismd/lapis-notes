# AI controller integration validation

The desktop host now supplies a workspace-scoped connection to a separately
managed `lapis-ai-controller` process. Browser and Storybook attachments supply
the same descriptor. The AI plugin uses the shared SDK for sessions, provider
configuration, committed events, tools and deferred context. Terminal hosting
keeps its existing ownership.

The new controller executable must be on PATH or selected with
`LAPIS_AI_CONTROLLER_BIN`. Managed child credentials are sent over private stdin.
Workspace databases remain in the host user-data directory. No running user
service was replaced or installed by this migration.

## Temporary development dependencies

The controller and several existing local Lapis changes are unpublished. Validation
uses the ignored `.release/controller/pnpmfile.cjs` layered over the existing local
hook, with `pnpm install --lockfile=false --config.pnpmfile=.release/controller/pnpmfile.cjs`.
It maps built tarballs from sibling repositories for AI Controller, AI, Community,
Markdown, Design Core and Lapis Community. The latter exports its existing Turso
build helper through `@lapismd/lapis-community/build/vite`; both client and worker
builds consume that public helper. CodeMirror state/view and TypeScript are pinned
in this temporary peer graph to the compatible locally built package graph.

No dependency source was edited, no consumer patch hides an upstream defect, and
no local path or invented registry integrity was put in the tracked lockfile.
A release requires publishing the verified source packages in dependency order,
updating consumer semver ranges and regenerating registry-backed lockfiles. A clean
registry-only install cannot yet resolve the new controller.

Deno source validation temporarily maps the controller's managed export to its
built sibling output while retaining the desktop configuration, then restores the
tracked import map. Published configuration uses the npm controller export.

## Evidence

- Desktop focused host tests: 9 passed. Full desktop suite: 199 passed.
- Real compiled-service integration: 1 passed, including an external ACP fixture
  calling a Lapis app tool through the controller's MCP shim.
- Web attach tests: 12 passed; full web unit suite: 52 passed.
- Root check: 18 tasks passed; root production build: 10 tasks passed.
- API suite run separately after Turbo stopped: 798 tests passed; workspace: 2 passed.
- Deno managed-host source check and canonical specification checks passed.

Root tests exposed an existing app-profile contradiction: implementation enables
Community as a fifth default plugin, but its canonical requirement, unit test and
packaged acceptance expect exactly four. This behavior has not been changed by
the controller work. Resolution is pending the user's choice. Full browser and
packaged acceptance must be reported separately; successful unit/build lanes do
not establish those results.

The actual runtime fixtures do not establish paid-provider account availability,
seamless native in-flight recovery, or production relay delivery. No public signing,
package publication, deployment or visual-baseline approval was performed.

Real-agent smoke runs use a fresh private controller data directory per run and
remove it after shutting down their managed child. This prevents a prior timed-out
probe from fencing an unrelated new probe; recovery/fencing remains covered by
the durable service tests. Provider model selection uses advertised IDs, with
optional `LAPIS_AI_SMOKE_CODEX_MODEL` and `LAPIS_AI_SMOKE_CURSOR_MODEL` overrides.
