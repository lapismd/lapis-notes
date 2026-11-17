# Shared-AI catalog requirements before removal

Historical source only; these requirements no longer govern current Notes catalog.

Source: `spec/src/storybook-catalog/visual-policy.md`

## LN-CAT-081 — AI Chat: provide deterministic application-tool stories for a read

<a id="ln-cat-081"></a>

**Requirement.** AI Chat MUST provide deterministic application-tool stories for a read result, pending write diff, allow-once, allow-for-binding reuse, denial, community-plugin enablement, and an unavailable host capability. Each changed visual MUST remain `visual-pending` until human baseline review.

Source: `spec/src/storybook-catalog/documentation-and-navigation.md`

## LN-CAT-062 — Plugins/AI/Chat: demonstrate a Fake rich turn with visible

<a id="ln-cat-062"></a>

**Requirement.** `Plugins/AI/Chat` MUST demonstrate a Fake rich turn with visible thinking, expandable tool input and output, Markdown assistant text, a date divider, timestamps, a Copy response action, Design Core Composer Drawer attachment chips, a streamed context-usage bar, filtered provider bookkeeping statuses, an active-turn working indicator, and checked Model and Thinking submenus. Deterministic failure scenarios MUST cover both composer top validation and a failed assistant message with Retry. It MUST use public Show Code and retain a `visual-pending` nested-import baseline.

Source: `spec/src/storybook-catalog/documentation-and-navigation.md`

## LN-CAT-067 — Fake runtimes in default AI stories

<a id="ln-cat-067"></a>

**Requirement.** Default `Plugins/AI` stories MUST stay Fake. Storybook MUST NOT start an AI controller as a sidecar. Preview MAY publish the web host's thin controller connection bridge using an explicit URL and token. The AI plugin MUST use the installed shared client package, without a controller source alias.

Source: `spec/src/storybook-catalog/documentation-and-navigation.md`

## LN-CAT-098 — Plugins/AI/Shell/JSONL Preview: boot the real AI plugin, open

<a id="ln-cat-098"></a>

**Requirement.** `Plugins/AI/Shell/JSONL Preview` MUST boot the real AI plugin, open a seeded portable `transcript.jsonl` through its registered default file view, and assert user and Markdown assistant messages, reasoning, tool activity, file-association metadata, and the absence of a composer. Its visual MUST remain `visual-pending` until human review.

Source: `spec/src/storybook-catalog/documentation-and-navigation.md`

## LN-CAT-089 — Plugins/AI/Panels/Catalog: cover the nested owner and kind tree

<a id="ln-cat-089"></a>

**Requirement.** `Plugins/AI/Panels/Catalog` MUST cover the nested owner and kind tree, a row-click tool description expand, expand-all, a filter, a persisted tool checkbox, Open on a vault `SKILL.md`, Open on a vault command Markdown file, public Show Code, and all six governed placements.

Source: `spec/src/storybook-catalog/plugin-scenarios.md`

## LN-CAT-055 — Plugins/AI/Chat: demonstrate the public @lapis-notes/ai chat panel

<a id="ln-cat-055"></a>

**Requirement.** `Plugins/AI/Chat` MUST demonstrate the public `@lapis-notes/ai` chat panel with Fake runtime, including send/complete plus pending permission and agent-question Composer Drawer paths, explicit Show Code, and `visual-pending` nested-import baselines.

Source: `spec/src/storybook-catalog/plugin-scenarios.md`

## LN-CAT-059 — Plugins/AI/Chat: demonstrate vault-scoped @ file mentions

<a id="ln-cat-059"></a>

**Requirement.** `Plugins/AI/Chat` MUST demonstrate vault-scoped `@` file mentions through the public composer trigger, using Fake runtime, public Show Code, and a `visual-pending` nested-import baseline.

Source: `spec/src/storybook-catalog/plugin-scenarios.md`

## LN-CAT-071 — Plugins/AI/Shell: include deterministic Local Conversations, Agent Switching,

<a id="ln-cat-071"></a>

