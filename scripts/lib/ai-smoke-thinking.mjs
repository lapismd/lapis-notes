/**
 * Only request optional configuration that the acceptance session advertises.
 * @param {string} lane
 * @param {{configOptions?: Array<{id: string, options?: Array<{value: string}>}>}} catalog
 * @returns {{thinking?: "medium"}}
 */
export function smokeThinking(lane, catalog) {
  if (lane === "codex-native") return { thinking: "medium" };
  const advertised = catalog.configOptions?.some(
    (option) =>
      ["thinking", "effort", "reasoning_effort", "variant"].includes(
        option.id,
      ) && option.options?.some((value) => value.value === "medium"),
  );
  return advertised ? { thinking: "medium" } : {};
}
