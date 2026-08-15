import type { App } from "@lapis-notes/api";
import { BasesViewSurface, type BasesDocument } from "@lapis-notes/bases";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { workspaceCatalogParameters } from "../../catalog/catalog.mjs";
import { WORKSPACE_SHELL_DOCS_STORY } from "../../workspace/docs-parameters";
import BasesViewsDemo from "./BasesViewsDemo.svelte";
import { basesViewsExampleSource } from "./BasesViews.example-sources";
import type { BasesViewScenario } from "./bases-views-fixture";
import {
  expectBasesColumnsAligned,
  expectBasesRowCellsAligned,
  expectOpaqueBackground,
} from "./bases-story-assertions";

const meta = {
  title: "Plugins/Bases/Views",
  component: BasesViewSurface,
  args: {
    app: undefined as unknown as App,
    document: undefined as unknown as BasesDocument,
  },
  argTypes: {
    app: { control: false },
    document: { control: false },
    onChange: { control: false },
    readOnly: { control: false },
    showHeader: { control: false },
    registrations: { control: false },
  },
  tags: ["visual-pending", "test"],
  parameters: {
    layout: "fullscreen",
    docs: {
      canvas: { className: "bases-views-docs-canvas" },
      description: {
        component:
          "BasesViewSurface renders a normalized Bases document against an initialized Lapis App. These stories load the real bundled plugin and one shared seeded vault.",
      },
      story: WORKSPACE_SHELL_DOCS_STORY,
    },
  },
} satisfies Meta<typeof BasesViewSurface>;

export default meta;
type Story = StoryObj<typeof meta>;
type StoryRender = NonNullable<Story["render"]>;

function renderScenario(scenario: BasesViewScenario): StoryRender {
  return (() => ({
    Component: BasesViewsDemo,
    props: { scenario },
  })) as StoryRender;
}

