# AI Plugin / Conversation storage / Part 1

## LN-AI-008 — Session persistence: store runtime-neutral metadata plus plugin-owned chat items

<a id="ln-ai-008"></a>

**Requirement.** Session persistence MUST store runtime-neutral metadata plus plugin-owned chat items. It MUST NOT serialize private agent state unless the runtime supports resume.

## LN-AI-017 — AI plugin data: persist settings only for new state. Existing

<a id="ln-ai-017"></a>

**Requirement.** AI plugin data MUST persist settings only for new state. Existing `sessions` values MUST remain inert and preserved when settings are saved, while all new conversation metadata, bindings, transcript entries, interactions, and usage state MUST use the folder-scoped conversation store.

## LN-AI-018 — Chat composer: offer @ file mentions from a vault-scoped

<a id="ln-ai-018"></a>

**Requirement.** The chat composer MUST offer `@` file mentions from a vault-scoped search of vault files. Selecting a mention MUST insert a path token. Search MUST NOT read or suggest paths outside the active vault.

## LN-AI-023 — AI settings tab: expose default runtime, ACP agent, default model

<a id="ln-ai-023"></a>

**Requirement.** The AI settings tab MUST expose default runtime, ACP agent, default model, and thinking level, and MUST persist them in plugin-data JSON.

## LN-AI-025 — Composer: keep @ vault mentions as inline path

<a id="ln-ai-025"></a>

**Requirement.** The composer MUST keep `@` vault mentions as inline path tokens and MUST show explicit vault attachments in a Composer Drawer. Submit MUST merge and dedupe both path lists into `metadata.attachments`.

## LN-AI-026 — MessageList: receive latestMessageId plus busy and empty flags

<a id="ln-ai-026"></a>

**Requirement.** MessageList MUST receive `latestMessageId` plus busy and empty flags. When the transcript is scrolled away from the latest item, Layout MUST show its scroll-to-latest control inside the transcript body and return to that item when activated.

## LN-AI-029 — Chat panel: place the transcript and composer in separate

<a id="ln-ai-029"></a>

**Requirement.** The chat panel MUST place the transcript and composer in separate in-flow rows. The message list MUST grow to fill remaining panel height. The composer MUST stay at the panel bottom when the transcript is empty and MUST NOT overlay messages.

## LN-AI-039 — Settings: persist the ACP agent as a known

<a id="ln-ai-039"></a>

**Requirement.** Settings MUST persist the ACP agent as a known built-in name. The shipped names MUST be `codex` and `cursor`. Unknown values MUST fall back to `codex`. The plugin MUST NOT add a Cursor-native `AgentRuntime`.

## LN-AI-050 — Model settings: persist per ACP agent. A successful catalog

<a id="ln-ai-050"></a>

**Requirement.** Model settings MUST persist per ACP agent. A successful catalog refresh MUST choose its server default when the saved model is absent; a failed refresh MUST preserve the saved value and surface the failure.

## LN-AI-051 — Durable agent binding: retain its initial runtime, agent, model, thinking

<a id="ln-ai-051"></a>

**Requirement.** Each durable agent binding MUST retain its initial runtime, agent, model, thinking, native session identity, and final usage. Append-only context and configuration records MUST derive its effective state. Failed resume MUST retain local history and create a replacement binding without deleting the old one.

## LN-AI-052 — Runtime start, send, stream, process, and transport: become visible transcript errors, clear the busy

<a id="ln-ai-052"></a>

**Requirement.** Runtime start, send, stream, process, and transport failures MUST become visible transcript errors, clear the busy state, remove the working indicator, and leave the panel able to start a replacement session.

## LN-AI-128 — Reserved /scope with no arguments: report the current folder, launch note, workspace

<a id="ln-ai-128"></a>

**Requirement.** Reserved `/scope` with no arguments MUST report the current folder, launch note, workspace, and resolution source. A folder argument MUST start a new conversation in that scope and MUST NOT mutate the open conversation.

