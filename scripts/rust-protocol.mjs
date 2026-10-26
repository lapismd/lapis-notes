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
  [
    new URL(
      "../packages/api/src/lib/native-history-index-protocol.ts",
      import.meta.url,
    ),
    await format(generated.historyIndexTypescript, { parser: "typescript" }),
  ],
  [
    new URL(
      "../packages/api/src/lib/native-indexing-protocol.ts",
      import.meta.url,
    ),
    await format(generated.indexingTypescript, { parser: "typescript" }),
  ],
  [
    new URL("../packages/api/src/lib/native-turn-protocol.ts", import.meta.url),
    await format(generated.turnTypescript, { parser: "typescript" }),
  ],
  [
    new URL("protocol.ts", directory),
    await format(generated.typescript, { parser: "typescript" }),
  ],
  [
    new URL("schema.json", directory),
    await format(JSON.stringify(generated.schema), { parser: "json" }),
  ],
  [
    new URL(
      "../packages/api/src/lib/native-database-protocol.ts",
      import.meta.url,
    ),
    await format(generated.databaseTypescript, { parser: "typescript" }),
  ],
];
if (write) await mkdir(directory, { recursive: true });
for (const [path, source] of outputs) {
  if (write) await writeFile(path, source);
  else if ((await readFile(path, "utf8").catch(() => "")) !== source)
    throw new Error(
      `${fileURLToPath(path)} is stale; run pnpm protocol:generate`,
    );
}
console.log(
  write ? "Generated protocol bindings." : "Protocol bindings match Rust.",
);
