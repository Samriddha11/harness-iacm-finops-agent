import * as z from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HarnessClient } from "../client/harness-client.js";
import { jsonResult, errorResult } from "../utils/response-formatter.js";
import { toMcpError } from "../utils/errors.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("iacm-maturity");

// ── Maturity model ──────────────────────────────────────────────────────────
//
// Three tiers: Crawl (0–39) · Walk (40–69) · Run (70–100)
//
// Scoring dimensions (total = 100 pts):
//
//  Dimension                          Max  Notes
//  ─────────────────────────────────────────────────────────────────────
//  Workspace adoption                  20  0→none, 5→≥1, 12→≥10, 20→≥25
//  Pipeline adoption                   15  0→none, 5→≥1, 10→≥5,  15→≥10
//  Pipeline type diversity             10  +2 each: provision,destroy,drift,approval,opentofu
//  Checkov security scans              15  % adoption scaled 0→15
//  Cost estimation                     15  % workspace adoption scaled 0→15
//  OPA governance coverage             10  % pipeline coverage scaled 0→10
//  Active OPA policy sets               5  0→0 active, 3→1-2, 5→3+
//  IaCM templates                       5  0→none, 3→partial, 5→all pipelines
//  Multi-project adoption               5  0→1 active, 3→2-3, 5→4+
//  ─────────────────────────────────────────────────────────────────────
//  Total                              100

interface ScanInput {
  totalWorkspaces: number;
  totalPipelines: number;
  pipelineNames: string[];
  checkovAdoptionPct: number;
  costEstimationPct: number;
  opaCoveragePct: number;
  activeOpaSets: number;
  iacmTemplatesAdopted: number;
  activeProjects: number;
}

interface DimensionScore {
  dimension: string;
  score: number;
  maxScore: number;
  pct: number;
  finding: string;
  recommendation: string;
}

interface MaturityResult {
  tier: "Crawl" | "Walk" | "Run";
  totalScore: number;
  maxScore: number;
  pct: number;
  tierDescription: string;
  nextTier?: "Walk" | "Run";
  pointsToNextTier?: number;
  dimensions: DimensionScore[];
  topGaps: string[];
  topStrengths: string[];
  roadmap: Array<{ phase: string; action: string; impact: number; effort: "Low" | "Medium" | "High" }>;
}

// ── Scoring functions ───────────────────────────────────────────────────────

function scoreWorkspaces(n: number): { score: number; finding: string; recommendation: string } {
  if (n === 0)  return { score: 0,  finding: "No workspaces created. IaCM module is enabled but unused.",          recommendation: "Create your first workspace — start with a dev environment to prove the pattern." };
  if (n < 5)   return { score: 5,  finding: `${n} workspace(s) — early adoption, limited coverage.`,               recommendation: "Expand to 10+ workspaces across DEV/QA/PROD tiers." };
  if (n < 10)  return { score: 10, finding: `${n} workspaces — growing adoption.`,                                  recommendation: "Target 25+ workspaces to reach full coverage." };
  if (n < 25)  return { score: 15, finding: `${n} workspaces — strong adoption in primary projects.`,               recommendation: "Activate IaCM in dormant projects to maximise footprint." };
  return         { score: 20, finding: `${n} workspaces — mature, broad coverage.`,                                  recommendation: "Focus on quality: cost estimation and Checkov on all workspaces." };
}

function scorePipelines(n: number): { score: number; finding: string; recommendation: string } {
  if (n === 0)  return { score: 0,  finding: "No IaCM pipelines.",                                                  recommendation: "Create a provision pipeline as your first automation workflow." };
  if (n < 3)   return { score: 5,  finding: `${n} pipeline(s) — minimal automation.`,                              recommendation: "Build separate pipelines for provision, destroy, and drift detection." };
  if (n < 8)   return { score: 10, finding: `${n} pipelines — good pipeline coverage.`,                            recommendation: "Add drift detection and approval pipelines for completeness." };
  return         { score: 15, finding: `${n} pipelines — comprehensive pipeline library.`,                          recommendation: "Template the pipelines to enforce standards across all teams." };
}

