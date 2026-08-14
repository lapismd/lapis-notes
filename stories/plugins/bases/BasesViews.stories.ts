import type { App } from "@lapis-notes/api";
import { BasesViewSurface, type BasesDocument } from "@lapis-notes/bases";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { workspaceCatalogParameters } from "../../catalog/catalog.mjs";
import { WORKSPACE_SHELL_DOCS_STORY } from "../../workspace/docs-parameters";
import BasesViewsDemo from "./BasesViewsDemo.svelte";
import { basesViewsExampleSource } from "./BasesViews.example-sources";
import type { BasesViewScenario } from "./bases-views-fixture";

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
