import { describe, expect, it } from "vitest";
import {
  isLiteralSlashText,
  parseSlashCommand,
  unescapeLiteralSlash,
} from "./parser";

describe("parseSlashCommand", () => {
  it("parses commands, arguments, and colon form", () => {
    expect(parseSlashCommand("/skills")).toEqual({
      name: "skills",
      rawArguments: "",
      original: "/skills",
    });
    expect(parseSlashCommand("  /research-notes authentication")).toMatchObject({
      name: "research-notes",
      rawArguments: "authentication",
    });
    expect(parseSlashCommand("/search: notes about auth")).toMatchObject({
      name: "search",
      rawArguments: "notes about auth",
    });
  });

  it("does not parse escaped or inline slashes", () => {
    expect(parseSlashCommand("//not-a-command")).toBeUndefined();
    expect(isLiteralSlashText("//not-a-command")).toBe(true);
    expect(unescapeLiteralSlash("//not-a-command")).toBe("/not-a-command");
    expect(parseSlashCommand("please /skills later")).toBeUndefined();
  });
});
