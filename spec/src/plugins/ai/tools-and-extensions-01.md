# AI Plugin / Tools and extensions / Part 1

## LN-AI-005 — AgentRuntimeRegistry: register runtimes and select by supports(request) plus

<a id="ln-ai-005"></a>

**Requirement.** `AgentRuntimeRegistry` MUST register runtimes and select by `supports(request)` plus advertised capabilities. Application code MUST NOT contain vendor-specific runtime switches.

## LN-AI-009 — Domain plugins: register tool contributions through a package-owned registry

<a id="ln-ai-009"></a>

**Requirement.** Domain plugins MUST register tool contributions through a package-owned registry. The AI plugin MUST attach those contributions at session start and MUST NOT own CV, applications, tasks, or docs tool implementations.

## LN-AI-020 — Fake rich trace: emit thinking, a tool start and end

<a id="ln-ai-020"></a>

**Requirement.** A Fake rich trace MUST emit thinking, a tool start and end, and assistant text that includes Markdown. Storybook MUST demonstrate those items on the public chat panel without a live subscription.

## LN-AI-031 — Plugin: obtain live ACP and native Codex runtimes

<a id="ln-ai-031"></a>

**Requirement.** The plugin MUST obtain live ACP and native Codex runtimes from a host factory gated by the `agent-runtime` capability. It MUST NOT construct those runtimes when the capability is unavailable.

## LN-AI-033 — AgentCapabilities.steer: true only when AgentSession.steer is implemented

<a id="ln-ai-033"></a>

**Requirement.** `AgentCapabilities.steer` MUST be true only when `AgentSession.steer` is implemented.

## LN-AI-054 — Tool transcript items: retain the event-provided input and output, including

<a id="ln-ai-054"></a>

**Requirement.** Tool transcript items MUST retain the event-provided input and output, including ACP `rawInput`, `locations`, and completed-event input. The panel MUST show command or input and output in expandable details. Details MUST NOT render tool environment variables or host credentials.

## LN-AI-125 — Tool items: keep an application-tool name and arguments

<a id="ln-ai-125"></a>

**Requirement.** Tool items MUST keep an application-tool name and arguments when a later ACP update uses a generic title or empty input. One item MUST represent that call even when the MCP broker id and ACP `toolCallId` differ. The panel MUST show that tool name instead of `tool call`.

## LN-AI-126 — Reserved composer catalog: include help, commands, new, agent, model, status

<a id="ln-ai-126"></a>

**Requirement.** The reserved composer catalog MUST include `help`, `commands`, `new`, `agent`, `model`, `status`, `scope`, `context`, `skills`, `tools`, `native`, `skill`, `cancel`, and `refresh`. Those names MUST stay available across agent switches and MUST NOT be overridden by extension, skill, native, or command-file commands.

## LN-AI-127 — Reserved /help and /commands: list effective composer commands grouped by App

<a id="ln-ai-127"></a>

**Requirement.** Reserved `/help` and `/commands` MUST list effective composer commands grouped by App, Actions, Skills, and Current Agent. The listing MUST stay local and MUST NOT become a model prompt.

## LN-AI-129 — Reserved /context: report conversation id, scope, launch note, workspace

<a id="ln-ai-129"></a>

**Requirement.** Reserved `/context` MUST report conversation id, scope, launch note, workspace, agent, model, effective tools, and effective skills. The report MUST stay local and MUST NOT become a model prompt. Reserved `/status` MUST show the same report.

## LN-AI-130 — AI: ship a bundled user-invocable research skill. /research

<a id="ln-ai-130"></a>

**Requirement.** AI MUST ship a bundled user-invocable `research` skill. `/research` MUST activate that skill host-side. A same-named folder, vault, user, or extension skill MUST override the bundled skill.

## LN-AI-132 — Stop: immediately settle streaming thinking and running tools

<a id="ln-ai-132"></a>

**Requirement.** Stop MUST immediately settle streaming thinking and running tools so no transcript spinner remains. After `session.cancel()` confirms, or when there is no session, the transcript MUST show a system notice that the turn was cancelled. Busy MUST still clear without waiting.

## LN-AI-133 — Display: unwrap a single primary tool payload key

<a id="ln-ai-133"></a>

**Requirement.** Display MUST unwrap a single primary tool payload key when remaining keys are metadata only. After unwrap, `CodeBlock` language MUST be `json` for objects or arrays, `bash` for console or command-style text, and `plaintext` for short unmarked prose. Failed-tool errors MUST use the same helper. Stored transcript strings MUST stay the event-provided payload.

### Acceptance details

Tool-detail presentation verifies:

