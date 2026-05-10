import * as z from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * IaCM Business Value Review (BVR) prompt.
 *
 * Orchestrates all scan tools in the correct order and frames
 * the output as a customer-facing BVR section.
 */
export function registerIacmBvrPrompt(server: McpServer): void {
  server.registerPrompt(
    "iacm_bvr",
    {
      description:
        "Generate a complete IaCM Business Value Review section — covers workspace inventory, " +
        "pipeline coverage, OPA governance, and feature adoption (Checkov, cost estimation, templates, module registry). " +
        "Designed to be dropped directly into a customer BVR deck.",
      argsSchema: {
        customer_name: z
          .string()
          .describe("Customer name to personalise the report (e.g. 'Acme Corp').")
          .optional(),
        org_id: z
          .string()
          .describe("Limit to a specific Harness org (optional — omit to scan everything).")
          .optional(),
      },
    },
    ({ customer_name, org_id }) => {
      const customerLabel = customer_name ? `for **${customer_name}**` : "for this account";
      const scopeNote = org_id
        ? `Limit all scans to org \`${org_id}\`.`
        : "Scan all orgs and projects (no scope restriction).";

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `
# IaCM Business Value Review ${customerLabel}

${scopeNote}

Run the following tools **in order** and compile a single BVR report. Do NOT skip any step.

---

## Step 1 — Account Overview
Call \`harness_iacm_scan\` (include: "both").
Extract:
- Total orgs, projects, workspaces, pipelines
- Breakdown by org → project

## Step 2 — Feature Adoption
Call \`harness_iacm_feature_scan\`.
For each feature, report:
- ✅ Adopted: count + pipeline/workspace names
- ❌ Not adopted: count + names
- Adoption % and BVR opportunity statement

Features to cover:
| Feature | Scope | Good threshold |
|---------|-------|---------------|
| Checkov security scans | Pipelines | > 80% |
| Cost estimation | Workspaces | > 50% |
| IaCM templates | Pipelines | > 60% |
| Private module registry | Workspaces | Depends on org policy |

## Step 3 — OPA Governance
Call \`harness_iacm_opa_scan\` (entity_types: "PIPELINE,WORKSPACE").
Report:
- Total policies (enabled vs disabled)
- Active policy sets with trigger type (onRun vs afterTerraformPlan)
- Pipeline coverage % — which pipelines are enforced, which are not
- Disabled policy sets = governance written but not activated
- Missing: workspace-scoped policy sets, onRun (shift-left) enforcement

---

## Report Format

Structure the output as follows:

### 1. Executive Summary (3–4 bullets)
- Total IaCM footprint (workspaces + pipelines)
- Top adopted features
- Top governance gaps
- One headline BVR recommendation

### 2. Workspace & Pipeline Inventory
Table: org | project | workspaces | pipelines

### 3. Feature Adoption Scorecard
Table: feature | adopted | total | % | status (🟢/🟡/🔴) | opportunity

### 4. OPA Governance Report
- Policy inventory summary
- Active vs inactive policy sets
- Pipeline coverage %
- Gaps and recommendations

### 5. Recommended Next Steps (prioritised)
3–5 concrete actions the customer should take, ordered by impact.
Frame each as: *"Enable [feature] on [X] pipelines/workspaces to achieve [outcome]."*

---

Keep the tone factual and customer-facing. Use concrete numbers from the API responses.
Do not use placeholder text — every number must come from the actual scan results.
`.trim(),
            },
          },
        ],
      };
    },
  );
}
