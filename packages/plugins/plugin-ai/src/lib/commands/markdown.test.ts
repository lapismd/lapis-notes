import { describe, expect, it } from "vitest";
import {
  interpolateCommandTemplate,
  parseCommandMarkdown,
} from "./markdown";

describe("parseCommandMarkdown", () => {
  it("defaults omitted kind to prompt and keeps the body as the template", () => {
    const parsed = parseCommandMarkdown(
      `---
description: Review the note
argumentHint: "[focus]"
---

Review $ARGUMENTS.
`,
      ".agents/commands/review.md",
      "review",
    );
    expect(parsed).toMatchObject({
      name: "review",
      description: "Review the note",
      argumentHint: "[focus]",
      kind: "prompt",
      template: "Review $ARGUMENTS.",
    });
  });

  it("rejects host files that are not reserved names at parse time only for kind", () => {
    const parsed = parseCommandMarkdown(
      `---
description: Custom host
kind: host
---

Docs only.
`,
      ".agents/commands/custom.md",
      "custom",
    );
    expect(parsed.kind).toBe("host");
  });
});

describe("interpolateCommandTemplate", () => {
  it("replaces $ARGUMENTS, {{args}}, and numbered placeholders", () => {
    expect(
      interpolateCommandTemplate("Review $ARGUMENTS.", "auth flow"),
    ).toBe("Review auth flow.");
    expect(
      interpolateCommandTemplate("Look at {{args}}", "the note"),
    ).toBe("Look at the note");
    expect(
      interpolateCommandTemplate("Check $1. Focus on $2.", "one two extra"),
    ).toBe("Check one. Focus on two extra.");
  });

  it("appends arguments after a blank line when the body has no placeholders", () => {
    expect(interpolateCommandTemplate("Summarize the note.", "tight")).toBe(
      "Summarize the note.\n\ntight",
    );
  });
});