- Primary unwrap keys are `output`, `content`, `text`, `result`, `stdout`, and
  `aggregated` when leftover keys are only `ok`, `status`, `success`,
  `isError`, `server`, `tool`, or `name`.
- MCP `content: [{ type, text }]` blocks join into one text payload. Nested
  JSON strings parse at most three times.
- A leftover `path`, `command`, or `query` sibling keeps the object structured.
- Non-JSON text MUST NOT use `language="json"`. Multiline, CLI-looking, or
  runner-tool text uses `bash`; a short unmarked line uses `plaintext`.

## LN-AI-134 — Bundled Lapis Notes skill

<a id="ln-ai-134"></a>

**Requirement.** AI MUST ship a bundled model-invocable `lapis-notes` skill that is not user-invocable. The skill MUST describe note-tool workflow using session tool names. A same-named folder, vault, user, or extension skill MUST override it.

## LN-AI-135 — New agent binding: attach a generated path-free sessionBootstrap on request

<a id="ln-ai-135"></a>

**Requirement.** Each new agent binding MUST attach a generated path-free `sessionBootstrap` on request metadata. The block MUST include host rules, scope, launch note, effective tools, and compact skills. It MUST NOT persist as a transcript message. Resume MUST NOT re-append it.

## LN-AI-138 — AI: expose a live catalog of registered application

<a id="ln-ai-138"></a>

**Requirement.** AI MUST expose a live catalog of registered application tools, composer slash commands, and skills grouped by contributing plugin or folder source. The catalog MUST include folder skills outside the open chat scope and MUST refresh when registrations, `SKILL.md`, or command Markdown files change. It MUST NOT use a frozen binding snapshot.

## LN-AI-139 — Catalog tool enablement: persist through the existing application-tool settings. Changing

<a id="ln-ai-139"></a>

**Requirement.** Catalog tool enablement MUST persist through the existing application-tool settings. Changing a checkbox MUST NOT mutate the open binding's frozen tool list.

## LN-AI-141 — AI catalog tree: nest Tools, Commands, and Skills under each

<a id="ln-ai-141"></a>

**Requirement.** The AI catalog tree MUST nest Tools, Commands, and Skills under each owner using explorer row tokens, hover wash, and kind icons. Clicking a tool, command, or skill row MUST expand its description. A vault-backed skill or vault/folder command file MUST expose Open. Chrome MUST provide a filter plus Expand all and Collapse all.

### Acceptance details

The catalog chrome verifies:

- Owner folders nest Tools, Commands, and Skills with kind icons.
- Clicking a tool, command, or skill row expands its description.
- A vault-backed skill or vault/folder command file exposes Open.
- Filter hides non-matches; Expand all opens every expandable row.

## LN-AI-142 — On load, AI: create each packaged skill at .agents/skills/&lt;name&gt;/SKILL.md only

<a id="ln-ai-142"></a>

**Requirement.** On load, AI MUST create each packaged skill at `.agents/skills/<name>/SKILL.md` only when that file is missing. It MUST NOT overwrite an existing file. In-memory bundled skills MAY remain a last-resort snapshot source when a write fails.

## LN-AI-143 — Update bundled skills: overwrite only packaged names under vault-root .agents/skills/&lt;name&gt;/SKILL.md

<a id="ln-ai-143"></a>

**Requirement.** Update bundled skills MUST overwrite only packaged names under vault-root `.agents/skills/<name>/SKILL.md` with the current packaged Markdown. It MUST NOT delete or rewrite user-authored skills with other names.

## LN-AI-144 — Command discovery: search &lt;scope&gt;/.agents/commands, vault .agents/commands, and user-global ~/.lapis/agents/commands

<a id="ln-ai-144"></a>

**Requirement.** Command discovery MUST search `<scope>/.agents/commands`, vault `.agents/commands`, and user-global `~/.lapis/agents/commands` when the host exposes that directory. Folder MUST override vault, then user-global, then extension. Reserved names MUST stay reserved. A colliding file MUST be a diagnostic, not a handler.

## LN-AI-148 — Session bootstrap: still attach when the conversation scope

<a id="ln-ai-148"></a>

**Requirement.** Session bootstrap MUST still attach when the conversation scope or launch note is under `.agents/skills`. Those fields MUST use path-free labels. The host MUST still receive the remaining path-free block.

## LN-AI-149 — Local slash-command notice formatting

<a id="ln-ai-149"></a>

**Requirement.** Reserved local slash-command notices MUST render start-aligned and MUST preserve authored line breaks. One-line agent, cancel, and date `SystemMessage` entries MUST keep the existing centered layout.

## LN-AI-150 — While a reserved local slash command is: show the accessible working indicator above

<a id="ln-ai-150"></a>

