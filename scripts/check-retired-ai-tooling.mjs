import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const retiredFiles = [
  "scripts/ai-real-host.ts",
  "scripts/ai-real-agent-probe.ts",
  "scripts/ai-cross-agent-handoff-probe.ts",
  "scripts/lib/ai-controller-fixture.ts",
  "scripts/lib/ai-real-host-fixture.mjs",
];

export function auditRetiredAiTooling(directory = root) {
  const errors = retiredFiles
    .filter((file) => existsSync(path.join(directory, file)))
    .map((file) => `${file}: remove the retired shared-AI launcher or fixture`);
  const manifest = JSON.parse(
    readFileSync(path.join(directory, "package.json"), "utf8"),
  );
  for (const [name, command] of Object.entries(manifest.scripts ?? {})) {
    if (
      name === "ai-controller" ||
      name.startsWith("ai:smoke:") ||
      /\blapis-ai-controller\b|ai-real-(?:host|agent-probe)|ai-cross-agent-handoff-probe/.test(
        command,
      )
    )
      errors.push(`package.json: remove retired shared-AI command ${name}`);
  }
  return errors;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const errors = auditRetiredAiTooling();
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else console.log("Retired shared-AI launcher boundaries pass.");
}
