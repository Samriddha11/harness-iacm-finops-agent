import * as z from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Registry } from "../registry/index.js";
import type { HarnessClient } from "../client/harness-client.js";
import { jsonResult, errorResult } from "../utils/response-formatter.js";
import { isUserError, isUserFixableApiError, toMcpError } from "../utils/errors.js";
import { compactItems } from "../utils/compact.js";
import { applyUrlDefaults } from "../utils/url-parser.js";
import { asString, isRecord } from "../utils/type-guards.js";

export function registerListTool(server: McpServer, registry: Registry, client: HarnessClient): void {
  const allFilterNames = registry.getAllFilterFields().map((f) => f.name);
  const filtersDesc = allFilterNames.length > 0
    ? `Resource-specific filters. Available across all resource types: ${allFilterNames.join(", ")}. Call harness_iacm_describe for filters on a specific resource_type.`
    : "Resource-specific filters. Call harness_iacm_describe for available filters per resource_type.";

  server.registerTool(
    "harness_iacm_list",
    {
      description:
        "List Harness IaCM resources with optional filtering and pagination.\n\n" +
        "Supported resource_types:\n" +
        "  • harness_org          — all orgs in the account (no args needed)\n" +
        "  • harness_project      — projects, optionally filtered by org or has_module=IACM\n" +
        "  • workspace            — workspaces in a project (needs org_id + project_id)\n" +
        "  • workspace_account    — all workspaces in the account (no project needed)\n" +
        "  • workspace_run        — runs for a workspace (needs workspace_id)\n" +
        "  • workspace_resource   — state-managed Terraform resources (needs workspace_id)\n" +
        "  • workspace_variable   — workspace variables (needs workspace_id)\n" +
        "  • workspace_state      — state version history (needs workspace_id)\n" +
        "  • iacm_pipeline        — Harness pipelines with IaCM stages (needs org_id + project_id)\n" +
        "  • iacm_execution       — pipeline executions for IaCM runs (needs org_id + project_id)\n\n" +
        "Use harness_iacm_scan to automatically scan ALL orgs/projects without knowing them upfront.\n" +
        "Pass a Harness URL to auto-extract all identifiers.",
      inputSchema: z.object({
        resource_type: z
          .string()
          .describe(
            "IaCM resource type. One of: workspace, workspace_account, workspace_run, " +
            "workspace_resource, workspace_variable, workspace_state, iacm_pipeline, iacm_execution.",
          )
          .optional(),
        url: z.string().describe("Harness IaCM UI URL — auto-extracts org, project, and workspace").optional(),
        org_id: z.string().describe("Organization identifier (overrides HARNESS_DEFAULT_ORG_ID)").optional(),
        project_id: z.string().describe("Project identifier (overrides HARNESS_DEFAULT_PROJECT_ID)").optional(),
        workspace_id: z
          .string()
          .describe("Workspace identifier — required for workspace_run, workspace_resource, workspace_variable, workspace_state")
          .optional(),
        pipeline_id: z
          .string()
          .describe("Pipeline identifier — optional filter for iacm_execution")
          .optional(),
        page: z.number().describe("Page number. IaCM workspace API = 1-based; pipeline API = 0-based.").optional(),
        size: z.number().min(1).max(100).describe("Page size (1–100, default 20–25 depending on API)").default(25).optional(),
        search_term: z.string().describe("Filter results by name or keyword").optional(),
        status: z.string().describe("Filter by status (for iacm_execution: e.g. 'Success,Failed'; for workspace_run: e.g. 'errored')").optional(),
        start_time_ms: z.number().describe("Start of time window in epoch milliseconds (for iacm_execution)").optional(),
        end_time_ms: z.number().describe("End of time window in epoch milliseconds (for iacm_execution)").optional(),
        compact: z
          .boolean()
          .describe("Strip verbose metadata, keeping only essential fields (default true)")
          .default(true)
          .optional(),
        filters: z.record(z.string(), z.unknown()).describe(filtersDesc).optional(),
      }).passthrough(),
      annotations: {
        title: "List IaCM Resources",
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    async (args) => {
      try {
        const { filters, ...rest } = args;
        const input = applyUrlDefaults(rest as Record<string, unknown>, args.url);
        if (filters) Object.assign(input, filters);

        const resourceType = asString(input.resource_type);
        if (!resourceType) {
          return errorResult(
            "resource_type is required. Choose one of: harness_org, harness_project, " +
            "workspace, workspace_account, workspace_run, workspace_resource, " +
            "workspace_variable, workspace_state, iacm_pipeline, iacm_execution. " +
            "Or call harness_iacm_scan to auto-discover all projects. " +
            "Or supply a Harness IaCM URL to auto-detect the resource type.",
          );
        }

        // Inject module=iacm for pipeline API resources — prevents the agent needing to know this
        if (resourceType === "iacm_pipeline" && input.module === undefined) {
          input.module = "iacm";
        }

        // Enforce correct pagination base per resource type.
        // IACM workspace API: 1-based (page >= 1). Harness NG/pipeline API: 0-based (page >= 0).
        const def = registry.getResource(resourceType);
        const pageBase = def.paginationBase ?? 0;
        const currentPage = typeof input.page === "number" ? input.page : undefined;
        if (currentPage === undefined) {
          // Set sensible default based on the API's base
          input.page = pageBase === 1 ? 1 : 0;
        } else if (currentPage < pageBase) {
          input.page = pageBase;
        }

        const result = await registry.dispatch(client, resourceType, "list", input);

        if (args.compact !== false && isRecord(result)) {
          const items = result.items;
          if (Array.isArray(items)) {
            result.items = compactItems(items);
          }
        }

        return jsonResult(result);
      } catch (err) {
        if (isUserError(err)) return errorResult(err.message);
        if (isUserFixableApiError(err)) return errorResult(err.message);
        throw toMcpError(err);
      }
    },
  );
}
