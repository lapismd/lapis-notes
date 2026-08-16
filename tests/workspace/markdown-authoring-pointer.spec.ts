import { expect, test } from "@playwright/test";

test("Markdown authoring reorders a block through the real Mira drag handle", async ({
  page,
}) => {
  await page.goto(
    "/iframe.html?id=workspace-lapis-editor-demo--markdown-authoring&viewMode=story",
  );

  const status = page.getByTestId("lapis-editor-status");
  try {
    await expect(status).toHaveText("ready", { timeout: 30_000 });
  } catch {
    await page.reload();
    await expect(status).toHaveText("ready", { timeout: 60_000 });
  }
  const persisted = page.getByTestId("lapis-editor-target-contents");

  const editor = page.locator('.cm-editor[data-language="markdown"]');
  const firstLine = editor
    .locator(".cm-line")
    .filter({ hasText: "First draggable block." })
    .first();
  const secondLine = editor
    .locator(".cm-line")
    .filter({ hasText: "Second draggable block." })
    .first();
  await expect(firstLine).toBeVisible();
  await expect(secondLine).toBeVisible();

  const firstBox = await firstLine.boundingBox();
  const secondBox = await secondLine.boundingBox();
  expect(firstBox).not.toBeNull();
  expect(secondBox).not.toBeNull();
  if (!firstBox || !secondBox) return;

  // CodeMirror marks gutter columns aria-hidden, so locate its governed block
  // handle hook directly for real pointer geometry.
  const handles = editor.locator("button.mira-block-handle");
  await expect(handles.first()).toBeAttached();
  const handleCount = await handles.count();
  const handleBoxes = await Promise.all(
    Array.from({ length: handleCount }, (_, index) =>
      handles.nth(index).boundingBox(),
    ),
  );
  const closestHandleIndex = (targetY: number) => {
    let closest = -1;
    let distance = Number.POSITIVE_INFINITY;
    handleBoxes.forEach((box, index) => {
      if (!box) return;
      const nextDistance = Math.abs(box.y + box.height / 2 - targetY);
      if (nextDistance < distance) {
        closest = index;
        distance = nextDistance;
      }
    });
    return closest;
  };
  const sourceIndex = closestHandleIndex(firstBox.y + firstBox.height / 2);
  expect(sourceIndex).toBeGreaterThanOrEqual(0);
  const sourceBox = handleBoxes[sourceIndex];
  expect(sourceBox).not.toBeNull();
  if (!sourceBox) return;

  const sourceHandle = handles.nth(sourceIndex);
  await sourceHandle.hover();
  await expect(sourceHandle).toBeVisible();
  const dragSourceBox = await sourceHandle.boundingBox();
  const dragTargetBox = await secondLine.boundingBox();
  expect(dragSourceBox).not.toBeNull();
  expect(dragTargetBox).not.toBeNull();
  if (!dragSourceBox || !dragTargetBox) return;

  await page.mouse.move(
    dragSourceBox.x + dragSourceBox.width / 2,
    dragSourceBox.y + dragSourceBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    dragSourceBox.x + dragSourceBox.width / 2,
    dragSourceBox.y + dragSourceBox.height / 2 + 12,
    { steps: 4 },
  );
  await expect(editor).toHaveClass(/mira-block-controls-dragging/);
  await page.mouse.move(
    dragSourceBox.x + dragSourceBox.width / 2,
    dragTargetBox.y + dragTargetBox.height - 1,
    { steps: 12 },
  );
  await expect(editor.locator(".mira-block-drop-line")).not.toHaveAttribute(
    "hidden",
    "",
  );
  await page.mouse.up();

  await expect
    .poll(async () => {
      const contents = (await persisted.textContent()) ?? "";
      const first = contents.indexOf("First draggable block.");
      const second = contents.indexOf("Second draggable block.");
      return first >= 0 && second >= 0 && second < first;
    })
    .toBe(true);
});
