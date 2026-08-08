import { z } from "zod";
import type { App } from "./context.svelte";
import { SettingTab } from "./settings.svelte";
import { cloneDeep, isEqual } from "lodash-es";
import { EventDispatcher } from "./events";
import { dirname } from "./storage";

type PluginDataUpdateOrigin =
  | "plugin-save"
  | "configuration-update"
  | "external-reload";

type PluginDataUpdateEvent = {
  pluginId: string;
  value: any;
  prev: any;
  origin: PluginDataUpdateOrigin;
};

function isRecoverableConfigurationReadError(error: unknown): boolean {
  let current: unknown = error;
  while (current) {
    const err = current as {
      name?: string;
      code?: string;
      message?: string;
      cause?: unknown;
    };
    if (
      err?.name === "NotFoundError" ||
      err?.name === "NotReadableError" ||
      err?.name === "NoModificationAllowedError" ||
      err?.name === "InvalidStateError" ||
      err?.code === "ENOENT" ||
      /\bENOENT\b|not found|could not be found/i.test(err?.message ?? "") ||
      /state cached in an interface object was made but the state had changed/i.test(
        err?.message ?? "",
      )
    ) {
      return true;
    }
    current = err?.cause;
  }
  return false;
}

const schemaType = (): z.ZodType<SchemaType> =>
  z.union([
    z.union([enumOption, stringOption]),
    numberOption,
    integerOption,
    booleanOption,
    arrayOption,
    objectOption,
    customType,
  ]) as z.ZodType<SchemaType>;

const deprecationFields = {
  deprecationMessage: z.string().optional(),
  markdownDeprecationMessage: z.string().optional(),
};

const stringOption = z.object({
  order: z.number().int().nonnegative().optional(),
  type: z.literal("string"),
  default: z.string().optional(),
  title: z.string().optional(),
  format: z.string().optional(),
  editPresentation: z.literal("multilineText").optional(),
  optionsSource: z.string().optional(),
  allowUnknownOptions: z.boolean().optional(),
  optionsSourceParams: z.record(z.string(), z.unknown()).optional(),
  description: z.string().optional(),
  markdownDescription: z.string().optional(),
  ...deprecationFields,
});

export type StringType = {
  type: "string";
  editPresentation?: "multilineText";
  format?: string;
  optionsSource?: string;
  allowUnknownOptions?: boolean;
  optionsSourceParams?: Record<string, unknown>;
  default?: string;
  title?: string;
  description?: string;
  markdownDescription?: string;
  order?: number;
  deprecationMessage?: string;
  markdownDeprecationMessage?: string;
};

const numberOption = z.object({
  order: z.number().int().nonnegative().optional(),
  type: z.literal("number"),
  default: z.number().optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  step: z.number().optional().default(1),
  title: z.string().optional(),
  description: z.string().optional(),
  markdownDescription: z.string().optional(),
  ...deprecationFields,
});

const integerOption = z.object({
  order: z.number().int().nonnegative().optional(),
  type: z.literal("integer"),
  default: z.number().int().optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  step: z.number().optional().default(1),
  title: z.string().optional(),
  description: z.string().optional(),
  markdownDescription: z.string().optional(),
  ...deprecationFields,
});

export type NumberType = {
  type: "number";
  order?: number;
  default?: number;
  minimum?: number;
  maximum?: number;
  step?: number;
  title?: string;
  description?: string;
  markdownDescription?: string;
  deprecationMessage?: string;
  markdownDeprecationMessage?: string;
};

export type IntegerType = {
  type: "integer";
  order?: number;
  default?: number;
  minimum?: number;
  maximum?: number;
  step?: number;
  title?: string;
  description?: string;
  markdownDescription?: string;
  deprecationMessage?: string;
  markdownDeprecationMessage?: string;
};

const booleanOption = z.object({
  order: z.number().int().nonnegative().optional(),
  type: z.literal("boolean"),
  default: z.boolean().default(false).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  markdownDescription: z.string().optional(),
  ...deprecationFields,
});
export type BooleanType = {
  type: "boolean";
  order?: number;
  default?: boolean;
  title?: string;
  description?: string;
  markdownDescription?: string;
  deprecationMessage?: string;
  markdownDeprecationMessage?: string;
};

