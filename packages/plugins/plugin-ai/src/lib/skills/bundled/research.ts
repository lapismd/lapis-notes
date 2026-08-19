import { parseSkillMarkdown } from "../parser";
import type { LoadedAppSkill } from "../types";
import { BUNDLED_LAPIS_NOTES_SKILL } from "./lapis-notes";

const RESEARCH_SKILL_MARKDOWN = `---
name: research
description: Research notes in the current folder and synthesize an answer.
user-invocable: true
argument-hint: "<topic>"
---
Research the given topic in the current conversation folder.

1. Use notes_search to find relevant notes.
2. Use read to inspect the best matches.
3. Follow further searches when needed.
4. Synthesize a concise answer and cite note paths.
`;

export const BUNDLED_RESEARCH_SKILL: LoadedAppSkill = parseSkillMarkdown(
  RESEARCH_SKILL_MARKDOWN,
  {
    path: "bundled/research/SKILL.md",
    source: "bundled",
    root: "bundled/research",
  },
);

export const BUNDLED_APP_SKILLS: readonly LoadedAppSkill[] = [
  BUNDLED_LAPIS_NOTES_SKILL,
  BUNDLED_RESEARCH_SKILL,
];
