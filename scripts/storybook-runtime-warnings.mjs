const svelteDiagnostic = /(?:\[svelte\]|svelte\.dev\/e\/[a-z_]+)/u;

function diagnosticMessage(args) {
  return args
    .map((value) =>
      value instanceof Error ? (value.stack ?? value.message) : String(value),
    )
    .join(" ")
    .replaceAll("%c", "");
}

export function assertNoFatalStorybookRuntimeWarning(args) {
  const message = diagnosticMessage(args);
  if (!svelteDiagnostic.test(message)) return;
  throw new Error(
    `Storybook emitted a fatal Svelte runtime warning: ${message}`,
  );
}

/** Capture even diagnostics whose immediate exception is caught during teardown. */
export function installFatalStorybookRuntimeWarningGuard(target = console) {
  const diagnostics = [];
  const originalWarn = target.warn,
    originalError = target.error;
  const wrap =
    (original) =>
    (...args) => {
      original.apply(target, args);
      const message = diagnosticMessage(args);
      if (!svelteDiagnostic.test(message)) return;
      diagnostics.push(message);
      assertNoFatalStorybookRuntimeWarning(args);
    };
  const warn = wrap(originalWarn),
    error = wrap(originalError);
  target.warn = warn;
  target.error = error;
  return {
    assertClean() {
      if (!diagnostics.length) return;
      const messages = diagnostics.splice(0);
      throw new Error(
        `Storybook emitted fatal Svelte runtime diagnostics:\n${messages.join("\n")}`,
      );
    },
    dispose() {
      if (target.warn === warn) target.warn = originalWarn;
      if (target.error === error) target.error = originalError;
    },
  };
}
