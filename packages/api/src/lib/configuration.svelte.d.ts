import { z } from "zod";
import type { App } from "./context.svelte";
import { SettingTab } from "./settings.svelte";
import { EventDispatcher } from "./events";
type PluginDataUpdateOrigin = "plugin-save" | "configuration-update" | "external-reload";
type PluginDataUpdateEvent = {
    pluginId: string;
    value: any;
    prev: any;
    origin: PluginDataUpdateOrigin;
};
export type StringType = {
    type: "string";
    editPresentation?: "multilineText";
    format?: string;
    optionsSource?: string;
    allowUnknownOptions?: boolean;
    default?: string;
    title?: string;
    description?: string;
    markdownDescription?: string;
    order?: number;
    deprecationMessage?: string;
    markdownDeprecationMessage?: string;
};
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
    deprecationMessage?: string;
    markdownDeprecationMessage?: string;
};
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
export type CustomType = {
    type: "custom";
    component: SettingTab;
    title?: string;
    description?: string;
    markdownDescription?: string;
};
export type SchemaType = StringType | NumberType | IntegerType | EnumType | BooleanType | ObjectType | CustomType | ArrayType;
export declare function isFlatPrimitiveObjectSchema(schema: ObjectType): boolean;
export declare function isRecordObjectSchema(schema: ObjectType): boolean;
export declare function isPrimitiveArraySchema(schema: ArrayType): boolean;
declare const configurationType: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    $schema: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    type: z.ZodLiteral<"object">;
    properties: z.ZodRecord<z.ZodString, z.ZodLazy<z.ZodType<SchemaType, z.ZodTypeDef, SchemaType>>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    type: "object";
    properties: Record<string, SchemaType>;
    id?: string | undefined;
    $schema?: string | undefined;
}, {
    title: string;
    type: "object";
    properties: Record<string, SchemaType>;
    id?: string | undefined;
    $schema?: string | undefined;
}>;
export declare const configType: z.ZodLazy<z.ZodType<SchemaType, z.ZodTypeDef, SchemaType>>;
export type ConfigurationType = z.infer<typeof configurationType>;
export declare const constributesType: z.ZodUnion<[z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    $schema: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    type: z.ZodLiteral<"object">;
    properties: z.ZodRecord<z.ZodString, z.ZodLazy<z.ZodType<SchemaType, z.ZodTypeDef, SchemaType>>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    type: "object";
    properties: Record<string, SchemaType>;
    id?: string | undefined;
    $schema?: string | undefined;
}, {
    title: string;
    type: "object";
    properties: Record<string, SchemaType>;
    id?: string | undefined;
    $schema?: string | undefined;
}>, z.ZodArray<z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    $schema: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    type: z.ZodLiteral<"object">;
    properties: z.ZodRecord<z.ZodString, z.ZodLazy<z.ZodType<SchemaType, z.ZodTypeDef, SchemaType>>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    type: "object";
    properties: Record<string, SchemaType>;
    id?: string | undefined;
    $schema?: string | undefined;
}, {
    title: string;
    type: "object";
    properties: Record<string, SchemaType>;
    id?: string | undefined;
    $schema?: string | undefined;
}>, "many">]>;
export type ContributesType = z.infer<typeof constributesType>;
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
export type ConfigurationSchemaType = SchemaType & {
    configId: string;
    category: string;
    categoryId: string;
    groupPath?: ConfigurationGroupType[];
};
export declare class ConfigurationSchema extends EventDispatcher<{
    updated: [{
        key: string;
        value: any;
        prev?: any;
    }];
}> {
    private values;
    constructor();
    getConfiguration(section?: string): WorkspaceConfiguration;
    getDefinition(key: string): ConfigurationSchemaType | undefined;
    validateConfigurationOption(key: string, value: unknown): unknown;
    getDefaultEntries(): [string, unknown][];
    register(...schemas: any[]): void;
    unregister(...schemas: any[]): void;
    removeWebView(id: string): void;
    registerWebView(id: string, title: string, component: SettingTab): void;
    updateConfigurationOption(key: string, value: any): Promise<void>;
    removeConfigurationOption(key: string): Promise<void>;
}
export declare class Configuration extends EventDispatcher<{
    updated: [{
        key: string;
        value: any;
        prev: any;
    }];
    "plugin-data-updated": [event: PluginDataUpdateEvent];
}> {
    readonly app: App;
    readonly basePath: string;
    private values;
    readonly schema: ConfigurationSchema;
    constructor(app: App, basePath: string);
    load(): Promise<void>;
    hasPluginData(pluginId: string): boolean;
    getPluginData<T = any>(pluginId: string): T | null;
    updatePluginData(pluginId: string, value: any, options?: {
        origin?: PluginDataUpdateOrigin;
    }): Promise<void>;
    removePluginData(pluginId: string, options?: {
        origin?: PluginDataUpdateOrigin;
    }): Promise<void>;
    reloadFromDisk(options?: {
        emitPluginDataEvents?: boolean;
        origin?: PluginDataUpdateOrigin;
    }): Promise<void>;
    getConfiguration(section?: string): WorkspaceConfiguration;
    updateConfigurationOption(key: string, value: any): Promise<void>;
    removeConfigurationOption(key: string): Promise<void>;
    private persist;
    private getPluginDataStore;
    private readValuesFromDisk;
    private emitPluginDataDiffs;
    private watchExternalConfigChanges;
    materializeSchemaDefaults(): Promise<void>;
}
export {};
