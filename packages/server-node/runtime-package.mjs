import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse, stringify } from "yaml";

export const runtimeExternalDependencies = [
  "@tursodatabase/database",
  "@huggingface/transformers",
];

export function createRuntimePackage(manifest, lock, packageManager) {
  if (!/^pnpm@\d+\.\d+\.\d+(?:\+sha512\..+)?$/.test(packageManager ?? "")) {
    throw new Error(
      "Runtime staging requires the exact pinned pnpm package manager",
    );
  }
  const dependencies = {};
  const frozen = {};
  for (const name of runtimeExternalDependencies) {
    const range = manifest.dependencies?.[name];
    if (!range || /^(?:workspace|link|file):/.test(range)) {
      throw new Error(`${name} must be a declared registry dependency`);
    }
    const entry =
      lock.importers?.["packages/server-node"]?.dependencies?.[name];
    if (!entry || entry.specifier !== range) {
      throw new Error(`${name} is missing its matching frozen resolution`);
    }
    if (/^(?:link|file|workspace):/.test(entry.version)) {
      throw new Error(`${name} must have a registry resolution`);
    }
    dependencies[name] = range;
    frozen[name] = entry;
  }
  return {
    manifest: {
      name: manifest.name,
      version: manifest.version,
      private: true,
      packageManager,
      type: "module",
      dependencies,
    },
    lock: { ...lock, importers: { ".": { dependencies: frozen } } },
    workspace: {
      packages: [],
      overrides: lock.overrides ?? {},
      patchedDependencies: Object.fromEntries(
        Object.entries(lock.patchedDependencies ?? {}).map(([name, value]) => [
          name,
          value.path,
        ]),
      ),
    },
  };
}

async function prepareRuntimePackage(destination) {
  const packageRoot = dirname(fileURLToPath(import.meta.url));
  const root = resolve(packageRoot, "../..");
  const manifest = JSON.parse(
    await readFile(join(packageRoot, "package.json"), "utf8"),
  );
  const lock = parse(await readFile(join(root, "pnpm-lock.yaml"), "utf8"));
  const rootManifest = JSON.parse(
    await readFile(join(root, "package.json"), "utf8"),
  );
  const output = createRuntimePackage(
    manifest,
    lock,
    rootManifest.packageManager,
  );
  await mkdir(destination, { recursive: true });
  await cp(join(packageRoot, "dist"), join(destination, "dist"), {
    recursive: true,
  });
  await writeFile(
    join(destination, "package.json"),
    JSON.stringify(output.manifest, null, 2) + "\n",
  );
  await writeFile(join(destination, "pnpm-lock.yaml"), stringify(output.lock));
  await writeFile(
    join(destination, "pnpm-workspace.yaml"),
    stringify(output.workspace),
  );
  for (const path of Object.values(output.workspace.patchedDependencies)) {
    if (!/^patches\/[^/]+\.patch$/.test(path))
      throw new Error(`Unsupported patch path: ${path}`);
    await mkdir(join(destination, "patches"), { recursive: true });
    await cp(join(root, path), join(destination, path));
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  if (!process.argv[2])
    throw new Error("Usage: node runtime-package.mjs <new staging directory>");
  await prepareRuntimePackage(resolve(process.argv[2]));
}
