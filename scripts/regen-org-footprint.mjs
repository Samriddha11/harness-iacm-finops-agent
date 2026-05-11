#!/usr/bin/env node
/**
 * Regenerate org-footprint.svg as a "diverging infrastructure DNA" chart.
 *
 * Layout uses strict vertical bands so nothing overlaps:
 *
 *     y=24   Title                       (centered)
 *     y=44   Subtitle                    (centered, muted)
 *     y=72   WORKSPACES / PIPELINES      (section labels above each side)
 *     y=86   1000 750 500 250 0 250 …    (tick labels)
 *     y=92   tick marks
 *     y=100  first row begins
 *
 * Each org row:
 *     [org name]  [WS bar  →← PL bar]  [ratio chip]
 *
 * The ratio chip is two-line stacked so the category label
 * (WORKSPACE-LED / BALANCED / PIPELINE-LED) never collides with the
 * ratio number, regardless of length.
 *
 * Hex palette is constrained to codes already in themes.ts recoloring rules
 * so the chart auto-adapts to every theme:
 *
 *   #f8fafc → --svg-card     (chart bg + ratio chip bg)
 *   #1e293b → --chart-text   (org names)
 *   #0d1f35 → --chart-text   (title, ratio numbers)
 *   #64748b → --chart-muted  (subtitle, axis labels)
 *   #e2e8f0 → --chart-grid   (centre axis line, tick marks)
 *   #ffffff → --svg-surface  (in-bar number text, page bg)
 *   #0278D5 → --chart-1      (workspace bar — primary)
 *   #0891b2 → --chart-3      (pipeline bar — secondary)
 *   #d97706 → --chart-warning(workspace-led category)
 *   #1e40af → --info         (pipeline-led category — cool on every theme)
 *   #059669 → --chart-success(balanced category)
 *
 * Usage:
 *   node scripts/regen-org-footprint.mjs <output_dir>
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OUT_DIR = process.argv[2]
  ? resolve(process.argv[2])
  : resolve("reports/bvr-2026-05-11/assets");

const C = {
  surface:   "#ffffff",
  card:      "#f8fafc",
  text:      "#1e293b",
  textDeep:  "#0d1f35",
  muted:     "#64748b",
  grid:      "#e2e8f0",
  white:     "#ffffff",
  workspace: "#0278D5",  // → chart-1
  pipeline:  "#0891b2",  // → chart-3
  warning:   "#d97706",  // workspace-led
  info:      "#1e40af",  // pipeline-led
  success:   "#059669",  // balanced
};

// Top 10 organisations by total IaCM footprint
const orgs = [
  { name: "TruVision Risk Mgmt",  ws: 425, pl: 431 },
  { name: "OneDev",               ws: 380, pl: 577 },
  { name: "Information Security", ws: 299, pl: 400 },
  { name: "OneTru",               ws: 264, pl: 848 },
  { name: "Global Assoc. Tech.",  ws: 173, pl: 984 },
  { name: "TruAudiance & Mktg",   ws: 134, pl: 109 },
  { name: "TruValidate Fraud",    ws: 127, pl: 478 },
  { name: "TU CIBIL",             ws: 118, pl:  81 },
  { name: "TruContact Comms",     ws: 107, pl:  75 },
  { name: "TruIQ Analytics",      ws: 102, pl:  65 },
];

// Categorisation by pipelines-per-workspace ratio
function categorise(ratio) {
  if (ratio < 0.85)  return { key: "ws",  label: "WORKSPACE-LED", col: C.warning };
  if (ratio <= 1.65) return { key: "bal", label: "BALANCED",      col: C.success };
  return                       { key: "pl",  label: "PIPELINE-LED",  col: C.info };
}

// Approximate text width (used for adaptive in-bar vs out-of-bar value placement)
function approxW(text, fontSize) {
  return text.length * fontSize * 0.58;
}

// ── Layout ─────────────────────────────────────────────────────────────────
const W              = 720;
const PAD_L          = 16;
const PAD_R          = 16;
const ORG_NAME_W     = 140;
const NAME_BAR_GAP   = 12;
const BAR_W          = 200;
const BAR_AREA_GAP   = 14;
const CHIP_W         = 96;
const ROW_H          = 32;
const BAR_H          = 12;

const CENTER_X       = PAD_L + ORG_NAME_W + NAME_BAR_GAP + BAR_W;
const RIGHT_BAR_END  = CENTER_X + BAR_W;
const CHIP_X         = RIGHT_BAR_END + BAR_AREA_GAP;

const SCALE_MAX      = 1000;
const VALUE_PAD      = 5;
const FONT_VALUE     = 9.5;

// Vertical bands (strict — see comment block at top of file)
const TITLE_Y          = 24;
const SUBTITLE_Y       = 44;
const SECTION_LABEL_Y  = 72;
const TICK_LABEL_Y     = 86;
const AXIS_BASE_Y      = 92;        // tick marks emerge from here
const ROWS_START_Y     = 102;
const EXPLAINER_PAD    = 28;        // extra space for explainer line at bottom

const H = ROWS_START_Y + orgs.length * ROW_H + EXPLAINER_PAD;

// ── Top axis: tick labels + small tick marks (mirrored around centre) ──────
const TICK_VALUES = [0, 250, 500, 750, 1000];

const axisTicks = TICK_VALUES.flatMap((v) => {
  const offset = (v / SCALE_MAX) * BAR_W;
  const xL = CENTER_X - offset;
  const xR = CENTER_X + offset;
  const lbl = v.toLocaleString("en-US");
  const els = [
    `<line x1="${xL.toFixed(1)}" y1="${AXIS_BASE_Y}" x2="${xL.toFixed(1)}" y2="${AXIS_BASE_Y + 4}" stroke="${C.grid}" stroke-width="1"/>`,
    `<text x="${xL.toFixed(1)}" y="${TICK_LABEL_Y}" text-anchor="middle"
       font-size="8.5" font-weight="600" fill="${C.muted}" letter-spacing="0.04em"
       font-family="Plus Jakarta Sans,Inter,sans-serif">${lbl}</text>`,
  ];
  if (v !== 0) {
    els.push(
      `<line x1="${xR.toFixed(1)}" y1="${AXIS_BASE_Y}" x2="${xR.toFixed(1)}" y2="${AXIS_BASE_Y + 4}" stroke="${C.grid}" stroke-width="1"/>`,
      `<text x="${xR.toFixed(1)}" y="${TICK_LABEL_Y}" text-anchor="middle"
         font-size="8.5" font-weight="600" fill="${C.muted}" letter-spacing="0.04em"
         font-family="Plus Jakarta Sans,Inter,sans-serif">${lbl}</text>`,
    );
  }
  return els;
});

// Section labels above each side (WORKSPACES left, PIPELINES right)
const wsLabelX = CENTER_X - BAR_W / 2;
const plLabelX = CENTER_X + BAR_W / 2;
const sectionLabels = `
  <text x="${wsLabelX}" y="${SECTION_LABEL_Y}" text-anchor="middle"
    font-size="9" font-weight="700" fill="${C.workspace}" letter-spacing="0.22em"
    font-family="Plus Jakarta Sans,Inter,sans-serif">WORKSPACES</text>
  <text x="${plLabelX}" y="${SECTION_LABEL_Y}" text-anchor="middle"
    font-size="9" font-weight="700" fill="${C.pipeline}" letter-spacing="0.22em"
    font-family="Plus Jakarta Sans,Inter,sans-serif">PIPELINES</text>
`;

// ── Per-row geometry ──────────────────────────────────────────────────────
function rowSvg(org, idx) {
  const ratio = org.pl / org.ws;
  const cat   = categorise(ratio);
  const yTop  = ROWS_START_Y + idx * ROW_H;
  const yBar  = yTop + (ROW_H - BAR_H) / 2;
  const yMid  = yTop + ROW_H / 2;

  const wsBarW = (org.ws / SCALE_MAX) * BAR_W;
  const plBarW = (org.pl / SCALE_MAX) * BAR_W;

  // Org name (right-aligned just before the chart)
  const nameX = PAD_L + ORG_NAME_W;
  const nameEl = `
    <text x="${nameX}" y="${yMid + 3.5}" text-anchor="end"
      font-size="10.5" font-weight="500" fill="${C.text}" letter-spacing="-0.005em"
      font-family="Plus Jakarta Sans,Inter,sans-serif">${org.name}</text>
  `;

  // Workspace bar (extends LEFT from CENTER_X)
  const wsBarX = CENTER_X - wsBarW;
  const wsBar = `
    <rect x="${wsBarX.toFixed(1)}" y="${yBar}" width="${wsBarW.toFixed(1)}" height="${BAR_H}"
      rx="2.5" fill="${C.workspace}" opacity="0.95"/>
  `;

  // Pipeline bar (extends RIGHT from CENTER_X)
  const plBar = `
    <rect x="${CENTER_X}" y="${yBar}" width="${plBarW.toFixed(1)}" height="${BAR_H}"
      rx="2.5" fill="${C.pipeline}" opacity="0.95"/>
  `;

  // Workspace value: inside bar (white) when wide, else outside-left (coloured)
  const wsValW = approxW(String(org.ws), FONT_VALUE);
  const wsInside = wsBarW >= wsValW + 10;
  const wsValueEl = wsInside
    ? `<text x="${(CENTER_X - 5).toFixed(1)}" y="${yMid + 3.2}" text-anchor="end"
         font-size="${FONT_VALUE}" font-weight="700" fill="${C.white}"
         font-family="Plus Jakarta Sans,Inter,sans-serif">${org.ws}</text>`
    : `<text x="${(wsBarX - VALUE_PAD).toFixed(1)}" y="${yMid + 3.2}" text-anchor="end"
         font-size="${FONT_VALUE}" font-weight="700" fill="${C.workspace}"
         font-family="Plus Jakarta Sans,Inter,sans-serif">${org.ws}</text>`;

  // Pipeline value: same logic mirrored
  const plValW = approxW(String(org.pl), FONT_VALUE);
  const plInside = plBarW >= plValW + 10;
  const plValueEl = plInside
    ? `<text x="${(CENTER_X + 5).toFixed(1)}" y="${yMid + 3.2}" text-anchor="start"
         font-size="${FONT_VALUE}" font-weight="700" fill="${C.white}"
         font-family="Plus Jakarta Sans,Inter,sans-serif">${org.pl}</text>`
    : `<text x="${(CENTER_X + plBarW + VALUE_PAD).toFixed(1)}" y="${yMid + 3.2}" text-anchor="start"
         font-size="${FONT_VALUE}" font-weight="700" fill="${C.pipeline}"
         font-family="Plus Jakarta Sans,Inter,sans-serif">${org.pl}</text>`;

  // Right-side mini-card: two-line stacked (ratio number + category label)
  const chipH = 26;
  const chipY = yTop + (ROW_H - chipH) / 2;
  const chipMid = CHIP_X + CHIP_W / 2;
  const chip = `
    <rect x="${CHIP_X}" y="${chipY}" width="${CHIP_W}" height="${chipH}"
      rx="5" fill="${cat.col}" opacity="0.11"/>
    <text x="${chipMid}" y="${chipY + 13}" text-anchor="middle"
      font-size="11" font-weight="700" fill="${cat.col}" letter-spacing="-0.005em"
      font-family="Plus Jakarta Sans,Inter,sans-serif">${ratio.toFixed(2)}×</text>
    <text x="${chipMid}" y="${chipY + 22}" text-anchor="middle"
      font-size="7" font-weight="700" fill="${cat.col}" letter-spacing="0.14em"
      font-family="Plus Jakarta Sans,Inter,sans-serif">${cat.label}</text>
  `;

  return nameEl + wsBar + plBar + wsValueEl + plValueEl + chip;
}

const rows = orgs.map(rowSvg).join("");

// ── Centre axis line (subtle vertical hairline) ────────────────────────────
const centerAxis = `
  <line x1="${CENTER_X}" y1="${AXIS_BASE_Y}" x2="${CENTER_X}" y2="${ROWS_START_Y + orgs.length * ROW_H}"
    stroke="${C.grid}" stroke-width="1.2"/>
`;

// ── Title + subtitle (centred) ────────────────────────────────────────────
const title = `
  <text x="${W / 2}" y="${TITLE_Y}" text-anchor="middle"
    font-size="13.5" font-weight="800" fill="${C.textDeep}" letter-spacing="-0.015em"
    font-family="Plus Jakarta Sans,Inter,sans-serif">Top 10 Organisations · Infrastructure DNA</text>
  <text x="${W / 2}" y="${SUBTITLE_Y}" text-anchor="middle"
    font-size="9.5" font-weight="500" fill="${C.muted}" letter-spacing="0.005em"
    font-family="Plus Jakarta Sans,Inter,sans-serif">Workspaces vs pipelines per organisation, with pipelines-per-workspace ratio</text>
`;

// ── Explainer below the rows ──────────────────────────────────────────────
const explainerY = ROWS_START_Y + orgs.length * ROW_H + 18;
const explainEl = `
  <text x="${W / 2}" y="${explainerY}" text-anchor="middle"
    font-size="8.5" font-weight="500" fill="${C.muted}" letter-spacing="0.02em"
    font-family="Plus Jakarta Sans,Inter,sans-serif">Bar shape reveals each org’s infrastructure DNA — symmetric is balanced, right-heavy is automation-led, left-heavy is workspace-led</text>
`;

// ── Compose ───────────────────────────────────────────────────────────────
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" class="svg-bg" fill="${C.surface}" rx="10"/>
  ${title}
  ${sectionLabels}
  ${axisTicks.join("")}
  ${centerAxis}
  ${rows}
  ${explainEl}
</svg>`;

const outPath = resolve(OUT_DIR, "org-footprint.svg");
writeFileSync(outPath, svg, "utf-8");
console.log(`✓ Wrote ${outPath} (${svg.length} bytes)`);
