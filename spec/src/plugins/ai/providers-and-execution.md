# AI Plugin / Providers and execution

## LN-AI-001 — @lapis-notes/ai: live at packages/ai in the sibling lapis-plugins

<a id="ln-ai-001"></a>

**Requirement.** `@lapis-notes/ai` MUST live at `packages/ai` in the sibling `lapis-plugins` repository, use runtime ID `ai`, remain available for static composition or registry installation, and remain user-disableable.

## LN-AI-002 — AgentRuntime execution boundary

<a id="ln-ai-002"></a>

**Requirement.** Application and plugin orchestration MUST depend on `AgentRuntime` for execution. They MUST NOT import Codex, Claude, Cursor, acpx, or other vendor execution APIs outside runtime adapters.

## LN-AI-010 — Plugin: register a movable ai chat view

<a id="ln-ai-010"></a>

**Requirement.** The plugin MUST register a movable `ai` chat view and an opening command. The panel MUST compose public Design Core chat primitives and MUST fill the owning `WorkspaceViewHost`.

## LN-AI-098 — When the selected runtime is not Fake: show an unavailable message that tells

<a id="ln-ai-098"></a>

**Requirement.** When the selected runtime is not Fake and no agent-runtime host is connected, chat MUST show an unavailable message that tells the user to start the local agent server and set its URL, port, and token. An explicit Fake session MUST NOT show that message.

## LN-AI-011 — Host requirement for live runtimes

<a id="ln-ai-011"></a>

**Requirement.** Live process-backed runtimes MUST require an `agent-runtime` host. That host MAY be desktop IPC or a configured WebSocket. Without a host, web and Storybook MUST stay on Fake and MAY show an unavailable state.

## LN-AI-013 — Model listing and auth status: use ModelProvider, not AgentRuntime. An external runtime

<a id="ln-ai-013"></a>

**Requirement.** Model listing and auth status MUST use `ModelProvider`, not `AgentRuntime`. An external runtime MAY own its own authentication.

## LN-AI-016 — Production presentation: use native CSS, public Design Core

<a id="ln-ai-016"></a>

**Requirement.** Production presentation MUST use native CSS, public Design Core or `--ui-ai-*` tokens, and `data-ui-component` hosts. It MUST NOT use Tailwind utility strings.

## LN-AI-019 — Compatibility Codex ModelProvider: list models through a leftover process host

<a id="ln-ai-019"></a>

**Requirement.** A compatibility Codex `ModelProvider` MAY list models through a leftover process host and MUST stay off `AgentRuntime`. When unavailable it MUST return an empty catalog without renderer spawn. First-party listing MUST use the shared controller client.

## LN-AI-022 — Composer: expose model and thinking controls. Model options

<a id="ln-ai-022"></a>

**Requirement.** The composer MUST expose model and thinking controls. Model options MUST come from `ModelProvider` when the catalog is available. The selected model and thinking level MUST be sent on `AgentRequest`.

## LN-AI-028 — Composer: present Effort and Model in an icon-only

<a id="ln-ai-028"></a>

**Requirement.** The composer MUST present Effort and Model in an icon-only brain popover. Those fields MUST NOT remain as always-visible footer selects.

## LN-AI-032 — Root @lapis-notes/ai export: publish contracts, Fake, the chat panel,

<a id="ln-ai-032"></a>

**Requirement.** The root `@lapis-notes/ai` export MUST publish contracts, Fake, the chat panel, and the plugin entry. ACP and native Codex adapters MUST be published only on `@lapis-notes/ai/runtimes`.

## LN-AI-034 — Fail-closed live-runtime selection

<a id="ln-ai-034"></a>

**Requirement.** When settings pin a live runtime that is missing or that `supports()` rejects, selection MUST throw and MUST NOT silently return Fake. Auto selection MAY use Fake when no live runtime supports the request.

## LN-AI-036 — AI package dependency boundaries

<a id="ln-ai-036"></a>

**Requirement.** `@lapis-notes/ai` MUST NOT declare an acpx or `@lapismd/ai-host` dependency. Sibling `@lapismd/ai-host` MUST own acpx for the executor.

