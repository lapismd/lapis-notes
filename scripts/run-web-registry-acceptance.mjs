import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export async function startRegistryFixture(directory) {
  const root = path.resolve(directory);
  const metadata = JSON.parse(
    await readFile(path.join(root, "fixture.json"), "utf8"),
  );
  if (
    metadata.schemaVersion !== 1 ||
    !/^[a-f0-9]{40}$/.test(metadata.sourceCommit) ||
    metadata.pluginCount < 1
  )
    throw new Error("Invalid registry acceptance artifact metadata");
  if (
    process.env.LAPIS_PLUGIN_CANDIDATE_COMMIT &&
    metadata.sourceCommit !== process.env.LAPIS_PLUGIN_CANDIDATE_COMMIT
  )
    throw new Error(
      "Registry fixture does not match the pinned plugin candidate",
    );
  const server = createServer(async (request, response) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    try {
      const pathname = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
      const target = path.resolve(root, `.${pathname}`);
      if (!pathname.startsWith("/v2/") || !target.startsWith(root + path.sep)) {
        response.writeHead(404).end();
        return;
      }
      const bytes = await readFile(target);
      response.setHeader(
        "Content-Type",
        target.endsWith(".json")
          ? "application/json"
          : "application/octet-stream",
      );
      response.end(bytes);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const url = `http://127.0.0.1:${server.address().port}`;
  return {
    environment: {
      LAPIS_WEB_REGISTRY_ACCEPTANCE: "true",
      VITE_LAPIS_LOCAL_REGISTRY_URL: `${url}/v2/index.json`,
      VITE_LAPIS_LOCAL_REGISTRY_ARTIFACT_ORIGIN: metadata.artifactOrigin,
      VITE_LAPIS_LOCAL_REGISTRY_TRUSTED_KEYS: JSON.stringify(
        metadata.trustedKeys,
      ),
    },
    close: () =>
      new Promise((resolve, reject) => {
        server.closeAllConnections();
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

async function run(args, env) {
  const root = fileURLToPath(new URL("../", import.meta.url));
  await new Promise((resolve, reject) => {
    const child = spawn("pnpm", args, {
      cwd: root,
      env: { ...process.env, ...env },
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) =>
      code === 0
        ? resolve()
        : reject(
            new Error(
              `Web acceptance command failed (${
                signal ?? code
              }): pnpm ${args.join(" ")}`,
            ),
          ),
    );
  });
}

async function main() {
  if (!process.env.LAPIS_WEB_REGISTRY_FIXTURE)
    return run([
      "--filter",
      "@lapis-notes/web",
      "test:e2e",
      ...process.argv.slice(2),
    ]);
  const fixture = await startRegistryFixture(
    process.env.LAPIS_WEB_REGISTRY_FIXTURE,
  );
  try {
    await run(["build:web"]);
    await run(
      [
        "--filter",
        "@lapis-notes/web",
        "exec",
        "vite",
        "build",
        "--mode",
        "registry-acceptance",
        "--outDir",
        "dist-registry-acceptance",
      ],
      fixture.environment,
    );
    await run(
      ["--filter", "@lapis-notes/web", "test:e2e", ...process.argv.slice(2)],
      fixture.environment,
    );
  } finally {
    await fixture.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await main();
