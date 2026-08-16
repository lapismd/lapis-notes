import type { App } from "@lapis-notes/api";
import { BasesViewSurface, type BasesDocument } from "@lapis-notes/bases";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { workspaceCatalogParameters } from "../../catalog/catalog.mjs";
import { WORKSPACE_SHELL_DOCS_STORY } from "../../workspace/docs-parameters";
import BasesViewsDemo from "./BasesViewsDemo.svelte";
import { basesViewsExampleSource } from "./BasesViews.example-sources";

const meta = {
  title: "Plugins/Bases/Workflows",
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
      story: WORKSPACE_SHELL_DOCS_STORY,
      canvas: { className: "bases-views-docs-canvas" },
      description: {
        component:
          "Public Bases workflows exercise query, schema, view-management, and typed editing contracts over the canonical seeded vault.",
      },
    },
  },
} satisfies Meta<typeof BasesViewSurface>;

export default meta;
type Story = StoryObj<typeof meta>;

function renderScenario(scenario: "query-controls" | "schema-settings" | "editable-cells") {
  return (() => ({
    Component: BasesViewsDemo,
    props: { scenario },
  })) as NonNullable<Story["render"]>;
}

function workflowParameters(
  scenario: "query-controls" | "schema-settings" | "editable-cells",
  description: string,
) {
  return {
    ...workspaceCatalogParameters(`plugins-bases-workflows-${scenario}`),
    docs: {
      description: { story: description },
      source: {
        code: basesViewsExampleSource(scenario),
        language: "svelte",
        type: "code",
      },
    },
  };
}

function demoRoot(canvasElement: HTMLElement) {
  const root = canvasElement.querySelector<
    HTMLElement & { __lapisApp?: App; __basesDocument?: BasesDocument }
  >('[data-testid="bases-views-demo"]');
  if (!root?.__lapisApp || !root.__basesDocument) {
    throw new Error("The Bases workflow story has no active runtime");
  }
  return {
    app: root.__lapisApp,
    document: root.__basesDocument,
  };
}

async function waitForWorkflow(canvasElement: HTMLElement, type: string) {
  const canvas = within(canvasElement);
  await waitFor(
    () => {
      expect(canvas.getByTestId("bases-views-status")).toHaveTextContent("ready");
      expect(
        canvasElement.querySelector(
          `[data-ui-component="bases-view"][data-type="${type}"]`,
        ),
      ).toBeVisible();
    },
    { timeout: 8_000 },
  );
  return { canvas, body: within(canvasElement.ownerDocument.body) };
}

export const QueryControls: Story = {
  parameters: workflowParameters(
    "query-controls",
    "Search, filter, sort, grouping, result limits, new-file, and CSV commands update one public document surface.",
  ),
  render: renderScenario("query-controls"),
  play: async ({ canvasElement }) => {
    const { canvas, body } = await waitForWorkflow(canvasElement, "table");
    const { document } = demoRoot(canvasElement);
    const view = document.views.find((candidate) => candidate.name === "Portfolio table")!;

    await userEvent.click(canvas.getByRole("button", { name: "Search" }));
    const search = canvas.getByPlaceholderText("Find...");
    await userEvent.type(search, "Harbor");
    await waitFor(() => {
      expect(canvas.getByText("Showing 1")).toBeVisible();
      expect(canvas.getByText("Harbor.md")).toBeVisible();
    });
    await userEvent.click(canvas.getByRole("button", { name: "Clear search" }));

    await userEvent.click(canvas.getByRole("button", { name: /3 results/ }));
    const limit = body.getByLabelText("Limit number of results");
    await userEvent.clear(limit);
    await userEvent.type(limit, "2");
    await userEvent.tab();
    await waitFor(() => expect(view.limit).toBe(2));

    await userEvent.click(canvas.getByRole("button", { name: "Sort" }));
    await userEvent.click(body.getByRole("button", { name: "Add sort" }));
    await waitFor(() => expect(view.sort).toHaveLength(2));
    const groupProperty = body.getAllByRole("button", { name: /Property/ })[0]!;
    await userEvent.click(groupProperty);
    expect(body.getByPlaceholderText("Group by property")).toBeVisible();
    await userEvent.click(body.getAllByText("Status").at(-1)!);
    await waitFor(() =>
      expect(view.groupBy).toMatchObject({ property: "note.status" }),
    );

    await userEvent.click(canvas.getByRole("button", { name: "Sort" }));
    await userEvent.click(canvas.getByRole("button", { name: /Filter/ }));
    const addFilter = body.getByRole("button", {
      name: "Add Filter",
      exact: true,
    });
    const filterGroup = addFilter.closest<HTMLElement>(".filter-group")!;
    const visibleFilterRowCount = () =>
      [...filterGroup.querySelectorAll<HTMLElement>(".filter-row")].filter(
        (row) => row.getBoundingClientRect().height > 0,
      ).length;
    const filterRowCountBeforeAdd = visibleFilterRowCount();
    await userEvent.click(addFilter);
    await waitFor(() =>
      expect(visibleFilterRowCount()).toBe(filterRowCountBeforeAdd + 1),
    );

    await userEvent.click(canvas.getByRole("button", { name: /2 results/ }));
    expect(body.getByRole("button", { name: "Copy to clipboard" })).toBeVisible();
    expect(body.getByRole("button", { name: "Export CSV..." })).toBeVisible();
    expect(canvas.getByRole("button", { name: "New" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /2 results/ }));
  },
};

