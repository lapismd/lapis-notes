import { expect, test, type Page } from "@playwright/test";

async function createBrowserVault(page: Page, name: string): Promise<void> {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Create a vault" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Return to previous vault" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: /Create New Vault/ }).click();
  const dialog = page.getByRole("dialog", { name: "New Browser Vault" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Create vault" })).toBeDisabled();
  await dialog.getByLabel("Name").fill(name);
  await dialog.getByRole("button", { name: "Create vault" }).click();
  await expect(page.getByRole("button", { name: /Current workspace:/ })).toContainText(
    name,
  );
  await expect(page.getByRole("button", { name: "Open Chat" })).toBeVisible();
  await expect(page.getByText("DB Owner", { exact: true })).toBeVisible();
}

const basesProjectSeed = {
  "Projects/Aurora.md": `---
status: Active
owner: Maya Chen
score: 94
---
# Aurora
`,
  "Projects/Harbor.md": `---
status: Planning
owner: Leo Martins
score: 82
---
# Harbor
`,
  "Bases/Projects.base": JSON.stringify({
    filters: { and: [] },
    properties: {
      "file.name": { displayName: "Project" },
      "note.owner": { displayName: "Owner" },
      "note.score": { displayName: "Score" },
    },
    formulas: {},
    summaries: {},
    activeView: "Projects",
    views: [
      {
        type: "table",
        name: "Projects",
        order: ["file.name", "note.owner", "note.score"],
        sort: [{ property: "note.score", direction: "DESC" }],
        filter: { and: [] },
        limit: 0,
        columnSize: {},
      },
    ],
  }),
};

async function seedAndOpenBasesFile(page: Page): Promise<void> {
  await page.evaluate(async (seed) => {
    const app = (
      window as typeof window & {
        app: {
          vault: {
            create(path: string, data: string): Promise<unknown>;
            getFileByPath(path: string): unknown;
            mkpath(path: string): Promise<unknown>;
          };
          openFile(
            file: unknown,
            state?: { state: Record<string, unknown> },
          ): Promise<void>;
          workspace: { requestSaveLayout(event?: unknown): void };
        };
      }
    ).app;
    await app.vault.mkpath("Projects");
    await app.vault.mkpath("Bases");
    for (const [path, content] of Object.entries(seed)) {
      await app.vault.create(path, content);
    }
    const base = app.vault.getFileByPath("Bases/Projects.base");
    if (!base) throw new Error("The seeded Bases document was not indexed");
    await app.openFile(base, { state: { mode: "preview" } });
    app.workspace.requestSaveLayout({ source: "api" });
  }, basesProjectSeed);
}

test("Manage Vaults overlays the chooser and close returns without startup", async ({
  page,
}) => {
  await createBrowserVault(page, "Overlay Browser Vault");
  await page.getByRole("button", { name: /Current workspace:/ }).click();
  await page.getByRole("menuitem", { name: "Manage Vaults" }).click();
  await expect(page.locator("[data-web-vault-launcher]")).toBeVisible();
  await expect(page.locator("[data-web-host-state]")).toHaveAttribute(
    "data-web-host-state",
    "ready",
  );
  await expect(page.locator("[data-vault-id]")).toBeAttached();
  const close = page.getByRole("button", { name: "Return to previous vault" });
  await expect(close).toBeVisible();
  await page
    .getByRole("button", { name: "Open actions for Overlay Browser Vault" })
    .click();
  await expect(page.getByRole("menuitem", { name: "Copy ID" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Rename..." })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Delete..." })).toBeVisible();
  await expect(
    page.getByRole("menuitem", { name: "Remove from list" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await close.click();
  await expect(page.locator("[data-web-vault-launcher]")).toHaveCount(0);
  await expect(page.locator("[data-web-host-state]")).toHaveAttribute(
    "data-web-host-state",
    "ready",
  );
  await expect(page.getByRole("button", { name: /Current workspace:/ })).toContainText(
    "Overlay Browser Vault",
  );
  await expect(page.locator('[data-ui-component="workspace-startup"]')).toHaveCount(0);
});

test("first launch remains recoverable after folder cancellation", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () => {
        throw new DOMException("Picker cancelled", "AbortError");
      },
    });
  });

  const response = await page.goto("/");
  expect(response?.headers()["cross-origin-opener-policy"]).toBe("same-origin");
  expect(response?.headers()["cross-origin-embedder-policy"]).toBe("require-corp");
  await page.getByRole("button", { name: /Open Folder/ }).click();
  await expect(page.getByRole("heading", { name: "Create a vault" })).toBeVisible();
  await expect(page.locator('[data-web-host-state="landing"]')).toBeVisible();
});

test("OPFS vault and workspace layout survive a full PWA reload", async ({ page }) => {
  await createBrowserVault(page, "Persistent Browser Vault");
  await expect(page.locator("html")).toHaveAttribute("data-runtime", "web-pwa");
  await expect(page.getByRole("tab", { name: "Search" })).toBeVisible();

  await page.addInitScript(() => {
    const root = window as typeof window & {
      __webHostSawChooser?: boolean;
      __webHostStates?: string[];
    };
    root.__webHostSawChooser = false;
    root.__webHostStates = [];
    const record = () => {
      const state = document
        .querySelector("[data-web-host-state]")
        ?.getAttribute("data-web-host-state");
      if (state) root.__webHostStates?.push(state);
      if (document.querySelector("[data-web-vault-launcher]")) {
        root.__webHostSawChooser = true;
      }
    };
    new MutationObserver(record).observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
    });
  });
  await page.reload();
  await expect(page.getByRole("button", { name: /Current workspace:/ })).toContainText(
    "Persistent Browser Vault",
  );
  await expect(page.getByRole("tab", { name: "Search" })).toBeVisible();
  expect(
    await page.evaluate(() => {
      const root = window as typeof window & {
        __webHostSawChooser?: boolean;
        __webHostStates?: string[];
      };
      return {
        sawChooser: root.__webHostSawChooser === true,
        states: root.__webHostStates ?? [],
      };
    }),
  ).toEqual(
    expect.objectContaining({
      sawChooser: false,
    }),
  );
  expect(
    await page.evaluate(
      () =>
        (
          window as typeof window & {
            __webHostStates?: string[];
          }
        ).__webHostStates ?? [],
    ),
  ).not.toContain("landing");
  await expect(page.locator('[data-web-host-state="landing"]')).toHaveCount(0);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  expect(await page.evaluate(() => window.crossOriginIsolated)).toBe(true);
});

