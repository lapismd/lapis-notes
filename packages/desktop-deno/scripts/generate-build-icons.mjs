#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { createAppIconSvg } from "./app-icon-assets.mjs";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const logoPath = path.join(packageRoot, "src/assets/lapis-logo.svg");
const buildDir = path.join(packageRoot, "build");
const iconsetDir = path.join(buildDir, "icon.iconset");

function run(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: "pipe",
  });
  if (result.status !== 0) {
    throw new Error(
      `Command failed: ${command} ${args.join(" ")}\n${
        result.stderr?.trim() ?? ""
      }`.trim(),
    );
  }
}

function renderPng(svgPath, outputPath) {
  run("sips", ["-s", "format", "png", svgPath, "--out", outputPath]);
}

function createMacIcon(defaultIconPath) {
  fs.rmSync(iconsetDir, { force: true, recursive: true });
  fs.mkdirSync(iconsetDir, { recursive: true });
  try {
    for (const size of [16, 32, 128, 256, 512]) {
      for (const scale of [1, 2]) {
        const suffix = scale === 2 ? "@2x" : "";
        run("sips", [
          "-z",
          String(size * scale),
          String(size * scale),
          defaultIconPath,
          "--out",
          path.join(iconsetDir, `icon_${size}x${size}${suffix}.png`),
        ]);
      }
    }
    run("iconutil", [
      "-c",
      "icns",
      iconsetDir,
      "-o",
      path.join(buildDir, "icon.icns"),
    ]);
  } finally {
    fs.rmSync(iconsetDir, { force: true, recursive: true });
  }
}

function main() {
  if (process.platform !== "darwin") {
    throw new Error(
      `App icon generation requires macOS sips and iconutil (received ${os.platform()})`,
    );
  }

  const source = fs.readFileSync(logoPath, "utf8");
  fs.mkdirSync(buildDir, { recursive: true });
  const generatedSvgPaths = [];
  try {
    for (const appearance of ["light", "dark"]) {
      const svgPath = path.join(buildDir, `.icon-${appearance}.svg`);
      const pngPath = path.join(buildDir, `icon-${appearance}.png`);
      generatedSvgPaths.push(svgPath);
      fs.writeFileSync(svgPath, createAppIconSvg(source, appearance));
      renderPng(svgPath, pngPath);
    }
    fs.copyFileSync(
      path.join(buildDir, "icon-light.png"),
      path.join(buildDir, "icon.png"),
    );
    createMacIcon(path.join(buildDir, "icon.png"));
  } finally {
    for (const svgPath of generatedSvgPaths) {
      fs.rmSync(svgPath, { force: true });
    }
  }

  console.log(
    "[desktop-deno] generated rounded light/dark PNG icons and the default macOS ICNS",
  );
}

main();
