import type {
  AgentBindingCreatedRecord,
  AgentBindingRecord,
  AgentBindingContextUpdatedRecord,
} from "./types";

export type EffectiveAgentBinding = AgentBindingCreatedRecord & {
  context?: AgentBindingContextUpdatedRecord;
};

export function reduceAgentBindings(
  records: readonly AgentBindingRecord[],
): EffectiveAgentBinding[] {
  const bindings = new Map<string, EffectiveAgentBinding>();
  for (const record of records) {
    if (record.type === "binding.created") {
      bindings.set(record.id, { ...record });
      continue;
    }
    if (record.type === "binding.config.updated") {
      const binding = bindings.get(record.agentBindingId);
      if (!binding) continue;
      bindings.set(record.agentBindingId, {
        ...binding,
        ...(record.model ? { model: { ...record.model } } : {}),
        ...(record.thinking ? { thinking: record.thinking } : {}),
      });
      continue;
    }
    if (record.type === "binding.context.updated") {
      const binding = bindings.get(record.agentBindingId);
      if (!binding) continue;
      bindings.set(record.agentBindingId, {
        ...binding,
        context: { ...record },
      });
    }
  }
  return [...bindings.values()];
}

export function effectiveAgentBinding(
  records: readonly AgentBindingRecord[],
  bindingId: string | undefined,
): EffectiveAgentBinding | undefined {
  if (!bindingId) return undefined;
  return reduceAgentBindings(records).find(
    (binding) => binding.id === bindingId,
  );
}
