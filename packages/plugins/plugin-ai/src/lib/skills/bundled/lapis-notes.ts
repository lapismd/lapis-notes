import { parseSkillMarkdown } from "../parser";
import type { LoadedAppSkill } from "../types";

export const LAPIS_NOTES_SKILL_MARKDOWN = `---
name: lapis-notes
description: Guidance for working with notes, folders, search, links, and other Lapis Notes capabilities.
user-invocable: false
---

# Lapis Notes

You are operating inside Lapis Notes.

Prefer application tools over manually inspecting the notes filesystem.

## Finding information

Use notes_search when the user asks to find, recall, locate, compare, or research information from their notes.

Search first, then use read on promising results.

Do not guess note paths when search can locate the note.

## Navigating notes

Use notes_list to inspect folder contents when structure matters.

Use related link tools when relationships between notes are relevant and those tools are available.

## Scope

Tool access is automatically scoped by Lapis.

Do not attempt to widen that scope using filesystem paths or shell tools.

The current conversation's scope and launch note are supplied by the host.

## Writing

Use Lapis note mutation tools when they are available instead of editing application-owned note files through generic filesystem tools.

Writes may require user approval.

## Tool availability

The exact tool set can vary by installed extensions and conversation scope.

Use the tools exposed for the current session rather than assuming a particular extension is installed.
`;

export const BUNDLED_LAPIS_NOTES_SKILL: LoadedAppSkill = parseSkillMarkdown(
  LAPIS_NOTES_SKILL_MARKDOWN,
  {
    path: "bundled/lapis-notes/SKILL.md",
    source: "bundled",
    root: "bundled/lapis-notes",
  },
);
