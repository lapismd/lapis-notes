# AI Plugin / Tools and extensions / Part 2

## LN-AI-101 — Legacy disabled-tool name mapping

<a id="ln-ai-101"></a>

**Requirement.** Persisted `disabledAppToolNames` MUST treat `notes_read` as `read` and `notes_patch` as `edit`. New bindings MUST advertise the OpenClaw-named set. Frozen bindings MUST keep snapshotted names until the agent switches.

## LN-AI-094 — Capable authenticated remote host: proxy app-tool calls, results, and cancellation

<a id="ln-ai-094"></a>

**Requirement.** A capable authenticated remote host MUST proxy app-tool calls, results, and cancellation through the existing agent-runtime channel while execution remains in the owning App. Disconnect MUST cancel pending calls and revoke the bridge, and resume MUST create a new bridge rather than reusing stale authorization.

## LN-AI-095 — AI settings section: list every currently registered application tool

<a id="ln-ai-095"></a>

**Requirement.** The AI settings section MUST list every currently registered application tool with its name, contributing plugin, and an enablement control. The list MUST refresh when the registry changes. Unregistered tools MUST disappear.

### Acceptance details

The AI settings inventory verifies:

- Each registered tool shows its name, contributing plugin, and a toggle.
- The list refreshes when the registry changes.
- Unregistered tools disappear from the section.

## LN-AI-110 — AI: parse folder SKILL.md files that supply name

<a id="ln-ai-110"></a>

**Requirement.** AI MUST parse folder `SKILL.md` files that supply `name` and `description`. It MUST accept OpenClaw-compatible `user-invocable`, `disable-model-invocation`, `argument-hint`, and `command-dispatch` fields. Application-only gating MUST use namespaced `metadata.lapis`. Invalid frontmatter MUST produce a diagnostic and MUST NOT enter an effective snapshot.

## LN-AI-111 — Skill discovery: search &lt;scope&gt;/.agents/skills, vault .agents/skills, .agents/user/skills, extension,

<a id="ln-ai-111"></a>

**Requirement.** Skill discovery MUST search `<scope>/.agents/skills`, vault `.agents/skills`, `.agents/user/skills`, extension, and bundled roots in that override order, using skill `name` for precedence. A higher source MUST replace a lower source without merging bodies. Same-level duplicates MUST be invalid. Disabled extension roots MUST NOT enter later snapshots.

## LN-AI-112 — New agent binding: receive an immutable skill snapshot of eligible

<a id="ln-ai-112"></a>

**Requirement.** Each new agent binding MUST receive an immutable skill snapshot of eligible skills. Session setup MUST inject a compact `available_skills` manifest of model-invocable skills only. The manifest MUST include name, description, id, and version and MUST NOT include host filesystem paths. Existing bindings MUST retain their snapshot until an explicit refresh or replacement binding.

## LN-AI-113 — AI: register bundled skills_read and skills_resource application tools

<a id="ln-ai-113"></a>

**Requirement.** AI MUST register bundled `skills_read` and `skills_resource` application tools. Both MUST execute through `AppToolHost`. `skills_read` MUST load a model-invocable skill from the current binding snapshot. `skills_resource` MUST reject traversal, symlink escape, and oversized content, and MUST NOT execute scripts.

## LN-AI-114 — Explicit skill command: load full instructions host-side and create

<a id="ln-ai-114"></a>

**Requirement.** An explicit skill command MUST load full instructions host-side and create a structured skill activation with name, version, source, and arguments. Runtime adapters MUST project that activation. The path MUST NOT depend on the model choosing `skills_read`.

## LN-AI-115 — AI composer: parse a leading slash as a command

<a id="ln-ai-115"></a>

**Requirement.** The AI composer MUST parse a leading slash as a command. Reserved app commands MUST remain available across agent switches. Unknown commands MUST show a visible error and MUST NOT become model prompts. Literal `//` MUST escape to ordinary text.

## LN-AI-117 — Durable transcripts: record command and skill-activation entries with name

<a id="ln-ai-117"></a>

**Requirement.** Durable transcripts MAY record `command` and `skill-activation` entries with name, version, source, and status. They MUST NOT persist full skill bodies. Projection MUST keep those entries attributable to the producing binding.

## LN-AI-118 — Native agent command catalog

<a id="ln-ai-118"></a>

**Requirement.** Native agent commands advertised by the active binding MUST appear in the composer catalog under that agent. They MUST NOT override reserved, extension, or skill commands. Colliding native names MUST remain available through `/native`. Session close MUST clear or disable that binding's native catalog.

## LN-AI-119 — Explicit skill refresh: create a replacement binding with the current

<a id="ln-ai-119"></a>

**Requirement.** An explicit skill refresh MUST create a replacement binding with the current skill snapshot. Existing native bindings MUST keep their prior snapshot until that refresh or a later replacement. Skill file changes MUST affect only future snapshots.
