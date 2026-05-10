import * as z from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * OPA Policy Analysis prompt.
 *
 * Default behaviour: always scope to IaCM first.
 * If the user explicitly asks for another module, honour that request.
 */
export function registerOpaAnalysisPrompt(server: McpServer): void {
  server.registerPrompt(
    "opa_policy_analysis",
    {
      description:
        "Analyse OPA policies and governance adoption in Harness. " +
        "Defaults to IaCM scope (Terraform/OpenTofu workspaces and pipelines). " +
        "Pass module=all or a specific module name to broaden the scope.",
      argsSchema: {
        module: z
          .string()
          .describe(
            "Which Harness module to focus the OPA analysis on. " +
            "Default: 'iacm'. Other values: 'pipeline', 'connector', 'secret', 'all'.",
          )
          .default("iacm")
          .optional(),
        question: z
          .string()
          .describe("The specific OPA question or task (e.g. 'how many policies are active?', 'which pipelines have no enforcement?').")
          .optional(),
      },
    },
    ({ module = "iacm", question }) => {
      const isIacm = !module || module === "iacm";
      const isAll = module === "all";

      const scopeStatement = isIacm
        ? "**Scope: IaCM only.** Focus exclusively on OPA policies and policy sets that govern " +
          "Terraform and OpenTofu workspaces and pipelines. Ignore pipeline, connector, secret, " +
          "and other module policies UNLESS the user explicitly asks for them."
        : isAll
        ? "**Scope: All modules.** Report OPA policies across all Harness modules."
        : `**Scope: ${module} module only.** Focus on OPA policies relevant to the ${module} module.`;

      const taskStatement = question
        ? `**User question:** ${question}`
        : "The user has not specified a particular question — provide a full adoption report.";

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `
# OPA Policy Analysis — Harness IaCM

${scopeStatement}

${taskStatement}

## How to respond

1. **Always call \`harness_iacm_opa_scan\` first** — it returns:
   - Total policy count and per-policy enabled status
   - Policy sets grouped by entity type and enabled/disabled state
   - Per-pipeline OPA enforcement (which pipelines are covered, which are not)
   - BVR-ready summary with adoption % and opportunity statements

2. **IaCM-relevant policy types to highlight:**
   - \`afterTerraformPlan\` — post-plan cost/compliance gates
   - \`afterTerraformApply\` — post-apply state enforcement  
   - \`onRun\` — pre-execution guardrails (shift-left)
   - Workspace-scoped policy sets

3. **IaCM-specific policies to call out (if present):**
   - Terraform plan cost policies (cost estimate guardrails)
   - S3 / cloud resource compliance policies (SSE, versioning, public access, lifecycle)
   - OpenTofu-specific governance rules
   - IaCM workspace configuration policies

4. **Ignore for IaCM scope** (unless user asks):
   - Feature flag policies
   - SBOM / STO security test policies
   - Pipeline approval or CD-specific policies
   - IDP / error budget policies

5. **BVR framing:**
   - Lead with: total policies → active policy sets → pipeline coverage %
   - Flag disabled policy sets as "written but not enforced" — governance gap
   - Flag \`afterTerraformPlan\`-only coverage as missing shift-left (\`onRun\`) enforcement
   - Flag 0 workspace-scoped policy sets as a gap (workspace config not governed)

6. **If coverage is < 100%:** List exact pipeline names that have no OPA enforcement.

7. **If coverage is 100%:** Still check whether disabled policy sets represent missed opportunities.
`.trim(),
            },
          },
        ],
      };
    },
  );
}
