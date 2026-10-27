/** Keep primary failures intact; cleanup may only re-report their object refs. */
export function unreportedCleanup(
  cleanup: readonly unknown[],
  primary: readonly unknown[],
): unknown[] {
  const reported = new Set<unknown>();
  const remember = (error: unknown): void => {
    if (error === null || typeof error !== "object" || reported.has(error))
      return;
    reported.add(error);
    if (error instanceof AggregateError) error.errors.forEach(remember);
  };
  primary.forEach(remember);
  const retained = (error: unknown, ancestors: Set<unknown>): unknown[] => {
    if (reported.has(error)) return [];
    if (!(error instanceof AggregateError) || ancestors.has(error))
      return [error];
    const next = new Set(ancestors).add(error);
    const errors = error.errors.flatMap((child) => retained(child, next));
    if (
      errors.length === error.errors.length &&
      errors.every((child, index) => child === error.errors[index])
    )
      return [error];
    return errors.length
      ? [
          new AggregateError(
            errors,
            error.message,
            "cause" in error ? { cause: error.cause } : undefined,
          ),
        ]
      : [];
  };
  return cleanup.flatMap((error) => retained(error, new Set()));
}
