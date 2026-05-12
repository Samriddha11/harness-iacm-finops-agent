#!/usr/bin/env node
/**
 * Regenerate every chart SVG for a single customer's BVR.
 *
 * Usage:
 *   node scripts/regen-bvr-charts.mjs <bvr-folder>
 *
 * Examples:
 *   node scripts/regen-bvr-charts.mjs reports/bvr-2026-05-11
 *   node scripts/regen-bvr-charts.mjs /Users/me/work/proj/reports/acme-bvr
 *
 * What it does:
 *   1. Loads <bvr-folder>/charts.data.mjs (the per-customer data file).
 *   2. For each chart kind defined there, calls the matching generator in
 *      build/charts/index.js (the canonical, theme-aware chart objects).
 *   3. Validates the data via Zod (renderChart throws on bad input).
 *   4. Writes the SVG to <bvr-folder>/assets/<kind>.svg.
 *
 * The chart STYLES are identical across customers — they live in
 * src/charts/. Only the per-customer numbers change. That's the entire
 * point: every customer report ends up visually consistent, only the
 * data is swapped.
 *
 * If you change a generator in src/charts/, run `npm run build` first so
 * this script picks up the new compiled output.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { resolve, join, isAbsolute, basename } from "node:path";
import { pathToFileURL } from "node:url";

// ── CLI -----------------------------------------------------------------
const folderArg = process.argv[2];
if (!folderArg) {
  console.error("Usage: node scripts/regen-bvr-charts.mjs <bvr-folder>");
  console.error("       e.g.  node scripts/regen-bvr-charts.mjs reports/bvr-2026-05-11");
  process.exit(2);
}
const bvrFolder = isAbsolute(folderArg) ? folderArg : resolve(process.cwd(), folderArg);
if (!existsSync(bvrFolder) || !statSync(bvrFolder).isDirectory()) {
  console.error(`✗ Not a directory: ${bvrFolder}`);
  process.exit(2);
}

// ── Load per-customer data --------------------------------------------
const dataPath = join(bvrFolder, "charts.data.mjs");
if (!existsSync(dataPath)) {
  console.error(`✗ Missing per-customer data file: ${dataPath}`);
  console.error("  Copy reports/bvr-2026-05-11/charts.data.mjs as a template.");
  process.exit(2);
}
const data = await import(pathToFileURL(dataPath).href);

// ── Load canonical chart objects --------------------------------------
// Resolve relative to this script so it works no matter where it's invoked.
const repoRoot   = resolve(new URL(".", import.meta.url).pathname, "..");
const chartsPath = join(repoRoot, "build/charts/index.js");
if (!existsSync(chartsPath)) {
  console.error(`✗ Compiled chart objects not found: ${chartsPath}`);
  console.error("  Run `npm run build` first.");
  process.exit(2);
}
const { renderChart } = await import(pathToFileURL(chartsPath).href);

// ── Map per-customer keys → chart_kind enum ---------------------------
// The keys in charts.data.mjs are snake_case to read naturally and match
// the chart_kind discriminator used by src/charts/index.ts.
const KINDS = [
  ["scorecard",       "scorecard.svg"],
  ["maturity_radar",  "maturity-radar.svg"],
  ["feature_gauges",  "feature-gauges.svg"],
  ["opa_donut",       "opa-donut.svg"],
  ["org_footprint",   "org-footprint.svg"],
  ["priority_matrix", "priority-matrix.svg"],
  ["monthly_growth",  "growth.svg"],
];

// ── Render every chart present in the data file -----------------------
const assetsDir = join(bvrFolder, "assets");
mkdirSync(assetsDir, { recursive: true });

let written = 0;
let skipped = 0;
const customerLabel = data.customer?.name ?? basename(bvrFolder);
console.log(`▶ Regenerating BVR charts for ${customerLabel}`);
console.log(`  data:    ${dataPath}`);
console.log(`  output:  ${assetsDir}\n`);

for (const [kind, filename] of KINDS) {
  if (!data[kind]) {
    console.log(`  ○ ${filename.padEnd(22)} (no data — skipped)`);
    skipped++;
    continue;
  }
  let svg;
  try {
    svg = renderChart({ chart_kind: kind, data: data[kind] });
  } catch (err) {
    console.error(`  ✗ ${filename.padEnd(22)} render failed: ${err.message}`);
    process.exitCode = 1;
    continue;
  }
  const out = join(assetsDir, filename);
  writeFileSync(out, svg, "utf-8");
  const size = statSync(out).size;
  console.log(`  ✓ ${filename.padEnd(22)} ${(size / 1024).toFixed(1)} KB`);
  written++;
}

console.log(`\nWrote ${written} SVG${written === 1 ? "" : "s"}` + (skipped ? `, skipped ${skipped}` : "") + ".");
console.log("Charts now match the canonical style in src/charts/. Refresh the report to see them.");