function storyParameters(scenario: BasesViewScenario, description: string) {
  const catalogId = `plugins-bases-views-${scenario}`;
  return {
    ...workspaceCatalogParameters(catalogId),
    docs: {
      description: { story: description },
      source: {
        code: basesViewsExampleSource(scenario),
        language: "tsx",
        type: "code",
      },
    },
    visualDelta: {
      images: [
        `/visual-baselines/stories/plugins/bases/views-${scenario}-chromium.png`,
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  };
}

function demoApp(canvasElement: HTMLElement): App {
  const root = canvasElement.querySelector<HTMLElement & { __lapisApp?: App }>(
    '[data-testid="bases-views-demo"]',
  );
  if (!root?.__lapisApp) {
    throw new Error("The Bases views story has no active Lapis app");
  }
  return root.__lapisApp;
}

function demoDocument(canvasElement: HTMLElement): BasesDocument {
  const root = canvasElement.querySelector<
    HTMLElement & { __basesDocument?: BasesDocument }
  >('[data-testid="bases-views-demo"]');
  if (!root?.__basesDocument) {
    throw new Error("The Bases views story has no active document");
  }
  return root.__basesDocument;
}

async function waitForView(
  canvasElement: HTMLElement,
  scenario: BasesViewScenario,
  type: string,
) {
  const canvas = within(canvasElement);
  await waitFor(
    () => {
      expect(canvas.getByTestId("bases-views-status")).toHaveTextContent(
        "ready",
      );
      expect(
        canvasElement.querySelector(
          `[data-ui-component="bases-view"][data-type="${type}"]`,
        ),
      ).toBeInTheDocument();
    },
    { timeout: 8_000 },
  );
  expect(canvas.getByTestId("bases-views-demo")).toHaveAttribute(
    "data-scenario",
    scenario,
  );
  expect(demoApp(canvasElement).plugins.isPluginEnabled("bases")).toBe(true);
  return canvas;
}

function firstRowHeight(table: HTMLElement) {
  return table
    .querySelector<HTMLElement>('.bases-table__row[data-ui-part="row"]')!
    .getBoundingClientRect().height;
}

function chipLineCount(control: HTMLElement) {
  return new Set(
    [...control.querySelectorAll<HTMLElement>(".chip")].map((chip) =>
      Math.round(chip.getBoundingClientRect().top),
    ),
  ).size;
}

export const Table: Story = {
  parameters: storyParameters(
    "table",
    "A score-sorted project table renders real indexed Markdown properties from the shared sample vault.",
  ),
  render: renderScenario("table"),
  play: async ({ canvasElement }) => {
    const canvas = await waitForView(canvasElement, "table", "table");
    await waitFor(() => {
      expect(
        canvasElement.querySelector('[data-ui-component="bases-table-view"]'),
      ).toBeInTheDocument();
      expect(canvas.getByText("Aurora.md")).toBeVisible();
      expect(canvas.getByDisplayValue("Maya Chen")).toBeVisible();
      expect(canvas.getByDisplayValue("94")).toBeVisible();
      const row = canvasElement.querySelector<HTMLElement>(
        '[data-ui-component="bases-table-view"] [data-ui-part="row"]',
      );
      expect(row).toHaveStyle({ height: "30px" });
      const searchButton = canvas.getByRole("button", { name: "Search" });
      expect(getComputedStyle(searchButton).gap).toBe("6px");
      expect(getComputedStyle(searchButton).boxShadow).toBe("none");
      const sortProject = canvas.getByRole("button", {
        name: "Sort Project",
      });
      expect(getComputedStyle(sortProject).height).toBe("16px");
      expect(getComputedStyle(sortProject.querySelector("svg")!).width).toBe(
        "16px",
      );
    });
  },
};

export const EditableCells: Story = {
  parameters: storyParameters(
    "editable-cells",
    "A wide table exercises normal inline autocomplete, scalar, checkbox, tag, file, and folder cell presentation over real metadata.",
  ),
  render: renderScenario("editable-cells"),
  play: async ({ canvasElement }) => {
    const canvas = await waitForView(canvasElement, "editable-cells", "table");
    const table = await waitFor(() => {
      const element = canvasElement.querySelector<HTMLElement>(
        '[data-ui-component="bases-table-view"]',
      );
      expect(element).toBeVisible();
      expect(
        element?.querySelector('.bases-table__row[data-ui-part="row"]'),
      ).toBeVisible();
      expect(
        element?.querySelectorAll('[data-ui-part="command-search-icon"]'),
      ).toHaveLength(0);
      return element!;
    });

    expectBasesColumnsAligned(table);

    const tags = canvas.getAllByRole("group", { name: "tags" })[0]!;
    const collaborators = canvas.getAllByRole("group", {
      name: "collaborators",
    })[0]!;
    for (const control of [tags, collaborators]) {
      expect(getComputedStyle(control).flexWrap).toBe("wrap");
      expect(getComputedStyle(control).overflow).toBe("visible");
    }
    await waitFor(() => {
      expect(firstRowHeight(table)).toBeGreaterThan(40);
      expect(chipLineCount(tags)).toBeGreaterThan(1);
      expect(chipLineCount(collaborators)).toBeGreaterThan(1);
      expectBasesRowCellsAligned(table);
    });

    const dueInput = canvasElement.querySelector<HTMLElement>(
      'input[type="date"][aria-label="due"]',
    );
    expect(dueInput).toBeTruthy();

    const controls = [
      canvas.getAllByRole("combobox", { name: "owner" })[0],
      canvas.getAllByRole("spinbutton", { name: "score" })[0],
      dueInput,
      canvas.getAllByRole("checkbox", { name: "featured" })[0],
      canvas.getAllByRole("combobox", { name: "tags" })[0],
      canvas.getAllByRole("combobox", { name: "collaborators" })[0],
    ].filter(
      (control): control is HTMLElement => control instanceof HTMLElement,
    );
    controls.forEach(expectOpaqueBackground);
    const featured = canvas.getAllByRole("checkbox", {
      name: "featured",
    })[0]!;
    const featuredRect = featured.getBoundingClientRect();
    expect(featuredRect.width).toBeCloseTo(16, 1);
    expect(featuredRect.height).toBeCloseTo(16, 1);
    expect(
      getComputedStyle(featured.closest(".bases-cell-editor__checkbox-wrap")!)
        .justifyContent,
    ).toBe("center");
    const firstRow = table.querySelector<HTMLElement>(
      '.bases-table__row[data-ui-part="row"]',
    )!;
    await userEvent.hover(firstRow);
    controls.forEach(expectOpaqueBackground);
    await userEvent.unhover(firstRow);

    const owner = canvas.getAllByRole("combobox", { name: "owner" })[0]!;
    await userEvent.click(owner);
    await userEvent.clear(owner);
    await userEvent.type(owner, "Pri");
    const body = within(canvasElement.ownerDocument.body);
    expect(
      await body.findByRole("option", { name: "Priya Shah" }),
    ).toBeVisible();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => expect(owner).toHaveValue("Priya Shah"));

    const app = demoApp(canvasElement);
    const aurora = app.vault.getFileByPath("Projects/Aurora.md");
    expect(aurora).toBeTruthy();
    await waitFor(async () => {
      expect(await app.vault.read(aurora!)).toContain("owner: Priya Shah");
    });

    const ownerAfterUpdate = canvas.getAllByRole("combobox", {
      name: "owner",
    })[0]!;
    await userEvent.clear(ownerAfterUpdate);
    await userEvent.type(ownerAfterUpdate, "Maya Chen{Enter}");
    await waitFor(async () => {
      expect(await app.vault.read(aurora!)).toContain("owner: Maya Chen");
    });

    const ownerHeader = table.querySelector<HTMLElement>(
      '.bases-table__header-cell[data-column-id="note.owner"]',
    );
    expect(ownerHeader).toBeVisible();
    const widthBefore = ownerHeader!.getBoundingClientRect().width;
    const resizeOwner = canvas.getByRole("button", {
      name: "Resize Owner column",
    });
    const handleRect = resizeOwner.getBoundingClientRect();
    const pointerY = handleRect.top + handleRect.height / 2;
    const pointerX = handleRect.right - 1;

    await userEvent.pointer({
      target: resizeOwner,
      coords: { clientX: pointerX, clientY: pointerY },
      keys: "[MouseLeft>]",
    });
    await userEvent.pointer({
      target: resizeOwner,
      coords: { clientX: pointerX + 48, clientY: pointerY },
    });
    await waitFor(() => {
      expectBasesColumnsAligned(table);
      expectBasesRowCellsAligned(table);
      expect(ownerHeader!.getBoundingClientRect().width).toBeGreaterThan(
        widthBefore + 40,
      );
    });
    await userEvent.pointer({ keys: "[/MouseLeft]" });
    await waitFor(() => {
      expectBasesColumnsAligned(table);
      expectBasesRowCellsAligned(table);
    });

    const activeView = demoDocument(canvasElement).views.find(
      (view) => view.name === "Editable fields",
    );
    expect(activeView?.columnSize?.["note.owner"]).toBeGreaterThan(
      widthBefore + 40,
    );

    table.scrollLeft = 240;
    table.dispatchEvent(new Event("scroll"));
    await waitFor(() => {
      expectBasesColumnsAligned(table);
      expectBasesRowCellsAligned(table);
    });
    table.scrollLeft = 0;
    table.dispatchEvent(new Event("scroll"));
    await waitFor(() => {
      expectBasesColumnsAligned(table);
      expectBasesRowCellsAligned(table);
    });
  },
};

export const Cards: Story = {
  parameters: storyParameters(
    "cards",
    "Project cards use frontmatter image references resolved through the seeded vault resource boundary.",
  ),
  render: renderScenario("cards"),
  play: async ({ canvasElement }) => {
    const canvas = await waitForView(canvasElement, "cards", "cards");
    await waitFor(() => {
      expect(
        canvasElement.querySelectorAll('[data-ui-part="card"]'),
      ).toHaveLength(3);
      expect(canvas.getByText("Aurora.md")).toBeVisible();
      const images = [
        ...canvasElement.querySelectorAll<HTMLElement>(".bases-card__image"),
      ];
      expect(images).toHaveLength(3);
      expect(
        images.every(
          (image) =>
            image.style.backgroundImage !== "none" &&
            image.style.backgroundImage.includes("blob:"),
        ),
      ).toBe(true);
    });
  },
};

export const GroupedList: Story = {
  parameters: storyParameters(
    "grouped-list",
    "A list groups projects by status and exercises the native collapse interaction without changing the document.",
  ),
  render: renderScenario("grouped-list"),
  play: async ({ canvasElement }) => {
    await waitForView(canvasElement, "grouped-list", "list");
    const toggles = await waitFor(() => {
      const matches = [
        ...canvasElement.querySelectorAll<HTMLElement>(
          '[data-ui-part="group-toggle"]',
        ),
      ];
      expect(matches.length).toBeGreaterThanOrEqual(2);
      return matches;
    });
    const rowCount = canvasElement.querySelectorAll(
      '[data-ui-component="bases-list-view"] [data-ui-part="row"]',
    ).length;
    await userEvent.click(toggles[0]!);
    expect(toggles[0]).toHaveAttribute("aria-expanded", "false");
    await waitFor(() =>
      expect(
        canvasElement.querySelectorAll(
          '[data-ui-component="bases-list-view"] [data-ui-part="row"]',
        ).length,
      ).toBeLessThan(rowCount),
    );
  },
};

export const MapUnavailable: Story = {
  parameters: storyParameters(
    "map",
    "The preserved map layout reports its explicit unavailable state and current result count.",
  ),
  render: renderScenario("map"),
  play: async ({ canvasElement }) => {
    const canvas = await waitForView(canvasElement, "map", "map");
    await waitFor(() => {
      expect(
        canvas.getByText("Map view is not available in this runtime yet."),
      ).toBeVisible();
      expect(canvas.getByText("Current result count: 3")).toBeVisible();
    });
  },
};

export const UnknownView: Story = {
  parameters: storyParameters(
    "unknown",
    "An unsupported timeline layout remains selected and renders the bounded unknown-view fallback.",
  ),
  render: renderScenario("unknown"),
  play: async ({ canvasElement }) => {
    const canvas = await waitForView(canvasElement, "unknown", "timeline");
    await waitFor(() =>
      expect(
        canvas.getByText("Base configured with an unknown view type: timeline"),
      ).toBeVisible(),
    );
  },
};
