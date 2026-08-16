import type { App } from "@lapis-notes/api";
import { Outline } from "@lapis-notes/markdown";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import PanelDemo from "../../_shared/panels/PanelDemo.svelte";
import { panelExampleSources } from "../../_shared/panels/Panel.example-sources";
import type { PanelDemoLayout } from "../../_shared/panels/create-panel-demo";
import {
  expectPanelPlacement,
  expectPanelSource,
  PANEL_DOCS_PARAMETERS,
  PANEL_PLACEMENTS,
  panelDemoApp,
  placementParameters,
} from "../../_shared/panels/panel-story-helpers";
import "../../_shared/panels/Panel.docs.css";

const kind = "outline" as const;
const sources = panelExampleSources(kind);

const meta = {
  title: "Plugins/Markdown/Panels/Outline",
  component: Outline,
  args: { app: undefined as unknown as App },
  argTypes: {
    app: {
      control: false,
      description:
        "Initialized Lapis App supplied by the Markdown plugin view.",
    },
  },
  tags: ["visual-pending", "test"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...PANEL_DOCS_PARAMETERS,
      description: {
        component:
          "Outline accepts only the initialized Lapis App. Placement belongs to the workspace layout, while the panel follows and navigates the active Markdown note.",
      },
    },
  },
} satisfies Meta<typeof Outline>;

export default meta;
type Story = StoryObj<typeof meta>;
type StoryRender = NonNullable<Story["render"]>;

function renderPlacement(layout: PanelDemoLayout): StoryRender {
  return (() => ({
    Component: PanelDemo,
    props: { kind, layout },
  })) as StoryRender;
}

