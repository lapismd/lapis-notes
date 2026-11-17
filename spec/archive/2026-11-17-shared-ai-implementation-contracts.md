# Retired shared-AI implementation contracts

Archived from Notes current authority during shared-AI retirement. These 16 IDs
specified the deleted external package, its exports, shared-controller/Fake
adapters or removed Storybook attach path. They do not require restoring those
implementations. IDs are retained here as historical provenance and are not reused.
Native feature/data obligations remain with their current owners and the retained
Notes integration requirements; this archive does not qualify native behavior.

Original source: `spec/src/plugins/ai/providers-and-execution.md`.

## LN-AI-001 — @lapis-notes/ai: live at packages/ai in the sibling lapis-plugins

<a id="ln-ai-001"></a>

**Requirement.** `@lapis-notes/ai` MUST live at `packages/ai` in the sibling `lapis-plugins` repository, use runtime ID `ai`, remain available for static composition or registry installation, and remain user-disableable.

Original source: `spec/src/plugins/ai/user-decisions.md`.

## LN-AI-006 — Compatibility AcpAgentRuntime: adapt acpx/runtime 0.8.0 or later, map onPermissionRequest

<a id="ln-ai-006"></a>

**Requirement.** Compatibility `AcpAgentRuntime` MAY adapt `acpx/runtime` 0.8.0 or later, map `onPermissionRequest` to `ApprovalRequest`, and keep acpx types inside the adapter. First-party execution MUST use `ControllerAgentRuntime`.

Original source: `spec/src/plugins/ai/user-decisions.md`.

## LN-AI-007 — FakeAgentRuntime: implement the runtime contract with deterministic events

<a id="ln-ai-007"></a>

**Requirement.** A `FakeAgentRuntime` MUST implement the runtime contract with deterministic events and blocking approvals. Default tests and default Storybook stories MUST use it and MUST NOT require a live agent subscription.

Original source: `spec/src/plugins/ai/providers-and-execution.md`.

## LN-AI-011 — Host requirement for live runtimes

<a id="ln-ai-011"></a>

**Requirement.** Live process-backed runtimes MUST require an `agent-runtime` host. That host MAY be desktop IPC or a configured WebSocket. Without a host, web and Storybook MUST stay on Fake and MAY show an unavailable state.

Original source: `spec/src/plugins/ai/user-decisions.md`.

## LN-AI-012 — Compatibility native Codex runtime: exist only for approval, user-input, or model

<a id="ln-ai-012"></a>

**Requirement.** A compatibility native Codex runtime MAY exist only for approval, user-input, or model surfaces ACP cannot express. It MUST keep runtime-neutral contracts without leaking app-server types. First-party execution MUST use the shared controller.

Original source: `spec/src/plugins/ai/user-decisions.md`.

## LN-AI-014 — Storybook: demonstrate the public AI chat panel

<a id="ln-ai-014"></a>

**Requirement.** Storybook MUST demonstrate the public AI chat panel with Fake runtime, including send/complete plus independently inspectable requested and accepted permission and question paths, using public `@lapis-notes/ai` Show Code.

Original source: `spec/src/plugins/ai/providers-and-execution.md`.

## LN-AI-019 — Compatibility Codex ModelProvider: list models through a leftover process host

<a id="ln-ai-019"></a>

**Requirement.** A compatibility Codex `ModelProvider` MAY list models through a leftover process host and MUST stay off `AgentRuntime`. When unavailable it MUST return an empty catalog without renderer spawn. First-party listing MUST use the shared controller client.

Original source: `spec/src/plugins/ai/tools-and-extensions-01.md`.

## LN-AI-020 — Fake rich trace: emit thinking, a tool start and end

<a id="ln-ai-020"></a>

**Requirement.** A Fake rich trace MUST emit thinking, a tool start and end, and assistant text that includes Markdown. Storybook MUST demonstrate those items on the public chat panel without a live subscription.

Original source: `spec/src/plugins/ai/tools-and-extensions-01.md`.

## LN-AI-031 — Plugin: obtain live ACP and native Codex runtimes

<a id="ln-ai-031"></a>

