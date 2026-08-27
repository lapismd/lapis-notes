import { describe, expect, it } from "vitest";
import { ConversationScopeResolver } from "./scope-resolver";
import {
  normalizeConversationLocation,
  normalizeConversationScope,
  relativePathWithinScope,
} from "./paths";

describe("ConversationScopeResolver", () => {
  const resolver = new ConversationScopeResolver();

  it("prefers an explicit folder over the most recently active note", () => {
    expect(
      resolver.resolve({
        explicitFolder: "Projects/Explicit",
        activeFile: { path: "Projects/Active/note.md" },
      }),
    ).toEqual({ scopeDir: "Projects/Explicit", source: "explicit" });
  });

  it("uses the active note parent and falls back to the vault root", () => {
    expect(
      resolver.resolve({ activeFile: { path: "Projects/Atlas/note.md" } }),
    ).toEqual({ scopeDir: "Projects/Atlas", source: "active-file" });
    expect(resolver.resolve({ activeFile: { path: "root.md" } })).toEqual({
      scopeDir: "",
      source: "active-file",
    });
    expect(resolver.resolve({})).toEqual({
      scopeDir: "",
      source: "vault-root",
    });
  });

  it("skips hidden application folders when resolving from an active file", () => {
    expect(
      resolver.resolve({
        activeFile: { path: ".agents/skills/lapis-notes/SKILL.md" },
      }),
    ).toEqual({ scopeDir: "", source: "active-file" });
    expect(
      resolver.resolve({
        activeFile: { path: "Notes/.agents/skills/daily/SKILL.md" },
      }),
    ).toEqual({ scopeDir: "Notes", source: "active-file" });
    expect(
      resolver.resolve({
        activeFile: {
          path: "Notes/.lapis/agents/sessions/id/transcript.jsonl",
        },
      }),
    ).toEqual({ scopeDir: "Notes", source: "active-file" });
    expect(
      resolver.resolve({
        explicitFolder: ".agents/skills/lapis-notes",
        activeFile: { path: "Notes/daily.md" },
      }),
    ).toEqual({
      scopeDir: ".agents/skills/lapis-notes",
      source: "explicit",
    });
  });

  it("does not walk ancestors or accept traversal and absolute paths", () => {
    expect(normalizeConversationScope("Projects/Atlas")).toBe("Projects/Atlas");
    expect(() => normalizeConversationScope("Projects/../Atlas")).toThrow(
      /confined/u,
    );
    expect(() => normalizeConversationScope("/Users/test/vault")).toThrow(
      /vault-relative/u,
    );
    expect(() => normalizeConversationScope("Projects/.lapis/nested")).toThrow(
      /cannot be inside/u,
    );
  });

  it("validates UUIDv4 directory names and launch-path confinement", () => {
    expect(
      normalizeConversationLocation({
        scopeDir: "Projects/Atlas",
        conversationId: "123e4567-e89b-42d3-a456-426614174000",
      }),
    ).toEqual({
      scopeDir: "Projects/Atlas",
      conversationId: "123e4567-e89b-42d3-a456-426614174000",
    });
    expect(() =>
      normalizeConversationLocation({
        scopeDir: "",
        conversationId: "not-a-uuid",
      }),
    ).toThrow(/UUIDv4/u);
    expect(
      relativePathWithinScope(
        "Projects/Atlas",
        "Projects/Atlas/Notes/launch.md",
      ),
    ).toBe("Notes/launch.md");
    expect(() =>
      relativePathWithinScope("Projects/Atlas", "Projects/Other/note.md"),
    ).toThrow(/inside/u);
  });
});
