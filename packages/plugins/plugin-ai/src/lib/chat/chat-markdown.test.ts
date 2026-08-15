import { describe, expect, it } from "vitest";
import { renderChatMarkdown } from "./chat-markdown";

describe("chat markdown", () => {
  it("renders headings, emphasis, lists, and fenced code after escaping", () => {
    expect(
      renderChatMarkdown(
        [
          "## Summary",
          "",
          "I read **Notes/alpha.md** and found a `TODO`.",
          "",
          "- One heading",
          "- A note",
          "",
          "```ts",
          "const ok = true;",
          "```",
        ].join("\n"),
      ),
    ).toBe(
      [
        "<h2>Summary</h2>",
        "<p>I read <strong>Notes/alpha.md</strong> and found a <code>TODO</code>.</p>",
        "<ul><li>One heading</li><li>A note</li></ul>",
        "<pre><code>const ok = true;</code></pre>",
      ].join(""),
    );
    expect(renderChatMarkdown("<script>alert(1)</script>")).toBe(
      "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>",
    );
  });
});
