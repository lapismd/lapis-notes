import { createVaultSearchFilterSyntax } from "@lapis-notes/api";
import {
  DEFAULT_GRAPH_SETTINGS,
  GraphControlsOverlay,
  GraphPlugin,
} from "@lapis-notes/graph";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import {
  expect,
  fireEvent,
  fn,
  userEvent,
  waitFor,
  within,
} from "storybook/test";
import PanelDemo from "../../_shared/panels/PanelDemo.svelte";
import { panelExampleSources } from "../../_shared/panels/Panel.example-sources";
import type { PanelDemoLayout } from "../../_shared/panels/create-panel-demo";
import {
  expectAsyncQueryFailureAndRecovery,
  expectPanelPlacement,
  expectPanelSource,
  panelDemoApp,
  PANEL_DOCS_PARAMETERS,
  PANEL_PLACEMENTS,
  placementParameters,
  triggerMetadataReset,
} from "../../_shared/panels/panel-story-helpers";
import "../../_shared/panels/Panel.docs.css";

const kind = "graph" as const;
const sources = panelExampleSources(kind);

const meta = {
  title: "Plugins/Graph/Panels/Graph",
  component: GraphControlsOverlay,
  args: {
    app: undefined as never,
    isLocal: false,
    settings: DEFAULT_GRAPH_SETTINGS,
    statsText: "",
    statusText: "",
    statusKind: null,
    groupDiagnostics: {},
    filterDiagnostic: null,
    filterSyntax: createVaultSearchFilterSyntax({
      fileNames: [],
      paths: [],
      tags: [],
    }),
    preview: null,
    isAnimating: false,
    onFocusActiveFile: fn(),
    onZoomIn: fn(),
    onZoomOut: fn(),
    onResetView: fn(),
    onRefreshGraph: fn(),
    onResetDefaults: fn(),
    onToggleAnimation: fn(),
    onSettingsPatch: fn(),
    onOpenPreviewFile: fn(),
    onDismissPreview: fn(),
  },
  argTypes: {
    settings: { control: false },
    onFocusActiveFile: { control: false },
    onZoomIn: { control: false },
    onZoomOut: { control: false },
    onResetView: { control: false },
    onRefreshGraph: { control: false },
    onResetDefaults: { control: false },
    onToggleAnimation: { control: false },
    onSettingsPatch: { control: false },
    onOpenPreviewFile: { control: false },
    onDismissPreview: { control: false },
  },
  tags: ["visual-pending", "test"],
  parameters: {
    layout: "fullscreen",
    docs: {
      ...PANEL_DOCS_PARAMETERS,
      description: {
        component:
          "Graph preserves the legacy canvas and controls while reading the indexed vault through the bundled Graph plugin.",
      },
    },
  },
} satisfies Meta<typeof GraphControlsOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;
type StoryRender = NonNullable<Story["render"]>;