export const SchemaAndViewSettings: Story = {
  parameters: workflowParameters(
    "schema-settings",
    "View management, layout changes, formulas, summaries, visibility, and every public custom-option type are available from the settings surface.",
  ),
  render: renderScenario("schema-settings"),
  play: async ({ canvasElement }) => {
    const { canvas, body } = await waitForWorkflow(canvasElement, "story-options");
    const { document } = demoRoot(canvasElement);
    const originalCount = document.views.length;

    await userEvent.click(canvas.getByRole("button", { name: /Story options/ }));
    await userEvent.click(body.getByRole("button", { name: "Edit current view" }));
    await waitFor(() => {
      expect(body.getByText("Presentation")).toBeVisible();
      for (const type of [
        "text",
        "multitext",
        "toggle",
        "slider",
        "dropdown",
        "file",
        "folder",
        "formula",
        "property",
      ]) {
        expect(
          canvasElement.ownerDocument.querySelector(`[data-option-type="${type}"]`),
        ).toBeVisible();
      }
    });

    const name = body.getByLabelText("View name");
    await userEvent.clear(name);
    await userEvent.type(name, "Configured options");
    await userEvent.tab();
    expect(document.views.some((view) => view.name === "Configured options")).toBe(true);

    for (const [label, value] of [
      ["Heading", "Delivery portfolio"],
      ["Labels", "launch, research"],
      ["Template file", "Templates/project.md"],
      ["Source folder", "Projects"],
      ["Label formula", "file.name + note.status"],
    ] as const) {
      const input = body.getByLabelText(label);
      await userEvent.clear(input);
      await userEvent.type(input, value);
      await userEvent.tab();
    }
    await userEvent.click(body.getByRole("switch", { name: "Compact" }));

    await userEvent.click(
      body.getByRole("button", { name: "View actions for Configured options" }),
    );
    await userEvent.click(body.getByText("Duplicate view"));
    await waitFor(() => expect(document.views).toHaveLength(originalCount + 1));
    await userEvent.click(
      body.getByRole("button", { name: "View actions for Configured options" }),
    );
    await userEvent.click(body.getByText("Delete view"));
    await waitFor(() => expect(document.views).toHaveLength(originalCount));

    await userEvent.click(body.getByRole("button", { name: /Edit Configured options/ }));
    await userEvent.click(body.getByRole("button", { name: "Add view" }));
    await waitFor(() => expect(document.views).toHaveLength(originalCount + 1));

    const addedView = document.views.at(-1)!;
    await userEvent.click(body.getAllByText("Table").at(-1)!);
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-type="table"]')).toBeVisible(),
    );
    await userEvent.click(canvas.getByRole("button", { name: "Table" }));
    await userEvent.click(body.getByRole("button", { name: "Edit current view" }));
    const layoutLabel = body.getByText("Layout");
    const layoutTrigger = layoutLabel.parentElement?.querySelector("button");
    expect(layoutTrigger).toBeTruthy();
    await userEvent.click(layoutTrigger!);
    await userEvent.click((await body.findAllByText("Cards")).at(-1)!);
    await waitFor(() => expect(addedView.type).toBe("cards"));

    await userEvent.click(body.getByRole("button", { name: /Edit Table/ }));
    await userEvent.click((await body.findAllByText("Portfolio table")).at(-1)!);
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-type="table"]')).toBeVisible(),
    );
    await userEvent.click(canvas.getByRole("button", { name: "Properties" }));
    await userEvent.click(body.getByRole("button", { name: "Add formula" }));
    await waitFor(() => expect(document.formulas).toHaveProperty("Untitled"));

    const summaryLabel = body.getByText("Summary in all views");
    const summaryTrigger = summaryLabel.parentElement?.querySelector("button");
    expect(summaryTrigger).toBeTruthy();
    await userEvent.click(summaryTrigger!);
    await userEvent.click((await body.findAllByText("Count")).at(-1)!);
    await waitFor(() =>
      expect(document.summaries).toMatchObject({ "formula.Untitled": "count" }),
    );

    await userEvent.click(body.getByRole("button", { name: /Edit Untitled/ }));
    await userEvent.click(body.getAllByText("Status").at(-1)!);
    const portfolio = document.views.find(
      (view) => view.name === "Portfolio table",
    )!;
    await waitFor(() => expect(portfolio.order).not.toContain("note.status"));
    await userEvent.click(canvas.getByRole("button", { name: "Properties" }));

    expect(
      document.views.some(
        (view) =>
          (view as Record<string, unknown>)["heading"] === "Delivery portfolio" &&
          (view as Record<string, unknown>)["compact"] === true,
      ),
    ).toBe(true);
  },
};

export const EditableCells: Story = {
  parameters: workflowParameters(
    "editable-cells",
    "Text, number, checkbox, date, tags, file, and folder cells render against persisted frontmatter; the focused Views story performs the mutation and navigation assertions.",
  ),
  render: renderScenario("editable-cells"),
  play: async ({ canvasElement }) => {
    const { canvas } = await waitForWorkflow(canvasElement, "table");
    await waitFor(() => {
      expect(canvas.getAllByRole("combobox", { name: "owner" })[0]).toBeVisible();
      expect(canvas.getAllByRole("spinbutton", { name: "score" })[0]).toBeVisible();
      expect(canvas.getAllByRole("checkbox", { name: "featured" })[0]).toBeVisible();
      expect(canvas.getAllByRole("combobox", { name: "tags" })[0]).toBeVisible();
      expect(canvasElement.querySelector('input[type="date"][aria-label="due"]')).toBeVisible();
    });
  },
};
