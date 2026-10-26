import { test, expect } from "@playwright/test";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { resolve, join } from "node:path";
import { RustServerRuntime, unusedLoopbackPort } from "./rust-server-runtime";

test("the retained hosted workspace observes one native metadata owner across detach", async ({
  page,
  context,
}, testInfo) => {
  const repository = resolve("../..");
  await mkdir(join(repository, ".local"), { recursive: true });
  const root = await mkdtemp(join(repository, ".local/rust-hosted-metadata-"));
  const origin = `http://localhost:${await unusedLoopbackPort()}`;
  const password = randomBytes(32).toString("base64url");
  const runtime = new RustServerRuntime(root, repository, origin, password);
  const indexing: Array<{ url: string; kind: string }> = [];
  const clientWrites: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "POST") return;
    if (request.url().endsWith("/indexing"))
      indexing.push({ url: request.url(), kind: request.postDataJSON().kind });
    if (request.url().endsWith("/database")) {
      const call = request.postDataJSON();
      if (
        [
          "upsertIndexedFile",
          "deleteIndexedFile",
          "renameIndexedFile",
          "saveMetadataSnapshot",
        ].includes(call.method) ||
        (call.method === "setMeta" &&
          call.args[0]?.value === "metadata-cache.reconcile-checkpoint.v1")
      )
        clientWrites.push(call.method);
    }
  });
  try {
    await runtime.start();
    await page.goto(origin);
    await page.getByLabel("Username").fill("owner");
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page
      .getByRole("button", { name: "Open Rust vault", exact: true })
      .click();
    await expect(page.getByText("Server DB", { exact: true })).toBeVisible();
    await expect
      .poll(() => indexing.some(({ kind }) => kind === "select_metadata"))
      .toBe(true);
    await expect
      .poll(() => indexing.some(({ kind }) => kind === "refresh"))
      .toBe(true);
    const selected = indexing.find(({ kind }) => kind === "select_metadata")!;
    const clientPath = selected.url.slice(0, -"/indexing".length);
    expect(
      indexing.filter(({ kind }) => kind === "select_metadata"),
    ).toHaveLength(1);
    const current = await context.request.get(`${origin}/api/v3/auth/current`, {
      headers: { "x-lapis-protocol": "3" },
    });
    const { csrf_token } = await current.json();
    const headers = {
      "x-lapis-protocol": "3",
      "x-lapis-csrf": csrf_token,
      origin,
    };
    const record = async (client: string, path: string) => {
      const response = await context.request.post(`${client}/database`, {
        headers,
        data: {
          method: "getIndexedFile",
          args: [{ kind: "value", value: path }],
        },
      });
      expect(response.ok()).toBe(true);
      const value = await response.json();
      return value.kind === "value" ? value.value : null;
    };
    await expect
      .poll(
        async () =>
          (await record(clientPath, "Note.md"))?.metadata.metadata.headings[0]
            ?.heading,
      )
      .toBe("Native hosted note");
    const fenced = await context.request.post(`${clientPath}/database`, {
      headers,
      data: {
        method: "deleteIndexedFile",
        args: [{ kind: "value", value: "Note.md" }],
      },
    });
    expect(fenced.status()).toBe(403);
    await page.locator('[data-path="Note.md"]').click();
    const editor = page.locator(".cm-content[contenteditable=true]").last();
    const text = "# Saved with native metadata\n\n#hosted\n";
    await editor.fill(text);
    await expect
      .poll(() => readFile(join(runtime.vault, "Note.md"), "utf8"))
      .toBe(text);
    await expect
      .poll(
        async () =>
          (await record(clientPath, "Note.md"))?.metadata.metadata.headings[0]
            ?.heading,
      )
      .toBe("Saved with native metadata");
    await page.getByRole("tab", { name: "Search", exact: true }).click();
    await page
      .getByRole("searchbox", { name: "Search vault" })
      .fill("observer delivery after native publication");
    await writeFile(
      join(runtime.vault, "Observer.md"),
      "# Observer\n\nobserver delivery after native publication\n",
    );
    await expect(
      page.getByRole("treeitem", { name: /Observer\.md,/ }),
    ).toBeVisible();
    expect(clientWrites).toEqual([]);
    expect(indexing.some(({ kind }) => kind === "select_search")).toBe(false);

    const detached = await context.request.delete(clientPath, { headers });
    expect(detached.status()).toBe(204);
    await page.close();
    await writeFile(
      join(runtime.vault, "After-detach.md"),
      "# Native after detach\n",
    );
    const attached = await context.request.post(
      `${origin}/api/v3/vaults/${runtime.vaultId}/clients`,
      {
        headers,
        data: { protocol_version: 3 },
      },
    );
    expect(attached.status()).toBe(200);
    const { client_id } = await attached.json();
    const observer = `${origin}/api/v3/clients/${client_id}`;
    try {
      await expect
        .poll(
          async () =>
            (await record(observer, "After-detach.md"))?.metadata.metadata
              .headings[0]?.heading,
        )
        .toBe("Native after detach");
      expect(await readFile(join(runtime.vault, "Note.md"), "utf8")).toBe(text);
    } finally {
      expect(
        (await context.request.delete(observer, { headers })).status(),
      ).toBe(204);
    }
  } catch (error) {
    await testInfo.attach("Rust metadata host log", {
      body: runtime.logs,
      contentType: "text/plain",
    });
    throw error;
  } finally {
    await runtime.stop();
  }
});