function scorePipelineDiversity(names: string[]): { score: number; finding: string; recommendation: string } {
  const lower = names.map((n) => n.toLowerCase());
  let score = 0;
  const present: string[] = [];
  const missing: string[] = [];

  const checks: Array<{ label: string; pattern: RegExp }> = [
    { label: "Provision/Apply", pattern: /provision|apply|deploy|create/ },
    { label: "Destroy/Teardown", pattern: /destroy|teardown|delete|deprovision/ },
    { label: "Drift Detection", pattern: /drift|detect|scan/ },
    { label: "Approval Workflow", pattern: /approval|approve|review|selective/ },
    { label: "OpenTofu", pattern: /opentofu|tofu/ },
  ];

  for (const check of checks) {
    if (lower.some((n) => check.pattern.test(n))) {
      score += 2; present.push(check.label);
    } else {
      missing.push(check.label);
    }
  }

  return {
    score,
    finding: `Pipeline types present: ${present.join(", ") || "none"}.${missing.length ? ` Missing: ${missing.join(", ")}.` : ""}`,
    recommendation: missing.length
      ? `Add pipelines for: ${missing.join(", ")}.`
      : "Full pipeline type coverage achieved.",
  };
}

function scaledScore(pct: number, maxScore: number): number {
  return Math.round((pct / 100) * maxScore);
}

function scoreCheckov(pct: number): { score: number; finding: string; recommendation: string } {
  const score = scaledScore(pct, 15);
  return {
    score,
    finding: pct === 0
      ? "No pipelines run Checkov security scans — zero misconfiguration detection."
      : `${pct}% of pipelines run Checkov scans.`,
    recommendation: pct >= 80
      ? "Excellent Checkov coverage. Tune rules for your specific compliance requirements."
      : pct > 0
      ? `Expand Checkov to the ${100 - pct}% of pipelines that don't use it yet. Prioritise production pipelines.`
      : "Add the IaCMCheckov step to all provisioning pipelines. Start with production-impact pipelines.",
  };
}

function scoreCostEstimation(pct: number): { score: number; finding: string; recommendation: string } {
  const score = scaledScore(pct, 15);
  return {
    score,
    finding: pct === 0
      ? "Cost estimation disabled on all workspaces — no pre-apply financial visibility."
      : `${pct}% of workspaces have cost estimation enabled.`,
    recommendation: pct >= 80
      ? "Connect CCM cost data to OPA guardrails to enforce budget policies at plan time."
      : "Enable cost_estimation_enabled on all production and QA workspaces immediately. Connect to Harness CCM.",
  };
}

function scoreOpa(coveragePct: number, activeSets: number): {
  coverageScore: number; setsScore: number;
  coverageFinding: string; setsFinding: string;
  coverageRec: string; setsRec: string;
} {
  const coverageScore = scaledScore(coveragePct, 10);
  const setsScore = activeSets === 0 ? 0 : activeSets <= 2 ? 3 : 5;

  return {
    coverageScore,
    setsScore,
    coverageFinding: coveragePct === 100
      ? "100% pipeline OPA coverage — all pipelines governed."
      : `${coveragePct}% pipeline OPA coverage. ${100 - coveragePct}% of pipelines run without governance.`,
    setsFinding: activeSets === 0
      ? "No active policy sets — policies are authored but not enforced."
      : activeSets <= 2
      ? `${activeSets} active policy set(s) — limited enforcement breadth.`
      : `${activeSets} active policy sets — good policy coverage.`,
    coverageRec: coveragePct < 100
      ? "Create account-level policy sets to cover all pipelines automatically."
      : "Add workspace-scoped policy sets for configuration governance.",
    setsRec: activeSets < 3
      ? "Enable remaining authored-but-disabled policy sets (zero authoring effort)."
      : "Add onRun (pre-execution) policy sets for shift-left enforcement.",
  };
}

function scoreTemplates(adopted: number, total: number): { score: number; finding: string; recommendation: string } {
  if (total === 0) return { score: 0, finding: "No pipelines to evaluate.", recommendation: "Create pipelines first." };
  const pct = Math.round((adopted / total) * 100);
  const score = pct === 0 ? 0 : pct < 50 ? 3 : 5;
  return {
    score,
    finding: pct === 0
      ? "No pipelines use IaCM templates — all pipelines are independently authored."
      : `${pct}% of pipelines use IaCM templates.`,
    recommendation: pct < 100
      ? "Create canonical templates (Provision, Destroy, Drift) and migrate existing pipelines."
      : "All pipelines use templates. Add template versioning and a library governance process.",
  };
}

