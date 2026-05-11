import { writeFileSync } from "node:fs";

const OUT = "/Users/samriddha/Harness-MCP-Servers/mcp-server-iacm/reports/tu-bvr-final/assets";

const C = {
  blue: "#0278D5", navy: "#0d1f35", sky: "#38bdf8",
  green: "#059669", red: "#dc2626", amber: "#d97706",
  gray: "#94a3b8", light: "#e2e8f0", white: "#ffffff",
  bg: "#f8fafc", text: "#1e293b", muted: "#64748b",
  violet: "#7c3aed", teal: "#0891b2", indigo: "#4f46e5",
  green2: "#10b981",
};

// ── 1. Executive Scorecard ────────────────────────────────────────────────
function scorecard() {
  const W = 700, H = 170;
  const tiles = [
    { value: "2,461",  label: "Workspaces",        sub: "across 34 orgs",           col: C.blue   },
    { value: "4,911",  label: "Pipelines",           sub: "across 373 projects",      col: C.indigo },
    { value: "100%",   label: "OPA Coverage",        sub: "all pipelines governed",   col: C.green  },
    { value: "11 / 20",label: "Active Policy Sets",  sub: "9 disabled — quick wins",  col: C.teal   },
    { value: "63/100", label: "Maturity Score",      sub: "WALK → 7 pts from RUN",    col: C.violet },
  ];
  const tW = (W - 32) / tiles.length;
  const tH = 148, tY = 22;
  const rects = tiles.map(({ value, label, sub, col }, i) => {
    const x = 16 + i * tW;
    return `
      <rect x="${x + 4}" y="${tY}" width="${tW - 8}" height="${tH}" rx="10" fill="${C.bg}" stroke="${C.light}" stroke-width="1"/>
      <rect x="${x + 4}" y="${tY}" width="${tW - 8}" height="4" rx="2" fill="${col}"/>
      <text x="${x + tW / 2}" y="${tY + 54}" text-anchor="middle" font-size="20.2" font-weight="900" fill="${C.navy}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">${value}</text>
      <text x="${x + tW / 2}" y="${tY + 76}" text-anchor="middle" font-size="10.1" font-weight="700" fill="${col}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">${label}</text>
      <text x="${x + tW / 2}" y="${tY + 94}" text-anchor="middle" font-size="8.4" fill="${C.muted}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">${sub}</text>
    `;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" class="svg-bg" fill="${C.white}" rx="10"/>
  ${rects}
</svg>`;
}

// ── 2. Org footprint ──────────────────────────────────────────────────────
function orgFootprint() {
  const W = 680;
  const pad = { t: 52, r: 140, b: 44, l: 218 };
  const orgs = [
    { name: "TruVision Risk Mgmt",  ws: 425, pl: 431 },
    { name: "OneDev",               ws: 380, pl: 577 },
    { name: "Information Security", ws: 299, pl: 400 },
    { name: "OneTru",               ws: 264, pl: 848 },
    { name: "Global Assoc. Tech.",  ws: 173, pl: 984 },
    { name: "TruAudiance & Mktg",  ws: 134, pl: 109 },
    { name: "TruValidate Fraud",    ws: 127, pl: 478 },
    { name: "TU CIBIL",             ws: 118, pl:  81 },
    { name: "TruContact Comms",     ws: 107, pl:  75 },
    { name: "TruIQ Analytics",      ws: 102, pl:  65 },
  ];
  const maxVal = 1050;
  const chartW = W - pad.l - pad.r;
  const barH = 14, barGap = 4, rowGap = 22;
  const rowH = barH * 2 + barGap + rowGap;
  const H = orgs.length * rowH + pad.t + pad.b;

  const rows = orgs.map(({ name, ws, pl }, i) => {
    const y = pad.t + i * rowH;
    const wsW = Math.max((ws / maxVal) * chartW, 3);
    const plW = Math.max((pl / maxVal) * chartW, 3);
    return `
      <text x="${pad.l - 12}" y="${y + barH - 1}" text-anchor="end" font-size="10.5" fill="${C.text}" font-family="Plus Jakarta Sans,DM Sans,sans-serif" font-weight="500">${name}</text>
      <rect x="${pad.l}" y="${y}" width="${chartW}" height="${barH}" rx="3" fill="${C.light}"/>
      <rect x="${pad.l}" y="${y}" width="${wsW}" height="${barH}" rx="3" fill="${C.blue}"/>
      <text x="${pad.l + wsW + 6}" y="${y + barH - 1}" font-size="9.2" font-weight="700" fill="${C.blue}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">${ws}</text>
      <rect x="${pad.l}" y="${y + barH + barGap}" width="${chartW}" height="${barH}" rx="3" fill="${C.light}"/>
      <rect x="${pad.l}" y="${y + barH + barGap}" width="${plW}" height="${barH}" rx="3" fill="${C.teal}" opacity="0.85"/>
      <text x="${pad.l + plW + 6}" y="${y + barH * 2 + barGap - 1}" font-size="9.2" font-weight="700" fill="${C.teal}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">${pl}</text>
    `;
  }).join("");

  const legY = H - 26;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" class="svg-bg" fill="${C.white}" rx="10"/>
  <text x="${W / 2}" y="32" text-anchor="middle" font-size="12.6" font-weight="800" fill="${C.navy}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">Top 10 Organisations — IaCM Footprint</text>
  ${rows}
  <rect x="${pad.l}" y="${legY}" width="13" height="13" rx="2" fill="${C.blue}"/>
  <text x="${pad.l + 19}" y="${legY + 10}" font-size="9.2" fill="${C.muted}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">Workspaces</text>
  <rect x="${pad.l + 122}" y="${legY}" width="13" height="13" rx="2" fill="${C.teal}" opacity="0.85"/>
  <text x="${pad.l + 141}" y="${legY + 10}" font-size="9.2" fill="${C.muted}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">Pipelines</text>
</svg>`;
}

// ── 3. Maturity radar — bounds-safe layout ────────────────────────────────
function radar() {
  // Canvas sized so labels never clip:
  //   left labels at x = cx - lr*cos_max → need x > 60 for ~50px text
  //   top label at y = cy - lr → need y > 60 for title clearance
  const W = 600, H = 530;
  const cx = 300, cy = 285;   // centre, shifted down to clear title
  const maxR = 155;            // polygon radius
  const lr = maxR + 46;       // label radius = 201  (left: 300-201*0.98=103 ✓, right: 300+197=497<600 ✓)

  // 8-dimension model — cleaner octagon, more meaningful for IaCM BVR
  // Removed: Pipeline Diversity (too generic), OPA Policy Sets count (subset of Governance)
  // Added: Private Module Registry, Provisioner Strategy (TF/OTF version consolidation)
  const dims = [
    { label: ["Workspace", "Scale"],      score: 20, max: 20 },  // 2,461 workspaces
    { label: ["Pipeline", "Automation"],  score: 15, max: 15 },  // 4,911 pipelines
    { label: ["Policy", "Governance"],    score: 12, max: 15 },  // 100% OPA but 4 sets disabled
    { label: ["Security &", "Compliance"],score:  8, max: 15 },  // SEAL active, Checkov partial
    { label: ["Cost", "Estimation"],      score:  1, max: 15 },  // FinOps disabled
    { label: ["IaCM", "Templates"],       score:  0, max: 10 },  // none in use
    { label: ["Private", "Registry"],     score:  0, max: 5  },  // all public modules
    { label: ["Provisioner", "Strategy"], score:  7, max: 10 },  // TF + OpenTofu, forward-looking
  ];
  // Score: 20+15+12+8+1+0+0+7 = 63 / 100  →  WALK (7 pts from RUN)
  const n = dims.length;
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;

  const gridLines = [0.25, 0.5, 0.75, 1].map((pct) => {
    const r = maxR * pct;
    const pts = dims.map((_, i) =>
      `${(cx + r * Math.cos(ang(i))).toFixed(1)},${(cy + r * Math.sin(ang(i))).toFixed(1)}`
    ).join(" ");
    return `<polygon points="${pts}" fill="none" stroke="${C.light}" stroke-width="${pct === 1 ? 1.5 : 0.8}"/>`;
  }).join("");

  const pctLabels = [[50, "50%"], [100, "100%"]].map(([pct, lbl]) => {
    const r = maxR * (pct / 100);
    return `<text x="${cx + 5}" y="${cy - r + 11}" font-size="8" fill="${C.muted}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">${lbl}</text>`;
  }).join("");

  const spokes = dims.map((_, i) =>
    `<line x1="${cx}" y1="${cy}" x2="${(cx + maxR * Math.cos(ang(i))).toFixed(1)}" y2="${(cy + maxR * Math.sin(ang(i))).toFixed(1)}" stroke="${C.light}" stroke-width="0.8"/>`
  ).join("");

  const dataPts = dims.map(({ score, max }, i) => {
    const r = maxR * (score / max);
    return `${(cx + r * Math.cos(ang(i))).toFixed(1)},${(cy + r * Math.sin(ang(i))).toFixed(1)}`;
  }).join(" ");

  const DY = 13; // line height for 2-line labels
  const axisLabels = dims.map(({ label }, i) => {
    const a = ang(i);
    const lx = cx + lr * Math.cos(a);
    const ly = cy + lr * Math.sin(a);
    // Text anchor: middle for near-vertical axes, end/start for horizontal
    const anchor = Math.abs(Math.cos(a)) < 0.15 ? "middle" : Math.cos(a) < 0 ? "end" : "start";
    const totalH = (label.length - 1) * DY;
    const baseY = ly - totalH / 2;
    const tspans = label.map((l, li) =>
      `<tspan x="${lx.toFixed(1)}" dy="${li === 0 ? 0 : DY}">${l}</tspan>`
    ).join("");
    return `<text y="${(baseY + 4).toFixed(1)}" text-anchor="${anchor}" font-size="10.5" font-weight="700" fill="${C.text}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">${tspans}</text>`;
  }).join("");

  const dots = dims.map(({ score, max }, i) => {
    const pct = score / max;
    if (pct === 0 || pct === 1) return "";
    const r = maxR * pct;
    return `<circle cx="${cx + r * Math.cos(ang(i))}" cy="${cy + r * Math.sin(ang(i))}" r="5" fill="${C.blue}" stroke="${C.white}" stroke-width="2"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" class="svg-bg" fill="${C.white}" rx="10"/>
  <text x="${W / 2}" y="32" text-anchor="middle" font-size="12.6" font-weight="800" fill="${C.navy}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">IaCM Maturity Assessment — 63/100 (WALK → RUN)</text>
  ${gridLines}${pctLabels}${spokes}
  <polygon points="${dataPts}" fill="${C.blue}" fill-opacity="0.12" stroke="${C.blue}" stroke-width="2.5" stroke-linejoin="round"/>
  ${dots}${axisLabels}
  <circle cx="${cx}" cy="${cy}" r="54" fill="${C.navy}"/>
  <text x="${cx}" y="${cy - 10}" text-anchor="middle" font-size="26.9" font-weight="900" fill="${C.white}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">63</text>
  <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-size="8.8" fill="rgba(255,255,255,0.5)" font-family="Plus Jakarta Sans,DM Sans,sans-serif">out of 100</text>
  <text x="${cx}" y="${cy + 27}" text-anchor="middle" font-size="9.5" font-weight="800" fill="${C.amber}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">WALK → RUN</text>
</svg>`;
}

// ── 4. Feature gauges ─────────────────────────────────────────────────────
function featureGauges() {
  const W = 680, H = 210;
  const features = [
    { label: ["Workspace", "Adoption"],  pct: 100, col: C.green  },
    { label: ["Pipeline",  "Adoption"],  pct: 100, col: C.green  },
    { label: ["OPA",       "Coverage"],  pct: 100, col: C.green  },
    { label: ["Security",  "Scanning"],  pct:  53, col: C.blue   },
    { label: ["Cost",      "Estimation"],pct:   7, col: C.red    },
    { label: ["IaCM",      "Templates"], pct:   0, col: C.gray   },
  ];
  const n = features.length;
  const gW = W / n;
  const r = 50, strokeW = 10, cy = 106;
  const circ = 2 * Math.PI * r;

  const gauges = features.map(({ label, pct, col }, i) => {
    const cx = gW * i + gW / 2;
    const dash = (pct / 100) * circ;
    return `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.light}" stroke-width="${strokeW}"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="${strokeW}"
        stroke-dasharray="${dash} ${circ - dash}" stroke-linecap="round"
        transform="rotate(-90 ${cx} ${cy})"/>
      <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="20.2" font-weight="900" fill="${C.navy}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">${pct}%</text>
      ${label.map((l, li) =>
        `<text x="${cx}" y="${cy + 16 + li * 15}" text-anchor="middle" font-size="9.7" font-weight="600" fill="${C.muted}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">${l}</text>`
      ).join("")}
    `;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" class="svg-bg" fill="${C.white}" rx="10"/>
  <text x="${W / 2}" y="26" text-anchor="middle" font-size="12.6" font-weight="800" fill="${C.navy}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">Feature Adoption Scorecard</text>
  ${gauges}
</svg>`;
}

// ── 5. OPA donut ──────────────────────────────────────────────────────────
function opaDonut() {
  const W = 580, H = 270, cx = 150, cy = 138, R = 92, ri = 55;
  const slices = [{ count: 11, col: C.green }, { count: 9, col: C.amber }];
  const total = 20;
  let angle = -Math.PI / 2;
  const paths = slices.map(({ count, col }) => {
    const sweep = (count / total) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(angle), y1 = cy + R * Math.sin(angle);
    const x2 = cx + R * Math.cos(angle + sweep), y2 = cy + R * Math.sin(angle + sweep);
    const xi1 = cx + ri * Math.cos(angle), yi1 = cy + ri * Math.sin(angle);
    const xi2 = cx + ri * Math.cos(angle + sweep), yi2 = cy + ri * Math.sin(angle + sweep);
    const lg = sweep > Math.PI ? 1 : 0;
    const p = `<path d="M ${x1} ${y1} A ${R} ${R} 0 ${lg} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${ri} ${ri} 0 ${lg} 0 ${xi1} ${yi1} Z" fill="${col}" opacity="0.88" stroke="${C.white}" stroke-width="3"/>`;
    angle += sweep;
    return p;
  }).join("");

  const activeSets  = ["IACM_Policies", "SDP_CD_Policies", "SDP_CI_Templates", "SonarQube Gate", "TU_OneDev Governance", "SEAL ARM ImageScan", "SEAL CI Vulnerability", "SEAL CI ImagePublish", "SEAL Core PolicySet", "SEAL SBOM PolicySet", "SEAL VER Compliance"];
  const disabledSets = ["Finops", "API Token Expiry", "SBOM_Policies", "tf_plan_test", "Java Version Check", "+ 4 more disabled"];

  const lx = 318, ly = 46;
  const legend = `
    <text x="${lx}" y="${ly}" font-size="8.4" font-weight="800" letter-spacing="0.07em" fill="${C.green}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">ACTIVE (11)</text>
    ${activeSets.slice(0, 6).map((s, i) =>
      `<text x="${lx + 10}" y="${ly + 16 + i * 15}" font-size="8.8" fill="${C.text}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">• ${s}</text>`
    ).join("")}
    <text x="${lx + 10}" y="${ly + 106}" font-size="8.4" fill="${C.muted}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">+ 5 more active sets</text>
    <text x="${lx}" y="${ly + 126}" font-size="8.4" font-weight="800" letter-spacing="0.07em" fill="${C.amber}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">DISABLED (9)</text>
    ${disabledSets.map((s, i) =>
      `<text x="${lx + 10}" y="${ly + 142 + i * 15}" font-size="8.8" fill="${C.muted}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">• ${s}</text>`
    ).join("")}
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" class="svg-bg" fill="${C.white}" rx="10"/>
  <text x="${W / 2}" y="28" text-anchor="middle" font-size="12.6" font-weight="800" fill="${C.navy}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">OPA Governance — 20 Policy Sets · 100% Pipeline Coverage</text>
  ${paths}
  <text x="${cx}" y="${cy - 14}" text-anchor="middle" font-size="28.6" font-weight="900" fill="${C.navy}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">20</text>
  <text x="${cx}" y="${cy + 8}"  text-anchor="middle" font-size="9.2" fill="${C.muted}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">policy sets</text>
  <text x="${cx}" y="${cy + 28}" text-anchor="middle" font-size="10.1" font-weight="700" fill="${C.green}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">100% pipeline</text>
  <text x="${cx}" y="${cy + 44}" text-anchor="middle" font-size="10.1" font-weight="700" fill="${C.green}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">coverage</text>
  ${legend}
</svg>`;
}

// ── Wrap text at a word boundary near maxChars ───────────────────────────
function wrapText(text, maxChars) {
  if (text.length <= maxChars) return [text];
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > maxChars && line) {
      lines.push(line.trim());
      line = word;
    } else {
      line = (line + " " + word).trim();
    }
  }
  if (line) lines.push(line.trim());
  return lines;
}

// ── 6. Priority action lanes — clean rows ────────────────────────────────
function priorityMatrix() {
  const lanes = [
    {
      badge: "P1",  label: "Do Now",         sub: "Config only — no engineering",
      col: C.red,   bg: "#fff5f5",
      actions: [
        { text: "Enable Finops policy set + cost estimation",  effort: "Low"    },
        { text: "Enable API Token Expiry enforcement",         effort: "Low"    },
        { text: "Enable SBOM_Policies + tf_plan_test",        effort: "Low"    },
      ],
    },
    {
      badge: "P2",  label: "This Quarter",    sub: "Some engineering required",
      col: C.amber, bg: "#fffbf0",
      actions: [
        { text: "Audit Checkov across all 4,911 pipelines",   effort: "Medium" },
        { text: "Add workspace-scoped OPA policy sets",        effort: "Medium" },
        { text: "Activate IaCM — Colombia & Hong Kong",        effort: "Low"    },
      ],
    },
    {
      badge: "P3",  label: "Next Quarter",    sub: "Longer-term investments",
      col: C.blue,  bg: "#eff6ff",
      actions: [
        { text: "Create canonical IaCM pipeline templates",    effort: "Medium" },
        { text: "Evaluate private module registry",            effort: "High"   },
      ],
    },
  ];

  // Layout constants
  const W = 700, colGap = 12, colW = Math.floor((W - colGap * 4) / 3);
  const headerH = 58;
  const ROW_SINGLE = 38, ROW_DOUBLE = 52, rowGap = 6;
  const WRAP_CHARS = 30; // wrap at this many chars

  // Pre-compute row heights
  const laneRowHeights = lanes.map(({ actions }) =>
    actions.map(({ text }) => wrapText(text, WRAP_CHARS).length > 1 ? ROW_DOUBLE : ROW_SINGLE)
  );
  const laneH = laneRowHeights.map((rhs) => rhs.reduce((s, h) => s + h + rowGap, 0));
  const maxLaneH = Math.max(...laneH);
  const H = headerH + maxLaneH + 40;

  const cols = lanes.map(({ badge, label, sub, col, bg, actions }, ci) => {
    const x = colGap + ci * (colW + colGap);
    const rowHeights = laneRowHeights[ci];

    let rowY = headerH + 8;
    const rows = actions.map(({ text, effort }, ri) => {
      const lines = wrapText(text, WRAP_CHARS);
      const rh = rowHeights[ri];
      const effortCol = effort === "Low" ? C.green : effort === "High" ? C.red : C.amber;
      const dotCY = rh === ROW_SINGLE ? rowY + rh / 2 : rowY + 18;
      const textY1 = rh === ROW_SINGLE ? rowY + rh / 2 + 4 : rowY + 18;
      const effortY = rh === ROW_SINGLE ? rowY + rh / 2 + 4 : rowY + 38;

      const textEls = lines.map((l, li) =>
        `<text x="${x + 32}" y="${textY1 + li * 15}" font-size="9.2" font-weight="600" fill="${C.text}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">${l}</text>`
      ).join("");

      const row = `
        <rect x="${x}" y="${rowY}" width="${colW}" height="${rh}" rx="7" fill="${bg}"/>
        <circle cx="${x + 17}" cy="${dotCY}" r="5" fill="${col}" opacity="0.85"/>
        ${textEls}
        <rect x="${x + 32}" y="${effortY + 3}" width="40" height="13" rx="6" fill="${effortCol}" opacity="0.13"/>
        <text x="${x + 52}" y="${effortY + 13}" text-anchor="middle" font-size="8" font-weight="800" fill="${effortCol}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">${effort}</text>
      `;
      rowY += rh + rowGap;
      return row;
    }).join("");

    return `
      <rect x="${x}" y="0" width="${colW}" height="4" rx="2" fill="${col}"/>
      <rect x="${x}" y="4" width="${colW}" height="${headerH - 4}" rx="0" fill="${bg}"/>
      <rect x="${x}" y="${headerH - 6}" width="${colW}" height="6" rx="0" fill="${bg}"/>
      <rect x="${x + 10}" y="14" width="34" height="20" rx="5" fill="${col}"/>
      <text x="${x + 27}" y="28" text-anchor="middle" font-size="9.2" font-weight="900" fill="${C.white}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">${badge}</text>
      <text x="${x + 54}" y="25" font-size="11.3" font-weight="800" fill="${C.navy}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">${label}</text>
      <text x="${x + 54}" y="41" font-size="8.8" fill="${C.muted}" font-family="Plus Jakarta Sans,DM Sans,sans-serif">${sub}</text>
      ${rows}
    `;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" class="svg-bg" fill="${C.white}" rx="10"/>
  ${cols}
  <text x="${W / 2}" y="${H - 10}" text-anchor="middle" font-size="8" fill="${C.muted}" font-family="Plus Jakarta Sans,DM Sans,sans-serif" letter-spacing="0.07em">EFFORT LEVEL — LOW · MEDIUM · HIGH</text>
</svg>`;
}

// ── Write all ─────────────────────────────────────────────────────────────
const charts = {
  "scorecard.svg":       scorecard(),
  "org-footprint.svg":   orgFootprint(),
  "maturity-radar.svg":  radar(),
  "feature-gauges.svg":  featureGauges(),
  "opa-donut.svg":       opaDonut(),
  "priority-matrix.svg": priorityMatrix(),
};

for (const [file, svg] of Object.entries(charts)) {
  writeFileSync(`${OUT}/${file}`, svg, "utf-8");
  console.log("✓", file);
}
console.log("\nDone →", OUT);