const enumOption = z
  .object({
    order: z.number().int().nonnegative().optional(),
    type: z.literal("string"),
    enum: z.array(z.string()),
    enumDescriptions: z.array(z.string()).optional(),
    enumMarkdownDescriptions: z.array(z.string()).optional(),
    enumItemLabels: z.array(z.string()).optional(),
    default: z.string().optional(),
    title: z.string().optional(),
    optionsSource: z.string().optional(),
    allowUnknownOptions: z.boolean().optional(),
    optionsSourceParams: z.record(z.string(), z.unknown()).optional(),
    description: z.string().optional(),
    markdownDescription: z.string().optional(),
    ...deprecationFields,
  })
  .superRefine((data, ctx) => {
    if (
      data.enumDescriptions &&
      data.enum.length !== data.enumDescriptions.length
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `enumDescriptions(${data.enumDescriptions.length}) must be same length as enums(${data.enum.length})`,
        path: [...ctx.path, "enumDescriptions"],
      });
    }

    if (
      data.enumMarkdownDescriptions &&
      data.enum.length !== data.enumMarkdownDescriptions.length
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `enumMarkdownDescriptions(${data.enumMarkdownDescriptions.length}) must be same length as enums(${data.enum.length})`,
        path: [...ctx.path, "enumMarkdownDescriptions"],
      });
    }

    if (
      data.enumItemLabels &&
      data.enum.length !== data.enumItemLabels.length
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `enumItemLabels(${data.enumItemLabels.length}) must be same length as enums(${data.enum.length})`,
        path: [...ctx.path, "enumItemLabels"],
      });
    }
    data.default = data.enum[0];
  });
export type EnumType = {
  type: "string";
  order?: number;
  enum: string[];
  default?: string;
  title?: string;
  description?: string;
  markdownDescription?: string;
  enumDescriptions?: string[];
  enumMarkdownDescriptions?: string[];
  enumItemLabels?: string[];
  optionsSource?: string;
  allowUnknownOptions?: boolean;
  optionsSourceParams?: Record<string, unknown>;
  deprecationMessage?: string;
  markdownDeprecationMessage?: string;
};

const arrayOption = z.object({
  order: z.number().int().nonnegative().optional(),
  type: z.literal("array"),
  items: z.lazy(() => schemaType()),
  minItems: z.number().int().nonnegative().optional(),
  maxItems: z.number().int().nonnegative().optional(),
  default: z.array(z.any()).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  markdownDescription: z.string().optional(),
  ...deprecationFields,
});
export type ArrayType = {
  type: "array";
  order?: number;
  items: SchemaType;
  minItems?: number;
  maxItems?: number;
  default?: any[];
  title?: string;
  description?: string;
  markdownDescription?: string;
  deprecationMessage?: string;
  markdownDeprecationMessage?: string;
};

const objectOption = z.object({
  order: z.number().int().nonnegative().optional(),
  type: z.literal("object"),
  title: z.string().optional(),
  description: z.string().optional(),
  markdownDescription: z.string().optional(),
  properties: z.record(z.string(), z.lazy(schemaType)).default({}),
  additionalProperties: z
    .union([z.boolean(), z.lazy(() => schemaType())])
    .optional(),
  default: z.record(z.string(), z.any()).optional(),
  ...deprecationFields,
});
export type ObjectType = {
  type: "object";
  order?: number;
  title?: string;
  description?: string;
  markdownDescription?: string;
  properties: Record<string, SchemaType>;
  additionalProperties?: boolean | SchemaType;
  default?: Record<string, unknown>;
  deprecationMessage?: string;
  markdownDeprecationMessage?: string;
};

const customType = z.object({
  type: z.literal("custom"),
  order: z.number().int().nonnegative().optional(),
  component: z.instanceof(SettingTab),
  title: z.string().optional(),
  description: z.string().optional(),
  markdownDescription: z.string().optional(),
});

export type CustomType = {
  type: "custom";
  component: SettingTab;
  title?: string;
  description?: string;
  markdownDescription?: string;
};