function scoreMultiProject(activeProjects: number): { score: number; finding: string; recommendation: string } {
  const score = activeProjects <= 1 ? 0 : activeProjects <= 3 ? 3 : 5;
  return {
    score,
    finding: activeProjects <= 1
      ? "IaCM is used in only 1 project — adoption is siloed."
      : activeProjects <= 3
      ? `${activeProjects} active projects — growing adoption across teams.`
      : `${activeProjects} active projects — broad multi-team adoption.`,
    recommendation: activeProjects < 4
      ? "Expand IaCM to more teams and projects using the proven patterns from your primary project."
      : "Drive Centre of Excellence model — create shared templates and runbooks for new projects.",
  };
}

// ── Tier classification ─────────────────────────────────────────────────────

function classifyTier(score: number): { tier: "Crawl" | "Walk" | "Run"; description: string } {
  if (score >= 70) return {
    tier: "Run",
    description: "Your IaCM adoption is mature and operating at scale. You have broad workspace coverage, strong governance, and active use of advanced features like Checkov, cost estimation, and OPA policies. Focus is on optimisation, standardisation, and extending to remaining projects.",
  };
  if (score >= 40) return {
    tier: "Walk",
    description: "You have established IaCM as a working practice with meaningful workspace and pipeline coverage. Core governance (OPA) may be in place but advanced features like Checkov, cost estimation, and templates have significant room to grow.",
  };
  return {
    tier: "Crawl",
    description: "IaCM adoption is in its early stages. The module is enabled but coverage, governance, and advanced features are limited. The priority is to establish foundational patterns — workspaces, pipelines, and basic OPA enforcement — before scaling.",
  };
}

// ── Roadmap ─────────────────────────────────────────────────────────────────

function buildRoadmap(
  tier: "Crawl" | "Walk" | "Run",
  dimensions: DimensionScore[],
): Array<{ phase: string; action: string; impact: number; effort: "Low" | "Medium" | "High" }> {
  // Sort gaps by (maxScore - score) descending — biggest gaps first
  const gaps = [...dimensions].sort((a, b) => (b.maxScore - b.score) - (a.maxScore - a.score));

  const roadmap: Array<{ phase: string; action: string; impact: number; effort: "Low" | "Medium" | "High" }> = [];

  if (tier === "Crawl") {
    roadmap.push(
      { phase: "Month 1", action: "Create workspaces for all environments in your primary project (DEV → QA → PROD)", impact: 20, effort: "Medium" },
      { phase: "Month 1", action: "Build provision and destroy pipelines using IaCM pipeline stages", impact: 15, effort: "Medium" },
      { phase: "Month 1", action: "Enable at least one OPA policy set at the account level", impact: 10, effort: "Low" },
      { phase: "Month 2", action: "Enable cost estimation on all production workspaces", impact: 15, effort: "Low" },
      { phase: "Month 2", action: "Add Checkov step to all provisioning pipelines", impact: 15, effort: "Medium" },
      { phase: "Month 3", action: "Expand IaCM to a second project — apply patterns from primary project", impact: 5, effort: "Low" },
    );
  } else if (tier === "Walk") {
    const topGap = gaps[0];
    const secondGap = gaps[1];
    roadmap.push(
      { phase: "Sprint 1", action: topGap?.recommendation ?? "Close biggest scoring gap", impact: topGap?.maxScore ?? 10, effort: "Medium" },
      { phase: "Sprint 1", action: "Enable all authored-but-disabled OPA policy sets (zero authoring effort)", impact: 8, effort: "Low" },
      { phase: "Sprint 2", action: secondGap?.recommendation ?? "Close second scoring gap", impact: secondGap?.maxScore ?? 8, effort: "Medium" },
      { phase: "Sprint 2", action: "Create canonical IaCM pipeline templates (Provision, Destroy, Drift)", impact: 5, effort: "Medium" },
      { phase: "Sprint 3", action: "Expand IaCM to all dormant projects using templates", impact: 5, effort: "Low" },
      { phase: "Sprint 3", action: "Add onRun (pre-execution) OPA enforcement for shift-left governance", impact: 4, effort: "Low" },
    );
  } else {
    roadmap.push(
      { phase: "Q1", action: "Add workspace-scoped OPA policy sets for configuration governance", impact: 5, effort: "Medium" },
      { phase: "Q1", action: "Implement private module registry for versioned, governed module consumption", impact: 5, effort: "High" },
      { phase: "Q2", action: "Build IaCM template library with versioning and governance process", impact: 5, effort: "Medium" },
      { phase: "Q2", action: "Establish IaCM Centre of Excellence — runbooks, onboarding guides, shared templates", impact: 8, effort: "High" },
      { phase: "Q3", action: "Connect IaCM cost estimation to Harness CCM for cross-workspace FinOps dashboards", impact: 6, effort: "Medium" },
      { phase: "Q3", action: "Implement automated drift detection scheduled pipelines for all production workspaces", impact: 5, effort: "Medium" },
    );
  }

  return roadmap;
}

