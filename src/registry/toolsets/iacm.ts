import type { ToolsetDefinition } from "../types.js";
import {
  workspaceListExtract,
  workspaceGetExtract,
  runListExtract,
  runGetExtract,
  resourceListExtract,
  variableListExtract,
  stateExtract,
} from "../extractors.js";

/** Standard NG pipeline page extract: { data: { content, totalElements, pageIndex } } */
const pipelinePageExtract = (raw: unknown): { items: unknown[]; total: number; page: number } => {
  const r = raw as { data?: { content?: unknown[]; totalElements?: number; pageIndex?: number } };
  return {
    items: r.data?.content ?? [],
    total: r.data?.totalElements ?? 0,
    page: r.data?.pageIndex ?? 0,
  };
};

/** NG single-resource extract: { status, data: { ... } } → data */
const ngExtract = (raw: unknown): unknown => {
  const r = raw as { data?: unknown };
  return r.data ?? raw;
};

export const iacmToolset: ToolsetDefinition = {
  name: "iacm",
  displayName: "IaCM (Infrastructure as Code Management)",
  description:
    "Manage Terraform and OpenTofu workspaces, runs, state, variables, resources, " +
    "and pipeline executions via Harness IaCM.",
  resources: [

    // ── Organizations ────────────────────────────────────────────────────────
    {
      resourceType: "harness_org",
      displayName: "Harness Organization",
      description:
        "List all organizations in the Harness account. Use this to discover orgs before " +
        "drilling into projects and workspaces.",
      toolset: "iacm",
      scope: "account",
      paginationBase: 0,
      identifierFields: ["org_id"],
      listFilterFields: [
        { name: "search_term", description: "Filter by org name or identifier" },
        { name: "page", description: "Page number (0-based)", type: "number" },
        { name: "size", description: "Page size (default 100)", type: "number" },
      ],
      diagnosticHint:
        "Returns all orgs in the account. Use org identifiers from this list when querying " +
        "harness_project or workspace resources.",
      operations: {
        list: {
          method: "GET",
          path: "/ng/api/organizations",
          queryParams: {
            search_term: "searchTerm",
            page: "pageIndex",
            size: "pageSize",
          },
          responseExtractor: (raw) => {
            const r = raw as { data?: { content?: Array<{ organization?: unknown }>; totalElements?: number } };
            const items = (r.data?.content ?? []).map((c) => c.organization ?? c);
            return { items, total: r.data?.totalElements ?? items.length };
          },
          description: "List all Harness organizations in the account",
        },
        get: {
          method: "GET",
          path: "/ng/api/organizations/{identifier}",
          pathParams: { org_id: "identifier" },
          responseExtractor: (raw) => {
            const r = raw as { data?: { organization?: unknown } };
            return r.data?.organization ?? raw;
          },
          description: "Get a single organization by identifier",
        },
      },
    },

    // ── Projects ──────────────────────────────────────────────────────────────
    {
      resourceType: "harness_project",
      displayName: "Harness Project",
      description:
        "List Harness projects, optionally filtered to those with the IaCM module enabled. " +
        "Use has_module=IACM to find only projects that contain IaCM workspaces or pipelines.",
      toolset: "iacm",
      scope: "account",
      paginationBase: 0,
      identifierFields: ["project_id"],
      listFilterFields: [
        { name: "org_id", description: "Filter to a specific org (optional — omit to list across all orgs)" },
        { name: "has_module", description: "Filter to projects with this module enabled. Use 'IACM' to find IaCM projects.", enum: ["IACM", "CD", "CI", "CE", "CF", "STO", "CHAOS"] },
        { name: "search_term", description: "Filter by project name or identifier" },
        { name: "page", description: "Page number (0-based)", type: "number" },
        { name: "size", description: "Page size (default 100)", type: "number" },
      ],
      diagnosticHint:
        "Pass has_module=IACM to get only IACM-enabled projects across all orgs — " +
        "no need to know org names upfront. Use org_id to scope to a single org.",
      operations: {
        list: {
          method: "GET",
          path: "/ng/api/projects",
          queryParams: {
            org_id: "orgIdentifier",
            has_module: "hasModule",
            search_term: "searchTerm",
            page: "pageIndex",
            size: "pageSize",
          },
          responseExtractor: (raw) => {
            const r = raw as { data?: { content?: Array<{ project?: unknown }>; totalElements?: number } };
            const items = (r.data?.content ?? []).map((c) => c.project ?? c);
            return { items, total: r.data?.totalElements ?? items.length };
          },
          description: "List Harness projects, optionally filtered by org or module",
        },
        get: {
          method: "GET",
          path: "/ng/api/projects/{identifier}",
          pathParams: { project_id: "identifier" },
          queryParams: { org_id: "orgIdentifier" },
          responseExtractor: (raw) => {
            const r = raw as { data?: { project?: unknown } };
            return r.data?.project ?? raw;
          },
          description: "Get a single project by identifier",
        },
      },
    },

    // ── Debug: raw workspace response (passthrough — shows exact API shape) ───
    {
      resourceType: "workspace_raw",
      displayName: "IaCM Workspace (raw API response)",
      description: "Returns the raw, unmodified API response for the workspace list endpoint — use this to inspect the actual response shape when workspace counts look wrong.",
      toolset: "iacm",
      scope: "project",
      paginationBase: 1,
      identifierFields: ["workspace_id"],
      listFilterFields: [
        { name: "page", description: "Page number (1-based)", type: "number" },
        { name: "size", description: "Page size", type: "number" },
      ],
      diagnosticHint: "Use this to debug response format issues.",
      operations: {
        list: {
          method: "GET",
          path: "/iacm/api/orgs/{org}/projects/{project}/workspaces",
          pathParams: { org_id: "org", project_id: "project" },
          queryParams: { page: "page", size: "pageSize" },
          responseExtractor: (raw) => raw,
          description: "Raw workspace list response",
        },
      },
    },

    // ── Account-level workspace listing ──────────────────────────────────────
    {
      resourceType: "workspace_account",
      displayName: "IaCM Workspaces (Account-wide)",
      description:
        "List all IaCM workspaces across the entire account — no org or project required. " +
        "Use this for a quick count and overview before drilling into a specific project.",
      toolset: "iacm",
      scope: "account",
      paginationBase: 1,
      identifierFields: ["workspace_id"],
      listFilterFields: [
        { name: "search_term", description: "Filter by workspace name or identifier" },
        { name: "org_id", description: "Narrow to a specific org (optional)" },
        { name: "project_id", description: "Narrow to a specific project (optional)" },
        { name: "page", description: "Page number (1-based)", type: "number" },
        { name: "size", description: "Page size (default 100)", type: "number" },
      ],
      diagnosticHint:
        "No org or project needed. If you get 404, fall back to resource_type='workspace' " +
        "with an explicit org_id + project_id.",
      operations: {
        list: {
          method: "GET",
          path: "/iacm/api/workspaces",
          queryParams: {
            search_term: "searchTerm",
            org_id: "orgIdentifier",
            project_id: "projectIdentifier",
            page: "page",
            size: "pageSize",
          },
          responseExtractor: workspaceListExtract,
          description: "List all IaCM workspaces across the account",
        },
      },
    },

    // ── Project-scoped workspace listing ─────────────────────────────────────
    {
      resourceType: "workspace",
      displayName: "IaCM Workspace",
      description:
        "A Harness IaCM workspace — a Terraform/OpenTofu workspace with its provider connector, " +
        "repository configuration, provisioner type, and run history.",
      toolset: "iacm",
      scope: "project",
      paginationBase: 1,
      identifierFields: ["workspace_id"],
      listFilterFields: [
        { name: "search_term", description: "Filter workspaces by name or identifier" },
        { name: "page", description: "Page number (1-based, starts at 1)", type: "number" },
        { name: "size", description: "Page size (default 20)", type: "number" },
        { name: "sort", description: "Sort field (e.g. name, created)" },
        { name: "order", description: "Sort order", enum: ["asc", "desc"] },
      ],
      deepLinkTemplate:
        "/ng/account/{accountId}/iacm/orgs/{orgIdentifier}/projects/{projectIdentifier}/workspaces/{workspace_id}",
      diagnosticHint:
        "Requires org_id + project_id. IACM workspace API uses 1-based pagination (page=1, not 0). " +
        "If the project is unknown, use resource_type='workspace_account' first.",
      operations: {
        list: {
          method: "GET",
          path: "/iacm/api/orgs/{org}/projects/{project}/workspaces",
          pathParams: { org_id: "org", project_id: "project" },
          queryParams: {
            search_term: "searchTerm",
            page: "page",
            size: "pageSize",
            sort: "sort",
            order: "order",
          },
          responseExtractor: workspaceListExtract,
          description: "List IaCM workspaces in a project",
        },
        get: {
          method: "GET",
          path: "/iacm/api/orgs/{org}/projects/{project}/workspaces/{workspace}",
          pathParams: { org_id: "org", project_id: "project", workspace_id: "workspace" },
          responseExtractor: workspaceGetExtract,
          description: "Get details for a single workspace",
        },
      },
    },

    // ── IaCM Pipelines ────────────────────────────────────────────────────────
    {
      resourceType: "iacm_pipeline",
      displayName: "IaCM Pipeline",
      description:
        "Harness pipeline that contains an IaCM stage (Terraform/OpenTofu provision or destroy). " +
        "Automatically filtered to module=iacm — no need to specify the module.",
      toolset: "iacm",
      scope: "project",
      paginationBase: 0,
      identifierFields: ["pipeline_id"],
      listFilterFields: [
        { name: "search_term", description: "Filter by pipeline name or identifier" },
        { name: "page", description: "Page number (0-based)", type: "number" },
        { name: "size", description: "Page size (default 25)", type: "number" },
        { name: "sort", description: "Sort field", enum: ["name", "lastUpdatedAt", "createdAt"] },
        { name: "order", description: "Sort order", enum: ["ASC", "DESC"] },
      ],
      deepLinkTemplate:
        "/ng/account/{accountId}/iacm/orgs/{orgIdentifier}/projects/{projectIdentifier}/pipelines/{pipelineIdentifier}/executions",
      diagnosticHint:
        "Requires org_id + project_id. The module=iacm filter is applied automatically. " +
        "Uses 0-based pagination (Harness NG API convention).",
      operations: {
        list: {
          method: "POST",
          path: "/pipeline/api/pipelines/list",
          queryParams: {
            page: "page",
            size: "size",
            sort: "sort",
            order: "order",
            module: "module",
            search_term: "searchTerm",
          },
          bodyBuilder: (input) => ({
            filterType: "PipelineSetup",
            ...(input.search_term ? { pipelineName: input.search_term } : {}),
          }),
          responseExtractor: pipelinePageExtract,
          description: "List Harness pipelines that use IaCM stages",
        },
        get: {
          method: "GET",
          path: "/pipeline/api/pipelines/{pipelineIdentifier}",
          pathParams: { pipeline_id: "pipelineIdentifier" },
          responseExtractor: ngExtract,
          description: "Get a single IaCM pipeline by identifier",
        },
      },
    },

    // ── IaCM Pipeline Executions ──────────────────────────────────────────────
    {
      resourceType: "iacm_execution",
      displayName: "IaCM Pipeline Execution",
      description:
        "A Harness pipeline execution for an IaCM pipeline — includes run status, duration, " +
        "triggered-by, workspace context, plan/apply outcome, and stage-level breakdown. " +
        "Automatically filtered to moduleType=IACM.",
      toolset: "iacm",
      scope: "project",
      paginationBase: 0,
      identifierFields: ["execution_id"],
      listFilterFields: [
        {
          name: "pipeline_id",
          description: "Filter to a specific pipeline identifier",
        },
        {
          name: "status",
          description: "Filter by execution status (comma-separated for multiple)",
          enum: ["Success", "Failed", "Running", "Aborted", "Expired", "Paused", "NotStarted", "Suspended", "Queued", "AsyncWaiting", "TaskWaiting", "TimedWaiting", "Discontinuing", "AbortedByFreeze", "InputWaiting"],
        },
        {
          name: "start_time_ms",
          description: "Start of time window (epoch milliseconds)",
          type: "number",
        },
        {
          name: "end_time_ms",
          description: "End of time window (epoch milliseconds)",
          type: "number",
        },
        { name: "page", description: "Page number (0-based)", type: "number" },
        { name: "size", description: "Page size (default 25)", type: "number" },
        {
          name: "branch",
          description: "Filter to a specific Git branch",
        },
        {
          name: "search_term",
          description: "Search by pipeline name or run identifier",
        },
      ],
      deepLinkTemplate:
        "/ng/account/{accountId}/iacm/orgs/{orgIdentifier}/projects/{projectIdentifier}/pipelines/{pipeline_id}/executions/{execution_id}/pipeline",
      diagnosticHint:
        "Uses POST body for filters. moduleType=IACM is injected automatically. " +
        "Use pipeline_id to scope to one pipeline, status to filter by outcome, " +
        "and start_time_ms/end_time_ms for a time window.",
      operations: {
        list: {
          method: "POST",
          path: "/pipeline/api/pipelines/execution/summary",
          queryParams: {
            page: "page",
            size: "size",
          },
          bodyBuilder: (input) => {
            const body: Record<string, unknown> = {
              filterType: "PipelineExecution",
              moduleType: "IACM",
            };
            if (input.pipeline_id) {
              body.pipelineIdentifiers = [input.pipeline_id];
            }
            if (input.status) {
              const statuses = typeof input.status === "string"
                ? input.status.split(",").map((s: string) => s.trim())
                : [input.status];
              body.status = statuses;
            }
            if (input.branch) {
              body.branch = input.branch;
            }
            if (input.search_term) {
              body.pipelineName = input.search_term;
            }
            if (input.start_time_ms || input.end_time_ms) {
              body.timeRange = {
                ...(input.start_time_ms ? { startTime: input.start_time_ms } : {}),
                ...(input.end_time_ms ? { endTime: input.end_time_ms } : {}),
              };
            }
            return body;
          },
          responseExtractor: pipelinePageExtract,
          description:
            "List IaCM pipeline executions with optional pipeline, status, time range, and branch filters",
        },
        get: {
          method: "GET",
          path: "/pipeline/api/pipelines/execution/{planExecutionId}",
          pathParams: { execution_id: "planExecutionId" },
          responseExtractor: ngExtract,
          description:
            "Get full detail for a single execution by its planExecutionId — includes " +
            "stage graph, node execution status, IaCM plan output, and logs reference",
        },
      },
    },

    // ── Workspace Runs ────────────────────────────────────────────────────────
    {
      resourceType: "workspace_run",
      displayName: "IaCM Workspace Run",
      description:
        "A Terraform/OpenTofu execution run — plan, apply, or destroy — associated with a workspace. " +
        "Includes run type, status, created/updated timestamps, and pipeline execution reference.",
      toolset: "iacm",
      scope: "project",
      paginationBase: 1,
      identifierFields: ["run_id"],
      listFilterFields: [
        {
          name: "workspace_id",
          description: "**Required.** The workspace identifier to list runs for",
        },
        {
          name: "status",
          description: "Filter by run status",
          enum: ["pending", "queued", "running", "planned", "applied", "destroyed", "errored", "cancelled", "skipped"],
        },
        { name: "type", description: "Filter by run type", enum: ["plan", "apply", "destroy", "plan_and_apply"] },
        { name: "page", description: "Page number (1-based)", type: "number" },
        { name: "size", description: "Page size (default 20)", type: "number" },
      ],
      deepLinkTemplate:
        "/ng/account/{accountId}/iacm/orgs/{orgIdentifier}/projects/{projectIdentifier}/workspaces/{workspace_id}/runs/{run_id}",
      diagnosticHint:
        "workspace_id is required. Get it from harness_iacm_list(resource_type='workspace'). " +
        "Use status and type filters to narrow results.",
      operations: {
        list: {
          method: "GET",
          path: "/iacm/api/orgs/{org}/projects/{project}/workspaces/{workspace}/runs",
          pathParams: { org_id: "org", project_id: "project", workspace_id: "workspace" },
          queryParams: {
            status: "status",
            type: "type",
            page: "page",
            size: "pageSize",
          },
          responseExtractor: runListExtract,
          description: "List all runs for a workspace",
        },
        get: {
          method: "GET",
          path: "/iacm/api/orgs/{org}/projects/{project}/workspaces/{workspace}/runs/{run}",
          pathParams: {
            org_id: "org",
            project_id: "project",
            workspace_id: "workspace",
            run_id: "run",
          },
          responseExtractor: runGetExtract,
          description: "Get details for a single run including logs and plan output",
        },
        create: {
          method: "POST",
          path: "/iacm/api/orgs/{org}/projects/{project}/workspaces/{workspace}/runs",
          pathParams: { org_id: "org", project_id: "project", workspace_id: "workspace" },
          bodyBuilder: (input) => ({
            type: input.type ?? "plan",
            ...(input.message ? { message: input.message } : {}),
            ...(input.variables ? { variables: input.variables } : {}),
          }),
          bodySchema: {
            description: "Trigger a new IaCM run (plan / apply / destroy)",
            fields: [
              {
                name: "type",
                type: "string",
                required: true,
                description: "Run type: plan, apply, destroy, or plan_and_apply",
                enum: ["plan", "apply", "destroy", "plan_and_apply"],
              },
              {
                name: "message",
                type: "string",
                required: false,
                description: "Optional human-readable message describing why this run was triggered",
              },
            ],
          },
          responseExtractor: runGetExtract,
          description: "Trigger a new run (plan / apply / destroy) on a workspace",
        },
      },
    },

    // ── Workspace State Resources ─────────────────────────────────────────────
    {
      resourceType: "workspace_resource",
      displayName: "IaCM Workspace State Resource",
      description:
        "A Terraform/OpenTofu resource tracked in the workspace state file — includes resource type, " +
        "name, provider, attributes, and last-known state.",
      toolset: "iacm",
      scope: "project",
      paginationBase: 1,
      identifierFields: ["workspace_id"],
      listFilterFields: [
        {
          name: "workspace_id",
          description: "**Required.** The workspace identifier to list state resources for",
        },
        {
          name: "resource_type",
          description: "Filter by Terraform resource type (e.g. aws_instance)",
        },
        { name: "page", description: "Page number (1-based)", type: "number" },
        { name: "size", description: "Page size (default 20)", type: "number" },
      ],
      diagnosticHint:
        "workspace_id is required. Resources are only available after at least one successful apply.",
      operations: {
        list: {
          method: "GET",
          path: "/iacm/api/orgs/{org}/projects/{project}/workspaces/{workspace}/resources",
          pathParams: { org_id: "org", project_id: "project", workspace_id: "workspace" },
          queryParams: {
            resource_type: "resourceType",
            page: "page",
            size: "pageSize",
          },
          responseExtractor: resourceListExtract,
          description: "List Terraform/OpenTofu resources from the workspace state",
        },
      },
    },

    // ── Workspace Variables ───────────────────────────────────────────────────
    {
      resourceType: "workspace_variable",
      displayName: "IaCM Workspace Variable",
      description:
        "A workspace variable — either a Terraform variable (var.*) or an environment variable. " +
        "Sensitive values are redacted in API responses.",
      toolset: "iacm",
      scope: "project",
      paginationBase: 1,
      identifierFields: ["variable_id"],
      listFilterFields: [
        {
          name: "workspace_id",
          description: "**Required.** The workspace identifier to list variables for",
        },
        {
          name: "category",
          description: "Filter by variable category",
          enum: ["terraform", "env"],
        },
      ],
      diagnosticHint:
        "workspace_id is required. Sensitive variable values are always redacted.",
      operations: {
        list: {
          method: "GET",
          path: "/iacm/api/orgs/{org}/projects/{project}/workspaces/{workspace}/variables",
          pathParams: { org_id: "org", project_id: "project", workspace_id: "workspace" },
          queryParams: {
            category: "category",
          },
          responseExtractor: variableListExtract,
          description: "List all variables for a workspace",
        },
        get: {
          method: "GET",
          path: "/iacm/api/orgs/{org}/projects/{project}/workspaces/{workspace}/variables/{variable}",
          pathParams: {
            org_id: "org",
            project_id: "project",
            workspace_id: "workspace",
            variable_id: "variable",
          },
          responseExtractor: (raw) => raw,
          description: "Get a single variable by ID",
        },
      },
    },

    // ── Workspace State ───────────────────────────────────────────────────────
    {
      resourceType: "workspace_state",
      displayName: "IaCM Workspace State",
      description:
        "The current Terraform/OpenTofu state for a workspace — includes state version, " +
        "serial number, and the full list of managed resources.",
      toolset: "iacm",
      scope: "project",
      paginationBase: 1,
      identifierFields: ["workspace_id"],
      listFilterFields: [
        {
          name: "workspace_id",
          description: "**Required.** The workspace identifier to retrieve state for",
        },
      ],
      diagnosticHint:
        "workspace_id is required. If state is empty, the workspace has not been applied yet.",
      operations: {
        get: {
          method: "GET",
          path: "/iacm/api/orgs/{org}/projects/{project}/workspaces/{workspace}/state",
          pathParams: { org_id: "org", project_id: "project", workspace_id: "workspace" },
          responseExtractor: stateExtract,
          description: "Get the current state for a workspace",
        },
        list: {
          method: "GET",
          path: "/iacm/api/orgs/{org}/projects/{project}/workspaces/{workspace}/state/versions",
          pathParams: { org_id: "org", project_id: "project", workspace_id: "workspace" },
          queryParams: {
            page: "page",
            size: "pageSize",
          },
          responseExtractor: (raw) => {
            const r = raw as Record<string, unknown>;
            const versions = r.versions ?? (Array.isArray(raw) ? raw : []);
            const items = Array.isArray(versions) ? versions : [];
            return { items, total: items.length };
          },
          description: "List state version history for a workspace",
        },
      },
    },
  ],
};
