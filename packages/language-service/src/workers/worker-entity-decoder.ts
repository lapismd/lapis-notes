import { characterEntities } from "character-entities";

type EntityDecoderElement = {
  innerHTML: string;
  readonly textContent: string;
};

/**
 * Unified's entity decoder selects its DOM implementation under a browser
 * export condition, even when Vite is compiling a Web Worker. Provide the
 * single element contract that implementation needs before markdownlint is
 * loaded, without introducing a real DOM dependency into the worker.
 */
export function installWorkerEntityDecoderDocumentShim(): void {
  const workerGlobal = globalThis as unknown as Record<string, unknown>;
  if (workerGlobal.document) return;

  const documentShim = {
    compatMode: "CSS1Compat",
    createElement(): EntityDecoderElement {
      let decodedText = "";
      return {
        set innerHTML(value: string) {
          const match = /^&([^;]+);$/u.exec(value);
          decodedText = match
            ? (characterEntities[match[1] as keyof typeof characterEntities] ??
              value)
            : value;
        },
        get innerHTML() {
          return decodedText;
        },
        get textContent() {
          return decodedText;
        },
      };
    },
  };
  Object.defineProperty(workerGlobal, "document", {
    configurable: true,
    value: documentShim,
  });
}
