# AI Plugin / Conversation storage / Part 2

## LN-AI-102 — Composer Agent, Model, and Thinking changes: persist immediately through updateSettings with acpAgent, defaultRuntime

<a id="ln-ai-102"></a>

**Requirement.** Composer Agent, Model, and Thinking changes MUST persist immediately through `updateSettings` with `acpAgent`, `defaultRuntime`, `defaultModel`, and `thinking`. Opening a new chat MUST NOT replace a saved default just because a flattened dual-agent catalog omits that agent's model.

## LN-AI-103 — Assistant transcript Markdown: render through public @lapis-notes/markdown/embed MarkdownEmbed

<a id="ln-ai-103"></a>

**Requirement.** Assistant transcript Markdown MUST render through public `@lapis-notes/markdown/embed` `MarkdownEmbed` with the owning App and `htmlPolicy` `safe`. The panel MUST NOT use a local Markdown-to-HTML helper or `{@html}` for assistant text. User messages MAY keep tokenized plain text.

## LN-AI-104 — AI chat view: contribute an AI prefix breadcrumb

<a id="ln-ai-104"></a>

**Requirement.** The AI chat view MUST contribute an `AI` prefix breadcrumb and the conversation `scopeDir` through `getBreadcrumbs` and `getBreadcrumbFilePath`, matching History's path-segment chrome. Vault-root scope MAY omit folder segments.

## LN-AI-120 — Submitted user message: appear in the transcript before conversation create

<a id="ln-ai-120"></a>

**Requirement.** A submitted user message MUST appear in the transcript before conversation create or session start completes. The empty-conversation layout MUST NOT remain visible while that turn is busy. Restore MUST NOT rerun when the first send assigns a conversation location.

## LN-AI-121 — Composer: expose reserved /agent. With no arguments it

<a id="ln-ai-121"></a>

**Requirement.** The composer MUST expose reserved `/agent`. With no arguments it MUST report the current agent. A recognized name MUST switch the conversation agent and persist the composer default. An unknown name MUST be a visible error and MUST NOT become a model prompt.

## LN-AI-122 — Transcript MarkdownEmbed sizing

<a id="ln-ai-122"></a>

**Requirement.** Assistant `MarkdownEmbed` surfaces MUST grow with the transcript scroll-shell. They MUST NOT introduce a nested vertical scroller or a constrained height that clips the rendered note. Wide code blocks MAY keep horizontal overflow.

## LN-AI-124 — Conversation-read error recovery

<a id="ln-ai-124"></a>

**Requirement.** If the open conversation cannot be read, chat MUST show that error and MUST release the location. A later submit MUST keep the user message visible, create a replacement conversation, and MUST NOT stay bound to the unreadable location. A persist failure after a failed turn MUST NOT discard the in-memory transcript.