## LN-AI-131 — Thinking item: spin and stay expanded only while that

<a id="ln-ai-131"></a>

**Requirement.** A thinking item MUST spin and stay expanded only while that item is streaming. The first later non-thinking transcript item MUST settle it to `done` and collapse it. Completion, error, and cancel MUST also settle it.

## LN-AI-136 — Bootstrap: read each ancestor .lapis/AGENTS.md from vault root

<a id="ln-ai-136"></a>

**Requirement.** Bootstrap MUST read each ancestor `.lapis/AGENTS.md` from vault root to the conversation scope, root to leaf. It MUST skip path-bearing files and truncate past 10,000 characters per file and 25,000 total. Truncation MUST be reported.

## LN-AI-137 — Reserved /context: also report folder-instruction vault-relative paths and whether

<a id="ln-ai-137"></a>

**Requirement.** Reserved `/context` MUST also report folder-instruction vault-relative paths and whether bootstrap text was truncated. The report MUST stay local and MUST NOT include machine-absolute paths.

## LN-AI-147 — Active-file conversation scope: skip hidden application segments .agents, .lapis, .obsidian

<a id="ln-ai-147"></a>

**Requirement.** An active-file conversation scope MUST skip hidden application segments `.agents`, `.lapis`, `.obsidian`, and `.trash`. It MUST use the nearest ancestor folder that contains none of those segments, or vault root. The New Chat folder list MUST omit those trees. Existing conversations stored there MUST remain readable.

## LN-AI-160 — AI chat transcript: show the current directory-context scope control at

<a id="ln-ai-160"></a>

**Requirement.** The AI chat transcript MUST show the current directory-context scope control at the end of the scroll content and MUST add extra bottom padding. The control MUST use reduced opacity against the workspace surface and MUST be horizontally centered. Vault-root context MUST use a short Vault label.

## LN-AI-161 — Unpinned idle AI chat: follow the active-file conversation scope and list

<a id="ln-ai-161"></a>

**Requirement.** An unpinned idle AI chat MUST follow the active-file conversation scope and list active conversations in that folder and descendants. Zero matches MUST keep the empty composer, one MUST open that conversation, and two or more MUST show a searchable Command View ordered by depth then recency. The view MUST NOT follow while busy or when the active leaf is this chat.

## LN-AI-162 — Composer: expose a pin control beside the effort

<a id="ln-ai-162"></a>

**Requirement.** The composer MUST expose a pin control beside the effort button and MUST persist pin on conversation metadata. A pinned open conversation MUST NOT follow directory changes. Unpinning MUST re-evaluate the current directory context. The control MUST disable when no conversation is open.

## LN-AI-164 — AI: register an Agents palette provider and MUST

<a id="ln-ai-164"></a>

**Requirement.** AI MUST register an Agents palette provider and MUST NOT add one workspace command per conversation. Empty-query recents MUST come directly from portable conversation files without enumerating the global Search document store, so the All palette can render commands and Files immediately. Results MUST group with `formatChatDateLabel`. Selecting a row MUST open that conversation.

## LN-AI-166 — AI History: show a dimmed folder-context path under SearchFilterBar

<a id="ln-ai-166"></a>

**Requirement.** AI History MUST show a dimmed folder-context path under SearchFilterBar. Vault root MUST use the Vault label. New chat MUST create a conversation in that folder on click without opening a folder menu.

## LN-AI-167 — Folder context: follow File Explorer's selected folder

<a id="ln-ai-167"></a>

**Requirement.** Folder context MUST follow File Explorer's selected folder or the parent of a selected file, and a History tree folder pick. An explicit History-tree pick MUST persist across active-leaf refreshes until Explorer selection or another History folder pick changes it. Initial context MAY use the active-note scope when Explorer has no selection.

## LN-AI-171 — AI settings updates: normalize before comparison and MUST NOT persist

<a id="ln-ai-171"></a>

**Requirement.** AI settings updates MUST normalize before comparison and MUST NOT persist or notify when the serialized plugin data is unchanged. Startup settings materialization MUST therefore leave the portable vault manifest stable.

