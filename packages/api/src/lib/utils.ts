import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const apiVersion = "1.12.3";

export interface Debouncer<T extends unknown[], V> {
  (...args: [...T]): this;
  cancel(): this;
  run(): V | void;
}

export function debounce<T extends unknown[], V>(
  cb: (...args: [...T]) => V,
  timeout: number = 0,
  resetTimer: boolean = true,
): Debouncer<T, V> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: T | null = null;
  let lastThis: unknown;

  const clear = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const invoke = (): V | void => {
    if (!lastArgs) return;
    const args = lastArgs;
    const thisArg = lastThis;
    lastArgs = null;
    lastThis = undefined;
    clear();
    return cb.apply(thisArg, args);
  };

  const debounced = function (this: unknown, ...args: T) {
    lastArgs = args;
    lastThis = this;
    if (resetTimer || timer === null) {
      clear();
      timer = setTimeout(invoke, timeout);
    }
    return debounced;
  } as Debouncer<T, V>;

  debounced.cancel = () => {
    clear();
    lastArgs = null;
    lastThis = undefined;
    return debounced;
  };

  debounced.run = () => invoke();

  return debounced;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx("mod-tw", inputs));
}

export function uniqueId(salt: string = "") {
  return md5(`${salt}:${Date.now().toString(36) + Math.random().toString(36)}`);
}

export function md5(inputString: string): string {
  const hc = "0123456789abcdef";

  function rh(n: number): string {
    let s = "";
    for (let j = 0; j <= 3; j++) {
      s +=
        hc.charAt((n >> (j * 8 + 4)) & 0x0f) + hc.charAt((n >> (j * 8)) & 0x0f);
    }
    return s;
  }

  function ad(x: number, y: number): number {
    const l = (x & 0xffff) + (y & 0xffff);
    const m = (x >> 16) + (y >> 16) + (l >> 16);
    return (m << 16) | (l & 0xffff);
  }

  function rl(n: number, c: number): number {
    return (n << c) | (n >>> (32 - c));
  }

  function cm(
    q: number,
    a: number,
    b: number,
    x: number,
    s: number,
    t: number,
  ): number {
    return ad(rl(ad(ad(a, q), ad(x, t)), s), b);
  }

  function ff(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number,
  ): number {
    return cm((b & c) | (~b & d), a, b, x, s, t);
  }

  function gg(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number,
  ): number {
    return cm((b & d) | (c & ~d), a, b, x, s, t);
  }

  function hh(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number,
  ): number {
    return cm(b ^ c ^ d, a, b, x, s, t);
  }

  function ii(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number,
  ): number {
    return cm(c ^ (b | ~d), a, b, x, s, t);
  }

  function sb(x: string): number[] {
    const nblk = ((x.length + 8) >> 6) + 1;
    const blks: number[] = Array(nblk * 16).fill(0);

    for (let i = 0; i < x.length; i++) {
      blks[i >> 2] |= x.charCodeAt(i) << ((i % 4) * 8);
    }
    blks[x.length >> 2] |= 0x80 << ((x.length % 4) * 8);
    blks[nblk * 16 - 2] = x.length * 8;

    return blks;
  }

  const x = sb(inputString);
  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < x.length; i += 16) {
    const olda = a;
    const oldb = b;
    const oldc = c;
    const oldd = d;

    a = ff(a, b, c, d, x[i + 0], 7, -680876936);
    d = ff(d, a, b, c, x[i + 1], 12, -389564586);
    c = ff(c, d, a, b, x[i + 2], 17, 606105819);
    b = ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = ff(a, b, c, d, x[i + 4], 7, -176418897);
    d = ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = ff(c, d, a, b, x[i + 6], 17, -1473231341);
    b = ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = ff(a, b, c, d, x[i + 8], 7, 1770035416);
    d = ff(d, a, b, c, x[i + 9], 12, -1958414417);
    c = ff(c, d, a, b, x[i + 10], 17, -42063);
    b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = ff(a, b, c, d, x[i + 12], 7, 1804603682);
    d = ff(d, a, b, c, x[i + 13], 12, -40341101);
    c = ff(c, d, a, b, x[i + 14], 17, -1502002290);
    b = ff(b, c, d, a, x[i + 15], 22, 1236535329);
    a = gg(a, b, c, d, x[i + 1], 5, -165796510);
    d = gg(d, a, b, c, x[i + 6], 9, -1069501632);
    c = gg(c, d, a, b, x[i + 11], 14, 643717713);
    b = gg(b, c, d, a, x[i + 0], 20, -373897302);
    a = gg(a, b, c, d, x[i + 5], 5, -701558691);
    d = gg(d, a, b, c, x[i + 10], 9, 38016083);
    c = gg(c, d, a, b, x[i + 15], 14, -660478335);
    b = gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = gg(a, b, c, d, x[i + 9], 5, 568446438);
    d = gg(d, a, b, c, x[i + 14], 9, -1019803690);
    c = gg(c, d, a, b, x[i + 3], 14, -187363961);
    b = gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = gg(a, b, c, d, x[i + 13], 5, -1444681467);
    d = gg(d, a, b, c, x[i + 2], 9, -51403784);
    c = gg(c, d, a, b, x[i + 7], 14, 1735328473);
    b = gg(b, c, d, a, x[i + 12], 20, -1926607734);
    a = hh(a, b, c, d, x[i + 5], 4, -378558);
    d = hh(d, a, b, c, x[i + 8], 11, -2022574463);
    c = hh(c, d, a, b, x[i + 11], 16, 1839030562);
    b = hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = hh(a, b, c, d, x[i + 1], 4, -1530992060);
    d = hh(d, a, b, c, x[i + 4], 11, 1272893353);
    c = hh(c, d, a, b, x[i + 7], 16, -155497632);
    b = hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = hh(a, b, c, d, x[i + 13], 4, 681279174);
    d = hh(d, a, b, c, x[i + 0], 11, -358537222);
    c = hh(c, d, a, b, x[i + 3], 16, -722521979);
    b = hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = hh(a, b, c, d, x[i + 9], 4, -640364487);
    d = hh(d, a, b, c, x[i + 12], 11, -421815835);
    c = hh(c, d, a, b, x[i + 15], 16, 530742520);
    b = hh(b, c, d, a, x[i + 2], 23, -995338651);
    a = ii(a, b, c, d, x[i + 0], 6, -198630844);
    d = ii(d, a, b, c, x[i + 7], 10, 1126891415);
    c = ii(c, d, a, b, x[i + 14], 15, -1416354905);
    b = ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = ii(a, b, c, d, x[i + 12], 6, 1700485571);
    d = ii(d, a, b, c, x[i + 3], 10, -1894986606);
    c = ii(c, d, a, b, x[i + 10], 15, -1051523);
    b = ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = ii(a, b, c, d, x[i + 8], 6, 1873313359);
    d = ii(d, a, b, c, x[i + 15], 10, -30611744);
    c = ii(c, d, a, b, x[i + 6], 15, -1560198380);
    b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = ii(a, b, c, d, x[i + 4], 6, -145523070);
    d = ii(d, a, b, c, x[i + 11], 10, -1120210379);
    c = ii(c, d, a, b, x[i + 2], 15, 718787259);
    b = ii(b, c, d, a, x[i + 9], 21, -343485551);

    a = ad(a, olda);
    b = ad(b, oldb);
    c = ad(c, oldc);
    d = ad(d, oldd);
  }

  return rh(a) + rh(b) + rh(c) + rh(d);
}

