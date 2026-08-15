<script lang="ts" module>
  import { ItemView, type App } from "@lapis-notes/api";
  import { RolesPlugin } from "@lapis-notes/lapis-plugin-cv-roles";
  import { MarkdownView } from "@lapis-notes/markdown";
  import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
  import { findWorkspaceTab } from "@lapismd/design-core/workspace/core";
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect, userEvent, waitFor, within } from "storybook/test";
  import { RolesPluginShellExample } from "./RolesPluginShell.example-sources";
  import RolesPluginShellDemo from "./RolesPluginShellDemo.svelte";

  const { Story } = defineMeta({
    title: "Workspace/Plugins/Roles/Plugin Shell",
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
        story: "Boot a real App with File Explorer, Search in a collapsed right sidebar, aggregate and dedicated Roles views, role.md, and the retained CV FileView restored from persisted layout.",
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

    const rolesPlugin = app.plugins.plugins.get("roles");
    expect(rolesPlugin).toBeInstanceOf(RolesPlugin);
    if (!(rolesPlugin instanceof RolesPlugin)) {
      throw new Error("The Roles plugin did not load its public runtime");
    }
    expect(app.workspace.getLeavesOfType("roles")).toHaveLength(1);
    expect(app.workspace.getLeavesOfType("roles-activity")).toHaveLength(1);
    expect(app.workspace.getLeavesOfType("roles-actions")).toHaveLength(1);
    expect(app.workspace.getLeavesOfType("role")).toHaveLength(1);

    const aggregateLeaf = app.workspace.getLeavesOfType("roles")[0]!;
    const roleLeaf = app.workspace.getLeavesOfType("role")[0]!;
    const aggregateTab = canvasElement.querySelector<HTMLButtonElement>(
      '[data-workspace-tab-id="roles"] [data-workspace-tab-title-trigger]',
    );
    expect(aggregateTab).not.toBeNull();
    await userEvent.click(aggregateTab!);
    await waitFor(() => {
      expect(app.workspace.activeLeaf).toBe(aggregateLeaf);
      expect(
        canvasElement.querySelector('[data-ui-component="roles-applications"]'),
      ).toBeVisible();
    });

    const applicationsSurface = canvasElement.querySelector<HTMLElement>(
      ".applications-board-surface",
    );
    const applicationsSearchRow = applicationsSurface?.querySelector<HTMLElement>(
      ".applications-search-row",
    );
    const applicationsBoard = applicationsSurface?.querySelector<HTMLElement>(
      '[data-ui-component="roles-applications"]',
    );
    expect(applicationsSurface).not.toBeNull();
    expect(applicationsSearchRow).not.toBeNull();
    expect(applicationsBoard).not.toBeNull();
    expect(getComputedStyle(applicationsSurface!).flexDirection).toBe("column");
    expect(
      Array.from(applicationsSurface!.children).indexOf(applicationsSearchRow!),
    ).toBeLessThan(
      Array.from(applicationsSurface!.children).indexOf(applicationsBoard!),
    );

    const roleTab = canvasElement.querySelector<HTMLButtonElement>(
      '[data-workspace-tab-id="atlas-role"] [data-workspace-tab-title-trigger]',
    );
    expect(roleTab).not.toBeNull();
    await userEvent.click(roleTab!);
    await waitFor(() => {
      expect(app.workspace.activeLeaf).toBe(roleLeaf);
      expect(roleLeaf.view.getViewType()).toBe("role");
      expect(
        canvasElement.querySelector('[data-ui-component="role-workspace"]'),
      ).toBeVisible();
    });
    expect(canvas.queryByRole("tab", { name: "Source" })).toBeNull();
    expect(roleLeaf.view).toBeInstanceOf(ItemView);
    expect((roleLeaf.view as ItemView).actions).toHaveLength(1);
    const roleEditAction = await waitFor(
      () =>
        canvas.getByRole("button", {
          name: /Current view: role preview.*Click to edit/s,
        }),
      { timeout: 5_000 },
    );
    await userEvent.click(roleEditAction);
    await waitFor(() => {
      expect(app.workspace.activeLeaf).toBe(roleLeaf);
      expect(roleLeaf.view.getViewType()).toBe("markdown");
      expect(roleLeaf.view.getState()).toMatchObject({
        file: "Roles/atlas-ai-infra/role.md",
        mode: "live-preview",
      });
      expect(
        roleLeaf.view.containerEl.querySelector(
          '[data-ui-component="markdown-editing-surface"]',
        ),
      ).toBeVisible();
      const embeddedSurface = roleLeaf.view.containerEl.querySelector(
        '[data-ui-component="embedded-editor-surface"][data-editor-mode="live-preview"]',
      );
      expect(embeddedSurface).toBeVisible();
      expect(embeddedSurface?.innerHTML).toContain("cm-editor-scroll-area");
      expect(embeddedSurface?.innerHTML).toContain("mira-live-preview-mode");
      expect(embeddedSurface?.querySelector(".cm-heading")).not.toBeNull();
    }, { timeout: 5_000 });
    expect(roleLeaf.view).toBeInstanceOf(MarkdownView);
    await userEvent.click(
      canvas.getByRole("button", {
        name: /Current view: editing.*Click to open role preview/s,
      }),
    );
    await waitFor(() => {
      expect(app.workspace.activeLeaf).toBe(roleLeaf);
      expect(roleLeaf.view.getViewType()).toBe("role");
      expect(
        canvasElement.querySelector('[data-ui-component="role-workspace"]'),
      ).toBeVisible();
    });
    await userEvent.click(canvas.getByRole("tab", { name: "Description" }));
    await waitFor(() => {
      expect(
        canvasElement.querySelector(
          '[data-ui-component="embedded-editor-surface"][data-editor-mode="live-preview"] .cm-editor.mira-live-preview-mode',
        ),
      ).toBeVisible();
      expect(
        canvasElement.querySelector(
          '[data-ui-component="embedded-editor-surface"][data-editor-mode="live-preview"] .cm-heading',
        ),
      ).not.toBeNull();
    });

    await userEvent.click(aggregateTab!);
    await waitFor(() => {
      expect(app.workspace.activeLeaf).toBe(aggregateLeaf);
      expect(
        canvasElement.querySelector('[data-ui-component="roles-applications"]'),
      ).toBeVisible();
    });

    await userEvent.click(canvas.getByRole("button", { name: "Show activity" }));
    await waitFor(() => {
      expect(rolesPlugin.getPresentation().mode).toBe("activity");
      expect(
        canvasElement.querySelector('[data-ui-component="role-activity"]'),
      ).toBeVisible();
      expect(app.workspace.activeLeaf).toBe(aggregateLeaf);
    });
    await userEvent.click(
      canvas.getByRole("button", { name: /Show actions/ }),
    );
    await waitFor(() => {
      expect(rolesPlugin.getPresentation().mode).toBe("actions");
      expect(
        canvasElement.querySelector('[data-ui-component="role-actions"]'),
      ).toBeVisible();
      expect(app.workspace.activeLeaf).toBe(aggregateLeaf);
    });
    await userEvent.click(
      canvas.getByRole("button", { name: "Show applications" }),
    );
    await waitFor(() => expect(rolesPlugin.getPresentation().mode).toBe("applications"));

    const activityLeaf = app.workspace.getLeavesOfType("roles-activity")[0]!;
    await app.commands.executeCommand("roles:open-activity");
    await waitFor(() => expect(app.workspace.activeLeaf).toBe(activityLeaf));
    await app.commands.executeCommand("roles:open-activity");
    await waitFor(() => {
      expect(app.workspace.getLeavesOfType("roles-activity")).toEqual([activityLeaf]);
      expect(app.workspace.activeLeaf).toBe(activityLeaf);
    });

    const actionsLeaf = app.workspace.getLeavesOfType("roles-actions")[0]!;
    await app.commands.executeCommand("roles:open-actions");
    await waitFor(() => expect(app.workspace.activeLeaf).toBe(actionsLeaf));
    await app.commands.executeCommand("roles:open-actions");
    await waitFor(() => {
      expect(app.workspace.getLeavesOfType("roles-actions")).toEqual([actionsLeaf]);
      expect(app.workspace.activeLeaf).toBe(actionsLeaf);
    });

    const applicationsRibbon = canvas.getByRole("button", {
      name: "Open Applications",
    });
    const getApplicationsRibbon = () =>
      canvasElement.querySelector<HTMLButtonElement>(
        '[data-hint-target-id="ribbon:roles:Open Applications"]',
      );
    await userEvent.click(applicationsRibbon);
    await waitFor(() => {
      expect(app.workspace.activeLeaf).toBe(aggregateLeaf);
      expect(rolesPlugin.getPresentation().mode).toBe("applications");
    });

    const getActionsStatus = () =>
      canvasElement.querySelector<HTMLButtonElement>(
        '[data-status-bar-item-id="roles:actions-attention"]',
      );
    const actionsStatus = await waitFor(() => {
      const item = getActionsStatus();
      expect(item).not.toBeNull();
      return item!;
    });
    await userEvent.click(actionsStatus);
    await waitFor(() => expect(app.workspace.activeLeaf).toBe(actionsLeaf));

    await rolesPlugin.updateSettings({
      newRolesFolder: "Opportunities",
      showActionCountInStatusBar: false,
    });
    await waitFor(() => expect(getActionsStatus()).toBeNull());
    expect(rolesPlugin.getSettings().newRolesFolder).toBe("Opportunities");
    await rolesPlugin.updateSettings({ showActionCountInStatusBar: true });
    await waitFor(() => expect(getActionsStatus()).not.toBeNull());

    await userEvent.click(canvas.getByRole("button", { name: "Open settings" }));
    const settingsDialog = canvas.getByRole("dialog", { name: "Settings" });
    const settings = within(settingsDialog);
    await userEvent.click(settings.getByRole("button", { name: "Core plugins" }));
    await expect(
      settings.getByRole("heading", { name: "Included plugins" }),
    ).toBeVisible();
    await expect(
      settings.getByRole("heading", { name: "First-party plugins" }),
    ).toBeVisible();
    for (const [pluginId, pluginName] of [
      ["markdown", "Markdown"],
      ["lapis-markdown-lint", "Markdown Lint"],
      ["lapis-file-explorer", "Lapis File Explorer"],
      ["search", "Search"],
    ] as const) {
      const getToggle = () =>
        settings.getByRole("switch", { name: `Enable ${pluginName}` });
      const toggle = getToggle();
      await expect(toggle).toBeChecked();
      await userEvent.click(toggle);
      await waitFor(() => {
        expect(app.plugins.isPluginEnabled(pluginId)).toBe(false);
        expect(toggle).not.toBeChecked();
      });
      await waitFor(() => expect(getToggle()).not.toBeDisabled());
      await userEvent.click(getToggle());
      await waitFor(() => {
        expect(app.plugins.isPluginEnabled(pluginId)).toBe(true);
        expect(getToggle()).toBeChecked();
      });
    }

    const getRolesToggle = () =>
      settings.getByRole("switch", { name: "Enable Roles" });
    await userEvent.click(getRolesToggle());
    await waitFor(() => {
      expect(app.plugins.isPluginEnabled("roles")).toBe(false);
      expect(app.workspace.getLeafById("atlas-role")?.getViewState()).toMatchObject({
        type: "empty",
        state: { __missingViewType: "role" },
      });
      expect(app.workspace.getLeafById("sample-cv")?.getViewState()).toMatchObject({
        type: "empty",
        state: { __missingViewType: "cv" },
      });
      expect(app.workspace.getLeafById("roles")?.getViewState()).toMatchObject({
        type: "empty",
        state: { __missingViewType: "roles" },
      });
      expect(app.workspace.getLeafById("roles-activity")?.getViewState()).toMatchObject({
        type: "empty",
        state: { __missingViewType: "roles-activity" },
      });
      expect(app.workspace.getLeafById("roles-actions")?.getViewState()).toMatchObject({
        type: "empty",
        state: { __missingViewType: "roles-actions" },
      });
      expect(getApplicationsRibbon()).toBeNull();
      expect(getActionsStatus()).toBeNull();
    });
    await waitFor(() => expect(getRolesToggle()).not.toBeDisabled());
    await userEvent.click(getRolesToggle());
    await waitFor(() => {
      expect(app.plugins.isPluginEnabled("roles")).toBe(true);
      expect(app.workspace.getLeavesOfType("roles")).toHaveLength(1);
      expect(app.workspace.getLeavesOfType("roles-activity")).toHaveLength(1);
      expect(app.workspace.getLeavesOfType("roles-actions")).toHaveLength(1);
      expect(app.workspace.getLeavesOfType("role")).toHaveLength(1);
      expect(app.workspace.getLeavesOfType("cv")).toHaveLength(1);
      expect(getApplicationsRibbon()).not.toBeNull();
      expect(getActionsStatus()).not.toBeNull();
    });
    const restoredRolesPlugin = app.plugins.plugins.get("roles");
    expect(restoredRolesPlugin).toBeInstanceOf(RolesPlugin);
    expect((restoredRolesPlugin as RolesPlugin).getSettings().newRolesFolder).toBe(
      "Opportunities",
    );

    const getNotificationsToggle = () =>
      settings.getByRole("switch", { name: "Enable Notifications" });
    await userEvent.click(getNotificationsToggle());
    await expect(getNotificationsToggle()).not.toBeChecked();
    await userEvent.click(getNotificationsToggle());
    await expect(getNotificationsToggle()).toBeChecked();
    await userEvent.click(settings.getByRole("button", { name: "Close settings" }));
    const initialCvTab = canvasElement.querySelector<HTMLButtonElement>(
      '[data-workspace-tab-id="sample-cv"] [data-workspace-tab-title-trigger]',
    );
    expect(initialCvTab).not.toBeNull();
    await userEvent.click(initialCvTab!);
    await waitFor(() => {
      expect(app.workspace.activeLeaf?.view.getViewType()).toBe("cv");
    });
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

    await userEvent.click(explorer.getByRole("button", { name: "role.md" }));
    await waitFor(() => {
      expect(app.workspace.activeLeaf).toBe(roleLeaf);
      expect(
        findWorkspaceTab(
          getWorkspaceHostBinding(app.workspace).controller.renderer.layout,
          roleLeaf.id,
        )?.pane.activeItemId,
      ).toBe(roleLeaf.id);
      expect(
        canvasElement.querySelector(
          `[data-workspace-tab-id="${roleLeaf.id}"]`,
        ),
      ).toHaveAttribute("data-active", "true");
      expect(
        canvasElement.querySelector(
          `[data-workspace-tab-id="${roleLeaf.id}"] [data-workspace-tab-title-trigger]`,
        ),
      ).toHaveAttribute("aria-pressed", "true");
      expect(
        canvasElement.querySelector('[data-ui-component="role-workspace"]'),
      ).toBeVisible();
    });
    const cvTab = canvasElement.querySelector<HTMLButtonElement>(
      '[data-workspace-tab-id="sample-cv"] [data-workspace-tab-title-trigger]',
    );
    expect(cvTab).not.toBeNull();
    await userEvent.click(cvTab!);
    await waitFor(() => {
      expect(app.workspace.activeLeaf?.view.getViewType()).toBe("cv");
      expect(canvas.getByTestId("cv-workspace")).toBeVisible();
    });

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
    expect(shell.scrollHeight).toBeLessThanOrEqual(shell.clientHeight + 2);
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
    formScroller.scrollTop = formScroller.scrollHeight - formScroller.clientHeight;
    formScroller.dispatchEvent(new Event("scroll"));
    await waitFor(() => {
      expect(formScroller.scrollTop).toBeGreaterThan(0);
    });
    expect(shell.scrollTop).toBe(0);
    formScroller.scrollTop = 0;
    formScroller.dispatchEvent(new Event("scroll"));
    expect(canvasElement.ownerDocument.querySelectorAll("main")).toHaveLength(1);

    const search = within(canvas.getByTestId("search-panel"));
    const searchbox = search.getByRole("searchbox", { name: "Search vault" });
    await waitFor(
      async () => {
        const indexedCv = await app.appDatabase.getSearchDocument("sample.cv.yml");
        expect(JSON.parse(indexedCv?.metadataText ?? "{}")).toMatchObject({
          technologies: expect.arrayContaining(["Kubernetes"]),
        });
      },
      { timeout: 8_000 },
    );
    const searchFor = async (query: string) => {
      await userEvent.clear(searchbox);
      await userEvent.click(searchbox);
      await userEvent.paste(query);
    };

    await searchFor("roles-plugin-shell");
    await waitFor(
      () => {
        expect(
          search.getByRole("treeitem", {
            name: /Notes\/Welcome\.md/,
          }),
        ).toBeTruthy();
      },
      { timeout: 30_000 },
    );
    await searchFor("Nexus AI");
    await waitFor(
      () => {
        expect(
          search.getByRole("treeitem", {
            name: /sample\.cv\.yml/i,
          }),
        ).toBeTruthy();
      },
      { timeout: 30_000 },
    );

    await searchFor("ambiguous platform migrations");
    await waitFor(
      () => {
        expect(
          search.getByRole("treeitem", {
            name: /Roles\/atlas-ai-infra\/role\.md/i,
          }),
        ).toBeTruthy();
      },
      { timeout: 30_000 },
    );
    await searchFor("tag:leadership");
    await waitFor(
      () => {
        expect(
          search.getByRole("treeitem", {
            name: /Roles\/northstar-tools\/role\.md/i,
          }),
        ).toBeTruthy();
      },
      { timeout: 30_000 },
    );
    await searchFor('["status"]:interview');
    await waitFor(
      () => {
        expect(
          search.getByRole("treeitem", {
            name: /Roles\/harbour-payments\/role\.md/i,
          }),
        ).toBeTruthy();
      },
      { timeout: 30_000 },
    );
    await searchFor('["company"]:"Atlas AI"');
    await waitFor(
      () => {
        expect(
          search.getByRole("treeitem", {
            name: /Roles\/atlas-ai-infra\/role\.md/i,
          }),
        ).toBeTruthy();
      },
      { timeout: 30_000 },
    );
    await searchFor('["technologies"]:Kubernetes');
    await waitFor(
      () => {
        expect(
          search.getByRole("treeitem", {
            name: /sample\.cv\.yml/i,
          }),
        ).toBeTruthy();
      },
      { timeout: 30_000 },
    );

    await searchFor("ordinary-yaml-search-marker");
    await waitFor(
      () => {
        expect(search.getByText("No matches found.")).toBeTruthy();
      },
      { timeout: 30_000 },
    );
    expect(search.queryByText(/settings\.yml/i)).toBeNull();

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
