import { expect, it } from "vitest";
import { registryChangelogFromMarkdown } from "./release-notes.js";

it("extracts only the exact Changesets version section", () => {
  const notes = registryChangelogFromMarkdown(
    "Graph",
    "1.2.0",
    "# Graph\n## 1.2.0\n### Improvements\n- Faster **graphs**.\n## 1.1.0\nOld notes",
  );
  expect(notes).toEqual({
    title: "Graph 1.2.0",
    description: "### Improvements\n- Faster **graphs**.",
  });
  expect(
    registryChangelogFromMarkdown("Graph", "1.3.0", "## 1.2.0\nOld"),
  ).toBeUndefined();
});
it("validates explicit overrides and refuses truncation", () => {
  expect(
    registryChangelogFromMarkdown("Graph", "1.0.0", "", {
      title: "Graphs",
      tags: ["feature"],
    }),
  ).toEqual({ title: "Graphs", tags: ["feature"] });
  expect(() =>
    registryChangelogFromMarkdown(
      "Graph",
      "1.0.0",
      "## 1.0.0\n" + "a".repeat(4001),
    ),
  ).toThrow();
});
