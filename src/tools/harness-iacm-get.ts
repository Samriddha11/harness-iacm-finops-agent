import * as z from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Registry } from "../registry/index.js";
import type { HarnessClient } from "../client/harness-client.js";
import { jsonResult, errorResult } from "../utils/response-formatter.js";
import { isUserError, isUserFixableApiError, toMcpError } from "../utils/errors.js";
import { applyUrlDefaults } from "../utils/url-parser.js";
import { asString } from "../utils/type-guards.js";

export function registerGetTool(server: McpServer, registry: Registry, client: HarnessClient): void {
  server.registerTool(
    "harness_iacm_get",
    {
      description:
        "Get a single Harness IaCM resource by ID. " +
        "Supported resource types: workspace, workspace_run, workspace_variable, workspace_state. " +
        "Pass a Harness UI URL to auto-extract all identifiers.",
      inputSchema: z.object({
        resource_type: z
          .string()
          .describe(
            "IaCM resource type. One of: workspace, workspace_run, workspace_variable, workspace_state. " +
            "Auto-detected from url.",
          )
          .optional(),
        resource_id: z
          .string()
          .describe("Primary resource identifier (workspace_id, run_id, variable_id). Auto-detected from url.")
          .optional(),
        url: z.string().describe("Harness IaCM UI URL — auto-extracts all identifiers").optional(),
        org_id: z.string().describe("Organization identifier (overrides default)").optional(),
        project_id: z.string().describe("Project identifier (overrides default)").optional(),
        workspace_id: z
          .string()
          .describe("Workspace identifier — required for run, variable, and state resources")
          .optional(),
        params: z
          .record(z.string(), z.unknown())
          .describe("Additional identifiers. Call harness_iacm_describe for fields per resource_type.")
          .optional(),
      }).passthrough(),
      annotations: {
        title: "Get IaCM Resource",
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    async (args) => {
      try {
        const { params, ...rest } = args;
        const input = applyUrlDefaults(rest as Record<string, unknown>, args.url);
        if (params) Object.assign(input, params);

        const resourceType = asString(input.resource_type);
        if (!resourceType) {
          return errorResult(
            "resource_type is required. Provide one of: workspace, workspace_run, " +
            "workspace_variable, workspace_state.",
          );
        }

        const resourceId = asString(input.resource_id);
        const def = registry.getResource(resourceType);
        const primaryField = def.identifierFields[0];
        if (primaryField && resourceId && !input[primaryField]) {
          input[primaryField] = resourceId;
        }

        const result = await registry.dispatch(client, resourceType, "get", input);
        return jsonResult(result);
      } catch (err) {
        if (isUserError(err)) return errorResult(err.message);
        if (isUserFixableApiError(err)) return errorResult(err.message);
        throw toMcpError(err);
      }
    },
  );
}
