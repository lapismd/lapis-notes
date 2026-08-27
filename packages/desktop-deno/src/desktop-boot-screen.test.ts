import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const bootDocument = readFileSync(
  new URL("../index.html", import.meta.url),
  "utf8",
);

describe("Deno desktop boot screen", () => {
  it("shows only the branded logo visually before the renderer mounts", () => {
    expect(bootDocument).toContain('id="lapis-boot-status"');
    expect(bootDocument).toContain('role="status"');
    expect(bootDocument).toContain('aria-label="Loading Lapis Notes"');
    expect(bootDocument).toContain('src="/src/assets/lapis-logo.svg"');
    expect(bootDocument).toContain('alt=""');
    expect(bootDocument).not.toContain('class="lapis-boot-status__text"');
    expect(bootDocument).not.toContain(">Loading Lapis Notes<");
    expect(bootDocument).toContain("color: #6b7280");
    expect(bootDocument).toContain('status.removeAttribute("aria-label")');
  });
});
