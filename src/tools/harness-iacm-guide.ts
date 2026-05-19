import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const GUIDE = `
# Harness IaCM MCP Server — Agent Guide

## Overview

This MCP server integrates with **Harness IaCM (Infrastructure as Code Management)** — the Harness module for managing Terraform and OpenTofu workspaces, pipeline-driven provisioning, and state at scale.

---

## Tools

| Tool | Purpose |
|------|---------|
| \`harness_iacm_scan\` | **Auto-scan all orgs/projects** — counts workspaces + pipelines account-wide with no args |
| \`harness_iacm_workspace_inventory\` | **BVR workspace inventory** — provisioner/version sprawl, status distribution, module registry classification |
| \`harness_iacm_feature_scan\` | **BVR feature adoption scan** — detects Checkov, cost estimation, templates, private registry per pipeline/workspace |
| \`harness_iacm_opa_scan\` | **BVR OPA governance scan** — lists all OPA policies + policy sets, shows which IaCM pipelines have enforcement and which don't |
| \`harness_iacm_list\` | List any IaCM resource with filtering and pagination |
| \`harness_iacm_get\` | Get a single resource by ID |
| \`harness_iacm_run\` | Trigger a plan / apply / destroy run on a workspace |
| \`harness_iacm_describe\` | Discover resource types, fields, and operations (no API call) |
| \`harness_iacm_bvr_validate\` | **Preflight a BVR markdown** against canonical-structure rules — call before rendering |
| \`harness_iacm_guide\` | Return this guide |

---

## Resource Types

### Discovery (no org/project needed)

| Resource Type | Description | Required Fields |
|--------------|-------------|-----------------|
| \`harness_org\` | All orgs in the account | none |
| \`harness_project\` | Projects, filter by \`has_module=IACM\` | none (optional: \`org_id\`, \`has_module\`) |
| \`workspace_account\` | All workspaces in the account | none |

### Workspace Resources (IACM API — 1-based pagination)

| Resource Type | Description | Required Fields |
|--------------|-------------|-----------------|
| \`workspace\` | Workspaces in a project | \`org_id\`, \`project_id\` |
| \`workspace_run\` | Plan / apply / destroy runs | \`org_id\`, \`project_id\`, \`workspace_id\` |
| \`workspace_resource\` | State-managed Terraform resources | \`org_id\`, \`project_id\`, \`workspace_id\` |
| \`workspace_variable\` | Workspace variables (Terraform + env) | \`org_id\`, \`project_id\`, \`workspace_id\` |
| \`workspace_state\` | Current state + version history | \`org_id\`, \`project_id\`, \`workspace_id\` |

### Pipeline Resources (Harness NG API — 0-based pagination)

| Resource Type | Description | Required Fields |
|--------------|-------------|-----------------|
| \`iacm_pipeline\` | Harness pipelines with IaCM stages | \`org_id\`, \`project_id\` |
| \`iacm_execution\` | IaCM pipeline execution history | \`org_id\`, \`project_id\` |

---

## Common Workflows

### 0. Scan the entire account (no args needed)

\`\`\`json
{}
\`\`\`
→ Returns workspace + pipeline counts per project across every org. This is the recommended starting point.

Filter to one org:
\`\`\`json
{ "org_id": "my-org" }
\`\`\`

Count only workspaces:
\`\`\`json
{ "include": "workspaces" }
\`\`\`

### 1. Discover all IACM-enabled projects (harness_iacm_list)

\`\`\`json
{ "resource_type": "harness_project", "filters": { "has_module": "IACM" } }
\`\`\`

### 2. How many workspaces do I have? (account-wide count)

\`\`\`json
{ "resource_type": "workspace_account" }
\`\`\`

### 3. List workspaces in a project

\`\`\`json
{ "resource_type": "workspace", "org_id": "my-org", "project_id": "my-project" }
\`\`\`

### 3. List IaCM pipelines in a project

\`\`\`json
{ "resource_type": "iacm_pipeline", "org_id": "my-org", "project_id": "my-project" }
\`\`\`
> \`module=iacm\` is injected automatically — no need to set it.

### 4. List all IaCM pipeline executions

\`\`\`json
{ "resource_type": "iacm_execution", "org_id": "my-org", "project_id": "my-project", "size": 25 }
\`\`\`

### 5. Filter executions by status

\`\`\`json
{
  "resource_type": "iacm_execution",
  "org_id": "my-org",
  "project_id": "my-project",
  "status": "Failed",
  "size": 25
}
\`\`\`

### 6. Filter executions by pipeline and time window

\`\`\`json
{
  "resource_type": "iacm_execution",
  "pipeline_id": "provision-prod-vpc",
  "start_time_ms": 1775260800000,
  "end_time_ms": 1775951999000
}
\`\`\`

### 7. Get full details for one execution

\`\`\`json
{
  "resource_type": "iacm_execution",
  "resource_id": "<planExecutionId>"
}
\`\`\`

### 8. List recent runs for a workspace

\`\`\`json
{
  "resource_type": "workspace_run",
  "workspace_id": "my-workspace",
  "size": 10
}
\`\`\`

### 9. Trigger a plan

\`\`\`json
{
  "workspace_id": "my-workspace",
  "type": "plan",
  "message": "Preview changes for upcoming release"
}
\`\`\`

### 10. List state-managed resources

\`\`\`json
{ "resource_type": "workspace_resource", "workspace_id": "my-workspace" }
\`\`\`

---

## Pagination

| API Family | Base | Default | Notes |
|-----------|------|---------|-------|
| IaCM workspace API | 1 | page=1 | \`workspace\`, \`workspace_account\`, \`workspace_run\`, etc. |
| Harness NG/pipeline API | 0 | page=0 | \`iacm_pipeline\`, \`iacm_execution\` |

The correct default is set automatically — you don't need to specify page unless paginating.

### Workspace endpoint quirk — known footgun

The IaCM workspace listing endpoint \`GET /iacm/api/orgs/{org}/projects/{project}/workspaces\` **silently caps each page at 30 items server-side regardless of the requested \`pageSize\`**, and returns a bare JSON array with no \`total\` / \`hasMore\` field. Naive callers that fetch only page 1 silently undercount any project with more than 30 workspaces.

The bundled tools (\`harness_iacm_scan\`, \`harness_iacm_feature_scan\`, \`harness_iacm_growth\`, \`harness_iacm_maturity_assessment\`) already paginate to exhaustion via the shared helper in \`src/utils/iacm-pagination.ts\`. Each scan output includes an \`_meta.workspaceCountMethod\` field (\`paginated-exhaustive\` for trustworthy counts) and a \`_meta.projectsHittingWorkspaceCap\` array listing projects where the 30-item cap was observed.

**If you build a new tool that lists workspaces, use \`listAllWorkspacesPaginated()\` from \`src/utils/iacm-pagination.ts\`. Do not write a fresh page-1-only fetch.**

---

## BVR canonical structure — enforced by the renderer

Every IaCM Business Value Review must follow the **identical section ordering and naming** so reports stay recognisable across customers and across agent sessions. The authoritative recipe is the **\`iacm_bvr\` MCP prompt** — invoke it first whenever you start a BVR. It returns the full instructions, chart data shapes, callout vocabulary, and frontmatter contract.

The fixed deliverable (same for **every customer** — only numbers and narrative change):

\`\`\`
Frontmatter + cover (4 hero tiles: workspaces, pipelines, OPA %, maturity)
Executive Summary — 5-tile scorecard, ::: success, ::: critical (plan-time blind spots)
1. Enterprise Footprint — org_footprint, Top 10 Projects bar, monthly_growth (+N/12mo chips)
   1.1 Workspace Status — bar chart + status table
   1.2 Provisioner sprawl — type bar, version-lines bar, exact-pin table
2. Maturity Assessment — radar (9 core dims), table, extended sprawl/registry rows
3. Feature Adoption — 4 gauges (Templates, Checkov, Cost, Registry), Feature|Adoption|Note table
   3.1 Module registry — bar chart (Harness private / other / public / none)
4. OPA Governance — opa_donut; policy-set|Purpose table when sets exist
5. Recommended Actions — priority_matrix + P1/P2 ::: action blocks (Effort · +pts)
6. Before & After — multi-row comparison table
Appendix — org # table, active project summary, methodology footnote
\`\`\`

**This is enforced, not advisory.** \`harness_iacm_bvr_validate\` checks H1 sections, required subsections (1.1, 1.2, 3.1), required chart kinds, ≥4 bar charts, and the feature-adoption table. Renderers **refuse to output** until validation passes. The error response lists the exact violations (missing sections, out-of-order sections, missing frontmatter fields, unknown \`:::\` directives) with line numbers and remediation hints. There is no way to silently produce a non-canonical BVR.

### Preflight tool — \`harness_iacm_bvr_validate\`

Call \`harness_iacm_bvr_validate\` with the markdown path **before** attempting to render. It returns the same structured result the gate uses, so you can fix issues iteratively without bouncing off the renderer's refusal.

### The escape hatch — \`bvr_template: "custom"\`

Two cases legitimately need to bypass canonical-structure enforcement:

1. **The user explicitly asks for non-standard content.** Examples: "add a Glossary section after the Appendix", "drop the Before & After comparison", "this is an internal report, not a customer BVR". In every case the **user's explicit request is the trigger** — never deviate pre-emptively.
2. **The document is intentionally not a BVR.** A quick markdown preview, a non-IaCM internal note rendered through the same theme.

To opt out, set the frontmatter field \`bvr_template: "custom"\`. The validator then skips the section-skeleton check but still enforces the frontmatter contract and the \`:::\` directive vocabulary. Both renderers also accept \`skip_validation: true\` as a parameter for purely ad-hoc previews.

### Closed set of \`:::\` directives

Only six directive types are recognised by the renderer's CSS. Anything else fails validation:

\`success\`, \`critical\`, \`warning\`, \`info\`, \`action\`, \`quote\`

This rule exists because past BVRs invented headings like "Where customer X stands on the maturity curve", "Path to RUN tier", "Strategic narrative for the call" — readable in isolation, but they broke recognition when comparing two customer BVRs side-by-side. Stay on the template; it is intentionally boring and that is its value.

---

## BVR ground-truth validation — mandatory before publishing customer-facing reports

Always run these checks **before** writing any markdown, generating any chart, or rendering any PDF that will go to a customer:

1. **Check \`_meta\` on every scan output.** \`harness_iacm_scan\`, \`harness_iacm_feature_scan\`, \`harness_iacm_growth\`, and \`harness_iacm_maturity_assessment\` all emit:
   - \`_meta.workspaceCountMethod\` — must be \`paginated-exhaustive\` for any number that goes into a customer report.
   - \`_meta.projectsHittingWorkspaceCap\` — projects where the server cap was observed; not a problem on its own (we paginated past it) but a signal that those projects have ≥30 workspaces.
   - \`_meta.unreachableProjectsForWorkspaces\` — projects whose workspace list could not be read; their workspace counts are \`0\` in the output, **not** "unknown" — flag them as such in the report.
2. **Reconcile to the dashboard.** The IaCM dashboard at \`/iacm/orgs?dashboard\` is authoritative. Sum workspaces across orgs from the scan output and compare to the dashboard total — if they disagree by more than **±5%**, **stop and reconcile** before continuing. Common causes: scan ran during high-velocity adoption (timing drift), or the dashboard filters out a status the scan doesn't.
3. **Suspect any project with workspaceCount equal to a round-number cap.** If multiple projects in the scan all return the same suspiciously round number (e.g. 30, 50, 100), the page cap was hit and historical scans may be undercounted. The current tools paginate past this; any agent-built one-off API call must as well.
4. **State the source of every top-line metric.** In any customer-facing BVR, include a methodology section (\"Appendix B\") naming the tool that produced each metric and its \`countMethod\`.
5. **Pipelines come from \`data.totalElements\` (NG API).** Pipeline counts use a fundamentally different mechanism than workspace counts — they are not subject to the same bug.

If any of (1)–(4) fails, **do not publish.** Report the discrepancy back to the user and ask for guidance.

---

## Execution Status Values

Valid values for \`status\` filter on \`iacm_execution\`:

\`Success\`, \`Failed\`, \`Running\`, \`Aborted\`, \`Expired\`, \`Paused\`, \`NotStarted\`, \`Queued\`, \`InputWaiting\`

For workspace runs: \`pending\`, \`queued\`, \`running\`, \`planned\`, \`applied\`, \`destroyed\`, \`errored\`, \`cancelled\`, \`skipped\`

---

## Auth

| Method | Env Var / Header | Notes |
|--------|-----------------|-------|
| PAT/SA token | \`HARNESS_API_KEY\` / \`X-Harness-Api-Key\` | Recommended |
| Bearer JWT | \`HARNESS_BEARER_TOKEN\` / \`X-Harness-Token\` | Browser session token |
| Cookie | \`HARNESS_HEADER_COOKIE\` / \`X-Harness-Cookie\` | Raw browser \`Cookie:\` header — last-resort fallback when no PAT or bearer is available |

Auth priority: PAT > Bearer > Cookie. Account ID is auto-extracted from PAT format \`pat.<accountId>.<tokenId>.<secret>\`; with Bearer or Cookie you must set \`HARNESS_ACCOUNT_ID\` (or \`X-Harness-Account\`) explicitly.

---

## Defaults

Set in \`.env\` to avoid specifying on every call:
\`\`\`
HARNESS_DEFAULT_ORG_ID=my-org
HARNESS_DEFAULT_PROJECT_ID=my-project
\`\`\`

---

## Tips

- **Don't know your org/project?** Call \`harness_iacm_scan\` with no args — it scans everything automatically.
- **Module filter** for \`iacm_pipeline\` is injected automatically — do not set it manually.
- **Executions** use POST under the hood — all filters go via top-level args (pipeline_id, status, start_time_ms, end_time_ms, search_term).
- **URL paste** — pass any Harness IaCM URL and org/project/workspace are auto-extracted.
- **Read-only mode** — set \`HARNESS_READ_ONLY=true\` to block \`harness_iacm_run\`.
- **Concurrency** — \`harness_iacm_scan\` queries projects in parallel (default 5 at a time, max 20).
`.trim();

export function registerGuideTool(server: McpServer): void {
  server.registerTool(
    "harness_iacm_guide",
    {
      description:
        "Return the complete Harness IaCM MCP agent guide — covers all tools, resource types " +
        "(workspace, iacm_pipeline, iacm_execution, workspace_run, etc.), common workflows, " +
        "pagination rules, execution status values, auth options, and defaults. " +
        "Call this at the start of every session.",
      inputSchema: {},
      annotations: {
        title: "IaCM Agent Guide",
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async () => ({
      content: [{ type: "text" as const, text: GUIDE }],
    }),
  );
}
