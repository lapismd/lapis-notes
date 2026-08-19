import { describe, expect, it } from "vitest";
import {
  parseToolResultPayload,
  resolveToolResultView,
} from "./chat-result-views";

const component = (() => null) as never;

describe("chat result views", () => {
  it("parses JSON tool payloads and leaves raw strings intact", () => {
    expect(parseToolResultPayload('{"query":"OAuth"}')).toEqual({
      query: "OAuth",
    });
    expect(parseToolResultPayload("not-json")).toBe("not-json");
    expect(parseToolResultPayload("")).toBeUndefined();
    expect(parseToolResultPayload()).toBeUndefined();
  });

  it("resolves a registered tool view and falls back when missing", () => {
    const app = {
      agentResultViews: {
        getByTool(name: string) {
          return name === "notes_search" ? { component } : undefined;
        },
      },
    };
    expect(resolveToolResultView(app as never, "notes_search")).toBe(component);
    expect(resolveToolResultView(app as never, "read")).toBeUndefined();
    expect(resolveToolResultView(undefined, "notes_search")).toBeUndefined();
  });
});
