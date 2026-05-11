#!/usr/bin/env node
/**
 * Regenerate priority-matrix.svg with a refined, executive-grade design.
 *
 * Design principles:
 *   - Lighter typographic weight (500-700, never 800-900) for an airy,
 *     premium feel — heavy weights look chunky in dark themes.
 *   - Tinted effort chips (semantic bg at 0.14 alpha + matching coloured
 *     text) instead of solid filled pills — far more refined.
 *   - Smaller font sizes throughout, generous leading.
 *   - Subtle hairlines and dots, no visual heaviness.
 *   - Top accent line clipped to the same rounded outline as the card body
 *     so it hugs the card edges rather than floating above them.
 *
 * Hex palette is constrained to codes already in themes.ts recoloring rules,
 * so the chart auto-adapts to every theme without per-theme overrides:
 *
 *   #f8fafc → --svg-card     (card body)
 *   #1e293b → --chart-text   (body text)
 *   #0d1f35 → --chart-text   (header title)
 *   #64748b → --chart-muted  (subtitle, footer)
 *   #e2e8f0 → --chart-grid   (hairline divider)
 *   #dc2626 → --chart-danger (P1, High effort)
 *   #d97706 → --chart-warning(P2, Medium effort)
 *   #059669 → --chart-success(Low effort)
 *   #1e40af → --info         (P3 — cool blue on every theme)
 *   #ffffff → --svg-surface  (P-badge text, auto-inverts on dark themes)
 *
 * Usage:
 *   node scripts/regen-priority-matrix.mjs <output_dir>
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OUT_DIR = process.argv[2]
  ? resolve(process.argv[2])
  : resolve("reports/bvr-2026-05-11/assets");

const C = {
  cardBg:    "#f8fafc",
  text:      "#1e293b",
  textDeep:  "#0d1f35",
  muted:     "#64748b",
  grid:      "#e2e8f0",
  danger:    "#dc2626",
  warning:   "#d97706",
  success:   "#059669",
  info:      "#1e40af",
  white:     "#ffffff",
  surface:   "#ffffff",
};

const lanes = [
  {
    badge: "P1", label: "Do Now",        sub: "Config only — no engineering",
    color: C.danger,
    actions: [
      { text: "Enable Finops policy + cost estimation",       effort: "Low" },
      { text: "Enable API Token Expiry enforcement",          effort: "Low" },
      { text: "Enable SBOM_Policies + tf_plan_test",          effort: "Low" },
    ],
  },
  {
    badge: "P2", label: "This Quarter",  sub: "Some engineering required",
    color: C.warning,
    actions: [
      { text: "Audit Checkov across all 4,911 pipelines",     effort: "Medium" },
      { text: "Add workspace-scoped OPA policy sets",         effort: "Medium" },
      { text: "Activate IaCM in Colombia & Hong Kong",        effort: "Low"    },
    ],
  },
  {
    badge: "P3", label: "Next Quarter",  sub: "Longer-term investments",
    color: C.info,
    actions: [
      { text: "Create canonical IaCM pipeline templates",     effort: "Medium" },
      { text: "Evaluate private Terraform module registry",   effort: "High"   },
    ],
  },
];

// Word-wrap text to a max number of characters per line
function wrap(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > maxChars && line) {
      lines.push(line.trim());
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) lines.push(line.trim());
  return lines;
}

// ── Layout ─────────────────────────────────────────────────────────────────
const W       = 720;
const PAD     = 14;
const COL_GAP = 16;
const COL_W   = Math.floor((W - PAD * 2 - COL_GAP * 2) / 3);
const HEAD_H  = 64;
const ROW_H   = 50;          // single-line action row
const ROW_DBL = 66;          // two-line action row
const ROW_GAP = 4;
const FOOTER  = 34;
const ACCENT_H = 3;
const CARD_RX  = 10;

// Pre-compute row heights so all lanes share the same body height
const laneRowHs = lanes.map(({ actions }) =>
  actions.map(({ text }) => wrap(text, 26).length > 1 ? ROW_DBL : ROW_H),
);
const laneBodyHs = laneRowHs.map((rhs) =>
  rhs.reduce((s, h) => s + h, 0) + (rhs.length - 1) * ROW_GAP,
);
const maxBodyH = Math.max(...laneBodyHs);
const LANE_H = HEAD_H + 14 + maxBodyH + 18;
const H = PAD * 2 + LANE_H + FOOTER;

// ── Effort chip — tinted background + matching colored text ────────────────
function effortChip(x, y, effort) {
  const col = effort === "Low" ? C.success
            : effort === "High" ? C.danger
            : C.warning;
  const w = 46, h = 15;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${col}" opacity="0.14"/>
    <text x="${x + w / 2}" y="${y + 10.5}" text-anchor="middle"
      font-size="8" font-weight="700" fill="${col}" letter-spacing="0.1em"
      font-family="Plus Jakarta Sans,Inter,sans-serif">${effort.toUpperCase()}</text>
  `;
}

// ── Lane (column) ──────────────────────────────────────────────────────────
function laneSvg(lane, idx) {
  const x = PAD + idx * (COL_W + COL_GAP);
  const y = PAD;
  const rowHs = laneRowHs[idx];

  // Card outline: a clipPath ensures both the accent strip and the body
  // share exactly the same rounded outline. The accent shows only in the
  // top ACCENT_H pixels (because the cardBg overlay covers everything below).
  const clipId = `pm-card-${idx}`;
  const cardStructure = `
    <defs>
      <clipPath id="${clipId}">
        <rect x="${x}" y="${y}" width="${COL_W}" height="${LANE_H}" rx="${CARD_RX}"/>
      </clipPath>
    </defs>
    <g clip-path="url(#${clipId})">
      <rect x="${x}" y="${y}" width="${COL_W}" height="${LANE_H}" fill="${lane.color}"/>
      <rect x="${x}" y="${y + ACCENT_H}" width="${COL_W}" height="${LANE_H - ACCENT_H}" fill="${C.cardBg}"/>
    </g>
  `;

  // Header — P-badge, title, subtitle
  const innerX = x + 18;
  const badgeY = y + 18;
  const badgeW = 26, badgeH = 15;
  const header = `
    <rect x="${innerX}" y="${badgeY}" width="${badgeW}" height="${badgeH}" rx="4" fill="${lane.color}"/>
    <text x="${innerX + badgeW / 2}" y="${badgeY + 10.5}" text-anchor="middle"
      font-size="9" font-weight="700" fill="${C.white}" letter-spacing="0.04em"
      font-family="Plus Jakarta Sans,Inter,sans-serif">${lane.badge}</text>
    <text x="${innerX + badgeW + 9}" y="${badgeY + 11.5}"
      font-size="12.5" font-weight="700" fill="${C.textDeep}" letter-spacing="-0.01em"
      font-family="Plus Jakarta Sans,Inter,sans-serif">${lane.label}</text>
    <text x="${innerX}" y="${y + HEAD_H - 10}"
      font-size="9.5" font-weight="400" fill="${C.muted}"
      font-family="Plus Jakarta Sans,Inter,sans-serif">${lane.sub}</text>
  `;

  // Hairline divider
  const dividerY = y + HEAD_H;
  const divider =
    `<line x1="${innerX}" y1="${dividerY}" x2="${x + COL_W - 18}" y2="${dividerY}" stroke="${C.grid}" stroke-width="1"/>`;

  // Action rows
  let rowY = dividerY + 14;
  const rows = lane.actions.map(({ text, effort }, ri) => {
    const lines = wrap(text, 26);
    const rh = rowHs[ri];

    const firstTextY = rowY + 10;
    const lineH = 13;
    const textEls = lines.map((l, li) =>
      `<text x="${innerX + 14}" y="${firstTextY + li * lineH}"
         font-size="10" font-weight="500" fill="${C.text}" letter-spacing="-0.005em"
         font-family="Plus Jakarta Sans,Inter,sans-serif">${l}</text>`,
    ).join("");

    const dotCY = firstTextY - 4;
    // Generous gap (10px) between last text line and the chip below
    const chipY = firstTextY + (lines.length - 1) * lineH + 10;

    const out = `
      <circle cx="${innerX + 4}" cy="${dotCY}" r="2.8" fill="${lane.color}"/>
      ${textEls}
      ${effortChip(innerX + 14, chipY, effort)}
    `;
    rowY += rh + ROW_GAP;
    return out;
  }).join("");

  return cardStructure + header + divider + rows;
}

const lanesSvg = lanes.map(laneSvg).join("");

// ── Footer legend — coloured dot + label per effort level ──────────────────
// Dots are positioned dynamically so the visual gap *between the end of one
// label and the next dot* stays constant — independent of label length.
const footerY = H - 14;
const legendItems = [
  { label: "LOW",    col: C.success },
  { label: "MEDIUM", col: C.warning },
  { label: "HIGH",   col: C.danger  },
];

// Approximate the rendered width of an uppercase sans-serif label.
// Char width ≈ 0.66 × font-size, plus letter-spacing between glyphs,
// plus a small safety pad.
function approxLabelWidth(text, fontSize, letterSpacingEm) {
  const charW   = fontSize * 0.66;
  const spacing = fontSize * letterSpacingEm;
  return text.length * charW + Math.max(0, text.length - 1) * spacing + 3;
}

const effortFontSize  = 8;
const effortLetterSp  = 0.18;
const itemFontSize    = 8.5;
const itemLetterSp    = 0.10;
const dotLabelGap     = 9;   // dot centre → label start
const interItemGap    = 22;  // end of label → next dot centre  (constant)
const effortToFirstDot = 18; // end of "EFFORT" → first dot centre

const effortW = approxLabelWidth("EFFORT", effortFontSize, effortLetterSp);

// First pass: compute positions relative to legendStart=0
let cursor = effortW + effortToFirstDot;
const positions = legendItems.map((it) => {
  const dotX   = cursor;
  const labelX = dotX + dotLabelGap;
  const lblW   = approxLabelWidth(it.label, itemFontSize, itemLetterSp);
  cursor = labelX + lblW + interItemGap;
  return { dotX, labelX, label: it.label, col: it.col };
});

const totalLegendW = cursor - interItemGap;          // exclude trailing gap
const legendStart  = Math.round((W - totalLegendW) / 2);

const legendSvg = `
  <text x="${legendStart}" y="${footerY}"
    font-size="${effortFontSize}" font-weight="700" fill="${C.muted}" letter-spacing="${effortLetterSp}em"
    font-family="Plus Jakarta Sans,Inter,sans-serif">EFFORT</text>
  ${positions.map(({ dotX, labelX, label, col }) => `
    <circle cx="${(legendStart + dotX).toFixed(1)}" cy="${footerY - 3}" r="2.6" fill="${col}"/>
    <text x="${(legendStart + labelX).toFixed(1)}" y="${footerY}"
      font-size="${itemFontSize}" font-weight="600" fill="${C.muted}" letter-spacing="${itemLetterSp}em"
      font-family="Plus Jakarta Sans,Inter,sans-serif">${label}</text>
  `).join("")}
`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" class="svg-bg" fill="${C.surface}" rx="10"/>
  ${lanesSvg}
  ${legendSvg}
</svg>`;

const outPath = resolve(OUT_DIR, "priority-matrix.svg");
writeFileSync(outPath, svg, "utf-8");
console.log(`✓ Wrote ${outPath} (${svg.length} bytes)`);
