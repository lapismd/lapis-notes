<script lang="ts" module>
  import type { App } from "@lapis-notes/api";
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect, userEvent, waitFor, within } from "storybook/test";
  import { RolesPluginShellExample } from "./RolesPluginShell.example-sources";
  import RolesPluginShellDemo from "./RolesPluginShellDemo.svelte";

  const { Story } = defineMeta({
    title: "Roles/Plugin Shell",
    component: RolesPluginShellDemo,
    tags: ["visual-pending"],
    parameters: {
      layout: "fullscreen",
      docs: {
        canvas: { className: "workspace-shell-docs-canvas" },
        source: {
          code: RolesPluginShellExample,
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
      '[data-testid="roles-plugin-shell-demo"]',
    );
    if (!root?.__lapisApp) {
      throw new Error("The Roles plugin shell story has no active Lapis app");
    }
    return root.__lapisApp;
  }
</script>

<Story
  name="Explorer Search Roles And CV"
  parameters={{
    docs: {
      description: {
        story: "Boot a real App with File Explorer, Search in a collapsed right sidebar, aggregate Roles, role.md, and the retained CV FileView restored from persisted layout.",
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
        expect(canvas.getByTestId("roles-plugin-shell-status")).toHaveTextContent(
          "ready",
        );
        expect(
          canvas
            .getByTestId("roles-plugin-shell-demo")
            .querySelector('[data-app-shell-ready="true"]'),
        ).toBeTruthy();
      },
      { timeout: 8_000 },
    );

    const app = demoApp(canvasElement);
    expect(app.plugins.isPluginEnabled("roles")).toBe(true);
    expect(app.plugins.isPluginEnabled("lapis-file-explorer")).toBe(true);
    expect(app.plugins.isPluginEnabled("search")).toBe(true);
    expect(app.workspace.rightSplit.collapsed).toBe(true);
    expect(canvas.queryByLabelText("Right sidebar")).toBeNull();
    const openRightSidebar = canvas.getByRole("button", {
      name: "Open right sidebar",
    });

    const explorer = within(canvas.getByTestId("lapis-editor-explorer"));
    expect(explorer.getByRole("button", { name: "sample.cv.yml" })).toBeTruthy();
    await userEvent.click(explorer.getByRole("button", { name: "Roles" }));
    await userEvent.click(explorer.getByRole("button", { name: "atlas-ai-infra" }));
    await waitFor(() => {
      expect(explorer.getByRole("button", { name: "role.md" })).toBeTruthy();
    });
    expect(app.workspace.getLeavesOfType("roles")).toHaveLength(1);
    expect(app.workspace.getLeavesOfType("role")).toHaveLength(1);
    expect(app.workspace.activeLeaf?.view.getViewType()).toBe("cv");

    await userEvent.click(openRightSidebar);
    await waitFor(() => {
      expect(app.workspace.rightSplit.collapsed).toBe(false);
      expect(canvas.getByLabelText("Right sidebar")).toBeTruthy();
      expect(canvas.getByTestId("search-panel")).toBeTruthy();
    });

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

    const formAreaScroll = canvas.getByTestId("cv-form-area-scroll");
    expect(formAreaScroll.contains(canvas.getByTestId("cv-theme-controls"))).toBe(true);
    await userEvent.click(canvas.getByRole("tab", { name: "Design" }));
    await waitFor(() => {
      expect(canvas.queryByTestId("cv-theme-controls")).toBeNull();
    });
    await userEvent.click(canvas.getByRole("tab", { name: "CV" }));
    await waitFor(() => {
      expect(formAreaScroll.contains(canvas.getByTestId("cv-theme-controls"))).toBe(true);
    });

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
    await userEvent.type(searchbox, "roles-plugin-shell");
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
    const svgDocument = await waitFor(
      () => {
        const document = shell.querySelector<HTMLImageElement>(
          '[data-testid="cv-preview-document"][data-preview-format="svg"]',
        );
        expect(document).toBeTruthy();
        return document!;
      },
      { timeout: 30_000 },
    );
    const previewRoot = canvas.getByTestId("cv-preview");
    const fittedWidth = previewRoot.getBoundingClientRect().width;
    expect(svgDocument.getBoundingClientRect().width).toBeCloseTo(fittedWidth, 0);
    await userEvent.click(canvas.getByRole("button", { name: "Zoom out" }));
    await waitFor(() => {
      expect(svgDocument.style.width).toBe("85%");
      expect(svgDocument.getBoundingClientRect().width).toBeCloseTo(fittedWidth * 0.85, 0);
    });
    expect(shell.scrollLeft).toBe(0);
    await userEvent.click(canvas.getByRole("button", { name: "Reset zoom" }));
    await waitFor(() => {
      expect(svgDocument.getBoundingClientRect().width).toBeCloseTo(fittedWidth, 0);
    });
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

    const closeRightSidebar = canvas.getByRole("button", {
      name: "Close right sidebar",
    });
    await waitFor(() => {
      expect(getComputedStyle(closeRightSidebar).pointerEvents).not.toBe("none");
      expect(getComputedStyle(canvasElement.ownerDocument.body).pointerEvents).not.toBe(
        "none",
      );
    });
    await userEvent.click(closeRightSidebar);
    await waitFor(() => {
      expect(app.workspace.rightSplit.collapsed).toBe(true);
      expect(canvas.queryByLabelText("Right sidebar")).toBeNull();
      expect(
        canvas.getByRole("button", { name: "Open right sidebar" }),
      ).toBeTruthy();
    });
  }}
/>
