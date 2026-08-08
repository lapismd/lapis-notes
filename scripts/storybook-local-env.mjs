import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export const STORYBOOK_LOCAL_ENV_FILE = ".env.storybook.local";

function unquote(value) {
  if (value.length < 2) return value;
  const quote = value[0];
  if ((quote !== '"' && quote !== "'") || value.at(-1) !== quote) {
    return value;
  }

  const inner = value.slice(1, -1);
  if (quote === "'") return inner;
  return inner
    .replaceAll("\\n", "\n")
    .replaceAll("\\r", "\r")
    .replaceAll("\\t", "\t")
    .replaceAll('\\"', '"')
    .replaceAll("\\\\", "\\");
}

export function parseStorybookLocalEnv(contents) {
  const values = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const assignment = line.startsWith("export ") ? line.slice(7).trim() : line;
    const separator = assignment.indexOf("=");
    if (separator < 1) continue;

    const key = assignment.slice(0, separator).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;

    const rawValue = assignment.slice(separator + 1).trim();
    values[key] = unquote(rawValue);
  }

  return values;
}

/**
 * Load checkout-local Storybook settings without replacing explicit shell
 * environment variables.
 */
export function loadStorybookLocalEnv({
  root = process.cwd(),
  env = process.env,
} = {}) {
  const filePath = path.join(root, STORYBOOK_LOCAL_ENV_FILE);
  if (!existsSync(filePath)) return [];

  const loaded = [];
  const values = parseStorybookLocalEnv(readFileSync(filePath, "utf8"));
  for (const [key, value] of Object.entries(values)) {
    if (Object.hasOwn(env, key)) continue;
    env[key] = value;
    loaded.push(key);
  }
  return loaded;
}
