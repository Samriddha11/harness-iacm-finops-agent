/**
 * Aggregate workspace provisioner/version sprawl and status distribution.
 * Usage: node scripts/workspace-sprawl.mjs [output-json-path]
 * Auth via .env or harness-iacm entry in ~/.cursor/mcp.json when env vars are unset.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { loadGlobalConfig, buildSessionConfig } from "../build/config.js";
import { HarnessClient } from "../build/client/harness-client.js";
import { listAllWorkspacesInProject } from "../build/utils/iacm-workspace-pagination.js";
import {
  classifyModuleRegistry,
  scoreModuleRegistryMaturity,
} from "../build/utils/workspace-module-registry.js";
import { scoreVersionSprawlMaturity } from "../build/utils/workspace-version-sprawl.js";

function loadMcpEnv() {
  try {
    const raw = readFileSync(`${homedir()}/.cursor/mcp.json`, "utf8");
    const cfg = JSON.parse(raw).mcpServers?.["harness-iacm"]?.env;
    if (!cfg) return;
    for (const [k, v] of Object.entries(cfg)) {
      if (v && !process.env[k]) process.env[k] = String(v);
    }
  } catch {
    // optional fallback
  }
}

async function fetchAllIacmProjects(client) {
  const all = [];
  let page = 0;
  while (true) {
    const raw = await client.request({
      path: "/ng/api/projects",
      params: {
        accountIdentifier: client.account,
        hasModule: "IACM",
        pageIndex: page,
        pageSize: 200,
      },
    });
    const content = raw.data?.content ?? [];
    const projects = content.map((c) => c.project).filter(Boolean);
    all.push(...projects);
    const totalPages = raw.data?.totalPages ?? 1;
    if (page + 1 >= totalPages || projects.length === 0) break;
    page++;
  }
  return all;
}

function normProvisioner(p) {
  const s = String(p ?? "terraform").toLowerCase().trim();
  if (s.includes("tofu") || s === "opentofu") return "opentofu";
  if (s.includes("terragrunt")) return "terragrunt";
  if (s.includes("terraform") || s === "tf") return "terraform";
  return s || "unknown";
}

function normVersion(v) {
  const s = String(v ?? "").trim();
  return s || "(unset)";
}

/** Major.minor label for semver pins; pass through "latest" and legacy pins as-is. */
function versionLabel(provisioner, version) {
  const v = normVersion(version);
  if (/^latest$/i.test(v)) return `${provisioner} · latest (floating)`;
  const semver = v.match(/^(\d+)\.(\d+)/);
  if (semver) return `${provisioner} ${semver[1]}.${semver[2]}.x`;
  return `${provisioner} ${v}`;
}

async function fetchWorkspaceDetail(client, org, project, workspaceId) {
  const raw = await client.request({
    path: `/iacm/api/orgs/${encodeURIComponent(org)}/projects/${encodeURIComponent(project)}/workspaces/${encodeURIComponent(workspaceId)}`,
    params: { accountIdentifier: client.account, routingId: client.account },
  });
  if (!raw || typeof raw !== "object") return null;
  const r = raw;
  if (r.workspace && typeof r.workspace === "object") return r.workspace;
  if (r.data && typeof r.data === "object") {
    const d = r.data;
    if (d.workspace && typeof d.workspace === "object") return d.workspace;
    return d;
  }
  return r;
}

function normStatus(s) {
  const v = String(s ?? "unknown").toLowerCase().trim();
  return v || "unknown";
}

function bump(map, key, n = 1) {
  map.set(key, (map.get(key) ?? 0) + n);
}