export function requireApiVersion(version: string): boolean {
  const current = apiVersion.split(".").map(Number);
  const required = version.split(".").map(Number);
  for (let i = 0; i < Math.max(current.length, required.length); i++) {
    const a = current[i] ?? 0;
    const b = required[i] ?? 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return true;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function arrayBufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes.buffer;
}

export function getBlobArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return blob.arrayBuffer();
}

export interface RequestUrlParam {
  url: string;
  method?: string;
  body?: string | ArrayBuffer;
  headers?: Record<string, string>;
  contentType?: string;
  throw?: boolean;
}

export interface RequestUrlResponse {
  status: number;
  headers: Record<string, string>;
  arrayBuffer: ArrayBuffer;
  json: any;
  text: string;
}

export type RequestUrlResponsePromise = Promise<RequestUrlResponse>;

export async function requestUrl(
  request: RequestUrlParam | string,
): RequestUrlResponsePromise {
  const params = typeof request === "string" ? { url: request } : request;
  const headers = new Headers(params.headers);
  if (params.contentType) {
    headers.set("content-type", params.contentType);
  }
  const response = await fetch(params.url, {
    method: params.method,
    headers,
    body: params.body as BodyInit | undefined,
  });
  if (params.throw !== false && !response.ok) {
    throw new Error(
      `Request failed: ${response.status} ${response.statusText}`,
    );
  }
  const arrayBuffer = await response.arrayBuffer();
  const text = new TextDecoder().decode(arrayBuffer);
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {}
  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    arrayBuffer,
    json,
    text,
  };
}

export function request(request: RequestUrlParam | string): Promise<string> {
  return requestUrl(request).then((response) => response.text);
}

export interface LinktextParts {
  path: string;
  subpath?: string;
}

export function parseLinktext(linktext: string): LinktextParts {
  const [path, ...subpath] = linktext.split("#");
  return {
    path,
    subpath: subpath.length ? `#${subpath.join("#")}` : undefined,
  };
}

export function getLinkpath(linktext: string): string {
  return parseLinktext(linktext).path;
}

export function stripHeading(heading: string): string {
  return heading.replace(/^#+\s*/, "").trim();
}

export function stripHeadingForLink(heading: string): string {
  return stripHeading(heading)
    .replace(/[[\]#|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseYaml(yaml: string): any {
  const result: Record<string, any> = {};
  for (const line of yaml.split(/\r?\n/)) {
    const match = /^([^:#][^:]*):\s*(.*)$/.exec(line);
    if (!match) continue;
    const value = match[2].trim();
    if (value === "true" || value === "false") {
      result[match[1].trim()] = value === "true";
    } else if (/^-?\d+(\.\d+)?$/.test(value)) {
      result[match[1].trim()] = Number(value);
    } else if (value.startsWith("[") && value.endsWith("]")) {
      result[match[1].trim()] = value
        .slice(1, -1)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    } else {
      result[match[1].trim()] = value.replace(/^['"]|['"]$/g, "");
    }
  }
  return result;
}

export function stringifyYaml(data: Record<string, any>): string {
  return Object.entries(data)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: [${value.join(", ")}]`;
      }
      return `${key}: ${value}`;
    })
    .join("\n");
}

export function htmlToMarkdown(html: string): string {
  const el = document.createElement("div");
  el.innerHTML = html;
  return el.textContent ?? "";
}

interface TooltipOptions {
  placement?: "bottom" | "right" | "left" | "top";
  classes?: string[];
  delay?: number;
  gap?: number;
}

export function setTooltip(
  el: HTMLElement,
  tooltip: string,
  options?: TooltipOptions,
): void {
  el.dataset.tooltip = tooltip;
  el.dataset.tooltipPosition = options?.placement ?? "top";
}

export function displayTooltip(
  el: HTMLElement,
  tooltip: string,
  options?: TooltipOptions,
): void {
  setTooltip(el, tooltip, options);
}
