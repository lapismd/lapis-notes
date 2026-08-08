import type { MetadataTypeDef } from "@lapis-notes/api";

type FrontmatterPropertyTypeManager = {
  types: Record<string, MetadataTypeDef | undefined>;
  determineType(value: unknown): MetadataTypeDef["type"];
  determinePropertyType(name: string, value: unknown): MetadataTypeDef["type"];
};

export type FrontmatterPropertyPolicy = {
  type: MetadataTypeDef;
  deriveChildren: boolean;
};

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isPrimitiveArray(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string" || typeof item === "number")
  );
}

function shouldDeriveChildren(type: MetadataTypeDef, value: unknown): boolean {
  if (type.type === "object") return isPlainRecord(value);
  if (type.type === "array") {
    return Array.isArray(value) && !isPrimitiveArray(value);
  }
  return false;
}

export function resolveTopLevelFrontmatterPropertyType(
  manager: FrontmatterPropertyTypeManager,
  key: string,
  value: unknown,
): MetadataTypeDef {
  const inferredType = manager.determinePropertyType(key, value);

  if (inferredType === "tags" || inferredType === "aliases") {
    return { name: key, type: inferredType };
  }

  return (
    manager.types[key] ?? {
      name: key,
      type: inferredType,
    }
  );
}

export function resolveTopLevelFrontmatterProperty(
  manager: FrontmatterPropertyTypeManager,
  key: string,
  value: unknown,
): FrontmatterPropertyPolicy {
  const type = resolveTopLevelFrontmatterPropertyType(manager, key, value);
  return {
    type,
    deriveChildren: shouldDeriveChildren(type, value),
  };
}

export function resolveNestedFrontmatterPropertyType(
  manager: FrontmatterPropertyTypeManager,
  path: string,
  name: string,
  value: unknown,
): MetadataTypeDef {
  return {
    name,
    type: manager.types[path]?.type ?? manager.determineType(value),
  };
}
