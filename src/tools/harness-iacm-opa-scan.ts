import * as z from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HarnessClient } from "../client/harness-client.js";
import { jsonResult, errorResult } from "../utils/response-formatter.js";
import { toMcpError } from "../utils/errors.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("iacm-opa-scan");

// ── API types ──────────────────────────────────────────────────────────────

interface OpaPolicy {
  identifier: string;
  name: string;
  description?: string;
  enabled?: boolean;
  created?: number;
  updated?: number;
  orgIdentifier?: string;
  projectIdentifier?: string;
}

interface PolicySetPolicy {
  identifier: string;
  severity?: string;
}

interface PolicySet {
  identifier: string;
  name: string;
  description?: string;
  enabled?: boolean;
  entityType?: string;
  action?: string;
  policies?: PolicySetPolicy[];
  orgIdentifier?: string;
  projectIdentifier?: string;
  created?: number;
  updated?: number;
}

interface ProjectItem {
  identifier: string;
  name: string;
  orgIdentifier?: string;
}

interface PipelineItem {
  identifier: string;
  name: string;
}

// ── API helpers ────────────────────────────────────────────────────────────

/** Fetch all items from a paginated PM (Policy Management) API endpoint. */
async function fetchAllPm<T>(
  client: HarnessClient,
  path: string,
  extraParams: Record<string, string | number> = {},
  signal: AbortSignal,
): Promise<T[]> {
  const all: T[] = [];
  let page = 0;
  const perPage = 100;
  while (true) {
    const raw = await client.request<T[] | { data?: T[] } | unknown>({
      path,
      params: {
        accountIdentifier: client.account,
        per_page: perPage,
        page,
        ...extraParams,
      },
      signal,
    });
    // PM API returns a bare array
    const items: T[] = Array.isArray(raw)
      ? (raw as T[])
      : ((raw as { data?: T[] }).data ?? []);
    all.push(...items);
    if (items.length < perPage) break;
    page++;
  }
  return all;
}

async function fetchAllIacmProjects(
  client: HarnessClient,
  orgFilter: string | undefined,
  signal: AbortSignal,
): Promise<ProjectItem[]> {
  const all: ProjectItem[] = [];
  let page = 0;
  while (true) {
    const raw = await client.request<{
      data?: { content?: Array<{ project?: ProjectItem }>; totalPages?: number };
    }>({
      path: "/ng/api/projects",
      params: {
        accountIdentifier: client.account,
        hasModule: "IACM",
        pageIndex: page,
        pageSize: 200,
        ...(orgFilter ? { orgIdentifier: orgFilter } : {}),
      },
      signal,
    });
    const content = raw.data?.content ?? [];
    const items = content.map((c) => c.project).filter((p): p is ProjectItem => !!p);
    all.push(...items);
    if (page + 1 >= (raw.data?.totalPages ?? 1) || items.length === 0) break;
    page++;
  }
  return all;
}

async function fetchPipelinesForProject(
  client: HarnessClient,
  org: string,
  project: string,
  signal: AbortSignal,
): Promise<PipelineItem[]> {
  try {
    const raw = await client.request<{
      data?: { content?: PipelineItem[]; totalPages?: number };
    }>({
      method: "POST",
      path: "/pipeline/api/pipelines/list",
      params: {
        accountIdentifier: client.account,
        orgIdentifier: org,
        projectIdentifier: project,
        module: "iacm",
        size: 200,
        page: 0,
      },
      body: { filterType: "PipelineSetup" },
      signal,
    });
    return raw.data?.content ?? [];
  } catch {
    return [];
  }
}

// ── Scope matching ─────────────────────────────────────────────────────────

/**
 * A policy set covers a pipeline if it matches the pipeline's org+project scope.
 *
 * Harness OPA scope rules:
 *   - No org, no project    → account-level → covers EVERYTHING
 *   - Org set, no project   → org-level     → covers all pipelines in that org
 *   - Org + project set     → project-level → covers all pipelines in that project only
 */
function policySetCovers(
  ps: PolicySet,
  pipelineOrg: string,
  pipelineProject: string,
): boolean {
  if (!ps.enabled) return false;

  const psOrg = ps.orgIdentifier;
  const psProject = ps.projectIdentifier;

  // Account-level
  if (!psOrg && !psProject) return true;
  // Org-level
  if (psOrg && !psProject && psOrg === pipelineOrg) return true;
  // Project-level
  if (psOrg && psProject && psOrg === pipelineOrg && psProject === pipelineProject) return true;

  return false;
}

