/* eslint-disable @typescript-eslint/no-var-requires */
const { createRequire } = require("node:module");

const electronBuilderRequire = createRequire(
  require.resolve("electron-builder/package.json"),
);

const { PM } = electronBuilderRequire(
  "app-builder-lib/out/node-module-collector/packageManager.js",
);
const index = electronBuilderRequire(
  "app-builder-lib/out/node-module-collector/index.js",
);

function shouldForceTraversalCollector() {
  const raw = process.env["LAPIS_ELECTRON_BUILDER_FORCE_TRAVERSAL_PNPM"];
  if (!raw) {
    return true;
  }

  if (/^(0|false|no|off)$/i.test(raw.trim())) {
    return false;
  }

  return /^(1|true|yes|on)$/i.test(raw.trim());
}

if (!index.__lapisTraversalCollectorPatched) {
  const TraversalNodeModulesCollector = electronBuilderRequire(
    "app-builder-lib/out/node-module-collector/traversalNodeModulesCollector.js",
  ).TraversalNodeModulesCollector;
  const nodeModulesCollector = electronBuilderRequire(
    "app-builder-lib/out/node-module-collector/nodeModulesCollector.js",
  );
  const baseLocatePackageWithVersion =
    nodeModulesCollector.NodeModulesCollector.prototype
      .locatePackageWithVersion;
  const original = index.getCollectorByPackageManager;
  const forceTraversal = shouldForceTraversalCollector();

  if (!TraversalNodeModulesCollector.prototype.__lapisRelaxedVersionFallback) {
    TraversalNodeModulesCollector.prototype.locatePackageWithVersion =
      async function locatePackageWithVersionWithFallback(depTree) {
        const resolved = await baseLocatePackageWithVersion.call(this, depTree);
        if (resolved) {
          return resolved;
        }

        // pnpm overrides can replace exact versions from package.json. Retry
        // without an exact range so manual traversal can keep walking the tree.
        return this.cache.locatePackageVersion({
          pkgName: depTree.name,
          parentDir: depTree.path,
        });
      };

    TraversalNodeModulesCollector.prototype.__lapisRelaxedVersionFallback = true;
  }

  index.getCollectorByPackageManager = (pm, rootDir, tempDirManager) => {
    if (pm === PM.PNPM && forceTraversal) {
      return new TraversalNodeModulesCollector(rootDir, tempDirManager);
    }

    return original(pm, rootDir, tempDirManager);
  };

  index.__lapisTraversalCollectorPatched = true;
}
