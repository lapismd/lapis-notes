import { expect, test, type Locator, type Page } from "@playwright/test";

const storyUrl =
  "/iframe.html?id=workspace-plugins-bases--file-view&viewMode=story";

test.describe.configure({ mode: "serial" });

async function drag(page: Page, source: Locator, target: Locator): Promise<void> {
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  expect(sourceBox).not.toBeNull();
  expect(targetBox).not.toBeNull();
  if (!sourceBox || !targetBox) return;

  const start = {
    x: sourceBox.x + sourceBox.width / 2,
    y: sourceBox.y + sourceBox.height / 2,
  };
  const end = {
    x: targetBox.x + targetBox.width / 2,
    y: targetBox.y + targetBox.height / 2,
  };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 8, start.y + 4, { steps: 4 });
  await page.mouse.move(end.x, end.y, { steps: 16 });
  await page.mouse.up();
}

async function basesSource(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const root = document.querySelector<HTMLElement & {
      __lapisApp?: {
        vault: {
          getFileByPath(path: string): unknown;
          read(file: unknown): Promise<string>;
        };
      };
    }>('[data-testid="bases-editor-shell-demo"]');
    const app = root?.__lapisApp;
    const file = app?.vault.getFileByPath("Bases/Projects.base");
    if (!app || !file) throw new Error("The real-App Bases fixture is unavailable");
    return app.vault.read(file);
  });
}

function sectionLines(source: string, key: string): string {
  const lines = source.split("\n");
  const start = lines.findIndex((line) => line.trim() === `${key}:`);
  if (start < 0) return "";
  const indent = lines[start]!.length - lines[start]!.trimStart().length;
  const section: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (!line.trim()) continue;
    const lineIndent = line.length - line.trimStart().length;
    if (lineIndent <= indent) break;
    section.push(line);
  }
  return section.join("\n");
}

function viewSource(source: string, name: string): string {
  const lines = source.split("\n");
  const start = lines.findIndex((line) => line.trim() === `name: ${name}`);
  if (start < 0) return "";
  const indent = lines[start]!.length - lines[start]!.trimStart().length;
  const view: string[] = [];
  for (const line of lines.slice(start)) {
    const lineIndent = line.length - line.trimStart().length;
    if (
      view.length > 0 &&
      lineIndent < indent &&
      line.trimStart().startsWith("- type:")
    ) {
      break;
    }
    view.push(line);
  }
  return view.join("\n");
}

function sectionProperties(source: string, key: string): string[] {
  return [...sectionLines(source, key).matchAll(/property:\s+([^\s]+)/g)].map(
    (property) => property[1]!,
  );
}

function sectionItems(source: string, key: string): string[] {
  return [...sectionLines(source, key).matchAll(/^\s+-\s+([^\s]+)/gm)].map(
    (item) => item[1]!,
  );
}

test("sort clauses and table columns persist after real pointer drags", async ({
  page,
}) => {
  await page.goto(storyUrl);
  const status = page.getByTestId("bases-editor-shell-status");
  try {
    await expect(status).toHaveText("ready", { timeout: 30_000 });
  } catch {
    await page.reload();
    await expect(status).toHaveText("ready", { timeout: 60_000 });
  }
  const table = page.locator('[data-ui-component="bases-table-view"]');
  await expect(table).toBeVisible();

  await page.getByRole("button", { name: "Sort", exact: true }).click();
  await page.getByRole("button", { name: "Add sort" }).click();
  const sortRows = page.locator(".filter-row");
  await expect(sortRows).toHaveCount(2);
  await sortRows.last().getByRole("button").filter({ hasText: "Property" }).click();
  await page.getByText("Owner", { exact: true }).last().click();

  await expect.poll(async () => sectionProperties(
    viewSource(await basesSource(page), "Portfolio table"),
    "sort",
  ))
    .toEqual(["note.score", "note.owner"]);
  await drag(
    page,
    sortRows.first().locator(".drag-handle"),
    sortRows.last().locator(".drag-handle"),
  );
  await expect.poll(async () => sectionProperties(
    viewSource(await basesSource(page), "Portfolio table"),
    "sort",
  ))
    .toEqual(["note.owner", "note.score"]);

  await page.getByRole("button", { name: "Sort", exact: true }).click();
  const project = page.getByRole("button", { name: "Reorder Project column" });
  const owner = page.getByRole("button", { name: "Reorder Owner column" });
  await drag(page, project, owner);
  await expect.poll(async () => sectionItems(
    viewSource(await basesSource(page), "Portfolio table"),
    "order",
  ))
    .toEqual([
      "note.status",
      "note.owner",
      "file.name",
      "note.score",
      "note.due",
    ]);
});