**Requirement.** The plugin MUST obtain live ACP and native Codex runtimes from a host factory gated by the `agent-runtime` capability. It MUST NOT construct those runtimes when the capability is unavailable.

Original source: `spec/src/plugins/ai/providers-and-execution.md`.

## LN-AI-032 — Root @lapis-notes/ai export: publish contracts, Fake, the chat panel,

<a id="ln-ai-032"></a>

**Requirement.** The root `@lapis-notes/ai` export MUST publish contracts, Fake, the chat panel, and the plugin entry. ACP and native Codex adapters MUST be published only on `@lapis-notes/ai/runtimes`.

Original source: `spec/src/plugins/ai/providers-and-execution.md`.

## LN-AI-036 — AI package dependency boundaries

<a id="ln-ai-036"></a>

**Requirement.** `@lapis-notes/ai` MUST NOT declare an acpx or `@lapismd/ai-host` dependency. Sibling `@lapismd/ai-host` MUST own acpx for the executor.

Original source: `spec/src/plugins/ai/providers-and-execution.md`.

## LN-AI-037 — Compatibility AcpAgentRuntime: forward model and thinking to a leftover

<a id="ln-ai-037"></a>

**Requirement.** Compatibility `AcpAgentRuntime` MAY forward model and thinking to a leftover ACP host. First-party `ControllerAgentRuntime` MUST pass those values through shared-controller thread configuration without exposing acpx types.

Original source: `spec/src/plugins/ai/providers-and-execution.md`.

## LN-AI-044 — Compatibility ACP command adapters

<a id="ln-ai-044"></a>

**Requirement.** Compatibility adapters MAY keep `desktop_agent_acp_*` commands. First-party plugin code MUST use the shared controller client and MUST NOT add a second live execution protocol.

Original source: `spec/src/plugins/ai/providers-and-execution.md`.

## LN-AI-046 — Explicit Live Host Storybook lane

<a id="ln-ai-046"></a>

**Requirement.** `Plugins/AI/Live Host` MUST be the only live Storybook lane. It MUST use the attached controller when URL and token are set. It MUST NOT run a Fake send/complete play. When attach is missing, it MUST show setup copy and MUST NOT start a live session.

### Acceptance details

The Live Host story verifies:

- Missing URL or token shows setup copy and does not boot an ACP workspace.
- Configured URL and token boot the real AI workspace with `defaultRuntime` `acp`.
- The story play never types or sends a prompt.

The ReloadResume play seeds the shared `lapis-ai-story:` storage key with
portable `.lapis/agents` files, remounts, and asserts transcript, agent
divider, and usage before any live resume. It never sends a prompt.

Original source: `spec/src/plugins/ai/providers-and-execution.md`.

## LN-AI-098 — When the selected runtime is not Fake: show an unavailable message that tells

<a id="ln-ai-098"></a>

**Requirement.** When the selected runtime is not Fake and no agent-runtime host is connected, chat MUST show an unavailable message that tells the user to start the local agent server and set its URL, port, and token. An explicit Fake session MUST NOT show that message.

Original source: `spec/src/plugins/ai/providers-and-execution.md`.

## LN-AI-170 — Public AI renderer entry: remain browser and WebView bundleable. Its optional

<a id="ln-ai-170"></a>

**Requirement.** The public AI renderer entry MUST remain browser and WebView bundleable. Its optional Node user-agents store MUST load only through a runtime-gated dynamic boundary and MUST NOT add `node:*` modules to a renderer bundle.

## Original verification rows

