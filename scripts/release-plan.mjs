import { execFileSync } from "node:child_process";
import semver from "semver";
import {
  assertPublicPackageOrder,
  assertValidPublicVersion,
  DEFAULT_REPO_ROOT,
  normalizeRegistry,
  npmRegistryPackageName,
  readPublicPackages,
  REPOSITORY,
} from "./public-packages.mjs";

function parseArgs(argv) {
  const options = {
    registry: process.env.npm_config_registry ?? "https://registry.npmjs.org",
    json: false,
    repoRoot: DEFAULT_REPO_ROOT,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--") {
      continue;
    }
    if (value === "--json") {
      options.json = true;
      continue;
    }
    if (value === "--registry") {
      options.registry = argv[++index];
      continue;
    }
    if (value === "--repo-root") {
      options.repoRoot = argv[++index];
      continue;
    }
    throw new Error(`Unknown argument: ${value}`);
  }

  return options;
}

function tryExec(command, args, cwd) {
  try {
    return execFileSync(command, args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

export function resolveReleaseCommit(repoRoot = DEFAULT_REPO_ROOT) {
  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA;
  }
  return (
    tryExec("jj", ["log", "-r", "@", "--no-graph", "-T", "commit_id"], repoRoot) ||
    tryExec("git", ["rev-parse", "HEAD"], repoRoot) ||
    "unknown"
  );
}

export async function fetchPackageVersionState(
  name,
  version,
  { registry = "https://registry.npmjs.org", fetchImpl = globalThis.fetch } = {},
) {
  const normalizedRegistry = normalizeRegistry(registry);
  const packageName = npmRegistryPackageName(name);
  const versionResponse = await fetchImpl(
    `${normalizedRegistry}/${packageName}/${version}`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (versionResponse.status === 200) {
    const metadata = await versionResponse.json();
    return {
      name,
      version,
      published: true,
      registryEmpty: false,
      integrity: metadata.dist?.integrity ?? null,
      tarball: metadata.dist?.tarball ?? null,
    };
  }

  if (versionResponse.status !== 404) {
    throw new Error(
      `Registry lookup for ${name}@${version} returned HTTP ${versionResponse.status}`,
    );
  }

  const packageResponse = await fetchImpl(`${normalizedRegistry}/${packageName}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (packageResponse.status === 404) {
    return {
      name,
      version,
      published: false,
      registryEmpty: true,
      integrity: null,
      tarball: null,
    };
  }

  if (packageResponse.status !== 200) {
    throw new Error(
      `Registry lookup for ${name} returned HTTP ${packageResponse.status}`,
    );
  }

  const metadata = await packageResponse.json();
  return {
    name,
    version,
    published: false,
    registryEmpty: false,
    latest: metadata["dist-tags"]?.latest ?? null,
    integrity: null,
    tarball: null,
  };
}

export function planReleaseCandidates(records, states, options = {}) {
  assertPublicPackageOrder(records);

  const stateByName = new Map(states.map((state) => [state.name, state]));
  const selected = [];
  const selectedNames = new Set();
  const published = [];
  const skipped = [];

  for (const record of records) {
    assertValidPublicVersion(record.name, record.version);
    const state = stateByName.get(record.name);
    if (!state) {
      throw new Error(`Missing registry state for ${record.name}`);
    }

    if (state.published) {
      published.push({
        name: record.name,
        version: record.version,
        integrity: state.integrity,
        tarball: state.tarball,
      });
      continue;
    }

    for (const dependencyName of record.internalDependencies) {
      const dependency = records.find((item) => item.name === dependencyName);
      const dependencyState = stateByName.get(dependencyName);
      if (!dependency || !dependencyState) {
        throw new Error(`${record.name} references unknown dependency ${dependencyName}`);
      }
      if (
        !dependencyState.published &&
        !selectedNames.has(dependencyName)
      ) {
        throw new Error(
          `${record.name} cannot be selected before ${dependencyName}@${dependency.version}`,
        );
      }
    }

    const candidate = {
      name: record.name,
      directory: record.directory,
      version: record.version,
      registryEmpty: Boolean(state.registryEmpty),
      dependencies: [...record.internalDependencies],
      tag: options.tag ?? "next",
    };
    selected.push(candidate);
    selectedNames.add(record.name);
  }

  return {
    published,
    selected,
    skipped,
    bootstrapRequired: selected.some((candidate) => candidate.registryEmpty),
    hasWork: selected.length > 0,
  };
}

export async function createReleasePlan({
  repoRoot = DEFAULT_REPO_ROOT,
  registry = "https://registry.npmjs.org",
  fetchImpl = globalThis.fetch,
} = {}) {
  const records = readPublicPackages(repoRoot);
  const states = [];
  for (const record of records) {
    states.push(
      await fetchPackageVersionState(record.name, record.version, {
        registry,
        fetchImpl,
      }),
    );
  }

  const plan = planReleaseCandidates(records, states);
  return {
    schemaVersion: 1,
    repository: REPOSITORY,
    commit: resolveReleaseCommit(repoRoot),
    registry: normalizeRegistry(registry),
    generatedAt: new Date().toISOString(),
    packages: records.map((record) => {
      const state = states.find((item) => item.name === record.name);
      return {
        name: record.name,
        directory: record.directory,
        version: record.version,
        private: Boolean(record.manifest.private),
        published: Boolean(state?.published),
        registryEmpty: Boolean(state?.registryEmpty),
        dependencies: [...record.internalDependencies],
      };
    }),
    ...plan,
  };
}

export function renderReleasePlan(plan) {
  const lines = [
    `Repository: ${plan.repository}`,
    `Commit: ${plan.commit}`,
    `Registry: ${plan.registry}`,
    "",
    "Public packages:",
  ];

  for (const record of plan.packages) {
    const status = record.published
      ? "published"
      : record.registryEmpty
        ? "unpublished; package name not registered"
        : "unpublished";
    lines.push(`- ${record.name}@${record.version}: ${status}`);
  }

  lines.push("");

  if (plan.selected.length === 0) {
    lines.push("No unpublished package versions selected.");
  } else {
    lines.push("Selected for release artifact, in dependency order:");
    for (const candidate of plan.selected) {
      lines.push(`- ${candidate.name}@${candidate.version}`);
    }
  }

  if (plan.bootstrapRequired) {
    lines.push(
      "",
      "Initial packages require manual npm publication from the verified release artifact.",
    );
  }

  if (
    plan.packages.some(
      (record) => !record.published && !semver.eq(record.version, "0.1.0"),
    )
  ) {
    lines.push(
      "",
      "Warning: at least one unpublished package is not on the 0.1.0 bootstrap version.",
    );
  }

  return lines.join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs(process.argv.slice(2));
  const plan = await createReleasePlan(options);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
  } else {
    process.stdout.write(`${renderReleasePlan(plan)}\n`);
  }
}
