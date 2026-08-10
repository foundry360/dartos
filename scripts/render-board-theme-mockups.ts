/**
 * One-off: render static board SVG mockups for selected themes.
 * Usage: npx tsx scripts/render-board-theme-mockups.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  BOARD_THEMES,
  getBoardThemeColors,
  type BoardThemeId,
} from "../lib/board-themes";
import {
  BOARD_CENTER,
  BOARD_SIZE,
  getBoardSurroundRadius,
  LABEL_FONT_SIZE,
} from "../utils/dartboard/constants";
import { DEFAULT_BOARD_RADIUS } from "../utils/dartboard/geometry";
import {
  buildDartboardLabels,
  buildDartboardSegments,
  buildDartboardWireRings,
  isEvenOddRing,
} from "../utils/dartboard/segments";

const THEME_IDS: BoardThemeId[] = ["dartos", "jaguars", "gators"];
const OUT_DIR = join(process.cwd(), "public/marketing/board-themes");

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderBoardSvg(themeId: BoardThemeId) {
  const theme = BOARD_THEMES.find((entry) => entry.id === themeId);
  if (!theme) {
    throw new Error(`Unknown theme: ${themeId}`);
  }

  const colors = getBoardThemeColors(themeId);
  const segments = buildDartboardSegments(DEFAULT_BOARD_RADIUS, colors);
  const labels = buildDartboardLabels(DEFAULT_BOARD_RADIUS, colors);
  const wireRings = buildDartboardWireRings();
  const surround = getBoardSurroundRadius();
  const surroundStroke = colors.surroundBorder ?? colors.wireDark;
  const surroundStrokeWidth = colors.surroundBorder ? 0.5 : 2;

  const segmentPaths = segments
    .map((segment) => {
      const isWire = segment.id.startsWith("WIRE");
      const isBullOuter = segment.ring === "bull-outer";
      const fill = isWire ? "none" : escapeXml(segment.fill);
      const fillRule = isEvenOddRing(segment.ring) ? ' fill-rule="evenodd"' : "";
      const stroke =
        isWire || isBullOuter
          ? ` stroke="${escapeXml(segment.stroke)}" stroke-width="${isBullOuter ? 1.75 : 1.25}"`
          : "";
      return `<path d="${escapeXml(segment.path)}" fill="${fill}"${fillRule}${stroke} vector-effect="non-scaling-stroke"/>`;
    })
    .join("\n    ");

  const rings = wireRings
    .map(
      (ring) =>
        `<circle cx="${BOARD_CENTER}" cy="${BOARD_CENTER}" r="${ring.radius}" fill="none" stroke="${escapeXml(colors.wire)}" stroke-width="1.25" vector-effect="non-scaling-stroke"/>`,
    )
    .join("\n    ");

  const labelNodes = labels
    .map(
      (label) =>
        `<text x="${label.x}" y="${label.y}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${label.rotation}, ${label.x}, ${label.y})" fill="${escapeXml(label.fill)}" font-size="${LABEL_FONT_SIZE}" font-weight="800" font-family="system-ui, sans-serif" letter-spacing="-0.02em">${label.number}</text>`,
    )
    .join("\n    ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BOARD_SIZE} ${BOARD_SIZE}" width="800" height="800" role="img" aria-label="${escapeXml(theme.name)} dartboard">
  <rect width="100%" height="100%" fill="#0a0a0b"/>
  <circle cx="${BOARD_CENTER}" cy="${BOARD_CENTER}" r="${surround}" fill="${escapeXml(colors.boardBase)}" stroke="${escapeXml(surroundStroke)}" stroke-width="${surroundStrokeWidth}"/>
  ${segmentPaths}
  ${rings}
  <circle cx="${BOARD_CENTER}" cy="${BOARD_CENTER}" r="${DEFAULT_BOARD_RADIUS}" fill="none" stroke="${escapeXml(colors.wire)}" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
  ${labelNodes}
</svg>
`;
}

mkdirSync(OUT_DIR, { recursive: true });

for (const themeId of THEME_IDS) {
  const theme = BOARD_THEMES.find((entry) => entry.id === themeId)!;
  const slug = theme.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const file = join(OUT_DIR, `board-${slug}.svg`);
  writeFileSync(file, renderBoardSvg(themeId), "utf8");
  console.log(`Wrote ${file}`);
}
