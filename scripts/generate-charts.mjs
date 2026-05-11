import { writeFileSync } from "node:fs";

const OUT = "/Users/samriddha/Harness-MCP-Servers/mcp-server-iacm/reports/tu-bvr-2026-05-09/assets";

const C = {
  blue: "#0278D5", navy: "#0d1f35", sky: "#38bdf8",
  green: "#059669", red: "#dc2626", amber: "#d97706",
  gray: "#94a3b8", light: "#e2e8f0", white: "#ffffff",
  bg: "#f8fafc", text: "#1e293b", muted: "#64748b",
  violet: "#7c3aed", teal: "#0891b2", indigo: "#4f46e5",
};

// Helper: multi-line SVG text using tspan
function mtext(x, y, lines, { anchor = "middle", size = 11, weight = "600", fill = C.text, lineH = 14 } = {}) {
  const totalH = (lines.length - 1) * lineH;
  const startDy = -totalH / 2;
  return `<text text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${fill}" font-family="Inter,sans-serif">${
    lines.map((l, i) =>
      `<tspan x="${x}" dy="${i === 0 ? startDy : lineH}">${l}</tspan>`
    ).join("")
  }</text>`;
}

// ── 1. Scorecard tiles ────────────────────────────────────────────────────
function scorecard() {
  const W = 740, H = 200;
  const tiles = [
    { value: "2,461", label: "Workspaces",      sub: "across 34 orgs",          col: C.blue   },
    { value: "4,911", label: "Pipelines",         sub: "across 373 projects",    col: C.indigo },
    { value: "100%",  label: "OPA Coverage",      sub: "all pipelines governed", col: C.green  },
    { value: "11",    label: "Active Policy Sets", sub: "of 20 total",           col: C.teal   },
    { value: "74/100",label: "Maturity Score",    sub: "RUN tier",               col: C.violet },
  ];
  const tW = (W - 40) / tiles.length, tH = 160, tY = 20;
  const rects = tiles.map(({ value, label, sub, col }, i) => {
    const x = 20 + i * tW;
    return `
      <rect x="${x + 4}" y="${tY}" width="${tW - 8}" height="${tH}" rx="8" fill="${C.bg}"/>
      <rect x="${x + 4}" y="${tY}" width="${tW - 8}" height="4" rx="2" fill="${col}"/>
      <text x="${x + tW / 2}" y="${tY + 56}" text-anchor="middle" font-size="26" font-weight="900" fill="${C.navy}" font-family="Inter,sans-serif">${value}</text>
      <text x="${x + tW / 2}" y="${tY + 78}" text-anchor="middle" font-size="12" font-weight="700" fill="${col}" font-family="Inter,sans-serif">${label}</text>
      <text x="${x + tW / 2}" y="${tY + 96}" text-anchor="middle" font-size="10" fill="${C.muted}" font-family="Inter,sans-serif">${sub}</text>
    `;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.white}" rx="10"/>
  ${rects}
</svg>`;
}

// ── 2. Radar / spider chart ───────────────────────────────────────────────
function radar() {
  const W = 580, H = 560, cx = 290, cy = 290, maxR = 190;
  const dims = [
    { label: ["Workspace", "Adoption"],    score: 20, max: 20 },
    { label: ["Pipeline", "Adoption"],     score: 15, max: 15 },
    { label: ["Pipeline", "Diversity"],    score: 10, max: 10 },
    { label: ["OPA", "Coverage"],          score: 10, max: 10 },
    { label: ["OPA Policy", "Sets"],       score: 5,  max: 5  },
    { label: ["Multi-Org", "Adoption"],    score: 5,  max: 5  },
    { label: ["Security", "Scanning"],     score: 8,  max: 15 },
    { label: ["Cost", "Estimation"],       score: 1,  max: 15 },
    { label: ["IaCM", "Templates"],        score: 0,  max: 5  },
  ];
  const n = dims.length;
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;

  // Grid rings
  const gridLines = [0.25, 0.5, 0.75, 1].map((pct) => {
    const r = maxR * pct;
    const pts = dims.map((_, i) => `${cx + r * Math.cos(ang(i))},${cy + r * Math.sin(ang(i))}`).join(" ");
    return `<polygon points="${pts}" fill="none" stroke="${C.light}" stroke-width="${pct === 1 ? 1.5 : 0.8}"/>`;
  }).join("");

  // Pct labels on vertical axis
  const pctLabels = [50, 100].map((pct) => {
    const r = maxR * (pct / 100);
    return `<text x="${cx + 4}" y="${cy - r + 12}" font-size="9" fill="${C.muted}" font-family="Inter,sans-serif">${pct}%</text>`;
  }).join("");

  // Axis spokes
  const spokes = dims.map((_, i) =>
    `<line x1="${cx}" y1="${cy}" x2="${cx + maxR * Math.cos(ang(i))}" y2="${cy + maxR * Math.sin(ang(i))}" stroke="${C.light}" stroke-width="1"/>`
  ).join("");

  // Data polygon
  const dataPts = dims.map(({ score, max }, i) => {
    const r = maxR * (score / max);
    return `${cx + r * Math.cos(ang(i))},${cy + r * Math.sin(ang(i))}`;
  }).join(" ");

  // Labels with proper tspan — pushed outward to avoid clipping
  const axisLabels = dims.map(({ label }, i) => {
    const a = ang(i);
    const lr = maxR + 46;
    const lx = cx + lr * Math.cos(a);
    const ly = cy + lr * Math.sin(a);
    const anchor = Math.abs(Math.cos(a)) < 0.15 ? "middle" : Math.cos(a) < 0 ? "end" : "start";
    const totalH = (label.length - 1) * 14;
    const baseY = ly - totalH / 2;
    const tspans = label.map((l, li) => `<tspan x="${lx}" dy="${li === 0 ? 0 : 14}">${l}</tspan>`).join("");
    return `<text y="${baseY + 4}" text-anchor="${anchor}" font-size="11.5" font-weight="700" fill="${C.text}" font-family="Inter,sans-serif">${tspans}</text>`;
  }).join("");

  // Dots on data polygon
  const dots = dims.map(({ score, max }, i) => {
    const pct = score / max;
    if (pct === 0 || pct === 1) return "";
    const r = maxR * pct;
    return `<circle cx="${cx + r * Math.cos(ang(i))}" cy="${cy + r * Math.sin(ang(i))}" r="4.5" fill="${C.blue}" stroke="${C.white}" stroke-width="1.5"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.white}" rx="10"/>
  <text x="${W / 2}" y="32" text-anchor="middle" font-size="15" font-weight="800" fill="${C.navy}" font-family="Inter,sans-serif">IaCM Maturity — RUN Tier</text>
  ${gridLines}${pctLabels}${spokes}
  <polygon points="${dataPts}" fill="${C.blue}" fill-opacity="0.12" stroke="${C.blue}" stroke-width="2.5" stroke-linejoin="round"/>
  ${dots}${axisLabels}
  <circle cx="${cx}" cy="${cy}" r="52" fill="${C.navy}"/>
  <text x="${cx}" y="${cy - 10}" text-anchor="middle" font-size="30" font-weight="900" fill="${C.white}" font-family="Inter,sans-serif">74</text>
  <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-size="10" fill="rgba(255,255,255,0.55)" font-family="Inter,sans-serif">out of 100</text>
  <text x="${cx}" y="${cy + 27}" text-anchor="middle" font-size="12" font-weight="800" fill="${C.green}" font-family="Inter,sans-serif">RUN</text>
</svg>`;
}

// ── 3. Org footprint — dual horizontal bars ───────────────────────────────
function orgFootprint() {
  const W = 720;
  const pad = { t: 52, r: 130, b: 40, l: 210 };
  const orgs = [
    { name: "TruVision Risk Mgmt",   ws: 425, pl: 431 },
    { name: "OneDev",                ws: 380, pl: 577 },
    { name: "Information Security",  ws: 299, pl: 400 },
    { name: "OneTru",                ws: 264, pl: 848 },
    { name: "Global Assoc. Tech.",   ws: 173, pl: 984 },
    { name: "TruAudiance & Mktg",   ws: 134, pl: 109 },
    { name: "TruValidate Fraud",     ws: 127, pl: 478 },
    { name: "TU CIBIL",              ws: 118, pl:  81 },
    { name: "TruContact Comms",      ws: 107, pl:  75 },
    { name: "TruIQ Analytics",       ws: 102, pl:  65 },
  ];
  const maxVal = 1050;
  const chartW = W - pad.l - pad.r;
  const barH = 16, barGap = 4, rowGap = 20;
  const rowH = barH * 2 + barGap + rowGap;
  const H = orgs.length * rowH + pad.t + pad.b;

  const rows = orgs.map(({ name, ws, pl }, i) => {
    const y = pad.t + i * rowH;
    const wsW = (ws / maxVal) * chartW;
    const plW = (pl / maxVal) * chartW;
    return `
      <text x="${pad.l - 10}" y="${y + barH - 2}" text-anchor="end" font-size="12" fill="${C.text}" font-family="Inter,sans-serif" font-weight="500">${name}</text>
      <rect x="${pad.l}" y="${y}" width="${chartW}" height="${barH}" rx="3" fill="${C.light}"/>
      <rect x="${pad.l}" y="${y}" width="${wsW}" height="${barH}" rx="3" fill="${C.blue}" opacity="0.9"/>
      <text x="${pad.l + wsW + 6}" y="${y + barH - 2}" font-size="11" font-weight="700" fill="${C.blue}" font-family="Inter,sans-serif">${ws}</text>
      <rect x="${pad.l}" y="${y + barH + barGap}" width="${chartW}" height="${barH}" rx="3" fill="${C.light}"/>
      <rect x="${pad.l}" y="${y + barH + barGap}" width="${plW}" height="${barH}" rx="3" fill="${C.teal}" opacity="0.8"/>
      <text x="${pad.l + plW + 6}" y="${y + barH * 2 + barGap - 2}" font-size="11" font-weight="700" fill="${C.teal}" font-family="Inter,sans-serif">${pl}</text>
    `;
  }).join("");

  const legY = H - 24;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.white}" rx="10"/>
  <text x="${W / 2}" y="32" text-anchor="middle" font-size="15" font-weight="800" fill="${C.navy}" font-family="Inter,sans-serif">Top 10 Organisations — IaCM Footprint</text>
  ${rows}
  <rect x="${pad.l}" y="${legY}" width="13" height="13" rx="2" fill="${C.blue}" opacity="0.9"/>
  <text x="${pad.l + 19}" y="${legY + 10}" font-size="11" fill="${C.muted}" font-family="Inter,sans-serif">Workspaces</text>
  <rect x="${pad.l + 120}" y="${legY}" width="13" height="13" rx="2" fill="${C.teal}" opacity="0.8"/>
  <text x="${pad.l + 139}" y="${legY + 10}" font-size="11" fill="${C.muted}" font-family="Inter,sans-serif">Pipelines</text>
</svg>`;
}