export type SchemaType =
  | StringType
  | NumberType
  | IntegerType
  | EnumType
  | BooleanType
  | ObjectType
  | CustomType
  | ArrayType;

export function isFlatPrimitiveObjectSchema(schema: ObjectType): boolean {
  const props = Object.values(schema.properties);
  if (props.length === 0) {
    return false;
  }

  return props.every(
    (property) =>
      property.type === "boolean" ||
      property.type === "number" ||
      property.type === "integer" ||
      (property.type === "string" && !("enum" in property)),
  );
}

export function isRecordObjectSchema(schema: ObjectType): boolean {
  return (
    typeof schema.additionalProperties === "object" &&
    schema.additionalProperties !== null
  );
}

export function isPrimitiveArraySchema(schema: ArrayType): boolean {
  const items = schema.items;
  if (
    items.type === "boolean" ||
    items.type === "number" ||
    items.type === "integer"
  ) {
    return true;
  }

  return items.type === "string" && !("enum" in items);
}

const TABLE_CELL_STRING_FORMATS = new Set(["email", "uri", "ipv4"]);

export function isTableCellSchema(schema: SchemaType): boolean {
  if (
    schema.type === "boolean" ||
    schema.type === "number" ||
    schema.type === "integer"
  ) {
    return true;
  }

  if (schema.type !== "string") {
    return false;
  }

  if (
    "editPresentation" in schema &&
    schema.editPresentation === "multilineText"
  ) {
    return false;
  }

  if ("format" in schema) {
    if (schema.format === "textarea") {
      return false;
    }

    if (schema.format && !TABLE_CELL_STRING_FORMATS.has(schema.format)) {
      return false;
    }
  }

  return true;
}

export function isArrayOfFlatObjectSchema(
  schema: SchemaType,
): schema is ArrayType & { items: ObjectType } {
  if (schema.type !== "array") {
    return false;
  }

  const itemSchema = schema.items;
  if (itemSchema.type !== "object") {
    return false;
  }

  if (!itemSchema.properties) {
    return false;
  }

  if (Object.keys(itemSchema.properties).length === 0) {
    return false;
  }

  if (
    itemSchema.additionalProperties === true ||
    typeof itemSchema.additionalProperties === "object"
  ) {
    return false;
  }

  return Object.values(itemSchema.properties).every(isTableCellSchema);
}

const configurationType = z.object({
  id: z.string().optional(),
  $schema: z.string().url().optional(),
  title: z.string(),
  type: z.literal("object"),
  properties: z.record(z.string(), z.lazy(schemaType)),
});

export const configType = z.lazy(schemaType);

export type ConfigurationType = z.infer<typeof configurationType>;

export const contributesType = z.union([
  configurationType,
  z.array(configurationType),
]);
export type ContributesType = z.infer<typeof contributesType>;

export type ConfigurationGroupType = {
  id: string;
  title: string;
  description?: string;
  markdownDescription?: string;
};

export interface WorkspaceConfiguration {
  has(key: string): boolean;
  get<T>(key: string, defaultValue?: T): T;
  update(key: string, value: any): Promise<void>;
  entries<T>(): [string, T][];
  values<T>(): T[];
  keys(): string[];
}

function humanizeConfigKey(key: string): string {
  const value = key.split(".").pop() ?? key;
  return value
    .replace(/[-_]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (char) => char.toUpperCase());
}

function joinConfigId(baseId: string | undefined, key: string): string {
  if (!baseId) {
    return key;
  }

  if (key === baseId || key.startsWith(`${baseId}.`)) {
    return key;
  }

  return `${baseId}.${key}`;
}

function resolveSchemaDefault(schema: SchemaType): unknown {
  if (schema.type === "object") {
    if (schema.default !== undefined) {
      return cloneDeep(schema.default);
    }

    const value = Object.entries(schema.properties).reduce<
      Record<string, unknown>
    >((acc, [key, child]) => {
      const childDefault = resolveSchemaDefault(child);
      if (childDefault !== undefined) {
        acc[key] = childDefault;
      }
      return acc;
    }, {});

    return Object.keys(value).length > 0 ? value : undefined;
  }

  if (schema.type === "string" && "enum" in schema) {
    return cloneDeep(schema.default ?? schema.enum[0]);
  }

  return "default" in schema ? cloneDeep(schema.default) : undefined;
}

