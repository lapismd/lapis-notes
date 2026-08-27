export type DesktopBindingProbe = {
  invoke(command: string, payload?: Record<string, unknown>): Promise<unknown>;
};

export type WaitForDesktopBindingsOptions<T extends DesktopBindingProbe> = {
  readBindings(): T | null;
  presentAtParse?: boolean;
  timeoutMs?: number;
  probeTimeoutMs?: number;
  retryDelayMs?: number;
};

const MISSING_BINDINGS_MESSAGE =
  "Deno desktop bindings are missing. Use the deno desktop window; opening the Vite port in a browser cannot install win.bind().";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function probeWithTimeout(
  bindings: DesktopBindingProbe,
  timeoutMs: number,
): Promise<void> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      bindings.invoke("desktop_app_info_get"),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Deno desktop binding probe timed out")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}

export async function waitForDesktopBindings<T extends DesktopBindingProbe>({
  readBindings,
  presentAtParse,
  timeoutMs = 5_000,
  probeTimeoutMs = 500,
  retryDelayMs = 50,
}: WaitForDesktopBindingsOptions<T>): Promise<T> {
  // The WebView can parse the document before win.bind() finishes installing
  // its globals on a cold launch. Treat this snapshot as diagnostic context;
  // the bounded runtime probe below is the startup authority.
  void presentAtParse;

  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    const bindings = readBindings();
    if (bindings) {
      try {
        await probeWithTimeout(bindings, probeTimeoutMs);
        return bindings;
      } catch (error) {
        lastError = error;
      }
    }
    await delay(retryDelayMs);
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(MISSING_BINDINGS_MESSAGE);
}
