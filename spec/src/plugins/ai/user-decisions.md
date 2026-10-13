# AI Plugin / User decisions

## LN-AI-003 — AgentSession: expose respondToApproval(requestId, optionId) as a blocking request/response

<a id="ln-ai-003"></a>

**Requirement.** `AgentSession` MUST expose `respondToApproval(requestId, optionId)` as a blocking request/response. A `permission.request` event MAY notify that a request is outstanding, but MUST NOT complete the approval.

## LN-AI-004 — AgentCapabilities.approvals: report supported, interactive, persistentDecisions, granularPermissions, and policyAmendments

<a id="ln-ai-004"></a>

**Requirement.** `AgentCapabilities.approvals` MUST report `supported`, `interactive`, `persistentDecisions`, `granularPermissions`, and `policyAmendments`. Runtime selection MUST use these fields rather than vendor conditionals.

## LN-AI-006 — Compatibility AcpAgentRuntime: adapt acpx/runtime 0.8.0 or later, map onPermissionRequest

<a id="ln-ai-006"></a>

**Requirement.** Compatibility `AcpAgentRuntime` MAY adapt `acpx/runtime` 0.8.0 or later, map `onPermissionRequest` to `ApprovalRequest`, and keep acpx types inside the adapter. First-party execution MUST use `ControllerAgentRuntime`.

## LN-AI-007 — FakeAgentRuntime: implement the runtime contract with deterministic events

<a id="ln-ai-007"></a>

**Requirement.** A `FakeAgentRuntime` MUST implement the runtime contract with deterministic events and blocking approvals. Default tests and default Storybook stories MUST use it and MUST NOT require a live agent subscription.

## LN-AI-012 — Compatibility native Codex runtime: exist only for approval, user-input, or model

<a id="ln-ai-012"></a>

**Requirement.** A compatibility native Codex runtime MAY exist only for approval, user-input, or model surfaces ACP cannot express. It MUST keep runtime-neutral contracts without leaking app-server types. First-party execution MUST use the shared controller.

## LN-AI-014 — Storybook: demonstrate the public AI chat panel

<a id="ln-ai-014"></a>

**Requirement.** Storybook MUST demonstrate the public AI chat panel with Fake runtime, including send/complete plus independently inspectable requested and accepted permission and question paths, using public `@lapis-notes/ai` Show Code.

## LN-AI-015 — Normalized AgentEvent values: cover text, thinking, tool start/end, permission

<a id="ln-ai-015"></a>

**Requirement.** Normalized `AgentEvent` values MUST cover text, thinking, tool start/end, permission and question requests, usage, status, completed, and error. Tool events MUST include `id` and MAY include `server`.

## LN-AI-035 — Mapped and persisted ApprovalRequest values: omit vendor protocol objects from metadata

<a id="ln-ai-035"></a>

**Requirement.** Mapped and persisted `ApprovalRequest` values MUST omit vendor protocol objects from `metadata`.

## LN-AI-038 — ACP contract tests: prove start, text streaming, tool start

<a id="ln-ai-038"></a>

**Requirement.** ACP contract tests MUST prove start, text streaming, tool start and end, blocking approval, cancel, and close through an in-memory backend without a live subscription.

## LN-AI-156 — Conversation metadata: persist runtime allow-always and deny-always decisions by

<a id="ln-ai-156"></a>

**Requirement.** Conversation metadata MUST persist runtime `allow-always` and `deny-always` decisions by a normalized tool identity. A later matching `permission.request` MUST be answered from that record without opening the drawer. Allow-once, deny-once, and LN-AI-088 binding grants MUST remain non-durable. Generic or empty tool identities MUST NOT be recorded.

### Acceptance details

Conversation-scoped runtime approval grants verify:

- After Allow always, a later matching runtime request is answered from
  metadata and the drawer stays closed.
- Restoring the conversation still auto-answers matching requests.
- Allow once does not write a grant; the next matching request opens the
  drawer.
