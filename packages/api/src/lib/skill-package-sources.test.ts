import { describe, expect, it } from "vitest";
import { MemoryVaultAdapter } from "./storage/memory-vault-adapter";
import { sha256Hex } from "./plugin-distribution/hashes";
import { collectAppSkillPackages } from "./skill-package-sources";
import type { App } from "./context.svelte";
import type { InstalledPluginRecord } from "./plugin-distribution/types";

describe("installed plugin skill assets", () => {
  it("reads enabled manifest-only skills and rejects tampered supporting files", async () => {
    const adapter = new MemoryVaultAdapter();
    const root = ".lapis/plugins/example/";
    const contents = {
      "manifest.json": JSON.stringify({
        id: "example",
        version: "1.0.0",
        lapis: {
          contributes: {
            agentSkills: [{ name: "example", directory: "skills/example" }],
          },
        },
      }),
      "skills/example/SKILL.md":
        "---\nname: example\ndescription: Example workflow.\n---\nInstructions",
      "skills/example/references/details.md": "packaged details",
    };
    const files = [];
    for (const [path, body] of Object.entries(contents)) {
      const destination = root + path;
      await adapter.mkdir(destination.slice(0, destination.lastIndexOf("/")), {
        recursive: true,
      });
      await adapter.write(destination, body);
      files.push({
        path,
        sha256: await sha256Hex(body),
        size: new TextEncoder().encode(body).length,
      });
    }
    const record = {
      pluginId: "example",
      installedVersion: "1.0.0",
      files,
    } as InstalledPluginRecord;
    let enabled = true;
    const app = {
      vault: { adapter },
      plugins: {
        plugins: new Map(),
        isPluginEnabled: () => false,
        getCommunityPluginDiagnostics: () => ({
          state: enabled ? "enabled" : "disabled",
        }),
      },
      pluginDistribution: { listInstalled: async () => [record] },
    } as unknown as App;
    expect((await collectAppSkillPackages(app))[0]).toMatchObject({
      name: "example",
      source: "example",
      version: "1.0.0",
      files: { "references/details.md": "packaged details" },
    });
    enabled = false;
    expect(await collectAppSkillPackages(app)).toEqual([]);
    enabled = true;
    await adapter.write(
      root + "skills/example/references/details.md",
      "tampered",
    );
    await expect(collectAppSkillPackages(app)).rejects.toThrow(
      /SHA-256|hash|size/i,
    );
  });
});