**Requirement.** `Plugins/AI/Shell` MUST include deterministic Local Conversations, Agent Switching, and Recovery scenarios. Agent Switching MUST reconstruct Codex to Cursor to Codex from mixed portable records, assert full then delta audit fields, show the effective in-place model change, and prove typed handoff content did not enter `transcript.jsonl`. `Plugins/AI/Panels/History` MUST cover the Explorer-style tree, active scope, archived option, highlighted search, centered search chrome, placement-neutral paint, public Show Code, and all six governed placements.

Source: `spec/src/storybook-catalog/plugin-scenarios.md`

## LN-CAT-092 — Plugins/AI/Panels/History plays: assert the dimmed creation-folder path, Design Core

<a id="ln-cat-092"></a>

**Requirement.** `Plugins/AI/Panels/History` plays MUST assert the dimmed creation-folder path, Design Core tooltips on chrome actions, that selecting a History tree folder updates that path, and that folder counts share one trailing edge.

Source: `spec/src/storybook-catalog/plugin-scenarios.md`

## LN-CAT-083 — Plugins/AI/Shell Desktop: expose the plugin's Open Chat left-ribbon action

<a id="ln-cat-083"></a>

**Requirement.** `Plugins/AI/Shell` Desktop MUST expose the plugin's Open Chat left-ribbon action and prove activating it reuses the existing main-area chat leaf.

Source: `spec/src/storybook-catalog/plugin-scenarios.md`

## LN-CAT-087 — Plugins/AI/Chat: demonstrate a Fake folder skill, reserved /help

<a id="ln-cat-087"></a>

**Requirement.** `Plugins/AI/Chat` MUST demonstrate a Fake folder skill, reserved `/help` grouping, and a reserved composer slash command through the public chat panel. The play MUST use public Show Code and MUST NOT require a live agent.

Source: `spec/src/storybook-catalog/plugin-scenarios.md`

## LN-CAT-088 — Plugins/AI/Chat: demonstrate extension /open-daily-note and that disposing

<a id="ln-cat-088"></a>

**Requirement.** `Plugins/AI/Chat` MUST demonstrate extension `/open-daily-note` and that disposing the registration removes it. The play MUST use public Show Code and MUST NOT require a live agent.

Source: `spec/src/storybook-catalog/plugin-scenarios.md`

## LN-CAT-090 — Plugins/AI/Chat: demonstrate a completed notes_search tool item

<a id="ln-cat-090"></a>

**Requirement.** `Plugins/AI/Chat` MUST demonstrate a completed `notes_search` tool item with Search-owned hit rows. A hit click MUST open that vault file while the chat panel remains. The play MUST use public Show Code and MUST NOT require a live agent.

Source: `spec/src/storybook-catalog/plugin-scenarios.md`

## LN-CAT-091 — Plugins/AI/Shell: demonstrate two descendant conversations in a Command

<a id="ln-cat-091"></a>

**Requirement.** `Plugins/AI/Shell` MUST demonstrate two descendant conversations in a Command View; use the transcript scope control to select Vault root and assert Explorer follows; open a stored folder conversation and assert both chat and Explorer scope; then pin it and keep that transcript after the active file changes. The play MUST use public Show Code and MUST NOT require a live agent.

Source: `spec/src/storybook-catalog/app-owned-fixtures.md`

## LN-CAT-061 — Plugins/AI/Shell: boot a real App, fill the standalone

<a id="ln-cat-061"></a>

**Requirement.** `Plugins/AI/Shell` MUST boot a real App, fill the standalone viewport while the bottom panel is closed, keep Explorer visible on the left and Search retained collapsed on the right, and demonstrate the server-backed model selector without free text. Its empty transcript MUST fill the remaining panel above the bottom composer.

Source: `spec/src/storybook-catalog/app-owned-fixtures.md`

## LN-CAT-065 — Plugins/AI/Chat: demonstrate Layout scroll-to-latest after the transcript is

<a id="ln-cat-065"></a>

**Requirement.** `Plugins/AI/Chat` MUST demonstrate Layout scroll-to-latest after the transcript is scrolled away from the newest item, using a seeded Fake session, public Show Code, and a `visual-pending` nested-import baseline.