- `notes_search`, `lapis-tools-notes_search`, and
  `lapis-tools-notes_search: notes_search` share one identity.
- Generic titles such as `MCP: tool` or `acp_tool` MUST NOT create a grant.

## LN-AI-157 — Permission and question option buttons: use Design Core's public drawer feedback-option part

<a id="ln-ai-157"></a>

**Requirement.** Permission and question option buttons MUST use Design Core's public drawer `feedback-option` part. They MUST NOT keep plugin-local `--accent` hover or selected paint.

## LN-AI-174 — Active agent turn: update its visible trace in memory without

<a id="ln-ai-174"></a>

**Requirement.** An active agent turn MUST update its visible trace in memory without writing binding, user, assistant, tool, or usage records during streamed events. On completion or error, the controller MUST clear busy before a later-task durable checkpoint writes the pending binding, switch, full turn trace, and usage in source order. Reusable sessions MUST reset their per-turn checkpoint state, and an automatic persistent approval response MUST also run in a later task.

## LN-AI-055 — Native Codex adapter: implement app-server initialize, thread start or resume

<a id="ln-ai-055"></a>

**Requirement.** The native Codex adapter MUST implement app-server initialize, thread start or resume, turn start or interrupt, approval and request-user-input responses, current notifications, and process failure handling before advertising support.

## LN-AI-062 — Repeated non-terminal updates for one provider tool-call: update one transcript tool item. A permission

<a id="ln-ai-062"></a>

**Requirement.** Repeated non-terminal updates for one provider tool-call id MUST update one transcript tool item. A permission request MAY retain that provider id for runtime response, but its transcript item key MUST remain distinct from the related tool item.

## LN-AI-066 — Pending permission requests and agent questions: render in the Design Core Composer Drawer

<a id="ln-ai-066"></a>

**Requirement.** Pending permission requests and agent questions MUST render in the Design Core Composer Drawer rather than the transcript. Permission choices MUST respond immediately; question forms MUST submit every required answer and MUST NOT persist secret answer values.

## LN-AI-070 — Durable transcript projection: store user-visible semantic entries rather than raw

<a id="ln-ai-070"></a>

**Requirement.** Durable transcript projection MUST store user-visible semantic entries rather than raw runtime traffic. It MUST omit raw thinking, environment maps, credentials, question answers, provider payloads, and unbounded tool output; completed provider summaries and redacted visible tool detail MAY be stored.

## LN-AI-088 — Read app tools: execute under the fixed scope policy. Write

<a id="ln-ai-088"></a>

**Requirement.** Read app tools MAY execute under the fixed scope policy. Write and external tools MUST block on the existing approval surface with allow-once, allow-for-binding, and deny choices. Approval details MUST list every scoped path and a readable multiline before/after diff, including concatenated hunks. Binding grants MUST remain memory-only and expire on binding close, switch, plugin unload, or scope change.

## LN-AI-090 — AI: project application tool starts, results, failures,

<a id="ln-ai-090"></a>

**Requirement.** AI MUST project application tool starts, results, failures, and approvals into the normalized transcript with binding and run provenance. It MUST suppress duplicate runtime events for the reserved app-tool MCP server and MUST NOT persist bridge tokens, environments, stacks, or unbounded payloads.

## LN-AI-093 — Bundled application tools: scoped notes_search, notes_list, read, write, edit,

<a id="ln-ai-093"></a>

**Requirement.** Bundled application tools MUST be scoped `notes_search`, `notes_list`, `read`, `write`, `edit`, and `apply_patch`. Write-effect file tools MUST require approval. `edit` MUST apply unique non-overlapping exact hunks against the current file or fail without changing it.

## LN-AI-116 — Skill or slash command that dispatches a: call AppToolHost.invoke(). It MUST NOT execute

<a id="ln-ai-116"></a>

**Requirement.** A skill or slash command that dispatches a tool MUST call `AppToolHost.invoke()`. It MUST NOT execute the tool callback directly. Approval, validation, scope, and unload checks MUST remain the same as agent tool calls.