test("bundled Bases queries, edits, and restores an OPFS document", async ({ page }) => {
  await createBrowserVault(page, "Bases Browser Vault");
  await seedAndOpenBasesFile(page);

  const table = page.locator('[data-ui-component="bases-table-view"]');
  await expect(table).toBeVisible();
  await expect(table.locator('[data-ui-part="row"]')).toHaveCount(2);
  await expect(table.getByText("Aurora.md")).toBeVisible();

  const owner = table.getByRole("combobox", { name: "owner" }).first();
  await owner.fill("Priya Shah");
  await owner.press("Enter");
  await expect.poll(() => page.evaluate(async () => {
    const app = (
      window as typeof window & {
        app: {
          vault: {
            getFileByPath(path: string): unknown;
            read(file: unknown): Promise<string>;
          };
        };
      }
    ).app;
    const file = app.vault.getFileByPath("Projects/Aurora.md");
    return file ? app.vault.read(file) : "";
  })).toContain("owner: Priya Shah");

  await expect.poll(() => page.evaluate(async () => {
    const app = (
      window as typeof window & {
        app: {
          vault: {
            getFileByPath(path: string): unknown;
            read(file: unknown): Promise<string>;
          };
        };
      }
    ).app;
    const layout = app.vault.getFileByPath(".obsidian/workspace.json");
    return layout ? app.vault.read(layout) : "";
  })).toContain("Bases/Projects.base");

  await page.reload();
  await expect(page.locator('[data-ui-component="bases-table-view"]')).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "owner" }).first(),
  ).toHaveValue("Priya Shah");
  expect(await page.evaluate(async () => {
    const app = (
      window as typeof window & {
        app: {
          vault: {
            getFileByPath(path: string): unknown;
            read(file: unknown): Promise<string>;
          };
        };
      }
    ).app;
    const file = app.vault.getFileByPath("Bases/Projects.base");
    return file ? app.vault.read(file) : "";
  })).toBe(basesProjectSeed["Bases/Projects.base"]);
});

test("secondary tab delegates Turso writes and Search before owner takeover", async ({
  context,
  page: owner,
}) => {
  test.setTimeout(90_000);
  await createBrowserVault(owner, "Coordinated Browser Vault");

  const proxy = await context.newPage();
  await proxy.goto("/");
  await expect(proxy.getByText("DB Proxy", { exact: true })).toBeVisible();
  await expect(
    proxy.getByRole("button", { name: /Current workspace:/ }),
  ).toBeVisible();
  await proxy.getByRole("tab", { name: "Search" }).click();

  await proxy.evaluate(async () => {
    const app = (
      window as typeof window & {
        app: { vault: { create(path: string, data: string): Promise<unknown> } };
      }
    ).app;
    await app.vault.create(
      "delegated-search.md",
      "# Delegated Search\n\nA turso proxy writes this searchable phrase.",
    );
  });
  const searchbox = proxy.getByRole("searchbox", { name: "Search vault" });
  await searchbox.fill("searchable phrase");
  await expect(
    proxy.getByRole("treeitem", { name: /delegated-search\.md, 1 matches/ }),
  ).toBeVisible();
  await expect(proxy.locator('[role="tree"]')).toBeVisible();

  const semantic = await proxy.evaluate(async () => {
    const database = (
      window as typeof window & {
        app: {
          appDatabase: {
            configureSearchEmbeddingProvider(config: unknown): Promise<void>;
            rebuildSearchIndex(): Promise<void>;
            getSearchEmbeddingRuntimeStatus(): Promise<{
              providerKind?: string;
              phase?: string;
            } | null>;
            searchDocuments(
              query: string,
              options: unknown,
            ): Promise<
              Array<{
                document: { path: string };
                retrievalMode: string;
              }>
            >;
          };
        };
      }
    ).app.appDatabase;
    await database.configureSearchEmbeddingProvider({
      kind: "token-hash",
      dimensions: 48,
    });
    await database.rebuildSearchIndex();
    return {
      status: await database.getSearchEmbeddingRuntimeStatus(),
      results: await database.searchDocuments("searchable phrase", {
        mode: "vector",
        includeDiagnostics: true,
      }),
    };
  });
  expect(semantic.status).toMatchObject({
    providerKind: "token-hash",
    phase: "ready",
  });
  expect(semantic.results).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        document: expect.objectContaining({ path: "delegated-search.md" }),
        retrievalMode: "vector",
      }),
    ]),
  );

  await owner.close();
  await expect(proxy.getByText("DB Owner", { exact: true })).toBeVisible({
    timeout: 12_000,
  });

  await proxy.reload();
  await expect(proxy.getByText("DB Owner", { exact: true })).toBeVisible();
  await proxy.getByRole("searchbox", { name: "Search vault" }).fill(
    "searchable phrase",
  );
  await expect(
    proxy.getByRole("treeitem", { name: /delegated-search\.md, 1 matches/ }),
  ).toBeVisible();
});