function validateConfigurationValue(
  schema: SchemaType,
  value: unknown,
  key: string,
): unknown {
  switch (schema.type) {
    case "string": {
      if (typeof value !== "string") {
        throw new Error(`${key} must be a string.`);
      }

      if ("enum" in schema && !schema.enum.includes(value)) {
        throw new Error(
          `${key} must be one of: ${schema.enum.join(", ")}. Received ${JSON.stringify(value)}.`,
        );
      }

      return value;
    }

    case "number":
    case "integer": {
      const parsed =
        typeof value === "number"
          ? value
          : typeof value === "string" && value.trim().length > 0
            ? Number(value)
            : Number.NaN;

      if (!Number.isFinite(parsed)) {
        throw new Error(`${key} must be a ${schema.type}.`);
      }

      if (schema.type === "integer" && !Number.isInteger(parsed)) {
        throw new Error(`${key} must be an integer.`);
      }

      if (schema.minimum !== undefined && parsed < schema.minimum) {
        throw new Error(`${key} must be at least ${schema.minimum}.`);
      }

      if (schema.maximum !== undefined && parsed > schema.maximum) {
        throw new Error(`${key} must be at most ${schema.maximum}.`);
      }

      return parsed;
    }

    case "boolean": {
      if (typeof value !== "boolean") {
        throw new Error(`${key} must be true or false.`);
      }

      return value;
    }

    case "array": {
      if (!Array.isArray(value)) {
        throw new Error(`${key} must be an array.`);
      }

      if (schema.minItems !== undefined && value.length < schema.minItems) {
        throw new Error(
          `${key} must include at least ${schema.minItems} item${schema.minItems === 1 ? "" : "s"}.`,
        );
      }

      if (schema.maxItems !== undefined && value.length > schema.maxItems) {
        throw new Error(
          `${key} must include at most ${schema.maxItems} item${schema.maxItems === 1 ? "" : "s"}.`,
        );
      }

      return value.map((item, index) =>
        validateConfigurationValue(schema.items, item, `${key}[${index}]`),
      );
    }

    case "object": {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error(`${key} must be an object.`);
      }

      const record = value as Record<string, unknown>;
      const result = Object.entries(schema.properties).reduce<
        Record<string, unknown>
      >((acc, [childKey, childSchema]) => {
        if (!(childKey in record)) {
          const childDefault = resolveSchemaDefault(childSchema);
          if (childDefault !== undefined) {
            acc[childKey] = childDefault;
          }
          return acc;
        }

        acc[childKey] = validateConfigurationValue(
          childSchema,
          record[childKey],
          `${key}.${childKey}`,
        );
        return acc;
      }, {});

      for (const [childKey, childValue] of Object.entries(record)) {
        if (childKey in schema.properties) {
          continue;
        }

        if (schema.additionalProperties === false) {
          throw new Error(`${key}.${childKey} is not a supported property.`);
        }

        if (typeof schema.additionalProperties === "object") {
          result[childKey] = validateConfigurationValue(
            schema.additionalProperties,
            childValue,
            `${key}.${childKey}`,
          );
          continue;
        }

        if (schema.additionalProperties === true) {
          result[childKey] = childValue;
        }
      }

      return result;
    }

    case "custom":
      return value;
  }
}

function getKey(config: any, key: string) {
  if (key) {
    if (typeof config === "object") {
      const keys = Object.keys(config).filter(
        (k) => k === key || k.startsWith(`${key}.`),
      );
      if (!keys.length) {
        return undefined;
      }
      if (keys.length === 1 && keys[0] === key) {
        return config[keys[0]];
      }
      return keys.reduce<Record<string, any>>((acc, k) => {
        const subKey = k.startsWith(`${key}.`)
          ? k.substring(`${key}.`.length)
          : k;
        acc[subKey] = config[k];
        return acc;
      }, {});
    }
  }
}