## LN-AI-037 — Compatibility AcpAgentRuntime: forward model and thinking to a leftover

<a id="ln-ai-037"></a>

**Requirement.** Compatibility `AcpAgentRuntime` MAY forward model and thinking to a leftover ACP host. First-party `ControllerAgentRuntime` MUST pass those values through shared-controller thread configuration without exposing acpx types.

## LN-AI-040 — Chat: send AgentRequest.model.provider as the selected ACP agent

<a id="ln-ai-040"></a>

**Requirement.** Chat MUST send `AgentRequest.model.provider` as the selected ACP agent. It MUST NOT hardcode `codex` when another known agent is selected. When the agent is not `codex`, the composer MUST NOT treat the Codex catalog as that agent's models.

## LN-AI-041 — ACP adapter: forward the selected agent on desktop start

<a id="ln-ai-041"></a>

**Requirement.** The ACP adapter MUST forward the selected agent on desktop start. The host MUST pass that name to acpx `ensureSession` without exposing acpx types to the plugin.

## LN-AI-044 — Compatibility ACP command adapters

<a id="ln-ai-044"></a>

**Requirement.** Compatibility adapters MAY keep `desktop_agent_acp_*` commands. First-party plugin code MUST use the shared controller client and MUST NOT add a second live execution protocol.

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

## LN-AI-047 — AI views, controllers, and runtime selection: use the App owned by their plugin

<a id="ln-ai-047"></a>

**Requirement.** AI views, controllers, and runtime selection MUST use the App owned by their plugin or workspace leaf. First-party AI runtime code MUST NOT read an ambient application singleton.

## LN-AI-048 — Composer brain menu: contain Model and Thinking submenus. Each submenu

<a id="ln-ai-048"></a>

**Requirement.** The composer brain menu MUST contain Model and Thinking submenus. Each submenu MUST mark the active value with a checked radio item and MUST expose loading or unavailable catalog states without falling back to free text.

## LN-AI-049 — Model discovery: select a ModelProvider for the active ACP

<a id="ln-ai-049"></a>

**Requirement.** Model discovery MUST select a `ModelProvider` for the active ACP agent. Codex and Cursor catalogs MUST remain separate, and settings MUST use the same server-derived options as the composer.

## LN-AI-053 — ACP thinking: applied before the first turn through acpx

<a id="ln-ai-053"></a>

**Requirement.** ACP thinking MUST be applied before the first turn through acpx session configuration. Thought stream events MUST map to visible reasoning items and finish on completion or error.

## LN-AI-140 — AI: register a movable ai-catalog command view whose

<a id="ln-ai-140"></a>

**Requirement.** AI MUST register a movable `ai-catalog` command view whose Open Catalog command reveals or creates the documented left-sidebar leaf.

### Acceptance details

The catalog command view verifies:

- The catalog tree MUST list tools, slash commands, and skills by owner.
- Activating a vault-backed skill MUST open that `SKILL.md` in the editor.
- Seeded bundled skills MUST expose Open for their vault `SKILL.md`.

## LN-AI-145 — Command files: use YAML front-matter plus a Markdown body

<a id="ln-ai-145"></a>

**Requirement.** Command files MUST use YAML front-matter plus a Markdown body. Omitted or `prompt` kind MUST interpolate `$ARGUMENTS`, numbered `$1` placeholders, and `{{args}}`, then submit as a user prompt. `kind: host` MUST stay local and MUST NOT become a model prompt. A host file whose name is not reserved MUST be invalid.

## LN-AI-146 — When the host exposes a user-agents directory: seed each reserved command as ~/.lapis/agents/commands/&lt;name&gt;.md only

<a id="ln-ai-146"></a>

**Requirement.** When the host exposes a user-agents directory, AI MUST seed each reserved command as `~/.lapis/agents/commands/<name>.md` only when missing, with `kind: host`. Update reserved commands MUST overwrite only those reserved filenames. It MUST NOT rewrite user-authored prompt files.

## LN-AI-165 — AI History chrome action buttons: show a visible hover and focus-visible fill

<a id="ln-ai-165"></a>

