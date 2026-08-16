const MAX_DURABLE_FIELD_BYTES = 64 * 1024;
const REDACTED = "[REDACTED]";
const TRUNCATION_MARKER = "\n...[truncated]";
const SENSITIVE_KEY =
  /^(?:authorization|cookie|credentials?|env(?:ironment)?|password|private[_-]?key|secret|token|access[_-]?token|refresh[_-]?token|api[_-]?key)$/iu;

export type DurableSanitizationOptions = {
  vaultRoot?: string;
  workspaceRoot?: string;
  knownSecrets?: Iterable<string>;
};

export type SanitizedDurableField = {
  text?: string;
  redacted: boolean;
  truncated: boolean;
};

function sanitizeStructure(
  value: unknown,
  state: { redacted: boolean },
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeStructure(item, state));
  }
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (SENSITIVE_KEY.test(key)) {
        output[key] = REDACTED;
        state.redacted = true;
      } else {
        output[key] = sanitizeStructure(nested, state);
      }
    }
    return output;
  }
  return value;
}

function stringify(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function replaceAllLiteral(value: string, needle: string, replacement: string) {
  return needle ? value.split(needle).join(replacement) : value;
}

function truncateUtf8(value: string): { text: string; truncated: boolean } {
  const encoded = new TextEncoder().encode(value);
  if (encoded.byteLength <= MAX_DURABLE_FIELD_BYTES) {
    return { text: value, truncated: false };
  }
  const marker = new TextEncoder().encode(TRUNCATION_MARKER);
  const slice = encoded.slice(0, MAX_DURABLE_FIELD_BYTES - marker.byteLength);
  return {
    text: `${new TextDecoder().decode(slice)}${TRUNCATION_MARKER}`,
    truncated: true,
  };
}

export function sanitizeDurableField(
  value: unknown,
  options: DurableSanitizationOptions = {},
): SanitizedDurableField {
  const state = { redacted: false };
  const structured = sanitizeStructure(value, state);
  const initialText = stringify(structured);
  if (initialText == null) {
    return { redacted: state.redacted, truncated: false };
  }
  let text: string = initialText;

  const replacements: Array<[string | undefined, string]> = [
    [options.vaultRoot, "<vault>"],
    [options.workspaceRoot, "<workspace>"],
  ];
  for (const [root, replacement] of replacements) {
    if (root && text.includes(root)) {
      text = replaceAllLiteral(text, root, replacement);
      state.redacted = true;
    }
  }
  for (const secret of options.knownSecrets ?? []) {
    if (secret && text.includes(secret)) {
      text = replaceAllLiteral(text, secret, REDACTED);
      state.redacted = true;
    }
  }

  const patterns: RegExp[] = [
    /-----BEGIN [^-]+ PRIVATE KEY-----[\s\S]*?-----END [^-]+ PRIVATE KEY-----/giu,
    /\bBearer\s+[A-Za-z0-9._~+/=-]+/giu,
    /\b(?:api[_-]?key|password|secret|token)\s*[:=]\s*[^\s,;]+/giu,
    /\bCookie\s*:\s*[^\r\n]+/giu,
  ];
  for (const pattern of patterns) {
    const replaced = text.replace(pattern, REDACTED);
    if (replaced !== text) state.redacted = true;
    text = replaced;
  }

  const truncated = truncateUtf8(text);
  return {
    text: truncated.text,
    redacted: state.redacted,
    truncated: truncated.truncated,
  };
}

export { MAX_DURABLE_FIELD_BYTES };
