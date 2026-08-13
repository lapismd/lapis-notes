import { expect, test, type Page } from "@playwright/test";

async function createBrowserVault(page: Page, name: string): Promise<void> {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Create a vault" })).toBeVisible();
  await page.getByLabel("New vault name").fill(name);
  await page.getByRole("button", { name: /Create Browser Vault/ }).click();
  await expect(page.getByRole("button", { name: /Current workspace:/ })).toContainText(
    name,
  );
  await expect(page.getByText("DB Owner", { exact: true })).toBeVisible();
}

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

  await page.reload();
  await expect(page.getByRole("button", { name: /Current workspace:/ })).toContainText(
    "Persistent Browser Vault",
  );
  await expect(page.getByRole("tab", { name: "Search" })).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  expect(await page.evaluate(() => window.crossOriginIsolated)).toBe(true);
});

test("secondary tab delegates Turso writes and Search before owner takeover", async ({
  context,
  page: owner,
}) => {
  await createBrowserVault(owner, "Coordinated Browser Vault");

  const proxy = await context.newPage();
  await proxy.goto("/");
  await expect(proxy.getByText("DB Proxy", { exact: true })).toBeVisible();

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
