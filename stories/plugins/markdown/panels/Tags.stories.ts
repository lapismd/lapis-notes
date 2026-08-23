import type { App } from "@lapis-notes/api";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Tags } from "@lapis-notes/markdown";
import PanelDemo from "../../_shared/panels/PanelDemo.svelte";
import { panelExampleSources } from "../../_shared/panels/Panel.example-sources";
import type { PanelDemoLayout } from "../../_shared/panels/create-panel-demo";
import {
  expectPanelPlacement,
  expectPanelSource,
  expectAsyncQueryFailureAndRecovery,
  PANEL_DOCS_PARAMETERS,
  PANEL_PLACEMENTS,
  panelDemoApp,
  placementParameters,
  triggerMetadataReset,
} from "../../_shared/panels/panel-story-helpers";
import "../../_shared/panels/Panel.docs.css";

const kind = "tags" as const;
const sources = panelExampleSources(kind);

const meta = {
  title: "Plugins/Markdown/Panels/Tags",
  component: Tags,
  args: { app: undefined as unknown as App },
  argTypes: {
    app: {
      control: false,
      description: "Initialized Lapis App supplied by the Markdown Tags view.",
    },
  },
  tags: ["visual-pending", "test"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...PANEL_DOCS_PARAMETERS,
      description: {
        component:
          "Tags accepts only the initialized Lapis App. It is intentionally a Storybook-local plugin/component while exercising the same movable-panel contract as public Markdown panels.",
      },
    },
  },
} satisfies Meta<typeof Tags>;

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
        "tags-panel",
        args,
      );
      const panelElement = canvasElement.querySelector<HTMLElement>(
        '[data-testid="tags-panel"]',
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
      expect(getComputedStyle(panelElement as HTMLElement).fontFamily).toBe(
        getComputedStyle(viewHost as HTMLElement).fontFamily,
      );
      const panelContent = panelElement?.querySelector<HTMLElement>(
        '[data-ui-part="content"]',
      );
      const menuHost = panelElement?.querySelector<HTMLElement>(
        ".tags-panel__menu-host",
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
        expect(panel.getByText("demo")).toBeVisible();
        expect(panel.getByText("project/alpha")).toBeVisible();
        expect(panel.getByRole("button", { name: "project 3" })).toBeVisible();
      });
      if (layout === "middle-top-tabs") {
        const app = panelDemoApp(canvasElement);
        await expectAsyncQueryFailureAndRecovery({
          target: app.metadataCache,
          method: "queryFacets",
          trigger: () => triggerMetadataReset(app),
          expectFailure: () =>
            waitFor(() => {
              expect(panel.getByRole("alert")).toHaveTextContent(
                "Storybook metadata query failure",
              );
            }),
          expectRecovery: () =>
            waitFor(() => {
              expect(panel.queryByRole("alert")).not.toBeInTheDocument();
              expect(panel.getByText("demo")).toBeVisible();
            }),
        });
        const file = app.vault.getFileByPath("Notes/Research.md");
        if (!file) throw new Error("Missing seeded Research note");
        const current = await app.vault.read(file);
        await app.vault.modify(file, `${current}\n#fresh-tag\n`);
        await waitFor(() => {
          expect(panel.getByText("fresh-tag")).toBeVisible();
        });
        const lifecycleFile = await app.vault.create(
          "Notes/Metadata-Lifecycle.md",
          "#lifecycle-refresh\n",
        );
        await waitFor(() => {
          expect(panel.getByText("lifecycle-refresh")).toBeVisible();
        });
        await app.vault.rename(
          lifecycleFile,
          "Notes/Metadata-Lifecycle-Renamed.md",
        );
        await waitFor(() => {
          expect(panel.getByText("lifecycle-refresh")).toBeVisible();
        });
        const renamedLifecycleFile = app.vault.getFileByPath(
          "Notes/Metadata-Lifecycle-Renamed.md",
        );
        if (!renamedLifecycleFile) {
          throw new Error("Missing renamed metadata lifecycle note");
        }
        await app.vault.delete(renamedLifecycleFile);
        await waitFor(() => {
          expect(
            panel.queryByText("lifecycle-refresh"),
          ).not.toBeInTheDocument();
        });
      }
      const nestedToggle = panel.getByRole("button", {
        name: "Show nested tags",
      });
      await userEvent.click(nestedToggle);
      await expect(nestedToggle).toHaveAttribute("aria-pressed", "true");
      await userEvent.click(
        panel.getByRole("button", { name: "Expand all tags" }),
      );
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      {
        const rows = Array.from(
          panelElement?.querySelectorAll<HTMLElement>(".tags-panel__row") ?? [],
        );
        const counts = Array.from(
          panelElement?.querySelectorAll<HTMLElement>(".tags-panel__count") ??
            [],
        );
        const projectRow = panel.getByRole("button", { name: "project 3" });
        const alphaRow = panel.getByRole("button", { name: "alpha 2" });
        const projectChevron = projectRow.querySelector<SVGElement>(
          "svg.lucide-chevron-right",
        );
        const projectHash =
          projectRow.querySelector<SVGElement>("svg.lucide-hash");
        const projectLabel =
          projectRow.querySelector<HTMLElement>(".tags-panel__label");
        const alphaHash = alphaRow.querySelector<SVGElement>("svg.lucide-hash");
        const alphaGuide = alphaRow.closest<HTMLElement>(".tags-panel__sub");
        const hashPositionsByDepth = new Map<number, number[]>();
        for (const row of rows) {
          let depth = 0;
          let ancestor = row.parentElement;
          while (ancestor && ancestor !== panelElement) {
            if (ancestor.classList.contains("tags-panel__sub")) depth += 1;
            ancestor = ancestor.parentElement;
          }
          const hash = row.querySelector<SVGElement>("svg.lucide-hash");
          if (hash) {
            const positions = hashPositionsByDepth.get(depth) ?? [];
            positions.push(hash.getBoundingClientRect().left);
            hashPositionsByDepth.set(depth, positions);
          }
        }
        const colorProbe = canvasElement.ownerDocument.createElement("span");
        colorProbe.style.color = "var(--ui-workspace-muted-foreground)";
        panelElement?.append(colorProbe);
        const mutedColor = getComputedStyle(colorProbe).color;
        colorProbe.remove();
        expect(rows.length).toBeGreaterThan(1);
        expect(counts.length).toBeGreaterThan(1);
        expect(projectChevron).not.toBeNull();
        expect(projectHash).not.toBeNull();
        expect(projectLabel).not.toBeNull();
        expect(alphaHash).not.toBeNull();
        expect(alphaGuide).not.toBeNull();
        expect(
          Math.abs(
            (alphaGuide?.getBoundingClientRect().left ?? 0) -
              ((projectChevron?.getBoundingClientRect().left ?? 0) +
                (projectChevron?.getBoundingClientRect().width ?? 0) / 2),
          ),
        ).toBeLessThan(1);
        expect(
          Math.abs(
            (alphaHash?.getBoundingClientRect().right ?? 0) -
              (projectLabel?.getBoundingClientRect().left ?? 0),
          ),
        ).toBeLessThan(1);
        expect(
          [...hashPositionsByDepth.values()].every(
            (positions) => Math.max(...positions) - Math.min(...positions) < 1,
          ),
        ).toBe(true);
        expect(
          rows.every(
            (row) =>
              row.querySelectorAll<SVGElement>(
                'svg.lucide-hash, svg[data-lucide="hash"]',
              ).length === 1,
          ),
        ).toBe(true);
        expect(
          rows.every((row) => {
            const hash = row.querySelector<SVGElement>("svg.lucide-hash");
            return hash && getComputedStyle(hash).color === mutedColor;
          }),
        ).toBe(true);
        expect(rows.every((row) => !row.textContent?.includes("#"))).toBe(true);
        expect(
          Math.max(
            ...counts.map((count) => count.getBoundingClientRect().right),
          ) -
            Math.min(
              ...counts.map((count) => count.getBoundingClientRect().right),
            ),
        ).toBeLessThan(1);
        expect(
          rows.every((row) => getComputedStyle(row).fontSize === "12px"),
        ).toBe(true);
      }
      const searchToggle = panel.getByRole("button", { name: "Search tags" });
      await userEvent.click(searchToggle);
      const search = panel.getByRole("textbox", { name: "Search tags" });
      await userEvent.type(search, "alpha");
      await expect(panel.getByText("alpha")).toBeVisible();
      if (layout === "middle-top-tabs") {
        await userEvent.click(
          panel.getByRole("button", { name: "Change tag sort order" }),
        );
        await userEvent.click(
          within(canvasElement.ownerDocument.body).getByText(
            "Tag name (A to Z)",
          ),
        );
        const alphaTag = panel.getByRole("button", { name: "alpha 2" });
        await waitFor(() => {
          expect(getComputedStyle(alphaTag).pointerEvents).not.toBe("none");
        });
        await userEvent.click(alphaTag);
        await waitFor(() => {
          const searchPanel = within(canvasElement).getByTestId("search-panel");
          expect(
            within(searchPanel).getByRole("searchbox", {
              name: "Search vault",
            }),
          ).toHaveTextContent("tag:#project/alpha");
        });
      }
      await expectPanelSource(parameters, kind, layout);
    },
  };
}

export const MiddleTopTabs = placementStory(
  "middle-top-tabs",
  sources.MiddleTopTabs,
  "The vault-wide Tags panel as the only middle leaf, without an unrelated document.",
);
export const StackedTabs = placementStory(
  "stacked-tabs",
  sources.StackedTabs,
  "The vault-wide Tags panel selected in real stacked tabs without a document.",
);
export const LeftSidebar = placementStory(
  "left-sidebar",
  sources.LeftSidebar,
  "The vault-wide Tags panel in the left sidebar with an otherwise empty workspace.",
);
export const RightSidebar = placementStory(
  "right-sidebar",
  sources.RightSidebar,
  "The vault-wide Tags panel in the right sidebar with an otherwise empty workspace.",
);
export const BottomPanel = placementStory(
  "bottom-panel",
  sources.BottomPanel,
  "The vault-wide Tags panel inside real grouped bottom-panel chrome.",
);
export const SidebarGroup = placementStory(
  "sidebar-group",
  sources.SidebarGroup,
  "The vault-wide Tags panel as the only view in a grouped right-sidebar item.",
);
