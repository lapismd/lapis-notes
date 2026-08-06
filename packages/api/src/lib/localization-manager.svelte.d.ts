export interface LocaleData {
    [key: string]: string | LocaleData;
}
export interface I18nConfig {
    defaultLocale: string;
    locales: string[];
    fallbackLocale?: string;
    interpolation?: {
        prefix?: string;
        suffix?: string;
        escapeValue?: boolean;
    };
    debug?: boolean;
}
type TranslateArgs = [namespace: string, key: string, params?: Record<string, string | number>] | [key: string, params?: Record<string, string | number>];
export declare class LocalizationManager {
    private currentLocale;
    private initialized;
    private availableLocales;
    constructor();
    get locale(): string;
    get locales(): string[];
    get instance(): import("i18next").i18n;
    private initializeI18next;
    setConfig(config: Partial<I18nConfig>): Promise<void>;
    setLocale(locale: string): Promise<void>;
    addResourceBundle(ns: string, locale: string, translations: LocaleData, deep?: boolean, overwrite?: boolean): Promise<() => void>;
    private extractParams;
    t(namespace: string, key: string, params?: Record<string, string | number>): string;
    t(namespace: string, key: string): string;
    t(key: string, params?: Record<string, string | number>): string;
    t(...args: TranslateArgs): string;
    plural(count: number, namespace: string, key: string, params?: Record<string, string | number>): string;
    plural(count: number, namespace: string, key: string): string;
    plural(count: number, key: string, params?: Record<string, string | number>): string;
    plural(count: number, ...args: TranslateArgs): string;
    exists(key: string, locale?: string, namespace?: string): boolean;
}
declare const localeManager: LocalizationManager;
declare const t: {
    (namespace: string, key: string, params?: Record<string, string | number>): string;
    (namespace: string, key: string): string;
    (key: string, params?: Record<string, string | number>): string;
    (...args: TranslateArgs): string;
};
declare const plural: {
    (count: number, namespace: string, key: string, params?: Record<string, string | number>): string;
    (count: number, namespace: string, key: string): string;
    (count: number, key: string, params?: Record<string, string | number>): string;
    (count: number, ...args: TranslateArgs): string;
};
export declare function useLocale(namespace?: string): {
    t(key: string, params?: Record<string, string | number>): string;
    plural(key: string, count: number, params?: Record<string, string | number>): string;
};
export { localeManager, localeManager as i18n, t, plural };