## LN-AI-176 — AI conversation Search projection: coalesce vault source changes per conversation

<a id="ln-ai-176"></a>

**Requirement.** AI conversation Search projection MUST coalesce vault source changes per conversation and update only the affected Search document. Ordinary transcript writes MUST NOT rebuild the global Search index. Repeated unchanged projections MUST NOT rewrite their full-text rows.

## LN-AI-178 — Chat scope control: a Design Core ghost button that opens

<a id="ln-ai-178"></a>

**Requirement.** The chat scope control MUST be a Design Core ghost button that opens a searchable Command View containing every visible vault folder plus Vault root. Selecting a folder MUST force the existing zero, one, or many conversation transition for that scope and reveal the same path in File Explorer. The control MUST be disabled while a turn is busy.

## LN-AI-179 — AI memory: owned by the App and scoped by

<a id="ln-ai-179"></a>

**Requirement.** AI memory MUST be owned by the App and scoped by vault owner, workspace, or project folder. Conversation bindings and provider session ids MAY appear only as provenance and MUST NOT own memory or prevent recall after an agent, model, or runtime switch.

## LN-AI-180 — Append-only conversation transcript entries: remain the episodic evidence authority. Memory ingestion

<a id="ln-ai-180"></a>

**Requirement.** Append-only conversation transcript entries MUST remain the episodic evidence authority. Memory ingestion, consolidation, retrieval, migration, and rebuild MUST NOT rewrite historical transcript lines, and every automatically curated revision MUST retain verified conversation, entry, and content-hash references.

## LN-AI-181 — AI: project eligible transcript messages into a message-granular

<a id="ln-ai-181"></a>

**Requirement.** AI MUST project eligible transcript messages into a message-granular `ai-memory-episodic` Search corpus. The projection MUST be idempotent, scoped before limiting, reject changed historical entry hashes, and remain disposable and rebuildable from conversation files.

## LN-AI-185 — Explicit memory search: support curated, episodic, or combined retrieval

<a id="ln-ai-185"></a>

**Requirement.** Explicit memory search MUST support curated, episodic, or combined retrieval with hybrid Search and lexical fallback. Results MUST expose compact text, scope, trust, time, an opaque retrieval reference, and evidence references without returning an unbounded transcript.

## LN-AI-186 — Automatic recall: inject only active trusted curated memory

<a id="ln-ai-186"></a>

**Requirement.** Automatic recall MUST inject only active trusted curated memory through typed provider-neutral context blocks. It MUST keep authored transcript text unchanged, exclude injected context from ingestion, fit three records and 900 estimated tokens, and fail open after a 150ms warmed deadline.

## LN-AI-187 — Background ingestion: start only after durable terminal-turn persistence, process

<a id="ln-ai-187"></a>

**Requirement.** Background ingestion MUST start only after durable terminal-turn persistence, process at most 200 entries before yielding, and also reconcile external transcript changes and startup backlog. A deterministic message identity MUST make retries and crash recovery idempotent.

## LN-AI-190 — Memory rebuild and derived-forget operations: preserve transcripts and curated Markdown unless

<a id="ln-ai-190"></a>

**Requirement.** Memory rebuild and derived-forget operations MUST preserve transcripts and curated Markdown unless the user invokes their separate deletion paths. Forgetting a conversation's derivatives MUST persist an exclusion so rebuild cannot silently restore them and MUST retract mixed-lineage curated revisions for review.

## LN-AI-194 — Target session with a matching verified cursor: receive only the transcript delta after that

<a id="ln-ai-194"></a>

**Requirement.** A target session with a matching verified cursor MUST receive only the transcript delta after that cursor. A new or replacement session MUST receive a full bounded projection. Cursor records MUST advance only after terminal persistence and MUST prefer deterministic at-least-once replay after a crash.

## LN-AI-197 — Enabled AI plugin: register .jsonl as a default file association

<a id="ln-ai-197"></a>

