import * as z from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Quick-chart prompt — produce ONE polished, theme-aware SVG without the
 * full BVR ceremony.
 *
 * Use cases:
 *   • Drop a single chart into a slide deck or email
 *   • Visualise an ad-hoc number the user just mentioned
 *   • Iterate on chart data interactively (regenerate after each edit)
 *
 * The agent always uses `harness_iacm_chart` so the result inherits the
 * exact same style as a full BVR — no styling drift between one-off
 * charts and full reports.
 */
export function registerQuickChartPrompt(server: McpServer): void {
  server.registerPrompt(
    "iacm_quick_chart",
    {
      description:
        "Produce ONE polished SVG chart in the canonical IaCM BVR style — " +
        "no full report, no scan ceremony. Just pick a chart kind, supply " +
        "the data (or describe what you want and the agent will infer it), " +
        "and the chart is written to disk and ready to use.",
      argsSchema: {
        chart_kind: z
          .enum([
            "scorecard", "maturity_radar", "feature_gauges",
            "opa_donut", "org_footprint", "priority_matrix", "bar",
            "monthly_growth",
          ])
          .describe(
            "Which chart to render. " +
            "scorecard=metric tiles row · " +
            "maturity_radar=spider with central score · " +
            "feature_gauges=circular % rings · " +
            "opa_donut=active vs disabled donut + legend · " +
            "org_footprint=diverging bars (workspaces left, pipelines right) · " +
            "priority_matrix=3-lane P1/P2/P3 cards · " +
            "bar=generic horizontal bar chart · " +
            "monthly_growth=dual-line cumulative trend (workspaces + pipelines over N months).",
          ),
        output_path: z
          .string()
          .describe(
            "ABSOLUTE filesystem path where the SVG should be written, " +
            "ending in .svg. The agent will create parent directories. " +
            "Example: /Users/me/work/proj/charts/q4-scorecard.svg",
          ),
        ask: z
          .string()
          .describe(
            "Optional one-line description of what the chart should show. " +
            "Use when you don't already have the data shape in hand — " +
            "the agent will scan the account or use the numbers in your " +
            "previous messages to fill in the data.",
          )
          .optional(),
      },
    },
    ({ chart_kind, output_path, ask }) => {
      const intent = ask
        ? `**What the chart should show:** ${ask}`
        : "Use the numbers the user has already provided in this conversation. " +
          "If any required data is missing, ask once for the specific values " +
          "needed by the chart_kind below — do NOT invent placeholders.";

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `
# Quick chart — \`${chart_kind}\`

${intent}

## How to do it

1. **Look up the data shape.** If you don't know the schema for
   \`${chart_kind}\`, call \`harness_iacm_describe\` with
   \`resource_type: "chart_${chart_kind}"\` to get the exact field list.

2. **Gather the numbers** — either from the user's prompt above, from a
   relevant scan tool (\`harness_iacm_scan\` / \`harness_iacm_opa_scan\` /
   \`harness_iacm_feature_scan\` / \`harness_iacm_maturity\`), or by asking
   the user for any missing values.

3. **Render the chart** with one call:

\`\`\`json
{
  "tool": "harness_iacm_chart",
  "chart_kind": "${chart_kind}",
  "data": { /* shape from step 1, values from step 2 */ },
  "output_path": "${output_path}"
}
\`\`\`

4. **Return** the absolute path of the written SVG plus the
   \`markdown_ref\` the tool emits — that's a ready-to-paste markdown
   image link.

## Critical rules

- **Always** use \`harness_iacm_chart\` — never \`harness_ccm_finops_chart\`
  or any generic charting tool. Only \`harness_iacm_chart\` produces SVGs
  in the canonical IaCM style that auto-recolour with every theme.
- Every number must come from real data (scan response or user input).
  No placeholders, no made-up rounded numbers.
- The chart is the deliverable — keep your chat reply short. Path + one
  line of context is enough.
`.trim(),
            },
          },
        ],
      };
    },
  );
}
