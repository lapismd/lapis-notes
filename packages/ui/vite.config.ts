import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";

const uiLib = path.resolve("./src/lib");
const uiComponents = path.join(uiLib, "components/ui");

export default defineConfig({
  plugins: [tailwindcss(), svelte()],
  resolve: {
    alias: [
      { find: "$lib", replacement: uiLib },
      {
        find: "@lapis-notes/ui/theme.css",
        replacement: path.join(uiLib, "theme.css"),
      },
      {
        find: "@lapis-notes/ui/styles.css",
        replacement: path.join(uiLib, "styles.css"),
      },
      {
        find: "@lapis-notes/ui/codemirror-autocomplete.css",
        replacement: path.join(uiLib, "codemirror-autocomplete.css"),
      },
      {
        find: "@lapis-notes/ui/table-dnd/utils",
        replacement: path.join(uiComponents, "table-dnd/table-dnd-utils.ts"),
      },
      {
        find: "@lapis-notes/ui/table-dnd/sensors",
        replacement: path.join(uiComponents, "table-dnd/table-dnd-sensors.ts"),
      },
      {
        find: /^@lapis-notes\/ui\/(.+)$/,
        replacement: `${uiComponents}/$1`,
      },
      {
        find: /^@lapis-notes\/ui$/,
        replacement: path.join(uiLib, "index.ts"),
      },
    ],
  },
  build: {
    lib: {
      formats: ["es"],
      entry: "src/lib/index.js",
      name: "nui",
    },
  },
});
