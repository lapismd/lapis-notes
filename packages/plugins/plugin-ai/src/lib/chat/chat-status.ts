export function shouldShowWorkingIndicator(
  initializing: boolean,
  busy: boolean,
  error: string | null | undefined,
): boolean {
  return (initializing || busy) && !error;
}
