import { readdirSync, readFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const forbidden =
  "(?:tauri(?:-[\\w-]+)?|axum|hyper|tower|warp|actix-web|web-sys|js-sys|wasm-bindgen)";
export function auditDependencies(packages) {
  return packages
    .filter((entry) => entry.name === "lapis-app-core")
    .flatMap((entry) => entry.dependencies)
    .filter((entry) =>
      new RegExp(`^(?:${forbidden}|lapis-desktop|lapis-server)$`, "u").test(
        entry.name,
      ),
    )
    .map(
      (entry) =>
        `lapis-app-core: LN-CORE-001 forbidden host dependency ${entry.name}`,
    );
}
export function auditRustSources(files) {
  const errors = [];
  for (const [file, source] of files) {
    if (
      file.endsWith("Cargo.toml") &&
      new RegExp(`^\\s*${forbidden}\\s*(?:=|\\.)`, "mu").test(source)
    )
      errors.push(
        `${file}: LN-CORE-001 core dependencies cannot own UI or HTTP transports`,
      );
    if (!file.endsWith(".rs")) continue;
    const production = file.includes("/src/");
    const counted = source
      .replace(/\/\*[\s\S]*?\*\//gu, "")
      .split("\n")
      .filter((line) => line.trim() && !line.trim().startsWith("//")).length;
    if (counted > (production ? 300 : 500))
      errors.push(`${file}: LN-CORE-001 split oversized native responsibility`);
    if (
      production &&
      /\b(?:tauri|axum|hyper|tower|web_sys|js_sys|wasm_bindgen)::|\b(?:window|document|globalThis)\./u.test(
        source,
      )
    )
      errors.push(
        `${file}: LN-CORE-001 core source cannot reference a UI or HTTP transport`,
      );
    if (
      production &&
      /#\[path\s*=|include!\s*\(|\b(?:lapis_desktop|lapis_server)::/u.test(
        source,
      )
    )
      errors.push(
        `${file}: LN-CORE-001 core cannot route implementation through host source`,
      );
  }
  return errors;
}
function sources(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return sources(path);
    if (!entry.isFile() || !/\.rs$|Cargo\.toml$/u.test(path)) return [];
    return [[relative(process.cwd(), path), readFileSync(path, "utf8")]];
  });
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const metadata = JSON.parse(
    execFileSync(
      "cargo",
      ["metadata", "--format-version=1", "--no-deps", "--locked"],
      { encoding: "utf8" },
    ),
  );
  const errors = [
    ...auditRustSources(sources("crates/lapis-app-core")),
    ...auditDependencies(metadata.packages),
  ];
  for (const error of errors) console.error(error);
  if (errors.length) process.exitCode = 1;
  else console.log("Rust application core boundaries pass.");
}
