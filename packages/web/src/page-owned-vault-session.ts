import type { VaultSession } from "@lapis-notes/api";

/**
 * Release the browser database owner as soon as a real page exit starts.
 * Graceful workspace teardown may continue afterwards through the same close
 * flight, but it must not strand the OPFS owner behind plugin preflights.
 */
export function ownPageVaultSession(
  session: VaultSession,
  page: EventTarget = window,
  navigation: EventTarget | undefined = (
    globalThis as typeof globalThis & { navigation?: EventTarget }
  ).navigation,
): { session: VaultSession; release(): void } {
  let closeFlight: Promise<void> | undefined;
  const close = () => (closeFlight ??= session.close());
  const ownedSession: VaultSession = { ...session, close };
  const onNavigate = (event: Event) => {
    const navigationEvent = event as Event & {
      canIntercept: boolean;
      destination?: { sameDocument?: boolean };
      navigationType?: "push" | "reload" | "replace" | "traverse";
      intercept(options: { handler(): Promise<void> }): void;
    };
    if (
      !navigationEvent.canIntercept ||
      navigationEvent.navigationType === "traverse" ||
      navigationEvent.destination?.sameDocument
    )
      return;
    navigationEvent.intercept({
      handler: async () => {
        await close().catch(() => undefined);
      },
    });
  };
  const onPageHide = (event: Event) => {
    if ((event as PageTransitionEvent).persisted) return;
    void close().catch(() => undefined);
  };
  navigation?.addEventListener("navigate", onNavigate);
  page.addEventListener("pagehide", onPageHide);
  return {
    session: ownedSession,
    release() {
      navigation?.removeEventListener("navigate", onNavigate);
      page.removeEventListener("pagehide", onPageHide);
    },
  };
}
