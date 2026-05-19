import * as z from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * IaCM Business Value Review (BVR) prompt.
 *
 * This is the OPINIONATED end-to-end recipe for producing a polished BVR
 * that looks identical to the curated TU BVR — same chart style, same
 * frontmatter, same callout vocabulary, same final live-render URL.
 *
 * The agent must follow it step-by-step. Charts MUST come from
 * `harness_iacm_chart` (NOT from FinOps' `harness_ccm_finops_chart` or
 * any other generic chart tool — those produce a generic 3D-bars look
 * that does not match the report renderer's themes).
 */
export function registerIacmBvrPrompt(server: McpServer): void {
  server.registerPrompt(
    "iacm_bvr",
    {
      description:
        "Generate a complete, polished Harness IaCM Business Value Review — " +
        "scans the account, produces 5 theme-friendly SVG charts via " +
        "harness_iacm_chart, writes the markdown with frontmatter + heroStats " +
        "+ ::: callouts, and renders the final live URL. Output matches the " +
        "curated TU BVR design exactly.",
      argsSchema: {
        customer_name: z
          .string()
          .describe("Customer name displayed huge on the cover (e.g. 'TransUnion'). Required."),
        workspace_root: z
          .string()
          .describe(
            "ABSOLUTE path to the user's workspace root, where the BVR folder " +
            "will be created (e.g. '/Users/me/work/my-project'). The agent " +
            "MUST infer this from the open editor or explicitly ask the user. " +
            "Charts and markdown are written under <workspace_root>/reports/<bvr-id>/.",
          ),
        org_id: z
          .string()
          .describe("Limit scans to one Harness org (optional — omit to scan everything).")
          .optional(),
        theme: z
          .enum([
            "minimal", "harness-pro", "kinetic", "bluestone",
            "dark", "ocean", "black-lime", "carbon",
          ])
          .describe(
            "Default theme for the rendered report. " +
            "minimal=Harness brand (recommended for customer-facing), " +
            "harness-pro=Aurora, kinetic=Sandstone, bluestone=formal corporate, " +
            "dark=Midnight, ocean=Eclipse, black-lime=Obsidian, carbon=premium dark.",
          )
          .optional(),
      },
    },
    ({ customer_name, workspace_root, org_id, theme }) => {
      const themeChoice = theme ?? "minimal";
      const scopeNote = org_id
        ? `Limit all scans to org \`${org_id}\`.`
        : "Scan **all orgs** and projects (no scope restriction).";

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `
# Generate Harness IaCM Business Value Review for **${customer_name}**

${scopeNote}

The output MUST match the curated TU BVR design language. Follow these
steps in order, exactly. Do **not** invent placeholder data, do **not**
use \`harness_ccm_finops_chart\` (it produces a generic non-themed look),
and do **not** skip the final render step.

---

## Step 0 — Set up the BVR folder

Choose a stable BVR id from today's date plus a short customer slug, e.g.
\`<customer-slug>-bvr-<YYYY-MM-DD>\`. The full output folder is:

    <workspace_root>/reports/<bvr-id>/
    <workspace_root>/reports/<bvr-id>/assets/

Where \`<workspace_root>\` = \`${workspace_root}\`.

All chart \`output_path\` values below are absolute paths inside that folder.

---

## Step 1 — Gather data (in order)

Run these tools and keep their structured responses for use in Steps 2-5:

| # | Tool                       | Purpose |
|---|----------------------------|---------|
| 1 | \`harness_iacm_scan\`        | Total orgs / projects / workspaces / pipelines, plus per-org breakdown |
| 2 | \`harness_iacm_workspace_inventory\` | Provisioner/version sprawl, workspace status distribution, module registry (Harness private / other private / none) — use \`fetch_details: true\` for accurate version pins |
| 3 | \`harness_iacm_feature_scan\`| Feature adoption: Checkov, cost estimation, IaCM templates, private registry |
| 4 | \`harness_iacm_opa_scan\`    | OPA policies + policy sets, pipeline coverage, enabled vs disabled |
| 5 | \`harness_iacm_growth\`      | 12-month workspace + pipeline trajectory (optional but recommended) |
| 6 | \`harness_iacm_maturity_assessment\` | 11-axis maturity score (includes sprawl + registry dimensions; Crawl/Walk/Run by %) |

---

## Step 2 — Plan the charts

You have **two equivalent ways** to put charts in the BVR:

**(A) Inline chart fences in the markdown — RECOMMENDED.** The chart data
lives directly inside the markdown as a JSON fenced code block with the
language \`chart <kind>\`. The renderer parses, validates (via the same
Zod schema used by \`harness_iacm_chart\`), and inlines the SVG at render
time. No \`harness_iacm_chart\` calls, no SVG files on disk, no regen
step. Use this for every new BVR.

**(B) Pre-rendered SVG files via \`harness_iacm_chart\`.** Legacy pattern
— call the tool once per chart with an \`output_path\`, then reference
the file from markdown via \`![alt](assets/<chart>.svg)\`. Only use this
when the customer asks for standalone SVG asset files.

Both routes produce **visually identical** output because they share the
same canonical chart generators in \`src/charts/\`.

The example data shapes in Steps 2.1–2.6 below show the JSON to put
**inside** the chart fence in your markdown for option (A). For option
(B), the same JSON goes into the \`data\` field of \`harness_iacm_chart\`.

### 2.1 — Scorecard (top-of-page hero metrics)

\`\`\`json
{
  "tool": "harness_iacm_chart",
  "chart_kind": "scorecard",
  "data": {
    "tiles": [
      { "value": "<workspace_count>",  "label": "Workspaces",        "sub": "across <orgs> orgs" },
      { "value": "<pipeline_count>",   "label": "Pipelines",         "sub": "across <projects> projects" },
      { "value": "<opa_coverage_pct>%","label": "OPA Coverage",      "sub": "all pipelines governed" },
      { "value": "<active>/<total>",   "label": "Active Policy Sets","sub": "<disabled> disabled — quick wins" },
      { "value": "<score>/100",        "label": "Maturity Score",    "sub": "<tier> tier" }
    ]
  },
  "output_path": "${workspace_root}/reports/<bvr-id>/assets/scorecard.svg"
}
\`\`\`

### 2.2 — Maturity radar

Use all 11 dimensions from \`harness_iacm_maturity_assessment\` (includes
**Provisioner Standardisation** and **Module Registry Standardisation** —
low scores when many Terraform/OpenTofu/Terragrunt versions or no private
registry). Center value is the total score; \`centerSub\` is "out of 120";
\`centerTier\` is the tier (Crawl/Walk/Run) — auto-colours by tier.

\`\`\`json
{
  "tool": "harness_iacm_chart",
  "chart_kind": "maturity_radar",
  "data": {
    "title": "IaCM Maturity — <tier> Tier",
    "centerValue": <score>,
    "centerSub": "out of 100",
    "centerTier": "<tier>",
    "dimensions": [
      { "label": ["Workspace","Adoption"],  "score": 20, "max": 20 },
      { "label": ["Pipeline","Adoption"],   "score": 15, "max": 15 },
      ...
    ]
  },
  "output_path": "${workspace_root}/reports/<bvr-id>/assets/maturity-radar.svg"
}
\`\`\`

### 2.3 — Feature gauges

Circular progress rings per feature. \`status\` is auto-derived from \`pct\`
(≥80=success/green, ≥40=primary/blue, >0=danger/red, =0=neutral/grey)
unless you override it.

\`\`\`json
{
  "tool": "harness_iacm_chart",
  "chart_kind": "feature_gauges",
  "data": {
    "title": "Feature Adoption Scorecard",
    "gauges": [
      { "label": ["Workspace","Adoption"], "pct": 100 },
      { "label": ["Pipeline","Adoption"],  "pct": 100 },
      { "label": ["OPA","Coverage"],       "pct": 100 },
      { "label": ["Security","Scanning"],  "pct": 53  },
      { "label": ["Cost","Estimation"],    "pct": 7   },
      { "label": ["IaCM","Templates"],     "pct": 0   }
    ]
  },
  "output_path": "${workspace_root}/reports/<bvr-id>/assets/feature-gauges.svg"
}
\`\`\`

### 2.4 — OPA donut

Active vs disabled policy sets. List the actual names so the legend is
substantive (not just counts).

\`\`\`json
{
  "tool": "harness_iacm_chart",
  "chart_kind": "opa_donut",
  "data": {
    "title": "OPA Governance — <total> Policy Sets",
    "total":    <total>,
    "active":   <active_count>,
    "disabled": <disabled_count>,
    "centerValue": "<total>",
    "centerLabel": "policy sets",
    "centerSub": "<coverage_pct>% pipeline coverage",
    "activeItems":   ["<set1>","<set2>", ... up to 8],
    "disabledItems": ["<set1>","<set2>", ... up to 6]
  },
  "output_path": "${workspace_root}/reports/<bvr-id>/assets/opa-donut.svg"
}
\`\`\`

### 2.5 — Org footprint (diverging "Infrastructure DNA")

Top 10 orgs by total IaCM footprint. The chart auto-categorises each org
as WORKSPACE-LED / BALANCED / PIPELINE-LED based on the pl/ws ratio.

\`\`\`json
{
  "tool": "harness_iacm_chart",
  "chart_kind": "org_footprint",
  "data": {
    "title": "Top 10 Organisations · Infrastructure DNA",
    "orgs": [
      { "name": "<Org Name>", "ws": <workspaces>, "pl": <pipelines> },
      ... up to 10 ...
    ]
  },
  "output_path": "${workspace_root}/reports/<bvr-id>/assets/org-footprint.svg"
}
\`\`\`

### 2.6 — Monthly growth (optional but highly recommended)

If \`harness_iacm_growth\` is available in this session, call it to pull a
real 12-month time-series and render a cumulative dual-line chart. Skip
this step only if the customer explicitly says they don't want trajectory
data in the BVR.

\`\`\`json
{
  "tool": "harness_iacm_growth",
  "months": 12
}
\`\`\`

Then render with the canonical \`monthly_growth\` chart kind:

\`\`\`json
{
  "tool": "harness_iacm_chart",
  "chart_kind": "monthly_growth",
  "data": {
    "title": "IaCM Growth — Last 12 Months",
    "subtitle": "Cumulative workspaces and pipelines",
    "growth": {
      "workspaces": "+<workspaces.growthPct>% / 12 mo",
      "pipelines":  "+<pipelines.growthPct>% / 12 mo"
    },
    "points": [
      { "label": "<monthly[0].label>",  "workspaces": <monthly[0].workspaces.cumulative>,  "pipelines": <monthly[0].pipelines.cumulative> },
      ... 12 entries from monthly[] (use cumulative counts) ...
    ]
  },
  "output_path": "${workspace_root}/reports/<bvr-id>/assets/growth.svg"
}
\`\`\`

Reference it from the markdown as \`![IaCM Growth — Last 12 Months](assets/growth.svg)\`,
typically inside Section 1 (Enterprise Footprint) right after the org
footprint chart, with a callout summarising the trajectory.

### 2.7 — Priority matrix (Recommended Actions)

Three lanes (P1 / P2 / P3) with effort chips. P1 = config-only,
P2 = some engineering, P3 = longer-term investments.

\`\`\`json
{
  "tool": "harness_iacm_chart",
  "chart_kind": "priority_matrix",
  "data": {
    "lanes": [
      {
        "badge": "P1", "label": "Do Now", "sub": "Config only — no engineering", "color": "p1",
        "actions": [
          { "text": "<concise action>", "effort": "Low" }, ...
        ]
      },
      {
        "badge": "P2", "label": "This Quarter", "sub": "Some engineering required", "color": "p2",
        "actions": [...]
      },
      {
        "badge": "P3", "label": "Next Quarter", "sub": "Longer-term investments", "color": "p3",
        "actions": [...]
      }
    ]
  },
  "output_path": "${workspace_root}/reports/<bvr-id>/assets/priority-matrix.svg"
}
\`\`\`

---

## Step 3 — Compute hero stats

Pick the 4 most striking numbers for the cover hero tiles:

    "<workspaces>|Workspaces; <pipelines>|Pipelines; <opa_pct>%|OPA Governed; <score>/100|Maturity · <tier>"

This goes into the \`heroStats\` frontmatter line in Step 4.

---

## Step 4 — Write the markdown BVR

Save to: \`${workspace_root}/reports/<bvr-id>/iacm-bvr.md\`

**Use inline chart fences** (option A from Step 2). Each chart is a
fenced code block with the language \`chart <kind>\` followed by JSON.
The renderer parses, validates, and inlines the SVG at that location.

Use this exact structure (frontmatter, sections, callouts):

\`\`\`markdown
---
title: "IaCM Business Value Review"
subtitle: "Infrastructure as Code Management at enterprise scale"
customer: "${customer_name}"
docType: "Business Value Review"
date: "<Mon DD, YYYY>"
author: "Harness IaCM"
classification: "Confidential"
defaultTheme: "${themeChoice}"
heroStats: "<see Step 3>"
bvr_template: "canonical"
---

# Executive Summary

<2–3 sentences: scale of the deployment, headline maturity score, single most important opportunity.>

\\\`\\\`\\\`chart scorecard Account Scorecard
{
  "tiles": [
    { "value": "<workspaces>",     "label": "WORKSPACES",         "sub": "across <orgs> orgs" },
    { "value": "<pipelines>",      "label": "PIPELINES",          "sub": "across <projects> projects" },
    { "value": "<opa_pct>%",       "label": "OPA COVERAGE",       "sub": "all pipelines governed" },
    { "value": "<active>/<total>", "label": "ACTIVE POLICY SETS", "sub": "<disabled> disabled — quick wins" },
    { "value": "<score>/100",      "label": "MATURITY SCORE",     "sub": "<tier> tier" }
  ]
}
\\\`\\\`\\\`

::: success
**The headline.** <One sentence framing the strongest signal — e.g. "Six of nine maturity dimensions score full marks.">
:::

---

# 1. Enterprise Footprint

<2–3 sentences on breadth: number of orgs, business units, geographies covered.>

\\\`\\\`\\\`chart org_footprint Top 10 Organisations by IaCM Footprint
{ /* org_footprint data — see Step 2.5 */ }
\\\`\\\`\\\`

::: success
**Breadth, not just scale.** <Concrete observations — name the top 1–2 orgs and what makes their pattern stand out.>
:::

\\\`\\\`\\\`chart monthly_growth IaCM Growth — Last 12 Months
{ /* monthly_growth data — see Step 2.6 */ }
\\\`\\\`\\\`

::: info
**Sustained adoption.** <One sentence on workspace + pipeline growth percentages.>
:::

### Workspace lifecycle status

<1–2 sentences on active vs inactive vs failed/apply_needed counts from \`harness_iacm_workspace_inventory\`.>

\`\`\`chart bar Workspace status distribution
{
  "title": "Workspace status",
  "bars": [
    { "label": "Active", "value": <active_count>, "tone": "success" },
    { "label": "Inactive", "value": <inactive_count>, "tone": "secondary" },
    { "label": "Apply needed", "value": <apply_needed_count>, "tone": "warning" },
    { "label": "Failed", "value": <failed_count>, "tone": "danger" }
  ]
}
\`\`\`

### Provisioner and version sprawl

<Table of provisioner types (Terraform, OpenTofu, Terragrunt) and top version lines. Call out sprawl maturity finding.>

\`\`\`chart bar Top provisioner version lines
{
  "title": "Provisioner version lines (major.minor)",
  "bars": [ /* top 6–8 from versionLabels[] */ ]
}
\`\`\`

::: critical
**Version sprawl.** <Finding from versionSprawl — many pins/lines lowers Provisioner Standardisation score.>
:::

### Geographic Coverage

<Table or short list of regions if known, otherwise omit this subsection.>

---

# 2. Maturity Assessment — <tier> Tier

\\\`\\\`\\\`chart maturity_radar IaCM Maturity Radar — <score> of 100, <tier> tier
{ /* maturity_radar data — see Step 2.2 */ }
\\\`\\\`\\\`

<2–3 sentences explaining the score and the path to the next tier.>

::: info
**Path to <next-tier>.** <Concrete actionable statement, e.g. "Enable cost estimation (+14 pts) and complete a Checkov audit (+7 pts).">
:::

| Dimension | Score | Max | Status |
|-----------|-------|-----|--------|
| <fill from maturity scan> |

---

# 3. Feature Adoption

\\\`\\\`\\\`chart feature_gauges Feature Adoption Scorecard
{ /* feature_gauges data — see Step 2.3 */ }
\\\`\\\`\\\`

<2 sentences on top-line adoption.>

::: critical
**<largest gap one-liner>** <One paragraph explaining the impact of the largest disabled feature.>
:::

::: warning
**<second gap one-liner>** <Short paragraph on the second-largest gap.>
:::

### Module registry standardisation

<Explain Harness private vs other private vs no registry. No registry = git-only / unset = standardisation opportunity.>

\`\`\`chart bar Module registry usage
{
  "title": "Module registry sources",
  "bars": [
    { "label": "Harness private", "value": <harness_private>, "tone": "success" },
    { "label": "Other private", "value": <other_private>, "tone": "primary" },
    { "label": "Public only", "value": <public_only>, "tone": "secondary" },
    { "label": "No registry", "value": <none>, "tone": "danger" }
  ]
}
\`\`\`

::: action
**Standardise module consumption.** <Recommendation from moduleRegistryMaturity — expand Harness Module Registry for workspaces without registry metadata.>
:::

---

# 4. OPA Governance

\\\`\\\`\\\`chart opa_donut OPA Policy Sets — <active> active, <disabled> disabled
{ /* opa_donut data — see Step 2.4 */ }
\\\`\\\`\\\`

<2 sentences naming the strongest policy framework.>

::: success
**<positive framing>** <Sentence praising the strongest pillar.>
:::

::: action
**Quick win: activate <N> disabled policy sets.** <List them. End with "no authoring, no testing, no engineering" if true.>
:::

---

# 5. Recommended Actions

\\\`\\\`\\\`chart priority_matrix Priority Action Matrix — Effort vs Impact
{ /* priority_matrix data — see Step 2.7 */ }
\\\`\\\`\\\`

<1 sentence highlighting the P1 quadrant.>

::: action
**P1 — <action 1 title>.** <2 sentences on what + why.>
:::

::: action
**P1 — <action 2 title>.** <Same.>
:::

<Continue with P2 / P3 actions as ::: action callouts>

---

# 6. Before & After

| Without Full IaCM Adoption | <customer> Today with Harness |
|---------------------------|-------------------------------|
| <pain> | <gain> |

---

# Appendix — Organisation Summary

<Table of every org with workspaces and pipelines counts. End with totals row.>

---

*Harness IaCM · Business Value Review · <date> · ${customer_name} · Confidential*
\`\`\`

### Callout vocabulary

Use these EXACT directive types — they have semantic colour mapping in
the renderer:

| Directive | When to use |
|-----------|-------------|
| \`::: success\` | Good news / strengths |
| \`::: critical\` | Largest gap / risk |
| \`::: warning\` | Secondary risk |
| \`::: info\` | Neutral context, "path to" statements |
| \`::: action\` | Recommended next steps (P1/P2/P3) |

---

## Step 5 — Render and return the URL

Final step:

\`\`\`json
{
  "tool": "harness_iacm_render_report",
  "input_path": "${workspace_root}/reports/<bvr-id>/iacm-bvr.md",
  "theme": "${themeChoice}"
}
\`\`\`

Return the resulting URL to the user along with the per-theme URLs from
the response so they can switch themes interactively.

---

## Critical rules

- **Canonical structure is non-negotiable by default.** Use the exact 8
  H1 sections in Step 4. Do not invent new section titles like "Path to
  RUN tier" or "Strategic narrative for the call" — fold those points
  into the canonical sections (Recommended Actions, Executive Summary,
  Before & After). The renderer enforces this: \`harness_iacm_render_report\`
  and \`harness_iacm_markdown_to_pdf\` validate the document via
  \`harness_iacm_bvr_validate\` and **refuse to produce output** when the
  structure deviates. To opt out (rare — for non-BVR documents only),
  set \`bvr_template: "custom"\` in the frontmatter.
- **Preflight before render.** After writing the markdown, call
  \`harness_iacm_bvr_validate\` with the document path to surface any
  structural issues before rendering. Fix violations rather than skip
  validation.
- **Inline chart fences are the default.** Embed JSON directly in the
  markdown with \`\\\`\\\`\\\`chart <kind>\` — no \`harness_iacm_chart\`
  calls, no SVG files, no regen step. Only use \`harness_iacm_chart\`
  if the customer explicitly needs standalone SVG asset files.
- **Strict JSON inside chart fences.** Double-quoted keys, no trailing
  commas, no comments, no JS expressions. If validation fails the
  renderer shows an inline error callout — fix the JSON, don't ignore it.
- **Never** use \`harness_ccm_finops_chart\` for IaCM data — only the
  IaCM chart kinds match the report theme.
- **Every** number must come from a real tool response — no placeholders.
- The tone is **factual and customer-facing**, not internal/jargony.
- The \`heroStats\` line uses **\`;\` between stats** and **\`|\` between
  value and label** — never mix the separators.
- The closed set of \`:::\` directives is: \`success\`, \`critical\`,
  \`warning\`, \`info\`, \`action\`, \`quote\`. Anything else fails
  validation and renders as plain text.
- **Customisations.** Only deviate from the canonical structure when the
  user explicitly asks (e.g. "add a Glossary section", "remove the
  Before & After comparison"). Their request is the trigger; never
  pre-emptively add or remove sections.
- After Step 5, **return the URL**, do not summarise the BVR in chat —
  the rendered page is the deliverable.
`.trim(),
            },
          },
        ],
      };
    },
  );
}
