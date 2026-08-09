import type { MetadataTypeDef, TypeWidget } from "@lapis-notes/api";

type WidgetProps = {
  type: MetadataTypeDef;
  value: any;
  onChange: (type: MetadataTypeDef, value: any, event: Event) => void;
};

function clear(el: HTMLElement) {
  el.replaceChildren();
}

function isTextNumberArray(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string" || typeof item === "number")
  );
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function appendInput(
  el: HTMLElement,
  attrs: Record<string, string>,
): HTMLInputElement {
  const input = document.createElement("input");
  for (const [key, value] of Object.entries(attrs)) {
    input.setAttribute(key, value);
  }
  input.dataset.uiPart = "metadata-property-input";
  el.appendChild(input);
  return input;
}

function appendTextarea(
  el: HTMLElement,
  attrs: Record<string, string>,
  text: string,
): HTMLTextAreaElement {
  const input = document.createElement("textarea");
  for (const [key, value] of Object.entries(attrs)) {
    input.setAttribute(key, value);
  }
  input.value = text;
  input.dataset.uiPart = "metadata-property-input";
  el.appendChild(input);
  return input;
}

function renderReadonlyJson(el: HTMLElement, value: unknown) {
  clear(el);
  const pre = document.createElement("pre");
  pre.dataset.uiPart = "metadata-property-json";
  pre.textContent = JSON.stringify(value, null, 2);
  el.appendChild(pre);
}

function parseCommaList(raw: string): string[] {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function renderCommaList(el: HTMLElement, props: WidgetProps) {
  clear(el);
  const current = Array.isArray(props.value)
    ? props.value.map(String).join(", ")
    : String(props.value ?? "");
  const input = appendInput(el, {
    name: props.type.name,
    type: "text",
    placeholder: "comma, separated",
    value: current,
  });
  const commit = (event: Event) => {
    const next = parseCommaList(input.value);
    props.onChange(props.type, next, event);
  };
  input.addEventListener("change", commit);
  input.addEventListener("blur", commit);
}

export const widgets: Array<TypeWidget> = [
  {
    default: () => "",
    validate: () => true,
    name: "Unknown",
    icon: "lucide-file-question",
    type: "unknown",
    render: (el, props) => {
      clear(el);
      const span = document.createElement("span");
      span.dataset.uiPart = "metadata-property-unknown";
      span.textContent = JSON.stringify(props.value);
      el.appendChild(span);
    },
  },
  {
    default: () => [],
    validate: isTextNumberArray,
    name: "Tags",
    icon: "lucide-hash",
    type: "tags",
    render: renderCommaList,
  },
  {
    default: () => [],
    validate: isTextNumberArray,
    name: "Aliases",
    icon: "lucide-at-sign",
    type: "aliases",
    render: renderCommaList,
  },
  {
    default: () => [],
    validate: isTextNumberArray,
    name: "Multi-text",
    icon: "lucide-list",
    type: "multitext",
    render: renderCommaList,
  },
  {
    default: () => [],
    validate: (value) => Array.isArray(value) && !isTextNumberArray(value),
    name: "Array",
    icon: "lucide-brackets",
    type: "array",
    render: (el, props) => renderReadonlyJson(el, props.value),
  },
  {
    default: () => ({}),
    validate: isPlainRecord,
    name: "Object",
    icon: "lucide-braces",
    type: "object",
    render: (el, props) => renderReadonlyJson(el, props.value),
  },
  {
    default: () => "",
    validate: (value) => typeof value === "string",
    name: "Text",
    icon: "lucide-text",
    type: "text",
    render: (el, props) => {
      clear(el);
      const input = appendTextarea(
        el,
        {
          name: props.type.name,
          placeholder: "Empty",
          rows: "1",
        },
        String(props.value ?? ""),
      );
      const commit = (event: Event) => {
        const next = input.value;
        if (next === String(props.value ?? "")) return;
        props.onChange(props.type, next, event);
      };
      input.addEventListener("change", commit);
      input.addEventListener("blur", commit);
    },
  },
  {
    default: (value) => +(value?.toString() ?? "0"),
    validate: (value) => typeof value === "number",
    name: "Number",
    icon: "lucide-binary",
    type: "number",
    render: (el, props) => {
      clear(el);
      const input = appendInput(el, {
        name: props.type.name,
        type: "number",
        inputmode: "decimal",
        placeholder: "Empty",
        value:
          props.value === null || props.value === undefined
            ? ""
            : String(props.value),
      });
      const commit = (event: Event) => {
        const value = input.value === "" ? undefined : Number(input.value);
        if (String(input.value) === String(props.value ?? "")) return;
        props.onChange(props.type, value, event);
      };
      input.addEventListener("change", commit);
      input.addEventListener("blur", commit);
    },
  },
  {
    default: (value) =>
      ["true", "false"].includes(value?.toString()?.toLowerCase() ?? "false"),
    validate: (value) => typeof value === "boolean",
    icon: "lucide-check-square",
    name: "Checkbox",
    type: "checkbox",
    render: (el, props) => {
      clear(el);
      const input = appendInput(el, {
        name: props.type.name,
        type: "checkbox",
      });
      input.checked = props.value?.toString()?.toLowerCase() === "true";
      input.addEventListener("change", (event) => {
        if (input.checked === props.value) return;
        props.onChange(props.type, input.checked, event);
      });
    },
  },
  {
    default: () => "",
    validate: (value) => typeof value === "string",
    name: "Date",
    icon: "lucide-calendar",
    type: "date",
    render: (el, props) => {
      clear(el);
      const input = appendInput(el, {
        name: props.type.name,
        type: "date",
        placeholder: "Empty",
        value: String(props.value ?? ""),
      });
      const commit = (event: Event) => {
        const value = input.value === "" ? undefined : input.value;
        if (input.value === props.value) return;
        props.onChange(props.type, value, event);
      };
      input.addEventListener("change", commit);
      input.addEventListener("blur", commit);
    },
  },
  {
    default: () => "",
    validate: (value) => typeof value === "string",
    name: "Date & Time",
    icon: "lucide-clock",
    type: "datetime",
    render: (el, props) => {
      clear(el);
      const raw = String(props.value ?? "");
      const localValue = raw.length >= 16 ? raw.slice(0, 16) : raw;
      const input = appendInput(el, {
        name: props.type.name,
        type: "datetime-local",
        placeholder: "Empty",
        value: localValue,
      });
      const commit = (event: Event) => {
        const value = input.value ? `${input.value}:00` : undefined;
        if (input.value === props.value) return;
        props.onChange(props.type, value, event);
      };
      input.addEventListener("change", commit);
      input.addEventListener("blur", commit);
    },
  },
];