```markdown
| LN-AI-001 | [ai-plugin](../plugins/ai/providers-and-execution.md#ln-ai-001) | Implemented | package location, runtime ID `ai`, bundled default-enabled registration |
| LN-AI-006 | [ai-plugin](../plugins/ai/user-decisions.md#ln-ai-006) | Implemented | Compatibility ACP mapper covers onPermissionRequest; first-party factory uses ControllerAgentRuntime |
| LN-AI-007 | [ai-plugin](../plugins/ai/user-decisions.md#ln-ai-007) | Implemented | Fake runtime contract tests and Storybook use no live subscription |
| LN-AI-011 | [ai-plugin](../plugins/ai/providers-and-execution.md#ln-ai-011) | Implemented | live runtimes require an agent-runtime host; web/Storybook stay Fake without URL and token |
| LN-AI-012 | [ai-plugin](../plugins/ai/user-decisions.md#ln-ai-012) | Implemented | Compatibility native Codex adapter maps approvals without leaking types; first-party execution uses the shared controller |
| LN-AI-014 | [ai-plugin](../plugins/ai/user-decisions.md#ln-ai-014) | Implemented | Storybook Fake send/complete and pending-approval plays |
| LN-AI-019 | [ai-plugin](../plugins/ai/providers-and-execution.md#ln-ai-019) | Implemented | Compatibility Codex ModelProvider stays empty when unavailable; first-party listing uses the shared controller client |
| LN-AI-020 | [ai-plugin](../plugins/ai/tools-and-extensions-01.md#ln-ai-020) | Implemented | Fake rich-trace unit coverage plus Agent Trace Storybook play. The Design Core 0.4.0 retained consumer play waits for the model menu and targets the public call-name part independently from tool details. |
| LN-AI-031 | [ai-plugin](../plugins/ai/tools-and-extensions-01.md#ln-ai-031) | Implemented | host factory returns no live adapters when agent-runtime is unavailable |
| LN-AI-032 | [ai-plugin](../plugins/ai/providers-and-execution.md#ln-ai-032) | Implemented | root export omits adapters; package publishes `@lapis-notes/ai/runtimes` |
| LN-AI-036 | [ai-plugin](../plugins/ai/providers-and-execution.md#ln-ai-036) | Implemented | plugin-ai package.json has no acpx or `@lapismd/ai-host` dependency |
| LN-AI-037 | [ai-plugin](../plugins/ai/providers-and-execution.md#ln-ai-037) | Implemented | ControllerAgentRuntime passes model and thinking through shared-controller thread configuration; leftover ACP adapters remain compatibility-only |
| LN-AI-044 | [ai-plugin](../plugins/ai/providers-and-execution.md#ln-ai-044) | Implemented | First-party plugin uses the shared controller client; leftover `desktop_agent_acp_*` adapters stay compatibility-only |
| LN-AI-046 | [ai-plugin](../plugins/ai/providers-and-execution.md#ln-ai-046) | Implemented | Plugins/AI/Live Host is the only live controller story; missing attach shows setup and play does not send |
| LN-AI-098 | [ai-plugin](../plugins/ai/providers-and-execution.md#ln-ai-098) | Implemented | bootstrap tests keep pinned Fake silent and surface the start-server Settings message on auto fallback |
| LN-AI-170 | [ai-plugin](../plugins/ai/providers-and-execution.md#ln-ai-170) | Implemented | Deno production Vite build includes AI without statically bundling the optional Node user-agents store |
```

## Original shared-plugin context

# AI Plugin / Context

`@lapis-notes/ai` owns the provider-agnostic agent runtime, session control,
normalized events, and the movable chat panel. Domain plugins may register
tools and consume events. They MUST NOT own Codex, Claude, Cursor, or acpx
execution APIs.
The real-App AI shell loads the public Source Editor before Markdown so it uses
the same source settings and file associations as production hosts.
Deterministic chat stories preserve pending tool state when a running fixture
requires it, provide an App when Markdown rendering is exercised, and scope
duplicate tool-output assertions to the expanded call that owns them.
Local Conversations acceptance waits for closed menus to release pointer
interaction before opening History options, while retaining archive, restore,
delete, and new-chat assertions.

AI also owns the default read-only `.jsonl` file view. Portable
`transcript.jsonl` files use the same durable validation and chat-item
projection as restored conversations, so messages, Markdown, reasoning, tools,
interactions, commands, and errors remain recognizable without starting an
agent. `agents.jsonl` uses its binding-event schema, while unrelated JSONL stays
inspectable as line-numbered structured records. The preview never exposes a
composer or writes back to the append-only source.

