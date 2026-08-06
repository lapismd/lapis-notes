import type { Component } from "svelte";

export declare const DatePicker: Component<{
  value?: string | undefined;
  ariaLabel?: string;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  error?: string | null;
  locale?: string;
  onValueChange?: (value: string | undefined) => void;
}>;

export declare const TimePicker: Component<{
  value?: string | undefined;
  ariaLabel?: string;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  error?: string | null;
  onValueChange?: (value: string | undefined) => void;
}>;
