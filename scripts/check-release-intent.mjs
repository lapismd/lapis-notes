import { execFileSync } from "node:child_process";

const PUBLIC_PACKAGE_CHANGE = /^packages\/(?:ui|api|workspace)\/(?:src\/|package\.json$|README\.md$|CHANGELOG\.md$)/;
const CHANGESET_FILE = /^\.changeset\/.+\.md$/;

function parseArgs(argv) {
  const options = {
    base: process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : null,
    head: "HEAD",
    files: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--") {
      continue;
    }
    if (value === "--base") {
      options.base = argv[++index];
      continue;
    }
    if (value === "--head") {
      options.head = argv[++index];
      continue;
    }
    if (value === "--file") {
      options.files.push(argv[++index]);
      continue;
    }
    throw new Error(`Unknown argument: ${value}`);
  }

  return options;
}

function changedFiles(base, head) {
  if (!base) {
    return [];
  }
  const output = execFileSync("git", ["diff", "--name-only", `${base}...${head}`], {
    encoding: "utf8",
  });
  return output.split("\n").filter(Boolean);
}

export function checkReleaseIntent(files, env = process.env) {
  if (env.GITHUB_HEAD_REF?.startsWith("changeset-release/")) {
    return { required: false, hasChangeset: false, files };
  }

  const publicChanges = files.filter((file) => PUBLIC_PACKAGE_CHANGE.test(file));
  if (publicChanges.length === 0) {
    return { required: false, hasChangeset: false, files };
  }

  const hasChangeset = files.some((file) => CHANGESET_FILE.test(file));
  if (!hasChangeset) {
    throw new Error(
      `Public package changes require a Changeset. Missing for:\n${publicChanges.join("\n")}`,
    );
  }
  return { required: true, hasChangeset, files: publicChanges };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs(process.argv.slice(2));
  const files = options.files.length > 0 ? options.files : changedFiles(options.base, options.head);
  checkReleaseIntent(files);
  process.stdout.write("Release intent check passed.\n");
}