**Requirement.** The enabled AI plugin MUST register `.jsonl` as a default file association through a file-only `ai-jsonl` view. The view MUST be read-only, render validated `transcript.jsonl` through the existing chat projection, render validated `agents.jsonl` as an agent-event timeline, retain a structured fallback for other JSONL, and surface malformed records plus interrupted-final-append warnings without adding a composer or mutating the file.

## LN-AI-169 — AI History folder counts: share one trailing edge across tree depths

<a id="ln-ai-169"></a>

**Requirement.** AI History folder counts MUST share one trailing edge across tree depths. Nested branches MUST indent only at the start. Counts MUST NOT step inward with guide indent.

## LN-AI-057 — Model-catalog, runtime-selection, and active-session transport errors: appear immediately in the composer top validation

<a id="ln-ai-057"></a>

**Requirement.** Model-catalog, runtime-selection, and active-session transport errors MUST appear immediately in the composer top validation surface. They MUST NOT require opening the Model and Thinking menu, and active-session failures MUST remain in the transcript.

## LN-AI-059 — Transcript failures: render as failed assistant messages using Design

<a id="ln-ai-059"></a>

**Requirement.** Transcript failures MUST render as failed assistant messages using Design Core `MessageMetadata` error status. They MUST expose an icon-only Retry action that resends the nearest preceding user prompt through the normal replacement-session path.

## LN-AI-060 — Empty composer placeholder: stay concise. Vault attachment discovery MUST remain

<a id="ln-ai-060"></a>

**Requirement.** The empty composer placeholder MUST stay concise. Vault attachment discovery MUST remain available through the `@` trigger and paperclip action rather than explanatory placeholder copy.

## LN-AI-063 — ACP and native Codex token usage updates: normalize to runtime-neutral usage state and update

<a id="ln-ai-063"></a>

**Requirement.** ACP and native Codex token usage updates MUST normalize to runtime-neutral usage state and update a context-window progress bar in the composer. Provider bookkeeping statuses such as usage, session, and available-command updates MUST NOT render as transcript messages.

## LN-AI-064 — Stored transcript items, agent attribution, pending-safe-interaction state: render from local conversation files before runtime

<a id="ln-ai-064"></a>

**Requirement.** Stored transcript items, agent attribution, pending-safe-interaction state, and context usage MUST render from local conversation files before runtime resume completes. A resume failure MUST leave local history available and settle interactions that can no longer be answered. The Live Host Storybook lane MUST persist `.lapis/agents` vault data across browser reloads so a prior live conversation can exercise the production resume path.

## LN-AI-068 — Conversation: use an application-owned UUID and store metadata.yaml

<a id="ln-ai-068"></a>

**Requirement.** Every conversation MUST use an application-owned UUID and store `metadata.yaml`, append-only `agents.jsonl`, and append-only `transcript.jsonl` under `<scope>/.lapis/agents/sessions/<id>/`. Those files MUST remain authoritative offline, and storage identity MUST include scope so copied UUIDs remain independent.

## LN-AI-069 — Conversation scope: resolve from an explicit vault folder, otherwise

<a id="ln-ai-069"></a>

**Requirement.** Conversation scope MUST resolve from an explicit vault folder, otherwise the most recently active note parent, otherwise vault root. Scope MUST remain fixed for the conversation, MUST NOT walk to ancestor `.lapis` directories, and MUST use only confined vault-relative paths.

## LN-AI-072 — Dedicated folder-aware AI conversation-history view: expose New chat, archive, trash-backed delete,

<a id="ln-ai-072"></a>

**Requirement.** A dedicated folder-aware AI conversation-history view MUST expose New chat, archive, trash-backed delete, and all-conversation search. The chat history button MUST reveal this view, while its New and conversation-row actions MUST reveal the chat view. The selected scope's entries MUST merge directly from the filesystem so generated search state is not required to reopen a known conversation; a live folder move MUST update the open locator without rewriting conversation files.

