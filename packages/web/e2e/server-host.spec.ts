import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test, type Page } from "@playwright/test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const image = process.env.LAPIS_SERVER_E2E_IMAGE ?? "lapis-server:e2e";
const suffix = `${process.pid}-${Date.now().toString(36)}`;
const containerName = `lapis-server-e2e-${suffix}`;
const volumeName = `lapis-server-e2e-data-${suffix}`;

let baseUrl = "";
let password = "";
let passwordFile = "";
let importArchive = "";
let temporaryRoot = "";
let containerCreated = false;
let volumeCreated = false;

function docker(args: string[]): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    execFile(
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
      if (response.ok) return;
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
  await docker([
    "run",
    "--detach",
    "--name",
    containerName,
    "--publish",
    `127.0.0.1:${new URL(baseUrl).port}:8787`,
    "--mount",
    `type=volume,source=${volumeName},target=/data`,
    "--mount",
    `type=bind,source=${passwordFile},target=/run/secrets/lapis_bootstrap_password,readonly`,
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
  await vaultRow(page, name).getByRole("button", { name: "Open" }).click();
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
  passwordFile = join(temporaryRoot, "bootstrap-password");
  importArchive = join(temporaryRoot, "Imported Vault.zip");
  await writeFile(passwordFile, `${password}\n`, { mode: 0o600 });
  await writeFile(
    importArchive,
    storedZip("Imported.md", "# Imported through the server\n"),
  );
  const port = await unusedPort();
  baseUrl = `http://localhost:${port}`;
  await docker(["volume", "create", volumeName]);
  volumeCreated = true;
  await startServer();
});

test.afterAll(async () => {
  await stopServer(false).catch(() => undefined);
  if (containerCreated) {
    await docker(["rm", "--force", containerName]).catch(() => undefined);
    containerCreated = false;
  }
  if (volumeCreated) {
    await docker(["volume", "rm", volumeName]).catch(() => undefined);
    volumeCreated = false;
  }
  if (temporaryRoot) await rm(temporaryRoot, { recursive: true, force: true });
});

test("server-hosted vault survives editing, sharing events, and restart", async ({
  context,
  page,
}) => {
  test.setTimeout(180_000);
  await page.goto(baseUrl);
  await expect(page.locator("html")).toHaveAttribute(
    "data-runtime",
    "deno-server",
  );
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  expect(
    await page.evaluate(() => navigator.serviceWorker.getRegistrations()),
  ).toEqual([]);

  await page.getByLabel("Username").fill("owner");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(
    page.getByRole("heading", { name: "Your vaults" }),
  ).toBeVisible();

  await page.getByLabel("New vault").fill("Online Vault");
  await page.getByRole("button", { name: "Create" }).click();
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

  await manageVaults(page);
  const online = vaultRow(page, "Online Vault");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    online.getByRole("link", { name: "Export" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.zip$/u);

  await online.getByRole("button", { name: "Archive" }).click();
  await expect(vaultRow(page, "Online Vault")).toContainText("archived");
  await vaultRow(page, "Online Vault")
    .getByRole("button", { name: "Restore" })
    .click();
  await expect(vaultRow(page, "Online Vault")).not.toContainText("archived");

  await page.getByLabel("Import ZIP").setInputFiles(importArchive);
  await expect(vaultRow(page, "Imported Vault")).toBeVisible();

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
