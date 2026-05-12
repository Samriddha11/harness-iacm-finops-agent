import * as z from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Quick-wins prompt — list only the IaCM opportunities that require
 * configuration changes (no engineering work, no policy authoring).
 *
 * Use cases:
 *   • "What can we ship this week?" — pre-call ammunition for CSMs / TAMs
 *   • Internal value-realisation reviews
 *   • Change-window planning
 *
 * Output: a ranked list of disabled-but-already-authored OPA policy sets,
 * disabled but available IaCM features, and dormant geographies/orgs —
 * each with the change required, the impact, and the effort label.
 */
export function registerQuickWinsPrompt(server: McpServer): void {
  server.registerPrompt(
    "iacm_quick_wins",
    {
      description:
        "Find every IaCM opportunity in the account that is CONFIG-ONLY " +
        "— things that are already authored, validated, or licensed but " +
        "not yet enabled. Returns a ranked list of disabled OPA policy " +
        "sets, disabled features, and dormant orgs/regions. No engineering " +
        "work, no authoring, no testing required to ship any of them.",
      argsSchema: {
        org_id: z
          .string()
          .describe("Limit scans to one Harness org. Omit to scan all orgs.")
          .optional(),
        chart_output_path: z
          .string()
          .describe(
            "Optional ABSOLUTE path to write a P1-only priority matrix SVG. " +
            "Useful for slide decks. Example: /Users/me/work/proj/charts/quick-wins.svg",
          )
          .optional(),
      },
    },
    ({ org_id, chart_output_path }) => {
      const scopeNote = org_id
        ? `Limit all scans to org \`${org_id}\`.`
        : "Scan **all orgs** (no scope restriction).";

      const renderStep = chart_output_path
        ? `

## Step 3 — Render the P1 priority matrix

Show the user a polished SVG of just the quick wins. Use a single P1 lane
with the actions you ranked in Step 2:

\`\`\`json
{
  "tool": "harness_iacm_chart",
  "chart_kind": "priority_matrix",
  "data": {
    "title": "Quick Wins — Effort vs Impact",
    "lanes": [
      {
        "badge": "P1",
        "label": "Do Now",
        "sub": "Config only — no engineering",
        "color": "p1",
        "actions": [
          { "text": "<action 1 (≤ 26 chars per line, wraps)>", "effort": "Low" },
          { "text": "<action 2>", "effort": "Low" },
          { "text": "<action 3>", "effort": "Low" }
        ]
      }
    ]
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
# IaCM Quick Wins

${scopeNote}

Goal: surface only the opportunities a customer can ship in a single
change window — no code, no authoring, no review cycles.

## Step 1 — Gather the raw signals

Run **both** of these tools and keep the responses for Step 2:

| Tool | What you're looking for |
|------|-------------------------|
| \`harness_iacm_opa_scan\` | OPA policy sets that are **disabled** but already exist (the body, the rules, the targets are all there — just turn them on) |
| \`harness_iacm_feature_scan\` | IaCM features that are **available but disabled** (cost estimation, IaCM templates, private registry, Checkov, etc.) |

Optional, only if the conversation hints at geographic expansion:
- \`harness_iacm_scan\` to find orgs / regions with **0 workspaces but already configured** (licensed, project-scaffolded, dormant).

## Step 2 — Rank the quick wins

For every disabled item, decide if it is genuinely a "quick win". Filter
OUT anything that requires:

- New policy authoring (rule body doesn't exist yet)
- New IaCM templates (need to be designed)
- New connectors / new providers
- Pipeline refactors

Keep ONLY items where the change is a single toggle, a single setting,
or activating an authored-but-disabled object.

Rank by **impact-per-effort**. For each item, capture:

| Rank | Action | What changes | Why it matters | Effort |
|------|--------|--------------|----------------|--------|
| 1 | Activate \`Finops\` policy set | Cost estimation enforced on every plan | Closes the largest maturity gap (+14 pts) | Low |
| 2 | Activate \`API Token Expiry\` | Tokens expire on schedule | Compliance signal | Low |
| ... | ... | ... | ... | ... |
${renderStep}
## Step ${chart_output_path ? "4" : "3"} — Reply format

Lead with the count and total expected impact, then the ranked table.
Keep the reply short — this is for a CSM or TAM to glance at before a
customer call:

\`\`\`
**Quick wins available:** 7 (estimated +21 maturity pts, 0 engineering days)

| # | Action | Δ | Effort |
|---|--------|---|--------|
| 1 | ... | ... | Low |
...
\`\`\`

End with a single sentence on the **largest** quick win and the change
window it would fit into.

## Critical rules

- "Quick win" = config-only. Anything that needs engineering work belongs
  in P2/P3 — explicitly exclude it here.
- Every number must come from a real scan response.
- Don't recommend the same item twice (e.g. an OPA set that's also
  surfaced via the feature scan).
- If there are zero quick wins, say so explicitly. Don't pad the list.
`.trim(),
            },
          },
        ],
      };
    },
  );
}
