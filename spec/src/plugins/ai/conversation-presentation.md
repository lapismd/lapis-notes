# AI Plugin / Conversation presentation

Prepared Design Core CSS includes overlay entrance and exit transitions. The
retained Notes chat and shell acceptance waits for visible menu state and
released pointer handling, while preserving normal input guards and native
animation. Tool summaries are selected through their public call-name part.
Retained Mobile shell acceptance uses the published count-bearing tab-dock name.

## LN-AI-096 — Open Chat action

<a id="ln-ai-096"></a>

**Requirement.** The plugin MUST contribute an Open Chat action to the left ribbon. Activating it MUST reuse the same reveal path as the opening command. The action MUST appear only while the plugin is enabled.

## LN-AI-024 — Message date dividers

<a id="ln-ai-024"></a>

**Requirement.** The chat panel MUST insert Design Core `SystemMessage` date dividers when item `createdAt` values cross a local calendar day. Labels MUST be Today, Yesterday, or a locale date.

## LN-AI-027 — Chat workspace paint tokens

<a id="ln-ai-027"></a>

**Requirement.** The chat panel root MUST override the public workspace view paint tokens to body background and foreground and MUST NOT own bottom padding. The composer dock MUST own the workspace status-bar clearance below the composer so its lower border and shadow remain visible above the status bar.

## LN-AI-030 — Workspace typography across chat surfaces

<a id="ln-ai-030"></a>

**Requirement.** The chat panel, its portaled composer surfaces, and the AI settings tab MUST use the workspace sans family. Message bubbles MUST keep Design Core font-size and line-height. Markdown inside bubbles MUST inherit that type and keep a transparent preview surface so the bubble paint shows through.

## LN-AI-163 — Reveal conversation scope in Explorer

<a id="ln-ai-163"></a>

**Requirement.** Selecting a conversation MUST reveal that conversation's stored scope directory in File Explorer through the public reveal-path command. The chat MUST NOT change the stored scopeDir. Follow-driven auto-open MUST NOT move Explorer.

## LN-AI-182 — Human-readable curated memory records

<a id="ln-ai-182"></a>

**Requirement.** Curated memory MUST use one human-readable Markdown record per identity under the owning `.lapis/agents/memory` scope. Updating a record MUST first preserve an immutable revision preimage and MUST use an expected-content hash so external edits fail closed.

## LN-AI-056 — Full-viewport AI stories

<a id="ln-ai-056"></a>

**Requirement.** Full-workspace AI Storybook stories MUST fill the standalone viewport without canvas padding or page scrolling and fill the documented 700px shell canvas while the bottom panel is closed. Plays MUST assert shell, sidebar, composer, and status-bar geometry without mutating the canvas height.

## LN-AI-058 — Shared attachment-chip presentation

<a id="ln-ai-058"></a>

**Requirement.** Composer attachment chips MUST compose Design Core's public drawer `attachment-chip` and `attachment-remove` parts. They MUST NOT add plugin-local chip paint, pill radius, or attachment token overrides. The complete label and remove action MUST remain one visually grouped chip.

## LN-AI-097 — Shared History search controls

<a id="ln-ai-097"></a>

**Requirement.** AI History chrome MUST compose Design Core SearchFilterBar so the search field and trailing actions stay centered in the panel. It MUST NOT stretch that row to the start edge.

## LN-AI-080 — Placement-independent AI History

<a id="ln-ai-080"></a>

**Requirement.** AI History MUST remain placement-neutral across middle tabs, stacked tabs, left and right sidebars, bottom panels, and sidebar groups. Storybook MUST exercise those placements through the real workspace panel contract rather than component-only wrappers or position-specific CSS.

## LN-AI-083 — Command-view attachment picker

<a id="ln-ai-083"></a>

**Requirement.** The chat paperclip attach picker MUST compose `@lapismd/design-core/shadcn/command-view` inside the existing Popover. The open popover MUST show a visible border and shadow and MUST remain above an open composer drawer. It MUST NOT use native Command for that searchable file list.

## LN-AI-085 — Main-area conversation tabs

<a id="ln-ai-085"></a>

**Requirement.** Selecting or creating a conversation from AI History MUST open it in a main-area AI tab, reveal an existing main-area tab with the same `(scopeDir, conversationId)`, and MUST NOT replace the history leaf. The composer History action MUST reveal an existing history leaf or create its canonical sidebar leaf without replacing chat.

## LN-AI-107 — Default History sidebar placement

<a id="ln-ai-107"></a>

**Requirement.** The History opener MUST create or reveal an ungrouped right-sidebar leaf, matching Search and file History. It MUST NOT register a default sidebar group. Conversation-row activation MUST NOT collapse that sidebar. Users MAY later move History into a group.
