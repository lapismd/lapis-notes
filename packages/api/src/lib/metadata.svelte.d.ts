import type { CachedMetadata } from "./cache.svelte";
import type { App } from "./context.svelte";
import { type TFile } from "./storage";
export interface IMetadataType {
    text: "text";
    checkbox: "checkbox";
    number: "number";
    multitext: "multitext";
    date: "date";
    datetime: "datetime";
    aliases: "aliases";
    tags: "tags";
    array: "array";
    object: "object";
    unknown: "unknown";
}
export type MetadataType = keyof IMetadataType;
export interface MetadataTypeDef {
    name: string;
    type: MetadataType;
}
export interface MetadataTypeProperty extends MetadataTypeDef {
    count: number;
    files: Set<string>;
}
export interface MetadataRenameFailure {
    path: string;
    message: string;
}
export interface MetadataRenameResult {
    updatedFiles: string[];
    failedFiles: MetadataRenameFailure[];
}
export type MetadataBulkOperationFailure = MetadataRenameFailure;
export interface MetadataBulkOperationResult {
    updatedFiles: string[];
    failedFiles: MetadataBulkOperationFailure[];
}
export interface MetadataBulkOperationProgress {
    current: number;
    total: number;
    path: string;
}
export interface MetadataBulkOperationOptions {
    onProgress?: (progress: MetadataBulkOperationProgress) => void;
    signal?: AbortSignal;
}
export type TypeWidget = {
    default: (value?: unknown) => any;
    icon: string;
    name: string;
    type: MetadataType;
    validate: (value: unknown) => boolean;
    render: (el: HTMLElement, props: {
        type: MetadataTypeDef;
        value: any;
        onChange: (type: MetadataTypeDef, value: any, event: Event) => void;
    }) => void;
};
export declare class MetadataTypeManager {
    readonly app: App;
    readonly types: Record<string, MetadataTypeDef>;
    readonly registeredTypeWidgets: Record<string, TypeWidget>;
    readonly properties: Record<string, MetadataTypeProperty>;
    readonly topLevelPropertyNames: Set<string>;
    readonly propertyValues: Record<string, unknown[]>;
    propertiesLoading: boolean;
    queryError: string | null;
    constructor(app: App);
    getAllProperties(): {
        [x: string]: MetadataTypeProperty;
    };
    updateProperties(): Promise<void>;
    load(): Promise<void>;
    readonly save: import("lodash-es").DebouncedFunc<() => Promise<void> | undefined>;
    toJSON(): {
        types: Record<string, string>;
    };
    setType(field: string, type: MetadataType): void;
    registerTypeWidget(widget: TypeWidget): void;
    unregisterTypeWidget(widget: TypeWidget): void;
    private collectPropertyEntries;
    private getEntriesForFrontmatter;
    private getFrontmatterPropertyValue;
    private refreshProperty;
    private syncFileProperties;
    private getFilesForProperty;
    private getFilesForTopLevelProperty;
    private reportBulkProgress;
    private throwIfBulkCancelled;
    rename(prevId: string, newId: string): Promise<MetadataRenameResult>;
    renameProperty(files: Set<string>, prevId: string, newId: string): Promise<MetadataRenameResult>;
    renameTopLevelProperty(prevId: string, newId: string, options?: MetadataBulkOperationOptions): Promise<MetadataBulkOperationResult>;
    deleteTopLevelProperty(path: string, options?: MetadataBulkOperationOptions): Promise<MetadataBulkOperationResult>;
    deleteProperty(path: string, options?: MetadataBulkOperationOptions): Promise<MetadataBulkOperationResult>;
    setTopLevelPropertyType(path: string, type: MetadataType, options?: MetadataBulkOperationOptions): Promise<MetadataBulkOperationResult>;
    setPropertyType(path: string, type: MetadataType, options?: MetadataBulkOperationOptions): Promise<MetadataBulkOperationResult>;
    processChange(file: TFile, cache: CachedMetadata): void;
    getValues(key: string): unknown[];
    getValuesAsync(key: string, limit?: number): Promise<unknown[]>;
    processDelete(file: TFile): void;
    trackChanges(): () => void;
    reload(): void;
    determineType(value: unknown): MetadataType;
    determinePropertyType(name: string, value: unknown): MetadataType;
}
