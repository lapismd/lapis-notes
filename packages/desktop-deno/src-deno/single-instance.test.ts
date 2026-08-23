import { describe, expect, it, vi } from "vitest";

import {
  collectAppUrls,
  DenoActivationQueue,
  normalizeAppUrl,
  parseActivationMessage,
} from "./single-instance";

describe("Deno single-instance activation", () => {
  it("accepts only complete Lapis application URL arguments", () => {
    expect(
      collectAppUrls([
        "--flag",
        "lapis://open?vault=one",
        "https://example.com",
        "lapis-notes://command/run?id=two",
      ]),
    ).toEqual(["lapis://open?vault=one", "lapis-notes://command/run?id=two"]);
    expect(normalizeAppUrl("javascript:alert(1)")).toBeNull();
  });

  it("rejects malformed and incorrectly authenticated handoffs", () => {
    expect(
      parseActivationMessage(
        JSON.stringify({ token: "wrong", urls: ["lapis://open"] }),
        "expected",
      ),
    ).toBeNull();
    expect(parseActivationMessage("not-json", "expected")).toBeNull();
    expect(
      parseActivationMessage(
        JSON.stringify({ token: "expected", urls: ["file:///tmp/no"] }),
        "expected",
      ),
    ).toEqual([]);
  });

  it("queues startup and later URLs until the renderer takes them", () => {
    const queue = new DenoActivationQueue(["lapis://startup"]);
    const listener = vi.fn();
    queue.onLaterLaunch(listener);
    queue.acceptLaterLaunch(["lapis-notes://later", "https://example.com"]);
    expect(listener).toHaveBeenCalledWith(["lapis-notes://later"]);
    expect(queue.takePending()).toEqual([
      "lapis://startup",
      "lapis-notes://later",
    ]);
    expect(queue.takePending()).toEqual([]);
  });
});
