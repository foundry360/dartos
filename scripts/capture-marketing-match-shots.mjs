/**
 * Capture landscape marketing screenshots of current Club scoring UI.
 * Usage: node scripts/capture-marketing-match-shots.mjs
 */
import { chromium } from "playwright-core";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "public/marketing");
const baseUrl = process.env.SHOT_BASE_URL || "http://localhost:3000";
const shots = [
  { kind: "x01-301", file: "x01-301-ipad-landscape.png" },
  { kind: "cricket", file: "cricket-ipad-landscape.png" },
];

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
});

const context = await browser.newContext({
  viewport: { width: 1366, height: 1024 },
  deviceScaleFactor: 2,
});

const page = await context.newPage();

for (const shot of shots) {
  const url = `${baseUrl}/dev/device/shot/${shot.kind}`;
  console.log(`Opening ${url}`);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  // Force-hide boot splash (React owns it for ~4.2s).
  await page.addStyleTag({
    content: `
      .app-boot-splash,
      [class*="boot-splash"],
      html.app-booting .app-boot-splash,
      nextjs-portal,
      [data-nextjs-toast],
      [data-next-badge-root] {
        display: none !important;
        opacity: 0 !important;
        pointer-events: none !important;
        visibility: hidden !important;
      }
    `,
  });
  await page.evaluate(() => {
    document.documentElement.classList.remove("app-booting");
    document.documentElement.classList.add("app-boot-ready");
  });
  await page.waitForFunction(
    () => Boolean(document.body?.innerText?.includes("Confirm Turn")),
    { timeout: 30000 },
  );
  await page.waitForTimeout(800);
  const outPath = path.join(outDir, shot.file);
  await page.screenshot({ path: outPath, fullPage: false });
  console.log(`Wrote ${outPath}`);
}

await browser.close();
console.log("Done.");
