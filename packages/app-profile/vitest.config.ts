import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [svelte()],
  ssr: {
    noExternal: ["lucide-static"],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
