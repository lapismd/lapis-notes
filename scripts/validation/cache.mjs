import { hash, imageKey } from "./model.mjs";

const identity = (entries, keys) =>
  entries
    .map((entry) => Object.fromEntries(keys.map((key) => [key, entry[key]])))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

export function cachePlan({
  image,
  workspace,
  pnpmLock,
  cargoLock,
  companionLock,
  archives = [],
  nativeSources = [],
}) {
  const keys = {
    javascript: imageKey({
      schema: 2,
      family: "javascript",
      image,
      lock: hash(pnpmLock),
      archives: identity(archives, ["name", "version", "sha256"]),
    }),
    ...(cargoLock === undefined
      ? {}
      : {
          native: imageKey({
            schema: 2,
            family: "native",
            image,
            core: hash(cargoLock),
            companion: hash(companionLock),
            sources: identity(nativeSources, ["name", "revision", "sha256"]),
          }),
        }),
  };
  const mounts = [
    ["pnpm", "/cache/pnpm", "javascript"],
    ["deno", "/cache/deno", "javascript"],
    ["turbo", "/work/lapis-notes/.turbo", "javascript"],
    ...(cargoLock === undefined
      ? []
      : [
          ["cargo", "/cache/cargo", "native"],
          ["rust", "/work/lapis-notes/.local/rust-core-target", "native"],
        ]),
  ].map(([kind, path, family]) => [
    `lapis-notes-validation-${workspace}-${keys[family]}-${kind}`,
    path,
  ]);
  return { keys, mounts };
}
