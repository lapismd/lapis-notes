export const APP_ICON_GEOMETRY = Object.freeze({
  canvasSize: 1024,
  backgroundInset: 52,
  backgroundRadius: 216,
  logoScale: 0.76,
  logoX: 95,
  logoY: 120,
});

export const APP_ICON_PALETTES = Object.freeze({
  light: Object.freeze({
    backgroundStart: "#F8FBFE",
    backgroundEnd: "#D9ECF8",
    border: "#FFFFFF",
    logo: null,
  }),
  dark: Object.freeze({
    backgroundStart: "#173B57",
    backgroundEnd: "#081B2B",
    border: "#315873",
    logo: "#7DC7FF",
  }),
});

function extractSvgBody(source) {
  const match = source.match(/<svg\b[^>]*>([\s\S]*)<\/svg>\s*$/u);
  if (!match) throw new Error("Lapis logo source must contain one SVG root");
  return match[1];
}

function recolorLogo(body, color) {
  if (!color) return body;
  return body.replace(/\sfill="#[0-9a-fA-F]{6}"/gu, ` fill="${color}"`);
}

export function createAppIconSvg(source, appearance) {
  const palette = APP_ICON_PALETTES[appearance];
  if (!palette) {
    throw new Error(`Unsupported app icon appearance: ${appearance}`);
  }

  const geometry = APP_ICON_GEOMETRY;
  const backgroundSize = geometry.canvasSize - geometry.backgroundInset * 2;
  const logo = recolorLogo(extractSvgBody(source), palette.logo);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${geometry.canvasSize}" height="${geometry.canvasSize}" viewBox="0 0 ${geometry.canvasSize} ${geometry.canvasSize}">`,
    "  <defs>",
    `    <linearGradient id="lapis-app-icon-${appearance}" x1="0" y1="0" x2="0" y2="1">`,
    `      <stop offset="0" stop-color="${palette.backgroundStart}"/>`,
    `      <stop offset="1" stop-color="${palette.backgroundEnd}"/>`,
    "    </linearGradient>",
    "  </defs>",
    `  <rect x="${geometry.backgroundInset}" y="${geometry.backgroundInset}" width="${backgroundSize}" height="${backgroundSize}" rx="${geometry.backgroundRadius}" fill="url(#lapis-app-icon-${appearance})" stroke="${palette.border}" stroke-width="8"/>`,
    `  <g transform="translate(${geometry.logoX} ${geometry.logoY}) scale(${geometry.logoScale})">`,
    logo,
    "  </g>",
    "</svg>",
    "",
  ].join("\n");
}
