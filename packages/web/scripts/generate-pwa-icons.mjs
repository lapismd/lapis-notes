import { cp, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(scriptDir, "..");
const publicDir = path.join(webDir, "public");
const sourceLogoSvgPath = path.resolve(
  webDir,
  "../api/src/lib/assets/lapis-logo.svg",
);
const sourceAppIconPath = path.resolve(webDir, "../desktop-electron/build/icon.png");

const rasterTargets = [
  ["apple-touch-icon.png", 180, 0.82],
  ["pwa-192x192.png", 192, 0.82],
  ["pwa-512x512.png", 512, 0.82],
  ["pwa-1024x1024.png", 1024, 0.82],
  ["pwa-512x512-maskable.png", 512, 0.8],
  ["pwa-1024x1024-maskable.png", 1024, 0.8],
];

async function renderPaddedIcon(sourcePath, outputPath, size, logoScale) {
  const logoSize = Math.round(size * logoScale);
  const logo = await sharp(sourcePath)
    .resize(logoSize, logoSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();
  const offset = Math.floor((size - logoSize) / 2);
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, left: offset, top: offset }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);
}

await mkdir(publicDir, { recursive: true });
await cp(sourceLogoSvgPath, path.join(publicDir, "favicon.svg"));
for (const [fileName, size, logoScale] of rasterTargets) {
  await renderPaddedIcon(
    sourceAppIconPath,
    path.join(publicDir, fileName),
    size,
    logoScale,
  );
}
