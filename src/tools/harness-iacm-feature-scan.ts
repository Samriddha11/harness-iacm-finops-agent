import * as z from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HarnessClient } from "../client/harness-client.js";
import { jsonResult, errorResult } from "../utils/response-formatter.js";
import { toMcpError } from "../utils/errors.js";
import { createLogger } from "../utils/logger.js";
import { listAllWorkspacesPaginated } from "../utils/iacm-pagination.js";

const log = createLogger("iacm-feature-scan");

// ── Types ──────────────────────────────────────────────────────────────────

interface ProjectRef {
  org: string;
  project: string;
  projectName: string;
}

interface PipelineRef {
  org: string;
  project: string;
  projectName: string;
  pipelineId: string;
  pipelineName: string;
}

interface WorkspaceRef {
  org: string;
  project: string;
  projectName: string;
  workspaceId: string;
  workspaceName: string;
  provisioner: string;
}

interface FeatureResult {
  adopted: Array<PipelineRef | WorkspaceRef>;
  notAdopted: Array<PipelineRef | WorkspaceRef>;
  adoptionCount: number;
  totalCount: number;
  adoptionPct: number;
}

interface FeatureScanReport {
  scannedAt: string;
  summary: {
    totalProjects: number;
    totalPipelines: number;
    totalWorkspaces: number;
  };
  features: {
    checkov: FeatureResult;
    costEstimation: FeatureResult;
    iacmTemplates: FeatureResult;
    privateModuleRegistry: FeatureResult;
  };
}

// ── Feature detection ──────────────────────────────────────────────────────

/**
 * Detect Checkov integration in pipeline YAML.
 * Looks for:
 *   - Step type IaCMCheckov / IACMCheckov / iacmcheckov
 *   - checkov keyword anywhere in the YAML
 *   - Security step with tool: Checkov
 *   - STO step referencing checkov
 */
function detectCheckov(yaml: string): boolean {
  const y = yaml.toLowerCase();
  return (
    y.includes("iacmcheckov") ||
    y.includes("iacm_checkov") ||
    y.includes("checkov") ||
    (y.includes("security") && y.includes("tool") && y.includes("checkov"))
  );
}

/**
 * Detect IaCM template usage in pipeline YAML.
 * Looks for templateRef inside an IACM stage context,
 * or any IACM-specific template reference.
 */
function detectTemplates(yaml: string): boolean {
  const y = yaml;
  // templateRef inside IACM stage or step
  if (y.includes("templateRef:") || y.includes("templateRef :")) return true;
  // Stage-level template
  if (y.includes("template:") && y.includes("IACM")) return true;
  return false;
}

/**
 * Detect private module registry usage from workspace data.
 * A workspace uses a private registry if:
 *   - modules_json is set and contains a non-public-registry source
 *   - environment_variables contains TFE_TOKEN, TFC_TOKEN, or TERRAFORM_ENTERPRISE
 *   - variable_sets contain registry-related configuration
 */
function detectPrivateModuleRegistry(workspace: Record<string, unknown>): boolean {
  // modules_json: non-null means modules are configured
  const modulesJson = workspace.modules_json;
  if (modulesJson && typeof modulesJson === "string" && modulesJson !== "null") {
    try {
      const modules = JSON.parse(modulesJson) as Record<string, unknown>;
      const src = JSON.stringify(modules).toLowerCase();
      // Private sources: app.terraform.io, custom git, private registries
      if (
        src.includes("app.terraform.io") ||
        src.includes("terraform.enterprise") ||
        src.includes(".git") ||
        src.includes("artifactory") ||
        src.includes("jfrog")
      ) {
        return true;
      }
    } catch {
      // Not JSON — treat as opaque string
      const src = String(modulesJson).toLowerCase();
      if (src.includes("app.terraform.io") || src.includes(".git")) return true;
    }
  }

  // Check environment variables for registry tokens
  const envVars = workspace.environment_variables;
  if (envVars) {
    const envStr = typeof envVars === "string" ? envVars : JSON.stringify(envVars);
    const e = envStr.toLowerCase();
    if (
      e.includes("tfe_token") ||
      e.includes("tfc_token") ||
      e.includes("terraform_enterprise") ||
      e.includes("terraform_cloud_token") ||
      e.includes("registry")
    ) {
      return true;
    }
  }

  // Check terraform variables for registry-related content
  const tfVars = workspace.terraform_variables;
  if (tfVars) {
    const v = typeof tfVars === "string" ? tfVars : JSON.stringify(tfVars);
    if (v.toLowerCase().includes("registry") || v.toLowerCase().includes("module_source")) {
      return true;
    }
  }

  return false;
}

