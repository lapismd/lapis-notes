import { execFileSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { format } from "prettier";

const root = fileURLToPath(new URL("../", import.meta.url));
const directory = new URL(
  "../crates/lapis-app-protocol/bindings/",
  import.meta.url,
);
const write = process.argv[2] === "--write";
if (!write && process.argv[2] !== "--check")
  throw new Error("Use --write or --check");
const generated = JSON.parse(
  execFileSync(
    process.execPath,
    [
      "scripts/rust-core.mjs",
      "run",
      "-q",
      "--locked",
      "-p",
      "lapis-app-protocol",
      "--bin",
      "export",
    ],
    { cwd: root, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
  ),
);
const outputs = [
  ["protocol.ts", await format(generated.typescript, { parser: "typescript" })],
  [
    "schema.json",
    await format(JSON.stringify(generated.schema), { parser: "json" }),
  ],
];
if (write) await mkdir(directory, { recursive: true });
for (const [name, source] of outputs) {
  const path = new URL(name, directory);
  if (write) await writeFile(path, source);
  else if ((await readFile(path, "utf8").catch(() => "")) !== source)
    throw new Error(`${name} is stale; run pnpm protocol:generate`);
}
console.log(
  write ? "Generated protocol bindings." : "Protocol bindings match Rust.",
);
