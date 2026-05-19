import * as z from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HarnessClient } from "../client/harness-client.js";
import { jsonResult, errorResult } from "../utils/response-formatter.js";
import { toMcpError } from "../utils/errors.js";
import { createLogger } from "../utils/logger.js";
import { listAllWorkspacesPaginated } from "../utils/iacm-pagination.js";

const log = createLogger("iacm-growth");

// ── Harness API response shapes ────────────────────────────────────────────

interface ProjectItem {
  identifier: string;
  name: string;
  orgIdentifier?: string;
}
interface ProjectListResponse {
  data?: { content?: Array<{ project?: ProjectItem }>; totalPages?: number };
}

interface WorkspaceItem {
  identifier?: string;
  name?: string;
  /** epoch ms — IaCM API returns "created" (snake-cased to "created_at" in some versions) */
  created?: number;
  created_at?: number;
  createdAt?: number;
}

interface PipelineSummary {
  identifier?: string;
  name?: string;
  /** NG pipeline-list returns createdAt (epoch ms) */
  createdAt?: number;
  created?: number;
}

interface PipelinePageResponse {
  data?: { content?: PipelineSummary[]; totalElements?: number; totalPages?: number };
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Best-effort extraction of a creation timestamp (epoch ms) from any record. */
function pickCreatedMs(item: Record<string, unknown>): number | undefined {
  for (const k of ["created", "createdAt", "created_at", "createdTimestamp"]) {
    const v = item[k];
    if (typeof v === "number" && Number.isFinite(v) && v > 0) return v;
    if (typeof v === "string") {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) return n;
      const d = Date.parse(v);
      if (!Number.isNaN(d)) return d;
    }
  }
  return undefined;
}

interface MonthBucket {
  /** "YYYY-MM" — UTC */
  month: string;
  /** Short display label, e.g. "Jun '25" */
  label: string;
  /** Start of month in epoch ms (UTC) */
  startMs: number;
}

/** Build N consecutive month buckets ending with the current calendar month (UTC). */
function buildMonthBuckets(months: number, now = Date.now()): MonthBucket[] {
  const d = new Date(now);
  const endY = d.getUTCFullYear();
  const endM = d.getUTCMonth(); // 0-based
  const out: MonthBucket[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const totalMonths = endY * 12 + endM - i;
    const y = Math.floor(totalMonths / 12);
    const m = totalMonths % 12;
    const startMs = Date.UTC(y, m, 1, 0, 0, 0, 0);
    const monthStr = `${y.toString().padStart(4, "0")}-${(m + 1).toString().padStart(2, "0")}`;
    const labelMonth = new Date(startMs).toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    const labelYear = (y % 100).toString().padStart(2, "0");
    out.push({ month: monthStr, label: `${labelMonth} '${labelYear}`, startMs });
  }
  return out;
}

/** Find the index of the bucket that contains a given epoch ms. */
function bucketIndexFor(ms: number, buckets: MonthBucket[]): number {
  // buckets are ascending; find the last bucket whose start <= ms
  let lo = 0, hi = buckets.length - 1, found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (buckets[mid]!.startMs <= ms) { found = mid; lo = mid + 1; } else { hi = mid - 1; }
  }
  return found;
}

// ── Per-project data fetchers ───────────────────────────────────────────────

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

/**
 * List every workspace in a project. Delegates to the shared pagination
 * helper, which knows that the IaCM workspace endpoint silently caps each
 * page at 30 items server-side regardless of the requested `pageSize`.
 */
async function listAllWorkspaces(
  client: HarnessClient,
  org: string,
  project: string,
  signal: AbortSignal,
): Promise<{ items: WorkspaceItem[]; capDetected: boolean; unreachable: boolean }> {
  const r = await listAllWorkspacesPaginated<WorkspaceItem>(client, org, project, signal);
  return { items: r.items, capDetected: r.capDetected, unreachable: r.unreachable };
}