// ── API helpers ────────────────────────────────────────────────────────────

interface ProjectItem {
  identifier: string;
  name: string;
  orgIdentifier?: string;
}

async function fetchAllIacmProjects(
  client: HarnessClient,
  signal: AbortSignal,
): Promise<ProjectItem[]> {
  const all: ProjectItem[] = [];
  let page = 0;
  while (true) {
    const raw = await client.request<{
      data?: { content?: Array<{ project?: ProjectItem }>; totalPages?: number };
    }>({
      path: "/ng/api/projects",
      params: { accountIdentifier: client.account, hasModule: "IACM", pageIndex: page, pageSize: 200 },
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

async function fetchAllPipelines(
  client: HarnessClient,
  org: string,
  project: string,
  signal: AbortSignal,
): Promise<Array<{ identifier: string; name: string }>> {
  const all: Array<{ identifier: string; name: string }> = [];
  let page = 0;
  while (true) {
    try {
      const raw = await client.request<{
        data?: { content?: Array<{ identifier?: string; name?: string }>; totalPages?: number };
      }>({
        method: "POST",
        path: "/pipeline/api/pipelines/list",
        params: {
          accountIdentifier: client.account,
          orgIdentifier: org,
          projectIdentifier: project,
          module: "iacm",
          size: 100,
          page,
        },
        body: { filterType: "PipelineSetup" },
        signal,
      });
      const content = raw.data?.content ?? [];
      all.push(...content.filter((p) => p.identifier).map((p) => ({ identifier: p.identifier!, name: p.name ?? p.identifier! })));
      if (page + 1 >= (raw.data?.totalPages ?? 1) || content.length === 0) break;
      page++;
    } catch {
      break;
    }
  }
  return all;
}

async function fetchPipelineYaml(
  client: HarnessClient,
  org: string,
  project: string,
  pipelineId: string,
  signal: AbortSignal,
): Promise<string> {
  try {
    const raw = await client.request<{ data?: { yaml?: string; yamlPipeline?: string } }>({
      path: `/pipeline/api/pipelines/${encodeURIComponent(pipelineId)}`,
      params: {
        accountIdentifier: client.account,
        orgIdentifier: org,
        projectIdentifier: project,
      },
      signal,
    });
    return raw.data?.yaml ?? raw.data?.yamlPipeline ?? "";
  } catch {
    return "";
  }
}

async function fetchAllWorkspaces(
  client: HarnessClient,
  org: string,
  project: string,
  signal: AbortSignal,
): Promise<{ items: Array<Record<string, unknown>>; capDetected: boolean; unreachable: boolean }> {
  // Walks every page of the workspace list — see src/utils/iacm-pagination.ts.
  // The endpoint silently caps at 30 items per page; never trust a single page.
  const r = await listAllWorkspacesPaginated<Record<string, unknown>>(client, org, project, signal);
  return { items: r.items, capDetected: r.capDetected, unreachable: r.unreachable };
}

// ── Main tool ──────────────────────────────────────────────────────────────

export function registerFeatureScanTool(server: McpServer, client: HarnessClient): void {
  server.registerTool(
    "harness_iacm_feature_scan",
    {
      description:
        "Scan all IaCM pipelines and workspaces across the entire account to detect feature adoption. " +
        "Reports which pipelines use Checkov security scans, IaCM templates, and which workspaces use " +
        "cost estimation or private module registries. " +
        "Designed for BVR (Business Value Review) — shows adopted vs not-adopted counts per feature " +
        "so you can highlight expansion opportunities to the customer.",
      inputSchema: z.object({
        org_id: z
          .string()
          .describe("Limit scan to a single org (optional — omit to scan all orgs).")
          .optional(),
        project_id: z
          .string()
          .describe("Limit scan to a single project (optional — omit to scan all projects).")
          .optional(),
        concurrency: z
          .number()
          .min(1)
          .max(10)
          .describe("Number of projects to process in parallel (default 3, max 10).")
          .default(3)
          .optional(),
      }),
      annotations: {
        title: "IaCM Feature Adoption Scan (BVR)",
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    async (args, { signal }) => {
      try {
        const concurrency = args.concurrency ?? 3;

        // ── Step 1: Discover projects ──────────────────────────────────────
        log.info("Starting IaCM feature scan");
        let projects = await fetchAllIacmProjects(client, signal);

        if (args.org_id) {
          projects = projects.filter((p) => p.orgIdentifier === args.org_id);
        }
        if (args.project_id) {
          projects = projects.filter((p) => p.identifier === args.project_id);
        }

        if (projects.length === 0) {
          return errorResult("No IaCM-enabled projects found. Verify the IaCM module is enabled in your account.");
        }

        log.info(`Scanning ${projects.length} projects for feature adoption`);

        // ── Step 2: Per-project data collection ────────────────────────────
        const checkovAdopted: PipelineRef[] = [];
        const checkovNotAdopted: PipelineRef[] = [];
        const templateAdopted: PipelineRef[] = [];
        const templateNotAdopted: PipelineRef[] = [];
        const costEstAdopted: WorkspaceRef[] = [];
        const costEstNotAdopted: WorkspaceRef[] = [];
        const privateRegAdopted: WorkspaceRef[] = [];
        const privateRegNotAdopted: WorkspaceRef[] = [];

        let totalPipelines = 0;
        let totalWorkspaces = 0;
        const projectsHittingWsCap: string[] = [];
        const unreachableForWs: string[] = [];

        const projectRefs: ProjectRef[] = projects.map((p) => ({
          org: p.orgIdentifier ?? "default",
          project: p.identifier,
          projectName: p.name,
        }));

        // Process in batches
        for (let i = 0; i < projectRefs.length; i += concurrency) {
          const batch = projectRefs.slice(i, i + concurrency);

          await Promise.all(batch.map(async ({ org, project, projectName }) => {
            // ── Pipelines: fetch YAML and detect features ──────────────────
            const pipelines = await fetchAllPipelines(client, org, project, signal);
            totalPipelines += pipelines.length;

            await Promise.all(pipelines.map(async ({ identifier: pid, name: pname }) => {
              const yaml = await fetchPipelineYaml(client, org, project, pid, signal);
              const ref: PipelineRef = { org, project, projectName, pipelineId: pid, pipelineName: pname };

              if (detectCheckov(yaml)) {
                checkovAdopted.push(ref);
              } else {
                checkovNotAdopted.push(ref);
              }

              if (detectTemplates(yaml)) {
                templateAdopted.push(ref);
              } else {
                templateNotAdopted.push(ref);
              }
            }));

            // ── Workspaces: detect cost estimation and module registry ──────
            const wsResult = await fetchAllWorkspaces(client, org, project, signal);
            const workspaces = wsResult.items;
            totalWorkspaces += workspaces.length;
            if (wsResult.capDetected) projectsHittingWsCap.push(`${org}/${project}`);
            if (wsResult.unreachable) unreachableForWs.push(`${org}/${project}`);

            for (const ws of workspaces) {
              const wref: WorkspaceRef = {
                org,
                project,
                projectName,
                workspaceId: String(ws.identifier ?? ""),
                workspaceName: String(ws.name ?? ws.identifier ?? ""),
                provisioner: String(ws.provisioner ?? "terraform"),
              };

              // Cost estimation
              if (ws.cost_estimation_enabled === true) {
                costEstAdopted.push(wref);
              } else {
                costEstNotAdopted.push(wref);
              }

              // Private module registry
              if (detectPrivateModuleRegistry(ws)) {
                privateRegAdopted.push(wref);
              } else {
                privateRegNotAdopted.push(wref);
              }
            }

            log.info(`Scanned project ${project}: ${pipelines.length} pipelines, ${workspaces.length} workspaces`);
          }));
        }

        // ── Step 3: Build report ───────────────────────────────────────────
        function featureResult(
          adopted: Array<PipelineRef | WorkspaceRef>,
          notAdopted: Array<PipelineRef | WorkspaceRef>,
        ): FeatureResult {
          const total = adopted.length + notAdopted.length;
          return {
            adopted,
            notAdopted,
            adoptionCount: adopted.length,
            totalCount: total,
            adoptionPct: total > 0 ? Math.round((adopted.length / total) * 100) : 0,
          };
        }

        const report: FeatureScanReport = {
          scannedAt: new Date().toISOString(),
          summary: {
            totalProjects: projects.length,
            totalPipelines,
            totalWorkspaces,
          },
          features: {
            checkov: featureResult(checkovAdopted, checkovNotAdopted),
            costEstimation: featureResult(costEstAdopted, costEstNotAdopted),
            iacmTemplates: featureResult(templateAdopted, templateNotAdopted),
            privateModuleRegistry: featureResult(privateRegAdopted, privateRegNotAdopted),
          },
        };

        // ── Step 4: Human-friendly BVR summary ────────────────────────────
        const bvrSummary = {
          ...report,
          bvr: {
            headline: `Scanned ${totalPipelines} IaCM pipelines and ${totalWorkspaces} workspaces across ${projects.length} projects.`,
            featureAdoption: [
              {
                feature: "Checkov Security Scans",
                scope: "pipelines",
                adopted: checkovAdopted.length,
                total: totalPipelines,
                pct: totalPipelines > 0 ? Math.round((checkovAdopted.length / totalPipelines) * 100) : 0,
                notUsing: checkovNotAdopted.map((p) => `${(p as PipelineRef).pipelineName} (${p.project})`),
                opportunity: checkovNotAdopted.length > 0
                  ? `${checkovNotAdopted.length} pipeline(s) are not running Checkov scans — policy compliance gaps.`
                  : "All pipelines run Checkov scans.",
              },
              {
                feature: "Cost Estimation",
                scope: "workspaces",
                adopted: costEstAdopted.length,
                total: totalWorkspaces,
                pct: totalWorkspaces > 0 ? Math.round((costEstAdopted.length / totalWorkspaces) * 100) : 0,
                notUsing: costEstNotAdopted.map((w) => `${(w as WorkspaceRef).workspaceName} (${w.project})`),
                opportunity: costEstNotAdopted.length > 0
                  ? `${costEstNotAdopted.length} workspace(s) have cost estimation disabled — missing FinOps integration.`
                  : "All workspaces have cost estimation enabled.",
              },
              {
                feature: "IaCM Templates",
                scope: "pipelines",
                adopted: templateAdopted.length,
                total: totalPipelines,
                pct: totalPipelines > 0 ? Math.round((templateAdopted.length / totalPipelines) * 100) : 0,
                notUsing: templateNotAdopted.map((p) => `${(p as PipelineRef).pipelineName} (${p.project})`),
                opportunity: templateNotAdopted.length > 0
                  ? `${templateNotAdopted.length} pipeline(s) are not using IaCM templates — inconsistent provisioning patterns.`
                  : "All pipelines use IaCM templates.",
              },
              {
                feature: "Private Module Registry",
                scope: "workspaces",
                adopted: privateRegAdopted.length,
                total: totalWorkspaces,
                pct: totalWorkspaces > 0 ? Math.round((privateRegAdopted.length / totalWorkspaces) * 100) : 0,
                notUsing: privateRegNotAdopted.map((w) => `${(w as WorkspaceRef).workspaceName} (${w.project})`),
                opportunity: privateRegAdopted.length === 0
                  ? "No workspaces use a private module registry — all modules sourced from public registry."
                  : `${privateRegAdopted.length} workspace(s) use private module registry.`,
              },
            ],
          },
        };

        const audit = {
          workspaceCountMethod: "paginated-exhaustive",
          pipelineCountMethod: "totalElements",
          projectsHittingWorkspaceCap: projectsHittingWsCap,
          unreachableProjectsForWorkspaces: unreachableForWs,
          guidance:
            "Workspace lists were paginated to exhaustion. Cross-validate top-line workspace " +
            "totals (and cost-estimation / private-registry adoption denominators) with the IaCM " +
            "dashboard for high-stakes deliverables — agree to ±5%.",
        };

        return jsonResult({ ...bvrSummary, _meta: audit });
      } catch (err) {
        throw toMcpError(err);
      }
    },
  );
}
