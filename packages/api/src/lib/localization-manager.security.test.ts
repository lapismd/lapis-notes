import { expect, it } from "vitest";
import { LocalizationManager } from "./localization-manager.svelte";

it("default deep resource merging preserves shared built-in functions", async () => {
  const manager = new LocalizationManager();
  await manager.setConfig({ defaultLocale: "en", locales: ["en"] });
  const method = Object.prototype.hasOwnProperty;
  const descriptor = Object.getOwnPropertyDescriptor(method, "call");
  const originalCall = method.call;
  let unchanged = false;
  let pending: ReturnType<LocalizationManager["addResourceBundle"]>;
  try {
    pending = manager.addResourceBundle("security", "en", {
      hasOwnProperty: { call: "ordinary translation" },
    });
    unchanged = method.call === originalCall;
  } finally {
    // Restore before any assertion/promise continuation can observe a vulnerable dependency.
    if (descriptor) Object.defineProperty(method, "call", descriptor);
    else Reflect.deleteProperty(method, "call");
  }
  const dispose = await pending!;
  try {
    expect(unchanged).toBe(true);
    expect(method.call({}, "missing")).toBe(false);
    expect(
      manager.instance.getResource("en", "security", "hasOwnProperty.call"),
    ).toBe("ordinary translation");
  } finally {
    dispose();
  }
});

it("supported localization retains interpolation, locale selection and resource disposal", async () => {
  const manager = new LocalizationManager();
  await manager.setConfig({ defaultLocale: "en", locales: ["en", "fr"] });
  const english = await manager.addResourceBundle("sample", "en", {
    greeting: "Hello {{name}}",
  });
  const french = await manager.addResourceBundle("sample", "fr", {
    greeting: "Bonjour {{name}}",
  });
  try {
    expect(manager.t("sample", "greeting", { name: "Ada" })).toBe("Hello Ada");
    await manager.setLocale("fr");
    expect(manager.locale).toBe("fr");
    expect(manager.t("sample", "greeting", { name: "Ada" })).toBe(
      "Bonjour Ada",
    );
  } finally {
    english();
    french();
  }
  expect(manager.instance.hasResourceBundle("fr", "sample")).toBe(false);
});
