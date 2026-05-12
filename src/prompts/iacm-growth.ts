import * as z from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Growth-trend prompt — month-over-month growth of workspaces and
 * pipelines over the last N months, rendered as a polished line chart.
 *
 * Use cases:
 *   • "How fast is IaCM growing in this account?"
 *   • Quarterly trajectory slide
 *   • BVR appendix / supplementary chart
 */
export function registerGrowthPrompt(server: McpServer): void {
  server.registerPrompt(
    "iacm_growth",
    {
      description:
        "Compute and visualise month-over-month growth of IaCM workspaces " +
        "and pipelines over the last N months. Calls harness_iacm_growth to " +
        "build a real time-series from creation timestamps, then renders a " +
        "polished cumulative line chart in the canonical IaCM style.",
      argsSchema: {
        chart_output_path: z
          .string()
          .describe(
            "ABSOLUTE filesystem path where the SVG chart will be written, " +
            "ending in .svg. Example: /Users/me/work/proj/charts/growth.svg",
          ),
        months: z
          .string()
          .describe("Lookback window in months (default '12', max '36'). String to play nicely with prompt args.")
          .optional(),
        org_id: z
          .string()
          .describe("Limit growth scan to one Harness org. Omit to scan all orgs.")
          .optional(),
      },
    },
    ({ chart_output_path, months, org_id }) => {
      const monthsN = Math.max(3, Math.min(36, Number(months) || 12));
      const scopeNote = org_id
        ? `Limit the scan to org \`${org_id}\`.`
        : "Scan **all orgs** in the account.";

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `
# IaCM Growth — last ${monthsN} months

${scopeNote}

## Step 1 — Pull the time-series

Call \`harness_iacm_growth\`:

\`\`\`json
{
  "tool": "harness_iacm_growth",
  "months": ${monthsN}${org_id ? `,\n  "org_id": "${org_id}"` : ""}
}
\`\`\`

The response contains:

- \`monthly[]\` — one entry per month with \`{ workspaces: { new, cumulative }, pipelines: { new, cumulative } }\`
- \`growth.workspaces\` — \`{ added, growthPct, monthlyAvg }\` over the window
- \`growth.pipelines\`  — same shape
- \`summary.baseline\`  — items created BEFORE the window (the cumulative starting point)

## Step 2 — Render the chart

Map \`monthly[]\` to the \`points\` array using the **cumulative** counts
(that's the recommended view — shows scale + trajectory together):

\`\`\`json
{
  "tool": "harness_iacm_chart",
  "chart_kind": "monthly_growth",
  "data": {
    "title": "IaCM Growth — Last ${monthsN} Months",
    "subtitle": "Cumulative workspaces and pipelines",
    "growth": {
      "workspaces": "+<workspaces.growthPct>% / ${monthsN} mo",
      "pipelines":  "+<pipelines.growthPct>% / ${monthsN} mo"
    },
    "points": [
      { "label": "<monthly[0].label>", "workspaces": <monthly[0].workspaces.cumulative>, "pipelines": <monthly[0].pipelines.cumulative> },
      ...
      { "label": "<monthly[N].label>", "workspaces": <monthly[N].workspaces.cumulative>, "pipelines": <monthly[N].pipelines.cumulative> }
    ]
  },
  "output_path": "${chart_output_path}"
}
\`\`\`

**Important:** round growthPct to 1 decimal place. Format growth chips as
\`"+42.1% / ${monthsN} mo"\` or \`"+0% / ${monthsN} mo"\` for flat growth.

## Step 3 — Reply format

Lead with the headline, then the chart reference, then a 2-line
explanation:

\`\`\`
**Workspaces:** <total> today (+<X>% in ${monthsN} months · avg <Y>/mo)
**Pipelines:**  <total> today (+<X>% in ${monthsN} months · avg <Y>/mo)

![IaCM Growth — last ${monthsN} months](${chart_output_path})

<2 sentences naming the steepest month and the slowest month, plus
whether growth is sustained, accelerating, or plateauing.>
\`\`\`

## Critical rules

- Always use \`harness_iacm_growth\` for the data — never estimate
  monthly counts from a single snapshot.
- Always use \`harness_iacm_chart\` (chart_kind \`monthly_growth\`)
  for the visual — never \`harness_ccm_finops_chart\`.
- Show the \`baseline\` count somewhere (in the prose) if it's > 0 —
  it explains why the line doesn't start at zero.
- If \`growth.workspaces.growthPct\` is \`null\` (zero baseline),
  state "no prior baseline" instead of a percentage.
- Reply is short — the chart + the two headline numbers is the whole
  deliverable.
`.trim(),
            },
          },
        ],
      };
    },
  );
}
