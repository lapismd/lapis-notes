<script lang="ts" module>
  import type { App } from "@lapis-notes/api";
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect, userEvent, waitFor, within } from "storybook/test";
  import { CvPluginShellExample } from "./CvPluginShell.example-sources";
  import CvPluginShellDemo from "./CvPluginShellDemo.svelte";

  const { Story } = defineMeta({
    title: "CV/Plugin Shell",
    component: CvPluginShellDemo,
    parameters: {
      layout: "fullscreen",
      docs: {
        canvas: { className: "workspace-shell-docs-canvas" },
        source: {
          code: CvPluginShellExample,
          language: "svelte",
          type: "code",
        },
        story: {
          height: "700px",
          inline: false,
        },
      },
    },
  });

  function demoApp(canvasElement: HTMLElement): App {
    const root = canvasElement.querySelector<HTMLElement & { __lapisApp?: App }>(
      '[data-testid="cv-plugin-shell-demo"]',
    );
    if (!root?.__lapisApp) {
      throw new Error("The CV plugin shell story has no active Lapis app");
    }
    return root.__lapisApp;
  }
</script>

<Story
  name="Explorer And Search"
  parameters={{
    docs: {
      description: {
        story: "Boot a real App with File Explorer, Search, and the optional CV FileView restored from persisted layout.",
      },
    },
  }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvasElement.style.height = `${window.innerHeight}px`;
    canvasElement.style.maxHeight = `${window.innerHeight}px`;
    canvasElement.style.overflow = "hidden";
    await waitFor(
      () => {
        expect(canvas.getByTestId("cv-plugin-shell-status")).toHaveTextContent(
          "ready",
        );
        expect(
          canvas
            .getByTestId("cv-plugin-shell-demo")
            .querySelector('[data-app-shell-ready="true"]'),
        ).toBeTruthy();
      },
      { timeout: 8_000 },
    );

    const app = demoApp(canvasElement);
    expect(app.plugins.isPluginEnabled("cv")).toBe(true);
    expect(app.plugins.isPluginEnabled("lapis-file-explorer")).toBe(true);
    expect(app.plugins.isPluginEnabled("search")).toBe(true);

    const explorer = within(canvas.getByTestId("lapis-editor-explorer"));
    expect(explorer.getByRole("button", { name: "sample.cv.yml" })).toBeTruthy();
    expect(canvas.getByTestId("search-panel")).toBeTruthy();
    expect(app.workspace.activeLeaf?.view.getViewType()).toBe("cv");
    const shell = canvas.getByTestId("cv-workspace");
    expect(getComputedStyle(shell).overflow).toBe("hidden");
    await waitFor(
      () => {
        expect(
          shell.clientHeight,
          `cv-workspace ${shell.clientHeight}x${shell.clientWidth} window=${window.innerHeight}`,
        ).toBeGreaterThan(100);
      },
      { timeout: 8_000 },
    );
    expect(shell.clientHeight).toBeLessThanOrEqual(window.innerHeight + 1);
    expect(shell.scrollHeight).toBeLessThanOrEqual(shell.clientHeight + 1);
    expect(shell.scrollTop).toBe(0);

    const formRoot = await waitFor(() => canvas.getByTestId("structured-cv"));
    const formScroller =
      formRoot.querySelector<HTMLElement>("[data-ui-part='scroll-area-viewport']") ??
      formRoot;
    await waitFor(() => {
      expect(
        formScroller.clientHeight,
        `form scroller ${formScroller.clientHeight} shell ${shell.clientHeight}`,
      ).toBeGreaterThan(100);
    });
    expect(formScroller.clientHeight).toBeLessThan(shell.clientHeight);
    expect(formScroller.scrollHeight).toBeGreaterThan(formScroller.clientHeight + 1);
    formScroller.scrollTo({ top: formScroller.scrollHeight });
    await waitFor(() => {
      expect(formScroller.scrollTop).toBeGreaterThan(0);
    });
    expect(shell.scrollTop).toBe(0);
    formScroller.scrollTo({ top: 0 });
    expect(canvasElement.ownerDocument.querySelectorAll("main")).toHaveLength(1);

    const search = within(canvas.getByTestId("search-panel"));
    const searchbox = search.getByRole("searchbox", { name: "Search vault" });
    await userEvent.click(searchbox);
    await userEvent.type(searchbox, "cv-plugin-shell");
    await waitFor(() => {
      expect(
        search.getByRole("treeitem", {
          name: /Notes\/Welcome\.md/,
        }),
      ).toBeTruthy();
    });
    expect(search.queryByText("sample.cv.yml")).toBeNull();
    expect(search.queryByText(/sample\.cv\.yml/)).toBeNull();

    const exportButton = canvas.getByRole("button", { name: "Export PDF" });
    await waitFor(
      () => {
        expect(exportButton).not.toBeDisabled();
      },
      { timeout: 30_000 },
    );
    await userEvent.click(exportButton);
    const menu = within(canvasElement.ownerDocument.body);
    expect(menu.getByRole("menuitem", { name: "Download PDF" })).toBeTruthy();
    await userEvent.click(menu.getByRole("menuitem", { name: "Save PDF to vault" }));
    const pdf = await waitFor(() => {
      const file = app.vault.getFiles().find((candidate) => candidate.extension === "pdf");
      expect(file).toBeTruthy();
      return file!;
    });
    expect(pdf.parent?.path ?? "").toBe("");
    expect(pdf.name).toMatch(/_typst\.pdf$/);
    expect(new Uint8Array(await app.vault.readBinary(pdf)).byteLength).toBeGreaterThan(0);
    expect(canvas.getByRole("status")).toHaveTextContent(`Saved PDF to ${pdf.path}`);
  }}
/>