function lookUp(tree: any, key: string) {
  if (key) {
    const parts = key.split(".");
    let node = tree;
    for (let i = 0; node !== undefined && i < parts.length; i++) {
      node = getKey(node, parts[i]);
    }
    return node;
  }
}

function findValue(
  key: string,
  values: Record<string, any>,
): [string, string, string] {
  let parts = key.split(".");
  const keys: string[][] = [];
  for (let i = 1; i <= parts.length; i++) {
    keys.push(parts.slice(0, i));
  }
  const sectionId = keys
    .reverse()
    .map((it) => it.join("."))
    .filter((it) => it)
    .find((it) => lookUp(values, it));
  if (!sectionId) {
    throw new Error(`Invalid key for configuration: ${key}`);
  }
  const id = key.replace(`${sectionId}.`, "");
  if (sectionId === key) {
    return [sectionId, "", sectionId];
  }
  parts = id.split(".");
  const [setterId, ...prefix] = [parts.pop()!, ...parts];
  return [sectionId, prefix.join("."), setterId];
}

export type ConfigurationSchemaType = SchemaType & {
  configId: string;
  category: string;
  categoryId: string;
  groupPath?: ConfigurationGroupType[];
};

function flattenConfigurationProperties(
  properties: Record<string, SchemaType>,
  options: {
    baseId?: string;
    category: string;
    categoryId?: string;
    groupPath?: ConfigurationGroupType[];
  },
): ConfigurationSchemaType[] {
  const flattened: ConfigurationSchemaType[] = [];

  for (const [key, value] of Object.entries(properties)) {
    const configId = joinConfigId(options.baseId, key);

    if (value.type === "object") {
      if (isFlatPrimitiveObjectSchema(value) || isRecordObjectSchema(value)) {
        flattened.push({
          ...value,
          configId,
          category: options.category,
          categoryId: options.categoryId ?? configId.split(".")[0] ?? configId,
          groupPath: options.groupPath ? [...options.groupPath] : undefined,
        });
        continue;
      }

      flattened.push(
        ...flattenConfigurationProperties(value.properties, {
          ...options,
          baseId: configId,
          groupPath: [
            ...(options.groupPath ?? []),
            {
              id: configId,
              title: value.title ?? humanizeConfigKey(key),
              description: value.description,
              markdownDescription: value.markdownDescription,
            },
          ],
        }),
      );
      continue;
    }

    flattened.push({
      ...value,
      configId,
      category: options.category,
      categoryId: options.categoryId ?? configId.split(".")[0] ?? configId,
      groupPath: options.groupPath ? [...options.groupPath] : undefined,
    });
  }

  return flattened;
}

