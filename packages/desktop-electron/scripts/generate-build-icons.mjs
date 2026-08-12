#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.resolve(scriptDir, "../build");
const requiredIcons = ["icon.png", "icon-light.png", "icon-dark.png"];

if (process.platform === "darwin") {
  requiredIcons.push("icon.icns");
}

const missing = requiredIcons.filter(
  (icon) => !fs.existsSync(path.join(buildDir, icon)),
);
if (missing.length > 0) {
  throw new Error(`Missing checked-in desktop build icons: ${missing.join(", ")}`);
}

console.log(`[electron] verified ${requiredIcons.join(", ")}`);
