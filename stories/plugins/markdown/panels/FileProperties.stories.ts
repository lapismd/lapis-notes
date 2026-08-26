import type { App } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { FileProperties } from "@lapis-notes/markdown";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import PanelDemo from "../../_shared/panels/PanelDemo.svelte";
import { panelExampleSources } from "../../_shared/panels/Panel.example-sources";
import type { PanelDemoLayout } from "../../_shared/panels/create-panel-demo";
import {
  expectPanelAlignment,
  expectPanelPlacement,
  expectPanelSource,
  PANEL_DOCS_PARAMETERS,
  PANEL_PLACEMENTS,
  panelDemoApp,
  placementParameters,
} from "../../_shared/panels/panel-story-helpers";
import "../../_shared/panels/Panel.docs.css";

const kind = "file-properties" as const;
const sources = panelExampleSources(kind);

const meta = {
  title: "Plugins/Markdown/Panels/File Properties",
  component: FileProperties,
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
          "File Properties accepts only the initialized Lapis App. Each story keeps one minimal active Markdown note because property editing is file-scoped.",
      },
    },
  },
} satisfies Meta<typeof FileProperties>;

export default meta;
type Story = StoryObj<typeof meta>;
type StoryRender = NonNullable<Story["render"]>;

function renderPlacement(layout: PanelDemoLayout): StoryRender {
  return (() => ({
    Component: PanelDemo,
    props: { kind, layout },
  })) as StoryRender;
}

