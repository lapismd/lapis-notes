import type { App } from "@lapis-notes/api";
import { expect } from "storybook/test";

/** A spoken label contains filename/count/path; the caption retains file identity. */
export function searchResultIdentity(row: HTMLElement, app: App) {
  const caption = row
    .closest(".search-panel__result")
    ?.querySelector<HTMLElement>(".search-panel__match-path");
  const file = app.vault.getFileByPath(caption?.title ?? "");
  expect(
    file,
    "Every result caption must identify a real file in the owned vault",
  ).not.toBeNull();
  return { path: file!.path, basename: file!.basename };
}
