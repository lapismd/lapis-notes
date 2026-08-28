const { readFileSync } = require("node:fs");
const path = require("node:path");

const dependencyFields = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

function loadTarballOverrides(environment = process.env) {
  const manifestPath = environment.LAPIS_PLUGIN_TARBALL_MANIFEST;
  if (!manifestPath) return new Map();

  const absoluteManifestPath = path.resolve(manifestPath);
  const pluginRepositoryRoot = path.resolve(
    path.dirname(absoluteManifestPath),
    "../..",
  );
  const entries = JSON.parse(readFileSync(absoluteManifestPath, "utf8"));
  return new Map(
    entries.map((entry) => [
      entry.packageName,
      `file:${path.resolve(pluginRepositoryRoot, entry.tarball)}`,
    ]),
  );
}

function createHooks(environment = process.env) {
  const overrides = loadTarballOverrides(environment);
  return {
    readPackage(packageManifest) {
      for (const field of dependencyFields) {
        const dependencies = packageManifest[field];
        if (!dependencies) continue;
        const isPeerDependency = field === "peerDependencies";
        for (const packageName of Object.keys(dependencies)) {
          const override = overrides.get(packageName);
          if (override && !isPeerDependency) dependencies[packageName] = override;
        }
      }
      return packageManifest;
    },
  };
}

module.exports = {
  createHooks,
  hooks: createHooks(),
  loadTarballOverrides,
};
