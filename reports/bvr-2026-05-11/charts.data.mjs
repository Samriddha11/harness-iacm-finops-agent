/**
 * Per-customer chart data for the IaCM Business Value Review.
 *
 * This file is the SINGLE SOURCE OF TRUTH for every number that ends up
 * in this customer's charts. The chart STYLES live in src/charts/ — they
 * never change between customers. Only the data here changes.
 *
 * To produce a BVR for a new customer:
 *   1. Copy this folder:   cp -r reports/bvr-2026-05-11 reports/<new-folder>
 *   2. Edit this file to reflect their environment.
 *   3. Edit iacm-bvr.md to reflect their narrative + frontmatter.
 *   4. Regenerate the SVGs:
 *        node scripts/regen-bvr-charts.mjs reports/<new-folder>
 *   5. Render the report (via the MCP `harness_iacm_render` tool, or
 *      visit `http://localhost:<port>/report/<id>` after registering it
 *      with the renderer).
 *
 * Every chart kind below corresponds to one of the seven generators in
 * src/charts/generators.ts. The data shape is validated by Zod at render
 * time (src/charts/index.ts) — invalid data fails fast with a clear error.
 *
 * Customer:  TransUnion
 * Snapshot:  May 11, 2026
 */

export const customer = {
  name: "TransUnion",
  date: "May 11, 2026",
};

// 1. SCORECARD — row of headline metric tiles (top of report)
export const scorecard = {
  tiles: [
    { value: "2,461",  label: "Workspaces",         sub: "across 34 orgs" },
    { value: "4,911",  label: "Pipelines",          sub: "across 373 projects" },
    { value: "100%",   label: "OPA Coverage",       sub: "all pipelines governed" },
    { value: "11 / 20",label: "Active Policy Sets", sub: "9 disabled — quick wins" },
    { value: "74/100", label: "Maturity Score",     sub: "RUN tier" },
  ],
};

// 2. MATURITY RADAR — 9-axis spider with central score disc
export const maturity_radar = {
  centerValue: 74,
  centerSub:   "out of 100",
  centerTier:  "RUN",
  title:       "IaCM Maturity Assessment — 74/100 (RUN)",
  dimensions: [
    { label: ["Workspace", "Adoption"],     score: 20, max: 20 },
    { label: ["Pipeline",  "Adoption"],     score: 15, max: 15 },
    { label: ["Pipeline",  "Diversity"],    score: 10, max: 10 },
    { label: ["OPA",       "Coverage"],     score: 10, max: 10 },
    { label: ["OPA Policy","Sets"],         score:  5, max:  5 },
    { label: ["Multi-Org", "Adoption"],     score:  5, max:  5 },
    { label: ["Security",  "Scanning"],     score:  8, max: 15 },
    { label: ["Cost",      "Estimation"],   score:  1, max: 15 },
    { label: ["IaCM",      "Templates"],    score:  0, max:  5 },
  ],
};

// 3. FEATURE GAUGES — circular % rings for adoption signals
export const feature_gauges = {
  title: "Feature Adoption Scorecard",
  gauges: [
    { label: ["Workspace", "Adoption"],  pct: 100 },
    { label: ["Pipeline",  "Adoption"],  pct: 100 },
    { label: ["OPA",       "Coverage"],  pct: 100 },
    { label: ["Security",  "Scanning"],  pct:  53 },
    { label: ["Cost",      "Estimation"], pct:  7 },
    { label: ["IaCM",      "Templates"], pct:   0 },
  ],
};

// 4. OPA DONUT — active vs disabled policy sets + side legend
export const opa_donut = {
  total:        20,
  active:       11,
  disabled:      9,
  centerValue:  "20",
  centerLabel:  "policy sets",
  centerSub:    "100% pipeline coverage",
  title:        "OPA Governance — 20 Policy Sets · 100% Pipeline Coverage",
  activeItems: [
    "IACM_Policies",
    "SDP_CD_Policies",
    "SDP_CI_Templates",
    "SonarQube Gate",
    "TU_OneDev Governance",
    "SEAL ARM ImageScan",
  ],
  disabledItems: [
    "Finops",
    "API Token Expiry",
    "SBOM_Policies",
    "tf_plan_test",
    "Java Version Check",
  ],
};

// 5. ORG FOOTPRINT — diverging bars (workspaces left, pipelines right)
export const org_footprint = {
  title: "Top 10 Organisations · Infrastructure DNA",
  orgs: [
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
  ],
};

// 6. PRIORITY MATRIX — 3 lanes (P1/P2/P3) with action cards + effort chips
export const priority_matrix = {
  title: "Recommended Actions — Effort vs Impact",
  lanes: [
    {
      badge: "P1",
      label: "Do Now",
      sub:   "Config-only — single change window",
      color: "p1",
      actions: [
        { text: "Enable Finops policy + cost estimation", effort: "Low" },
        { text: "Activate API Token Expiry policy",       effort: "Low" },
        { text: "Activate SBOM_Policies set",             effort: "Low" },
        { text: "Activate tf_plan_test set",              effort: "Low" },
      ],
    },
    {
      badge: "P2",
      label: "This Quarter",
      sub:   "Targeted scans + policy authoring",
      color: "p2",
      actions: [
        { text: "Audit Checkov per-pipeline (4,911)",  effort: "Medium" },
        { text: "Add workspace-scoped OPA policies",   effort: "Medium" },
        { text: "Activate IaCM in Colombia + Hong Kong", effort: "Low" },
      ],
    },
    {
      badge: "P3",
      label: "Next Quarter",
      sub:   "Templates + maturity polish",
      color: "p3",
      actions: [
        { text: "Roll out IaCM templates to all orgs", effort: "Medium" },
        { text: "Quarterly maturity reassessment",     effort: "Low" },
      ],
    },
  ],
};

// ── 7. MONTHLY GROWTH ─────────────────────────────────────────────────────
// 12-month cumulative trajectory of workspaces and pipelines. In a real
// run this comes from `harness_iacm_growth` — the values below are the
// snapshot used for the TransUnion BVR.
export const monthly_growth = {
  title:    "IaCM Growth — Last 12 Months",
  subtitle: "Cumulative workspaces and pipelines",
  growth: {
    workspaces: "+40.4% / 12 mo",
    pipelines:  "+38.9% / 12 mo",
  },
  points: [
    { label: "Jun '25", workspaces: 178, pipelines: 720  },
    { label: "Jul '25", workspaces: 185, pipelines: 745  },
    { label: "Aug '25", workspaces: 192, pipelines: 770  },
    { label: "Sep '25", workspaces: 198, pipelines: 800  },
    { label: "Oct '25", workspaces: 207, pipelines: 825  },
    { label: "Nov '25", workspaces: 215, pipelines: 850  },
    { label: "Dec '25", workspaces: 220, pipelines: 870  },
    { label: "Jan '26", workspaces: 228, pipelines: 900  },
    { label: "Feb '26", workspaces: 235, pipelines: 925  },
    { label: "Mar '26", workspaces: 240, pipelines: 950  },
    { label: "Apr '26", workspaces: 245, pipelines: 980  },
    { label: "May '26", workspaces: 250, pipelines: 1000 },
  ],
};
