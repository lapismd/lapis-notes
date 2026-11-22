import { describe, expect, it, vi } from "vitest";
import { ownPageVaultSession } from "./page-owned-vault-session";

describe("page-owned web vault session", () => {
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
    const close = vi.fn(async () => {});
    const owned = ownPageVaultSession({ close } as never, page);
    const pageHide = new Event("pagehide");
    Object.defineProperty(pageHide, "persisted", { value: true });

    page.dispatchEvent(pageHide);
    expect(close).not.toHaveBeenCalled();
    owned.release();
  });
});