**Requirement.** While a reserved local slash command is preparing its notice, the chat panel MUST show the accessible working indicator above the composer. It MUST remove that indicator when the notice is shown or the command fails.

## LN-AI-151 — Effective slash-command menu

<a id="ln-ai-151"></a>

**Requirement.** The composer slash menu MUST list the same effective commands as the live catalog for the current conversation, including every reserved name. It MUST NOT hide reserved names behind a subset allowlist.

## LN-AI-152 — Selecting a slash command with no argument: insert the command and submit immediately. Commands

<a id="ln-ai-152"></a>

**Requirement.** Selecting a slash command with no argument hint MUST insert the command and submit immediately. Commands with an argument hint MUST remain in the composer so the user can complete them.

## LN-AI-153 — Composer slash menu: rank Fuse.js results so a command-name match

<a id="ln-ai-153"></a>

**Requirement.** The composer slash menu MUST rank Fuse.js results so a command-name match appears before any description-only match. An empty query MUST keep catalog order.

## LN-AI-154 — Reserved /skills and /context: report the active binding's eligible skills. If

<a id="ln-ai-154"></a>

**Requirement.** Reserved `/skills` and `/context` MUST report the active binding's eligible skills. If that snapshot is missing after restore or an existing session, AI MUST hydrate it from current discovery. It MUST NOT report none when eligible skills exist.

## LN-AI-155 — Tool-dispatch transcript entries

<a id="ln-ai-155"></a>

**Requirement.** A composer tool-dispatch slash command MUST append the same transcript tool item as an agent AppToolHost call: name, input, and invoke result as output. The panel MUST render it through Design Core `ToolCalls`. It MUST NOT become a model prompt or a status report.

## LN-AI-158 — Registered tool-result rendering

<a id="ln-ai-158"></a>

**Requirement.** A completed transcript tool item MUST render a registered result view for that tool name inside Design Core `ToolCalls` detail. A missing view MUST keep the CodeBlock input and output body. Stored transcript strings MUST stay the event-provided payload.

## LN-AI-159 — /skills and /tools: render a catalog-like inventory of names

<a id="ln-ai-159"></a>

**Requirement.** `/skills` and `/tools` MUST render a catalog-like inventory of names and descriptions. A vault-backed skill path MUST open that file. They MUST NOT render as a comma-separated notice when inventory data exists.

## LN-AI-172 — When the native agent-runtime advertises deferred ACP: reserve the session id and subscribe

<a id="ln-ai-172"></a>

**Requirement.** When the native agent-runtime advertises deferred ACP start, the desktop backend MUST reserve the session id and subscribe to runtime events before invoking start. The returned session MUST accept prompt, cancel, and close while native initialization is pending. Hosts without that capability MUST retain awaited startup compatibility.

## LN-AI-173 — Deferred model-request subscription order

<a id="ln-ai-173"></a>

**Requirement.** When the native agent-runtime advertises deferred model discovery, the ACP model provider MUST reserve a request id and subscribe before invoking discovery. It MUST resolve or reject only the matching catalog event, clean up that subscription, and time out a missing result. Hosts without that capability MUST retain awaited model discovery compatibility.

## LN-AI-183 — Memory trust: derived from verified evidence rather than editable

<a id="ln-ai-183"></a>

**Requirement.** Memory trust MUST be derived from verified evidence rather than editable frontmatter. Owner evidence MAY promote automatically, agent evidence MUST remain review-gated, and untrusted tool or system evidence MUST remain episodic and MUST NOT enter automatic recall or consolidation prompts.

## LN-AI-184 — AI: register provider-neutral read-effect memory_search and memory_get application

<a id="ln-ai-184"></a>

**Requirement.** AI MUST register provider-neutral read-effect `memory_search` and `memory_get` application tools. Trusted App context MUST bound their vault and project scope; model-authored arguments MAY narrow that scope but MUST NOT select an arbitrary path or another vault.

## LN-AI-188 — Background memory consolidation gates

<a id="ln-ai-188"></a>

**Requirement.** Background consolidation MUST apply deterministic provenance and recurrence gates before any optional model proposal. A qualified update MUST preserve preimages and evidence, use stable supersession identity, and leave contradictory, malformed, tool-using, or concurrently edited proposals in review without changing recall.

## LN-AI-192 — Provider-neutral handoff context

<a id="ln-ai-192"></a>

**Requirement.** Cross-agent handoff MUST use a typed provider-neutral context block in the first accepted prompt. The block MUST precede memory recall, remain absent from authored transcript text, identify its verified transcript boundary, and warn that transcript and tool output are read-only evidence.

## LN-AI-193 — Handoff projection: preserve eligible messages and sanitized tool input/output

