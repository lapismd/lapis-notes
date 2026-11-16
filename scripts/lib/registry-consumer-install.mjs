import {
  runRegistryInstall,
  assertRegistryInstallPlatform,
  registryFailure as failure,
} from "./registry-install-process.mjs";
import { mkdtempSync, rmSync } from "node:fs";
import path from "node:path";

export const REGISTRY_READINESS_BUDGET_MS = 110_000;
export const REGISTRY_INSTALL_RETRY_DELAYS_MS = [
  5_000, 10_000, 20_000, 30_000, 30_000,
];
export const INSTALL_METADATA_ACCEPT =
  "application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*";
const TRANSIENT_CODES = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_SOCKET",
]);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clock = () => performance.now();

async function metadataReady(entry, registry, fetchImpl, remaining) {
  const signal = AbortSignal.timeout(Math.max(1, Math.min(5_000, remaining())));
  let response;
  try {
    response = await fetchImpl(
      `${registry.replace(/\/$/, "")}/${entry.name.replace("/", "%2F")}`,
      {
        headers: { Accept: INSTALL_METADATA_ACCEPT },
        cache: "no-store",
        redirect: "error",
        signal,
      },
    );
  } catch (error) {
    const retryable =
      signal.aborted || TRANSIENT_CODES.has(error.cause?.code ?? error.code);
    throw failure(
      "REGISTRY_METADATA_TRANSPORT",
      `${entry.name}@${entry.version}: ${error.message}`,
      { retryable },
    );
  }
  if ([404, 429, 500, 502, 503, 504].includes(response.status)) {
    await response.body?.cancel();
    throw failure(
      "REGISTRY_METADATA_PENDING",
      `${entry.name}@${entry.version}: HTTP ${response.status}`,
      { retryable: true },
    );
  }
  if (response.status !== 200) {
    await response.body?.cancel();
    throw failure(
      "REGISTRY_METADATA_HTTP",
      `${entry.name}@${entry.version}: HTTP ${response.status}`,
    );
  }
  let metadata;
  try {
    metadata = await response.json();
  } catch (error) {
    throw failure(
      "REGISTRY_METADATA_INVALID",
      `${entry.name}@${entry.version}: ${error.message}`,
      {
        retryable:
          signal.aborted ||
          TRANSIENT_CODES.has(error.cause?.code ?? error.code),
      },
    );
  }
  if (
    metadata?.name !== entry.name ||
    !metadata.versions ||
    typeof metadata.versions !== "object" ||
    Array.isArray(metadata.versions)
  )
    throw failure(
      "REGISTRY_METADATA_IDENTITY",
      `Invalid installation metadata for ${entry.name}@${entry.version}`,
    );
  const version = metadata.versions[entry.version];
  if (!version)
    throw failure(
      "REGISTRY_VERSION_PENDING",
      `${entry.name}@${entry.version} absent from installation metadata`,
      { retryable: true },
    );
  if (
    version.name !== entry.name ||
    version.version !== entry.version ||
    version.dist?.integrity !== entry.integrity
  )
    throw failure(
      "REGISTRY_METADATA_INTEGRITY",
      `Installation name/version/integrity mismatch for ${entry.name}@${entry.version}`,
    );
}

function candidateVersionPending(error, entries) {
  return (
    error.errors?.length > 0 &&
    error.errors.every(
      (event) =>
        event.name === "pnpm" &&
        event.code === "ERR_PNPM_NO_MATCHING_VERSION" &&
        entries.some(
          (entry) =>
            event.package?.name === entry.name &&
            event.package?.version === entry.version &&
            event.package?.bareSpecifier === entry.version,
        ),
    )
  );
}

export async function installPublishedConsumer({
  consumerDir,
  entries,
  registry,
  fetchImpl = globalThis.fetch,
  sleep = wait,
  now = clock,
  budgetMs = REGISTRY_READINESS_BUDGET_MS,
  runInstall = runRegistryInstall,
}) {
  assertRegistryInstallPlatform();
  if (
    !Number.isInteger(budgetMs) ||
    budgetMs < 1 ||
    budgetMs > REGISTRY_READINESS_BUDGET_MS
  )
    throw failure(
      "REGISTRY_BUDGET_INVALID",
      "Readiness budget must be positive and no greater than110 seconds",
    );
  const started = now(),
    deadline = started + budgetMs;
  const remaining = () => Math.max(0, Math.floor(deadline - now()));
  const attempts = REGISTRY_INSTALL_RETRY_DELAYS_MS.length + 1;
  const candidates = entries.map((entry) => `${entry.name}@${entry.version}`);
  const deadlineAt = new Date(Date.now() + budgetMs).toISOString();
  const report = (phase, attempt, extra = {}) =>
    process.stdout.write(
      `${JSON.stringify({ timestamp: new Date().toISOString(), phase, attempt, attempts, candidates, deadlineAt, elapsedMs: Math.floor(now() - started), budgetMs, ...extra })}\n`,
    );
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let phase = "metadata",
      metadataCache;
    try {
      if (!remaining())
        throw failure(
          "REGISTRY_READINESS_EXHAUSTED",
          "No readiness budget remains",
        );
      report(phase, attempt);
      // Sequential probes stop on the first failure and leave no background requests.
      for (const entry of entries) {
        if (!remaining())
          throw failure(
            "REGISTRY_READINESS_EXHAUSTED",
            "No metadata request budget remains",
          );
        await metadataReady(entry, registry, fetchImpl, remaining);
      }
      if (!remaining())
        throw failure(
          "REGISTRY_READINESS_EXHAUSTED",
          "Metadata consumed the readiness budget",
        );
      phase = "install";
      report(phase, attempt);
      metadataCache = mkdtempSync(
        path.join(consumerDir, ".registry-metadata-"),
      );
      try {
        await runInstall(consumerDir, metadataCache, remaining(), registry);
      } finally {
        rmSync(metadataCache, { recursive: true, force: true });
        metadataCache = undefined;
      }
      if (!remaining())
        throw failure(
          "REGISTRY_READINESS_EXHAUSTED",
          "Installation exceeded the readiness budget",
        );
      report("ready", attempt);
      return;
    } catch (error) {
      const delayMs = REGISTRY_INSTALL_RETRY_DELAYS_MS[attempt - 1];
      const retryable =
        error.retryable === true || candidateVersionPending(error, entries);
      if (
        !remaining() ||
        (retryable && (delayMs === undefined || remaining() <= delayMs))
      ) {
        report("exhausted", attempt, { failedPhase: phase, cause: error.code });
        throw failure(
          "REGISTRY_READINESS_EXHAUSTED",
          `${phase} for ${candidates.join(", ")} after ${attempt}/${attempts} attempts and ${Math.floor(now() - started)}ms: ${error.message}`,
          { cause: error },
        );
      }
      if (!retryable) {
        report("failed", attempt, { failedPhase: phase, cause: error.code });
        throw error;
      }
      report("pending", attempt, {
        failedPhase: phase,
        cause: error.code,
        delayMs,
      });
      await sleep(delayMs);
    } finally {
      if (metadataCache)
        rmSync(metadataCache, { recursive: true, force: true });
    }
  }
}