// ── Tool registration ──────────────────────────────────────────────────────

export function registerOpaScanTool(server: McpServer, client: HarnessClient): void {
  server.registerTool(
    "harness_iacm_opa_scan",
    {
      description:
        "Scan all OPA (Open Policy Agent) policies and policy sets in the Harness account, " +
        "then cross-reference with IaCM pipelines to show which pipelines have OPA governance " +
        "enforced and which do not. " +
        "Use this for BVR — shows total policy count, enabled vs disabled policy sets, " +
        "and per-pipeline OPA adoption with exact pipeline attribution.",
      inputSchema: z.object({
        org_id: z
          .string()
          .describe("Limit to a single org (optional — omit to scan all orgs).")
          .optional(),
        project_id: z
          .string()
          .describe("Limit to a single project (optional — omit to scan all projects).")
          .optional(),
        entity_types: z
          .string()
          .describe(
            "Comma-separated entity types to check policy sets for. " +
            "Default: 'PIPELINE,WORKSPACE'. Other values: CONNECTOR, SECRET, SERVICE, ENVIRONMENT.",
          )
          .default("PIPELINE,WORKSPACE")
          .optional(),
      }),
      annotations: {
        title: "IaCM OPA Policy Adoption Scan (BVR)",
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    async (args, { signal }) => {
      try {
        const entityTypeFilter = new Set(
          (args.entity_types ?? "PIPELINE,WORKSPACE")
            .split(",")
            .map((s) => s.trim().toUpperCase()),
        );

        log.info("Starting OPA scan", { entityTypeFilter: [...entityTypeFilter] });

        // ── Step 1: Fetch all OPA policies ────────────────────────────────
        let allPolicies: OpaPolicy[] = [];
        try {
          allPolicies = await fetchAllPm<OpaPolicy>(
            client,
            "/pm/api/v1/policies",
            {},
            signal,
          );
          log.info(`Found ${allPolicies.length} OPA policies`);
        } catch (err) {
          log.warn("Could not fetch policies", { error: String(err) });
        }

        // ── Step 2: Fetch all policy sets ─────────────────────────────────
        let allPolicySets: PolicySet[] = [];
        try {
          allPolicySets = await fetchAllPm<PolicySet>(
            client,
            "/pm/api/v1/policysets",
            {},
            signal,
          );
          log.info(`Found ${allPolicySets.length} policy sets`);
        } catch (err) {
          log.warn("Could not fetch policy sets", { error: String(err) });
        }

        // Filter to relevant entity types
        const relevantPolicySets = allPolicySets.filter(
          (ps) => !ps.entityType || entityTypeFilter.has((ps.entityType ?? "").toUpperCase()),
        );

        const pipelinePolicySets = relevantPolicySets.filter(
          (ps) => !ps.entityType || ps.entityType.toUpperCase() === "PIPELINE",
        );
        const workspacePolicySets = relevantPolicySets.filter(
          (ps) => ps.entityType?.toUpperCase() === "WORKSPACE",
        );

        // ── Step 3: Discover IaCM projects and pipelines ───────────────────
        let projects = await fetchAllIacmProjects(client, args.org_id, signal);
        if (args.project_id) {
          projects = projects.filter((p) => p.identifier === args.project_id);
        }

        const pipelineWithOrg: Array<{
          org: string; project: string; projectName: string;
          pipelineId: string; pipelineName: string;
        }> = [];

        await Promise.all(
          projects.map(async (proj) => {
            const org = proj.orgIdentifier ?? "default";
            const pipelines = await fetchPipelinesForProject(client, org, proj.identifier, signal);
            for (const p of pipelines) {
              pipelineWithOrg.push({
                org,
                project: proj.identifier,
                projectName: proj.name,
                pipelineId: p.identifier,
                pipelineName: p.name,
              });
            }
          }),
        );

        // ── Step 4: Cross-reference pipelines with policy sets ─────────────
        const pipelinesWithOpa: typeof pipelineWithOrg = [];
        const pipelinesWithoutOpa: typeof pipelineWithOrg = [];
        const coveringPolicySetsPerPipeline = new Map<string, string[]>();

        for (const pipeline of pipelineWithOrg) {
          const coveringSets = pipelinePolicySets.filter((ps) =>
            policySetCovers(ps, pipeline.org, pipeline.project),
          );
          if (coveringSets.length > 0) {
            pipelinesWithOpa.push(pipeline);
            coveringPolicySetsPerPipeline.set(
              pipeline.pipelineId,
              coveringSets.map((ps) => ps.name),
            );
          } else {
            pipelinesWithoutOpa.push(pipeline);
          }
        }

        // ── Step 5: Policy set summary ────────────────────────────────────
        const enabledSets = allPolicySets.filter((ps) => ps.enabled);
        const disabledSets = allPolicySets.filter((ps) => !ps.enabled);

        const policySummary = {
          totalPolicies: allPolicies.length,
          enabledPolicies: allPolicies.filter((p) => p.enabled !== false).length,
          disabledPolicies: allPolicies.filter((p) => p.enabled === false).length,
          policies: allPolicies.map((p) => ({
            identifier: p.identifier,
            name: p.name,
            enabled: p.enabled !== false,
            scope: p.projectIdentifier
              ? `project:${p.orgIdentifier}/${p.projectIdentifier}`
              : p.orgIdentifier
              ? `org:${p.orgIdentifier}`
              : "account",
          })),
        };

        const policySetSummary = {
          total: allPolicySets.length,
          enabled: enabledSets.length,
          disabled: disabledSets.length,
          byEntityType: Object.fromEntries(
            [...new Set(allPolicySets.map((ps) => ps.entityType ?? "UNKNOWN"))].map((type) => [
              type,
              {
                total: allPolicySets.filter((ps) => (ps.entityType ?? "UNKNOWN") === type).length,
                enabled: allPolicySets.filter(
                  (ps) => (ps.entityType ?? "UNKNOWN") === type && ps.enabled,
                ).length,
              },
            ]),
          ),
          sets: allPolicySets.map((ps) => ({
            identifier: ps.identifier,
            name: ps.name,
            entityType: ps.entityType,
            action: ps.action,
            enabled: ps.enabled,
            policyCount: ps.policies?.length ?? 0,
            scope: ps.projectIdentifier
              ? `project:${ps.orgIdentifier}/${ps.projectIdentifier}`
              : ps.orgIdentifier
              ? `org:${ps.orgIdentifier}`
              : "account",
          })),
        };

        // ── Step 6: Pipeline OPA adoption ────────────────────────────────
        const totalPipelines = pipelineWithOrg.length;
        const adoptionPct =
          totalPipelines > 0
            ? Math.round((pipelinesWithOpa.length / totalPipelines) * 100)
            : 0;

        const pipelineOpaDetail = pipelinesWithOpa.map((p) => ({
          pipeline: p.pipelineName,
          pipelineId: p.pipelineId,
          project: p.project,
          org: p.org,
          enforced_by: coveringPolicySetsPerPipeline.get(p.pipelineId) ?? [],
        }));

        const pipelineNoOpaDetail = pipelinesWithoutOpa.map((p) => ({
          pipeline: p.pipelineName,
          pipelineId: p.pipelineId,
          project: p.project,
          org: p.org,
        }));

        // ── Step 7: BVR summary ───────────────────────────────────────────
        const bvr = {
          headline: `Found ${allPolicies.length} OPA policies across ${allPolicySets.length} policy sets. ` +
            `${pipelinesWithOpa.length}/${totalPipelines} IaCM pipelines (${adoptionPct}%) have OPA governance enforced.`,
          opaAdoption: {
            feature: "OPA Policy Governance",
            scope: "pipelines",
            adopted: pipelinesWithOpa.length,
            total: totalPipelines,
            pct: adoptionPct,
            opportunity:
              pipelinesWithoutOpa.length > 0
                ? `${pipelinesWithoutOpa.length} IaCM pipeline(s) run WITHOUT OPA enforcement — ` +
                  `no policy guardrails on provisioning. High governance risk.`
                : "All IaCM pipelines are covered by OPA policy sets.",
          },
          policyCoverage: {
            totalPolicies: allPolicies.length,
            enabledPolicySets: enabledSets.length,
            disabledPolicySets: disabledSets.length,
            pipelinePolicySets: pipelinePolicySets.length,
            workspacePolicySets: workspacePolicySets.length,
          },
          pipelinesWithOpa: pipelineOpaDetail,
          pipelinesWithoutOpa: pipelineNoOpaDetail,
        };

        return jsonResult({
          scannedAt: new Date().toISOString(),
          policies: policySummary,
          policySets: policySetSummary,
          bvr,
        });
      } catch (err) {
        if (err instanceof Error && err.message.toLowerCase().includes("not found")) {
          return errorResult(
            "OPA Policy Management API returned 404. " +
              "Verify that the Governance module is enabled for this account, " +
              "or that the API path /pm/api/v1/policies is reachable.",
          );
        }
        throw toMcpError(err);
      }
    },
  );
}
