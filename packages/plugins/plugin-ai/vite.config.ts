import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const packageDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: [
      {
        find: /^lucide-static\/tags\.json$/,
        replacement: path.resolve(packageDir, "test/lucide-tags.stub.ts"),
      },
      {
        find: /^@lapis-notes\/api\/agent-skills$/,
        replacement: path.resolve(
          packageDir,
          "../../api/src/lib/agent-skills.ts",
        ),
      },
    ],
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
  },
});
