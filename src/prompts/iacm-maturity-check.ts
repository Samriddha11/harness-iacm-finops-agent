import * as z from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Maturity-check prompt — answer "where are we?" and "how do we improve?"
 * without producing a full BVR.
 *
 * Use cases:
 *   • Quarterly maturity progress check
 *   • "We made changes — did our score move?"
 *   • Pre-call quick read on a customer's IaCM posture
 *
 * Output: maturity score + tier + radar chart + ranked path-to-next-tier.
 */
export function registerMaturityCheckPrompt(server: McpServer): void {
  server.registerPrompt(
    "iacm_maturity_check",
    {
      description:
        "Compute the IaCM maturity score (out of 100) plus tier " +
        "(CRAWL/WALK/RUN/FLY), render the radar chart in canonical style, " +
        "and rank the smallest changes that would move the score the " +
        "furthest. No full BVR — just the maturity slice.",
      argsSchema: {
        org_id: z
          .string()
          .describe("Limit the maturity scan to one Harness org. Omit to scan everything.")
          .optional(),
        chart_output_path: z
          .string()
          .describe(
            "Optional ABSOLUTE path to write the maturity radar SVG. " +
            "Omit if you only want the numbers in chat — no SVG is rendered. " +
            "Example: /Users/me/work/proj/charts/maturity.svg",
          )
          .optional(),
      },
    },
    ({ org_id, chart_output_path }) => {
      const scopeNote = org_id
        ? `Limit the scan to org \`${org_id}\`.`
        : "Scan **all orgs** (no scope restriction).";

      const renderStep = chart_output_path
        ? `

## Step 2 — Render the radar chart

Call \`harness_iacm_chart\` so the chart matches the canonical BVR style:

\`\`\`json
{
  "tool": "harness_iacm_chart",
  "chart_kind": "maturity_radar",
  "data": {
    "title": "IaCM Maturity — <tier> Tier",
    "centerValue": <score>,
    "centerSub": "out of 100",
    "centerTier": "<tier>",
    "dimensions": [ /* 9 entries from the scan response */ ]
  },
  "output_path": "${chart_output_path}"
}
\`\`\`
`
        : "";

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `
# IaCM Maturity Check

${scopeNote}

## Step 1 — Score the account

Call \`harness_iacm_maturity\`${org_id ? ` with \`org_id: "${org_id}"\`` : ""}.
The response gives you:

- \`score\` — total out of 100
- \`tier\` — CRAWL / WALK / RUN / FLY
- \`dimensions[]\` — per-dimension score and max (9 entries)
- \`gaps[]\` — which dimensions are below max, and what enabling them is worth
${renderStep}
## Step ${chart_output_path ? "3" : "2"} — Rank the path to the next tier

Return a short, ranked list of the **smallest possible changes** that
would deliver the most maturity points. Sort by **points-per-effort**:

| Rank | Action | Δ Points | Effort |
|------|--------|---------|--------|
| 1 | <smallest action> | +N | Config-only / Low / Medium |
| 2 | ... | +N | ... |

For each item, name the dimension it affects and the concrete toggle or
configuration change required. Avoid vague advice like "improve security"
— say "enable cost estimation on all production workspaces (+14 pts)".

## Step ${chart_output_path ? "4" : "3"} — Reply format

A short, scannable summary:

\`\`\`
**Score:** 74 / 100   **Tier:** RUN
**Strengths:** 6 of 9 dimensions at full marks
**Largest gap:** Cost Estimation (1 / 15) — toggle, not engineering

**Path to <next-tier>:**
1. <action>  +N pts
2. <action>  +N pts
3. <action>  +N pts
\`\`\`

${chart_output_path
  ? `Reference the rendered chart with: \`![Maturity Radar](${chart_output_path})\``
  : "If the user wants the chart later, suggest re-invoking this prompt with `chart_output_path` set."}

## Critical rules

- **Every number** comes from \`harness_iacm_maturity\` — no estimates.
- Tier mapping is fixed by the scan tool — don't override it.
- Path-to-next-tier items must reference real dimensions and real
  features (no generic advice).
- Reply is short — the score + the ranked path is the whole deliverable.
`.trim(),
            },
          },
        ],
      };
    },
  );
}
