/**
 * Full IaCM account scan with correct workspace pagination → bvr-data.json
 * Usage: HARNESS_ACCOUNT_ID=... HARNESS_BASE_URL=... HARNESS_HEADER_COOKIE=... node scripts/generate-bvr-data.mjs
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadGlobalConfig, buildSessionConfig } from "../build/config.js";
import { HarnessClient } from "../build/client/harness-client.js";
import { countWorkspacesInProject } from "../build/utils/iacm-workspace-pagination.js";

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

async function countPipelines(client, org, project) {
  try {
    const raw = await client.request({
      method: "POST",
      path: "/pipeline/api/pipelines/list",
      params: {
        accountIdentifier: client.account,
        orgIdentifier: org,
        projectIdentifier: project,
        module: "iacm",
        size: 1,
        page: 0,
      },
      body: { filterType: "PipelineSetup" },
    });
    const data = raw.data ?? raw;
    return (data.totalElements ?? 0);
  } catch {
    return -1;
  }
}

const config = buildSessionConfig(loadGlobalConfig(), {});
const client = new HarnessClient(config);
const projects = await fetchAllIacmProjects(client);
console.error(`Scanning ${projects.length} IACM projects...`);

const byOrg = {};
let totalWs = 0;
let totalPl = 0;
let i = 0;

for (const p of projects) {
  const org = p.orgIdentifier ?? "default";
  const proj = p.identifier;
  const ws = await countWorkspacesInProject(client, org, proj);
  const pl = await countPipelines(client, org, proj);

  if (!byOrg[org]) byOrg[org] = { org, projects: [], workspaceCount: 0, pipelineCount: 0 };
  const entry = { identifier: proj, name: p.name, workspaces: ws, pipelines: pl };
  byOrg[org].projects.push(entry);
  if (ws > 0) byOrg[org].workspaceCount += ws;
  if (pl > 0) byOrg[org].pipelineCount += pl;
  if (ws > 0) totalWs += ws;
  if (pl > 0) totalPl += pl;

  i++;
  if (i % 10 === 0) {
    console.error(`  ${i}/${projects.length} — workspaces so far: ${totalWs.toLocaleString()}`);
  }
}

const orgs = Object.values(byOrg).sort((a, b) => b.workspaceCount - a.workspaceCount);
const activeProjects = projects.filter((_, idx) => {
  const org = projects[idx].orgIdentifier ?? "default";
  const o = byOrg[org];
  const e = o?.projects.find((x) => x.identifier === projects[idx].identifier);
  return e && (e.workspaces > 0 || e.pipelines > 0);
}).length;

const out = {
  scannedAt: new Date().toISOString(),
  account: client.account,
  summary: {
    totalProjects: projects.length,
    orgCount: orgs.length,
    totalWorkspaces: totalWs,
    totalPipelines: totalPl,
    activeProjects,
  },
  orgs,
};

const outPath = resolve("reports/account-bvr-2026-05-19/bvr-data.json");
writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out.summary, null, 2));
console.error(`Written ${outPath}`);
