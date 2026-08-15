import { afterEach, describe, expect, it } from "vitest";
import type { App } from "../context.svelte";
import {
  getApplicationCompatibility,
  installApplicationCompatibility,
  resolveApplication,
} from "../application-compatibility";

function application(id: string): App {
  return { id } as unknown as App;
}

afterEach(() => {
  delete (globalThis as typeof globalThis & { app?: App }).app;
});

describe("application compatibility leases", () => {
  it("keeps the newest live lease active during out-of-order disposal", () => {
    const first = application("first");
    const second = application("second");
    const disposeFirst = installApplicationCompatibility(first);
    const disposeSecond = installApplicationCompatibility(second);

    expect(getApplicationCompatibility()).toBe(second);
    disposeFirst();
    expect(getApplicationCompatibility()).toBe(second);
    disposeSecond();
    expect(getApplicationCompatibility()).toBeUndefined();
  });

  it("restores a pre-existing alias after the final lease", () => {
    const previous = application("previous");
    globalThis.app = previous;
    const dispose = installApplicationCompatibility(application("leased"));

    dispose();

    expect(globalThis.app).toBe(previous);
  });

  it("prefers explicit ownership and reports a missing owner clearly", () => {
    const explicit = application("explicit");
    const fallback = application("fallback");
    const dispose = installApplicationCompatibility(fallback);

    expect(resolveApplication(explicit)).toBe(explicit);
    expect(resolveApplication()).toBe(fallback);
    dispose();
    expect(() => resolveApplication()).toThrow(
      /Pass an App explicitly|provideApplicationState/,
    );
  });
});
