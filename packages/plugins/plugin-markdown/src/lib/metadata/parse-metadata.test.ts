import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const parseMetadataSource = readFileSync(
  fileURLToPath(new URL("./parse-metadata.ts", import.meta.url)),
  "utf8",
);

describe("parse-metadata worker import", () => {
  it("keeps the Vite worker specifier extensionless for packaged consumers", () => {
    expect(parseMetadataSource).toContain(
      'from "./metadata-worker?worker&inline"',
    );
    expect(parseMetadataSource).not.toContain("metadata-worker.ts?worker");
  });
});
