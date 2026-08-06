import { describe, expect, it } from "vitest";
import { createSqliteFtsPrefixQueryFromTerms } from "./sqlite-fts-query";

describe("createSqliteFtsPrefixQueryFromTerms", () => {
  it("quotes punctuation-heavy terms for SQLite FTS prefix search", () => {
    expect(
      createSqliteFtsPrefixQueryFromTerms([
        "multi-agent",
        "foo_bar",
        "Café",
        "任务列表",
      ]),
    ).toBe(
      '"multi"* AND "agent"* AND "foo"* AND "bar"* AND "café"* AND "任务列表"*',
    );
  });
});
