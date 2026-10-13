const liveStorybookKeys = [
  "LAPIS_AGENT_RUNTIME_URL",
  "LAPIS_AGENT_RUNTIME_TOKEN",
  "LAPIS_TERMINAL_HOST_URL",
  "LAPIS_TERMINAL_HOST_TOKEN",
  "SPECIFICATION_BASE_URL",
];

export function isStorybookTask(argv) {
  return argv.some((arg) =>
    /^(?:ci:storybook-(?:static|interaction)|build-storybook(?::run)?|test:(?:storybook|specification:(?:dev|static)|workspace:pointer|visual(?::update)?)(?::run)?)$/.test(
      arg,
    ),
  );
}

export function resolveTurboArguments(argv, env = process.env) {
  const marker = argv.indexOf("--task-args");
  const args = (marker < 0 ? argv : argv.slice(0, marker)).filter(
    (arg) => arg !== "--",
  );
  const commandArgs = marker < 0 ? [] : argv.slice(marker + 1);
  if (commandArgs[0] === "--") commandArgs.shift();
  const force = commandArgs.indexOf("--force");
  if (force >= 0) {
    commandArgs.splice(force, 1);
    args.push("--force");
  }
  const live =
    isStorybookTask(args) && liveStorybookKeys.some((key) => env[key]?.trim());
  if (live) {
    // Results and built assets from a live service must never enter a shared cache.
    args.push("--cache=local:,remote:");
  }
  if (commandArgs.length) args.push("--", ...commandArgs);
  return { args, live };
}