export class ConfigurationSchema extends EventDispatcher<{
  updated: [{ key: string; value: any; prev?: any }];
}> {
  private values: Record<string, ConfigurationSchemaType> = $state({});

  constructor() {
    super();
  }

  getConfiguration(section?: string): WorkspaceConfiguration {
    const config = section ? lookUp(this.values, section) : this.values;
    const self = this;
    const result: WorkspaceConfiguration = {
      has(key: string): boolean {
        return lookUp(config, key) !== undefined;
      },
      get<T>(key: string, defaultValue?: T): T {
        let result = lookUp(config, key);
        if (typeof result === "undefined") {
          result = defaultValue;
        }
        return result;
      },
      update: (key: string, value: any) => {
        key = section ? `${section}.${key}` : key;
        if (value !== undefined) {
          return self.updateConfigurationOption(key, value);
        } else {
          return self.removeConfigurationOption(key);
        }
      },
      entries<T>(): [string, T][] {
        return Object.entries(config || {});
      },
      values<T>(): T[] {
        return Object.values(config || {});
      },
      keys: () => {
        return Object.keys(config || {});
      },
    };
    return Object.freeze(result);
  }

  getDefinition(key: string): ConfigurationSchemaType | undefined {
    return lookUp(this.values, key) as ConfigurationSchemaType | undefined;
  }

  validateConfigurationOption(key: string, value: unknown): unknown {
    const schema = this.getDefinition(key);
    if (!schema) {
      return value;
    }

    return validateConfigurationValue(schema, value, key);
  }

  getDefaultEntries(): [string, unknown][] {
    return Object.entries(this.values).flatMap(([key, schema]) => {
      const defaultValue = resolveSchemaDefault(schema);
      return defaultValue === undefined ? [] : ([[key, defaultValue]] as const);
    });
  }

  register(...schemas: any[]) {
    for (const schema of schemas) {
      const parsedSchema = contributesType.parse(schema);
      const schemaData = Array.isArray(parsedSchema)
        ? parsedSchema
        : [parsedSchema];

      for (const data of schemaData) {
        for (const value of flattenConfigurationProperties(data.properties, {
          baseId: data.id,
          category: data.title,
          categoryId: data.id,
        })) {
          const existing = lookUp(this.values, value.configId);
          if (existing === undefined) {
            this.values[value.configId] = value;
          } else {
            console.warn(
              `Duplicate property: ${value.configId} already defined as: `,
              {
                existing,
                duplicate: value,
              },
            );
          }
        }
      }
    }
  }

  unregister(...schemas: any[]) {
    for (const schema of schemas) {
      const parsedSchema = contributesType.parse(schema);
      const schemaData = Array.isArray(parsedSchema)
        ? parsedSchema
        : [parsedSchema];

      for (const data of schemaData) {
        for (const value of flattenConfigurationProperties(data.properties, {
          baseId: data.id,
          category: data.title,
          categoryId: data.id,
        })) {
          delete this.values[value.configId];
        }
      }
    }
  }

  removeWebView(id: string) {
    const deleted = Object.keys(this.values)
      .filter((k) => {
        const property = this.values[k];
        return property.type === "custom" && property.configId === id;
      })
      .reduce<Record<string, SchemaType>>((obj, key) => {
        obj[key] = this.values[key];
        return obj;
      }, {});
    const keys = Object.keys(deleted);
    if (keys.length) {
      keys.forEach((k) => delete this.values[k]);
      this.emit("updated", { key: id, value: deleted });
    }
  }

  registerWebView(id: string, title: string, component: SettingTab) {
    const existing = this.values[id];
    if (existing) {
      console.warn(`Duplicate property: ${id} already defined as: `, {
        existing,
      });
      return;
    }
    const value: CustomType = {
      type: "custom",
      title,
      component,
    };
    this.values[id] = {
      ...value,
      configId: id,
      category: title,
      categoryId: "extensions",
    };
    this.emit("updated", { key: id, value, prev: undefined });
  }

  async updateConfigurationOption(key: string, value: any) {
    const [sectionId, prefix, id] = findValue(key, this.values);
    const data = cloneDeep({ ...this.values[sectionId] });
    const parent = prefix.length ? lookUp(data, prefix) : data;
    const prev = parent[id];
    parent[id] = validateConfigurationValue(data, value, key);
    const config = configType.parse(data);
    this.values[sectionId] = {
      ...config,
      configId: data.configId,
      category: data.category,
      categoryId: data.categoryId,
      groupPath: data.groupPath,
    };
    this.emit("updated", { key, value: parent[id], prev });
  }

  async removeConfigurationOption(key: string): Promise<void> {
    const [sectionId, prefix, id] = findValue(key, this.values);
    const data: any = cloneDeep({ ...this.values[sectionId] });
    const parent = prefix.length ? lookUp(data, prefix) : data;
    const prev = parent[id];
    if (prev !== undefined) {
      delete parent[id];
      const config = configType.parse(data);
      this.values[sectionId] = {
        ...config,
        configId: data.configId,
        category: data.category,
        categoryId: data.categoryId,
        groupPath: data.groupPath,
      };
      this.emit("updated", { key, prev, value: undefined });
    }
  }
}

