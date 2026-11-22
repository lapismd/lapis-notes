import { describe, expect, it, vi } from "vitest";
import { ownPageVaultSession } from "./page-owned-vault-session";

describe("page-owned web vault session", () => {
  it("finishes database close before an interceptable reload commits", async () => {
    const page = new EventTarget();
    const navigation = new EventTarget();
    let finishClose: (() => void) | undefined;
    const close = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishClose = resolve;
        }),
    );
    const owned = ownPageVaultSession({ close } as never, page, navigation);
    let handler: (() => Promise<void>) | undefined;
    const navigate = new Event("navigate");
    Object.assign(navigate, {
      canIntercept: true,
      destination: { sameDocument: false },
      navigationType: "reload",
      intercept: (options: { handler(): Promise<void> }) => {
        handler = options.handler;
      },
    });

    navigation.dispatchEvent(navigate);
    const intercepted = handler?.();
    expect(close).toHaveBeenCalledOnce();
    let settled = false;
    void intercepted?.then(() => (settled = true));
    await Promise.resolve();
    expect(settled).toBe(false);
    finishClose?.();
    await intercepted;
    expect(settled).toBe(true);
    owned.release();
  });

  it("starts one database close immediately when the page is hidden", async () => {
    const page = new EventTarget();
    const close = vi.fn(async () => {});
    const owned = ownPageVaultSession({ close } as never, page);

    page.dispatchEvent(new Event("pagehide"));
    expect(close).toHaveBeenCalledOnce();

    await owned.session.close();
    expect(close).toHaveBeenCalledOnce();
    owned.release();
  });

  it("removes page ownership when a session is retired normally", () => {
    const page = new EventTarget();
    const close = vi.fn(async () => {});
    const owned = ownPageVaultSession({ close } as never, page);

    owned.release();
    page.dispatchEvent(new Event("pagehide"));
    expect(close).not.toHaveBeenCalled();
  });

  it("keeps the database owner while a page is preserved in back-forward cache", () => {
    const page = new EventTarget();
    const navigation = new EventTarget();
    const close = vi.fn(async () => {});
    const owned = ownPageVaultSession({ close } as never, page, navigation);
    const navigate = new Event("navigate");
    Object.assign(navigate, {
      canIntercept: true,
      destination: { sameDocument: false },
      navigationType: "traverse",
      intercept: vi.fn(),
    });
    navigation.dispatchEvent(navigate);
    const pageHide = new Event("pagehide");
    Object.defineProperty(pageHide, "persisted", { value: true });

    page.dispatchEvent(pageHide);
    expect(close).not.toHaveBeenCalled();
    owned.release();
  });
});
