import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, expect, test as base, type Page } from "@playwright/test";
import {
  navigateServerPage,
  recordServerNavigationRetry,
} from "./server-navigation";

// This file's browser starts after beforeAll prepares the Docker network.
// Reusing the preceding PWA worker can deliver delayed Linux network changes
// into the server client's first module downloads.
const test = base.extend({
  browser: [
    async ({ headless, launchOptions }, use) => {
      const browser = await chromium.launch({ ...launchOptions, headless });
      try {
        await use(browser);
      } finally {
        await browser.close();
      }
    },
    { scope: "worker" },
  ],
});

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const image = process.env.LAPIS_SERVER_E2E_IMAGE ?? "lapis-server:e2e";
const suffix = `${process.pid}-${Date.now().toString(36)}`;
const containerName = `lapis-server-e2e-${suffix}`;
const networkContainerName = `lapis-server-e2e-network-${suffix}`;
const volumeName = `lapis-server-e2e-data-${suffix}`;
const secretVolumeName = `lapis-server-e2e-secret-${suffix}`;

let baseUrl = "";
let password = "";
let importArchive = "";
let temporaryRoot = "";
let containerCreated = false;
let networkContainerCreated = false;
let volumeCreated = false;
let secretVolumeCreated = false;
let serverReady = false;

function docker(args: string[], input?: string): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const child = execFile(
      "docker",
      args,
      { cwd: repoRoot, maxBuffer: 8 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          reject(
            new Error(
              `docker ${args[0] ?? "command"} failed: ${stderr.trim() || error.message}`,
            ),
          );
          return;
        }
        resolvePromise(stdout.trim());
      },
    );
    child.stdin?.end(input);
  });
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolvePromise) =>
    setTimeout(resolvePromise, milliseconds),
  );
}

async function unusedPort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolvePromise);
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  await new Promise<void>((resolvePromise, reject) => {
    server.close((error) => (error ? reject(error) : resolvePromise()));
  });
  if (!port) throw new Error("Could not reserve a server acceptance port");
  return port;
}

