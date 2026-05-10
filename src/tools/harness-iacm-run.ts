import * as z from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Registry } from "../registry/index.js";
import type { HarnessClient } from "../client/harness-client.js";
import type { Config } from "../config.js";
import { jsonResult, errorResult } from "../utils/response-formatter.js";
import { isUserError, isUserFixableApiError, toMcpError } from "../utils/errors.js";

export function registerRunTool(
  server: McpServer,
  registry: Registry,
  client: HarnessClient,
  config: Config,
): void {
  server.registerTool(
    "harness_iacm_run",
    {
      description:
        "Trigger a Terraform/OpenTofu run (plan, apply, or destroy) on a Harness IaCM workspace. " +
        "Returns the created run object with its ID, status, and pipeline execution reference. " +
        "Blocked when HARNESS_READ_ONLY=true.",
      inputSchema: z.object({
        workspace_id: z
          .string()
          .describe("**Required.** The workspace identifier to trigger the run on"),
        type: z
          .enum(["plan", "apply", "destroy", "plan_and_apply"])
          .describe("Run type. Use 'plan' to preview changes, 'apply' to provision, 'destroy' to tear down, 'plan_and_apply' to do both in sequence.")
          .default("plan"),
        org_id: z
          .string()
          .describe("Organization identifier (defaults to HARNESS_DEFAULT_ORG_ID)")
          .optional(),
        project_id: z
          .string()
          .describe("Project identifier (defaults to HARNESS_DEFAULT_PROJECT_ID)")
          .optional(),
        message: z
          .string()
          .describe("Optional human-readable message describing why this run was triggered")
          .optional(),
      }),
      annotations: {
        title: "Trigger IaCM Run",
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: true,
      },
    },
    async (args) => {
      try {
        if (config.HARNESS_READ_ONLY) {
          return errorResult(
            "Read-only mode is enabled (HARNESS_READ_ONLY=true). Triggering runs is not allowed.",
          );
        }

        const input: Record<string, unknown> = {
          resource_type: "workspace_run",
          org_id: args.org_id,
          project_id: args.project_id,
          workspace_id: args.workspace_id,
          type: args.type,
          message: args.message,
        };

        const result = await registry.dispatch(client, "workspace_run", "create", input);
        return jsonResult(result);
      } catch (err) {
        if (isUserError(err)) return errorResult(err.message);
        if (isUserFixableApiError(err)) return errorResult(err.message);
        throw toMcpError(err);
      }
    },
  );
}
