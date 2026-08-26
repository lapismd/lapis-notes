import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import {
  APP_ICON_GEOMETRY,
  APP_ICON_PALETTES,
  createAppIconSvg,
} from "./app-icon-assets.mjs";

describe("Deno desktop app icon assets", () => {
  it("wraps the established Lapis mark in a rounded appearance background", async () => {
    const source = await readFile(
      new URL("../src/assets/lapis-logo.svg", import.meta.url),
      "utf8",
    );
    const light = createAppIconSvg(source, "light");
    const dark = createAppIconSvg(source, "dark");

    expect(light).toContain(
      `<rect x="${APP_ICON_GEOMETRY.backgroundInset}" y="${APP_ICON_GEOMETRY.backgroundInset}"`,
    );
    expect(light).toContain(`rx="${APP_ICON_GEOMETRY.backgroundRadius}"`);
    expect(light).toContain(APP_ICON_PALETTES.light.backgroundEnd);
    expect(dark).toContain(APP_ICON_PALETTES.dark.backgroundEnd);
    expect(dark).toContain(`fill="${APP_ICON_PALETTES.dark.logo}"`);
    expect(dark).not.toBe(light);
  });

  it("keeps checked light, dark, and fallback assets distinct and reproducible", async () => {
    const [fallback, light, dark] = await Promise.all(
      ["icon.png", "icon-light.png", "icon-dark.png"].map((name) =>
        readFile(new URL(`../build/${name}`, import.meta.url))
      ),
    );
    const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

    expect(digest(fallback)).toBe(digest(light));
    expect(digest(dark)).not.toBe(digest(light));
  });
});
