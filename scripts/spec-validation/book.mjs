import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { diagnostic } from "./lib/spec-model.mjs";

export const name = "book";

export function validate(context) {
  const findings = [];
  const bookConfigPath = path.join(context.model.repoRoot, "spec", "book.toml");
  if (!existsSync(bookConfigPath)) {
    findings.push(
      diagnostic({
        code: "SPEC-BOOK-MISSING",
        rule: "LN-GOV-001",
        file: "spec/book.toml",
        message: "mdBook configuration is missing",
      }),
    );
  } else {
    const config = readFileSync(bookConfigPath, "utf8");
    if (!/^\s*src\s*=\s*"src"\s*$/m.test(config)) {
      findings.push(
        diagnostic({
          code: "SPEC-BOOK-CONFIG",
          rule: "LN-GOV-001",
          file: "spec/book.toml",
          message: '[book] src must be "src"',
        }),
      );
    }
    if (!/^\s*build-dir\s*=\s*"book"\s*$/m.test(config)) {
      findings.push(
        diagnostic({
          code: "SPEC-BOOK-CONFIG",
          rule: "LN-GOV-001",
          file: "spec/book.toml",
          message: 'build-dir must be "book"',
        }),
      );
    }
  }

  const ignorePath = path.join(context.model.repoRoot, ".gitignore");
  const ignore = existsSync(ignorePath) ? readFileSync(ignorePath, "utf8") : "";
  if (!/^\/?spec\/book\/?\s*$/m.test(ignore)) {
    findings.push(
      diagnostic({
        code: "SPEC-BOOK-IGNORE",
        rule: "LN-GOV-007",
        file: ".gitignore",
        message: "spec/book must be ignored",
      }),
    );
  }
  for (const trackedFile of context.trackedFiles) {
    if (trackedFile !== "spec/book" && !trackedFile.startsWith("spec/book/")) {
      continue;
    }
    findings.push(
      diagnostic({
        code: "SPEC-BOOK-TRACKED",
        rule: "LN-GOV-007",
        file: trackedFile,
        message: "generated mdBook output must remain untracked",
      }),
    );
  }
  return findings;
}