// ── 4. Feature gauges — circular progress rings ───────────────────────────
function featureGauges() {
  const W = 740, H = 230;
  const features = [
    { label: ["Workspace", "Adoption"],  pct: 100, col: C.green  },
    { label: ["Pipeline", "Adoption"],   pct: 100, col: C.green  },
    { label: ["OPA", "Coverage"],        pct: 100, col: C.green  },
    { label: ["Security", "Scanning"],   pct:  53, col: C.blue   },
    { label: ["Cost", "Estimation"],     pct:   7, col: C.red    },
    { label: ["IaCM", "Templates"],      pct:   0, col: C.gray   },
  ];
  const gW = W / features.length;
  const r = 56, strokeW = 11;
  const circ = 2 * Math.PI * r;
  const cy = 118;

  const gauges = features.map(({ label, pct, col }, i) => {
    const cx = gW * i + gW / 2;
    const dash = (pct / 100) * circ;
    return `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.light}" stroke-width="${strokeW}"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="${strokeW}"
        stroke-dasharray="${dash} ${circ - dash}" stroke-linecap="round"
        transform="rotate(-90 ${cx} ${cy})" opacity="0.9"/>
      <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="22" font-weight="900" fill="${C.navy}" font-family="Inter,sans-serif">${pct}%</text>
      ${label.map((l, li) =>
        `<text x="${cx}" y="${cy + 14 + li * 14}" text-anchor="middle" font-size="11" font-weight="600" fill="${C.muted}" font-family="Inter,sans-serif">${l}</text>`
      ).join("")}
    `;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.white}" rx="10"/>
  <text x="${W / 2}" y="26" text-anchor="middle" font-size="15" font-weight="800" fill="${C.navy}" font-family="Inter,sans-serif">Feature Adoption Scorecard</text>
  ${gauges}
</svg>`;
}

// ── 5. OPA donut ──────────────────────────────────────────────────────────
function opaDonut() {
  const W = 620, H = 310, cx = 165, cy = 160, R = 108, ri = 64;
  const slices = [
    { count: 11, col: C.green },
    { count: 9,  col: C.amber },
  ];
  const total = 20;
  let angle = -Math.PI / 2;
  const paths = slices.map(({ count, col }) => {
    const sweep = (count / total) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(angle), y1 = cy + R * Math.sin(angle);
    const x2 = cx + R * Math.cos(angle + sweep), y2 = cy + R * Math.sin(angle + sweep);
    const xi1 = cx + ri * Math.cos(angle), yi1 = cy + ri * Math.sin(angle);
    const xi2 = cx + ri * Math.cos(angle + sweep), yi2 = cy + ri * Math.sin(angle + sweep);
    const lg = sweep > Math.PI ? 1 : 0;
    const path = `<path d="M ${x1} ${y1} A ${R} ${R} 0 ${lg} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${ri} ${ri} 0 ${lg} 0 ${xi1} ${yi1} Z" fill="${col}" opacity="0.88" stroke="${C.white}" stroke-width="3"/>`;
    angle += sweep;
    return path;
  }).join("");

  const activeSets = ["IACM_Policies", "SDP_CD_Policies", "SDP_CI_Templates", "SonarQube Gate", "TU_OneDev Governance", "SEAL ARM ImageScan", "SEAL CI Vulnerability", "SEAL CI ImagePublish", "SEAL Core PolicySet", "SEAL SBOM PolicySet", "SEAL VER Compliance"];
  const disabledSets = ["Finops", "API Token Expiry", "SBOM_Policies", "tf_plan_test", "Java Version Check", "+ 4 more"];

  const lx = 305, ly = 46;
  const legend = `
    <text x="${lx}" y="${ly}" font-size="10" font-weight="800" letter-spacing="0.08em" fill="${C.green}" font-family="Inter,sans-serif">ACTIVE (11)</text>
    ${activeSets.slice(0, 6).map((s, i) =>
      `<text x="${lx + 10}" y="${ly + 16 + i * 15}" font-size="10" fill="${C.text}" font-family="Inter,sans-serif">• ${s}</text>`
    ).join("")}
    <text x="${lx + 10}" y="${ly + 16 + 6 * 15}" font-size="10" fill="${C.muted}" font-family="Inter,sans-serif">+ 5 more active sets</text>
    <text x="${lx}" y="${ly + 16 + 7 * 15 + 10}" font-size="10" font-weight="800" letter-spacing="0.08em" fill="${C.amber}" font-family="Inter,sans-serif">DISABLED (9)</text>
    ${disabledSets.map((s, i) =>
      `<text x="${lx + 10}" y="${ly + 16 + 7 * 15 + 26 + i * 15}" font-size="10" fill="${C.muted}" font-family="Inter,sans-serif">• ${s}</text>`
    ).join("")}
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.white}" rx="10"/>
  <text x="${W / 2}" y="28" text-anchor="middle" font-size="15" font-weight="800" fill="${C.navy}" font-family="Inter,sans-serif">OPA Governance — 20 Policy Sets</text>
  ${paths}
  <text x="${cx}" y="${cy - 14}" text-anchor="middle" font-size="32" font-weight="900" fill="${C.navy}" font-family="Inter,sans-serif">20</text>
  <text x="${cx}" y="${cy + 8}" text-anchor="middle" font-size="11" fill="${C.muted}" font-family="Inter,sans-serif">policy sets</text>
  <text x="${cx}" y="${cy + 28}" text-anchor="middle" font-size="12" font-weight="700" fill="${C.green}" font-family="Inter,sans-serif">100% pipeline</text>
  <text x="${cx}" y="${cy + 44}" text-anchor="middle" font-size="12" font-weight="700" fill="${C.green}" font-family="Inter,sans-serif">coverage</text>
  ${legend}
</svg>`;
}

// ── 6. Priority matrix ────────────────────────────────────────────────────
function priorityMatrix() {
  const W = 640, H = 390;
  const pad = { t: 54, r: 30, b: 64, l: 72 };
  const cW = W - pad.l - pad.r;
  const cH = H - pad.t - pad.b;

  const actions = [
    { label: ["Enable", "Finops Policy"],        effort: 12, impact: 95, col: C.red    },
    { label: ["Enable API Token", "Expiry"],      effort:  9, impact: 72, col: C.red    },
    { label: ["Enable SBOM &", "tf_plan"],        effort: 11, impact: 65, col: C.red    },
    { label: ["Activate", "Colombia/HK"],         effort: 18, impact: 42, col: C.amber  },
    { label: ["Workspace", "OPA Policies"],       effort: 52, impact: 76, col: C.amber  },
    { label: ["Checkov", "Audit"],                effort: 60, impact: 82, col: C.amber  },
    { label: ["IaCM", "Templates"],               effort: 66, impact: 60, col: C.blue   },
    { label: ["Private", "Registry"],             effort: 84, impact: 38, col: C.blue   },
  ];

  // Background quadrants
  const qBg = `
    <rect x="${pad.l}" y="${pad.t}" width="${cW / 2}" height="${cH / 2}" fill="${C.green}" opacity="0.04" rx="2"/>
    <rect x="${pad.l + cW / 2}" y="${pad.t}" width="${cW / 2}" height="${cH / 2}" fill="${C.blue}" opacity="0.03" rx="2"/>
    <rect x="${pad.l}" y="${pad.t + cH / 2}" width="${cW / 2}" height="${cH / 2}" fill="${C.gray}" opacity="0.04" rx="2"/>
    <rect x="${pad.l + cW / 2}" y="${pad.t + cH / 2}" width="${cW / 2}" height="${cH / 2}" fill="${C.gray}" opacity="0.02" rx="2"/>
  `;

  // Grid dashes
  const grid = [25, 50, 75].map((v) => {
    const px = pad.l + (v / 100) * cW;
    const py = pad.t + (1 - v / 100) * cH;
    return `<line x1="${px}" y1="${pad.t}" x2="${px}" y2="${pad.t + cH}" stroke="${C.light}" stroke-dasharray="4,4"/>
            <line x1="${pad.l}" y1="${py}" x2="${pad.l + cW}" y2="${py}" stroke="${C.light}" stroke-dasharray="4,4"/>`;
  }).join("");

  // Quadrant labels
  const qLabels = `
    <text x="${pad.l + cW * 0.25}" y="${pad.t + 14}" text-anchor="middle" font-size="9" fill="${C.green}" font-family="Inter,sans-serif" font-weight="700">HIGH IMPACT · LOW EFFORT ★</text>
    <text x="${pad.l + cW * 0.75}" y="${pad.t + 14}" text-anchor="middle" font-size="9" fill="${C.blue}" font-family="Inter,sans-serif">HIGH IMPACT · HIGH EFFORT</text>
    <text x="${pad.l + cW * 0.25}" y="${H - pad.b + 16}" text-anchor="middle" font-size="9" fill="${C.muted}" font-family="Inter,sans-serif">LOW IMPACT · LOW EFFORT</text>
    <text x="${pad.l + cW * 0.75}" y="${H - pad.b + 16}" text-anchor="middle" font-size="9" fill="${C.muted}" font-family="Inter,sans-serif">LOW IMPACT · HIGH EFFORT</text>
  `;

  const dots = actions.map(({ label, effort, impact, col }) => {
    const x = pad.l + (effort / 100) * cW;
    const y = pad.t + (1 - impact / 100) * cH;
    const tspans = label.map((l, li) => `<tspan x="${x}" dy="${li === 0 ? 0 : 12}">${l}</tspan>`).join("");
    const totalH = (label.length - 1) * 12;
    return `
      <circle cx="${x}" cy="${y}" r="18" fill="${col}" opacity="0.15"/>
      <circle cx="${x}" cy="${y}" r="7" fill="${col}" opacity="0.9"/>
      <text y="${y + 26 - totalH / 2}" text-anchor="middle" font-size="10" font-weight="600" fill="${C.text}" font-family="Inter,sans-serif">${tspans}</text>
    `;
  }).join("");

  // Legend
  const legY = H - 18;
  const legend = [
    { label: "P1 — Enable now (config only)", col: C.red   },
    { label: "P2 — This quarter",             col: C.amber },
    { label: "P3 — Next quarter",             col: C.blue  },
  ].map(({ label, col }, i) =>
    `<circle cx="${pad.l + i * 200 + 6}" cy="${legY - 2}" r="5" fill="${col}" opacity="0.9"/>
     <text x="${pad.l + i * 200 + 16}" y="${legY + 2}" font-size="10" fill="${C.muted}" font-family="Inter,sans-serif">${label}</text>`
  ).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.white}" rx="10"/>
  <text x="${W / 2}" y="30" text-anchor="middle" font-size="15" font-weight="800" fill="${C.navy}" font-family="Inter,sans-serif">Priority Action Matrix</text>
  <rect x="${pad.l}" y="${pad.t}" width="${cW}" height="${cH}" fill="${C.bg}" rx="4"/>
  ${qBg}${grid}${qLabels}${dots}
  <line x1="${pad.l}" y1="${pad.t + cH}" x2="${pad.l + cW}" y2="${pad.t + cH}" stroke="${C.muted}" stroke-width="1.5"/>
  <line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${pad.t + cH}" stroke="${C.muted}" stroke-width="1.5"/>
  <text x="${pad.l + cW / 2}" y="${H - pad.b + 34}" text-anchor="middle" font-size="11" fill="${C.muted}" font-family="Inter,sans-serif" font-weight="600">→  EFFORT  (Low to High)</text>
  <text x="18" y="${pad.t + cH / 2}" text-anchor="middle" font-size="11" fill="${C.muted}" font-family="Inter,sans-serif" font-weight="600" transform="rotate(-90 18 ${pad.t + cH / 2})">↑  IMPACT</text>
  ${legend}
</svg>`;
}

// ── Write ─────────────────────────────────────────────────────────────────
const charts = {
  "scorecard.svg":        scorecard(),
  "maturity-radar.svg":   radar(),
  "org-footprint.svg":    orgFootprint(),
  "feature-gauges.svg":   featureGauges(),
  "opa-donut.svg":        opaDonut(),
  "priority-matrix.svg":  priorityMatrix(),
};

for (const [file, svg] of Object.entries(charts)) {
  writeFileSync(`${OUT}/${file}`, svg, "utf-8");
  console.log("✓", file);
}
console.log("\nAll charts saved to:", OUT);
