import { expect, test } from "@playwright/test";
import {
  createDesktopTestState,
  launchDesktopApp,
  waitForDesktopWorkspace,
} from "./helpers";

test("native Markdown sidecar reports diagnostics and fixes", async () => {
  const state = await createDesktopTestState();
  const app = await launchDesktopApp({
    userDataDir: state.userDataDir,
    vaultPath: state.vaultA,
  });
  try {
    await waitForDesktopWorkspace(app.page);
    const result = await app.page.evaluate(async () => {
      const bridge = (
        globalThis as typeof globalThis & {
          __LAPIS_NATIVE_DESKTOP__?: {
            invoke<T>(command: string, payload?: Record<string, unknown>): Promise<T>;
          };
        }
      ).__LAPIS_NATIVE_DESKTOP__;
      if (!bridge) throw new Error("Native bridge unavailable");
      const document = {
        uri: "vault://bad.md",
        languageId: "markdown",
        version: 1,
        text: "#Heading\n",
      };
      const capabilities = await bridge.invoke<Record<string, boolean>>(
        "desktop_ls_capabilities",
        { protocolVersion: 1 },
      );
      await bridge.invoke("desktop_ls_update_document", {
        protocolVersion: 1,
        document,
      });
      const diagnostics = await bridge.invoke<
        Array<{ source?: string; code?: string | number }>
      >("desktop_ls_diagnostics", { protocolVersion: 1, document });
      const actions = await bridge.invoke<Array<{ title: string }>>(
        "desktop_ls_code_actions",
        {
          protocolVersion: 1,
          document,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 4 },
          },
        },
      );
      return { capabilities, diagnostics, actions };
    });

    expect(result.capabilities).toEqual({ markdown: true });
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "markdownlint", code: "MD018" }),
      ]),
    );
    expect(result.actions.map((action) => action.title)).toEqual(
      expect.arrayContaining([
        "Fix markdownlint MD018",
        "Ignore markdownlint MD018 on next line",
        "Ignore markdownlint MD018 for this file",
      ]),
    );
  } finally {
    await app.close();
    await state.cleanup();
  }
});

test("an invalid Markdown request is bounded without poisoning the sidecar", async () => {
  const state = await createDesktopTestState();
  const app = await launchDesktopApp({
    userDataDir: state.userDataDir,
    vaultPath: state.vaultA,
  });
  try {
    await waitForDesktopWorkspace(app.page);
    const recovered = await app.page.evaluate(async () => {
      const bridge = (
        globalThis as typeof globalThis & {
          __LAPIS_NATIVE_DESKTOP__?: {
            invoke<T>(command: string, payload?: Record<string, unknown>): Promise<T>;
          };
        }
      ).__LAPIS_NATIVE_DESKTOP__!;
      let rejected = false;
      try {
        await bridge.invoke("desktop_ls_diagnostics", {
          protocolVersion: 1,
          document: {
            uri: "vault://bad.ts",
            languageId: "typescript",
            version: 1,
            text: "const x = 1",
          },
        });
      } catch {
        rejected = true;
      }
      const diagnostics = await bridge.invoke<unknown[]>(
        "desktop_ls_diagnostics",
        {
          protocolVersion: 1,
          document: {
            uri: "vault://good.md",
            languageId: "markdown",
            version: 1,
            text: "# Good\n",
          },
        },
      );
      return { rejected, diagnostics };
    });
    expect(recovered.rejected).toBe(true);
    expect(recovered.diagnostics).toEqual([]);
  } finally {
    await app.close();
    await state.cleanup();
  }
});
