import { describe, expect, it } from "vitest";
import { tags } from "@lezer/highlight";

import { classHighlighter } from "../components/editor/extensions/class-highlighter";

describe("classHighlighter", () => {
  it("maps directive-oriented standard tags to editor token classes", () => {
    expect(classHighlighter.style([tags.processingInstruction])).toBe(
      "cm-meta",
    );
    expect(classHighlighter.style([tags.attributeName])).toBe("cm-attribute");
    expect(classHighlighter.style([tags.attributeValue])).toBe("cm-string");
    expect(classHighlighter.style([tags.bracket])).toBe("cm-bracket");
  });
});
