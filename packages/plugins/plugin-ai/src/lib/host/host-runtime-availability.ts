export function hostLiveRuntimesEnabled(
  hasCapability: (name: "agent-runtime") => boolean,
): boolean {
  return hasCapability("agent-runtime");
}