**Requirement.** AI History chrome action buttons MUST show a visible hover and focus-visible fill on sidebar and workspace paint. Ghost and filter-toggle actions MUST NOT disappear into the panel background.

## LN-AI-175 — Default Codex and Cursor model providers: both discover models through their selected ACP

<a id="ln-ai-175"></a>

**Requirement.** The default Codex and Cursor model providers MUST both discover models through their selected ACP agent. A desktop host advertising deferred model discovery MUST therefore route the Codex catalog through the request-id/runtime-event contract from LN-AI-173 rather than spawning a renderer-owned Codex app-server process. The optional native Codex provider MUST remain an explicit adapter and MUST NOT replace the default Codex ACP catalog.

## LN-AI-177 — Desktop ACP session advertising runStatus: true: reconcile its active run with the native

<a id="ln-ai-177"></a>

**Requirement.** A desktop ACP session advertising `runStatus: true` MUST reconcile its active run with the native host until completion or failure is observed. Protocol version alone MUST NOT enable polling on a direct attach host without that command. Replayed or reconciled native sequences MUST apply at most once. Missing terminal stream delivery MUST therefore clear the composer working state from the retained host terminal event without resending the prompt.

## LN-AI-189 — Automated consolidation: run through an App-owned bounded scheduler

<a id="ln-ai-189"></a>

**Requirement.** Automated consolidation MUST run through an App-owned bounded scheduler and renewable database-owner lease rather than a sidecar or operating-system daemon. Provider-backed consolidation MUST require explicit opt-in and a pinned processor independent of the interactive agent. Failures MUST NOT block chat.

## LN-AI-191 — Conversation schema v3: add append-only binding context and configuration records

<a id="ln-ai-191"></a>

**Requirement.** Conversation schema v3 MUST add append-only binding context and configuration records plus auditable agent configuration entries. Readers MUST accept v1 and v2 without rewriting them, while a legacy binding without a verified cursor MUST be replaced once before cross-agent reuse.

## LN-AI-195 — When a session advertises model or thinking: configure and verify the active native session

<a id="ln-ai-195"></a>

**Requirement.** When a session advertises model or thinking configuration, AI MUST configure and verify the active native session without switching bindings. Unsupported, failed, or unverifiable configuration MUST use a replacement binding and full handoff, while recording no successful configuration audit entry.

## LN-AI-170 — Public AI renderer entry: remain browser and WebView bundleable. Its optional

<a id="ln-ai-170"></a>

**Requirement.** The public AI renderer entry MUST remain browser and WebView bundleable. Its optional Node user-agents store MUST load only through a runtime-gated dynamic boundary and MUST NOT add `node:*` modules to a renderer bundle.

## LN-AI-106 — Abort behavior during an active turn

<a id="ln-ai-106"></a>

**Requirement.** While a turn is busy, the composer Stop control MUST stay clickable and MUST abort the active session through `cancel()`. `cancel()` MUST clear busy immediately, MUST NOT wait for the runtime cancel to settle, and MUST prevent a still-preparing submit from sending. The composer MAY remain disabled for send and input.

## LN-AI-071 — One conversation: contain multiple append-only agent bindings. Switching runtime

<a id="ln-ai-071"></a>

**Requirement.** One conversation MAY contain multiple append-only agent bindings. Switching runtime or agent MUST retain the conversation ID, record an agent-switch entry, attribute late events to their producing binding, and commit the target only after prompt acceptance succeeds. Switch-back MUST resume the newest compatible binding when its verified cursor exists; model or thinking changes SHOULD configure the active binding in place.

## LN-AI-084 — Synchronous chat-layout mounting

<a id="ln-ai-084"></a>

**Requirement.** An AI chat view MUST mount its complete chat layout synchronously before conversation, model-catalog, or runtime preparation completes. The composer MUST remain disabled and expose a non-error preparing status until preparation settles.

## LN-AI-123 — Composer conversation overflow items: keep their full labels visible. The menu

<a id="ln-ai-123"></a>

**Requirement.** Composer conversation overflow items MUST keep their full labels visible. The menu MUST size to its content and MUST NOT clip or ellipsize those labels. Those items MUST use the same font size as composer model-menu items.
