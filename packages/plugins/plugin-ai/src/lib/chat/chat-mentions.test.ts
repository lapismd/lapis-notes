import { describe, expect, it } from "vitest";
import {
  extractMentionPaths,
  formatFileMention,
  mentionTokensFromText,
  mergeAttachmentPaths,
  searchVaultFiles,
} from "./chat-mentions";

describe("vault file mentions", () => {
  const files = [
    { path: "Notes/alpha.md", name: "alpha" },
    { path: "Notes/beta file.md", name: "beta file" },
    { path: "../outside.md", name: "outside" },
  ];

  it("searches vault paths and names and rejects parent traversal", () => {
    expect(searchVaultFiles(files, "alpha")).toEqual([
      { path: "Notes/alpha.md", name: "alpha" },
    ]);
    expect(searchVaultFiles(files, "beta")).toEqual([
      { path: "Notes/beta file.md", name: "beta file" },
    ]);
    expect(searchVaultFiles(files, "outside")).toEqual([]);
  });

  it("formats and extracts mention paths from a prompt", () => {
    expect(formatFileMention("Notes/beta file.md")).toBe(
      '@"Notes/beta file.md"',
    );
    expect(
      extractMentionPaths('See @Notes/alpha.md and @"Notes/beta file.md"'),
    ).toEqual(["Notes/alpha.md", "Notes/beta file.md"]);
  });

  it("merges mention and drawer paths without duplicates", () => {
    expect(
      mergeAttachmentPaths(extractMentionPaths("See @Notes/alpha.md"), [
        "Notes/alpha.md",
        "Notes/beta.md",
      ]),
    ).toEqual(["Notes/alpha.md", "Notes/beta.md"]);
  });

  it("builds tokenized mention chips from prompt text", () => {
    expect(mentionTokensFromText("See @Notes/alpha.md")).toEqual([
      {
        value: "@Notes/alpha.md",
        label: "Notes/alpha.md",
        variant: "secondary",
      },
    ]);
  });

  it("keeps portable .lapis data out of ordinary mention discovery", () => {
    expect(
      searchVaultFiles(
        [
          { path: "Notes/visible.md", name: "visible" },
          {
            path: "Notes/.lapis/agents/sessions/id/transcript.jsonl",
            name: "transcript",
          },
          { path: ".lapis/internal.md", name: "internal" },
        ],
        "",
      ),
    ).toEqual([{ path: "Notes/visible.md", name: "visible" }]);
  });
});
