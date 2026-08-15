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
| LN-AI-007 | A `FakeAgentRuntime` MUST implement the runtime contract with deterministic events and blocking approvals. Default tests and default Storybook stories MUST use it and MUST NOT require a live agent subscription. |
| LN-AI-008 | Session persistence MUST store runtime-neutral metadata plus plugin-owned chat items. It MUST NOT serialize private agent state unless the runtime supports resume. |
| LN-AI-009 | Domain plugins MUST register tool contributions through a package-owned registry. The AI plugin MUST attach those contributions at session start and MUST NOT own CV, applications, tasks, or docs tool implementations. |
| LN-AI-010 | The plugin MUST register a movable `ai` chat view and an opening command. The panel MUST compose public Design Core chat primitives plus an approval card and MUST fill the owning `WorkspaceViewHost`. |
| LN-AI-011 | Live process-backed runtimes MUST require an `agent-runtime` host. That host MAY be desktop IPC or a configured WebSocket. Without a host, web and Storybook MUST stay on Fake and MAY show an unavailable state. |
| LN-AI-012 | A native Codex runtime MAY exist only for approval or model surfaces ACP cannot express. It MUST implement the same `AgentRuntime` and `ApprovalRequest` contracts without leaking app-server types. |
| LN-AI-013 | Model listing and auth status MUST use `ModelProvider`, not `AgentRuntime`. An external runtime MAY own its own authentication. |
| LN-AI-014 | Storybook MUST demonstrate the public AI chat panel with Fake runtime, including send/complete and a pending-approval `respondToApproval` path, using public `@lapis-notes/ai` Show Code. |
| LN-AI-015 | Normalized `AgentEvent` values MUST cover text, thinking, tool start/end, permission-request notification, status, completed, and error. Tool events MUST include `id` and MAY include `server`. |
| LN-AI-016 | Production presentation MUST use native CSS, public Design Core or `--ui-ai-*` tokens, and `data-ui-component` hosts. It MUST NOT use Tailwind utility strings. |
| LN-AI-017 | Session persistence MUST write `StoredAgentSession` records to plugin-data JSON, including outstanding approval ids and an interrupt flag. The panel MUST restore plugin-owned chat items. It MUST call runtime resume only when `capabilities.resume` is true and MUST NOT reconstruct private agent state. |
| LN-AI-018 | The chat composer MUST offer `@` file mentions from a vault-scoped search of vault files. Selecting a mention MUST insert a path token. Search MUST NOT read or suggest paths outside the active vault. |
| LN-AI-019 | A Codex `ModelProvider` MUST request `model/list` through the desktop `agent-runtime` process host and return `ModelRef` values. It MUST stay off `AgentRuntime`. When that capability is unavailable it MUST return an empty catalog and unauthenticated status without renderer process spawn. |
| LN-AI-020 | A Fake rich trace MUST emit thinking, a tool start and end, and assistant text that includes Markdown. Storybook MUST demonstrate those items on the public chat panel without a live subscription. |
| LN-AI-021 | Chat messages MUST show a timestamp through Design Core `MessageMetadata`. Items MUST store an ISO `createdAt`. Restored sessions MUST keep those timestamps. |
| LN-AI-022 | The composer MUST expose model and thinking controls. Model options MUST come from `ModelProvider` when the catalog is available. The selected model and thinking level MUST be sent on `AgentRequest`. |
| LN-AI-023 | The AI settings tab MUST expose default runtime, ACP agent, default model, and thinking level, and MUST persist them in plugin-data JSON. |
| LN-AI-024 | The chat panel MUST insert Design Core `SystemMessage` date dividers when item `createdAt` values cross a local calendar day. Labels MUST be Today, Yesterday, or a locale date. |
| LN-AI-025 | The composer MUST keep `@` vault mentions as inline path tokens and MUST show explicit vault attachments in a Composer Drawer. Submit MUST merge and dedupe both path lists into `metadata.attachments`. |
| LN-AI-026 | MessageList MUST receive `latestMessageId` plus busy and empty flags. When the transcript is scrolled away from the latest item, Layout MUST show its scroll-to-latest control and return to that item when activated. |
| LN-AI-027 | The chat panel root MUST override the public workspace view paint tokens to body background and foreground. The composer MUST dock to the panel bottom with padding that clears the workspace status bar height. |
| LN-AI-028 | The composer MUST present Effort and Model in an icon-only brain popover. Those fields MUST NOT remain as always-visible footer selects. |
| LN-AI-029 | The chat panel MUST place the transcript and composer in separate in-flow rows. The message list MUST grow to fill remaining panel height. The composer MUST stay at the panel bottom when the transcript is empty and MUST NOT overlay messages. |
| LN-AI-030 | The chat panel, its portaled composer surfaces, and the AI settings tab MUST use the workspace sans family. Message bubbles MUST keep Design Core font-size and line-height. Markdown inside bubbles MUST inherit that type. |
| LN-AI-031 | The plugin MUST obtain live ACP and native Codex runtimes from a host factory gated by the `agent-runtime` capability. It MUST NOT construct those runtimes when the capability is unavailable. |
| LN-AI-032 | The root `@lapis-notes/ai` export MUST publish contracts, Fake, the chat panel, and the plugin entry. ACP and native Codex adapters MUST be published only on `@lapis-notes/ai/runtimes`. |
| LN-AI-033 | `AgentCapabilities.steer` MUST be true only when `AgentSession.steer` is implemented. |
| LN-AI-034 | When settings pin a live runtime that is missing or that `supports()` rejects, selection MUST throw and MUST NOT silently return Fake. Auto selection MAY use Fake when no live runtime supports the request. |
| LN-AI-035 | Mapped and persisted `ApprovalRequest` values MUST omit vendor protocol objects from `metadata`. |
| LN-AI-036 | `@lapis-notes/ai` MUST NOT declare an acpx dependency. `@lapis-notes/ai-host` MUST own acpx for the executor. |
| LN-AI-037 | `AcpAgentRuntime` MUST forward `AgentRequest` model and thinking to the desktop ACP host. The host MUST pass them to acpx session options without exposing acpx types to the plugin. |
| LN-AI-038 | ACP contract tests MUST prove start, text streaming, tool start and end, blocking approval, cancel, and close through an in-memory backend without a live subscription. |
| LN-AI-039 | Settings MUST persist the ACP agent as a known built-in name. The shipped names MUST be `codex` and `cursor`. Unknown values MUST fall back to `codex`. The plugin MUST NOT add a Cursor-native `AgentRuntime`. |
| LN-AI-040 | Chat MUST send `AgentRequest.model.provider` as the selected ACP agent. It MUST NOT hardcode `codex` when another known agent is selected. When the agent is not `codex`, the composer MUST NOT treat the Codex catalog as that agent's models. |
| LN-AI-041 | The ACP adapter MUST forward the selected agent on desktop start. The host MUST pass that name to acpx `ensureSession` without exposing acpx types to the plugin. |
| LN-AI-042 | `@lapis-notes/ai-host` MUST expose `lapis-ai-host serve` with a required token, localhost bind by default, and a workspace root. It MUST NOT serve without a token. |
| LN-AI-043 | The host WebSocket MUST require a `hello` handshake with the token before any agent command. A missing hello, a bad token, or a first command MUST close the socket. |
| LN-AI-044 | After handshake, the host MUST use the existing `desktop_agent_acp_*` commands and `agent-runtime-event` frames. The plugin MUST NOT grow a second protocol. |
| LN-AI-045 | Storybook MUST NOT start `lapis-ai-host`. Live attach MAY use a configured URL and token after the user starts the CLI. Default stories MUST stay Fake. |
| LN-AI-046 | `Plugins/AI/Live Host` MUST be the only live ACP Storybook lane. It MUST use the attached host when URL and token are set. It MUST NOT run a Fake send/complete play. When attach is missing, it MUST show setup copy and MUST NOT start an ACP session. |

### LN-AI-046 acceptance details

The Live Host story verifies:

- Missing URL or token shows setup copy and does not boot an ACP workspace.
- Configured URL and token boot the real AI workspace with `defaultRuntime` `acp`.
- The story play never types or sends a prompt.

## Runtime flow

```text
command or chat panel
        ↓
host factory (agent-runtime) + Fake
        ↓
AgentRuntimeRegistry.select(request)
        ↓
AgentRuntime.start → AgentSession
        ↓
events() + respondToApproval()
        ↓
desktop IPC or standalone ai-host WebSocket (live) or Fake (tests)
```

ACP via `acpx/runtime` is the default live path. Codex and Cursor share that
adapter through the selected built-in agent name. Native Codex remains an
optional richer adapter for policy amendments only. There is no Cursor-native
runtime. The standalone `lapis-ai-host` CLI owns process execution. Web and
Storybook default stories stay Fake. The dedicated Live Host story
attaches only when URL and token are configured.
