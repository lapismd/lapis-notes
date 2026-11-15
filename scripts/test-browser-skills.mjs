import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve, join } from "node:path";
import { build } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { chromium } from "playwright";

test("public packaged skill installer protects real browser filesystem storage across cold restart", async () => {
  await mkdir(".local", { recursive: true });
  const temp = await mkdtemp(resolve(".local/browser-skills-"));
  const entry = join(temp, "entry.js");
  await writeFile(
    entry,
    `
    import { BrowserHandleVaultAdapter, MemoryKeyValueStore } from "@lapis-notes/api";
    import { manageSkills } from "@lapis-notes/api/skill-management";
    globalThis.skillAcceptance = { BrowserHandleVaultAdapter, MemoryKeyValueStore, manageSkills };
  `,
  );
  let browser;
  let server;
  try {
    await build({
      configFile: false,
      logLevel: "error",
      plugins: [svelte({ configFile: false })],
      build: {
        outDir: join(temp, "dist"),
        minify: false,
        lib: { entry, formats: ["es"], fileName: () => "acceptance.js" },
        rollupOptions: { output: { inlineDynamicImports: true } },
      },
    });
    const script = await readFile(join(temp, "dist/acceptance.js"));
    server = createServer((request, response) => {
      if (request.url === "/acceptance.js") {
        response.writeHead(200, { "content-type": "text/javascript" });
        response.end(script);
      } else {
        response.writeHead(200, { "content-type": "text/html" });
        response.end(
          '<!doctype html><script type="module" src="/acceptance.js"></script>',
        );
      }
    });
    await new Promise((done) => server.listen(0, "127.0.0.1", done));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const profile = join(temp, "profile");
    browser = await chromium.launchPersistentContext(profile, {
      headless: true,
    });
    let page = await browser.newPage();
    await page.goto(origin);
    await page.waitForFunction(() => globalThis.skillAcceptance);
    const results = await page.evaluate(async () => {
      const { BrowserHandleVaultAdapter, MemoryKeyValueStore, manageSkills } =
        globalThis.skillAcceptance;
      const output = [];
      for (const kind of ["opfs", "file-system-access"]) {
        const root = await (
          await navigator.storage.getDirectory()
        ).getDirectoryHandle(kind, { create: true });
        const adapter = new BrowserHandleVaultAdapter(root, kind, {
          vaultId: kind,
          stateStore: new MemoryKeyValueStore(),
        });
        const skill = {
          name: "lapis-browser",
          source: "example",
          version: "1",
          files: { "SKILL.md": "one", "references/old.md": "reference" },
        };
        const peer = new BrowserHandleVaultAdapter(root, kind, {
          vaultId: kind,
          stateStore: new MemoryKeyValueStore(),
        });
        const simultaneous = await Promise.all([
          manageSkills(adapter, [skill], "install"),
          manageSkills(peer, [skill], "install"),
        ]);
        output.push(simultaneous.map(([result]) => result.status));
        output.push(
          (await manageSkills(adapter, [skill], "install"))[0].status,
        );
        const next = { ...skill, version: "2", files: { "SKILL.md": "two" } };
        output.push((await manageSkills(adapter, [next], "update"))[0].status);
        output.push(
          await adapter.exists(
            ".agents/skills/lapis-browser/references/old.md",
          ),
        );
        await adapter.write(
          ".agents/skills/lapis-browser/SKILL.md",
          "local edit",
        );
        output.push((await manageSkills(adapter, [skill], "update"))[0].reason);
        const binarySkill = {
          name: "lapis-binary",
          source: "example",
          version: "1",
          files: { "SKILL.md": "one", "reference.md": "\uFFFD" },
        };
        await manageSkills(adapter, [binarySkill], "install");
        await adapter.writeBinary(
          ".agents/skills/lapis-binary/reference.md",
          new Uint8Array([0xff]).buffer,
        );
        output.push(
          (
            await manageSkills(
              adapter,
              [{ ...binarySkill, version: "2", files: { "SKILL.md": "two" } }],
              "update",
            )
          )[0].reason,
        );
        output.push(await adapter.read(".agents/skills/lapis-binary/SKILL.md"));
        output.push([
          ...new Uint8Array(
            await adapter.readBinary(
              ".agents/skills/lapis-binary/reference.md",
            ),
          ),
        ]);
        const competing = await Promise.allSettled([
          adapter.writeTextIfUnchanged(
            ".agents/skills/lapis-browser/SKILL.md",
            "first edit",
            "local edit",
          ),
          adapter.writeTextIfUnchanged(
            ".agents/skills/lapis-browser/SKILL.md",
            "second edit",
            "local edit",
          ),
        ]);
        output.push(competing.map((result) => result.status));
      }
      return output;
    });
    const expected = [
      ["installed", "unchanged"],
      "unchanged",
      "updated",
      false,
      "locally-modified",
      "locally-modified",
      "one",
      [255],
      ["fulfilled", "rejected"],
    ];
    assert.deepEqual(results, [...expected, ...expected]);
    await browser.close();
    browser = await chromium.launchPersistentContext(profile, {
      headless: true,
    });
    page = await browser.newPage();
    await page.goto(origin);
    await page.waitForFunction(() => globalThis.skillAcceptance);
    const cold = await page.evaluate(async () => {
      const { BrowserHandleVaultAdapter, MemoryKeyValueStore, manageSkills } =
        globalThis.skillAcceptance;
      const output = [];
      for (const kind of ["opfs", "file-system-access"]) {
        const root = await (
          await navigator.storage.getDirectory()
        ).getDirectoryHandle(kind);
        const adapter = new BrowserHandleVaultAdapter(root, kind, {
          vaultId: kind,
          stateStore: new MemoryKeyValueStore(),
        });
        const skill = {
          name: "lapis-browser",
          source: "example",
          version: "3",
          files: { "SKILL.md": "upgrade" },
        };
        output.push((await manageSkills(adapter, [skill], "update"))[0].reason);
        output.push(
          await adapter.read(".agents/skills/lapis-browser/SKILL.md"),
        );
        output.push(
          (
            await manageSkills(
              adapter,
              [
                {
                  name: "lapis-binary",
                  source: "example",
                  version: "3",
                  files: { "SKILL.md": "three" },
                },
              ],
              "update",
            )
          )[0].reason,
        );
        output.push([
          ...new Uint8Array(
            await adapter.readBinary(
              ".agents/skills/lapis-binary/reference.md",
            ),
          ),
        ]);
        output.push(
          JSON.parse(await adapter.read(".agents/.lapis-skills.json"))
            .schemaVersion,
        );
      }
      return output;
    });
    assert.deepEqual(cold, [
      "locally-modified",
      "first edit",
      "locally-modified",
      [255],
      1,
      "locally-modified",
      "first edit",
      "locally-modified",
      [255],
      1,
    ]);
  } finally {
    await browser?.close();
    if (server) await new Promise((done) => server.close(done));
    await rm(temp, { recursive: true, force: true });
  }
});
