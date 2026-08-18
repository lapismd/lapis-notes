import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("Storybook AI host boundary", () => {
  it("starts lapis-ai-host from the root script and never as a Storybook sidecar", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(repoRoot, "package.json"), "utf8"),
    );
    const preview = readFileSync(
      resolve(repoRoot, ".storybook/preview.ts"),
      "utf8",
    );
    assert.match(manifest.scripts["ai-host"], /lapis-ai-host/);
    assert.equal(manifest.scripts["storybook:agent"], undefined);
    assert.match(preview, /maybeRegisterAgentRuntimeBridge/);
    assert.doesNotMatch(preview, /storybook:agent/);
    assert.match(preview, /Storybook never starts the host/);
  });
});
