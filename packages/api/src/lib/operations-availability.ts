import type {
  OperationContribution,
  OperationDescriptor,
  OperationHost,
} from "./operations";

export type OperationAvailability = {
  id: string;
  state: "available" | "unsupported" | "unavailable" | "incompatible";
  descriptor?: OperationDescriptor;
};

/** Resolve metadata against admitted host discovery; never activates a provider. */
export async function resolveOperationContributions(
  host: OperationHost | undefined,
  pluginId: string,
  declarations: readonly OperationContribution[],
): Promise<OperationAvailability[]> {
  if (!host)
    return declarations.map(({ id }) => ({ id, state: "unsupported" }));
  const catalog = await host.catalog();
  return declarations.map((declaration) => {
    const descriptor = catalog.operations.find(
      (operation) =>
        operation.plugin_id === pluginId && operation.id === declaration.id,
    );
    if (!descriptor) return { id: declaration.id, state: "unavailable" };
    if (
      catalog.protocol_version !== 1 ||
      descriptor.version !== declaration.version
    )
      return { id: declaration.id, state: "incompatible" };
    return { id: declaration.id, state: "available", descriptor };
  });
}
