<script lang="ts" module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect, userEvent, waitFor, within } from "storybook/test";
  import CvWorkspace from "../lib/cv-workspace.svelte";
  import { sampleCvYaml } from "../lib/form/sample-cv.fixture";
  import { CvWorkspaceExample } from "./CvWorkspace.example-sources";

  const { Story } = defineMeta({
    title: "CV/Workspace",
    component: CvWorkspace,
    parameters: {
      docs: {
        canvas: { className: "workspace-shell-docs-canvas" },
        source: {
          code: CvWorkspaceExample,
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

  const previewModeNames = [
    "Typst SVG",
    "Typst PNG",
    "Typst source",
    "Markdown",
    "HTML",
  ] as const;

  function scrollViewport(root: HTMLElement): HTMLElement {
    return (
      root.querySelector<HTMLElement>("[data-ui-part='scroll-area-viewport']") ?? root
    );
  }

  function boundStoryCanvas(canvasElement: HTMLElement) {
    canvasElement.style.height = `${window.innerHeight}px`;
    canvasElement.style.maxHeight = `${window.innerHeight}px`;
    canvasElement.style.overflow = "hidden";
  }

  function assertLeafDoesNotScroll(shell: HTMLElement) {
    expect(getComputedStyle(shell).overflow).toBe("hidden");
    expect(shell.clientHeight).toBeGreaterThan(100);
    expect(shell.clientHeight).toBeLessThanOrEqual(window.innerHeight + 1);
    expect(shell.scrollHeight).toBeLessThanOrEqual(shell.clientHeight + 1);
    expect(shell.scrollTop).toBe(0);
  }

  function assertSmallText(element: HTMLElement) {
    expect(getComputedStyle(element).fontSize).toBe("14px");
    expect(getComputedStyle(element).fontFamily).toMatch(/DM Sans/i);
  }

  async function assertScrollerMoves(scroller: HTMLElement, shell: HTMLElement) {
    expect(scroller.clientHeight).toBeGreaterThan(100);
    expect(scroller.clientHeight).toBeLessThan(shell.clientHeight);
    expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight + 1);
    scroller.scrollTo({ top: scroller.scrollHeight });
    await waitFor(() => {
      expect(scroller.scrollTop).toBeGreaterThan(0);
    });
    expect(shell.scrollTop).toBe(0);
    scroller.scrollTo({ top: 0 });
  }

  async function openPreviewModes(canvas: ReturnType<typeof within>, root: HTMLElement) {
    await userEvent.click(canvas.getByRole("button", { name: "Select preview type" }));
    const menu = within(root.ownerDocument.body);
    await waitFor(() => {
      expect(menu.getByRole("menuitem", { name: "Typst SVG" })).toBeTruthy();
    });
    return menu;
  }
</script>

<Story
  name="Sample CV"
  parameters={{
    docs: {
      description: {
        story: "Edit a complete normalized CV beside its independently scrollable HTML preview.",
      },
    },
  }}
  args={{
    yamlText: sampleCvYaml,
    filePath: "sample.cv.yml",
    initialPreviewMode: "rendercv-html",
  }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    boundStoryCanvas(canvasElement);
    await waitFor(() => {
      expect(canvas.getByTestId("cv-workspace")).toBeTruthy();
      expect(canvas.getByTestId("structured-cv")).toBeTruthy();
    });
    const shell = canvas.getByTestId("cv-workspace");
    expect(shell.querySelector('[data-ui-part="body"]')).toBeTruthy();
    expect(
      shell.querySelectorAll('[data-ui-part="body"] > [data-ui-component="scroll-area"]'),
    ).toHaveLength(0);
    assertLeafDoesNotScroll(shell);

    const title = shell.querySelector<HTMLElement>(".complete-cv-toolbar-title");
    const yamlLabel = shell.querySelector<HTMLElement>(".complete-cv-yaml-toggle > label");
    const cvTab = canvas.getByRole("tab", { name: "CV" });
    const modeTrigger = canvas.getByRole("button", { name: "Select preview type" });
    expect(title).toBeTruthy();
    expect(yamlLabel).toBeTruthy();
    assertSmallText(title!);
    assertSmallText(yamlLabel!);
    assertSmallText(cvTab);
    assertSmallText(modeTrigger);
    assertSmallText(canvas.getByRole("tab", { name: "Design" }));
    expect(cvTab.getBoundingClientRect().height).toBeLessThanOrEqual(37);

    const formRoot = canvas.getByTestId("structured-cv");
    const formScroller = scrollViewport(formRoot);
    expect(getComputedStyle(formScroller).overflowY).toBe("scroll");
    await assertScrollerMoves(formScroller, shell);

    const handle = canvas.getByTestId("complete-cv-cv-resize-handle");
    const preview = canvas.getByTestId("cv-preview-html") as HTMLIFrameElement;
    const previewPane = canvas.getByTestId("cv-preview-pane");
    const previewScroller = scrollViewport(previewPane);
    await waitFor(() => {
      expect(preview.srcdoc).toContain("John Doe");
      expect(preview.srcdoc).toContain("CTO");
    });
    expect(handle.getAttribute("data-variant")).toBe("prominent");
    const formRect = formRoot.getBoundingClientRect();
    const handleRect = handle.getBoundingClientRect();
    const previewRect = preview.getBoundingClientRect();
    expect(formRect.right).toBeLessThanOrEqual(handleRect.left + 1);
    expect(handleRect.right).toBeLessThanOrEqual(previewRect.left + 1);
    await assertScrollerMoves(previewScroller, shell);
    assertLeafDoesNotScroll(shell);

    const zoomGroup = canvas.getByRole("group", { name: "Preview zoom" });
    const zoomBorder =
      Number.parseFloat(getComputedStyle(zoomGroup).borderTopWidth) ||
      Number.parseFloat(getComputedStyle(zoomGroup).borderWidth);
    expect(zoomBorder).toBeGreaterThan(0);

    const documentEl = canvas.getByTestId("cv-preview-document");
    const pane = canvas.getByTestId("cv-preview-pane");
    const paneWidthBefore = pane.getBoundingClientRect().width;
    await userEvent.click(canvas.getByRole("button", { name: "Zoom out" }));
    await waitFor(() => {
      expect(documentEl.style.width).toBe("738px");
    });
    expect(Math.round(documentEl.getBoundingClientRect().width)).toBe(738);
    expect(pane.getBoundingClientRect().width).toBeCloseTo(paneWidthBefore, 0);

    const menu = await openPreviewModes(canvas, canvasElement);
    for (const name of previewModeNames) {
      expect(menu.getByRole("menuitem", { name })).toBeTruthy();
    }
    const modeTriggerAfterMenu = canvas.getByRole("button", { name: "Select preview type" });
    await userEvent.keyboard("{Escape}");
    if (modeTriggerAfterMenu.getAttribute("aria-expanded") === "true") {
      await userEvent.click(modeTriggerAfterMenu);
    }
    await waitFor(() => {
      expect(modeTriggerAfterMenu.getAttribute("aria-expanded")).toBe("false");
      expect(canvasElement.ownerDocument.querySelector("[data-cv-preview-menu]")).toBeNull();
    });

    expect(canvas.getByTestId("cv-theme-controls")).toBeTruthy();
    expect(canvas.getByRole("button", { name: "Select RenderCV theme" }).textContent).toContain(
      "ModernCV",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Next RenderCV theme" }), {
      pointerEventsCheck: 0,
    });
    await waitFor(() => {
      expect(
        canvas.getByRole("button", { name: "Select RenderCV theme" }).textContent,
      ).toContain("Opal");
    });
    await waitFor(() => {
      expect(
        getComputedStyle(canvas.getByRole("button", { name: "Next RenderCV theme" }))
          .pointerEvents,
      ).not.toBe("none");
    });

    expect(canvas.queryByRole("tab", { name: "Form" })).toBeNull();
    expect(canvas.queryByRole("tab", { name: "YAML" })).toBeNull();
    const mobileTabs = canvas.getByTestId("cv-mobile-workspace-tabs");
    expect(getComputedStyle(mobileTabs).display).toBe("none");

    const toolbar = canvas.getByTestId("form-toolbar");
    expect(getComputedStyle(toolbar).overflowX).toBe("auto");
    expect(getComputedStyle(toolbar).scrollbarWidth).toBe("none");

    expect(canvas.getByTestId("cv-yaml-toggle")).toBeTruthy();
    await userEvent.click(canvas.getByRole("switch", { name: "YAML" }), {
      pointerEventsCheck: 0,
    });
    const yamlPane = await waitFor(() => {
      const pane = canvas.getByTestId("yaml-cv");
      expect(pane.getBoundingClientRect().height).toBeGreaterThan(100);
      return pane;
    });
    await waitFor(() => {
      const editor = yamlPane.querySelector(".cm-editor");
      expect(editor).toBeTruthy();
      expect(editor!.getBoundingClientRect().height).toBeGreaterThan(100);
      expect(yamlPane.textContent).toContain("John Doe");
    });
    const yamlScroller = yamlPane.querySelector<HTMLElement>(".cm-scroller");
    expect(yamlScroller).toBeTruthy();
    expect(yamlScroller!.clientHeight).toBeLessThan(shell.clientHeight);
    expect(getComputedStyle(yamlScroller!).overflowY).toMatch(/auto|scroll/);
    assertLeafDoesNotScroll(shell);
    expect(canvas.queryByTestId("structured-cv")).toBeNull();
    expect(canvas.getByRole("tab", { name: "CV" }).getAttribute("data-state")).toBe(
      "active",
    );

    await userEvent.click(canvas.getByRole("tab", { name: "Design" }));
    const designYaml = await waitFor(() => canvas.getByTestId("yaml-design"));
    await waitFor(() => {
      expect(designYaml.textContent).toContain("theme: opal");
    });

    shell.style.width = "36rem";
    await waitFor(() => {
      expect(getComputedStyle(mobileTabs).display).toBe("block");
    });
    expect(canvas.getByRole("tab", { name: "Edit" })).toBeTruthy();
    expect(canvas.getByRole("tab", { name: "Preview" })).toBeTruthy();
    await userEvent.click(canvas.getByRole("tab", { name: "Preview" }));
    await waitFor(() => {
      const editorPane = shell.querySelector<HTMLElement>("[data-mobile-pane='editor']");
      expect(editorPane).toBeTruthy();
      expect(getComputedStyle(editorPane!).display).toBe("none");
    });
    assertLeafDoesNotScroll(shell);
    await assertScrollerMoves(scrollViewport(canvas.getByTestId("cv-preview-pane")), shell);

    shell.style.width = "";
    await waitFor(() => {
      expect(getComputedStyle(mobileTabs).display).toBe("none");
    });
    await userEvent.click(canvas.getByRole("tab", { name: "CV" }));
    const yamlSwitch = canvas.getByRole("switch", { name: "YAML" });
    if (yamlSwitch.getAttribute("aria-checked") === "true") {
      await userEvent.click(yamlSwitch, {
        pointerEventsCheck: 0,
      });
    }
    await waitFor(() => {
      expect(yamlSwitch.getAttribute("aria-checked")).toBe("false");
      expect(canvas.getByTestId("structured-cv")).toBeTruthy();
    });
    assertLeafDoesNotScroll(shell);
  }}
/>

<Story
  name="Typst Preview"
  parameters={{
    docs: {
      description: {
        story: "Compile the open CV to real SVG pages through the browser Typst worker.",
      },
    },
  }}
  args={{
    yamlText: sampleCvYaml,
    filePath: "sample.cv.yml",
    initialPreviewMode: "rendercv",
    initialPreviewFormat: "svg",
  }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByTestId("cv-workspace")).toBeTruthy();
    });
    await waitFor(
      () => {
        const pages = canvas.getByTestId("cv-preview-pages");
        expect(pages.querySelectorAll("img").length).toBeGreaterThan(0);
        expect(canvas.queryByTestId("cv-preview-error")).toBeNull();
        expect(canvas.queryByTestId("cv-preview-html")).toBeNull();
        expect(
          pages.querySelector("img")?.getAttribute("data-preview-format"),
        ).toBe("svg");
      },
      { timeout: 30_000 },
    );
  }}