<a id="ln-ai-193"></a>

**Requirement.** Handoff projection MUST preserve eligible messages and sanitized tool input/output chronologically, with agent labels and atomic tool groups. It MUST exclude thinking, interactions, local notices, provider envelopes, and injected context; over-budget history MUST retain deterministic recent complete groups and an omission marker.

## LN-AI-196 — Asynchronous handoff summaries

<a id="ln-ai-196"></a>

**Requirement.** Optional handoff summaries MUST be produced outside the interactive switch by a restricted, pinned, no-tool processor. Each append-only summary MUST cover a verified transcript range and source hash; invalid or unavailable summaries MUST fall back to deterministic projection without sending a context-free prompt.

## LN-AI-168 — AI History chrome expand/collapse-all and New chat: use Design Core shadcn Tooltip. Tooltip text

<a id="ln-ai-168"></a>

**Requirement.** AI History chrome expand/collapse-all and New chat controls MUST use Design Core shadcn Tooltip. Tooltip text MUST match each control's accessible name.

## LN-AI-105 — Consecutive transcript tool items: render as one Design Core ToolCalls group

<a id="ln-ai-105"></a>

**Requirement.** Consecutive transcript tool items MUST render as one Design Core `ToolCalls` group. Two or more adjacent tools MUST collapse by default to an `N tool calls` summary. A single tool MAY stay inline. Date or agent dividers MUST break a group.

## LN-AI-073 — AI conversation search: a provider-filtered derived AppDatabase projection that can

<a id="ln-ai-073"></a>

**Requirement.** AI conversation search MUST be a provider-filtered derived AppDatabase projection that can be deleted and rebuilt solely from local conversation files. It MUST index titles, user/assistant text, completed summaries, and tool names/commands while excluding tool output, interactions, usage, and runtime state. Index maintenance MUST handle append, metadata update, deletion, copied identities, and folder rename or move without writing generated state into the vault. It MUST NOT unconditionally rebuild the global Search index from workspace layout readiness.

## LN-AI-077 — Conversation metadata: keep launch context separate from execution workspace

<a id="ln-ai-077"></a>

**Requirement.** Conversation metadata MUST keep launch context separate from execution workspace, store in-scope launch paths relatively, and remain readable when a launch note or configured workspace is missing. Known machine roots in durable tool detail MUST be replaced with portable labels.

## LN-AI-108 — Bundled application-tool descriptions: name Lapis vault or index behavior

<a id="ln-ai-108"></a>

**Requirement.** Bundled application-tool descriptions MUST name Lapis vault or index behavior and the conversation scope. They MUST tell the agent to prefer the tool over shell `grep`, `rg`, `find`, or walking the host cwd for notes. `notes_search` MUST say results are lightweight and that `read` inspects a selected path.

## LN-AI-086 — AI: derive one deterministic app-tool snapshot for each

<a id="ln-ai-086"></a>

**Requirement.** AI MUST derive one deterministic app-tool snapshot for each native agent binding from the API registry. Bundled tools MUST be eligible by default. Community renderer tools MUST require a saved per-tool opt-in. Registration changes MUST apply only to a new binding.

## LN-AI-087 — AppToolHost: validate tool arguments, resolve the exact snapshotted

<a id="ln-ai-087"></a>

**Requirement.** `AppToolHost` MUST validate tool arguments, resolve the exact snapshotted registration, construct conversation and binding scope from trusted state, propagate cancellation, and return bounded transport-neutral results. An unloaded or replaced registration MUST fail without invoking a stale callback.

## LN-AI-089 — AI settings: provide one master application-tools switch and persist

<a id="ln-ai-089"></a>

**Requirement.** AI settings MUST provide one master application-tools switch and persist per-tool enablement by tool name. Bundled tools MUST default on and community tools MUST default off. Changing enablement MUST NOT mutate an active native binding's frozen tool list.

## LN-AI-091 — External MCP server contributions: remain distinct from application tools and use

<a id="ln-ai-091"></a>

**Requirement.** External MCP server contributions MUST remain distinct from application tools and use an explicitly named `McpServerContribution` request field. The app bridge MUST reserve `lapis-tools`, reject collisions, and keep application tool implementations independent of MCP, ACP, acpx, and vendor SDKs.

## LN-AI-092 — Codex ACP, Cursor ACP, and Codex Native: expose the same effective application tool descriptors

<a id="ln-ai-092"></a>

**Requirement.** Codex ACP, Cursor ACP, and Codex Native MUST expose the same effective application tool descriptors through the protocol-v3 host's advertised authenticated MCP transport. Agent switching MUST close the old bridge and grants, allocate the next binding before runtime start, and create a new snapshot without changing the conversation scope.
