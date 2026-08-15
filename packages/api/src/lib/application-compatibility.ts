import type { App } from "./context.svelte";

declare global {
  /**
   * Legacy application alias retained for Obsidian-compatible plugins.
   *
   * First-party code should receive an {@link App} explicitly or resolve it
   * from Svelte context instead of depending on this process-wide value.
   *
   * @public
   */
  var app: App;
}

type CompatibilityLease = {
  application: App;
  token: symbol;
};

const leases: CompatibilityLease[] = [];
let previousApplication: App | undefined;
let hadPreviousApplication = false;

/** Return the current legacy application alias, when one is installed. */
export function getApplicationCompatibility(): App | undefined {
  return (globalThis as typeof globalThis & { app?: App }).app;
}

/**
 * Resolve an application supplied by its owner, falling back to the legacy
 * global alias only for compatibility.
 *
 * @public
 */
export function resolveApplication(application?: App): App {
  const resolved = application ?? getApplicationCompatibility();
  if (!resolved) {
    throw new Error(
      "No Lapis application is available. Pass an App explicitly, call provideApplicationState() in a component owner, or install the legacy compatibility alias.",
    );
  }
  return resolved;
}

/**
 * Install a managed lease for the legacy `globalThis.app` alias.
 *
 * The newest live lease is exposed. Disposing leases out of order is safe,
 * and disposing the final lease restores the value that existed before the
 * first lease was installed.
 *
 * @public
 */
export function installApplicationCompatibility(
  application: App,
): () => void {
  if (leases.length === 0) {
    hadPreviousApplication = Object.prototype.hasOwnProperty.call(
      globalThis,
      "app",
    );
    previousApplication = getApplicationCompatibility();
  }

  const lease = { application, token: Symbol("application-compatibility") };
  leases.push(lease);
  globalThis.app = application;

  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;

    const index = leases.findIndex((candidate) => candidate.token === lease.token);
    if (index === -1) return;
    const wasActive = index === leases.length - 1;
    leases.splice(index, 1);
    if (!wasActive) return;

    const next = leases.at(-1);
    if (next) {
      globalThis.app = next.application;
      return;
    }

    if (hadPreviousApplication) {
      globalThis.app = previousApplication as App;
    } else {
      delete (globalThis as unknown as { app?: App }).app;
    }
    previousApplication = undefined;
    hadPreviousApplication = false;
  };
}