// ── Tool registration ────────────────────────────────────────────────────────

export function registerMaturityTool(server: McpServer, client: HarnessClient): void {
  server.registerTool(
    "harness_iacm_maturity_assessment",
    {
      description:
        "Run a comprehensive IaCM maturity assessment across the entire account. " +
        "Scores 9 dimensions (0–100 points) and classifies the account as Crawl, Walk, or Run. " +
        "Returns per-dimension scores with findings and recommendations, a gap analysis, " +
        "a strengths summary, and a phased roadmap to the next maturity tier. " +
        "Designed for BVR — gives customers a clear picture of where they are and how to advance.",
      inputSchema: z.object({
        org_id: z
          .string()
          .describe("Limit assessment to a specific org (optional).")
          .optional(),
        project_id: z
          .string()
          .describe("Limit assessment to a specific project (optional).")
          .optional(),
      }),
      annotations: {
        title: "IaCM Maturity Assessment (Crawl / Walk / Run)",
        readOnlyHint: true,
        openWorldHint: true,
      },
    },
    async (args, { signal }) => {
      try {
        log.info("Starting IaCM maturity assessment");

        // ── Step 1: Discover all IACM projects ──────────────────────────
        let projects: Array<{ identifier: string; name: string; orgIdentifier?: string }> = [];
        {
          let page = 0;
          while (true) {
            const raw = await client.request<{
              data?: { content?: Array<{ project?: { identifier: string; name: string; orgIdentifier?: string } }>; totalPages?: number };
            }>({
              path: "/ng/api/projects",
              params: { accountIdentifier: client.account, hasModule: "IACM", pageIndex: page, pageSize: 200 },
              signal,
            });
            const content = raw.data?.content ?? [];
            const items = content.map((c) => c.project).filter((p): p is { identifier: string; name: string; orgIdentifier?: string } => !!p);
            projects.push(...items);
            if (page + 1 >= (raw.data?.totalPages ?? 1) || items.length === 0) break;
            page++;
          }
        }

        if (args.org_id) projects = projects.filter((p) => p.orgIdentifier === args.org_id);
        if (args.project_id) projects = projects.filter((p) => p.identifier === args.project_id);

        if (projects.length === 0) {
          return errorResult("No IaCM-enabled projects found.");
        }

        // ── Step 2: Collect metrics in parallel ──────────────────────────
        let totalWorkspaces = 0;
        const allPipelineNames: string[] = [];
        let checkovAdopted = 0;
        let costEstAdopted = 0;
        let totalWorkspacesForCost = 0;
        let activeProjects = 0;

        await Promise.all(projects.map(async (proj) => {
          const org = proj.orgIdentifier ?? "default";

          // Workspaces
          try {
            const wsRaw = await client.request<unknown>({
              path: `/iacm/api/orgs/${encodeURIComponent(org)}/projects/${encodeURIComponent(proj.identifier)}/workspaces`,
              params: { accountIdentifier: client.account, routingId: client.account, page: 1, pageSize: 200 },
              signal,
            });
            const workspaces: Array<Record<string, unknown>> = Array.isArray(wsRaw) ? wsRaw : [];
            if (workspaces.length > 0) activeProjects++;
            totalWorkspaces += workspaces.length;
            totalWorkspacesForCost += workspaces.length;
            costEstAdopted += workspaces.filter((w) => w.cost_estimation_enabled === true).length;
          } catch { /* skip */ }

          // Pipelines
          try {
            const plRaw = await client.request<{
              data?: { content?: Array<{ identifier?: string; name?: string }>; totalPages?: number };
            }>({
              method: "POST",
              path: "/pipeline/api/pipelines/list",
              params: { accountIdentifier: client.account, orgIdentifier: org, projectIdentifier: proj.identifier, module: "iacm", size: 200, page: 0 },
              body: { filterType: "PipelineSetup" },
              signal,
            });
            const pipelines = plRaw.data?.content ?? [];
            if (pipelines.length > 0 && activeProjects === 0) activeProjects++;

            for (const p of pipelines) {
              if (!p.name) continue;
              allPipelineNames.push(p.name);

              // Fetch YAML to detect Checkov
              try {
                const yamlRaw = await client.request<{ data?: { yaml?: string; yamlPipeline?: string } }>({
                  path: `/pipeline/api/pipelines/${encodeURIComponent(p.identifier ?? "")}`,
                  params: { accountIdentifier: client.account, orgIdentifier: org, projectIdentifier: proj.identifier },
                  signal,
                });
                const yaml = yamlRaw.data?.yaml ?? yamlRaw.data?.yamlPipeline ?? "";
                if (yaml.toLowerCase().includes("checkov") || yaml.toLowerCase().includes("iacmcheckov")) {
                  checkovAdopted++;
                }
              } catch { /* skip */ }
            }
          } catch { /* skip */ }
        }));

        // OPA
        let opaCoveragePercent = 0;
        let activeOpaSets = 0;
        let iacmTemplatesAdopted = 0;
        try {
          const policySets = await client.request<Array<{ enabled?: boolean; entityType?: string }>>({
            path: "/pm/api/v1/policysets",
            params: { accountIdentifier: client.account, per_page: 100, page: 0 },
            signal,
          });
          if (Array.isArray(policySets)) {
            activeOpaSets = policySets.filter((ps) => ps.enabled).length;
            // If any account-level policy set is enabled, all pipelines are covered
            const hasAccountLevel = policySets.some((ps) => ps.enabled);
            opaCoveragePercent = hasAccountLevel && allPipelineNames.length > 0 ? 100 : 0;
          }
        } catch { /* skip */ }

        const input: ScanInput = {
          totalWorkspaces,
          totalPipelines: allPipelineNames.length,
          pipelineNames: allPipelineNames,
          checkovAdoptionPct: allPipelineNames.length > 0 ? Math.round((checkovAdopted / allPipelineNames.length) * 100) : 0,
          costEstimationPct: totalWorkspacesForCost > 0 ? Math.round((costEstAdopted / totalWorkspacesForCost) * 100) : 0,
          opaCoveragePct: opaCoveragePercent,
          activeOpaSets,
          iacmTemplatesAdopted,
          activeProjects,
        };

        // ── Step 3: Score each dimension ──────────────────────────────────
        const wsScore   = scoreWorkspaces(input.totalWorkspaces);
        const plScore   = scorePipelines(input.totalPipelines);
        const divScore  = scorePipelineDiversity(input.pipelineNames);
        const chkScore  = scoreCheckov(input.checkovAdoptionPct);
        const costScore = scoreCostEstimation(input.costEstimationPct);
        const opaScores = scoreOpa(input.opaCoveragePct, input.activeOpaSets);
        const tplScore  = scoreTemplates(input.iacmTemplatesAdopted, input.totalPipelines);
        const projScore = scoreMultiProject(input.activeProjects);

        const dimensions: DimensionScore[] = [
          { dimension: "Workspace Adoption",      score: wsScore.score,            maxScore: 20, pct: Math.round((wsScore.score / 20) * 100),            finding: wsScore.finding,           recommendation: wsScore.recommendation },
          { dimension: "Pipeline Adoption",        score: plScore.score,            maxScore: 15, pct: Math.round((plScore.score / 15) * 100),            finding: plScore.finding,           recommendation: plScore.recommendation },
          { dimension: "Pipeline Diversity",       score: divScore.score,           maxScore: 10, pct: Math.round((divScore.score / 10) * 100),           finding: divScore.finding,          recommendation: divScore.recommendation },
          { dimension: "Checkov Security Scans",   score: chkScore.score,           maxScore: 15, pct: Math.round((chkScore.score / 15) * 100),           finding: chkScore.finding,          recommendation: chkScore.recommendation },
          { dimension: "Cost Estimation",          score: costScore.score,          maxScore: 15, pct: Math.round((costScore.score / 15) * 100),          finding: costScore.finding,         recommendation: costScore.recommendation },
          { dimension: "OPA Pipeline Coverage",    score: opaScores.coverageScore,  maxScore: 10, pct: Math.round((opaScores.coverageScore / 10) * 100),  finding: opaScores.coverageFinding, recommendation: opaScores.coverageRec },
          { dimension: "OPA Policy Sets",          score: opaScores.setsScore,      maxScore: 5,  pct: Math.round((opaScores.setsScore / 5) * 100),       finding: opaScores.setsFinding,     recommendation: opaScores.setsRec },
          { dimension: "IaCM Templates",           score: tplScore.score,           maxScore: 5,  pct: Math.round((tplScore.score / 5) * 100),            finding: tplScore.finding,          recommendation: tplScore.recommendation },
          { dimension: "Multi-Project Adoption",   score: projScore.score,          maxScore: 5,  pct: Math.round((projScore.score / 5) * 100),           finding: projScore.finding,         recommendation: projScore.recommendation },
        ];

        const totalScore = dimensions.reduce((s, d) => s + d.score, 0);
        const { tier, description } = classifyTier(totalScore);

        // ── Step 4: Strengths and gaps ─────────────────────────────────────
        const sorted = [...dimensions].sort((a, b) => b.pct - a.pct);
        const topStrengths = sorted
          .filter((d) => d.pct >= 60)
          .slice(0, 3)
          .map((d) => `${d.dimension} (${d.score}/${d.maxScore})`);
        const topGaps = sorted
          .reverse()
          .filter((d) => d.pct < 60)
          .slice(0, 3)
          .map((d) => `${d.dimension} — ${d.recommendation}`);

        // Next tier info
        const nextTier = tier === "Crawl" ? "Walk" : tier === "Walk" ? "Run" : undefined;
        const nextThreshold = tier === "Crawl" ? 40 : tier === "Walk" ? 70 : 100;
        const pointsToNextTier = nextTier ? Math.max(0, nextThreshold - totalScore) : 0;

        const roadmap = buildRoadmap(tier, dimensions);

        const result: MaturityResult = {
          tier,
          totalScore,
          maxScore: 100,
          pct: totalScore,
          tierDescription: description,
          nextTier,
          pointsToNextTier,
          dimensions,
          topGaps,
          topStrengths,
          roadmap,
        };

        // ── Step 5: BVR framing ────────────────────────────────────────────
        const bvr = {
          headline: `This account is in the **${tier}** tier with a maturity score of ${totalScore}/100.`,
          maturityBadge: tier,
          score: totalScore,
          ...(nextTier ? { pathToNextTier: `${pointsToNextTier} more points needed to reach ${nextTier} tier.` } : { pathToNextTier: "Maximum tier achieved — focus on sustaining and optimising." }),
          inputMetrics: {
            totalProjects: projects.length,
            activeProjects: input.activeProjects,
            totalWorkspaces: input.totalWorkspaces,
            totalPipelines: input.totalPipelines,
            checkovAdoptionPct: input.checkovAdoptionPct,
            costEstimationPct: input.costEstimationPct,
            opaCoveragePct: input.opaCoveragePct,
            activeOpaSets: input.activeOpaSets,
          },
        };

        return jsonResult({ assessment: result, bvr, scannedAt: new Date().toISOString() });
      } catch (err) {
        throw toMcpError(err);
      }
    },
  );
}
