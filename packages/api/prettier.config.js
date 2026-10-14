export default {
  plugins: ["prettier-plugin-jsdoc"],
  overrides: [
    // Changelogs use Prettier's built-in Markdown parser, independently of
    // optional code/JSDoc formatting tools in a developer's installation.
    { files: "*.md", options: { plugins: [] } },
  ],
};