function styleRules(ownerDocument: Document): CSSStyleRule[] {
  const result: CSSStyleRule[] = [];
  const visit = (rules: CSSRuleList) => {
    for (const rule of rules) {
      if ("selectorText" in rule && "style" in rule) {
        result.push(rule as CSSStyleRule);
      }
      const nestedRules = (rule as CSSRule & { cssRules?: CSSRuleList })
        .cssRules;
      if (nestedRules) visit(nestedRules);
    }
  };

  for (const sheet of ownerDocument.styleSheets) {
    try {
      visit(sheet.cssRules);
    } catch {
      // Cross-origin Storybook assets are irrelevant to the local component rules.
    }
  }
  return result;
}

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
        "graph-panel",
        args,
      );
      await waitFor(() => {
        expect(panel.getByText(/\d+ nodes • \d+ links/)).toBeVisible();
        expect(panel.getByLabelText("Toggle graph settings")).toBeVisible();
      });
      const app = panelDemoApp(canvasElement);
      expect(app.plugins.plugins.get("lapis-graph")).toBeInstanceOf(
        GraphPlugin,
      );

      await userEvent.click(panel.getByLabelText("Focus active file"));
      await userEvent.click(panel.getByLabelText("Zoom in"));
      await userEvent.click(panel.getByLabelText("Reset view"));
      await userEvent.click(panel.getByLabelText("Toggle graph settings"));
      const dialog = await panel.findByRole("dialog", {
        name: "Graph settings",
      });
      const dialogWidth = Number.parseFloat(getComputedStyle(dialog).width);
      expect(dialogWidth).toBeLessThanOrEqual(300);
      expect(dialogWidth).toBeGreaterThanOrEqual(272);
      const displayTrigger = within(dialog).getByRole("button", {
        name: "Display",
      });
      const displayTriggerStyle = getComputedStyle(displayTrigger);
      expect(displayTriggerStyle.alignItems).toBe("center");
      expect(displayTriggerStyle.gap).toBe("12px");
      expect(displayTriggerStyle.fontWeight).toBe("600");
      expect(displayTriggerStyle.paddingInlineStart).toBe("16px");
      await userEvent.hover(displayTrigger);
      expect(getComputedStyle(displayTrigger).textDecorationLine).toBe("none");
      await userEvent.unhover(displayTrigger);
      expect(
        displayTrigger.querySelector('[data-indicator-glyph="chevron-right"]'),
      ).toBeVisible();
      const graphRoot = canvasElement.querySelector<HTMLElement>(
        '[data-ui-component="graph"]',
      );
      expect(graphRoot).not.toBeNull();
      const graphStyle = getComputedStyle(graphRoot!);
      expect(
        graphStyle.getPropertyValue("--ui-graph-controls-width").trim(),
      ).toBe("300px");
      expect(graphStyle.getPropertyValue("--ui-graph-node-note").trim()).toBe(
        graphStyle.getPropertyValue("--muted-foreground").trim(),
      );
      expect(
        graphStyle.getPropertyValue("--ui-graph-node-label-hover").trim(),
      ).toBe(
        graphStyle.getPropertyValue("--ui-graph-surface-foreground").trim(),
      );
      for (const role of [
        "--graph-text",
        "--graph-line",
        "--graph-node",
        "--graph-node-unresolved",
        "--graph-node-focused",
        "--graph-node-tag",
        "--graph-node-attachment",
      ]) {
        expect(graphStyle.getPropertyValue(role).trim()).not.toBe("");
      }
      expect(graphStyle.getPropertyValue("--graph-line").trim()).toBe(
        graphStyle.getPropertyValue("--input").trim(),
      );
      expect(graphStyle.getPropertyValue("--ui-graph-link-active").trim()).toBe(
        graphStyle.getPropertyValue("--graph-node-focused").trim(),
      );
      await userEvent.click(displayTrigger);
      const linkThickness = within(dialog).getByRole("slider", {
        name: "Link thickness",
      });
      expect(linkThickness).toHaveAttribute("aria-valuemin", "0.1");
      expect(linkThickness).toHaveAttribute("aria-valuemax", "5");
      expect(
        within(dialog).getByRole("slider", {
          name: "Hover activation delay",
        }),
      ).toHaveAttribute("aria-valuenow", "500");
      expect(
        within(dialog).getByRole("slider", {
          name: "Hover release delay",
        }),
      ).toHaveAttribute("aria-valuenow", "350");
      await userEvent.click(displayTrigger);
      await userEvent.click(within(dialog).getByText("Filters"));
      await expect(within(dialog).getByLabelText("Search files")).toBeVisible();
      await expect(within(dialog).getByLabelText("Show tags")).toBeVisible();

      if (layout === "middle-top-tabs") {
        await expectAsyncQueryFailureAndRecovery({
          target: app.metadataCache,
          method: "queryMetadataPage",
          trigger: () => triggerMetadataReset(app),
          expectFailure: async () => {
            await waitFor(() => expect(panel.getByRole("alert")).toBeVisible());
          },
          expectRecovery: async () => {
            await waitFor(() => {
              expect(panel.queryByRole("alert")).toBeNull();
              expect(panel.getByText(/\d+ nodes • \d+ links/)).toBeVisible();
            });
          },
        });

        await userEvent.click(
          within(dialog).getByRole("button", { name: /Groups/ }),
        );
        await userEvent.click(
          within(dialog).getByRole("button", { name: "New group" }),
        );
        const groupQuery = within(dialog).getByLabelText("Group 1 query");
        const groupItem = groupQuery.closest<HTMLElement>(
          '[data-sortable-group="graph-groups"]',
        );
        expect(groupItem).not.toBeNull();
        const colorButton = within(dialog).getByRole("button", {
          name: "Group 1 color picker",
        });
        const dragHandle = within(groupItem!).getByRole("button", {
          name: "Reorder Group 1",
        });
        const removeButton = within(groupItem!).getByRole("button", {
          name: "Remove item",
        });
        const queryRect = groupQuery.getBoundingClientRect();
        const groupItemRect = groupItem!.getBoundingClientRect();
        const dialogRect = dialog.getBoundingClientRect();
        const dragRect = dragHandle.getBoundingClientRect();
        const colorRect = colorButton.getBoundingClientRect();
        const removeRect = removeButton.getBoundingClientRect();
        expect(queryRect.width).toBeGreaterThanOrEqual(180);
        const idleItemStyle = getComputedStyle(groupItem!);
        expect(idleItemStyle.paddingLeft).toBe("24px");
        expect(idleItemStyle.borderBottomWidth).toBe("0px");
        expect(idleItemStyle.boxShadow).toBe("none");
        expect(
          Math.abs(dragRect.left - groupItemRect.left - 4),
        ).toBeLessThanOrEqual(0.5);
        expect(queryRect.left - dragRect.right).toBeGreaterThanOrEqual(4);
        expect(queryRect.right).toBeLessThanOrEqual(colorRect.left);
        expect(colorRect.right).toBeLessThanOrEqual(removeRect.left);
        expect(getComputedStyle(removeButton).position).toBe("absolute");
        expect(removeRect.right).toBeLessThanOrEqual(groupItemRect.right);
        expect(
          Math.abs(groupItemRect.right - removeRect.right - 8),
        ).toBeLessThanOrEqual(0.5);
        expect(removeRect.right).toBeLessThanOrEqual(
          dialog.getBoundingClientRect().right,
        );
        await userEvent.click(groupQuery);
        groupQuery.focus();
        await waitFor(() =>
          expect(groupItem!.matches(":focus-within")).toBe(true),
        );
        const focusPaintProbe =
          canvasElement.ownerDocument.createElement("span");
        focusPaintProbe.style.background = "var(--ui-graph-controls-hover)";
        groupItem!.append(focusPaintProbe);
        const expectedFocusBackground =
          getComputedStyle(focusPaintProbe).backgroundColor;
        focusPaintProbe.remove();
        await waitFor(() =>
          expect(getComputedStyle(groupItem!).backgroundColor).toBe(
            expectedFocusBackground,
          ),
        );
        const focusedItemStyle = getComputedStyle(groupItem!);
        expect(
          Number.parseFloat(focusedItemStyle.borderRadius),
        ).toBeGreaterThan(0);
        expect(
          dialogRect.right - groupItem!.getBoundingClientRect().right,
        ).toBeGreaterThanOrEqual(4);
        expect(dragRect.left).toBeGreaterThanOrEqual(groupItemRect.left);
        expect(removeRect.right).toBeLessThanOrEqual(groupItemRect.right);
        const removeStyle = getComputedStyle(removeButton);
        expect(removeStyle.opacity).toBe("1");
        const removeHitTarget = canvasElement.ownerDocument.elementFromPoint(
          removeRect.left + removeRect.width / 2,
          removeRect.top + removeRect.height / 2,
        );
        expect(removeHitTarget && removeButton.contains(removeHitTarget)).toBe(
          true,
        );
        expect(
          removeStyle
            .getPropertyValue(
              "--ui-sortable-array-item-remove-hover-background",
            )
            .trim(),
        ).toBe(
          removeStyle.getPropertyValue("--ui-graph-controls-hover").trim(),
        );
        const ownerRules = styleRules(canvasElement.ownerDocument);
        const handleHoverRule = ownerRules.find((rule) =>
          rule.selectorText.includes(
            '[data-ui-part="sortable-array-item-drag"]:hover:not(:focus-visible)',
          ),
        );
        expect(handleHoverRule?.style.boxShadow).toBe("none");
        const removeHoverRule = ownerRules.find((rule) =>
          rule.selectorText.includes(".ui-sortable-array-item__remove:hover"),
        );
        expect(removeHoverRule?.style.background).toContain(
          "--ui-sortable-array-item-remove-hover-background",
        );
        await userEvent.type(groupQuery, "tag:");
        const ownerBody = within(canvasElement.ownerDocument.body);
        const slashTag = await ownerBody.findByRole("option", {
          name: /#project\/alpha/,
        });
        await userEvent.click(slashTag);
        await waitFor(() =>
          expect(groupQuery).toHaveTextContent("tag:#project/alpha"),
        );

        await userEvent.click(colorButton);
        const colorPreset = await ownerBody.findByRole("button", {
          name: "Use #16a34a",
        });
        const palette = colorPreset.closest<HTMLElement>(
          '[data-ui-part="popover-content"]',
        );
        expect(palette).not.toBeNull();
        const triggerRect = colorButton.getBoundingClientRect();
        const paletteRect = palette!.getBoundingClientRect();
        expect(
          Math.min(
            Math.abs(paletteRect.left - triggerRect.right),
            Math.abs(triggerRect.left - paletteRect.right),
            Math.abs(paletteRect.top - triggerRect.bottom),
            Math.abs(triggerRect.top - paletteRect.bottom),
          ),
        ).toBeLessThanOrEqual(8);
        const anyColor = ownerBody.getByLabelText("Group 1 any color");
        expect(anyColor).toHaveValue("#3b82f6");
        (anyColor as HTMLInputElement).value = "#0ea5e9";
        await fireEvent.input(anyColor);
        await waitFor(() =>
          expect(
            getComputedStyle(colorButton)
              .getPropertyValue("--ui-color-picker-current")
              .trim(),
          ).toBe("#0ea5e9"),
        );
        await userEvent.click(colorPreset);

        await userEvent.click(
          within(dialog).getByRole("button", { name: "New group" }),
        );
        const secondQuery = within(dialog).getByLabelText("Group 2 query");
        await userEvent.type(secondQuery, "path:Code");
        await waitFor(() => expect(secondQuery).toHaveTextContent("path:Code"));
        const reorderButton = within(dialog).getByRole("button", {
          name: "Reorder Group 2",
        });
        await fireEvent.keyDown(reorderButton, { key: "ArrowUp" });
        await waitFor(() => {
          const reordered = dialog.querySelectorAll<HTMLElement>(
            '[data-sortable-group="graph-groups"]',
          );
          expect(
            within(reordered[0]!).getByLabelText("Group 1 query"),
          ).toHaveTextContent("path:Code");
        });

        await userEvent.click(panel.getByLabelText("Focus active file"));
        const canvas = canvasElement.querySelector<HTMLCanvasElement>(
          '[data-ui-part="canvas"]',
        );
        expect(canvas).not.toBeNull();
        const canvasRect = canvas!.getBoundingClientRect();
        await fireEvent.pointerMove(canvas!, {
          clientX: canvasRect.left + canvasRect.width / 2,
          clientY: canvasRect.top + canvasRect.height / 2,
          metaKey: true,
        });
        const previewCard = await waitFor(
          () => {
            const card = canvasElement.ownerDocument.querySelector<HTMLElement>(
              ".graph-file-preview",
            );
            expect(card).toBeVisible();
            return card!;
          },
          { timeout: 2000 },
        );
        expect(
          within(previewCard).getByRole("button", { name: /^Open / }),
        ).toBeVisible();
        await waitFor(() => {
          const previewRect = previewCard.getBoundingClientRect();
          const ownerWindow = canvasElement.ownerDocument.defaultView!;
          const visibleLeft = Math.max(0, previewRect.left);
          const visibleRight = Math.min(
            ownerWindow.innerWidth,
            previewRect.right,
          );
          const visibleTop = Math.max(0, previewRect.top);
          const visibleBottom = Math.min(
            ownerWindow.innerHeight,
            previewRect.bottom,
          );
          expect(visibleRight).toBeGreaterThan(visibleLeft);
          expect(visibleBottom).toBeGreaterThan(visibleTop);
          const topmost = canvasElement.ownerDocument.elementFromPoint(
            (visibleLeft + visibleRight) / 2,
            visibleTop + Math.min((visibleBottom - visibleTop) / 2, 80),
          );
          expect(topmost && previewCard.contains(topmost)).toBe(true);
        });
        await fireEvent.keyUp(canvasElement.ownerDocument, { key: "Meta" });
        expect(previewCard).toBeVisible();

        await fireEvent.pointerMove(canvas!, {
          clientX: canvasRect.left + 2,
          clientY: canvasRect.top + 2,
        });
        await fireEvent.pointerEnter(previewCard);
        await new Promise((resolve) => setTimeout(resolve, 400));
        expect(previewCard).toBeVisible();
        await fireEvent.keyDown(previewCard, { key: "Escape" });
        await waitFor(() => expect(previewCard).not.toBeVisible());

        await userEvent.click(displayTrigger);
        await userEvent.click(
          within(dialog).getByRole("button", { name: "Animate graph" }),
        );
        const stopAnimation = await within(dialog).findByRole("button", {
          name: "Stop graph animation",
        });
        await userEvent.click(stopAnimation);

        await userEvent.click(
          within(dialog).getByRole("button", { name: "Forces" }),
        );
        const centerForce = within(dialog).getByRole("slider", {
          name: "Center force",
        });
        expect(centerForce).toHaveAttribute("aria-valuemin", "0");
        expect(centerForce).toHaveAttribute("aria-valuemax", "1");
        const repelForce = within(dialog).getByRole("slider", {
          name: "Repel force",
        });
        expect(repelForce).toHaveAttribute("aria-valuemin", "0");
        expect(repelForce).toHaveAttribute("aria-valuemax", "20");
        const linkForce = within(dialog).getByRole("slider", {
          name: "Link force",
        });
        expect(linkForce).toHaveAttribute("aria-valuemin", "0");
        expect(linkForce).toHaveAttribute("aria-valuemax", "1");
        const linkDistance = within(dialog).getByRole("slider", {
          name: "Link distance",
        });
        expect(linkDistance).toHaveAttribute("aria-valuemin", "30");
        expect(linkDistance).toHaveAttribute("aria-valuemax", "500");
      }
      await expectPanelSource(parameters, kind, layout);
    },
  };
}

export const MiddleTopTabs = placementStory(
  "middle-top-tabs",
  sources.MiddleTopTabs,
  "Global Graph in a main-area top tab over an indexed linked vault.",
);
export const StackedTabs = placementStory(
  "stacked-tabs",
  sources.StackedTabs,
  "Global Graph inside the real stacked-tabs presentation.",
);
export const LeftSidebar = placementStory(
  "left-sidebar",
  sources.LeftSidebar,
  "Global Graph remains placement-independent in the left sidebar.",
);
export const RightSidebar = placementStory(
  "right-sidebar",
  sources.RightSidebar,
  "Global Graph rendered in the right sidebar.",
);
export const BottomPanel = placementStory(
  "bottom-panel",
  sources.BottomPanel,
  "Global Graph inside the real grouped bottom panel.",
);
export const SidebarGroup = placementStory(
  "sidebar-group",
  sources.SidebarGroup,
  "Global Graph inside a grouped right-sidebar item.",
);