Source: `spec/src/storybook-catalog/app-owned-fixtures.md`

## LN-CAT-068 — Plugins/AI/Live Host: the manual live lane, tagged skip-visual,

<a id="ln-cat-068"></a>

**Requirement.** `Plugins/AI/Live Host` MUST be the manual live lane, tagged `skip-visual`, with no visual baseline. ManualAttach MUST cover missing-attach setup and MUST NOT send a live prompt. ReloadResume MUST seed the shared `lapis-ai-story:` key and assert transcript, divider, and usage before resume without sending a prompt.

Source: `spec/src/storybook-catalog/app-owned-fixtures.md`

## LN-CAT-073 — Plugins/AI/Shell: use a story-controlled initialization gate to assert

<a id="ln-cat-073"></a>

**Requirement.** `Plugins/AI/Shell` MUST use a story-controlled initialization gate to assert immediate disabled chat chrome followed by an enabled composer without timing assumptions. Its local-conversations play MUST assert that History preserves the chat leaf and selecting the same conversation twice reuses one main-area tab.

Source: `spec/src/storybook-catalog/interaction-and-accessibility.md`

## LN-CAT-079 — AI Chat: provide independent deterministic stories for requested

<a id="ln-cat-079"></a>

**Requirement.** AI Chat MUST provide independent deterministic stories for requested and accepted permissions, asked and answered questions, running/succeeded/failed tools, socket validation, failed response retry, and a rich response with thinking, usage, copy, attachments, timestamps, and filtered provider bookkeeping. Each state MUST retain public Show Code, interaction coverage, and an unapproved visual path.

