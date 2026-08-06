import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addIcon,
  getIcon,
  getSvg,
  isIconAvailable,
  isLabelIconAvailable,
  parseCodiconLabel,
  removeIcon,
} from "../icons";

const ICON_ID = "lapis-notebook-run-all";
const INPUT_SVG = `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M5 4v16" />
    <path d="M9 6v12l10-6-10-6z" />
  </svg>
`;

type FakeElement = {
  innerHTML: string;
  firstElementChild: { outerHTML: string } | null;
};

function extractSvgShape(markup: string | null) {
  return {
    viewBox: markup?.match(/viewBox="([^"]+)"/)?.[1] ?? null,
    paths: [...(markup?.matchAll(/<path d="([^"]+)"/g) ?? [])].map(
      (match) => match[1],
    ),
  };
}

describe("icons", () => {
  const originalDocument = globalThis.document;

  beforeEach(() => {
    globalThis.document = {
      createElement() {
        let markup = "";
        const element: FakeElement = {
          get innerHTML() {
            return markup;
          },
          set innerHTML(value: string) {
            markup = value;
            this.firstElementChild = { outerHTML: value };
          },
          firstElementChild: null,
        };

        return element;
      },
    } as unknown as Document;
    removeIcon(ICON_ID);
  });

  afterEach(() => {
    removeIcon(ICON_ID);
    globalThis.document = originalDocument;
  });

  it("round-trips hyphenated custom icons through getSvg and getIcon", async () => {
    addIcon(ICON_ID, INPUT_SVG);

    await expect(isIconAvailable(ICON_ID)).resolves.toBe(true);
    await expect(isIconAvailable(`custom:${ICON_ID}`)).resolves.toBe(true);

    const fromGetIcon = extractSvgShape(getIcon(ICON_ID)?.outerHTML ?? null);
    const fromPrefixedGetIcon = extractSvgShape(
      getIcon(`custom:${ICON_ID}`)?.outerHTML ?? null,
    );
    const fromGetSvg = extractSvgShape(await getSvg(ICON_ID));
    const fromInput = extractSvgShape(INPUT_SVG);

    expect(fromGetIcon).toEqual(fromInput);
    expect(fromPrefixedGetIcon).toEqual(fromInput);
    expect(fromGetSvg).toEqual(fromInput);
  });

  it("parses codicon label text into text and codicon segments", () => {
    expect(parseCodiconLabel("Run $(play) notebook")).toEqual([
      { type: "text", text: "Run " },
      { type: "codicon", name: "play", raw: "$(play)" },
      { type: "text", text: " notebook" },
    ]);
  });

  it("supports the spin modifier for codicon tokens", () => {
    expect(parseCodiconLabel("Sync $(sync~spin)")).toEqual([
      { type: "text", text: "Sync " },
      {
        type: "codicon",
        name: "sync",
        raw: "$(sync~spin)",
        modifier: "spin",
      },
    ]);
  });

  it("parses qualified registry icon tokens", () => {
    expect(parseCodiconLabel("Open $(lucide:file-text) now")).toEqual([
      { type: "text", text: "Open " },
      {
        type: "icon",
        name: "lucide:file-text",
        raw: "$(lucide:file-text)",
      },
      { type: "text", text: " now" },
    ]);

    expect(parseCodiconLabel("Save $(vscode-icons:file-type-json)")).toEqual([
      { type: "text", text: "Save " },
      {
        type: "icon",
        name: "vscode-icons:file-type-json",
        raw: "$(vscode-icons:file-type-json)",
      },
    ]);
  });

  it("supports spin on qualified registry icon tokens", () => {
    expect(parseCodiconLabel("Busy $(lucide:loader-circle~spin)")).toEqual([
      { type: "text", text: "Busy " },
      {
        type: "icon",
        name: "lucide:loader-circle",
        raw: "$(lucide:loader-circle~spin)",
        modifier: "spin",
      },
    ]);
  });

  it("keeps syntactically valid codicon tokens intact for renderer fallback", () => {
    expect(parseCodiconLabel("Open $(not-a-real-codicon) now")).toEqual([
      { type: "text", text: "Open " },
      {
        type: "codicon",
        name: "not-a-real-codicon",
        raw: "$(not-a-real-codicon)",
      },
      { type: "text", text: " now" },
    ]);

    expect(parseCodiconLabel("Sync $(sync~pulse)")).toEqual([
      { type: "text", text: "Sync " },
      { type: "text", text: "$(sync~pulse)" },
    ]);
  });

  it("treats malformed qualified tokens as literal text", () => {
    expect(parseCodiconLabel("Bad $(bad:) token")).toEqual([
      { type: "text", text: "Bad " },
      { type: "text", text: "$(bad:)" },
      { type: "text", text: " token" },
    ]);
  });

  it("caches label icon availability lookups", async () => {
    addIcon(ICON_ID, INPUT_SVG);

    const first = isLabelIconAvailable(ICON_ID);
    const second = isLabelIconAvailable(ICON_ID);

    expect(first).toBe(second);
    await expect(first).resolves.toBe(true);
  });
});
