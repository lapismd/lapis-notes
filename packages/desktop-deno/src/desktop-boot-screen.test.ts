import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const bootDocument = readFileSync(
  new URL("../index.html", import.meta.url),
  "utf8",
);

describe("Deno desktop boot screen", () => {
  it("shows a branded muted loading state before the renderer mounts", () => {
    expect(bootDocument).toContain('id="lapis-boot-status"');
    expect(bootDocument).toContain('role="status"');
    expect(bootDocument).toContain('src="/src/assets/lapis-logo.svg"');
    expect(bootDocument).toContain('alt="Lapis Notes"');
    expect(bootDocument).toContain('class="lapis-boot-status__text"');
    expect(bootDocument).toContain("Loading Lapis Notes");
    expect(bootDocument).toContain("color: #6b7280");
    expect(bootDocument).toContain("flex-direction: column");
    expect(bootDocument).toContain("align-items: center");
    expect(
      bootDocument.indexOf('class="lapis-boot-status__logo"'),
    ).toBeLessThan(bootDocument.indexOf('class="lapis-boot-status__text"'));
  });
});
