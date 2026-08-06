import { describe, expect, it } from "vitest";
import { sanitizeHTMLString } from "../loaders";

describe("loader DOM helpers", () => {
  it("removes scriptable markup from HTML strings", () => {
    const html = sanitizeHTMLString(
      `<a href="javascript:alert(1)" onclick="bad()">link</a><script>alert(1)</script><img src=x onerror=bad()>`,
    );

    expect(html).not.toContain("<script");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("<a");
    expect(html).toContain("<img");
  });
});