export class Configuration extends EventDispatcher<{
  updated: [{ key: string; value: any; prev: any }];
  "plugin-data-updated": [event: PluginDataUpdateEvent];
}> {
  private values: Record<string, any> = $state({});
  readonly schema: ConfigurationSchema = new ConfigurationSchema();

  constructor(
    readonly app: App,
    readonly basePath: string,
  ) {
    super();
    this.watchExternalConfigChanges();
  }

  async load() {
    await this.reloadFromDisk({ emitPluginDataEvents: false });
  }

  hasPluginData(pluginId: string): boolean {
    return Object.hasOwn(this.getPluginDataStore(this.values), pluginId);
  }

  getPluginData<T = any>(pluginId: string): T | null {
    const pluginData = this.getPluginDataStore(this.values);
    if (!Object.hasOwn(pluginData, pluginId)) {
      return null;
    }
    return cloneDeep(pluginData[pluginId]) as T;
  }

  async updatePluginData(
    pluginId: string,
    value: any,
    options: { origin?: PluginDataUpdateOrigin } = {},
  ): Promise<void> {
    const prev = this.getPluginData(pluginId);
    const pluginData = this.getPluginDataStore(this.values);
    const nextPluginData = {
      ...pluginData,
      [pluginId]: cloneDeep(value),
    };
    const next = { ...this.values, pluginData: nextPluginData };
    await this.persist(next);
    this.emit("plugin-data-updated", {
      pluginId,
      value: this.getPluginData(pluginId),
      prev,
      origin: options.origin ?? "configuration-update",
    });
  }

  async removePluginData(
    pluginId: string,
    options: { origin?: PluginDataUpdateOrigin } = {},
  ): Promise<void> {
    const pluginData = this.getPluginDataStore(this.values);
    if (!Object.hasOwn(pluginData, pluginId)) {
      return;
    }
    const prev = cloneDeep(pluginData[pluginId]);
    const nextPluginData = { ...pluginData };
    delete nextPluginData[pluginId];
    const next = { ...this.values };
    if (Object.keys(nextPluginData).length > 0) {
      next.pluginData = nextPluginData;
    } else {
      delete next.pluginData;
    }
    await this.persist(next);
    this.emit("plugin-data-updated", {
      pluginId,
      value: undefined,
      prev,
      origin: options.origin ?? "configuration-update",
    });
  }

  async reloadFromDisk(
    options: {
      emitPluginDataEvents?: boolean;
      origin?: PluginDataUpdateOrigin;
    } = {},
  ): Promise<void> {
    const previousValues = cloneDeep(this.values);
    this.values = await this.readValuesFromDisk();
    await this.materializeSchemaDefaults();

    if (options.emitPluginDataEvents !== false) {
      this.emitPluginDataDiffs(
        previousValues,
        this.values,
        options.origin ?? "external-reload",
      );
    }
  }

  getConfiguration(section?: string): WorkspaceConfiguration {
    const config = section ? lookUp(this.values, section) : this.values;
    const self = this;
    const result: WorkspaceConfiguration = {
      has(key: string): boolean {
        return lookUp(config, key) !== undefined;
      },
      get<T>(key: string, defaultValue?: T): T {
        let result = lookUp(config, key);
        if (typeof result === "undefined") {
          if (defaultValue === undefined) {
            const schemaConfig = self.schema.getConfiguration().get(key) as any;
            defaultValue = schemaConfig?.default;
          }
          result = defaultValue;
        }
        return result;
      },
      update: (key: string, value: any) => {
        key = section ? `${section}.${key}` : key;
        if (value !== undefined) {
          return self.updateConfigurationOption(key, value);
        } else {
          return self.removeConfigurationOption(key);
        }
      },
      entries<T>(): [string, T][] {
        return Object.entries(config || {});
      },
      values<T>(): T[] {
        return Object.values(config || {});
      },
      keys: () => {
        return Object.keys(config || {});
      },
    };
    return Object.freeze(result);
  }

  async updateConfigurationOption(key: string, value: any) {
    await this.updateConfigurationOptions({ [key]: value });
  }

  /**
   * Validate and persist a set of flat configuration keys as one update.
   *
   * Validation and the vault write both complete before observable state or
   * update events change, so consumers never see a partially applied batch.
   *
   * @public
   */
  async updateConfigurationOptions(
    changes: Readonly<Record<string, any>>,
  ): Promise<void> {
    const validated = Object.entries(changes).map(([key, value]) => ({
      key,
      value: this.schema.validateConfigurationOption(key, value),
    }));
    const changed = validated
      .map(({ key, value }) => ({
        key,
        value,
        prev: this.values[key],
      }))
      .filter(({ value, prev }) => !isEqual(value, prev));

    if (changed.length === 0) return;

    const next = { ...this.values };
    for (const { key, value } of changed) {
      next[key] = cloneDeep(value);
    }

    await this.persist(next);
    for (const { key, value, prev } of changed) {
      this.emit("updated", {
        key,
        value: cloneDeep(value),
        prev: cloneDeep(prev),
      });
    }
  }

  async removeConfigurationOption(key: string): Promise<void> {
    const value = this.values[key];
    if (value !== undefined) {
      const next = { ...this.values };
      delete next[key];
      await this.persist(next);
      this.emit("updated", { key, prev: value, value: undefined });
    }
  }

  private async persist(data: Record<string, any>) {
    const file = this.app.vault.getFileByPath(this.basePath);
    if (file) {
      await this.app.vault.modify(file, JSON.stringify(data, null, 2));
    } else {
      await this.app.vault.mkpath(dirname(this.basePath));
      await this.app.vault.create(this.basePath, JSON.stringify(data, null, 2));
    }
    this.values = data;
  }

  private getPluginDataStore(values: Record<string, any>): Record<string, any> {
    const pluginData = values.pluginData;
    if (
      typeof pluginData === "object" &&
      pluginData !== null &&
      !Array.isArray(pluginData)
    ) {
      return pluginData;
    }
    return {};
  }

  private async readValuesFromDisk(): Promise<Record<string, any>> {
    const file = this.app.vault.getFileByPath(this.basePath);
    if (!file) {
      return {};
    }

    try {
      const contents = await this.app.vault.read(file);
      const data = JSON.parse(contents);
      if (typeof data === "object" && data !== null && !Array.isArray(data)) {
        return data;
      }
    } catch (error) {
      if (isRecoverableConfigurationReadError(error)) {
        return cloneDeep(this.values);
      }
      console.error(`Error loading configuration: ${this.basePath}`, error);
    }

    return {};
  }

  private emitPluginDataDiffs(
    previousValues: Record<string, any>,
    nextValues: Record<string, any>,
    origin: PluginDataUpdateOrigin,
  ): void {
    const previousPluginData = this.getPluginDataStore(previousValues);
    const nextPluginData = this.getPluginDataStore(nextValues);
    const pluginIds = new Set([
      ...Object.keys(previousPluginData),
      ...Object.keys(nextPluginData),
    ]);

    for (const pluginId of pluginIds) {
      const prev = previousPluginData[pluginId];
      const value = nextPluginData[pluginId];
      if (isEqual(prev, value)) {
        continue;
      }
      this.emit("plugin-data-updated", {
        pluginId,
        value: cloneDeep(value),
        prev: cloneDeep(prev),
        origin,
      });
    }
  }

  private watchExternalConfigChanges(): void {
    this.app.workspace?.on?.("file-change", async (file, event) => {
      if (file.path !== this.basePath || event === "delete") {
        return;
      }
      await this.reloadFromDisk({
        emitPluginDataEvents: true,
        origin: "external-reload",
      });
    });
  }

  async materializeSchemaDefaults(): Promise<void> {
    const next = { ...this.values };
    let changed = false;

    for (const [key, defaultValue] of this.schema.getDefaultEntries()) {
      if (!(key in next) || next[key] === undefined) {
        next[key] = cloneDeep(defaultValue);
        changed = true;
        continue;
      }

      try {
        const validated = this.schema.validateConfigurationOption(
          key,
          next[key],
        );
        if (!isEqual(validated, next[key])) {
          next[key] = validated;
          changed = true;
        }
      } catch (error) {
        console.warn(
          `Invalid configuration value for ${key}; restoring default.`,
          error,
        );
        next[key] = cloneDeep(defaultValue);
        changed = true;
      }
    }

    if (changed) {
      await this.persist(next);
    } else {
      this.values = next;
    }
  }
}