function resizePanelTab(
  app: App,
  layout: PanelDemoLayout,
): (() => void) | null {
  const renderer = getWorkspaceHostBinding(app.workspace).controller.renderer;
  const snapshot = renderer.getLayout();

  if (layout === "middle-top-tabs") {
    if (snapshot.main.kind !== "split") {
      throw new Error("Expected the panel story main split");
    }
    const originalSizes = [...snapshot.main.sizes];
    if (!renderer.setSplitSizes(snapshot.main.id, [88, 12])) {
      throw new Error("Could not resize the panel story main split");
    }
    return () => {
      renderer.setSplitSizes(snapshot.main.id, originalSizes);
    };
  }

  return null;
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
        "file-properties-panel",
        args,
      );
      const alignment = await expectPanelAlignment(
        canvasElement,
        "file-properties-panel",
      );
      await waitFor(() => {
        expect(
          panel.getByRole("combobox", { name: "status value" }),
        ).toHaveTextContent("ready");
      });
      const editor = alignment.panelElement.querySelector<HTMLElement>(
        '[data-testid="mira-frontmatter-editor"]',
      );
      const widgetShell = alignment.panelElement.querySelector<HTMLElement>(
        ".markdown-widget-shell",
      );
      expect(editor).not.toBeNull();
      expect(widgetShell).not.toBeNull();
      expect(getComputedStyle(widgetShell as HTMLElement).minWidth).toBe("0px");
      expect(getComputedStyle(widgetShell as HTMLElement).backgroundColor).toBe(
        "rgba(0, 0, 0, 0)",
      );
      expect(
        Math.abs(
          (editor?.getBoundingClientRect().width ?? 0) -
            alignment.availableContentWidth,
        ),
      ).toBeLessThan(1);

      const tagsRow = alignment.panelElement.querySelector<HTMLElement>(
        '[data-property="tags"]',
      );
      const aliasesRow = alignment.panelElement.querySelector<HTMLElement>(
        '[data-property="aliases"]',
      );
      const ownersRow = alignment.panelElement.querySelector<HTMLElement>(
        '[data-property="owners"]',
      );
      expect(tagsRow).not.toBeNull();
      expect(aliasesRow).not.toBeNull();
      expect(ownersRow).not.toBeNull();
      const tagsTypeButton = within(tagsRow as HTMLElement).getByRole(
        "button",
        { name: "Property options for tags" },
      );
      const tagsTypeIcon = tagsTypeButton.querySelector<SVGElement>("svg");
      expect(tagsTypeIcon).not.toBeNull();
      expect(tagsTypeIcon?.querySelector('path[d="M4 9h16"]')).not.toBeNull();
      expect(tagsTypeIcon?.querySelector('path[d="M4 15h16"]')).not.toBeNull();
      const tags = within(tagsRow as HTMLElement);
      const aliases = within(aliasesRow as HTMLElement);
      const owners = within(ownersRow as HTMLElement);
      expect(tags.getByText("demo", { exact: true })).toBeVisible();
      expect(tags.getByText("markdown", { exact: true })).toBeVisible();
      expect(tags.getByText("project/alpha", { exact: true })).toBeVisible();
      expect(tags.getByRole("button", { name: "Remove demo" })).toBeVisible();
      expect(
        getComputedStyle(
          tags
            .getByText("demo", { exact: true })
            .closest(".metadata-property-pill-chip") as HTMLElement,
        ).backgroundColor,
      ).not.toBe("rgba(0, 0, 0, 0)");
      expect(aliases.getByText("Lapis Home", { exact: true })).toBeVisible();
      expect(aliases.getByText("Idea inbox", { exact: true })).toBeVisible();
      expect(
        aliases
          .getByText("Idea inbox", { exact: true })
          .closest(".metadata-property-pill-link"),
      ).not.toBeNull();
      const tagsInput = tags.getByRole("combobox", { name: "tags value" });
      await userEvent.click(tagsInput);
      await userEvent.type(tagsInput, "ide");
      await waitFor(() => {
        expect(
          within(canvasElement.ownerDocument.body).getByRole("option", {
            name: "ideas",
          }),
        ).toBeVisible();
      });
      await userEvent.keyboard("{Escape}");
      const aliasPill = aliases
        .getByText("Lapis Home", { exact: true })
        .closest<HTMLElement>(".metadata-property-pill-chip");
      expect(aliasPill).not.toBeNull();
      expect(
        getComputedStyle(aliasPill as HTMLElement).backgroundColor,
      ).not.toBe(getComputedStyle(alignment.viewHost).backgroundColor);
      expect(
        aliases.getByRole("button", { name: "Remove Lapis Home" }),
      ).toBeVisible();
      expect(owners.getByText("Ada Lovelace", { exact: true })).toBeVisible();
      expect(owners.getByText("Grace Hopper", { exact: true })).toBeVisible();
      const ownersPill = owners
        .getByText("Ada Lovelace", { exact: true })
        .closest<HTMLElement>(".metadata-property-pill-chip");
      expect(ownersPill).not.toBeNull();
      expect(
        getComputedStyle(ownersPill as HTMLElement).backgroundColor,
      ).not.toBe(getComputedStyle(alignment.viewHost).backgroundColor);

      for (const [scope, label] of [
        [tags, "demo"],
        [aliases, "Lapis Home"],
        [owners, "Ada Lovelace"],
      ] as const) {
        const remove = scope.getByRole("button", {
          name: `Remove ${label}`,
        });
        const removeIcon = remove.querySelector<SVGElement>("svg");
        expect(removeIcon).not.toBeNull();
        expect(
          removeIcon?.querySelector('path[d="M18 6 6 18"]'),
        ).not.toBeNull();
        expect(
          removeIcon?.querySelector('path[d="m6 6 12 12"]'),
        ).not.toBeNull();
        expect(
          removeIcon?.getBoundingClientRect().width ?? 0,
        ).toBeGreaterThanOrEqual(9);
      }

      const page = within(canvasElement.ownerDocument.body);
      const ownersInput = owners.getByRole("combobox", {
        name: "owners value",
      });
      await userEvent.click(ownersInput);
      await userEvent.type(ownersInput, "Mar");
      const ownerOption = await page.findByRole("option", {
        name: "Margaret Hamilton",
      });
      const ownerSuggestions = ownerOption.closest<HTMLElement>(
        ".mira-property-value-suggestions",
      );
      expect(ownerSuggestions).not.toBeNull();
      expect((ownersRow as HTMLElement).contains(ownerSuggestions)).toBe(false);
      const ownerOptionBounds = ownerOption.getBoundingClientRect();
      const ownerOptionHit = canvasElement.ownerDocument.elementFromPoint(
        ownerOptionBounds.left + ownerOptionBounds.width / 2,
        ownerOptionBounds.top + ownerOptionBounds.height / 2,
      );
      expect(
        ownerOptionHit === ownerOption || ownerOption.contains(ownerOptionHit),
      ).toBe(true);
      await userEvent.click(ownerOption);
      await expect(
        owners.getByText("Margaret Hamilton", { exact: true }),
      ).toBeVisible();

      await userEvent.click(tagsTypeButton);
      const optionsMenu = page.getByRole("menu", {
        name: "Property options for tags",
      });
      const propertyType = within(optionsMenu).getByRole("menuitem", {
        name: "Property type",
      });
      await expect(optionsMenu).toBeVisible();
      expect(
        within(optionsMenu)
          .getAllByRole("menuitem")
          .map((item) => item.textContent?.trim()),
      ).toEqual(["Property type", "Cut", "Copy", "Paste", "Remove"]);
      expect(
        within(optionsMenu).queryByRole("menuitemcheckbox", { name: "Text" }),
      ).not.toBeInTheDocument();

      propertyType.focus();
      await userEvent.keyboard("{ArrowRight}");
      const typeMenu = page.getByRole("menu", {
        name: "Property type for tags",
      });
      const textType = within(typeMenu).getByRole("menuitemcheckbox", {
        name: "Text",
      });
      const tagsType = within(typeMenu).getByRole("menuitemcheckbox", {
        name: "Tags",
      });
      await expect(typeMenu).toBeVisible();
      await expect(textType).toBeVisible();
      await expect(textType).toHaveAttribute("aria-checked", "false");
      expect(textType.firstElementChild?.querySelector("svg")).toBeNull();
      expect(
        textType.querySelector(".metadata-property-type-menu__type-icon"),
      ).not.toBeNull();
      await expect(tagsType).toHaveAttribute("aria-checked", "true");
      expect(tagsType.firstElementChild?.querySelector("svg")).not.toBeNull();
      expect(
        tagsType.querySelector(".metadata-property-type-menu__type-icon"),
      ).not.toBeNull();
      expect((tagsRow as HTMLElement).contains(typeMenu)).toBe(false);
      expect(typeMenu.getBoundingClientRect().bottom).toBeGreaterThan(
        (tagsRow as HTMLElement).getBoundingClientRect().bottom,
      );
      const textTypeBounds = textType.getBoundingClientRect();
      const hit = canvasElement.ownerDocument.elementFromPoint(
        textTypeBounds.left + textTypeBounds.width / 2,
        textTypeBounds.top + textTypeBounds.height / 2,
      );
      expect(
        hit === textType || textType.contains(hit),
        `Expected the Text item to own its center point; hit ${hit?.tagName ?? "nothing"}.${hit instanceof HTMLElement ? hit.className : ""}`,
      ).toBe(true);
      await userEvent.keyboard("{Escape}");
      await userEvent.keyboard("{Escape}");
      await waitFor(() => {
        expect(
          page.queryByRole("menu", { name: "Property options for tags" }),
        ).toBeNull();
        expect(
          page.queryByRole("menu", { name: "Property type for tags" }),
        ).toBeNull();
        expect(
          getComputedStyle(canvasElement.ownerDocument.body).pointerEvents,
        ).not.toBe("none");
      });

      const propertyContainer =
        alignment.panelElement.querySelector<HTMLElement>(
          ".mira-frontmatter.metadata-container",
        );
      const tagsKey = tagsRow?.querySelector<HTMLElement>(
        ".metadata-property-key",
      );
      const tagsValue = tagsRow?.querySelector<HTMLElement>(
        ".metadata-property-value",
      );
      const tagsKeyInput = tagsRow?.querySelector<HTMLElement>(
        ".metadata-property-key-input",
      );
      const firstTagPill = tagsRow?.querySelector<HTMLElement>(
        ".metadata-property-pill-chip",
      );
      expect(propertyContainer).not.toBeNull();
      expect(tagsKey).not.toBeNull();
      expect(tagsValue).not.toBeNull();
      expect(tagsKeyInput).not.toBeNull();
      expect(firstTagPill).not.toBeNull();
      if ((propertyContainer?.getBoundingClientRect().width ?? 0) >= 250) {
        expect(getComputedStyle(tagsRow as HTMLElement).flexWrap).toBe(
          "nowrap",
        );
      }

      const restorePanelTab = resizePanelTab(
        panelDemoApp(canvasElement),
        layout,
      );
      if (restorePanelTab) {
        try {
          await waitFor(() => {
            const keyBounds = tagsKey?.getBoundingClientRect();
            const valueBounds = tagsValue?.getBoundingClientRect();
            const rowBounds = tagsRow?.getBoundingClientRect();
            const keyInputBounds = tagsKeyInput?.getBoundingClientRect();
            const keyInputStyle = getComputedStyle(tagsKeyInput as HTMLElement);
            const labelTextStart =
              (keyInputBounds?.left ?? 0) +
              Number.parseFloat(keyInputStyle.paddingInlineStart);
            const valueStart = firstTagPill?.getBoundingClientRect().left ?? 0;
            expect(
              propertyContainer?.getBoundingClientRect().width ?? 0,
            ).toBeLessThan(250);
            expect(getComputedStyle(tagsRow as HTMLElement).flexWrap).toBe(
              "wrap",
            );
            expect(
              Math.abs((keyBounds?.width ?? 0) - (rowBounds?.width ?? 0)),
            ).toBeLessThan(1);
            expect(
              Math.abs((valueBounds?.width ?? 0) - (rowBounds?.width ?? 0)),
            ).toBeLessThan(1);
            expect(valueBounds?.top ?? 0).toBeGreaterThanOrEqual(
              (keyBounds?.bottom ?? 0) - 1,
            );
            expect(Math.abs(valueStart - labelTextStart)).toBeLessThan(1);
            const scrollViewport =
              alignment.panelElement.querySelector<HTMLElement>(
                '.markdown-sidebar-panel__scroll [data-ui-part="scroll-area-viewport"]',
              );
            expect(scrollViewport).not.toBeNull();
            expect(
              (scrollViewport?.scrollWidth ?? 0) -
                (scrollViewport?.clientWidth ?? 0),
            ).toBeLessThanOrEqual(1);
            expect(scrollViewport?.scrollLeft ?? 0).toBe(0);
          });
        } finally {
          restorePanelTab();
        }
        await waitFor(() => {
          expect(
            propertyContainer?.getBoundingClientRect().width ?? 0,
          ).toBeGreaterThanOrEqual(250);
          expect(getComputedStyle(tagsRow as HTMLElement).flexWrap).toBe(
            "nowrap",
          );
        });
      }

      let status = panel.getByRole("combobox", { name: "status value" });
      await userEvent.click(status);
      await userEvent.clear(status);
      await userEvent.type(status, "pla");
      const plannedOption = await page.findByRole("option", {
        name: "planned",
      });
      const statusRow = status.closest<HTMLElement>(".metadata-property");
      const statusSuggestions = plannedOption.closest<HTMLElement>(
        ".mira-property-value-suggestions",
      );
      expect(statusRow).not.toBeNull();
      expect(statusSuggestions).not.toBeNull();
      expect(statusRow?.contains(statusSuggestions)).toBe(false);
      const plannedBounds = plannedOption.getBoundingClientRect();
      const plannedHit = canvasElement.ownerDocument.elementFromPoint(
        plannedBounds.left + plannedBounds.width / 2,
        plannedBounds.top + plannedBounds.height / 2,
      );
      expect(
        plannedHit === plannedOption || plannedOption.contains(plannedHit),
      ).toBe(true);
      await userEvent.click(plannedOption);
      status = panel.getByRole("combobox", { name: "status value" });
      await expect(status).toHaveTextContent("planned");
      if (layout === "middle-top-tabs") {
        const app = panelDemoApp(canvasElement);
        const file = app.vault.getFileByPath("Notes/Welcome.md");
        if (!file) throw new Error("Missing seeded Welcome note");
        await app.fileManager.processFrontMatter(file, (frontmatter) => {
          frontmatter.status = "review";
        });
        await waitFor(() => {
          expect(
            panel.getByRole("combobox", { name: "status value" }),
          ).toHaveTextContent("review");
        });
        status = panel.getByRole("combobox", { name: "status value" });
      }
      await userEvent.click(status);
      await expect(status).toHaveFocus();
      await expect(status).toHaveAttribute("contenteditable", "true");
      const focusedProperty = status.closest<HTMLElement>(".metadata-property");
      const focusedValue = status.closest<HTMLElement>(
        ".metadata-property-value",
      );
      expect(focusedProperty).not.toBeNull();
      expect(focusedValue).not.toBeNull();
      const focusedPropertyStyle = getComputedStyle(
        focusedProperty as HTMLElement,
      );
      expect(
        Number.parseFloat(focusedPropertyStyle.borderTopWidth),
      ).toBeGreaterThan(0.9);
      expect(focusedPropertyStyle.boxShadow).not.toBe("none");
      expect(focusedPropertyStyle.borderRadius).toBe("4px");
      const focusedValueBackground = getComputedStyle(
        focusedValue as HTMLElement,
      ).backgroundColor;
      expect(focusedValueBackground).not.toBe(
        getComputedStyle(alignment.viewHost).backgroundColor,
      );
      expect(getComputedStyle(status).outlineStyle).toBe("none");
      expect(
        Array.from(
          alignment.panelElement.querySelectorAll<HTMLTextAreaElement>(
            "textarea",
          ),
        ).every((textarea) => getComputedStyle(textarea).resize === "none"),
      ).toBe(true);
      expect(getComputedStyle(status).fontSize).toBe("12px");
      await userEvent.keyboard("{Escape}");
      await expect(
        panel.getByRole("button", { name: /Add property/i }),
      ).toBeVisible();
      await expectPanelSource(parameters, kind, layout);
    },
  };
}

export const MiddleTopTabs = placementStory(
  "middle-top-tabs",
  sources.MiddleTopTabs,
  "File Properties beside the minimal active Markdown note, with the panel receiving the larger middle split.",
);
export const StackedTabs = placementStory(
  "stacked-tabs",
  sources.StackedTabs,
  "File Properties selected in stacked tabs beside the minimal active note.",
);
export const LeftSidebar = placementStory(
  "left-sidebar",
  sources.LeftSidebar,
  "File Properties in the left sidebar with only its required note in the body.",
);
export const RightSidebar = placementStory(
  "right-sidebar",
  sources.RightSidebar,
  "File Properties in the right sidebar with only its required note in the body.",
);
export const BottomPanel = placementStory(
  "bottom-panel",
  sources.BottomPanel,
  "File Properties inside real grouped bottom-panel chrome.",
);
export const SidebarGroup = placementStory(
  "sidebar-group",
  sources.SidebarGroup,
  "File Properties as the only view in a grouped right-sidebar item.",
);
