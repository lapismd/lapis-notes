import path from "node:path";
import { pathToFileURL } from "node:url";

export const NOTES_READINESS_SOURCE =
  "69a81e05ca32dc5b7024ef2cd0711860b1813926";
export const REGISTRY_READINESS_BUDGET_MS = 110_000;
export const REGISTRY_INSTALL_RETRY_DELAYS_MS = [
  5000, 10000, 20000, 30000, 30000,
];

export async function loadNotesReadiness(
  modulePath = process.env.LAPIS_REGISTRY_READINESS_MODULE,
) {
  if (
    !modulePath ||
    !path.isAbsolute(modulePath) ||
    path.basename(modulePath) !== "registry-readiness.mjs"
  )
    throw Error(
      "Notes verification requires the source-pinned shared registry readiness setup",
    );
  const api = await import(pathToFileURL(modulePath).href);
  if (
    typeof api.installPublishedConsumer !== "function" ||
    typeof api.registryInstaller !== "function"
  )
    throw Error("Shared registry readiness contract is unavailable");
  return api;
}

/** Notes owns its budget/build policy; the shared source owns all retry/process logic. */
export async function installPublishedConsumer(
  {
    consumerDir,
    entries,
    registry,
    packageManager,
    fetchImpl,
    sleep,
    now,
    report,
    budgetMs = REGISTRY_READINESS_BUDGET_MS,
  },
  readiness,
) {
  const selected = /^pnpm@(10\.\d+\.\d+)(?:\+sha\d+\.[a-f0-9]+)?$/.exec(
    packageManager ?? "",
  );
  if (!selected)
    throw Error(
      "Notes readiness requires its exact supported pnpm packageManager pin",
    );
  if (
    !Number.isSafeInteger(budgetMs) ||
    budgetMs < 1 ||
    budgetMs > REGISTRY_READINESS_BUDGET_MS
  )
    throw Error(
      "Notes readiness budget must be positive and no greater than110 seconds",
    );
  readiness ??= await loadNotesReadiness();
  await readiness.installPublishedConsumer({
    cwd: consumerDir,
    entries: entries.map(({ name, version, integrity }) => ({
      name,
      version,
      integrity,
    })),
    registry,
    policy: {
      budgetMs,
      delaysMs: REGISTRY_INSTALL_RETRY_DELAYS_MS.filter(
        (delay) => delay < budgetMs,
      ),
    },
    installer: readiness.registryInstaller("pnpm-default-peers", selected[1]),
    fetcher: fetchImpl,
    wait: sleep,
    now,
    report,
  });
}