async function waitUntilReady(): Promise<void> {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/readyz`);
      if (response.ok) {
        serverReady = true;
        return;
      }
    } catch {
      // The container may still be starting or recreating its native database.
    }
    await delay(250);
  }
  const logs = containerCreated
    ? await docker(["logs", "--tail", "100", containerName]).catch((error) =>
        String(error),
      )
    : "container was not created";
  throw new Error(`Lapis server did not become ready\n${logs}`);
}

async function startServer(): Promise<void> {
  serverReady = false;
  await docker([
    "run",
    "--detach",
    "--name",
    containerName,
    "--network",
    `container:${networkContainerName}`,
    "--mount",
    `type=volume,source=${volumeName},target=/data`,
    "--mount",
    `type=volume,source=${secretVolumeName},target=/run/secrets,readonly`,
    "--env",
    `LAPIS_SERVER_ORIGIN=${baseUrl}`,
    "--env",
    "LAPIS_SERVER_INSECURE_COOKIE=1",
    "--env",
    "LAPIS_SERVER_BOOTSTRAP_USERNAME=owner",
    "--env",
    "LAPIS_SERVER_BOOTSTRAP_PASSWORD_FILE=/run/secrets/lapis_bootstrap_password",
    "--env",
    "LAPIS_SERVER_BUILD_ID=browser-acceptance",
    image,
  ]);
  containerCreated = true;
  await waitUntilReady();
}

async function stopServer(requireCleanExit: boolean): Promise<void> {
  if (!containerCreated) return;
  await docker(["stop", "--time", "10", containerName]);
  const exitCode = await docker([
    "inspect",
    "--format",
    "{{.State.ExitCode}}",
    containerName,
  ]);
  const finalState = await docker([
    "inspect",
    "--format",
    "{{json .State}}",
    containerName,
  ]);
  const logs =
    exitCode === "0"
      ? ""
      : await docker(["logs", "--tail", "100", containerName]).catch((error) =>
          String(error),
        );
  await docker(["rm", containerName]);
  containerCreated = false;
  if (requireCleanExit && exitCode !== "0") {
    throw new Error(
      `Server container exited with ${exitCode}\n${finalState}\n${logs}`,
    );
  }
}

function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function storedZip(path: string, content: string): Buffer {
  const name = Buffer.from(path);
  const data = Buffer.from(content);
  const checksum = crc32(data);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt32LE(checksum, 14);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt32LE(checksum, 16);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(name.length, 28);
  const centralDirectory = Buffer.concat([central, name]);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(local.length + name.length + data.length, 16);
  return Buffer.concat([local, name, data, centralDirectory, end]);
}

function vaultRow(page: Page, name: string) {
  return page.getByRole("listitem").filter({ hasText: name });
}

async function openManagedVault(page: Page, name: string): Promise<void> {
  await vaultRow(page, name)
    .getByRole("button", { name: `Open ${name}` })
    .click();
  await expect(
    page.getByRole("button", { name: /Current workspace:/ }),
  ).toContainText(name);
  await expect(page.getByText("Server DB", { exact: true })).toBeVisible();
}

async function manageVaults(page: Page): Promise<void> {
  await page.getByRole("button", { name: /Current workspace:/ }).click();
  await page.getByRole("menuitem", { name: "Manage Vaults" }).click();
  await expect(
    page.getByRole("heading", { name: "Your vaults" }),
  ).toBeVisible();
}

test.beforeAll(async () => {
  temporaryRoot = await mkdtemp(join(tmpdir(), "lapis-server-browser-"));
  password = randomBytes(32).toString("base64url");
  importArchive = join(temporaryRoot, "Imported Vault.zip");
  await writeFile(
    importArchive,
    storedZip("Imported.md", "# Imported through the server\n"),
  );
  const port = await unusedPort();
  baseUrl = `http://localhost:${port}`;
  await docker(["volume", "create", volumeName]);
  volumeCreated = true;
  await docker(["volume", "create", secretVolumeName]);
  secretVolumeCreated = true;
  await docker(
    [
      "run",
      "--rm",
      "--interactive",
      "--network",
      "none",
      "--user",
      "root",
      "--entrypoint",
      "sh",
      "--mount",
      `type=volume,source=${secretVolumeName},target=/run/secrets`,
      image,
      "-c",
      "umask 077; cat > /run/secrets/lapis_bootstrap_password; chown deno:deno /run/secrets/lapis_bootstrap_password",
    ],
    `${password}\n`,
  );
  // Keep the host interface alive while the server is stopped and recreated.
  // Linux Chromium otherwise aborts unrelated module loads when Docker's
  // bridge changes, even after the replacement server reports readiness.
  await docker([
    "run",
    "--detach",
    "--name",
    networkContainerName,
    "--publish",
    `127.0.0.1:${new URL(baseUrl).port}:8787`,
    "--entrypoint",
    "/bin/sleep",
    image,
    "infinity",
  ]);
  networkContainerCreated = true;
  await startServer();
});

test.afterAll(async () => {
  if (containerCreated && !serverReady)
    console.error(
      await docker(["logs", "--tail", "100", containerName]).catch(String),
    );
  await stopServer(false).catch(() => undefined);
  if (containerCreated) {
    await docker(["rm", "--force", containerName]).catch(() => undefined);
    containerCreated = false;
  }
  if (networkContainerCreated) {
    await docker(["rm", "--force", networkContainerName]).catch(
      () => undefined,
    );
    networkContainerCreated = false;
  }
  if (volumeCreated) {
    await docker(["volume", "rm", volumeName]).catch(() => undefined);
    volumeCreated = false;
  }
  if (secretVolumeCreated) {
    await docker(["volume", "rm", secretVolumeName]).catch(() => undefined);
    secretVolumeCreated = false;
  }
  if (temporaryRoot) await rm(temporaryRoot, { recursive: true, force: true });
});

