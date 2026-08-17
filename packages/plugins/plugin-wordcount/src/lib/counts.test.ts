import { describe, expect, it } from "vitest";
import {
  getCharacterCount,
  getWordCount,
  readingMinutes,
  textForWordCount,
} from "./counts";

describe("word count helpers", () => {
  it("counts latin words and characters", () => {
    const text = "Bundled plugin shell acceptance.";
    expect(getWordCount(text)).toBe(4);
    expect(getCharacterCount(text)).toBe(text.length);
  });

  it("counts CJK characters as words", () => {
    expect(getWordCount("日本語")).toBe(3);
  });

  it("uses a non-empty selection instead of the document", () => {
    expect(
      textForWordCount({
        getSelection: () => "two words",
        getValue: () => "the full document has more words",
      }),
    ).toBe("two words");
    expect(
      textForWordCount({
        getSelection: () => "",
        getValue: () => "the full document",
      }),
    ).toBe("the full document");
  });

  it("rounds reading time up from 225 words per minute", () => {
    expect(readingMinutes("one two", 225)).toBe(1);
    expect(readingMinutes("word ".repeat(226), 225)).toBe(2);
  });
});
