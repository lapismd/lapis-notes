import type {
  LapisExtensionManifest,
  LapisMarkdownViewMenuItemContribution,
  LapisRibbonItemContribution,
} from "@lapis-notes/api";

const ribbon: LapisRibbonItemContribution = {
  id: "open",
  title: "Open",
  icon: "file",
  command: "open",
};
const menu: LapisMarkdownViewMenuItemContribution = {
  id: "present",
  title: "Present",
  command: "present",
  section: "view",
};
const manifest: LapisExtensionManifest = {
  manifestVersion: 1,
  contributes: {
    commands: [
      { command: "open", title: "Open" },
      { command: "present", title: "Present" },
    ],
    ribbonItems: [ribbon],
    markdownViewMenuItems: [menu],
  },
};
// @ts-expect-error Ribbon discovery requires a command target.
const invalidRibbon: LapisRibbonItemContribution = {
  id: "open",
  title: "Open",
  icon: "file",
};
void manifest;
void invalidRibbon;