The native implementation lives behind AI-owned `MemoryService` and
`MemoryConsolidationProvider` contracts. `NativeMemoryService` projects exact
transcript-message chunks into `ai-memory-episodic`, projects current Markdown
records into `ai-memory-curated`, and treats both Search corpora plus every
memory database table as rebuildable derived state. Durable records, immutable
revision preimages, review reports, and exclusions remain under
`.lapis/agents/memory`; existing conversation JSONL is opened only through the
conversation repository and is never rewritten by memory maintenance.

`memory_search` and `memory_get` are ordinary App tools, so the App supplies the
binding and directory context before model-authored arguments are evaluated.
Normal turns can additionally receive typed `memory-recall` context blocks.
ACP and native adapters serialize those blocks without adding them to the user
prompt or authored transcript. Automatic recall is independently disableable;
provider-backed consolidation is separately opt-in and pins its processor
runtime, agent, and model instead of following the interactive binding.

The app-owned ingestion coordinator observes durable terminal checkpoints and
external transcript changes. Its idle scheduler resumes bounded work through
renewable AppDatabase jobs. Restricted processor sessions receive no workspace,
skills, MCP servers, or App tools, and any tool, approval, command, question,
malformed proposal, evidence mismatch, or optimistic-write conflict produces no
unreviewed durable mutation.

## Runtime flow

- The initial fallback controller is presentation-only: it does not restore or resume a conversation until preparation settles.

- History navigation compares both scope and conversation UUID and searches only main-area AI leaves before creating a tab; the dedicated history leaf remains mounted in its sidebar.

- External process-backed MCP servers are represented by `McpServerContribution` and travel through `AgentRequest.mcpServers`; the reserved `lapis-tools` server is exclusively owned by the application-tool bridge.

- Folder skills live under `<scope>/.agents/skills/**/SKILL.md`.

- Command Markdown lives under `<scope>/.agents/commands`, vault `.agents/commands`, and user-global `~/.lapis/agents/commands` when the host exposes that directory (LN-AI-144–LN-AI-146).

- The composer treats a leading slash as a command and keeps reserved app commands across agent switches, including `/help`, `/scope`, `/context`, `/status`, and `/agent` (LN-AI-126–LN-AI-129).

- Those local notices stay start-aligned with authored line breaks and show the composer working indicator while they prepare (LN-AI-149, LN-AI-150).

- The slash menu lists the same catalog commands, ranks Fuse name matches before description hits, and submits argument-free picks immediately (LN-AI-151–LN-AI-153).

- `/skills` and `/context` hydrate a missing binding snapshot from current discovery so they list the same eligible skills as the catalog (LN-AI-154).

- AI ships bundled `research` and `lapis-notes` skills that folder skills may override (LN-AI-130, LN-AI-134) and seeds them as vault `SKILL.md` when missing (LN-AI-142, LN-AI-143).

- Search owns composer `/search` as a `notes_search` tool-dispatch command.

- The chat MUST show that invoke as a `ToolCalls` transcript item (LN-AI-155).

- Runtime Allow always and Deny always decisions persist on conversation metadata so later matching `permission.request` events stay silent; application-tool write grants remain memory-only (LN-AI-156, LN-AI-088).

- Opening a skill file MUST NOT scope a new chat to `.agents` (LN-AI-147).

- Live ACP session start appends a path-free `available_skills` manifest and a generated `sessionBootstrap` through host session setup (LN-AI-135, LN-AI-136, LN-AI-148).

- `/context` reports folder-instruction paths and bootstrap truncation (LN-AI-137).

- The AI catalog lists live tools, commands, and skills (LN-AI-138–LN-AI-146).

- Native ACP commands stay binding-local and never override app, extension, skill, or command-file commands.

- Skill tools execute only through `AppToolHost`.

- Application tools are enabled by default for new bindings.

- The master setting and per-tool enablement lists are persisted, while an active binding retains the snapshot taken when it was created.

- Protocol-v3 hosts advertise their authenticated application-tool transport.

- Node and WebSocket hosts use `appTools: stdio-mcp`; Deno desktop uses `appTools: http-mcp` through its loopback Streamable HTTP route.

- A capable runtime receives only a bridge ID; AI Host merges the reserved server for ACP or injects its command into Codex Native while credentials remain confined to the host transport.

- Protocol-v2 hosts continue without application tools.

