import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { expect, it, vi } from "vitest";
import { editorViewField } from "../editor.svelte";
import { LanguageServiceManager } from "../language-service/manager";
import { languageServiceExtensions } from "../components/editor/language-service";
import {
  diagnosticCount,
  forceLinting,
} from "../components/editor/extensions/lint";

it("refreshes the unchanged editor gutter and Problems after provider readiness", async () => {
  const manager = new LanguageServiceManager();
  const published = new Map<string, unknown[]>();
  manager.bindDiagnostics({
    collection: {
      set(resource: { uri: string } | null, diagnostics: unknown[]) {
        published.set(resource?.uri ?? "", diagnostics);
      },
      delete(resource: { uri: string }) {
        published.delete(resource.uri);
      },
      clear() {
        published.clear();
      },
    } as never,
    applyCodeAction: vi.fn(),
  });
  let ready = false;
  const provideDiagnostics = vi.fn(async () =>
    ready
      ? [
          {
            message: "Misspelled word",
            severity: "error" as const,
            source: "harper",
            range: {
              start: { line: 0, character: 0 },
              end: { line: 0, character: 4 },
            },
          },
        ]
      : [],
  );
  manager.registerProvider({
    metadata: {
      id: "harper",
      languages: ["markdown"],
      runtime: "in-process",
      capabilities: { diagnostics: true },
    },
    provideDiagnostics,
  });
  const host = document.createElement("div");
  document.body.append(host);
  const view = new EditorView({
    parent: host,
    state: EditorState.create({
      doc: "goin",
      extensions: [
        editorViewField.init(
          () =>
            ({
              app: { languageServices: manager },
              file: { path: "Welcome.md", extension: "md" },
            }) as never,
        ),
        ...languageServiceExtensions({ completion: false, hover: false }),
      ],
    }),
  });
  try {
    vi.spyOn(view, "inView", "get").mockReturnValue(true);
    forceLinting(view);
    await vi.waitFor(() => expect(provideDiagnostics).toHaveBeenCalled(), {
      timeout: 2000,
    });
    expect(diagnosticCount(view.state)).toBe(0);
    ready = true;
    expect(manager.invalidateDiagnostics("harper")).toBe(true);
    await vi.waitFor(() => expect(diagnosticCount(view.state)).toBe(1), {
      timeout: 2000,
    });
    expect(published.get("vault:///Welcome.md")).toEqual([
      expect.objectContaining({ message: "Misspelled word", source: "harper" }),
    ]);
    expect(view.state.doc.toString()).toBe("goin");
    const calls = provideDiagnostics.mock.calls.length;
    view.destroy();
    manager.invalidateDiagnostics("harper");
    await Promise.resolve();
    expect(provideDiagnostics).toHaveBeenCalledTimes(calls);
  } finally {
    if (view.dom.isConnected) view.destroy();
    host.remove();
  }
});
