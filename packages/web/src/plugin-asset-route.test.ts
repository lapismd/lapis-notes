import { describe, expect, it } from "vitest";
import { matchesWebPluginAssetRequest } from "./plugin-asset-route";

describe("generated plugin asset service-worker route", () => {
  it("matches verified asset requests after Workbox serializes the callback without its build scope", () => {
    const match = new Function(
      "self",
      `return (${matchesWebPluginAssetRequest.toString()});`,
    )({ location: { origin: "https://app.example" } });
    expect(
      match({
        url: new URL(
          "https://app.example/__lapis/plugins/vault/bases/1.0.0/hash/main.mjs",
        ),
      }),
    ).toBe(true);
    expect(
      match({
        url: new URL(
          "https://another.example/__lapis/plugins/vault/bases/1.0.0/hash/main.mjs",
        ),
      }),
    ).toBe(false);
    expect(
      match({
        url: new URL("https://app.example/__lapis/plugins-other/main.mjs"),
      }),
    ).toBe(false);
  });
});
