import { describe, expect, it } from "vitest";
import { relocateConversationLocation } from "./conversation-locator";

describe("relocateConversationLocation", () => {
  const location = {
    scopeDir: "Projects/Atlas/Notes",
    conversationId: "123e4567-e89b-42d3-a456-426614174000",
  };

  it("updates a locator when its scope or an ancestor moves", () => {
    expect(
      relocateConversationLocation(location, "Projects", "Archive/Projects"),
    ).toEqual({ ...location, scopeDir: "Archive/Projects/Atlas/Notes" });
    expect(
      relocateConversationLocation(
        location,
        "Projects/Atlas/Notes",
        "Projects/Atlas/Writing",
      ),
    ).toEqual({ ...location, scopeDir: "Projects/Atlas/Writing" });
  });

  it("ignores unrelated or child moves", () => {
    expect(
      relocateConversationLocation(location, "Projects/Other", "Archive"),
    ).toBeNull();
    expect(
      relocateConversationLocation(
        location,
        "Projects/Atlas/Notes/file.md",
        "Projects/Atlas/Notes/renamed.md",
      ),
    ).toBeNull();
  });
});
