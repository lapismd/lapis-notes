# AI Plugin

`@lapis-notes/ai` owns the provider-agnostic agent runtime, session control,
normalized events, and the movable chat panel. Domain plugins may register
tools and consume events. They MUST NOT own Codex, Claude, Cursor, or acpx
execution APIs.

## Requirements

| ID | Requirement |
| --- | --- |
| LN-AI-001 | `@lapis-notes/ai` MUST live at `packages/plugins/plugin-ai`, use runtime ID `ai`, ship as an optional bundled plugin, default enabled, and remain user-disableable. |
| LN-AI-002 | Application and plugin orchestration MUST depend on `AgentRuntime` for execution. They MUST NOT import Codex, Claude, Cursor, acpx, or other vendor execution APIs outside runtime adapters. |
| LN-AI-003 | `AgentSession` MUST expose `respondToApproval(requestId, optionId)` as a blocking request/response. A `permission.request` event MAY notify that a request is outstanding, but MUST NOT complete the approval. |
| LN-AI-004 | `AgentCapabilities.approvals` MUST report `supported`, `interactive`, `persistentDecisions`, `granularPermissions`, and `policyAmendments`. Runtime selection MUST use these fields rather than vendor conditionals. |
| LN-AI-005 | `AgentRuntimeRegistry` MUST register runtimes and select by `supports(request)` plus advertised capabilities. Application code MUST NOT contain vendor-specific runtime switches. |
| LN-AI-006 | `AcpAgentRuntime` MUST adapt `acpx/runtime` version 0.8.0 or later, map `onPermissionRequest` to `ApprovalRequest`, and keep acpx types inside the adapter. |
| LN-AI-007 | A `FakeAgentRuntime` MUST implement the runtime contract with deterministic events and blocking approvals. Default tests and Storybook MUST use it and MUST NOT require a live agent subscription. |
| LN-AI-008 | Session persistence MUST store runtime-neutral metadata plus plugin-owned chat items. It MUST NOT serialize private agent state unless the runtime supports resume. |
| LN-AI-009 | Domain plugins MUST register tool contributions through a package-owned registry. The AI plugin MUST attach those contributions at session start and MUST NOT own CV, applications, tasks, or docs tool implementations. |
| LN-AI-010 | The plugin MUST register a movable `ai` chat view and an opening command. The panel MUST compose public Design Core chat primitives plus an approval card and MUST fill the owning `WorkspaceViewHost`. |
| LN-AI-011 | Live process-backed runtimes MUST require a desktop `agent-runtime` capability. Web and Storybook MUST keep that capability unavailable, show an explicit unavailable state for live agents, and remain usable through Fake. |
| LN-AI-012 | A native Codex runtime MAY exist only for approval or model surfaces ACP cannot express. It MUST implement the same `AgentRuntime` and `ApprovalRequest` contracts without leaking app-server types. |
| LN-AI-013 | Model listing and auth status MUST use `ModelProvider`, not `AgentRuntime`. An external runtime MAY own its own authentication. |
| LN-AI-014 | Storybook MUST demonstrate the public AI chat panel with Fake runtime, including send/complete and a pending-approval `respondToApproval` path, using public `@lapis-notes/ai` Show Code. |
| LN-AI-015 | Normalized `AgentEvent` values MUST cover text, thinking, tool start/end, permission-request notification, status, completed, and error. Tool events MUST include `id` and MAY include `server`. |
| LN-AI-016 | Production presentation MUST use native CSS, public Design Core or `--ui-ai-*` tokens, and `data-ui-component` hosts. It MUST NOT use Tailwind utility strings. |
| LN-AI-017 | Session persistence MUST write `StoredAgentSession` records to plugin-data JSON, including outstanding approval ids and an interrupt flag. The panel MUST restore plugin-owned chat items. It MUST call runtime resume only when `capabilities.resume` is true and MUST NOT reconstruct private agent state. |
| LN-AI-018 | The chat composer MUST offer `@` file mentions from a vault-scoped search of vault files. Selecting a mention MUST insert a path token. Search MUST NOT read or suggest paths outside the active vault. |
| LN-AI-019 | A Codex `ModelProvider` MUST request `model/list` through the desktop `agent-runtime` process host and return `ModelRef` values. It MUST stay off `AgentRuntime`. When that capability is unavailable it MUST return an empty catalog and unauthenticated status without renderer process spawn. |

## Runtime flow

```text
command or chat panel
        ↓
AgentRuntimeRegistry.select(request)
        ↓
AgentRuntime.start → AgentSession
        ↓
events() + respondToApproval()
        ↓
desktop agent-runtime host (live) or Fake (tests)
```

ACP via `acpx/runtime` is the default live path, including Codex
`session/request_permission` through `onPermissionRequest`. Native Codex is an
optional richer adapter behind the same session and approval contracts.
