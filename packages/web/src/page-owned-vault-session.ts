import type { VaultSession } from "@lapis-notes/api";

/**
 * Release the browser database owner as soon as a real page exit starts.
 * Graceful workspace teardown may continue afterwards through the same close
 * flight, but it must not strand the OPFS owner behind plugin preflights.
 */
export function ownPageVaultSession(
  session: VaultSession,
  page: EventTarget = window,
): { session: VaultSession; release(): void } {
  let closeFlight: Promise<void> | undefined;
  const close = () => (closeFlight ??= session.close());
  const ownedSession: VaultSession = { ...session, close };
  const onPageHide = (event: Event) => {
    if ((event as PageTransitionEvent).persisted) return;
    void close().catch(() => undefined);
  };
  page.addEventListener("pagehide", onPageHide);
  return {
    session: ownedSession,
    release() {
      page.removeEventListener("pagehide", onPageHide);
    },
  };
}
