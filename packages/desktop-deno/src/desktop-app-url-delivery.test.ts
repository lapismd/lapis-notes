import { describe, expect, it, vi } from "vitest";
import { DesktopAppUrlDelivery } from "./desktop-app-url-delivery";

const first = "lapis://plugins?id=spellcheck&version=0.1.1";
const second = "lapis-notes://plugins?id=lapis-graph&version=0.1.0";

describe("native App URL delivery", () => {
  it("delivers a retained batch when replacement subscribes as the read settles", async () => {
    let finish!: (urls: unknown) => void;
    const take = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      )
      .mockResolvedValue([]);
    const acknowledged = vi.fn();
    const delivery = new DesktopAppUrlDelivery(take, acknowledged);
    const unsubscribe = delivery.subscribe(vi.fn());
    const pending = delivery.flush();
    unsubscribe();
    finish([first]);
    await Promise.resolve();
    const replacement = vi.fn();
    delivery.subscribe(replacement);
    await pending;
    await vi.waitFor(() =>
      expect(replacement).toHaveBeenCalledExactlyOnceWith(first),
    );
    expect(acknowledged).toHaveBeenCalledExactlyOnceWith(first);
  });
  it("leaves early URLs in the native queue until the vault host subscribes", async () => {
    const urls = [first];
    const take = vi.fn(async () => urls.splice(0));
    const acknowledged = vi.fn();
    const delivery = new DesktopAppUrlDelivery(take, acknowledged);
    await delivery.flush();
    expect(take).not.toHaveBeenCalled();
    expect(acknowledged).not.toHaveBeenCalled();
    const receive = vi.fn();
    delivery.subscribe(receive);
    await delivery.flush();
    expect(receive).toHaveBeenCalledExactlyOnceWith(first);
    expect(acknowledged).toHaveBeenCalledExactlyOnceWith(first);
  });

  it("retains a fetched batch when the subscriber leaves during the native request", async () => {
    let finish!: (urls: unknown) => void;
    const take = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      )
      .mockResolvedValue([]);
    const acknowledged = vi.fn();
    const delivery = new DesktopAppUrlDelivery(take, acknowledged);
    const initial = vi.fn();
    const unsubscribe = delivery.subscribe(initial);
    const pending = delivery.flush();
    unsubscribe();
    finish([first, second]);
    await pending;
    expect(initial).not.toHaveBeenCalled();
    expect(acknowledged).not.toHaveBeenCalled();
    const replacement = vi.fn();
    delivery.subscribe(replacement);
    await delivery.flush();
    expect(replacement.mock.calls).toEqual([[first], [second]]);
    expect(acknowledged.mock.calls).toEqual([[first], [second]]);
  });

  it("serializes requests and delivers a later notification exactly once", async () => {
    let finish!: (urls: unknown) => void;
    const take = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      )
      .mockResolvedValueOnce([second])
      .mockResolvedValue([]);
    const events: string[] = [];
    const delivery = new DesktopAppUrlDelivery(take, (url) =>
      events.push(`ack:${url}`),
    );
    delivery.subscribe((url) => events.push(`receive:${url}`));
    const pending = delivery.flush();
    const later = delivery.flush();
    expect(take).toHaveBeenCalledTimes(1);
    finish([first, null, 42]);
    await Promise.all([pending, later]);
    expect(events).toEqual([
      `receive:${first}`,
      `ack:${first}`,
      `receive:${second}`,
      `ack:${second}`,
    ]);
  });

  it("retains the remaining batch when delivery unsubscribes its last listener", async () => {
    const take = vi
      .fn()
      .mockResolvedValueOnce([first, second])
      .mockResolvedValue([]);
    const acknowledged = vi.fn();
    const delivery = new DesktopAppUrlDelivery(take, acknowledged);
    const initial = vi.fn(() => unsubscribe());
    const unsubscribe = delivery.subscribe(initial);
    await delivery.flush();
    expect(initial.mock.calls).toEqual([[first]]);
    const replacement = vi.fn();
    delivery.subscribe(replacement);
    await delivery.flush();
    expect(replacement.mock.calls).toEqual([[second]]);
    expect(acknowledged.mock.calls).toEqual([[first], [second]]);
  });

  it("does not deliver or acknowledge a late native response after disposal", async () => {
    let finish!: (urls: unknown) => void;
    const take = vi.fn(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const acknowledged = vi.fn();
    const receive = vi.fn();
    const delivery = new DesktopAppUrlDelivery(take, acknowledged);
    delivery.subscribe(receive);
    const pending = delivery.flush();
    delivery.dispose();
    finish([first]);
    await pending;
    delivery.subscribe(receive);
    await delivery.flush();
    expect(receive).not.toHaveBeenCalled();
    expect(acknowledged).not.toHaveBeenCalled();
    expect(take).toHaveBeenCalledTimes(1);
  });

  it("retries a failed native read without acknowledging an undelivered URL", async () => {
    const take = vi
      .fn()
      .mockRejectedValueOnce(new Error("Native unavailable"))
      .mockResolvedValue([first]);
    const receive = vi.fn();
    const acknowledged = vi.fn();
    const delivery = new DesktopAppUrlDelivery(take, acknowledged);
    delivery.subscribe(receive);
    await expect(delivery.flush()).rejects.toThrow("Native unavailable");
    expect(acknowledged).not.toHaveBeenCalled();
    await delivery.flush();
    expect(receive).toHaveBeenCalledExactlyOnceWith(first);
    expect(acknowledged).toHaveBeenCalledExactlyOnceWith(first);
  });
});
