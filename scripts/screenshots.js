import { mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { chromium } from "playwright-core";

// Takes the README screenshots from the demo page; run `node scripts/demo.js` first.
// Uses the installed Chrome, so no browser download is needed.
const OUT = "docs/screenshots";
const PAGE = pathToFileURL(resolve("demo/index.html")).href;
const ACTIVE = { status: "paid", channel: "all", customer: "all", date: { preset: "thisMonth", from: "2026-10-01", to: "2026-10-15" }, q: "" };

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });

async function open({ state, locale = "en", theme = "light", width = 960, height = 520 } = {}) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  // Fixed "today" so presets and the calendar look the same on every run
  await page.clock.setFixedTime(new Date("2026-10-15T10:00:00"));
  const query = new URLSearchParams({ locale, theme, ...(state ? { state: JSON.stringify(state) } : {}) });
  await page.goto(`${PAGE}?${query}`);
  await page.waitForSelector("table");
  return page;
}

async function shot(page, name) {
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  await page.close();
  console.log(`${OUT}/${name}.png`);
}

// 1. Filters in use
await shot(await open({ state: ACTIVE }), "filter-bar");

// 2. The "Filter" menu
let page = await open({ state: ACTIVE });
await page.getByRole("button", { name: /Filter/ }).click();
await shot(page, "filter-menu");

// 3. A long list gets a search box
page = await open({ state: ACTIVE });
await page.getByRole("button", { name: /Filter/ }).click();
await page.getByRole("menuitem", { name: "Customer" }).click();
await page.getByPlaceholder("Search options").fill("e");
await shot(page, "filter-options");

// 4. The date range picker
page = await open({ state: ACTIVE, height: 640 });
await page.getByRole("button", { name: /Date Range:/ }).click();
await shot(page, "date-range");

// 5. Dark mode follows the app's theme
await shot(await open({ state: ACTIVE, theme: "dark" }), "dark");

// 6. Turkish
await shot(await open({ state: { ...ACTIVE, channel: "web" }, locale: "tr" }), "turkish");

// 7. Phone
page = await open({ state: ACTIVE, width: 390, height: 760 });
await page.getByRole("button", { name: /Date Range:/ }).click();
await shot(page, "mobile");

await browser.close();
