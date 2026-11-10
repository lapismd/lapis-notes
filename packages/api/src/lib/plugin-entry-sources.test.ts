import { expect, it, vi } from "vitest";
import { readPluginEntrySources } from "./plugin-entry-sources";
it("reads only eager ESM dependencies, excluding lazy chunks and unrelated files", async () => {
  const files: Record<string, string> = {
    "plugins/demo/main.mjs":
      "import './eager.js'; import('./lazy.js'); export {x} from './export.js'",
    "plugins/demo/eager.js": "import './main.mjs'; export default 1",
    "plugins/demo/export.js": "export const x=1",
  };
  const read = vi.fn(async (path: string) => {
    if (!(path in files)) throw Error(path);
    return files[path]!;
  });
  const sources = await readPluginEntrySources(
    { read },
    "plugins/demo",
    "main.mjs",
  );
  expect([...sources.keys()].sort()).toEqual(Object.keys(files).sort());
  expect(read).toHaveBeenCalledTimes(3);
});
it("does not follow imports outside the plugin root", async () => {
  const read = vi.fn(async () => "import '../secret.js'");
  await expect(
    readPluginEntrySources({ read }, "plugins/demo", "main.mjs"),
  ).rejects.toThrow(/root/);
  expect(read).toHaveBeenCalledTimes(1);
});
