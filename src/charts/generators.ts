/**
 * SVG chart generators for the Harness IaCM report renderer.
 *
 * Each generator returns a fully-formed `<svg>` string that can be:
 *   1. Saved to disk via the `harness_iacm_chart` tool, then
 *   2. Inlined into a markdown report via `![alt](assets/chart.svg)`, then
 *   3. Recoloured by the theme system in themes.ts (because every hex
 *      value is in the theme's CSS attribute-selector mapping).
 *
 * All shape, layout, and colour conventions are intentional — they match
 * the curated TU BVR design language. To change the look of a chart,
 * change ONE generator below and every report instantly inherits it.
 */
import { PALETTE as P, FONT_FAMILY as F, FONT_NUMERIC as FN, wrap, approxW, esc } from "./palette.js";

// ─────────────────────────────────────────────────────────────────────────
// 1. SCORECARD — row of value tiles with coloured top accent
// ─────────────────────────────────────────────────────────────────────────
export interface ScorecardTile { value: string; label: string; sub?: string }
export interface ScorecardData {
  tiles: ScorecardTile[];
  title?: string;
}

export function scorecard(d: ScorecardData): string {
  const tiles = d.tiles.slice(0, 6);
  const W = 720;
  const PAD_X = 16;
  const TITLE_H = d.title ? 36 : 0;
  const tH = 168;
  const tY = TITLE_H + 16;
  const H = tY + tH + 16;
  const tW = (W - PAD_X * 2 - (tiles.length - 1) * 12) / tiles.length;

  const COLS = [P.primary, P.quaternary, P.success, P.secondary, P.tertiary, P.warning];

  const titleEl = d.title
    ? `<text x="${W / 2}" y="22" text-anchor="middle"
         font-size="13" font-weight="800" fill="${P.textDeep}" letter-spacing="-0.015em"
         font-family="${F}">${esc(d.title)}</text>`
    : "";

  const tileEls = tiles.map((t, i) => {
    const x = PAD_X + i * (tW + 12);
    const col = COLS[i % COLS.length];
    return `
      <rect x="${x}" y="${tY}" width="${tW}" height="${tH}" rx="10" fill="${P.card}" stroke="${P.grid}" stroke-width="1"/>
      <rect x="${x}" y="${tY}" width="${tW}" height="4" rx="2" fill="${col}"/>
      <text x="${x + tW / 2}" y="${tY + 60}" text-anchor="middle"
        font-size="24" font-weight="700" fill="${P.textDeep}" letter-spacing="-0.02em"
        font-family="${FN}">${esc(t.value)}</text>
      <text x="${x + tW / 2}" y="${tY + 86}" text-anchor="middle"
        font-size="11" font-weight="700" fill="${col}" letter-spacing="0.04em"
        font-family="${F}">${esc(t.label)}</text>
      ${t.sub ? `<text x="${x + tW / 2}" y="${tY + 106}" text-anchor="middle"
        font-size="9" fill="${P.muted}" font-family="${F}">${esc(t.sub)}</text>` : ""}
    `;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" class="svg-bg" fill="${P.surface}" rx="10"/>
    ${titleEl}${tileEls}
  </svg>`;
}

// ─────────────────────────────────────────────────────────────────────────
// 2. MATURITY RADAR — N-axis spider chart with central score disc
// ─────────────────────────────────────────────────────────────────────────
export interface RadarDimension { label: string[]; score: number; max: number }
export interface MaturityRadarData {
  dimensions: RadarDimension[];
  centerValue: number | string;
  centerSub?: string;     // e.g. "out of 100"
  centerTier?: string;    // e.g. "RUN"
  title?: string;
}

function expandBounds(
  minX: number, minY: number, maxX: number, maxY: number,
  x0: number, y0: number, x1: number, y1: number,
): [number, number, number, number] {
  return [
    Math.min(minX, x0),
    Math.min(minY, y0),
    Math.max(maxX, x1),
    Math.max(maxY, y1),
  ];
}

export function maturityRadar(d: MaturityRadarData): string {
  const dims = d.dimensions;
  const n = dims.length;
  const W = 580;
  const H = 560;
  const cx = W / 2;
  const cy = H / 2 + (d.title ? 10 : 0);
  const maxR = n <= 8 ? 180 : n <= 10 ? 162 : 138;
  const baseLabelR = maxR + 32;
  const labelSize = n > 9 ? 10.5 : 11.5;
  const lineH = 14;
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  /** Push labels outward on crowded sides so two-line captions do not overlap or clip. */
  const labelRadius = (i: number) => {
    const c = Math.cos(ang(i));
    const s = Math.sin(ang(i));
    let extra = 0;
    if (c < -0.2) extra += 28;
    else if (c > 0.2) extra += 16;
    if (Math.abs(s) > 0.82) extra += 12;
    return baseLabelR + extra;
  };

  const gridLines = [0.25, 0.5, 0.75, 1].map((pct) => {
    const r = maxR * pct;
    const pts = dims.map((_, i) => `${cx + r * Math.cos(ang(i))},${cy + r * Math.sin(ang(i))}`).join(" ");
    return `<polygon points="${pts}" fill="none" stroke="${P.grid}" stroke-width="${pct === 1 ? 1.5 : 0.8}"/>`;
  }).join("");

  const pctLabels = [50, 100].map((pct) => {
    const r = maxR * (pct / 100);
    return `<text x="${cx + 4}" y="${cy - r + 12}" font-size="9" fill="${P.muted}" font-family="${F}">${pct}%</text>`;
  }).join("");

  const spokes = dims.map((_, i) =>
    `<line x1="${cx}" y1="${cy}" x2="${cx + maxR * Math.cos(ang(i))}" y2="${cy + maxR * Math.sin(ang(i))}" stroke="${P.grid}" stroke-width="1"/>`,
  ).join("");

  const dataPts = dims.map(({ score, max }, i) => {
    const r = maxR * Math.max(0, Math.min(1, score / max));
    return `${cx + r * Math.cos(ang(i))},${cy + r * Math.sin(ang(i))}`;
  }).join(" ");

  type LabelMeta = { el: string; x0: number; y0: number; x1: number; y1: number };
  const labelMetas: LabelMeta[] = dims.map(({ label }, i) => {
    const a = ang(i);
    const lr = labelRadius(i);
    const lx = cx + lr * Math.cos(a);
    const ly = cy + lr * Math.sin(a);
    const anchor = Math.abs(Math.cos(a)) < 0.15 ? "middle" : Math.cos(a) < 0 ? "end" : "start";
    const totalH = Math.max(1, label.length) * lineH;
    const baseY = ly - totalH / 2;
    const maxLineW = Math.max(...label.map((l) => approxW(l, labelSize)), labelSize * 4);
    let x0: number, x1: number;
    if (anchor === "middle") {
      x0 = lx - maxLineW / 2;
      x1 = lx + maxLineW / 2;
    } else if (anchor === "end") {
      x0 = lx - maxLineW;
      x1 = lx + 4;
    } else {
      x0 = lx - 4;
      x1 = lx + maxLineW;
    }
    const y0 = baseY;
    const y1 = baseY + totalH + 6;
    const tspans = label.map((l, li) => `<tspan x="${lx}" dy="${li === 0 ? 0 : lineH}">${esc(l)}</tspan>`).join("");
    const el = `<text y="${baseY + 4}" text-anchor="${anchor}" font-size="${labelSize}" font-weight="700" fill="${P.text}" font-family="${F}">${tspans}</text>`;
    return { el, x0, y0, x1, y1 };
  });
  const axisLabels = labelMetas.map((m) => m.el).join("");

  let minX = cx - maxR;
  let minY = cy - maxR;
  let maxX = cx + maxR;
  let maxY = cy + maxR;
  if (d.title) {
    const tw = approxW(d.title, 15);
    [minX, minY, maxX, maxY] = expandBounds(minX, minY, maxX, maxY, cx - tw / 2, 8, cx + tw / 2, 36);
  }
  [minX, minY, maxX, maxY] = expandBounds(minX, minY, maxX, maxY, cx - 58, cy - 58, cx + 58, cy + 58);
  for (const m of labelMetas) {
    [minX, minY, maxX, maxY] = expandBounds(minX, minY, maxX, maxY, m.x0, m.y0, m.x1, m.y1);
  }
  const pad = { t: 28, r: 36, b: 32, l: 40 };
  const vbX = minX - pad.l;
  const vbY = minY - pad.t;
  const vbW = maxX - minX + pad.l + pad.r;
  const vbH = maxY - minY + pad.t + pad.b;

  const dots = dims.map(({ score, max }, i) => {
    const pct = score / max;
    if (pct === 0 || pct === 1) return "";
    const r = maxR * pct;
    return `<circle cx="${cx + r * Math.cos(ang(i))}" cy="${cy + r * Math.sin(ang(i))}" r="4.5" fill="${P.primary}" stroke="${P.white}" stroke-width="1.5"/>`;
  }).join("");

  const tierColor = (tier?: string) => {
    if (!tier) return P.primary;
    const t = tier.toUpperCase();
    if (t === "FLY" || t === "RUN") return P.success;
    if (t === "WALK") return P.warning;
    return P.danger;
  };

  return `<svg xmlns="http://www.w3.org/2000/svg" class="chart-maturity-radar" width="100%" viewBox="${vbX.toFixed(1)} ${vbY.toFixed(1)} ${vbW.toFixed(1)} ${vbH.toFixed(1)}" preserveAspectRatio="xMidYMid meet" overflow="visible" style="max-width:${W}px">
    <rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" class="svg-bg" fill="${P.surface}" rx="10"/>
    ${d.title ? `<text x="${W / 2}" y="32" text-anchor="middle" font-size="15" font-weight="800" fill="${P.textDeep}" font-family="${F}">${esc(d.title)}</text>` : ""}
    ${gridLines}${pctLabels}${spokes}
    <polygon points="${dataPts}" fill="${P.primary}" fill-opacity="0.12" stroke="${P.primary}" stroke-width="2.5" stroke-linejoin="round"/>
    ${dots}${axisLabels}
    <circle cx="${cx}" cy="${cy}" r="52" fill="${P.textDeep}"/>
    <text x="${cx}" y="${cy - 10}" text-anchor="middle" font-size="32" font-weight="700" fill="${P.white}" letter-spacing="-0.02em" font-family="${FN}">${esc(String(d.centerValue))}</text>
    ${d.centerSub ? `<text x="${cx}" y="${cy + 10}" text-anchor="middle" font-size="10" fill="rgba(255,255,255,0.55)" font-family="${F}">${esc(d.centerSub)}</text>` : ""}
    ${d.centerTier ? `<text x="${cx}" y="${cy + 27}" text-anchor="middle" font-size="12" font-weight="800" fill="${tierColor(d.centerTier)}" font-family="${F}">${esc(d.centerTier)}</text>` : ""}
  </svg>`;
}

// ─────────────────────────────────────────────────────────────────────────
// 3. FEATURE GAUGES — circular progress rings
// ─────────────────────────────────────────────────────────────────────────
export interface GaugeItem { label: string[]; pct: number; status?: "good" | "warn" | "bad" | "neutral" }
export interface FeatureGaugesData { gauges: GaugeItem[]; title?: string }

export function featureGauges(d: FeatureGaugesData): string {
  const items = d.gauges;
  const W = Math.max(720, items.length * 130);
  const H = 230;
  const colorOf = (s?: string, pct?: number) => {
    if (s === "good") return P.success;
    if (s === "warn") return P.primary;
    if (s === "bad")  return P.danger;
    if (s === "neutral") return P.neutral;
    if (pct === undefined) return P.primary;
    if (pct >= 80) return P.success;
    if (pct >= 40) return P.primary;
    if (pct > 0)   return P.danger;
    return P.neutral;
  };
  const gW = W / items.length;
  const r = 56, strokeW = 11;
  const circ = 2 * Math.PI * r;
  const cy = 118;

  const gauges = items.map(({ label, pct, status }, i) => {
    const cx = gW * i + gW / 2;
    const dash = (Math.max(0, Math.min(100, pct)) / 100) * circ;
    const col = colorOf(status, pct);
    return `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${P.grid}" stroke-width="${strokeW}"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="${strokeW}"
        stroke-dasharray="${dash} ${circ - dash}" stroke-linecap="round"
        transform="rotate(-90 ${cx} ${cy})" opacity="0.92"/>
      <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="24" font-weight="700" fill="${P.textDeep}" letter-spacing="-0.02em" font-family="${FN}">${pct}%</text>
      ${label.map((l, li) =>
        `<text x="${cx}" y="${cy + 14 + li * 14}" text-anchor="middle" font-size="11" font-weight="600" fill="${P.muted}" font-family="${F}">${esc(l)}</text>`,
      ).join("")}
    `;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" class="svg-bg" fill="${P.surface}" rx="10"/>
    ${d.title ? `<text x="${W / 2}" y="26" text-anchor="middle" font-size="15" font-weight="800" fill="${P.textDeep}" font-family="${F}">${esc(d.title)}</text>` : ""}
    ${gauges}
  </svg>`;
}

// ─────────────────────────────────────────────────────────────────────────
// 4. OPA DONUT — donut chart with side legend (active vs disabled)
// ─────────────────────────────────────────────────────────────────────────
export interface OpaDonutData {
  total: number;
  active: number;
  disabled: number;
  centerValue?: string;
  centerLabel?: string;     // e.g. "policy sets"
  centerSub?: string;       // e.g. "100% pipeline coverage"
  activeLabel?: string;     // legend heading, e.g. "ACTIVE (11)"
  disabledLabel?: string;   // legend heading, e.g. "DISABLED (9)"
  activeItems?: string[];
  disabledItems?: string[];
  title?: string;
}

export function opaDonut(d: OpaDonutData): string {
  const W = 620, H = 320, cx = 165, cy = 165, R = 108, ri = 64;
  const sliceSum = d.active + d.disabled;
  const total = Math.max(1, sliceSum > 0 ? sliceSum : d.total);
  const slices = [
    { count: d.active,   col: P.success },
    { count: d.disabled, col: P.warning },
  ];
  let angle = -Math.PI / 2;
  const paths = slices.map(({ count, col }) => {
    if (count <= 0) return "";
    const sweep = (count / total) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(angle), y1 = cy + R * Math.sin(angle);
    const x2 = cx + R * Math.cos(angle + sweep), y2 = cy + R * Math.sin(angle + sweep);
    const xi1 = cx + ri * Math.cos(angle), yi1 = cy + ri * Math.sin(angle);
    const xi2 = cx + ri * Math.cos(angle + sweep), yi2 = cy + ri * Math.sin(angle + sweep);
    const lg = sweep > Math.PI ? 1 : 0;
    const path = `<path d="M ${x1} ${y1} A ${R} ${R} 0 ${lg} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${ri} ${ri} 0 ${lg} 0 ${xi1} ${yi1} Z" fill="${col}" opacity="0.9" stroke="${P.white}" stroke-width="3"/>`;
    angle += sweep;
    return path;
  }).join("");

  // Zero-slice edge case (e.g. 0 policy sets with total=0) — draw a neutral ring so the chart is visible.
  const emptyRing = sliceSum === 0
    ? `<circle cx="${cx}" cy="${cy}" r="${(R + ri) / 2}" fill="none" stroke="${P.grid}" stroke-width="${R - ri}" stroke-dasharray="6 4" opacity="0.85"/>`
    : "";

  const lx = 305, ly = 50;
  const aItems = (d.activeItems   ?? []).slice(0, 8);
  const dItems = (d.disabledItems ?? []).slice(0, 6);

  const legend = `
    <text x="${lx}" y="${ly}" font-size="10" font-weight="800" letter-spacing="0.08em" fill="${P.success}" font-family="${F}">${esc(d.activeLabel ?? `ACTIVE (${d.active})`)}</text>
    ${aItems.map((s, i) =>
      `<text x="${lx + 10}" y="${ly + 16 + i * 15}" font-size="10" fill="${P.text}" font-family="${F}">• ${esc(s)}</text>`,
    ).join("")}
    <text x="${lx}" y="${ly + 16 + (aItems.length || 1) * 15 + 12}" font-size="10" font-weight="800" letter-spacing="0.08em" fill="${P.warning}" font-family="${F}">${esc(d.disabledLabel ?? `DISABLED (${d.disabled})`)}</text>
    ${dItems.map((s, i) =>
      `<text x="${lx + 10}" y="${ly + 16 + (aItems.length || 1) * 15 + 28 + i * 15}" font-size="10" fill="${P.muted}" font-family="${F}">• ${esc(s)}</text>`,
    ).join("")}
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" class="svg-bg" fill="${P.surface}" rx="10"/>
    ${d.title ? `<text x="${W / 2}" y="28" text-anchor="middle" font-size="15" font-weight="800" fill="${P.textDeep}" font-family="${F}">${esc(d.title)}</text>` : ""}
    ${emptyRing}${paths}
    <text x="${cx}" y="${cy - 16}" text-anchor="middle" font-size="36" font-weight="700" fill="${P.textDeep}" letter-spacing="-0.02em" font-family="${FN}">${esc(d.centerValue ?? String(d.total))}</text>
    ${d.centerLabel ? `<text x="${cx}" y="${cy + 6}" text-anchor="middle" font-size="11" fill="${P.muted}" font-family="${F}">${esc(d.centerLabel)}</text>` : ""}
    ${d.centerSub ? `<text x="${cx}" y="${cy + 24}" text-anchor="middle" font-size="11.5" font-weight="700" fill="${P.success}" font-family="${FN}">${esc(d.centerSub)}</text>` : ""}
    ${legend}
  </svg>`;
}

// ─────────────────────────────────────────────────────────────────────────
// 5. ORG FOOTPRINT — diverging bars (workspaces left, pipelines right)
// ─────────────────────────────────────────────────────────────────────────
export interface OrgFootprintRow { name: string; ws: number; pl: number }
export interface OrgFootprintData { orgs: OrgFootprintRow[]; title?: string }

function categorise(ratio: number) {
  if (ratio < 0.85)  return { label: "WORKSPACE-LED", col: P.warning };
  if (ratio <= 1.65) return { label: "BALANCED",      col: P.success };
  return                       { label: "PIPELINE-LED",  col: P.info };
}

export function orgFootprint(d: OrgFootprintData): string {
  const orgs = d.orgs.slice(0, 12);
  const W = 720;
  const PAD_L = 16, PAD_R = 16;
  const ORG_NAME_W = 140, NAME_BAR_GAP = 12;
  const BAR_W = 200, BAR_AREA_GAP = 14, CHIP_W = 96;
  const ROW_H = 32, BAR_H = 12;
  const CENTER_X = PAD_L + ORG_NAME_W + NAME_BAR_GAP + BAR_W;
  const CHIP_X = CENTER_X + BAR_W + BAR_AREA_GAP;

  // Auto-scale: cap at the max value rounded up to nearest 100
  const maxVal = orgs.reduce((m, o) => Math.max(m, o.ws, o.pl), 100);
  const SCALE_MAX = Math.ceil(maxVal / 100) * 100;

  const TITLE_Y = 24, SUBTITLE_Y = 44;
  const SECTION_LABEL_Y = 72, TICK_LABEL_Y = 86, AXIS_BASE_Y = 92;
  const ROWS_START_Y = 102;
  const EXPLAINER_PAD = 28;
  const H = ROWS_START_Y + orgs.length * ROW_H + EXPLAINER_PAD;

  // Tick marks at 0/25/50/75/100% of scale
  const TICK_VALUES = [0, SCALE_MAX * 0.25, SCALE_MAX * 0.5, SCALE_MAX * 0.75, SCALE_MAX].map((v) => Math.round(v));
  const axisTicks = TICK_VALUES.flatMap((v) => {
    const offset = (v / SCALE_MAX) * BAR_W;
    const xL = CENTER_X - offset;
    const xR = CENTER_X + offset;
    const lbl = v.toLocaleString("en-US");
    const els = [
      `<line x1="${xL.toFixed(1)}" y1="${AXIS_BASE_Y}" x2="${xL.toFixed(1)}" y2="${AXIS_BASE_Y + 4}" stroke="${P.grid}" stroke-width="1"/>`,
      `<text x="${xL.toFixed(1)}" y="${TICK_LABEL_Y}" text-anchor="middle" font-size="8.5" font-weight="600" fill="${P.muted}" letter-spacing="0.04em" font-family="${F}">${lbl}</text>`,
    ];
    if (v !== 0) {
      els.push(
        `<line x1="${xR.toFixed(1)}" y1="${AXIS_BASE_Y}" x2="${xR.toFixed(1)}" y2="${AXIS_BASE_Y + 4}" stroke="${P.grid}" stroke-width="1"/>`,
        `<text x="${xR.toFixed(1)}" y="${TICK_LABEL_Y}" text-anchor="middle" font-size="8.5" font-weight="600" fill="${P.muted}" letter-spacing="0.04em" font-family="${F}">${lbl}</text>`,
      );
    }
    return els;
  });

  const wsLabelX = CENTER_X - BAR_W / 2;
  const plLabelX = CENTER_X + BAR_W / 2;
  const sectionLabels = `
    <text x="${wsLabelX}" y="${SECTION_LABEL_Y}" text-anchor="middle" font-size="9" font-weight="700" fill="${P.primary}" letter-spacing="0.22em" font-family="${F}">WORKSPACES</text>
    <text x="${plLabelX}" y="${SECTION_LABEL_Y}" text-anchor="middle" font-size="9" font-weight="700" fill="${P.secondary}" letter-spacing="0.22em" font-family="${F}">PIPELINES</text>
  `;

  const FONT_VAL = 9.5, VALUE_PAD = 5;
  const rows = orgs.map((org, idx) => {
    const ratio = org.pl / Math.max(1, org.ws);
    const cat = categorise(ratio);
    const yTop = ROWS_START_Y + idx * ROW_H;
    const yBar = yTop + (ROW_H - BAR_H) / 2;
    const yMid = yTop + ROW_H / 2;

    const wsBarW = (org.ws / SCALE_MAX) * BAR_W;
    const plBarW = (org.pl / SCALE_MAX) * BAR_W;
    const wsBarX = CENTER_X - wsBarW;

    const nameEl = `<text x="${PAD_L + ORG_NAME_W}" y="${yMid + 3.5}" text-anchor="end" font-size="10.5" font-weight="500" fill="${P.text}" letter-spacing="-0.005em" font-family="${F}">${esc(org.name)}</text>`;
    const wsBar  = `<rect x="${wsBarX.toFixed(1)}" y="${yBar}" width="${wsBarW.toFixed(1)}" height="${BAR_H}" rx="2.5" fill="${P.primary}" opacity="0.95"/>`;
    const plBar  = `<rect x="${CENTER_X}" y="${yBar}" width="${plBarW.toFixed(1)}" height="${BAR_H}" rx="2.5" fill="${P.secondary}" opacity="0.95"/>`;

    const wsValW = approxW(String(org.ws), FONT_VAL);
    const plValW = approxW(String(org.pl), FONT_VAL);
    const wsValueEl = wsBarW >= wsValW + 10
      ? `<text x="${(CENTER_X - 5).toFixed(1)}" y="${yMid + 3.2}" text-anchor="end"   font-size="${FONT_VAL}" font-weight="700" fill="${P.white}" font-family="${F}">${org.ws}</text>`
      : `<text x="${(wsBarX - VALUE_PAD).toFixed(1)}" y="${yMid + 3.2}" text-anchor="end" font-size="${FONT_VAL}" font-weight="700" fill="${P.primary}" font-family="${F}">${org.ws}</text>`;
    const plValueEl = plBarW >= plValW + 10
      ? `<text x="${(CENTER_X + 5).toFixed(1)}" y="${yMid + 3.2}" text-anchor="start" font-size="${FONT_VAL}" font-weight="700" fill="${P.white}" font-family="${F}">${org.pl}</text>`
      : `<text x="${(CENTER_X + plBarW + VALUE_PAD).toFixed(1)}" y="${yMid + 3.2}" text-anchor="start" font-size="${FONT_VAL}" font-weight="700" fill="${P.secondary}" font-family="${F}">${org.pl}</text>`;

    const chipH = 26, chipY = yTop + (ROW_H - chipH) / 2;
    const chipMid = CHIP_X + CHIP_W / 2;
    const chip = `
      <rect x="${CHIP_X}" y="${chipY}" width="${CHIP_W}" height="${chipH}" rx="5" fill="${cat.col}" opacity="0.11"/>
      <text x="${chipMid}" y="${chipY + 13}" text-anchor="middle" font-size="11" font-weight="700" fill="${cat.col}" letter-spacing="-0.005em" font-family="${F}">${ratio.toFixed(2)}×</text>
      <text x="${chipMid}" y="${chipY + 22}" text-anchor="middle" font-size="7" font-weight="700" fill="${cat.col}" letter-spacing="0.14em" font-family="${F}">${cat.label}</text>
    `;

    return nameEl + wsBar + plBar + wsValueEl + plValueEl + chip;
  }).join("");

  const centerAxis = `<line x1="${CENTER_X}" y1="${AXIS_BASE_Y}" x2="${CENTER_X}" y2="${ROWS_START_Y + orgs.length * ROW_H}" stroke="${P.grid}" stroke-width="1.2"/>`;

  const title = `
    <text x="${W / 2}" y="${TITLE_Y}" text-anchor="middle" font-size="13.5" font-weight="800" fill="${P.textDeep}" letter-spacing="-0.015em" font-family="${F}">${esc(d.title ?? "Top Organisations · Infrastructure DNA")}</text>
    <text x="${W / 2}" y="${SUBTITLE_Y}" text-anchor="middle" font-size="9.5" font-weight="500" fill="${P.muted}" font-family="${F}">Workspaces vs pipelines per organisation, with pipelines-per-workspace ratio</text>
  `;

  const explainEl = `<text x="${W / 2}" y="${ROWS_START_Y + orgs.length * ROW_H + 18}" text-anchor="middle" font-size="8.5" font-weight="500" fill="${P.muted}" letter-spacing="0.02em" font-family="${F}">Bar shape reveals each org\u2019s infrastructure DNA \u2014 symmetric is balanced, right-heavy is automation-led, left-heavy is workspace-led</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" class="svg-bg" fill="${P.surface}" rx="10"/>
    ${title}${sectionLabels}${axisTicks.join("")}${centerAxis}${rows}${explainEl}
  </svg>`;
}

// ─────────────────────────────────────────────────────────────────────────
// 6. PRIORITY MATRIX — 3 lanes (P1/P2/P3) with effort chips
// ─────────────────────────────────────────────────────────────────────────
export interface PriorityAction { text: string; effort: "Low" | "Medium" | "High" }
export interface PriorityLane {
  badge: string;       // "P1" / "P2" / "P3"
  label: string;       // "Do Now" / "This Quarter" / "Next Quarter"
  sub: string;         // sub-headline
  color?: "p1" | "p2" | "p3";
  actions: PriorityAction[];
}
export interface PriorityMatrixData { lanes: PriorityLane[]; title?: string }

export function priorityMatrix(d: PriorityMatrixData): string {
  const lanes = d.lanes.slice(0, 3);
  const colorOf = (key: string | undefined, idx: number): string => {
    if (key === "p1") return P.danger;
    if (key === "p2") return P.warning;
    if (key === "p3") return P.info;
    return [P.danger, P.warning, P.info][idx] ?? P.info;
  };

  const W = 720, PAD = 14, COL_GAP = 16;
  const COL_W = Math.floor((W - PAD * 2 - COL_GAP * 2) / 3);
  const HEAD_H = 64, ROW_H = 50, ROW_DBL = 66, ROW_GAP = 4, FOOTER = 34;
  const ACCENT_H = 3, CARD_RX = 10;

  const laneRowHs = lanes.map(({ actions }) =>
    actions.map(({ text }) => wrap(text, 26).length > 1 ? ROW_DBL : ROW_H),
  );
  const laneBodyHs = laneRowHs.map((rhs) => rhs.reduce((s, h) => s + h, 0) + (rhs.length - 1) * ROW_GAP);
  const maxBodyH = Math.max(0, ...laneBodyHs);
  const LANE_H = HEAD_H + 14 + maxBodyH + 18;
  const H = PAD * 2 + LANE_H + FOOTER;

  function effortChip(x: number, y: number, effort: string) {
    const col = effort === "Low" ? P.success : effort === "High" ? P.danger : P.warning;
    const w = 46, h = 15;
    return `
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${col}" opacity="0.14"/>
      <text x="${x + w / 2}" y="${y + 10.5}" text-anchor="middle" font-size="8" font-weight="700" fill="${col}" letter-spacing="0.1em" font-family="${F}">${effort.toUpperCase()}</text>
    `;
  }

  const lanesSvg = lanes.map((lane, idx) => {
    const x = PAD + idx * (COL_W + COL_GAP);
    const y = PAD;
    const color = colorOf(lane.color, idx);
    const rowHs = laneRowHs[idx]!;
    const innerX = x + 18;

    const clipId = `pm-card-${idx}-${Math.floor(Math.random() * 100000).toString(36)}`;
    const cardStructure = `
      <defs><clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${COL_W}" height="${LANE_H}" rx="${CARD_RX}"/></clipPath></defs>
      <g clip-path="url(#${clipId})">
        <rect x="${x}" y="${y}" width="${COL_W}" height="${LANE_H}" fill="${color}"/>
        <rect x="${x}" y="${y + ACCENT_H}" width="${COL_W}" height="${LANE_H - ACCENT_H}" fill="${P.card}"/>
      </g>
    `;

    const badgeY = y + 18;
    const badgeW = 26, badgeH = 15;
    const header = `
      <rect x="${innerX}" y="${badgeY}" width="${badgeW}" height="${badgeH}" rx="4" fill="${color}"/>
      <text x="${innerX + badgeW / 2}" y="${badgeY + 10.5}" text-anchor="middle" font-size="9" font-weight="700" fill="${P.white}" letter-spacing="0.04em" font-family="${F}">${esc(lane.badge)}</text>
      <text x="${innerX + badgeW + 9}" y="${badgeY + 11.5}" font-size="12.5" font-weight="700" fill="${P.textDeep}" letter-spacing="-0.01em" font-family="${F}">${esc(lane.label)}</text>
      <text x="${innerX}" y="${y + HEAD_H - 10}" font-size="9.5" font-weight="400" fill="${P.muted}" font-family="${F}">${esc(lane.sub)}</text>
    `;

    const dividerY = y + HEAD_H;
    const divider = `<line x1="${innerX}" y1="${dividerY}" x2="${x + COL_W - 18}" y2="${dividerY}" stroke="${P.grid}" stroke-width="1"/>`;

    let rowY = dividerY + 14;
    const rows = lane.actions.map(({ text, effort }, ri) => {
      const lines = wrap(text, 26);
      const rh = rowHs[ri]!;
      const firstTextY = rowY + 10;
      const lineH = 13;
      const textEls = lines.map((l, li) =>
        `<text x="${innerX + 14}" y="${firstTextY + li * lineH}" font-size="10" font-weight="500" fill="${P.text}" letter-spacing="-0.005em" font-family="${F}">${esc(l)}</text>`,
      ).join("");
      const dotCY = firstTextY - 4;
      const chipY = firstTextY + (lines.length - 1) * lineH + 10;
      const out = `
        <circle cx="${innerX + 4}" cy="${dotCY}" r="2.8" fill="${color}"/>
        ${textEls}
        ${effortChip(innerX + 14, chipY, effort)}
      `;
      rowY += rh + ROW_GAP;
      return out;
    }).join("");

    return cardStructure + header + divider + rows;
  }).join("");

  const footerY = H - 14;
  const legendItems = [
    { label: "LOW",    col: P.success },
    { label: "MEDIUM", col: P.warning },
    { label: "HIGH",   col: P.danger  },
  ];
  const effortW = approxW("EFFORT", 8, 0.18) + 3;
  let cursor = effortW + 18;
  const positions = legendItems.map((it) => {
    const dotX = cursor;
    const labelX = dotX + 9;
    cursor = labelX + approxW(it.label, 8.5, 0.1) + 3 + 22;
    return { dotX, labelX, label: it.label, col: it.col };
  });
  const totalLegendW = cursor - 22;
  const legendStart = Math.round((W - totalLegendW) / 2);

  const legendSvg = `
    <text x="${legendStart}" y="${footerY}" font-size="8" font-weight="700" fill="${P.muted}" letter-spacing="0.18em" font-family="${F}">EFFORT</text>
    ${positions.map(({ dotX, labelX, label, col }) => `
      <circle cx="${(legendStart + dotX).toFixed(1)}" cy="${footerY - 3}" r="2.6" fill="${col}"/>
      <text x="${(legendStart + labelX).toFixed(1)}" y="${footerY}" font-size="8.5" font-weight="600" fill="${P.muted}" letter-spacing="0.1em" font-family="${F}">${label}</text>
    `).join("")}
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" class="svg-bg" fill="${P.surface}" rx="10"/>
    ${d.title ? `<text x="${W / 2}" y="${PAD - 4}" text-anchor="middle" font-size="13" font-weight="800" fill="${P.textDeep}" font-family="${F}">${esc(d.title)}</text>` : ""}
    ${lanesSvg}${legendSvg}
  </svg>`;
}

// ─────────────────────────────────────────────────────────────────────────
// 7. BAR — generic horizontal bar chart (counts, percentages, costs)
// ─────────────────────────────────────────────────────────────────────────
export interface BarItem {
  label: string;
  value: number;
  tone?: "primary" | "secondary" | "tertiary" | "success" | "warning" | "danger";
}
export interface BarData {
  bars: BarItem[];
  title?: string;
  unit?: string;          // appended to value labels (e.g. "%", "$")
  prefix?: string;        // prefixed (e.g. "$")
}

export function bar(d: BarData): string {
  const items = d.bars.slice(0, 20);
  const W = 720;
  const PAD_T = d.title ? 60 : 24;
  const PAD_B = 28;
  const LABEL_W = 180, BAR_GAP = 10, VAL_W = 64;
  const ROW_H = 28;
  const H = PAD_T + items.length * ROW_H + PAD_B;
  const chartW = W - 16 - LABEL_W - BAR_GAP - VAL_W - 16;
  const x0 = 16 + LABEL_W + BAR_GAP;
  const maxVal = Math.max(1, ...items.map((it) => it.value));

  const toneColor = (t?: string) => {
    if (t === "secondary") return P.secondary;
    if (t === "tertiary")  return P.tertiary;
    if (t === "success")   return P.success;
    if (t === "warning")   return P.warning;
    if (t === "danger")    return P.danger;
    return P.primary;
  };

  const fmt = (v: number) => {
    const n = Number.isInteger(v) ? v.toString() : v.toFixed(1);
    const grouped = parseFloat(n).toLocaleString("en-US", { maximumFractionDigits: 1 });
    return `${d.prefix ?? ""}${grouped}${d.unit ?? ""}`;
  };

  const titleEl = d.title
    ? `<text x="16" y="28" font-size="13" font-weight="800" fill="${P.textDeep}" letter-spacing="-0.015em" font-family="${F}">${esc(d.title)}</text>`
    : "";

  const rows = items.map((it, i) => {
    const y = PAD_T + i * ROW_H;
    const yMid = y + ROW_H / 2;
    const w = (it.value / maxVal) * chartW;
    const col = toneColor(it.tone);
    return `
      <text x="${16 + LABEL_W}" y="${yMid + 3.5}" text-anchor="end" font-size="11" font-weight="500" fill="${P.text}" font-family="${F}">${esc(it.label)}</text>
      <rect x="${x0}" y="${y + 7}" width="${chartW}" height="14" rx="3" fill="${P.grid}" opacity="0.6"/>
      <rect x="${x0}" y="${y + 7}" width="${w.toFixed(1)}" height="14" rx="3" fill="${col}" opacity="0.95"/>
      <text x="${x0 + w + 6}" y="${yMid + 3.5}" font-size="11.5" font-weight="700" fill="${col}" font-family="${FN}">${esc(fmt(it.value))}</text>
    `;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" class="svg-bg" fill="${P.surface}" rx="10"/>
    ${titleEl}${rows}
  </svg>`;
}

// ─────────────────────────────────────────────────────────────────────────
// 8. MONTHLY GROWTH — dual-line cumulative chart over N months
// ─────────────────────────────────────────────────────────────────────────
export interface GrowthPoint {
  label: string;          // e.g. "Jun '25"
  workspaces: number;     // cumulative count at month end
  pipelines:  number;     // cumulative count at month end
}
export interface MonthlyGrowthData {
  points: GrowthPoint[];        // time-ordered, oldest first
  title?: string;
  subtitle?: string;
  /** Optional summary chips (e.g. "+40% / 12 mo") shown top-right per series. */
  growth?: { workspaces?: string; pipelines?: string };
}

export function monthlyGrowth(d: MonthlyGrowthData): string {
  const points = d.points;
  const W = 760, H = 380;

  const wsCol = P.primary;
  const plCol = P.tertiary;

  // Detect growth chip presence early so we can reserve vertical space for them.
  // Historically the chips were rendered in the same y-band as the title and
  // collided whenever the chip text was long enough to grow leftward into the
  // title's footprint. We now place them on their own row below the subtitle
  // and pad the plot area to suit, so the chart is robust regardless of chip
  // text length or title width.
  const hasChips = !!(d.growth?.workspaces || d.growth?.pipelines);
  const CHIP_ROW_H = 28;

  // PAD_R is generous so end-of-line value annotations have room and never clip.
  const PAD_L = 60, PAD_R = 80;
  const PAD_T = (d.title ? 70 : 36) + (hasChips ? CHIP_ROW_H : 0);
  const PAD_B = 56;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  // Y axis — shared, scaled to the larger of the two series
  const maxRaw = Math.max(1, ...points.flatMap((p) => [p.workspaces, p.pipelines]));
  function niceCeil(n: number): number {
    const pow = Math.pow(10, Math.floor(Math.log10(n)));
    const norm = n / pow;
    if (norm <= 1) return 1 * pow;
    if (norm <= 2) return 2 * pow;
    if (norm <= 5) return 5 * pow;
    return 10 * pow;
  }
  const yMax = niceCeil(maxRaw * 1.05);
  const ticks = 5;

  const xAt = (i: number) => PAD_L + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const yAt = (v: number) => PAD_T + plotH - (v / yMax) * plotH;

  let grid = "";
  for (let i = 0; i <= ticks; i++) {
    const v = (yMax * i) / ticks;
    const y = yAt(v);
    grid += `
      <line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" stroke="${P.grid}" stroke-width="1" ${i === 0 ? "" : `stroke-dasharray="3 4" opacity="0.55"`}/>
      <text x="${PAD_L - 10}" y="${y + 3.5}" text-anchor="end" font-size="10" font-weight="500" fill="${P.muted}" font-family="${FN}">${Math.round(v).toLocaleString("en-US")}</text>
    `;
  }

  const xLabelStep = points.length > 18 ? 3 : points.length > 12 ? 2 : 1;
  const xLabels = points.map((p, i) => {
    if (i % xLabelStep !== 0 && i !== points.length - 1) return "";
    return `<text x="${xAt(i)}" y="${PAD_T + plotH + 16}" text-anchor="middle" font-size="9.5" font-weight="600" fill="${P.muted}" font-family="${FN}">${esc(p.label)}</text>`;
  }).join("");

  function buildSeries(values: number[], color: string, areaOpacity: number) {
    if (values.length === 0) return { line: "", area: "", dots: "" };
    const linePts = values.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(" ");
    const areaPts = `${xAt(0).toFixed(1)},${yAt(0).toFixed(1)} ${linePts} ${xAt(values.length - 1).toFixed(1)},${yAt(0).toFixed(1)}`;
    const dots = values.map((v, i) =>
      `<circle cx="${xAt(i).toFixed(1)}" cy="${yAt(v).toFixed(1)}" r="3.2" fill="${color}" stroke="${P.surface}" stroke-width="1.5"/>`,
    ).join("");
    return {
      line: `<polyline points="${linePts}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`,
      area: `<polygon points="${areaPts}" fill="${color}" opacity="${areaOpacity}"/>`,
      dots,
    };
  }

  const wsSeries = buildSeries(points.map((p) => p.workspaces), wsCol, 0.10);
  const plSeries = buildSeries(points.map((p) => p.pipelines), plCol, 0.10);

  // End-of-line value pills.
  // Anchor inside the right padding so they NEVER clip.
  // Use a soft pill background tinted with the series color for legibility.
  const last = points[points.length - 1];
  let annot = "";
  if (last) {
    const lastX = xAt(points.length - 1);
    function pill(value: string, y: number, color: string) {
      const padX = 8, padY = 4, fs = 11;
      const tw = approxW(value, fs, 0);
      const w = tw + padX * 2;
      const h = fs + padY * 2;
      const x = Math.min(lastX + 10, W - PAD_R + 8);
      // Vertical centring around the line endpoint
      const ry = y - h / 2;
      return `
        <rect x="${x.toFixed(1)}" y="${ry.toFixed(1)}" width="${w.toFixed(1)}" height="${h}" rx="${(h / 2).toFixed(1)}" fill="${color}" opacity="0.16"/>
        <rect x="${x.toFixed(1)}" y="${ry.toFixed(1)}" width="${w.toFixed(1)}" height="${h}" rx="${(h / 2).toFixed(1)}" fill="none" stroke="${color}" stroke-width="1" opacity="0.55"/>
        <text x="${(x + w / 2).toFixed(1)}" y="${(ry + h / 2 + 3.6).toFixed(1)}" text-anchor="middle" font-size="${fs}" font-weight="800" fill="${color}" font-family="${FN}">${esc(value)}</text>
      `;
    }
    // If the two endpoints are too close vertically, nudge the lower one down.
    const wsY = yAt(last.workspaces);
    const plY = yAt(last.pipelines);
    let wsYAdj = wsY, plYAdj = plY;
    const minGap = 22;
    if (Math.abs(wsY - plY) < minGap) {
      if (wsY > plY) { wsYAdj = wsY + (minGap - (wsY - plY)) / 2; plYAdj = plY - (minGap - (wsY - plY)) / 2; }
      else           { plYAdj = plY + (minGap - (plY - wsY)) / 2; wsYAdj = wsY - (minGap - (plY - wsY)) / 2; }
    }
    annot = pill(last.workspaces.toLocaleString("en-US"), wsYAdj, wsCol)
          + pill(last.pipelines.toLocaleString("en-US"),  plYAdj, plCol);
  }

  const titleEl = d.title
    ? `<text x="${PAD_L}" y="28" font-size="13.5" font-weight="800" fill="${P.textDeep}" letter-spacing="-0.015em" font-family="${F}">${esc(d.title)}</text>`
    : "";
  const subtitleEl = d.subtitle
    ? `<text x="${PAD_L}" y="46" font-size="10" font-weight="500" fill="${P.muted}" font-family="${F}">${esc(d.subtitle)}</text>`
    : "";

  function chipRow() {
    const chips: { text: string; col: string }[] = [];
    if (d.growth?.workspaces) chips.push({ text: `Workspaces ${d.growth.workspaces}`, col: wsCol });
    if (d.growth?.pipelines)  chips.push({ text: `Pipelines ${d.growth.pipelines}`,   col: plCol });
    if (chips.length === 0) return "";

    // Chips render on their own row, below the title+subtitle and above the
    // plot. Anchored y is calculated relative to the title presence to keep
    // the spacing rhythm consistent with the rest of the chart.
    const chipY = (d.title ? 56 : 22);
    const chipH = 22;
    const chipGap = 8;

    // Right-align the chip group: rightmost chip's right edge sits at
    // (W - PAD_R), leftmost chip ends at the computed leftBound.
    const widths = chips.map((c) => approxW(c.text, 10, 0) + 22);
    let totalW = widths.reduce((s, w) => s + w, 0) + chipGap * Math.max(0, chips.length - 1);

    // Overflow guard: if the chip group would push into the title's space
    // (chips.left < PAD_L), drop the redundant "Workspaces" / "Pipelines"
    // prefixes — the legend at the bottom already disambiguates by colour.
    const minLeft = PAD_L;
    if (totalW > (W - PAD_R - minLeft)) {
      for (let i = 0; i < chips.length; i++) {
        const stripped = chips[i]!.text
          .replace(/^Workspaces\s+/i, "")
          .replace(/^Pipelines\s+/i, "");
        chips[i] = { ...chips[i]!, text: stripped };
        widths[i] = approxW(stripped, 10, 0) + 22;
      }
      totalW = widths.reduce((s, w) => s + w, 0) + chipGap * Math.max(0, chips.length - 1);
    }

    let cursor = W - PAD_R; // right edge in plot coords
    const els: string[] = [];
    for (let i = chips.length - 1; i >= 0; i--) {
      const c = chips[i]!;
      const w = widths[i]!;
      cursor -= w;
      els.push(`
        <rect x="${cursor.toFixed(1)}" y="${chipY}" width="${w.toFixed(1)}" height="${chipH}" rx="6" fill="${c.col}" opacity="0.14"/>
        <rect x="${cursor.toFixed(1)}" y="${chipY}" width="${w.toFixed(1)}" height="${chipH}" rx="6" fill="none" stroke="${c.col}" stroke-width="1" opacity="0.55"/>
        <text x="${(cursor + w / 2).toFixed(1)}" y="${(chipY + chipH / 2 + 3.6).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="${c.col}" font-family="${FN}">${esc(c.text)}</text>
      `);
      cursor -= chipGap;
    }
    return els.join("");
  }

  const legendY = H - 18;
  const legendItems = [
    { text: "Workspaces (cumulative)", col: wsCol },
    { text: "Pipelines (cumulative)",  col: plCol },
  ];
  let legCursor = PAD_L;
  const legendEls = legendItems.map((it) => {
    const lineX = legCursor;
    const labelX = legCursor + 22;
    const w = approxW(it.text, 9.5, 0);
    legCursor = labelX + w + 22;
    return `
      <line x1="${lineX}" y1="${legendY - 3}" x2="${lineX + 16}" y2="${legendY - 3}" stroke="${it.col}" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="${lineX + 8}" cy="${legendY - 3}" r="3" fill="${it.col}" stroke="${P.surface}" stroke-width="1.4"/>
      <text x="${labelX}" y="${legendY}" font-size="9.5" font-weight="600" fill="${P.muted}" font-family="${F}">${esc(it.text)}</text>
    `;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" class="svg-bg" fill="${P.surface}" rx="10"/>
    ${titleEl}${subtitleEl}${chipRow()}
    ${grid}
    ${wsSeries.area}${plSeries.area}
    ${wsSeries.line}${plSeries.line}
    ${wsSeries.dots}${plSeries.dots}
    ${annot}
    ${xLabels}
    ${legendEls}
  </svg>`;
}