| LN-CAT-055 | [storybook-catalog](../storybook-catalog/plugin-scenarios.md#ln-cat-055) | Implemented | Plugins/AI/Chat Fake send/complete plus permission and question Composer Drawer stories with public Show Code |

| LN-CAT-059 | [storybook-catalog](../storybook-catalog/plugin-scenarios.md#ln-cat-059) | Implemented | Plugins/AI/Chat Fake vault-scoped `@` mention story with public Show Code |

| LN-CAT-061 | [storybook-catalog](../storybook-catalog/app-owned-fixtures.md#ln-cat-061) | Implemented | Plugins/AI/Shell migration retains full-height empty-transcript geometry and model settings while adopting Explorer-left and collapsed-Search-right composition. Retained AI shell acceptance waits for menu visibility and released pointer handling before the next action. |

| LN-CAT-062 | [storybook-catalog](../storybook-catalog/documentation-and-navigation.md#ln-cat-062) | Implemented | Plugins/AI/Chat browser plays cover validation, checked submenus, compact attachment chips, Copy, Retry, working and context usage state, status filtering, and expandable tool details; baselines remain visual-pending. Design Core 0.4.0 acceptance waits for the composer menu and scopes tool summaries to the public call-name part. |

| LN-CAT-065 | [storybook-catalog](../storybook-catalog/app-owned-fixtures.md#ln-cat-065) | Implemented | Plugins/AI/Chat seeded scroll-to-latest Storybook play |

| LN-CAT-067 | [storybook-catalog](../storybook-catalog/documentation-and-navigation.md#ln-cat-067) | Implemented | Default Plugins/AI stories stay Fake; preview may publish the controller connection bridge from URL and token without a controller source alias |

| LN-CAT-068 | [storybook-catalog](../storybook-catalog/app-owned-fixtures.md#ln-cat-068) | Implemented | Plugins/AI/Live Host ManualAttach covers missing-attach setup; ReloadResume seeds `lapis-ai-story:lapis-ai-live-host:portable-conversations` and asserts transcript, agent divider, and usage before resume without sending a prompt |

| LN-CAT-071 | [storybook-catalog](../storybook-catalog/plugin-scenarios.md#ln-cat-071) | Implemented | deterministic Local Conversations, Agent Switching, and Recovery stories plus six AI History placements cover pointer readiness after menu teardown, interaction, axe, local restore, mixed-record Codex to Cursor to Codex reconstruction, full/delta audit fields, model configuration, transcript non-pollution, active folder, archive options, search, centered chrome, geometry, and Show Code; visual baselines remain pending review |

| LN-CAT-073 | [storybook-catalog](../storybook-catalog/app-owned-fixtures.md#ln-cat-073) | Implemented | deterministic initialization gate verifies immediate disabled chrome then enabled composer; Local Conversations preserves the sidebar history leaf and reuses one exact-location main tab |

| LN-CAT-079 | [storybook-catalog](../storybook-catalog/interaction-and-accessibility.md#ln-cat-079) | Implemented | 13 focused AI Chat Storybook tests preserve independent permission requested/accepted, question asked/answered, tool running/success/failure, socket validation, failed response Retry, and rich response states; the 12-fixture structure audit enforces public source, interaction coverage, and pending visual paths |

| LN-CAT-081 | [storybook-catalog](../storybook-catalog/visual-policy.md#ln-cat-081) | Implemented | five focused app-tool interaction and axe stories pass with approved canonical baselines and a 5/5 compare-only visual run; visual-pending tags retain the separate human-promotion boundary |

| LN-CAT-083 | [storybook-catalog](../storybook-catalog/plugin-scenarios.md#ln-cat-083) | Implemented | Plugins/AI/Shell Desktop play asserts the Open Chat left-ribbon action and one reused main-area chat leaf |

| LN-CAT-087 | [storybook-catalog](../storybook-catalog/plugin-scenarios.md#ln-cat-087) | Implemented | Plugins/AI/Chat SkillsAndSlash Fake play covers a folder skill, reserved /help grouping, and reserved /skills |

| LN-CAT-088 | [storybook-catalog](../storybook-catalog/plugin-scenarios.md#ln-cat-088) | Implemented | SkillsAndSlash play runs /open-daily-note then unloads the extension registration and asserts the unknown-command error |

| LN-CAT-089 | [storybook-catalog](../storybook-catalog/documentation-and-navigation.md#ln-cat-089) | Implemented | Plugins/AI/Panels/Catalog six placements cover nested kind folders, a row-click description expand, expand-all, a filter, a persisted checkbox, Open on a vault SKILL.md, and Open on a vault command Markdown file |

| LN-CAT-090 | [storybook-catalog](../storybook-catalog/plugin-scenarios.md#ln-cat-090) | Implemented | Plugins/AI/Chat SearchToolHits expands notes_search, asserts hit rows, opens auth.md, and keeps the chat panel |

| LN-CAT-091 | [storybook-catalog](../storybook-catalog/plugin-scenarios.md#ln-cat-091) | Implemented | Plugins/AI/Shell follow-scope play opens a Command View, reveals that folder in Explorer, pins a chat, and keeps it after the active file changes |

| LN-CAT-092 | [storybook-catalog](../storybook-catalog/plugin-scenarios.md#ln-cat-092) | Implemented | Plugins/AI/Panels/History plays assert the dimmed creation path, chrome tooltips, tree folder context, and shared count trailing edge |

| LN-CAT-098 | [storybook-catalog, ai-plugin](../storybook-catalog/documentation-and-navigation.md#ln-cat-098) | Implemented | Plugins/AI/Shell JSONL Preview boots the real plugin and asserts the default file registration, transcript chat projection, Markdown, reasoning, tools, read-only presentation, and absent composer while retaining visual-pending. |

## Retired package context

Source: `spec/src/packages/context-02.md`

- `@lapis-notes/ai` owns the provider-agnostic agent runtime and model-provider registries, Fake and ACP adapters, optional native Codex adapter, provider-safe plugin-data session persistence, vault-scoped file mentions, Codex and Cursor model catalogs, chat settings, movable chat panel, grouped Design Core tool-call transcripts that unwrap tool envelopes into `json`, `bash`, or `plaintext` `CodeBlock` language (LN-AI-133), a busy-turn Stop abort that clears busy before runtime cancel settles, and error presentation that removes the working indicator.