- Protocol-v4 desktop sessions reconcile their active run with the host's retained terminal sequence.

- This recovers a missed stream completion at most once and never retries the user prompt (LN-AI-177, LN-DENO-061).

- The chat controller preallocates each binding UUID, prepares its fixed tool snapshot before runtime start, and persists that same UUID only after startup.

- Application calls use synthetic run provenance in the existing tool and permission projection; runtime-reported events from `lapis-tools` are dropped so one logical call has one authoritative transcript lifecycle.

```text
command or chat panel
        ↓
host factory (agent-runtime) + Fake
        ↓
AgentRuntimeRegistry.select(request)
        ↓
AgentRuntime.start → AgentSession
        ↓
events() + approval or question response
        ↓
Deno native bindings or standalone ai-host WebSocket (live) or Fake (tests)
```

- First-party execution uses `ControllerAgentRuntime` and `lapis-ai-controller/1`.

- Compatibility `AcpAgentRuntime` remains available for leftover ACP hosts.

- Codex and Cursor share the selected built-in agent name.

- Native Codex remains an optional richer adapter for policy amendments only.

- There is no Cursor-native runtime.

- Sibling `@lapismd/ai-controller` owns process execution; `@lapismd/ai-host` remains the transport library.

- The user-agents command store may load Node persistence only from a runtime-only host path; browser and renderer bundles must not statically include that Node module.

- Web and Storybook default stories stay Fake.

- The dedicated Live Host story attaches only when URL and token are configured.

- The paperclip attach picker keeps its Popover host and composes Command View for the vault-file list.

- The composer overflow menu sits after History and attach, sizes to its labels so they stay fully visible at the model-menu type size (LN-AI-123), archives or restores in place, deletes through vault trash, and offers New Chat in the current scope (LN-AI-109).

- History chrome keeps a visible hover on its search actions, shows a dimmed creation-folder path, and creates New chat in that folder from Explorer selection or a History tree pick (LN-AI-165–LN-AI-168).

- History folder counts share one trailing edge across depths (LN-AI-169).

- The first user message stays in the transcript while the session starts, and Stop aborts a still-preparing turn (LN-AI-106, LN-AI-120).

- Conversation files remain the portable authority for AI history.

- Their derived Search documents update incrementally after a short per-conversation debounce; full repair is an explicit recovery operation rather than part of turn persistence (LN-AI-176).

- Thinking stays expanded only while it streams, then collapses when later transcript data arrives (LN-AI-131).

- Stop settles leftover spinners immediately and posts a cancelled system notice after cancel confirms (LN-AI-132).

- That notice uses the visible status line `Agent turn cancelled`.

- An unreadable conversation is reported and released so the next send starts a replacement chat (LN-AI-124).

- Application-tool names and arguments stay on the transcript item when ACP only reports a generic `tool call` title (LN-AI-125).

- Tool details unwrap envelope fields such as `output` and pick `json`, `bash`, or `plaintext` for the Design Core `CodeBlock` (LN-AI-133).

- Assistant MarkdownEmbed content grows with that transcript instead of a nested scroller (LN-AI-122).

- AI registers its sidebar chat, history, and catalog views through `ViewAccess.command`.

- Their canonical palette commands are `AI: Open Chat`, `AI: Open History`, and `AI: Open Catalog`.

- Conversations themselves appear on the Agents palette tab through a provider that groups rows with the existing date labels and opens the selected chat.

- Chat and History reuse or create their documented right-sidebar leaves.

- Catalog reuses or creates its documented left-sidebar leaf.

Notes-owned paid-agent probes, controller launchers and deterministic workspace
seeding are retired under LN-CAT-122. Their removed coverage does not qualify
the active native AI or the preserved standalone controller.

- `AiChatPanel`, `AiHistoryPanel`, and `AiCatalogPanel` are public presentation exports used by Autodocs, while the six-position stories still construct them through the real AI plugin.

- Selecting the deterministic Fake runtime suppresses desktop-host unavailability because no live transport is required.

LN-AI-082 remains an implementation contract for provider capability handling;
retirement of Notes-owned probes supplies no new provider acceptance evidence.
