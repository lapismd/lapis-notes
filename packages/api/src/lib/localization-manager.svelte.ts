import i18next, { type InitOptions } from "i18next";

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

type TranslateArgs =
  | [namespace: string, key: string, params?: Record<string, string | number>]
  | [key: string, params?: Record<string, string | number>];

export class LocalizationManager {
  private currentLocale = $state("en");
  private initialized = false;
  private availableLocales = $state<string[]>(["en"]);

  constructor() {
    this.initializeI18next();
  }

  get locale() {
    return this.currentLocale;
  }

  get locales() {
    return this.availableLocales;
  }

  get instance() {
    return i18next;
  }

  private async initializeI18next() {
    const config: InitOptions = {
      lng: "en",
      fallbackLng: "en",
      debug: false,
      interpolation: {
        escapeValue: false,
        prefix: "{{",
        suffix: "}}",
      },
      resources: {},
      defaultNS: "base",
      ns: ["base"],
      returnEmptyString: false,
      returnNull: false,
      returnObjects: false,
      keySeparator: ".",
      nsSeparator: ":",
    };

    await i18next.init(config);
    this.initialized = true;
    this.currentLocale = i18next.language;
  }

  async setConfig(config: Partial<I18nConfig>) {
    if (!this.initialized) {
      await this.initializeI18next();
    }

    const i18nextConfig: Partial<InitOptions> = {
      lng: config.defaultLocale,
      fallbackLng: config.fallbackLocale || config.defaultLocale,
      debug: config.debug || false,
      interpolation: config.interpolation
        ? {
            escapeValue: config.interpolation.escapeValue ?? false,
            prefix: config.interpolation.prefix || "{{",
            suffix: config.interpolation.suffix || "}}",
          }
        : undefined,
    };

    await i18next.init(i18nextConfig);

    if (config.locales) {
      this.availableLocales = config.locales;
    }

    if (config.defaultLocale) {
      this.currentLocale = config.defaultLocale;
    }
  }

  async setLocale(locale: string) {
    if (!this.availableLocales.includes(locale)) {
      console.warn(
        `Locale ${locale} not supported. Available locales: ${this.availableLocales.join(", ")}`,
      );
      return;
    }

    await i18next.changeLanguage(locale);
    this.currentLocale = locale;
  }

  async addResourceBundle(
    ns: string,
    locale: string,
    translations: LocaleData,
    deep: boolean = true,
    overwrite: boolean = true,
  ) {
    if (!this.initialized) {
      await this.initializeI18next();
    }
    i18next.addResourceBundle(locale, ns, translations, deep, overwrite);
    return () => {
      i18next.removeResourceBundle(locale, ns);
      const currentNamespaces = i18next.options.ns as string[];
      i18next.options.ns = currentNamespaces.filter(
        (namespace) => namespace !== ns,
      );
    };
  }

  private extractParams(
    ...args: TranslateArgs
  ): [
    key: string,
    namespace: string | undefined,
    params: Record<string, string | number> | undefined,
  ] {
    let key: string;
    let namespace: string | undefined;
    let params: Record<string, string | number> | undefined;

    if (typeof args[0] !== "string") {
      throw new Error("Expected a string as the first argument in i18n.t");
    }

    if (args.length === 3) {
      if (typeof args[1] !== "string") {
        throw new Error(
          "Expected a string as the second argument for key in i18n.t",
        );
      }
      namespace = args[0];
      key = args[1];
      params = args[2];
    } else if (args.length == 2) {
      if (typeof args[1] === "string") {
        namespace = args[0];
        key = args[1];
      } else if (typeof args[1] === "object") {
        key = args[0];
        params = args[1];
      } else {
        throw new Error(
          "Expected a string | object as the second argument in i18n.t",
        );
      }
    } else {
      key = args[0];
    }
    return [key, namespace, params];
  }

  t(
    namespace: string,
    key: string,
    params?: Record<string, string | number>,
  ): string;
  t(namespace: string, key: string): string;
  t(key: string, params?: Record<string, string | number>): string;
  t(...args: TranslateArgs): string;
  t(...args: TranslateArgs): string {
    const [key, namespace, params] = this.extractParams(...args);
    const id = namespace ? `${namespace}:${key}` : key;
    const options = params ? { ...params } : {};
    const translation = i18next.t(id, options);
    return translation || key;
  }

  plural(
    count: number,
    namespace: string,
    key: string,
    params?: Record<string, string | number>,
  ): string;
  plural(count: number, namespace: string, key: string): string;
  plural(
    count: number,
    key: string,
    params?: Record<string, string | number>,
  ): string;
  plural(count: number, ...args: TranslateArgs): string;
  plural(count: number, ...args: TranslateArgs): string {
    const [key, namespace, params] = this.extractParams(...args);
    if (!this.initialized) {
      console.warn("i18n not initialized yet");
      return key;
    }

    const id = namespace ? `${namespace}:${key}` : key;
    const options = { count, ...params };

    const translation = i18next.t(id, options);
    return translation || key;
  }

  exists(key: string, locale?: string, namespace?: string): boolean {
    if (!this.initialized) {
      return false;
    }

    const id = namespace ? `${namespace}:${key}` : key;
    const targetLocale = locale || this.currentLocale;

    return i18next.exists(id, { lng: targetLocale });
  }
}

const localeManager = new LocalizationManager();
const t = localeManager.t.bind(localeManager);
const plural = localeManager.plural.bind(localeManager);

export function useLocale(namespace: string = "base") {
  return {
    t(key: string, params?: Record<string, string | number>) {
      return t(namespace, key, params);
    },
    plural(
      key: string,
      count: number,
      params?: Record<string, string | number>,
    ) {
      return plural(count, namespace, key, params);
    },
  };
}

export { localeManager, localeManager as i18n, t, plural };
