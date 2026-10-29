import { expect, it, vi } from "vitest";
import type { App } from "@lapis-notes/api";
import { registerNativeRepository } from "./native-repository";

it("binds the owned App and returns a lease that allows another bind", () => {
  const factory = vi.fn();
  const app = {} as App;
  const release = registerNativeRepository(app, factory);
  expect(factory).not.toHaveBeenCalled();
  expect(() => registerNativeRepository(app, vi.fn())).toThrow(/already bound/);
  release();
  expect(() => registerNativeRepository(app, factory)).not.toThrow();
});
