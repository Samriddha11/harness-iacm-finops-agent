import * as z from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HarnessClient } from "../client/harness-client.js";
import { jsonResult, errorResult } from "../utils/response-formatter.js";
import { toMcpError } from "../utils/errors.js";
import { createLogger } from "../utils/logger.js";
import { countAllWorkspacesPaginated } from "../utils/iacm-pagination.js";

const log = createLogger("iacm-scan");

// ── Harness API response shapes ────────────────────────────────────────────

interface ProjectItem {
  identifier: string;
  name: string;
  orgIdentifier?: string;
  description?: string;
  color?: string;
  modules?: string[];
}

interface ProjectListResponse {
  data?: {
    content?: Array<{ project?: ProjectItem }>;
    totalElements?: number;
    totalPages?: number;
  };
}

interface WorkspaceListResponse {
  workspaces?: Array<{ identifier?: string; name?: string; status?: string }>;
  pagination?: { total_items?: number };
}

interface PipelineListResponse {
  data?: {
    content?: unknown[];
    totalElements?: number;
  };
}

interface ExecutionListResponse {
  data?: {
    content?: unknown[];
    totalElements?: number;
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Resolve total count from any Harness API response shape. */
function resolveTotalFromRaw(raw: Record<string, unknown>): number | undefined {
  // IaCM workspace: { pagination: { total_items, totalItems, total } }
  const pag = raw.pagination as Record<string, unknown> | undefined;
  if (typeof pag?.total_items === "number") return pag.total_items;
  if (typeof pag?.totalItems === "number") return pag.totalItems;
  if (typeof pag?.total === "number") return pag.total;
  // NG API: { data: { totalElements } }
  const data = raw.data as Record<string, unknown> | undefined;
  if (typeof data?.totalElements === "number") return data.totalElements;
  if (typeof raw.totalElements === "number") return raw.totalElements;
  if (typeof raw.total === "number") return raw.total;
  // Count items in known array fields
  for (const key of ["workspaces", "content", "items", "runs", "pipelines"]) {
    if (Array.isArray(raw[key])) {
      // If data is wrapped, check for totalElements in parent
      return undefined; // can't determine total from single page count alone
    }
  }
  return undefined;
}

/** Fetch one page and return total count without loading all items. */
async function fetchCount(
  client: HarnessClient,
  path: string,
  params: Record<string, string | number | boolean>,
  signal: AbortSignal,
): Promise<number> {
  try {
    const raw = await client.request<unknown>({ path, params, signal });

    // Bare array — IACM workspace/run API confirmed shape
    if (Array.isArray(raw)) return raw.length;

    if (!raw || typeof raw !== "object") return 0;
    const r = raw as Record<string, unknown>;

    log.debug("fetchCount raw response keys", { path, keys: Object.keys(r) });

    const total = resolveTotalFromRaw(r);
    if (total !== undefined) return total;

    // Check known array fields
    for (const key of ["workspaces", "runs", "content", "items", "pipelines", "data"]) {
      if (Array.isArray(r[key])) return (r[key] as unknown[]).length;
    }
    return 0;
  } catch (err) {
    log.warn("fetchCount error", { path, error: String(err) });
    return -1; // -1 signals "could not reach / not enabled"
  }
}


// ── Per-project data ───────────────────────────────────────────────────────

interface ProjectResult {
  org: string;
  project: string;
  projectName: string;
  workspaceCount: number;
  workspaceCountMethod: "paginated-exhaustive" | "unreachable" | "skipped";
  workspaceCapDetected: boolean;
  pipelineCount: number;
  executionCount: number;
  reachable: boolean;
}

async function scanProject(
  client: HarnessClient,
  org: string,
  projectId: string,
  projectName: string,
  include: "workspaces" | "pipelines" | "both",
  signal: AbortSignal,
): Promise<ProjectResult> {
  const base: ProjectResult = {
    org,
    project: projectId,
    projectName,
    workspaceCount: -1,
    workspaceCountMethod: "skipped",
    workspaceCapDetected: false,
    pipelineCount: -1,
    executionCount: -1,
    reachable: true,
  };

  const accountId = client.account;

  const promises: Promise<void>[] = [];

  if (include === "workspaces" || include === "both") {
    promises.push(
      countAllWorkspacesPaginated(client, org, projectId, signal).then((r) => {
        base.workspaceCount = r.count;
        base.workspaceCountMethod =
          r.countMethod === "paginated-exhaustive" ? "paginated-exhaustive" :
          r.countMethod === "unreachable" ? "unreachable" : "paginated-exhaustive";
        base.workspaceCapDetected = r.capDetected;
      }),
    );
  }

  if (include === "pipelines" || include === "both") {
    // Pipeline count — POST /pipeline/api/pipelines/list with module=iacm filter
    promises.push(
      client.request<Record<string, unknown>>({
        method: "POST",
        path: "/pipeline/api/pipelines/list",
        params: {
          accountIdentifier: accountId,
          orgIdentifier: org,
          projectIdentifier: projectId,
          module: "iacm",
          size: 1,
          page: 0,
        },
        body: { filterType: "PipelineSetup" },
        signal,
      })
        .then((raw) => {
          const r = raw as Record<string, unknown>;
          const data = r.data as Record<string, unknown> | undefined;
          base.pipelineCount = (data?.totalElements as number) ?? (Array.isArray(data?.content) ? (data.content as unknown[]).length : 0);
        })
        .catch(() => { base.pipelineCount = -1; }),
    );
  }

  await Promise.allSettled(promises);

  base.reachable =
    (include === "workspaces" && base.workspaceCount >= 0) ||
    (include === "pipelines" && base.pipelineCount >= 0) ||
    (include === "both" && (base.workspaceCount >= 0 || base.pipelineCount >= 0));

  return base;
}

// ── Fetch all IACM-enabled projects ───────────────────────────────────────

async function fetchAllIacmProjects(
  client: HarnessClient,
  orgFilter: string | undefined,
  signal: AbortSignal,
): Promise<ProjectItem[]> {
  const pageSize = 200;
  let page = 0;
  const all: ProjectItem[] = [];

  while (true) {
    const params: Record<string, string | number | boolean> = {
      accountIdentifier: client.account,
      hasModule: "IACM",
      pageIndex: page,
      pageSize,
    };
    if (orgFilter) params.orgIdentifier = orgFilter;

    const raw = await client.request<ProjectListResponse>({
      path: "/ng/api/projects",
      params,
      signal,
    });

    const content = raw.data?.content ?? [];
    const projects = content.map((c) => c.project).filter((p): p is ProjectItem => !!p);
    all.push(...projects);

    const totalPages = raw.data?.totalPages ?? 1;
    if (page + 1 >= totalPages || projects.length === 0) break;
    page++;
  }

  return all;
}

// ── Tool registration ──────────────────────────────────────────────────────

export function registerScanTool(server: McpServer, client: HarnessClient): void {
  server.registerTool(
    "harness_iacm_scan",
    {
      description:
        "Scan ALL orgs and projects in the Harness account and return a consolidated " +
        "count of IaCM workspaces and/or pipelines per project — no org or project ID needed. " +
        "Uses hasModule=IACM to skip non-IaCM projects automatically. " +
        "Runs project queries in parallel for speed.",
      inputSchema: z.object({
        include: z
          .enum(["workspaces", "pipelines", "both"])
          .describe("What to count per project. 'both' counts workspaces AND pipelines (default).")
          .default("both"),
        org_id: z
          .string()
          .describe("Limit scan to a single org identifier (optional — omit to scan all orgs).")
          .optional(),
        concurrency: z
          .number()
          .min(1)
          .max(20)
          .describe("Number of projects to query in parallel (default 5, max 20).")
          .default(5)
          .optional(),
      }),
      annotations: {
        title: "Scan All IaCM Projects",
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    async (args, { signal }) => {
      try {
        const include = args.include ?? "both";
        const concurrency = args.concurrency ?? 5;
        const orgFilter = args.org_id;

        log.info("Starting IaCM account scan", { include, orgFilter, concurrency });

        // Step 1 — discover all IACM-enabled projects
        const projects = await fetchAllIacmProjects(client, orgFilter, signal);
        log.info(`Found ${projects.length} IACM-enabled projects`);

        if (projects.length === 0) {
          return jsonResult({
            summary: {
              totalProjects: 0,
              totalWorkspaces: 0,
              totalPipelines: 0,
              message: orgFilter
                ? `No IACM-enabled projects found in org '${orgFilter}'.`
                : "No IACM-enabled projects found in this account. Verify the IaCM module is enabled.",
            },
            projects: [],
          });
        }

        // Step 2 — scan each project in parallel (bounded concurrency)
        const results: ProjectResult[] = [];
        for (let i = 0; i < projects.length; i += concurrency) {
          const batch = projects.slice(i, i + concurrency);
          const batchResults = await Promise.all(
            batch.map((p) =>
              scanProject(
                client,
                p.orgIdentifier ?? "default",
                p.identifier,
                p.name,
                include,
                signal,
              ),
            ),
          );
          results.push(...batchResults);
          log.info(`Scanned ${Math.min(i + concurrency, projects.length)}/${projects.length} projects`);
        }

        // Step 3 — aggregate
        const totalWorkspaces = results.reduce(
          (sum, r) => sum + (r.workspaceCount > 0 ? r.workspaceCount : 0),
          0,
        );
        const totalPipelines = results.reduce(
          (sum, r) => sum + (r.pipelineCount > 0 ? r.pipelineCount : 0),
          0,
        );

        // Group by org for readability
        const byOrg: Record<string, ProjectResult[]> = {};
        for (const r of results) {
          (byOrg[r.org] ??= []).push(r);
        }

        const orgs = Object.entries(byOrg).map(([orgId, orgProjects]) => ({
          org: orgId,
          projectCount: orgProjects.length,
          workspaceCount: include !== "pipelines"
            ? orgProjects.reduce((s, p) => s + (p.workspaceCount > 0 ? p.workspaceCount : 0), 0)
            : undefined,
          pipelineCount: include !== "workspaces"
            ? orgProjects.reduce((s, p) => s + (p.pipelineCount > 0 ? p.pipelineCount : 0), 0)
            : undefined,
          projects: orgProjects.map((p) => ({
            identifier: p.project,
            name: p.projectName,
            ...(include !== "pipelines" ? { workspaces: p.workspaceCount } : {}),
            ...(include !== "workspaces" ? { pipelines: p.pipelineCount } : {}),
          })),
        }));

        const summary: Record<string, unknown> = {
          totalProjects: projects.length,
          orgCount: Object.keys(byOrg).length,
        };
        if (include !== "pipelines") summary.totalWorkspaces = totalWorkspaces;
        if (include !== "workspaces") summary.totalPipelines = totalPipelines;
        summary.note =
          "-1 means the endpoint was unreachable for that project (IaCM may not be fully configured there).";

        // Audit metadata — lets BVR validators and downstream agents check
        // confidence in the workspace counts. The IaCM workspace endpoint is
        // known to silently cap at 30 items per page server-side; we walk to
        // exhaustion, but we still surface which projects hit the cap so any
        // future server change is detectable.
        const projectsHittingCap = results
          .filter((r) => r.workspaceCapDetected)
          .map((r) => `${r.org}/${r.project}`);
        const unreachableProjects = results
          .filter((r) => r.workspaceCountMethod === "unreachable")
          .map((r) => `${r.org}/${r.project}`);
        const audit = {
          workspaceCountMethod: include === "pipelines" ? "skipped" : "paginated-exhaustive",
          pipelineCountMethod: include === "workspaces" ? "skipped" : "totalElements",
          projectsHittingPageCap: projectsHittingCap,
          unreachableProjects,
          guidance:
            "Top-line totals were computed by paginating each project's workspace list to exhaustion. " +
            "Cross-validate with the IaCM dashboard for high-stakes deliverables — agree to ±5%.",
        };

        return jsonResult({ summary, orgs, _meta: audit });
      } catch (err) {
        if (err instanceof Error && err.message.includes("resource_type")) {
          return errorResult(err.message);
        }
        throw toMcpError(err);
      }
    },
  );
}
