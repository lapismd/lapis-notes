const fatalSvelteRuntimeWarnings = ["[svelte] derived_inert"];

export function assertNoFatalStorybookRuntimeWarning(args) {
  const message = args.map((value) => String(value)).join(" ");
  const warning = fatalSvelteRuntimeWarnings.find((candidate) =>
    message.includes(candidate),
  );
  if (!warning) return;

  throw new Error(
    `Storybook emitted a fatal Svelte runtime warning: ${warning}`,
  );
}
