import type { App } from "@lapis-notes/api";
import { BasesViewSurface, type BasesDocument } from "@lapis-notes/bases";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import { workspaceCatalogParameters } from "../../catalog/catalog.mjs";
import { WORKSPACE_SHELL_DOCS_STORY } from "../../workspace/docs-parameters";
import {
  expectAsyncQueryFailureAndRecovery,
  triggerMetadataReset,
} from "../_shared/panels/panel-story-helpers";
import BasesViewsDemo from "./BasesViewsDemo.svelte";
import { basesViewsExampleSource } from "./BasesViews.example-sources";
import type { BasesViewScenario } from "./bases-views-fixture";
import {
  expectBasesCellContentTopAligned,
  expectBasesColumnsAligned,
  expectBasesQueryEditorChrome,
  expectBasesRowCellsAligned,
  expectBasesTableFillsSurface,
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

function expectBasesScrollArea(table: HTMLElement) {
  const { root, viewport } = expectBasesTableFillsSurface(table);
  const scrollbar = root?.querySelector<HTMLElement>(
    '[data-ui-part="scroll-area-scrollbar"][data-orientation="horizontal"]',
  );
  const thumb = scrollbar?.querySelector<HTMLElement>(
    '[data-ui-part="scroll-area-thumb"]',
  );

  expect(scrollbar).toBeVisible();
  expect(thumb).toBeVisible();
  expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
  expect(getComputedStyle(scrollbar!).backgroundColor).not.toBe(
    "rgba(0, 0, 0, 0)",
  );
  expect(getComputedStyle(thumb!).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");

  const rootRect = root.getBoundingClientRect();
  const scrollbarRect = scrollbar!.getBoundingClientRect();
  expect(Math.abs(scrollbarRect.bottom - rootRect.bottom)).toBeLessThan(1);
  expect(scrollbarRect.left).toBeCloseTo(rootRect.left, 1);

  return viewport;
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
      expectBasesTableFillsSurface(
        canvasElement.querySelector<HTMLElement>(
          '[data-ui-component="bases-table-view"]',
        )!,
      );
    });
    const app = demoApp(canvasElement);
    await expectAsyncQueryFailureAndRecovery({
      target: app.appDatabase,
      method: "queryIndexedMetadataPage",
      trigger: () => triggerMetadataReset(app),
      expectFailure: () =>
        waitFor(() => {
          expect(canvas.getByRole("alert")).toHaveTextContent(
            "Storybook metadata query failure",
          );
        }),
      recover: () =>
        userEvent.click(canvas.getByRole("button", { name: "Retry" })),
      expectRecovery: () =>
        waitFor(() => {
          expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
          expect(canvas.getByText("Aurora.md")).toBeVisible();
        }),
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

    const tableViewport = expectBasesScrollArea(table);
    expectBasesColumnsAligned(table);
    const tableContainer = table.querySelector<HTMLElement>(
      ".bases-table-container",
    );
    const tableBody = table.querySelector<HTMLElement>(".bases-tbody");
    const lastDataRow = table.querySelector<HTMLElement>(
      '.bases-table__row[data-last-row="true"]',
    );
    const horizontalScrollbar = table.querySelector<HTMLElement>(
      '[data-ui-part="scroll-area-scrollbar"][data-orientation="horizontal"]',
    );
    const verticalScrollbar = table.querySelector<HTMLElement>(
      '[data-ui-part="scroll-area-scrollbar"][data-orientation="vertical"]',
    );
    expect(getComputedStyle(tableContainer!).borderBottomWidth).toBe("0px");
    expect(getComputedStyle(tableContainer!).borderRightWidth).toBe("0px");
    expect(getComputedStyle(tableBody!).boxShadow).toBe("none");
    expect(lastDataRow).toBeVisible();
    expect(getComputedStyle(lastDataRow!).boxShadow).toMatch(/0px 1px 0px/);
    expect(getComputedStyle(horizontalScrollbar!).borderTopWidth).toBe("0px");
    expect(getComputedStyle(verticalScrollbar!).borderLeftWidth).toBe("0px");
    for (const headerCell of table.querySelectorAll<HTMLElement>(
      ".bases-table__header-cell > .bases-td",
    )) {
      expect(getComputedStyle(headerCell).borderRightWidth).toBe("0px");
    }

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
      expectBasesCellContentTopAligned(table);
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
    const body = within(canvasElement.ownerDocument.body);
    dueInput!.focus();
    // Exercise the bubbled input-target click without relying on the browser's
    // native focus step; the owning cell must still establish edit mode.
    owner.click();
    await waitFor(() => {
      expect(owner).toHaveFocus();
      expect(owner).toHaveAttribute("aria-expanded", "true");
      expect(owner.selectionStart).toBe(0);
      expect(owner.selectionEnd).toBe("Maya Chen".length);
    });
    for (const suggestion of ["Maya Chen", "Priya Shah", "Leo Martins"]) {
      expect(body.getByRole("option", { name: suggestion })).toBeVisible();
    }
    const ownerCell = owner.closest<HTMLElement>(".bases-table__cell");
    const ownerCellInner = owner.closest<HTMLElement>(
      ".bases-table__cell-inner",
    );
    expect(ownerCell).toBeTruthy();
    expect(ownerCellInner).toBeTruthy();
    expect(getComputedStyle(ownerCell!, "::after").boxShadow).toContain(
      "inset",
    );
    expect(getComputedStyle(ownerCellInner!).boxShadow).toBe("none");
    expectBasesRowCellsAligned(table);
    await userEvent.click(canvas.getByRole("button", { name: "Search" }));
    await waitFor(() => {
      expect(
        body.queryByRole("option", { name: "Priya Shah" }),
      ).not.toBeInTheDocument();
      expect(owner).toHaveAttribute("aria-expanded", "false");
    });
    await userEvent.click(owner);
    await userEvent.click(body.getByRole("option", { name: "Priya Shah" }));
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
    await userEvent.click(ownerAfterUpdate);
    await waitFor(() => {
      expect(ownerAfterUpdate).toHaveAttribute("aria-expanded", "true");
      expect(ownerAfterUpdate.selectionStart).toBe(0);
      expect(ownerAfterUpdate.selectionEnd).toBe("Priya Shah".length);
    });
    await userEvent.keyboard("Maya Chen{Enter}");
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

    tableViewport.scrollLeft = 240;
    tableViewport.dispatchEvent(new Event("scroll"));
    await waitFor(() => {
      expectBasesColumnsAligned(table);
      expectBasesRowCellsAligned(table);
    });
    tableViewport.scrollLeft = 0;
    tableViewport.dispatchEvent(new Event("scroll"));
    await waitFor(() => {
      expectBasesColumnsAligned(table);
      expectBasesRowCellsAligned(table);
    });

    await userEvent.click(
      canvas.getByRole("button", { name: "Sort", exact: true }),
    );
    const sortPopover = await waitFor(() => {
      const content =
        canvasElement.ownerDocument.body.querySelector<HTMLElement>(
          '[data-bases-popover="sort"][data-state="open"]',
        );
      expect(content).toBeVisible();
      return content!;
    });
    const sortPopoverWidth = sortPopover.getBoundingClientRect().width;
    const sortScrollArea = sortPopover.querySelector<HTMLElement>(
      '[data-ui-component="scroll-area"]',
    );
    expect(sortScrollArea).toBeVisible();
    expect(sortScrollArea!.getBoundingClientRect().width).toBeGreaterThan(
      sortPopoverWidth - 20,
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Sort", exact: true }),
    );

    await userEvent.click(canvas.getByRole("button", { name: "Properties" }));
    const projectOption = await body.findByRole("option", {
      name: "Project",
      exact: true,
    });
    const selectedMarker = projectOption.querySelector<HTMLElement>(
      '[data-ui-part="bases-option-indicator"]',
    );
    const selectedMarkerIcon = selectedMarker?.querySelector<SVGElement>("svg");
    expect(selectedMarker).toHaveAttribute("data-selected", "true");
    const onAccentColor = getComputedStyle(selectedMarkerIcon!).color;
    expect(onAccentColor).not.toBe(getComputedStyle(projectOption).color);
    expect(getComputedStyle(featured).accentColor).not.toBe("auto");
    expect(getComputedStyle(featured).color).toBe(onAccentColor);
    const uncheckedFeatured = canvas.getAllByRole("checkbox", {
      name: "featured",
    })[2]!;
    expect(getComputedStyle(uncheckedFeatured).backgroundColor).toBe(
      getComputedStyle(
        table.querySelector<HTMLElement>(".bases-table-container")!,
      ).backgroundColor,
    );
    await userEvent.click(canvas.getByRole("button", { name: "Properties" }));

    await userEvent.click(canvas.getByRole("button", { name: "Filter" }));
    const allViewsTrigger = await body.findByRole("button", {
      name: "All views",
      exact: true,
    });
    const thisViewTrigger = await body.findByRole("button", {
      name: "This view",
      exact: true,
    });
    const filterPopover = thisViewTrigger.closest<HTMLElement>(
      '[data-ui-part="popover-content"]',
    );
    expect(filterPopover).toBeVisible();
    expect(
      Math.abs(filterPopover!.getBoundingClientRect().width - sortPopoverWidth),
    ).toBeLessThan(1);
    const visibleFilterElement = <T extends Element>(selector: string) =>
      [...filterPopover!.querySelectorAll<T>(selector)].find((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
    const expectFilterMenuAbovePanel = (content: HTMLElement) => {
      const contentRect = content.getBoundingClientRect();
      const panelRect = filterPopover!.getBoundingClientRect();
      const overlapTop = Math.max(contentRect.top, panelRect.top);
      const overlapBottom = Math.min(contentRect.bottom, panelRect.bottom);
      expect(overlapBottom - overlapTop).toBeGreaterThan(8);

      const hitTarget = canvasElement.ownerDocument.elementFromPoint(
        contentRect.left + 8,
        overlapTop + 4,
      );
      expect(content.contains(hitTarget)).toBe(true);
      expect(
        Number.parseInt(getComputedStyle(content).zIndex, 10),
      ).toBeGreaterThanOrEqual(
        Number.parseInt(getComputedStyle(filterPopover!).zIndex, 10),
      );
    };
    expect(filterPopover!.getBoundingClientRect().width).toBeCloseTo(
      canvasElement.ownerDocument.defaultView!.innerWidth * 0.45,
      0,
    );
    const filterPopoverStyle = getComputedStyle(filterPopover!);
    const colorProbe = canvasElement.ownerDocument.createElement("canvas");
    colorProbe.width = 1;
    colorProbe.height = 1;
    const colorContext = colorProbe.getContext("2d")!;
    colorContext.fillStyle = filterPopoverStyle.backgroundColor;
    colorContext.fillRect(0, 0, 1, 1);
    expect([...colorContext.getImageData(0, 0, 1, 1).data]).toEqual([
      255, 255, 255, 255,
    ]);
    expect(filterPopover!.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      0,
    );
    expect(filterPopover!.getBoundingClientRect().right).toBeLessThanOrEqual(
      canvasElement.ownerDocument.defaultView!.innerWidth,
    );
    const filterPanelRect = filterPopover!.getBoundingClientRect();
    const intersectingHeader = [
      ...canvasElement.querySelectorAll<HTMLElement>(
        ".bases-table__header-cell",
      ),
    ].find((header) => {
      const rect = header.getBoundingClientRect();
      return (
        rect.right > filterPanelRect.left &&
        rect.left < filterPanelRect.right &&
        rect.bottom > filterPanelRect.top &&
        rect.top < filterPanelRect.bottom
      );
    });
    expect(intersectingHeader).toBeVisible();
    const intersectingHeaderRect = intersectingHeader!.getBoundingClientRect();
    const panelHitTarget = canvasElement.ownerDocument.elementFromPoint(
      Math.max(filterPanelRect.left, intersectingHeaderRect.left) + 4,
      Math.max(filterPanelRect.top, intersectingHeaderRect.top) + 4,
    );
    expect(filterPopover!.contains(panelHitTarget)).toBe(true);
    for (const trigger of [allViewsTrigger, thisViewTrigger]) {
      expect(trigger).toHaveAttribute("data-indicator-position", "start");
      expect(trigger).toHaveAttribute("data-indicator-variant", "disclosure");
      const visibleIndicator = [
        ...trigger.querySelectorAll<SVGElement>(
          '[data-slot="accordion-trigger-icon"]',
        ),
      ].find((icon) => getComputedStyle(icon).display !== "none");
      const label = trigger.querySelector<HTMLElement>("span");
      expect(visibleIndicator).toBeVisible();
      expect(visibleIndicator!.getBoundingClientRect().right).toBeLessThan(
        label!.getBoundingClientRect().left,
      );
      expect(visibleIndicator).toHaveAttribute(
        "data-indicator-glyph",
        trigger.getAttribute("aria-expanded") === "true"
          ? "chevron-down"
          : "chevron-right",
      );
    }
    const filterRowControl =
      visibleFilterElement<HTMLElement>(".filter-row > div");
    await waitFor(() => {
      expect(filterRowControl!.getBoundingClientRect().width).toBeGreaterThan(
        300,
      );
    });

    const filterValueInput = visibleFilterElement<HTMLInputElement>(
      '.bases-filter-editor [data-ui-component="autocomplete-input"] input',
    );
    expect(filterValueInput).toBeVisible();
    const filterValueRect = filterValueInput!.getBoundingClientRect();
    const filterRowRect = filterRowControl!.getBoundingClientRect();
    expect(
      Math.abs(
        filterValueRect.top +
          filterValueRect.height / 2 -
          (filterRowRect.top + filterRowRect.height / 2),
      ),
    ).toBeLessThan(1);

    const groupTypeTrigger = visibleFilterElement<HTMLButtonElement>(
      '[data-bases-filter-control="group-type-trigger"]',
    );
    expect(groupTypeTrigger).toHaveTextContent("All of the following are true");
    await userEvent.click(groupTypeTrigger!);
    const groupTypeContent = await waitFor(() => {
      const content =
        canvasElement.ownerDocument.body.querySelector<HTMLElement>(
          '[data-bases-filter-control="group-type-content"][data-state="open"]',
        );
      expect(content).toBeVisible();
      return content!;
    });
    const groupTypeTriggerRect = groupTypeTrigger!.getBoundingClientRect();
    const groupTypeContentRect = groupTypeContent.getBoundingClientRect();
    expect(groupTypeContentRect.top).toBeGreaterThanOrEqual(
      groupTypeTriggerRect.bottom - 1,
    );
    expect(
      Math.abs(groupTypeContentRect.left - groupTypeTriggerRect.left),
    ).toBeLessThan(2);
    expectFilterMenuAbovePanel(groupTypeContent);
    await userEvent.click(
      body.getByRole("option", { name: "Any of the following are true" }),
    );
    await waitFor(() =>
      expect(groupTypeTrigger).toHaveTextContent(
        "Any of the following are true",
      ),
    );
    await userEvent.click(groupTypeTrigger!);
    await userEvent.click(
      body.getByRole("option", { name: "All of the following are true" }),
    );
    await waitFor(() =>
      expect(groupTypeTrigger).toHaveTextContent(
        "All of the following are true",
      ),
    );

    const operatorTrigger = visibleFilterElement<HTMLButtonElement>(
      '[data-bases-filter-control="operator-trigger"]',
    );
    expect(operatorTrigger).toHaveTextContent("links to");
    await userEvent.click(operatorTrigger!);
    const operatorContent = await waitFor(() => {
      const content =
        canvasElement.ownerDocument.body.querySelector<HTMLElement>(
          '[data-bases-filter-control="operator-content"][data-state="open"]',
        );
      expect(content).toBeVisible();
      return content!;
    });
    const operatorTriggerRect = operatorTrigger!.getBoundingClientRect();
    const operatorContentRect = operatorContent.getBoundingClientRect();
    expect(operatorContentRect.top).toBeGreaterThanOrEqual(
      operatorTriggerRect.bottom - 1,
    );
    expect(
      Math.abs(operatorContentRect.left - operatorTriggerRect.left),
    ).toBeLessThan(2);
    expectFilterMenuAbovePanel(operatorContent);
    await userEvent.click(body.getByRole("option", { name: "links to" }));

    const visibleFilterRowCount = () =>
      [...filterPopover!.querySelectorAll<HTMLElement>(".filter-row")].filter(
        (row) => row.getBoundingClientRect().height > 0,
      ).length;
    const filterRowCountBeforeAdd = visibleFilterRowCount();
    await userEvent.click(
      body.getByRole("button", { name: "Add Filter", exact: true }),
    );
    await waitFor(() =>
      expect(visibleFilterRowCount()).toBe(filterRowCountBeforeAdd + 1),
    );

    const advancedToggle = visibleFilterElement<HTMLButtonElement>(
      'button[data-tooltip="Simple filter"]',
    );
    await userEvent.click(advancedToggle!);
    const queryEditor = await waitFor(() => {
      const editor = visibleFilterElement<HTMLElement>(
        '[data-ui-component="bases-query-editor"]',
      );
      expect(editor).toBeVisible();
      return editor!;
    });
    const queryContent = queryEditor.querySelector<HTMLElement>(".cm-content");
    await waitFor(() => {
      const stringToken = queryContent?.querySelector<HTMLElement>(
        ".cm-string, .cm-string-2",
      );
      expect(queryContent).toHaveTextContent('file.hasLink("")');
      expect(stringToken).toBeVisible();
      expect(getComputedStyle(stringToken!).color).not.toBe(
        getComputedStyle(queryContent!).color,
      );
    });
    await userEvent.click(queryContent!);
    await fireEvent.keyDown(queryContent!, {
      key: " ",
      code: "Space",
      ctrlKey: true,
    });
    const completionTooltip = await waitFor(() => {
      const tooltip =
        canvasElement.ownerDocument.body.querySelector<HTMLElement>(
          ".cm-tooltip.cm-tooltip-autocomplete",
        );
      expect(tooltip).toBeVisible();
      return tooltip!;
    });
    expectBasesQueryEditorChrome(queryEditor, completionTooltip);
    await fireEvent.keyDown(queryContent!, { key: "Escape", code: "Escape" });
    await waitFor(() => expect(completionTooltip).not.toBeInTheDocument());
    await userEvent.click(canvas.getByRole("button", { name: "Filter" }));
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
