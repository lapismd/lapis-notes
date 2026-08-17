# App Tool MCP Bridge Implementation

This checklist tracks the verified delivery of application-owned agent tools.
Canonical requirements live under `spec/src`; this file records implementation
progress, evidence, and Jujutsu slices without replacing those requirements.

## Delivery stages

- [x] Canonical requirements and implemented verification rows
- [x] API registry and plugin lifecycle
- [x] AI snapshots, settings, policy, approvals, and transcript integration
- [x] Scoped Search and Markdown tools
- [x] AI Host stdio MCP shim, loopback broker, and protocol v3
- [x] ACP, Codex Native, authenticated remote host, and Electron integration
- [x] Storybook interaction, accessibility, visual, and remote acceptance
- [ ] Full Electron package and live paid-agent acceptance (see acceptance gaps)

## Protocol allocation

- Agent-runtime protocol: version 3
- Reserved MCP server: `lapis-tools`
- Commands: `desktop_agent_tools_open`, `desktop_agent_tools_respond`,
  `desktop_agent_tools_close`
- Events: `desktop_agent_tool_call`, `desktop_agent_tool_cancel`
- Protocol v2 fallback: agent remains usable without application tools and the
  renderer reports that a host upgrade is required.

## Security invariants

- Trusted scope comes only from the conversation and preallocated binding.
- Loopback tokens bind one host connection to one bridge and never enter
  arguments, transcripts, logs, or durable state.
- Write and external effects require allow-once or memory-only binding approval.
- Tool unload, agent switch, scope change, disconnect, and close revoke pending
  work and grants.
- Renderer community plugins are trusted code and require a global owner-plugin
  opt-in before their tools enter a new binding snapshot.

## Validation evidence

| Stage | JJ change | Evidence |
| --- | --- | --- |
| Specification | `9a68c438` | Canonical requirements `LN-AI-086` through `LN-AI-094` and ownership, storage, domain, host, web, package, and catalog requirements; `pnpm spec:first` and `pnpm spec:check` pass. |
| API registry | `1f84de57` | Six registry tests cover validation, ownership, duplicate rejection, deterministic order, registration identity, and unload disposal; API build and publint pass. |
| MCP separation and scope | `609156a3`, `a4e26832` | External MCP servers use `McpServerContribution`; reserved naming and portable dependency audit pass; scope helper tests reject absolute, traversal, hidden, and escaped paths. |
| AI policy and approvals | `2d0471f3` | 141 AI tests cover effective snapshots, AJV input validation, result bounds, approvals and grants, settings, transcript projection, cancellation, and lifecycle invalidation. |
| Search tool | `335c17a6` | `notes_search` tests plus memory, Turso, desktop-proxy, and browser-coordination coverage prove Markdown-only prefix filtering before ranking and limit. |
| Markdown tools | `95459b1f` | Nine note-tool tests cover bounded read/list, private-path rejection, stable ordering, atomic one-match patch, conflict, drift, and cancellation. |
| MCP host bridge | `2bd4f95b` | AI Host builds both CLI and shim bundles; official MCP SDK subprocess tests cover clean list/call/result, token and connection authorization, reserved naming, cancellation, and shutdown. |
| Local runtimes | `a5348c25` | ACP, Codex Native, protocol-v2 gating, preallocated bindings, frozen snapshots, switch cleanup, and Electron bridge contracts pass. |
| Real-agent harness | `f3b86ab8` | Three deterministic seeded-workspace harness tests pass and the manual probes cover search, read, approved patch, and agent switching without putting paid-agent execution in CI. |
| Storybook and visuals | `7bedd940` | Five app-tool interaction and axe stories pass; canonical Docker build renders 31 spec chapters; five intentional baselines pass a 5/5 compare-only run. |
| Authenticated remote host | `8c5bcb28` | A real stdio MCP client completes list/call/result through the authenticated agent-runtime WebSocket and proves pending-call cancellation and bridge revocation on disconnect; AI Host is 33/33. |
| Visual Delta source fix | `e3955d77` in `storybook-addon-visual-delta` | Linked capture staging now carries `pnpm-workspace.yaml`; 21 focused tests, spec check, node build, typecheck, and release-intent pass. |

## Final validation

- `pnpm check`: passed across all 14 workspace packages.
- `pnpm test`: passed across all 14 workspace packages, including API 618/618,
  AI 141/141, AI Host 33/33, Electron 18/18, and web 14/14.
- `pnpm spec:check`: passed all five lanes; the source audit confirms portable
  packages contain no agent SDK imports.
- `pnpm build-storybook` and `pnpm check:storybook-index`: passed with all 31
  specification chapters.
- Focused app-tool Storybook and axe tests: 5/5 passed. Visual comparison: 5/5
  passed with no missing baseline or pixel mismatch.
- Real-host seed/reset harness: 3/3 passed. The authenticated remote MCP
  round-trip is part of the AI Host suite.
- AI Host build and Electron staging produced an executable
  `dist-electron/mcp-shim.mjs`; the real subprocess tests exercise that bundled
  protocol implementation.

## Acceptance gaps

- `pnpm build` and `pnpm package:desktop` reach the desktop/web renderer Vite
  bundles, then hit the pre-existing Rollup/CommonJS recursion in
  `@tursodatabase/database-wasm@0.7.2` after roughly 10,100 transformed modules.
  The portable packages and AI Host build first; Electron Builder cannot run
  until that unrelated prerequisite is repaired.
- The full Storybook browser run passes 150/153. The inherited failures are two
  WorkspaceShell assertions whose six-plugin expectation omits the already
  bundled History plugin, plus the unrelated Outgoing Links middle-tab preview
  that also misses its nested-render assertion in isolation. All five app-tool
  scenarios pass in both the full and focused lanes.
- Codex ACP, Cursor ACP, and Codex Native live probes are deliberately manual
  because they invoke installed, authenticated, potentially paid agents. The
  confined probe implementation and agent-free harness are complete, but these
  probes were not rerun during this delivery.

## Known risks

- Electron package acceptance remains coupled to the inherited Turso renderer
  build failure even though shim staging and resolution contracts are present.
- Abrupt process termination can interrupt the visual dependency-staging
  cleanup; normal success and failure paths restore the exact manifest,
  workspace file, lockfile, and permanent links before a frozen relink.
- Renderer plugin effect declarations are policy metadata, not a sandbox.

## Deferred work

- Electron sidecar callback tools
- Dynamic MCP `tools/list_changed`
- Persistent approval grants
- HTTP MCP and public MCP endpoints
- MCP-over-ACP while its RFD remains draft
