export const DESKTOP_CLOSE_SIGNAL_PATH = "/__lapis/desktop-close-signal";

export async function waitForDesktopCloseSignal(
  fetchSignal: typeof fetch = fetch,
): Promise<boolean> {
  const response = await fetchSignal(DESKTOP_CLOSE_SIGNAL_PATH, {
    cache: "no-store",
  });
  return response.ok && response.status !== 204;
}
