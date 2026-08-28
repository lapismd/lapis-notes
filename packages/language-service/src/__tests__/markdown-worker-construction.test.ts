import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const markdownSource = readFileSync(
  fileURLToPath(new URL("../markdown.ts", import.meta.url)),
  "utf8",
);

describe("Markdown language-service worker construction", () => {
  it("uses the emitted module-worker URL in packed consumers", () => {
    expect(markdownSource).toContain(
      'new URL("./workers/markdownlint.worker.js", import.meta.url)',
    );
    expect(markdownSource).toContain('type: "module"');
    expect(markdownSource).not.toContain("?worker");
  });
});