test("server-hosted vault survives editing, sharing events, and restart", async ({
  context,
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    const pickedFile = new File(
      ["# Imported from a picked browser folder\n"],
      "Browser Folder.md",
      { type: "text/markdown" },
    );
    const fileHandle = {
      kind: "file",
      name: pickedFile.name,
      getFile: async () => pickedFile,
    };
    const directoryHandle = {
      kind: "directory",
      name: "Browser Folder",
      async *entries() {
        yield [pickedFile.name, fileHandle] as const;
      },
    };
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: async () => directoryHandle,
    });
  });
  await navigateServerPage(
    page,
    baseUrl,
    async () => {
      await expect(page.locator("html")).toHaveAttribute(
        "data-runtime",
        "node-server",
      );
      await expect(
        page.getByRole("heading", { name: "Sign in" }),
      ).toBeVisible();
    },
    (retry) => recordServerNavigationRetry(testInfo, retry),
  );
  await expect(page.locator("[data-server-login-logo]")).toBeVisible();
  await expect(page.locator("[data-server-login-logo]")).toHaveAttribute(
    "src",
    "/favicon.svg",
  );
  const signInButton = page.getByRole("button", { name: "Sign in" });
  await expect(signInButton).toHaveAttribute("data-ui-component", "button");
  await expect(signInButton).toHaveAttribute("data-variant", "default");
  const loginThemeColors = await signInButton.evaluate((button) => {
    const probe = document.createElement("span");
    probe.style.background = "var(--primary)";
    probe.style.color = "var(--primary-foreground)";
    document.body.append(probe);
    const actual = getComputedStyle(button);
    const expected = getComputedStyle(probe);
    const result = {
      background: actual.backgroundColor,
      color: actual.color,
      expectedBackground: expected.backgroundColor,
      expectedColor: expected.color,
    };
    probe.remove();
    return result;
  });
  expect(loginThemeColors.background).toBe(loginThemeColors.expectedBackground);
  expect(loginThemeColors.color).toBe(loginThemeColors.expectedColor);
  expect(
    await page.evaluate(() => navigator.serviceWorker.getRegistrations()),
  ).toEqual([]);

  await page.getByLabel("Username").fill("owner");
  await page.getByLabel("Password").fill(password);
  await signInButton.click();
  await expect(
    page.getByRole("heading", { name: "Your vaults" }),
  ).toBeVisible();

  const createVaultAction = page.getByRole("button", {
    name: "Create New Vault",
  });
  const createActionColors = await createVaultAction
    .locator(".server-action-description")
    .evaluate((description) => ({
      button: getComputedStyle(description.closest("button")!).color,
      description: getComputedStyle(description).color,
    }));
  expect(createActionColors.description).toBe(createActionColors.button);
  await createVaultAction.click();
  const createDialog = page.getByRole("dialog", { name: "New Server Vault" });
  await createDialog.getByLabel("Name").fill("Online Vault");
  await createDialog.getByRole("button", { name: "Create vault" }).click();
  await expect(
    page.getByRole("button", { name: /Current workspace:/ }),
  ).toContainText("Online Vault");
  await expect(page.getByText("Server DB", { exact: true })).toBeVisible();

  await page.evaluate(async () => {
    const app = (
      window as typeof window & {
        app: {
          vault: { create(path: string, data: string): Promise<unknown> };
          openFile(file: unknown): Promise<void>;
        };
      }
    ).app;
    const file = await app.vault.create(
      "Shared.md",
      "# Shared note\n\nWaiting for a browser edit.\n",
    );
    await app.openFile(file);
  });
  const editor = page.locator(".cm-content[contenteditable=true]").last();
  await expect(editor).toBeVisible();

  const peer = await context.newPage();
  await peer.goto(baseUrl);
  await expect(
    peer.getByRole("heading", { name: "Your vaults" }),
  ).toBeVisible();
  await openManagedVault(peer, "Online Vault");
  await peer.getByRole("tab", { name: "Search" }).click();
  await peer
    .getByRole("searchbox", { name: "Search vault" })
    .fill("synchronized browser phrase");
  await expect(peer.getByRole("treeitem", { name: /Shared\.md/ })).toHaveCount(
    0,
  );

  await editor.fill("# Shared note\n\nA synchronized browser phrase.\n");
  await expect
    .poll(() =>
      page.evaluate(async () => {
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
        const file = app.vault.getFileByPath("Shared.md");
        return file ? app.vault.read(file) : "";
      }),
    )
    .toContain("synchronized browser phrase");
  await expect(
    peer.getByRole("treeitem", { name: /Shared\.md, 1 matches/ }),
  ).toBeVisible();
  await peer.close();

  await page.evaluate(() => {
    const testWindow = window as typeof window & {
      __lapisManagedVaultApp?: unknown;
      app?: unknown;
    };
    testWindow.__lapisManagedVaultApp = testWindow.app;
  });
  await manageVaults(page);
  await expect(page.getByRole("button", { name: "View all" })).toHaveCount(0);
  await page.getByRole("button", { name: "Return to Online Vault" }).click();
  await expect(
    page.getByRole("button", { name: /Current workspace:/ }),
  ).toContainText("Online Vault");
  expect(
    await page.evaluate(() => {
      const testWindow = window as typeof window & {
        __lapisManagedVaultApp?: unknown;
        app?: unknown;
      };
      return testWindow.__lapisManagedVaultApp === testWindow.app;
    }),
  ).toBe(true);
  await manageVaults(page);
  const online = vaultRow(page, "Online Vault");
  await online
    .getByRole("button", { name: "Open actions for Online Vault" })
    .click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("menuitem", { name: "Export ZIP" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.zip$/u);

  await online
    .getByRole("button", { name: "Open actions for Online Vault" })
    .click();
  await page.getByRole("menuitem", { name: "Archive" }).click();
  await expect(vaultRow(page, "Online Vault")).toContainText("archived");
  await vaultRow(page, "Online Vault")
    .getByRole("button", { name: "Open actions for Online Vault" })
    .click();
  await page.getByRole("menuitem", { name: "Restore" }).click();
  await expect(vaultRow(page, "Online Vault")).not.toContainText("archived");

  await page.getByLabel("Import ZIP").setInputFiles(importArchive);
  await expect(vaultRow(page, "Imported Vault")).toBeVisible();

  await page.getByRole("button", { name: "Import Folder" }).click();
  const importDialog = page.getByRole("dialog", {
    name: "Import Server Vault",
  });
  await expect(importDialog.getByLabel("Name")).toHaveValue("Browser Folder");
  await importDialog.getByLabel("Name").fill("Browser Folder Vault");
  await importDialog.getByRole("button", { name: "Import vault" }).click();
  await expect(vaultRow(page, "Browser Folder Vault")).toBeVisible();

  await page.getByRole("button", { name: "View all" }).click();
  const managedVaultDialog = page.getByRole("dialog", {
    name: "Managed Vaults",
  });
  await managedVaultDialog
    .getByRole("combobox", { name: "Search managed vaults" })
    .fill("Browser Folder");
  await expect(managedVaultDialog.locator('[data-ui-part="item"]')).toHaveCount(
    1,
  );
  await managedVaultDialog
    .locator('[data-ui-part="item"]')
    .filter({ hasText: "Browser Folder Vault" })
    .click();
  await expect(
    page.getByRole("button", { name: /Current workspace:/ }),
  ).toContainText("Browser Folder Vault");
  await manageVaults(page);

  await stopServer(true);
  await startServer();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Your vaults" }),
  ).toBeVisible();
  await openManagedVault(page, "Online Vault");
  await expect
    .poll(() =>
      page.evaluate(async () => {
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
        const file = app.vault.getFileByPath("Shared.md");
        return file ? app.vault.read(file) : "";
      }),
    )
    .toContain("synchronized browser phrase");

  await manageVaults(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});