/** List every IaCM pipeline in a project, paginating until exhausted. */
async function listAllPipelines(
  client: HarnessClient,
  org: string,
  project: string,
  signal: AbortSignal,
): Promise<PipelineSummary[]> {
  const size = 100;
  let page = 0; // NG pipeline API is 0-based
  const out: PipelineSummary[] = [];
  while (true) {
    try {
      const raw = await client.request<PipelinePageResponse>({
        method: "POST",
        path: "/pipeline/api/pipelines/list",
        params: {
          accountIdentifier: client.account,
          orgIdentifier: org,
          projectIdentifier: project,
          module: "iacm",
          size,
          page,
        },
        body: { filterType: "PipelineSetup" },
        signal,
      });
      const content = raw.data?.content ?? [];
      out.push(...content);
      const totalPages = raw.data?.totalPages ?? 1;
      if (page + 1 >= totalPages || content.length === 0) break;
      page++;
    } catch (err) {
      log.warn("pipeline list failed", { org, project, err: String(err) });
      break;
    }
  }
  return out;
}

/** Run a list of async tasks with bounded concurrency. */
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

// ── Tool registration ──────────────────────────────────────────────────────

export function registerGrowthTool(server: McpServer, client: HarnessClient): void {
  server.registerTool(
    "harness_iacm_growth",
    {
      description:
        "Compute month-over-month growth of IaCM workspaces and pipelines across the entire " +
        "Harness account (or one org). Walks every IACM-enabled project, lists every workspace " +
        "and pipeline, buckets them by their `createdAt` month, and returns a 12-month time-series " +
        "with both NEW-per-month and CUMULATIVE counts. Pair with chart_kind='monthly_growth' to " +
        "produce a polished line chart for BVRs and trend reports.",
      inputSchema: z.object({
        months: z
          .number()
          .min(3)
          .max(36)
          .describe("Lookback window in months (default 12, max 36).")
          .default(12)
          .optional(),
        org_id: z
          .string()
          .describe("Limit scan to one Harness org (optional — omit to scan all orgs).")
          .optional(),
        concurrency: z
          .number()
          .min(1)
          .max(20)
          .describe("Max projects scanned in parallel (default 5, max 20).")
          .default(5)
          .optional(),
      }),
      annotations: {
        title: "IaCM Growth Time-Series",
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    async (args, { signal }) => {
      try {
        const months = args.months ?? 12;
        const concurrency = args.concurrency ?? 5;
        const orgFilter = args.org_id;

        log.info("Starting IaCM growth scan", { months, orgFilter, concurrency });

        const projects = await fetchAllIacmProjects(client, orgFilter, signal);
        log.info(`Found ${projects.length} IACM-enabled projects`);

        if (projects.length === 0) {
          return jsonResult({
            summary: {
              totalWorkspaces: 0,
              totalPipelines: 0,
              windowMonths: months,
              asOf: new Date().toISOString().slice(0, 10),
              message: orgFilter
                ? `No IACM-enabled projects found in org '${orgFilter}'.`
                : "No IACM-enabled projects found in this account.",
            },
            monthly: [],
            growth: null,
          });
        }

        // Fetch every workspace and pipeline in parallel (per project)
        const perProject = await mapWithConcurrency(projects, concurrency, async (p) => {
          const org = p.orgIdentifier ?? "default";
          const [wsResult, pl] = await Promise.all([
            listAllWorkspaces(client, org, p.identifier, signal),
            listAllPipelines(client, org, p.identifier, signal),
          ]);
          return {
            org,
            project: p.identifier,
            ws: wsResult.items,
            wsCapDetected: wsResult.capDetected,
            wsUnreachable: wsResult.unreachable,
            pl,
          };
        });

        // Flatten + extract creation timestamps
        const allWsCreated: number[] = [];
        const allPlCreated: number[] = [];
        let totalWs = 0, totalPl = 0;
        let wsMissing = 0, plMissing = 0;
        const projectsHittingWsCap: string[] = [];
        const unreachableForWs: string[] = [];
        for (const r of perProject) {
          totalWs += r.ws.length;
          totalPl += r.pl.length;
          if (r.wsCapDetected) projectsHittingWsCap.push(`${r.org}/${r.project}`);
          if (r.wsUnreachable) unreachableForWs.push(`${r.org}/${r.project}`);
          for (const w of r.ws) {
            const t = pickCreatedMs(w as unknown as Record<string, unknown>);
            if (t !== undefined) allWsCreated.push(t); else wsMissing++;
          }
          for (const p of r.pl) {
            const t = pickCreatedMs(p as unknown as Record<string, unknown>);
            if (t !== undefined) allPlCreated.push(t); else plMissing++;
          }
        }

        // Build monthly buckets and bucket every record
        const buckets = buildMonthBuckets(months);
        const wsNew = new Array(buckets.length).fill(0);
        const plNew = new Array(buckets.length).fill(0);
        // Anything CREATED BEFORE the window is part of the cumulative starting baseline
        let wsBaseline = 0, plBaseline = 0;
        const windowStart = buckets[0]!.startMs;

        for (const t of allWsCreated) {
          if (t < windowStart) { wsBaseline++; continue; }
          const i = bucketIndexFor(t, buckets);
          if (i >= 0) wsNew[i]++;
        }
        for (const t of allPlCreated) {
          if (t < windowStart) { plBaseline++; continue; }
          const i = bucketIndexFor(t, buckets);
          if (i >= 0) plNew[i]++;
        }

        // Compute cumulative running totals
        const monthly = buckets.map((b, i) => {
          const wsCumulative = wsBaseline + wsNew.slice(0, i + 1).reduce((s: number, n: number) => s + n, 0);
          const plCumulative = plBaseline + plNew.slice(0, i + 1).reduce((s: number, n: number) => s + n, 0);
          return {
            month: b.month,
            label: b.label,
            workspaces: { new: wsNew[i], cumulative: wsCumulative },
            pipelines: { new: plNew[i], cumulative: plCumulative },
          };
        });

        const first = monthly[0]!, last = monthly[monthly.length - 1]!;
        const wsAdded = last.workspaces.cumulative - first.workspaces.cumulative + first.workspaces.new;
        const plAdded = last.pipelines.cumulative - first.pipelines.cumulative + first.pipelines.new;
        const baseWsForGrowth = wsBaseline > 0 ? wsBaseline : (last.workspaces.cumulative - wsAdded);
        const basePlForGrowth = plBaseline > 0 ? plBaseline : (last.pipelines.cumulative - plAdded);
        const wsGrowthPct = baseWsForGrowth > 0 ? (wsAdded / baseWsForGrowth) * 100 : null;
        const plGrowthPct = basePlForGrowth > 0 ? (plAdded / basePlForGrowth) * 100 : null;

        const summary = {
          totalWorkspaces: totalWs,
          totalPipelines: totalPl,
          windowMonths: months,
          asOf: new Date().toISOString().slice(0, 10),
          projectsScanned: projects.length,
          baseline: {
            workspacesBeforeWindow: wsBaseline,
            pipelinesBeforeWindow: plBaseline,
            note: "Items created before the window start contribute to the cumulative baseline but not to monthly 'new' counts.",
          },
          missingTimestamps: {
            workspaces: wsMissing,
            pipelines: plMissing,
            note: wsMissing + plMissing > 0
              ? "Some records had no createdAt field and were excluded from the time-series."
              : undefined,
          },
        };

        const growth = {
          workspaces: {
            added: wsAdded,
            growthPct: wsGrowthPct,
            monthlyAvg: Math.round(wsAdded / months),
          },
          pipelines: {
            added: plAdded,
            growthPct: plGrowthPct,
            monthlyAvg: Math.round(plAdded / months),
          },
        };

        const audit = {
          workspaceCountMethod: "paginated-exhaustive",
          pipelineCountMethod: "totalElements",
          projectsHittingWorkspaceCap: projectsHittingWsCap,
          unreachableProjectsForWorkspaces: unreachableForWs,
          guidance:
            "Workspace lists were paginated to exhaustion; cumulative counts on the time-series " +
            "are accurate. Cross-validate with the IaCM dashboard for high-stakes deliverables.",
        };

        return jsonResult({ summary, monthly, growth, _meta: audit });
      } catch (err) {
        if (err instanceof Error && err.message.includes("resource_type")) {
          return errorResult(err.message);
        }
        throw toMcpError(err);
      }
    },
  );
}
