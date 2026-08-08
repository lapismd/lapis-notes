import { describe, expect, it } from "vitest";
import { applyFrontmatterMutation } from "./apply-frontmatter-mutation";
import { writeFrontmatter } from "../metadata/extract-metadata";

describe("frontmatter write + mutate", () => {
  it("serializes a frontmatter object directly (processor write contract)", () => {
    const write = (data: Record<string, unknown>) =>
      writeFrontmatter((data ?? {}) as Record<string, unknown>);
    const yaml = write({
      title: "Welcome",
      tags: ["demo", "markdown"],
      status: "ready",
    });
    expect(yaml).toContain("title: Welcome");
    expect(yaml).toContain("status: ready");
    expect(yaml).toContain("- demo");

    // Guard the old bug: treating the FM object as CachedMetadata yields empty YAML.
    const brokenWrite = (cache: { frontmatter?: Record<string, unknown> }) =>
      writeFrontmatter(cache.frontmatter ?? {});
    expect(brokenWrite({ title: "Welcome" } as any)).not.toContain("title");
  });

  it("applies nested path mutations used by updateFrontmatterProperty", () => {
    const frontmatter: Record<string, unknown> = { title: "A" };
    applyFrontmatterMutation(frontmatter, "status", "ready");
    applyFrontmatterMutation(frontmatter, "custom.owner", "steve");
    expect(frontmatter).toEqual({
      title: "A",
      status: "ready",
      custom: { owner: "steve" },
    });
    applyFrontmatterMutation(frontmatter, "status", null);
    expect(frontmatter.status).toBeUndefined();
  });
});
