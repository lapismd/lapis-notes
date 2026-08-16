# App Tool MCP Bridge Implementation

This checklist tracks the verified delivery of application-owned agent tools.
Canonical requirements live under `spec/src`; this file records implementation
progress, evidence, and Jujutsu slices without replacing those requirements.

## Delivery stages

- [x] Canonical requirements and Pending verification rows
- [ ] API registry and plugin lifecycle
- [ ] AI snapshots, settings, policy, approvals, and transcript integration
- [ ] Scoped Search and Markdown tools
- [ ] AI Host stdio MCP shim, loopback broker, and protocol v3
- [ ] ACP, Codex Native, remote host, and Electron package integration
- [ ] Storybook, packaged, remote, and real-agent acceptance

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
| Specification | pending | `pnpm spec:validate`, `pnpm spec:check` |

## Known risks

- Electron must resolve and execute an unpacked shim in both development and
  packaged layouts.
- Runtime tool events may duplicate bridge-authoritative events unless the
  reserved server is normalized consistently.
- Search path-prefix filtering must remain pre-limit across every database
  transport.
- Renderer plugin effect declarations are policy metadata, not a sandbox.

## Deferred work

- Electron sidecar callback tools
- Dynamic MCP `tools/list_changed`
- Persistent approval grants
- HTTP MCP and public MCP endpoints
- MCP-over-ACP while its RFD remains draft
