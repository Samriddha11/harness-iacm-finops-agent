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
| \`harness_iacm_feature_scan\` | **BVR feature adoption scan** — detects Checkov, cost estimation, templates, private registry per pipeline/workspace |
| \`harness_iacm_opa_scan\` | **BVR OPA governance scan** — lists all OPA policies + policy sets, shows which IaCM pipelines have enforcement and which don't |
| \`harness_iacm_list\` | List any IaCM resource with filtering and pagination |
| \`harness_iacm_get\` | Get a single resource by ID |
| \`harness_iacm_run\` | Trigger a plan / apply / destroy run on a workspace |
| \`harness_iacm_describe\` | Discover resource types, fields, and operations (no API call) |
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