function placementStory(
  layout: PanelDemoLayout,
  source: string,
  description: string,
): Story {
  return {
    name: PANEL_PLACEMENTS[layout].name,
    parameters: placementParameters(kind, layout, source, description),
    render: renderPlacement(layout),
    play: async ({ args, canvasElement, parameters }) => {
      const panel = await expectPanelPlacement(
        canvasElement,
        kind,
        layout,
        "outline-panel",
        args,
      );
      await waitFor(() => {
        expect(
          panel.getByRole("button", { name: "Welcome to Lapis Notes" }),
        ).toBeVisible();
        expect(panel.getByRole("button", { name: "Links" })).toBeVisible();
      });
      const panelElement = canvasElement.querySelector<HTMLElement>(
        '[data-testid="outline-panel"]',
      );
      expect(panelElement).not.toBeNull();
      const viewHost = panelElement?.closest<HTMLElement>(
        '[data-ui-component="workspace-view-host"], .ui-workspace-imperative-view',
      );
      expect(viewHost).not.toBeNull();
      expect(
        Math.abs(
          (panelElement?.getBoundingClientRect().width ?? 0) -
            (viewHost?.getBoundingClientRect().width ?? 0),
        ),
      ).toBeLessThan(1);
      expect(
        panelElement?.querySelector('[data-ui-part="group-label"]'),
      ).toBeNull();
      expect(panelElement?.querySelector('[data-ui-part="meta"]')).toBeNull();
      expect(getComputedStyle(panelElement as HTMLElement).fontFamily).toBe(
        getComputedStyle(viewHost as HTMLElement).fontFamily,
      );
      const panelContent = panelElement?.querySelector<HTMLElement>(
        '[data-ui-part="content"]',
      );
      const menuHost = panelElement?.querySelector<HTMLElement>(
        ".markdown-outline__menu-host",
      );
      expect(panelContent).not.toBeNull();
      expect(menuHost).not.toBeNull();
      const panelContentStyle = getComputedStyle(panelContent as HTMLElement);
      const expectedMenuWidth =
        (panelContent?.getBoundingClientRect().width ?? 0) -
        Number.parseFloat(panelContentStyle.paddingLeft) -
        Number.parseFloat(panelContentStyle.paddingRight);
      expect(
        Math.abs(
          (menuHost?.getBoundingClientRect().width ?? 0) - expectedMenuWidth,
        ),
      ).toBeLessThan(1);
      await waitFor(() => {
        const rows = Array.from(
          panelElement?.querySelectorAll<HTMLElement>(
            ".markdown-outline__row",
          ) ?? [],
        );
        const welcomeRow = panel.getByRole("button", {
          name: "Welcome to Lapis Notes",
        });
        const linksRow = panel.getByRole("button", { name: "Links" });
        const detailsRow = panel.getByRole("button", {
          name: "Link details",
        });
        const basicLinksRow = panel.getByRole("button", {
          name: "Basic links",
        });
        const richLinksRow = panel.getByRole("button", {
          name: "Rich links",
        });
        const aliasesRow = panel.getByRole("button", {
          name: "Aliases and labels",
        });
        const relatedNotesRow = panel.getByRole("button", {
          name: "Related notes",
        });
        const checklistRow = panel.getByRole("button", {
          name: "Checklist",
        });
        const welcomeLabel = welcomeRow.querySelector<HTMLElement>(
          ".markdown-outline__label",
        );
        const linksChevron = linksRow.querySelector<SVGElement>(
          "svg.lucide-chevron-right",
        );
        const linksLabel = linksRow.querySelector<HTMLElement>(
          ".markdown-outline__label",
        );
        const detailsLabel = detailsRow.querySelector<HTMLElement>(
          ".markdown-outline__label",
        );
        const basicLinksLabel = basicLinksRow.querySelector<HTMLElement>(
          ".markdown-outline__label",
        );
        const richLinksLabel = richLinksRow.querySelector<HTMLElement>(
          ".markdown-outline__label",
        );
        const aliasesLabel = aliasesRow.querySelector<HTMLElement>(
          ".markdown-outline__label",
        );
        const relatedNotesLabel = relatedNotesRow.querySelector<HTMLElement>(
          ".markdown-outline__label",
        );
        const checklistLabel = checklistRow.querySelector<HTMLElement>(
          ".markdown-outline__label",
        );
        const detailsGuide = detailsRow.closest<HTMLElement>(
          ".markdown-outline__sub",
        );
        expect(rows.length).toBeGreaterThan(1);
        expect(welcomeLabel).not.toBeNull();
        expect(linksChevron).not.toBeNull();
        expect(linksLabel).not.toBeNull();
        expect(detailsLabel).not.toBeNull();
        expect(basicLinksLabel).not.toBeNull();
        expect(richLinksLabel).not.toBeNull();
        expect(aliasesLabel).not.toBeNull();
        expect(relatedNotesLabel).not.toBeNull();
        expect(checklistLabel).not.toBeNull();
        expect(detailsGuide).not.toBeNull();
        expect(
          Math.abs(
            (detailsGuide?.getBoundingClientRect().left ?? 0) -
              ((linksChevron?.getBoundingClientRect().left ?? 0) +
                (linksChevron?.getBoundingClientRect().width ?? 0) / 2),
          ),
        ).toBeLessThan(1);
        expect(
          (detailsLabel?.getBoundingClientRect().left ?? 0) -
            (linksLabel?.getBoundingClientRect().left ?? 0),
        ).toBeGreaterThan(8);
        expect(
          Math.abs(
            (relatedNotesLabel?.getBoundingClientRect().left ?? 0) -
              (linksLabel?.getBoundingClientRect().left ?? 0),
          ),
        ).toBeLessThan(1);
        expect(
          Math.abs(
            (basicLinksLabel?.getBoundingClientRect().left ?? 0) -
              (detailsLabel?.getBoundingClientRect().left ?? 0),
          ),
        ).toBeLessThan(1);
        expect(
          (richLinksLabel?.getBoundingClientRect().left ?? 0) -
            (detailsLabel?.getBoundingClientRect().left ?? 0),
        ).toBeGreaterThan(8);
        expect(
          Math.abs(
            (aliasesLabel?.getBoundingClientRect().left ?? 0) -
              (richLinksLabel?.getBoundingClientRect().left ?? 0),
          ),
        ).toBeLessThan(1);
        expect(
          (linksLabel?.getBoundingClientRect().left ?? 0) -
            (checklistLabel?.getBoundingClientRect().left ?? 0),
        ).toBeGreaterThan(8);
        expect(
          Math.abs(
            (checklistLabel?.getBoundingClientRect().left ?? 0) -
              (welcomeLabel?.getBoundingClientRect().left ?? 0),
          ),
        ).toBeLessThan(1);
        expect(
          Math.max(...rows.map((row) => row.getBoundingClientRect().right)) -
            Math.min(...rows.map((row) => row.getBoundingClientRect().right)),
        ).toBeLessThan(1);
        expect(
          rows.every((row) => getComputedStyle(row).fontSize === "12px"),
        ).toBe(true);
        expect(panelElement?.querySelector("svg.lucide-hash")).toBeNull();
      });
      if (layout === "middle-top-tabs") {
        const app = panelDemoApp(canvasElement);
        const file = app.vault.getFileByPath("Notes/Welcome.md");
        if (!file) throw new Error("Missing seeded Welcome note");
        const current = await app.vault.read(file);
        await app.vault.modify(file, `${current}\n## Fresh section\n`);
        await waitFor(() => {
          expect(
            panel.getByRole("button", { name: "Fresh section" }),
          ).toBeVisible();
        });
      }
      const searchToggle = panel.getByRole("button", {
        name: "Search headings",
      });
      await userEvent.click(searchToggle);
      await expect(searchToggle).toHaveAttribute("aria-pressed", "true");
      const search = panel.getByRole("textbox", { name: "Search headings" });
      await userEvent.type(search, "details");
      await expect(
        panel.getByRole("button", { name: "Link details" }),
      ).toBeVisible();
      await waitFor(() => {
        expect(
          panel.queryByRole("button", { name: "Checklist" }),
        ).not.toBeInTheDocument();
      });
      await userEvent.click(
        panel.getByRole("button", { name: "Auto-scroll to current section" }),
      );
      await expect(
        panel.getByRole("button", { name: "Auto-scroll to current section" }),
      ).toHaveAttribute("aria-pressed", "true");
      await waitFor(() => {
        expect(
          panelDemoApp(canvasElement)
            .configuration.getConfiguration()
            .get("outline.autoScrollToCurrentSection", false),
        ).toBe(true);
      });
      await expectPanelSource(parameters, kind, layout);
    },
  };
}

export const MiddleTopTabs = placementStory(
  "middle-top-tabs",
  sources.MiddleTopTabs,
  "Outline beside its active note, with the hierarchy panel receiving the larger middle split.",
);
export const StackedTabs = placementStory(
  "stacked-tabs",
  sources.StackedTabs,
  "Outline selected in real stacked tabs beside its active note.",
);
export const LeftSidebar = placementStory(
  "left-sidebar",
  sources.LeftSidebar,
  "Outline in the left sidebar with only its active note in the body.",
);
export const RightSidebar = placementStory(
  "right-sidebar",
  sources.RightSidebar,
  "Outline in the right sidebar with only its active note in the body.",
);
export const BottomPanel = placementStory(
  "bottom-panel",
  sources.BottomPanel,
  "Outline inside real grouped bottom-panel chrome.",
);
export const SidebarGroup = placementStory(
  "sidebar-group",
  sources.SidebarGroup,
  "Outline as the only view in a grouped right-sidebar item.",
);
