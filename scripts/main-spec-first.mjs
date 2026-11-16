import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const repository = "lapismd/lapis-notes";
const main = "refs/heads/main";
function requireFact(condition, message) {
  if (!condition) throw new Error(`Main spec-first: ${message}`);
}
function commit(value) {
  requireFact(
    typeof value === "string" &&
      /^[a-f0-9]{40}$/.test(value) &&
      !/^0+$/.test(value),
    "missing or invalid immutable commit",
  );
  return value;
}
export function gitRead(args) {
  const result = spawnSync("git", ["--no-replace-objects", ...args], {
    encoding: "utf8",
    timeout: 30_000,
    maxBuffer: 1024 * 1024,
  });
  if (result.error) throw result.error;
  requireFact(result.status === 0, `Git evidence failed (${args[0]})`);
  return result.stdout.trim();
}
function checkout(head, git) {
  requireFact(
    git(["rev-parse", "--verify", "HEAD"]) === head,
    "checkout differs from declared head",
  );
}

export function mainSpecFirstRange({ env, event, git = gitRead }) {
  requireFact(
    env.GITHUB_ACTIONS === "true" &&
      env.GITHUB_REPOSITORY === repository &&
      event?.repository?.full_name === repository &&
      event.repository.default_branch === "main" &&
      event.repository.private === false &&
      event.repository.fork === false &&
      env.GITHUB_REF === main,
    "requires trusted same-repository public main context",
  );
  const head = commit(env.GITHUB_SHA);
  checkout(head, git);
  let base;
  if (env.GITHUB_EVENT_NAME === "push") {
    requireFact(
      event.ref === main &&
        event.deleted === false &&
        event.forced !== true &&
        event.after === head,
      "push context does not match the declared main head",
    );
    base = commit(event.before);
  } else if (env.GITHUB_EVENT_NAME === "workflow_dispatch") {
    const parents = git(["rev-list", "--parents", "-n", "1", head]).split(
      /\s+/,
    );
    requireFact(parents[0] === head, "manual head evidence differs");
    base = commit(parents[1]);
  } else {
    throw new Error("Main spec-first: unsupported event context");
  }
  requireFact(base !== head, "range must include a change");
  for (const sha of [base, head]) {
    requireFact(
      git(["rev-parse", "--verify", `${sha}^{commit}`]) === sha,
      "revision is not the exact commit",
    );
  }
  git(["merge-base", "--is-ancestor", base, head]);
  return { base, head };
}

export function runMainSpecFirst({
  env = process.env,
  read = readFileSync,
  git = gitRead,
  run = spawnSync,
} = {}) {
  requireFact(
    typeof env.GITHUB_EVENT_PATH === "string" &&
      env.GITHUB_EVENT_PATH.length > 0,
    "missing event payload",
  );
  const event = JSON.parse(read(env.GITHUB_EVENT_PATH, "utf8"));
  const range = mainSpecFirstRange({ env, event, git });
  // Invoke the released validator directly: PR-only policy cannot exempt main.
  checkout(range.head, git);
  const result = run(
    "pnpm",
    [
      "exec",
      "spec-validator",
      "first",
      "--base",
      range.base,
      "--head",
      range.head,
    ],
    { stdio: "inherit", env },
  );
  if (result.error) throw result.error;
  checkout(range.head, git);
  requireFact(result.status === 0, "canonical coverage failed");
  return range;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    runMainSpecFirst();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