/>

<Story
  name="Typst PNG"
  parameters={{
    docs: {
      description: {
        story: "Compile the open CV to real PNG page artifacts through the browser Typst worker.",
      },
    },
  }}
  args={{
    yamlText: sampleCvYaml,
    filePath: "sample.cv.yml",
    initialPreviewMode: "rendercv",
    initialPreviewFormat: "png",
  }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByTestId("cv-workspace")).toBeTruthy();
      expect(canvas.getByRole("button", { name: "Select preview type" }).textContent).toContain(
        "Typst PNG",
      );
    });
    await waitFor(
      () => {
        const pages = canvas.getByTestId("cv-preview-pages");
        const img = pages.querySelector("img");
        expect(img).toBeTruthy();
        expect(img?.getAttribute("data-preview-format")).toBe("png");
        expect(img?.getAttribute("src") ?? "").toMatch(/^blob:/);
        expect(canvas.queryByTestId("cv-preview-error")).toBeNull();
        expect(canvas.queryByTestId("cv-preview-html")).toBeNull();
      },
      { timeout: 30_000 },
    );
  }}
/>

<Story
  name="Invalid YAML Recovery"
  parameters={{
    docs: {
      description: {
        story: "Repair invalid full-document YAML in the shared editor before structured editing resumes.",
      },
    },
  }}
  args={{
    yamlText: "cv:\n  name: [broken\n",
    filePath: "broken.cv.yml",
  }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("alert")).toHaveTextContent("CV YAML is invalid");
    const editor = canvas.getByRole("textbox", { name: "CV YAML source" });
    expect(editor).toBeTruthy();
    expect(canvas.queryByTestId("structured-cv")).toBeNull();

    await userEvent.click(editor);
    await userEvent.keyboard("{Control>}a{/Control}");
    await userEvent.paste(`cv:
  name: Recovered
  headline: Engineer
  location: London
  email: recovered@example.com
  phone: ""
  sections: []
`);
    await waitFor(() => {
      expect(canvas.getByTestId("structured-cv")).toBeTruthy();
      expect(canvas.queryByTestId("cv-parse-error")).toBeNull();
    });
  }}
/>

<Story
  name="Invalid YAML"
  args={{
    yamlText: "cv: [unterminated",
    filePath: "broken.cv.yml",
  }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByTestId("cv-parse-error")).toBeTruthy();
      expect(canvas.getByTestId("cv-raw-yaml").textContent).toContain(
        "unterminated",
      );
    });
  }}
/>
