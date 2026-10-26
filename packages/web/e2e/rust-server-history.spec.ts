import { test, expect, type Page } from "@playwright/test";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { resolve, join } from "node:path";
import { RustServerRuntime, unusedLoopbackPort } from "./rust-server-runtime";

async function command(page: Page, name: string) {
  await page
    .getByRole("button", { name: "Open command palette", exact: true })
    .click();
  const palette = page.getByRole("dialog", { name: "Command Palette" });
  await palette.getByRole("combobox", { name: "Search commands" }).fill(name);
  await palette.getByRole("option", { name: new RegExp(name) }).click();
  await expect(palette).toHaveCount(0);
}

test("retained Repository read, Search and blame use admitted native history across cold restart", async ({
  page,
}, testInfo) => {
  const repository = resolve("../..");
  await mkdir(join(repository, ".local"), { recursive: true });
  const root = await mkdtemp(join(repository, ".local/rust-hosted-history-"));
  const origin = `http://localhost:${await unusedLoopbackPort()}`;
  const password = randomBytes(32).toString("base64url");
  const runtime = new RustServerRuntime(root, repository, origin, password);
  const original =
    "# Hosted Repository note\n\nsaved immutable cobalt phrase\n";
  await mkdir(runtime.vault, { recursive: true });
  await writeFile(join(runtime.vault, "Note.md"), original);
  const reads: string[] = [];
  const controls: string[] = [];
  const failures: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "POST") return;
    if (/\/history\/(heads|open|status|read|blame|close)$/u.test(request.url()))
      reads.push(request.url().split("/").at(-1)!);
    if (request.url().endsWith("/history-index"))
      controls.push(request.postDataJSON().kind);
  });
  page.on("response", (response) => {
    if (/\/history(?:\/|-index)/u.test(response.url()) && !response.ok())
      failures.push(`${response.status()} ${response.url()}`);
  });
  const open = async () => {
    await page.goto(origin);
    await expect(
      page.getByRole("heading", { name: /^(Sign in|Your vaults)$/u }),
    ).toBeVisible();
    if (await page.getByLabel("Username").count()) {
      await page.getByLabel("Username").fill("owner");
      await page.getByLabel("Password").fill(password);
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
    }
    await page
      .getByRole("button", { name: "Open Rust vault", exact: true })
      .click();
    await expect(page.getByText("Server DB", { exact: true })).toBeVisible();
  };
  const historySearch = async (phrase: string) => {
    await command(page, "Search saved vault history");
    await page.getByRole("searchbox", { name: "Search vault" }).fill(phrase);
    await expect(
      page.getByRole("treeitem", { name: /Note\.md,/ }),
    ).toBeVisible();
  };
  try {
    await runtime.start();
    await open();
    await command(page, "Open Repository History");
    const history = page.getByRole("region", {
      name: "Repository history",
      exact: true,
    });
    await expect(history).toBeVisible();
    const revisions = history.getByRole("list", {
      name: "Revision graph",
      exact: true,
    });
    await expect(
      revisions.locator("button.repository-graph-select").first(),
    ).toBeVisible();
    await revisions.locator("button.repository-graph-select").nth(1).click();
    await history
      .getByRole("region", { name: "Changed files", exact: true })
      .getByText("Note.md", { exact: true })
      .click();
    await expect(
      history.getByRole("region", { name: "Changes to Note.md", exact: true }),
    ).toContainText("saved immutable cobalt phrase");

    await page.locator('[data-path="Note.md"]').click();
    await expect(
      page.locator(".cm-content[contenteditable=true]").last(),
    ).toBeVisible();
    const blame = page
      .getByRole("button", { name: "Blame file", exact: true })
      .first();
    await expect(blame).toBeEnabled();
    await blame.click();
    await expect(
      page.getByRole("region", { name: "Blame for Note.md", exact: true }),
    ).toContainText("saved immutable cobalt phrase");
    await historySearch("saved immutable cobalt phrase");
    await expect.poll(() => controls.includes("start")).toBe(true);
    expect(reads).toEqual(
      expect.arrayContaining(["heads", "open", "status", "read", "blame"]),
    );
    expect(
      controls.every((kind) =>
        ["start", "status", "query", "context"].includes(kind),
      ),
    ).toBe(true);
    expect(await readFile(join(runtime.vault, "Note.md"), "utf8")).toBe(
      original,
    );

    await page.goto("about:blank");
    await writeFile(
      join(runtime.vault, "Note.md"),
      "# Changed on disk\n\nsecond detached cobalt phrase\n",
    );
    await runtime.restart();
    await open();
    await historySearch("saved immutable cobalt phrase");
    await page
      .getByRole("searchbox", { name: "Search vault" })
      .fill("second detached cobalt phrase");
    await expect(
      page.getByRole("treeitem", { name: /Note\.md,/ }),
    ).toBeVisible();
    expect(failures).toEqual([]);
    await page.goto("about:blank");
  } catch (error) {
    await testInfo.attach("Rust History host log", {
      body: runtime.logs,
      contentType: "text/plain",
    });
    await testInfo.attach("History requests", {
      body: JSON.stringify({ reads, controls, failures }, null, 2),
      contentType: "application/json",
    });
    throw error;
  } finally {
    await runtime.stop();
  }
});