## LN-AI-074 — Plugin mapping and projection: retain protocol provenance and MUST deduplicate local

<a id="ln-ai-074"></a>

**Requirement.** Plugin mapping and projection MUST retain protocol provenance and MUST deduplicate local append from sibling `@lapismd/ai-host` frames. A replay gap or missing host session MUST persist a retryable interruption without automatically resending the prompt.

## LN-AI-075 — Metadata replacement and transcript append: preserve previously committed data across interruption. Readers

<a id="ln-ai-075"></a>

**Requirement.** Metadata replacement and transcript append MUST preserve previously committed data across interruption. Readers MUST tolerate only a malformed final JSONL line, report recovery, and reject unsupported required metadata versions or invalid interior lines without breaking other conversations.

## LN-AI-076 — Lapis application data: stay out of ordinary File Explorer

<a id="ln-ai-076"></a>

**Requirement.** `.lapis` application data MUST stay out of ordinary File Explorer and AI mention results while remaining portable vault content. Explorer MAY show `.lapis` only when Show hidden files is on. Session data MUST NOT be automatically ignored, pruned, or excluded from folder copy and sync.

## LN-AI-078 — Global AI settings: act as defaults for new conversations. Composer

<a id="ln-ai-078"></a>

**Requirement.** Global AI settings MUST act as defaults for new conversations. Composer configuration changes MUST queue a turn-boundary binding switch for the current conversation; an explicit cancel-and-switch path MUST persist interruption before activation.

## LN-AI-079 — AI History: render an Explorer-style tree containing only folder

<a id="ln-ai-079"></a>

**Requirement.** AI History MUST render an Explorer-style tree containing only folder branches with conversations and auto-select and expand the most-recent active note's scope. Search MUST highlight matching folder, title, and transcript preview text, while archived visibility remains an expandable secondary option. Other scopes and full-text previews MAY come from the disposable derived index.

## LN-AI-081 — Native desktop conversation: use the native vault adapter's absolute root

<a id="ln-ai-081"></a>

**Requirement.** A native desktop conversation MUST use the native vault adapter's absolute root as the agent workspace. Memory and browser vaults MUST omit a synthetic workspace so the attached host applies its confined workspace root; a vault display name MUST NOT be used as `cwd`.

## LN-AI-082 — Real-agent smoke lanes: remain explicit developer commands, preserve an ignored

<a id="ln-ai-082"></a>

**Requirement.** Real-agent smoke lanes MUST remain explicit developer commands, preserve an ignored seeded workspace and portable conversations by default, and support intentional confined reset. They MUST cover Codex ACP, Cursor ACP, Codex Native, and one focused Codex-to-Cursor-to-Codex handoff with full then delta context, stable resumed session identity, in-place model configuration, and transcript non-pollution, without adding a paid-agent dependency to automated tests.

## LN-AI-109 — When a conversation repository is present, the: expose an overflow menu with Archive Chat

<a id="ln-ai-109"></a>

**Requirement.** When a conversation repository is present, the composer MUST expose an overflow menu with Archive Chat or Restore Chat, Delete Chat, and New Chat. Archive and Restore MUST keep the same conversation open, while Delete MUST trash the source and clear the tab. New Chat MUST replace the tab with a new conversation in the current scope. Archive and Delete MUST disable when no conversation is open.

## LN-AI-099 — Write: create or overwrite a scoped text file

<a id="ln-ai-099"></a>

**Requirement.** `write` MUST create or overwrite a scoped text file after creating missing parents. It MUST reject folders, hidden application directories, binary or invalid UTF-8, and payloads over 256 KiB. Existing files MUST be overwritten without an auto-suffix.

## LN-AI-100 — Apply_patch: parse a V4A patch, validate every Add

<a id="ln-ai-100"></a>

**Requirement.** `apply_patch` MUST parse a V4A patch, validate every Add, Update, Move, and Delete against scoped text files, then apply the batch. Add MUST fail if the path exists. Delete MUST use recoverable Vault trash. A validation failure MUST leave every file unchanged.