function toSortedRecords(map) {
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

loadMcpEnv();

const outArg = process.argv[2];
const outPath = outArg
  ? resolve(outArg)
  : resolve("reports/autodesk-bvr-2026-05-19/workspace-inventory.json");

const config = buildSessionConfig(loadGlobalConfig(), {});
const client = new HarnessClient(config);
const projects = await fetchAllIacmProjects(client);

const useDetail = !process.argv.includes("--list-only");
const concurrency = Number(process.env.SPRAWL_CONCURRENCY ?? 12);

const byProvisioner = new Map();
const byProvisionerVersion = new Map();
const byVersionLabel = new Map();
const byStatus = new Map();
const moduleRegistry = {
  harness_private: 0,
  other_private: 0,
  public_only: 0,
  none: 0,
  total: 0,
};
let total = 0;
let i = 0;

/** @type {Array<{ org: string; project: string; id: string; list: Record<string, unknown> }>} */
const queue = [];

function recordWorkspace(ws) {
  const provisioner = normProvisioner(ws.provisioner);
  const version = normVersion(ws.provisioner_version);
  const status = normStatus(ws.status);
  bump(byProvisioner, provisioner);
  bump(byProvisionerVersion, `${provisioner} @ ${version}`);
  bump(byVersionLabel, versionLabel(provisioner, version));
  bump(byStatus, status);
  const regKind = classifyModuleRegistry(ws);
  moduleRegistry[regKind]++;
  moduleRegistry.total++;
  total++;
}

for (const p of projects) {
  const org = p.orgIdentifier ?? "default";
  const proj = p.identifier;
  const workspaces = await listAllWorkspacesInProject(client, org, proj);

  for (const raw of workspaces) {
    const ws = raw;
    if (!ws || typeof ws !== "object") continue;
    const id = String(ws.identifier ?? "");
    if (!id) continue;
    queue.push({ org, project: proj, id, list: ws });
  }

  i++;
  if (i % 10 === 0) {
    console.error(`  listed ${i}/${projects.length} projects — ${queue.length} workspaces queued`);
  }
}

console.error(
  useDetail
    ? `Fetching configured version per workspace (GET, concurrency=${concurrency})…`
    : "Using list API only (--list-only) — versions may show as 'latest'.",
);

if (!useDetail) {
  for (const item of queue) recordWorkspace(item.list);
} else {
  for (let j = 0; j < queue.length; j += concurrency) {
    const batch = queue.slice(j, j + concurrency);
    await Promise.all(
      batch.map(async (item) => {
        let ws = item.list;
        try {
          const detail = await fetchWorkspaceDetail(client, item.org, item.project, item.id);
          if (detail) ws = detail;
        } catch {
          // keep list payload
        }
        recordWorkspace(ws);
      }),
    );
    if ((j + concurrency) % 120 === 0 || j + concurrency >= queue.length) {
      console.error(`  detailed ${Math.min(j + concurrency, queue.length)}/${queue.length} workspaces`);
    }
  }
}

const pct = (n) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);

const versionLabelsSorted = toSortedRecords(byVersionLabel).map(({ key, count }) => ({
  label: key,
  count,
  pct: pct(count),
}));
const distinctExact = toSortedRecords(byProvisionerVersion).length;
const dominantLinePct =
  total > 0 && versionLabelsSorted.length > 0
    ? Math.round((versionLabelsSorted[0].count / total) * 100)
    : 0;

const versionSprawl = scoreVersionSprawlMaturity({
  distinctExactVersions: distinctExact,
  distinctMajorMinorLines: versionLabelsSorted.length,
  dominantLinePct,
  totalWorkspaces: total,
});
const registryMaturity = scoreModuleRegistryMaturity(moduleRegistry);

const out = {
  scannedAt: new Date().toISOString(),
  account: client.account,
  totalWorkspaces: total,
  provisioners: toSortedRecords(byProvisioner).map(({ key, count }) => ({
    provisioner: key,
    count,
    pct: pct(count),
  })),
  provisionerVersions: toSortedRecords(byProvisionerVersion).map(({ key, count }) => {
    const [provisioner, version] = key.split(" @ ");
    return { provisioner, version, count, pct: pct(count) };
  }),
  versionLabels: versionLabelsSorted,
  versionSource: useDetail ? "workspace_get" : "workspace_list",
  versionSprawl: {
    distinctExactVersions: distinctExact,
    distinctMajorMinorLines: versionLabelsSorted.length,
    dominantLinePct,
    maturityScore: versionSprawl.score,
    maxScore: 10,
    finding: versionSprawl.finding,
    recommendation: versionSprawl.recommendation,
  },
  moduleRegistry: {
    harness_private: moduleRegistry.harness_private,
    other_private: moduleRegistry.other_private,
    public_only: moduleRegistry.public_only,
    none: moduleRegistry.none,
    total: moduleRegistry.total,
    harness_private_pct: pct(moduleRegistry.harness_private),
    other_private_pct: pct(moduleRegistry.other_private),
    public_only_pct: pct(moduleRegistry.public_only),
    none_pct: pct(moduleRegistry.none),
    maturityScore: registryMaturity.score,
    maxScore: 10,
    finding: registryMaturity.finding,
    recommendation: registryMaturity.recommendation,
  },
  statuses: toSortedRecords(byStatus).map(({ key, count }) => ({
    status: key,
    count,
    pct: pct(count),
  })),
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(JSON.stringify({ total, provisioners: out.provisioners.length, versions: out.provisionerVersions.length, statuses: out.statuses.length }, null, 2));
console.error(`Written ${outPath}`);
