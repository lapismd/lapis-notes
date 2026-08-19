import { describe, expect, it } from "vitest";
import { extractMetadata } from "./extract-metadata";

describe("extractMetadata", () => {
  it("parses nested YAML front matter", () => {
    const cache = extractMetadata(`---
type: task
task:
  status: open
  start: anytime
  plan:
    date: 2026-08-21
---

# Task
`);
    expect(cache.frontmatter).toMatchObject({
      type: "task",
      task: {
        status: "open",
        start: "anytime",
        plan: { date: "2026-08-21" },
      },
    });
  });

  it("indexes markdown and wiki links with heading context", () => {
    const cache = extractMetadata(`---
type: task
---

# Release
## Subtasks
- [Parser](./parser.md)
See [[Ideas|Idea inbox]]
`);
    expect(cache.links?.map((link) => [link.link, link.heading])).toEqual([
      ["./parser.md", "Subtasks"],
      ["Ideas|Idea inbox", "Subtasks"],
    ]);
  });
});
