import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { auditStoryParity } from "./storybook-parity.mjs";
const files = execFileSync("jj", ["file", "list"], { encoding: "utf8" })
  .trim()
  .split("\n");
const readOptional = (file) => {
  try {
    return readFileSync(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
};
const contracts = JSON.parse(
  readFileSync("stories/catalog/story-parity.json", "utf8"),
);
const findings = auditStoryParity({ files, contracts, readOptional });
for (const finding of findings)
  console.error(
    `${finding.file}:${finding.line} [${finding.code}] ${finding.rule}: ${finding.message}`,
  );
console.log(
  `Story composition: ${Object.keys(contracts).length} families, ${findings.length} findings.`,
);
process.exitCode = findings.length ? 1 : 0;
