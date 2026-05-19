import * as z from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HarnessClient } from "../client/harness-client.js";
import { jsonResult, errorResult } from "../utils/response-formatter.js";
import { toMcpError } from "../utils/errors.js";
import { createLogger } from "../utils/logger.js";
import { listAllWorkspacesPaginated } from "../utils/iacm-pagination.js";
import { aggregateWorkspaceInventory } from "../utils/workspace-inventory-aggregate.js";

const log = createLogger("iacm-workspace-inventory");

async function fetchAllIacmProjects(
  client: HarnessClient,
  orgId: string | undefined,
  projectId: string | undefined,
  signal?: AbortSignal,
): Promise<Array<{ identifier: string; orgIdentifier?: string }>> {
  const all: Array<{ identifier: string; orgIdentifier?: string }> = [];
  let page = 0;
  while (true) {
    const raw = await client.request<{
      data?: {
        content?: Array<{ project?: { identifier: string; orgIdentifier?: string } }>;
        totalPages?: number;
      };
    }>({
      path: "/ng/api/projects",
      params: {
        accountIdentifier: client.account,
        hasModule: "IACM",
        pageIndex: page,
        pageSize: 200,
      },
      signal,
    });
    const content = raw.data?.content ?? [];
    const projects = content
      .map((c) => c.project)
      .filter((p): p is { identifier: string; orgIdentifier?: string } => !!p);
    all.push(...projects);
    if (page + 1 >= (raw.data?.totalPages ?? 1) || projects.length === 0) break;
    page++;
  }
  let filtered = all;
  if (orgId) filtered = filtered.filter((p) => p.orgIdentifier === orgId);
  if (projectId) filtered = filtered.filter((p) => p.identifier === projectId);
  return filtered;
}

export function registerWorkspaceInventoryTool(server: McpServer, client: HarnessClient): void {
  server.registerTool(
    "harness_iacm_workspace_inventory",
    {
      description:
        "Aggregate IaCM workspace provisioner/version sprawl, lifecycle status distribution, " +
        "and module registry usage (Harness private, other private, public-only, none). " +
        "Designed for BVR — feeds maturity scoring and standardisation charts.",
      inputSchema: z.object({
        org_id: z.string().optional().describe("Limit to one org."),
        project_id: z.string().optional().describe("Limit to one project."),
        fetch_details: z
          .boolean()
          .optional()
          .default(false)
          .describe(
            "When true, GET each workspace for accurate provisioner_version pins (slower). " +
            "Default uses list API fields only.",
          ),
      }),
      annotations: {
        title: "IaCM Workspace Inventory (sprawl, status, registry)",
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    async (args, { signal }) => {
      try {
        log.info("Starting workspace inventory aggregation");
        const projects = await fetchAllIacmProjects(client, args.org_id, args.project_id, signal);
        if (projects.length === 0) return errorResult("No IaCM-enabled projects found.");

        const allWorkspaces: Array<Record<string, unknown>> = [];
        const projectsHittingWsCap: string[] = [];
        const unreachableForWs: string[] = [];

        await Promise.all(
          projects.map(async (proj) => {
            const org = proj.orgIdentifier ?? "default";
            const wsResult = await listAllWorkspacesPaginated<Record<string, unknown>>(
              client,
              org,
              proj.identifier,
              signal,
            );
            if (wsResult.capDetected) projectsHittingWsCap.push(`${org}/${proj.identifier}`);
            if (wsResult.unreachable) unreachableForWs.push(`${org}/${proj.identifier}`);

            if (args.fetch_details) {
              const concurrency = 12;
              for (let i = 0; i < wsResult.items.length; i += concurrency) {
                const batch = wsResult.items.slice(i, i + concurrency);
                const detailed = await Promise.all(
                  batch.map(async (ws) => {
                    const id = String(ws.identifier ?? "");
                    if (!id) return ws;
                    try {
                      const raw = await client.request<Record<string, unknown>>({
                        path: `/iacm/api/orgs/${encodeURIComponent(org)}/projects/${encodeURIComponent(proj.identifier)}/workspaces/${encodeURIComponent(id)}`,
                        params: { accountIdentifier: client.account, routingId: client.account },
                        signal,
                      });
                      const body =
                        (raw.workspace as Record<string, unknown> | undefined) ??
                        (raw.data as { workspace?: Record<string, unknown> } | undefined)?.workspace ??
                        raw;
                      return body && typeof body === "object" ? body : ws;
                    } catch {
                      return ws;
                    }
                  }),
                );
                allWorkspaces.push(...detailed);
              }
            } else {
              allWorkspaces.push(...wsResult.items);
            }
          }),
        );

        const inventory = aggregateWorkspaceInventory(allWorkspaces);

        return jsonResult({
          scannedAt: new Date().toISOString(),
          account: client.account,
          versionSource: args.fetch_details ? "workspace_get" : "workspace_list",
          ...inventory,
          _meta: {
            workspaceCountMethod: "paginated-exhaustive",
            projectsHittingWorkspaceCap: projectsHittingWsCap,
            unreachableProjectsForWorkspaces: unreachableForWs,
            guidance:
              "Provisioner versions from list API may show 'latest' until fetch_details=true. " +
              "Cross-validate workspace totals with the IaCM dashboard (±5%).",
          },
        });
      } catch (err) {
        throw toMcpError(err);
      }
    },
  );
}
