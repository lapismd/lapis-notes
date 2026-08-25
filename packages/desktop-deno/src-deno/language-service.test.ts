import { describe, expect, it } from "vitest";

import {
  DENO_LANGUAGE_SERVICE_PROTOCOL_VERSION,
  handleLanguageService,
  sanitizeVirtualDocument,
} from "./language-service";

const document = {
  uri: "vault://Note.md",
  languageId: "markdown",
  text: "#Heading\n",
  version: 1,
};

describe("Deno Markdown language service", () => {
  it("runs markdownlint diagnostics in the Deno-owned runtime", () => {
    expect(
      handleLanguageService("desktop_ls_capabilities", {
        protocolVersion: DENO_LANGUAGE_SERVICE_PROTOCOL_VERSION,
      }),
    ).toEqual({ markdown: true, protocolVersion: 1 });
    const diagnostics = handleLanguageService("desktop_ls_diagnostics", {
      protocolVersion: DENO_LANGUAGE_SERVICE_PROTOCOL_VERSION,
      document,
    });
    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "markdownlint", code: "MD018" }),
      ]),
    );
  });

  it("applies renderer-provided disabled rules", () => {
    const longLineDocument = {
      ...document,
      text:
        "The cheapest loft stilts are plastic raised joist extensions that cost more than eighty characters.\n",
    };
    const enabled = handleLanguageService("desktop_ls_diagnostics", {
      protocolVersion: DENO_LANGUAGE_SERVICE_PROTOCOL_VERSION,
      document: longLineDocument,
    }) as Array<{ code?: string }>;
    const disabled = handleLanguageService("desktop_ls_diagnostics", {
      protocolVersion: DENO_LANGUAGE_SERVICE_PROTOCOL_VERSION,
      document: longLineDocument,
      rules: { MD013: false },
    }) as Array<{ code?: string }>;

    expect(enabled.some((diagnostic) => diagnostic.code === "MD013")).toBe(true);
    expect(disabled.some((diagnostic) => diagnostic.code === "MD013")).toBe(false);
  });

  it("rejects invalid protocols and unbounded documents", () => {
    expect(() =>
      handleLanguageService("desktop_ls_diagnostics", {
        protocolVersion: 2,
        document,
      }),
    ).toThrow(/unsupported protocol/u);
    expect(() =>
      sanitizeVirtualDocument({ ...document, languageId: "typescript" }),
    ).toThrow(/invalid Markdown document bounds/u);
  });
});
