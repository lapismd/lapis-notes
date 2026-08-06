import type { App } from "./context.svelte";
import { BaseComponent, TextComponent } from "./settings.svelte";

export type HexString = string;
export type Side = "left" | "right";

export interface CliData {
  [key: string]: string | "true";
}

export interface CliFlag {
  value?: string;
  description: string;
  required?: boolean;
}

export type CliFlags = Record<string, CliFlag>;
export type CliHandler = (params: CliData) => string | Promise<string>;

export interface ObsidianProtocolData {
  action: string;
  [key: string]: string | "true";
}

export type ObsidianProtocolHandler = (params: ObsidianProtocolData) => unknown;

export const moment: any =
  (globalThis as any).moment ??
  ((value?: unknown) => {
    return value;
  });

export class SecretComponent extends BaseComponent {
  private readonly input: TextComponent;

  constructor(
    readonly app: App,
    containerEl: HTMLElement,
  ) {
    super();
    this.input = new TextComponent(containerEl);
    this.input.setType("password");
  }

  get disabled(): boolean {
    return this.input.disabled;
  }

  setDisabled(disabled: boolean): this {
    this.input.setDisabled(disabled);
    return this;
  }

  setValue(value: string): this {
    this.input.setValue(value);
    return this;
  }

  onChange(cb: (value: string) => unknown): this {
    this.input.onChange(cb);
    return this;
  }
}
