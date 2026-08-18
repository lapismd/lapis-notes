import { afterEach, describe, expect, it } from "vitest";
import { installWorkerEntityDecoderDocumentShim } from "../workers/worker-entity-decoder";

describe("markdownlint worker document shim", () => {
  const workerGlobal = globalThis as unknown as {
    document?: { compatMode?: string };
  };
  const previous = workerGlobal.document;

  afterEach(() => {
    if (previous === undefined) {
      delete workerGlobal.document;
    } else {
      Object.defineProperty(workerGlobal, "document", {
        configurable: true,
        value: previous,
      });
    }
  });

  it("reports standards-mode compatMode so KaTeX does not treat the worker as quirks", () => {
    delete workerGlobal.document;
    installWorkerEntityDecoderDocumentShim();
    expect(workerGlobal.document?.compatMode).toBe("CSS1Compat");
  });
});
