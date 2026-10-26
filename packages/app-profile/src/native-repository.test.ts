import { expect, it, vi } from "vitest";
import type { App } from "@lapis-notes/api";
import { registerNativeRepository } from "./native-repository";

const { bind, RepositoryPlugin } = vi.hoisted(() => ({
  bind: vi.fn(),
  RepositoryPlugin: class RepositoryPlugin {},
}));
vi.mock("@lapis-notes/history/repository", () => ({ RepositoryPlugin }));
vi.mock("@lapis-notes/history/repository/controllers/services", () => ({
  bindRepository: bind,
}));

it("binds the owned App before optional Repository registration and returns its lease", () => {
  const calls: string[] = [];
  const dispose = vi.fn();
  const factory = vi.fn();
  const register = vi.fn(() => { calls.push("register"); });
  const app = { plugins: { registerStaticPlugins: register } } as unknown as App;
  bind.mockImplementation((owner, bound) => {
    expect(owner).toBe(app);
    expect(bound).toBe(factory);
    calls.push("bind");
    return dispose;
  });
  const release = registerNativeRepository(app, factory);
  expect(calls).toEqual(["bind", "register"]);
  expect(register).toHaveBeenCalledExactlyOnceWith([
    { plugin: RepositoryPlugin, required: false, enabledByDefault: true },
  ]);
  expect(dispose).not.toHaveBeenCalled();
  expect(factory).not.toHaveBeenCalled();
  expect(release).toBe(dispose);
  release();
  expect(dispose).toHaveBeenCalledOnce();
});

it("releases a failed registration without constructing native services", () => {
  const dispose = vi.fn();
  bind.mockReturnValue(dispose);
  const factory = vi.fn();
  const error = new Error("registration failed");
  const app = { plugins: { registerStaticPlugins() { throw error; } } } as unknown as App;
  expect(() => registerNativeRepository(app, factory)).toThrow(error);
  expect(dispose).toHaveBeenCalledOnce();
  expect(factory).not.toHaveBeenCalled();
});
